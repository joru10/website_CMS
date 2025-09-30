"""Manual insert ingestion for News Digest pipeline."""

from __future__ import annotations

from typing import Iterable, List

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
        self._record_map: dict[str, str] = {}

    def fetch_pending(self) -> List[NewsCandidate]:
        stmt = (
            select(ManualInsertRecord)
            .where(ManualInsertRecord.status == "pending")
            .order_by(ManualInsertRecord.priority.desc(), ManualInsertRecord.created_at.asc())
        )
        rows = self.session.execute(stmt).scalars().all()
        candidates: List[NewsCandidate] = []
        self._record_map.clear()
        for row in rows:
            link_sources = [SourceLink(title=row.title, url=url) for url in row.source_links]
            candidate_id = f"manual:{row.id}"
            candidate = NewsCandidate(
                id=candidate_id,
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
            self._record_map[candidate_id] = row.id
            candidates.append(candidate)
        logger.info("manual_inserts_loaded", count=len(candidates))
        return candidates

    def mark_selected(self, candidate_ids: Iterable[str], status: str = "accepted") -> None:
        record_ids = [self._record_map.get(cid) or cid.split(":", 1)[-1] for cid in candidate_ids]
        record_ids = [rid for rid in record_ids if rid]
        if not record_ids:
            return
        rows = (
            self.session.execute(
                select(ManualInsertRecord).where(ManualInsertRecord.id.in_(record_ids))
            )
            .scalars()
            .all()
        )
        for row in rows:
            row.status = status
        self.session.commit()
        logger.info("manual_inserts_marked", count=len(rows), status=status)
