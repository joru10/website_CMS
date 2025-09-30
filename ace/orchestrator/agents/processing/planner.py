"""Planner agent for News Digest pipeline."""

from __future__ import annotations

from dataclasses import replace
from typing import Iterable, List

import structlog

from ...models import DigestItem, NewsCandidate, SourceLink

logger = structlog.get_logger(__name__)


class DigestPlanner:
    """Selects and structures digest items from scored candidates."""

    def __init__(self, items_max: int, require_corroboration: int | None = 2) -> None:
        self.items_max = items_max
        self.require_corroboration = require_corroboration or 0

    def plan(self, candidates: Iterable[NewsCandidate]) -> List[DigestItem]:
        digest_items: List[DigestItem] = []
        for idx, candidate in enumerate(candidates):
            if idx >= self.items_max:
                break
            corroboration_links = candidate.corroborating_links
            if self.require_corroboration > 0 and len(corroboration_links) < self.require_corroboration:
                logger.debug(
                    "candidate_skipped_insufficient_corroboration",
                    candidate_id=candidate.id,
                    have=len(corroboration_links),
                )
                continue
            digest_items.append(
                DigestItem(
                    order=len(digest_items) + 1,
                    candidate_id=candidate.id,
                    headline=candidate.title.strip(),
                    what_happened=candidate.summary.strip(),
                    why_it_matters=candidate.why_it_matters.strip() or candidate.summary.strip(),
                    links=[replace(link) for link in corroboration_links],
                )
            )
        logger.info("planner_selected_items", count=len(digest_items))
        return digest_items
