"""News Digest job orchestration."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import List, Optional

import structlog

from ..config import ACEConfig
from ..models import NewsCandidate, PipelineResult
from ..storage import get_engine, get_sessionmaker, init_db
from ..agents.ingestion.manual import ManualInsertAgent
from ..agents.ingestion.rss import RSSIngestionAgent
from ..agents.ingestion.smol import SmolNewsIngestionAgent
from ..agents.processing.relevance import NewsCandidateScorer, dedupe_candidates
from ..pipelines.news_digest import build_pipeline, assemble_digest_edition, render_markdown
from ..publishing.git import GitPublishingService, GitPublishingError, GitPublishingResult

logger = structlog.get_logger(__name__)


async def _gather_smol_candidates(agent: SmolNewsIngestionAgent) -> List[NewsCandidate]:
    return await agent.fetch_async()


def run_news_digest_job(config: ACEConfig) -> None:
    track_cfg = config.tracks.get("news")
    if not track_cfg:
        raise ValueError("News track configuration is missing")

    logger.info("news_digest_start")

    # Initialize storage and session for manual inserts / audit
    engine = get_engine(config.storage.sqlite_path)
    init_db(engine)
    SessionLocal = get_sessionmaker(engine)

    manual_candidates: List[NewsCandidate] = []
    with SessionLocal() as session:
        manual_agent = ManualInsertAgent(session)
        manual_candidates = manual_agent.fetch_pending()

    rss_agent = RSSIngestionAgent()
    rss_candidates = rss_agent.fetch(track_cfg.source.rss_allowlist if track_cfg.source else [])

    smol_base_url = track_cfg.source.primary_url if track_cfg.source and track_cfg.source.primary_url else "https://news.smol.ai"
    smol_agent = SmolNewsIngestionAgent(smol_base_url)
    smol_candidates = asyncio.run(_gather_smol_candidates(smol_agent))

    combined = manual_candidates + rss_candidates + smol_candidates
    if not combined:
        logger.warning("news_digest_no_candidates")
        return

    deduped = dedupe_candidates(combined)
    scorer = NewsCandidateScorer()
    scored = scorer.score(deduped)

    items_max = track_cfg.items_max or 8
    items_min = track_cfg.items_min or 4
    top_candidates = scored[:items_max]

    if len(top_candidates) < items_min:
        logger.warning(
            "news_digest_below_min_items",
            available=len(top_candidates),
            required=items_min,
        )

    logger.info(
        "news_digest_candidates_selected",
        total=len(top_candidates),
        manual=len(manual_candidates),
        rss=len(rss_candidates),
        smol=len(smol_candidates),
    )

    pipeline = build_pipeline(config)
    edition = assemble_digest_edition(pipeline.planner, top_candidates, track_slug="news")
    result = render_markdown(
        pipeline.writer,
        edition,
        pipeline.publish_dir,
        pipeline.link_checker,
        pipeline.fact_checker,
        pipeline.track_config,
        config,
    )

    if result.quality.issues:
        logger.warning(
            "news_digest_quality_blocked",
            issues=result.quality.issues,
            readability=result.quality.readability,
        )
        return

    manual_selected_ids = [item.candidate_id for item in edition.items if item.candidate_id.startswith("manual:")]
    if manual_selected_ids:
        with SessionLocal() as session:
            ManualInsertAgent(session).mark_selected(manual_selected_ids, status="accepted")

    publish_result = _publish_git_payload(result, config)

    logger.info(
        "news_digest_pipeline_result",
        artifacts=result.metadata.get("artifact_count"),
        readability=result.quality.readability,
        manual_selected=len(manual_selected_ids),
        branch=result.git_payload.branch_name if result.git_payload else None,
        reviewers=(result.git_payload.metadata.get("reviewers") if result.git_payload else []),
        published_branch=publish_result.branch if publish_result else None,
        published_commit=publish_result.commit if publish_result else None,
        pushed=publish_result.pushed if publish_result else False,
    )


def _publish_git_payload(result: PipelineResult, config: ACEConfig) -> Optional[GitPublishingResult]:
    payload = result.git_payload
    if not payload:
        logger.info("news_digest_no_git_payload")
        return None

    git_cfg = config.app.git
    service = GitPublishingService(
        repo_path=Path.cwd(),
        remote="origin",
        base_branch=git_cfg.main_branch,
        push=False,
        allow_dirty=False,
    )
    try:
        publish_result = service.apply(payload)
        logger.info(
            "news_digest_git_applied",
            branch=publish_result.branch,
            commit=publish_result.commit,
            pushed=publish_result.pushed,
        )
        return publish_result
    except GitPublishingError as exc:
        logger.error("news_digest_git_failed", error=str(exc))
        return None
