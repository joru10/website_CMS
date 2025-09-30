"""Pipeline assembly for News Digest."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List

import structlog

from ..config import ACEConfig
from ..models import DigestEdition, MarkdownArtifact, NewsCandidate, PipelineResult, QualityReport
from ..storage import get_engine, get_sessionmaker
from ..agents.processing.planner import DigestPlanner
from ..agents.writer.digest import DigestWriter
from textstat import textstat

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class PipelineContext:
    config: ACEConfig
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
    writer = DigestWriter(locales=config.app.locale_defaults)
    publish_dir = Path(config.publishing.paths.news)

    return PipelineContext(
        config=config,
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


def render_markdown(writer: DigestWriter, edition: DigestEdition, publish_dir: Path) -> PipelineResult:
    locale_outputs = writer.render(edition)
    artifacts = [
        MarkdownArtifact(
            path=str((publish_dir / edition.slug / f"index.{locale}.md")),
            content=content.strip() + "\n",
            locale=locale,
        )
        for locale, content in locale_outputs.items()
    ]

    try:
        readability = textstat.flesch_reading_ease(locale_outputs.get("en", ""))
    except Exception:  # pragma: no cover - textstat robustness
        readability = 0.0

    quality = QualityReport(
        readability=readability,
        link_health_passed=True,
        duplicate_flag=False,
        translation_ready=False,
        details={"note": "Quality metrics pending implementation"},
    )

    return PipelineResult(
        artifacts=artifacts,
        quality=quality,
        edition=edition,
        metadata={
            "artifact_count": len(artifacts),
            "publish_dir": str(publish_dir),
        },
    )
