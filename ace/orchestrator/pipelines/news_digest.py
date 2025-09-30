"""Pipeline assembly for News Digest."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List

import structlog

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
from ..agents.processing.planner import DigestPlanner
from ..agents.writer.digest import DigestWriter
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

    return PipelineContext(
        config=config,
        track_config=track_cfg,
        sessionmaker=SessionLocal,
        planner=planner,
        writer=writer,
        publish_dir=publish_dir,
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
        generated_at=datetime.utcnow(),
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
    track_config: "TrackConfig",
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

    link_health_passed = not issues or all("links" not in issue for issue in issues)

    quality = QualityReport(
        readability=readability,
        link_health_passed=link_health_passed,
        duplicate_flag=False,
        translation_ready=len(locale_outputs) == len(writer.locales),
        details={
            "publish_dir": str(publish_dir),
            "readability_min": readability_min,
        },
        issues=issues,
    )

    branch_suffix = edition.slug
    branch_name = f"{config.publishing.branch_prefix}/{branch_suffix}".replace("//", "/")
    commit_message = config.publishing.pr_title_template.format(
        date=edition.generated_at.strftime("%Y-%m-%d")
    )
    git_files = [GitCommitFile(path=artifact.path, content=artifact.content) for artifact in artifacts]
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
        },
        git_payload=git_payload,
    )
