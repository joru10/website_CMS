"""Pipeline assembly for News Digest."""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import structlog

from ..agents.processing.planner import DigestPlanner
from ..agents.quality import FactCheckAgent, LinkHealthChecker
from ..agents.writer.digest import DigestWriter
from ..config import ACEConfig, TrackConfig
from ..models import (
    DigestEdition,
    GitCommitFile,
    GitCommitPayload,
    MarkdownArtifact,
    NewsCandidate,
    PipelineResult,
    QualityReport,
)
from ..storage import get_engine, get_sessionmaker
from ..utils.llm import LLMClient
from textstat import textstat

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class PipelineContext:
    config: ACEConfig
    track_config: TrackConfig
    sessionmaker: any
    planner: DigestPlanner
    writer: DigestWriter
    publish_dir: Path
    link_checker: LinkHealthChecker
    fact_checker: FactCheckAgent


def build_pipeline(config: ACEConfig) -> PipelineContext:
    track_cfg = config.tracks.get("news")
    if not track_cfg:
        raise ValueError("News track configuration missing")

    engine = get_engine(config.storage.sqlite_path)
    SessionLocal = get_sessionmaker(engine)

    planner = DigestPlanner(items_max=track_cfg.items_max or 8, require_corroboration=track_cfg.require_corroboration)
    llm_client = LLMClient.from_config(config.app.llm)
    writer = DigestWriter(locales=config.app.locale_defaults, llm=llm_client)
    publish_dir = Path(config.publishing.paths.news)
    link_checker = LinkHealthChecker()
    fact_checker = FactCheckAgent(min_unique_domains=track_cfg.require_corroboration or 2)

    return PipelineContext(
        config=config,
        track_config=track_cfg,
        sessionmaker=SessionLocal,
        planner=planner,
        writer=writer,
        publish_dir=publish_dir,
        link_checker=link_checker,
        fact_checker=fact_checker,
    )


def assemble_digest_edition(
    planner: DigestPlanner,
    candidates: List[NewsCandidate],
    track_slug: str,
) -> DigestEdition:
    items = planner.plan(candidates)

    title = f"RapidAI Weekly Digest"
    slug = f"weekly-{datetime.now().strftime('%Y%m%d')}"

    edition = DigestEdition(
        title=title,
        slug=slug,
        track="news",
        generated_at=datetime.now(timezone.utc),
        locale_outputs={},
        items=items,
        metadata={
            "track_slug": track_slug,
            "total_candidates": len(candidates),
            "selected_count": len(items),
            "manual_selected": [item.candidate_id for item in items if item.candidate_id.startswith("manual:")],
            "skipped_count": max(0, len(candidates) - len(items)),
        },
    )
    return edition

def render_markdown(
    writer: DigestWriter,
    edition: DigestEdition,
    publish_dir: Path,
    link_checker: LinkHealthChecker,
    fact_checker: FactCheckAgent,
    track_config: TrackConfig,
    config: ACEConfig,
) -> PipelineResult:
    locale_outputs = writer.render(edition)
    artifacts = [
        MarkdownArtifact(
            path=str((publish_dir / edition.slug / f"index.{locale}.md")),
            content=content.strip() + "\n",
            locale=locale,
        )
        for locale, content in locale_outputs.items()
    ]

    manifest_rel_path = publish_dir / "manifest.json"
    manifest_abs_path = Path.cwd() / manifest_rel_path
    existing_slugs = _load_manifest_slugs(manifest_abs_path)
    manifest_slugs = [edition.slug, *[slug for slug in existing_slugs if slug != edition.slug]]
    manifest_content = json.dumps({"slugs": manifest_slugs}, indent=2) + "\n"

    rss_content = _build_rss_feed(
        manifest_slugs=manifest_slugs,
        publish_dir=publish_dir,
        edition=edition,
        config=config,
        english_output=locale_outputs.get("en", ""),
    )

    issues: List[str] = []
    try:
        readability = textstat.flesch_reading_ease(locale_outputs.get("en", ""))
    except Exception:  # pragma: no cover - textstat robustness
        readability = 0.0

    readability_min = track_config.readability_min or 0.0
    if readability_min and readability < readability_min:
        issues.append(
            f"Readability score {readability:.1f} is below threshold {readability_min:.1f}"
        )

    min_links = max(1, track_config.min_links_per_item)
    for item in edition.items:
        link_count = len([link for link in item.links if link.url])
        if link_count < min_links:
            issues.append(f"Item {item.candidate_id} has only {link_count} links (min {min_links})")

    all_links = [link.url for item in edition.items for link in item.links if link.url]
    link_report = link_checker.check_links(all_links)
    if not link_report.ok:
        issues.append(f"Broken links detected: {', '.join(link_report.broken_links)}")
    fact_result = fact_checker.evaluate(edition)
    issues.extend(fact_result.issues)

    link_health_passed = link_report.ok

    quality = QualityReport(
        readability=readability,
        link_health_passed=link_health_passed,
        duplicate_flag=False,
        translation_ready=len(locale_outputs) == len(writer.locales),
        details={
            "publish_dir": str(publish_dir),
            "readability_min": readability_min,
            "link_status_map": link_report.status_map,
            "fact_check_domains": fact_result.unique_domains,
        },
        issues=issues,
    )

    branch_suffix = edition.slug
    branch_name = f"{config.publishing.branch_prefix}/{branch_suffix}".replace("//", "/")
    commit_message = config.publishing.pr_title_template.format(
        date=edition.generated_at.strftime("%Y-%m-%d")
    )
    git_files = [GitCommitFile(path=artifact.path, content=artifact.content) for artifact in artifacts]
    git_files.append(GitCommitFile(path=str(manifest_rel_path), content=manifest_content))
    git_files.append(
        GitCommitFile(path=str(publish_dir / "rss.xml"), content=rss_content)
    )
    git_payload = GitCommitPayload(
        branch_name=branch_name,
        commit_message=commit_message,
        files=git_files,
        metadata={
            "reviewers": config.publishing.reviewers,
            "track": edition.track,
            "slug": edition.slug,
        },
    )

    return PipelineResult(
        artifacts=artifacts,
        quality=quality,
        edition=edition,
        metadata={
            "artifact_count": len(artifacts),
            "publish_dir": str(publish_dir),
            "readability": readability,
            "broken_links": link_report.broken_links,
            "manifest_path": str(publish_dir / "manifest.json"),
            "manifest_slugs": manifest_slugs,
            "rss_path": str(publish_dir / "rss.xml"),
            "slug": edition.slug,
        },
        git_payload=git_payload,
    )


def _load_manifest_slugs(manifest_path: Path) -> List[str]:
    if not manifest_path.exists():
        return []
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.warning("manifest_load_failed", path=str(manifest_path), error=str(exc))
        return []
    slugs = data.get("slugs", [])
    return [str(slug) for slug in slugs if isinstance(slug, str)]


def _build_rss_feed(
    manifest_slugs: List[str],
    publish_dir: Path,
    edition: DigestEdition,
    config: ACEConfig,
    english_output: str,
    max_items: int = 20,
) -> str:
    base_url = config.publishing.public_base_url or "https://example.com/news"
    rss_abs_path = Path.cwd() / publish_dir / "rss.xml"

    if rss_abs_path.exists():
        try:
            tree = ET.parse(rss_abs_path)
            root = tree.getroot()
        except ET.ParseError:
            root = ET.Element("rss", version="2.0")
    else:
        root = ET.Element("rss", version="2.0")

    channel = root.find("channel")
    if channel is None:
        channel = ET.SubElement(root, "channel")

    _ensure_text(channel, "title", "RapidAI News Digest")
    _ensure_text(channel, "link", base_url.rstrip("/"))
    _ensure_text(channel, "description", "Automated ACE-generated AI news digest")
    _ensure_text(channel, "language", config.app.locale_defaults[0] if config.app.locale_defaults else "en")

    build_time = edition.generated_at.astimezone(timezone.utc)
    _ensure_text(channel, "lastBuildDate", build_time.strftime("%a, %d %b %Y %H:%M:%S %z"))

    slug = edition.slug
    for item in list(channel.findall("item")):
        guid_el = item.find("guid")
        if guid_el is not None and guid_el.text == slug:
            channel.remove(item)

    description_text = _summarize_items(edition)
    if not description_text:
        description_text = english_output.strip() or f"Digest edition {slug}"

    item_el = ET.Element("item")
    ET.SubElement(item_el, "title").text = edition.title
    ET.SubElement(item_el, "link").text = f"{base_url.rstrip('/')}/{slug}"
    guid_el = ET.SubElement(item_el, "guid")
    guid_el.text = slug
    guid_el.set("isPermaLink", "false")
    ET.SubElement(item_el, "pubDate").text = build_time.strftime("%a, %d %b %Y %H:%M:%S %z")
    ET.SubElement(item_el, "description").text = description_text

    channel.insert(0, item_el)

    items = channel.findall("item")
    for extra_item in items[max_items:]:
        channel.remove(extra_item)

    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")


def _ensure_text(parent: ET.Element, tag: str, value: str) -> None:
    element = parent.find(tag)
    if element is None:
        element = ET.SubElement(parent, tag)
    element.text = value


def _summarize_items(edition: DigestEdition) -> str:
    parts = [
        f"{item.headline}: {item.why_it_matters}"
        for item in edition.items
        if item.headline and item.why_it_matters
    ]
    return " \n".join(parts)
