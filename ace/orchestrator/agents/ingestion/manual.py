"""Manual insert ingestion for News Digest pipeline."""

from __future__ import annotations

from typing import List

import structlog
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...models import NewsCandidate, SourceLink
from ...storage.models import ManualInsertRecord

logger = structlog.get_logger(__name__)


class ManualInsertAgent:
    """Reads manual insert records awaiting inclusion."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def fetch_pending(self) -> List[NewsCandidate]:
        stmt = (
            select(ManualInsertRecord)
            .where(ManualInsertRecord.status == "pending")
            .order_by(ManualInsertRecord.priority.desc(), ManualInsertRecord.created_at.asc())
        )
        rows = self.session.execute(stmt).scalars().all()
        candidates: List[NewsCandidate] = []
        for row in rows:
            link_sources = [SourceLink(title=row.title, url=url) for url in row.source_links]
            candidate = NewsCandidate(
                id=f"manual:{row.id}",
                title=row.title,
                summary=row.summary,
                why_it_matters=row.summary,
                published_at=row.created_at,
                source="manual",
                url=link_sources[0].url if link_sources else "",
                tags=["manual"],
                corroborating_links=link_sources,
                manual_seed=True,
            )
            candidates.append(candidate)
        logger.info("manual_inserts_loaded", count=len(candidates))
        return candidates
