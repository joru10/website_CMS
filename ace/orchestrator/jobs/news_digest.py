"""News Digest job orchestration."""

from __future__ import annotations

import asyncio
from typing import List

import structlog

from ..config import ACEConfig
from ..models import NewsCandidate
from ..storage import get_engine, get_sessionmaker, init_db
from ..agents.ingestion.manual import ManualInsertAgent
from ..agents.ingestion.rss import RSSIngestionAgent
from ..agents.ingestion.smol import SmolNewsIngestionAgent
from ..agents.processing.relevance import NewsCandidateScorer, dedupe_candidates

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

    # TODO: integrate planner, writer, QA, and publishing pipeline stages.
