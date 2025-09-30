"""Scoring and deduplication for News Digest candidates."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List

import structlog

from ...models import NewsCandidate

logger = structlog.get_logger(__name__)


class NewsCandidateScorer:
    """Assigns heuristic scores to news candidates."""

    def __init__(self, recency_half_life_hours: float = 24.0) -> None:
        self.recency_half_life_hours = recency_half_life_hours

    def score(self, candidates: Iterable[NewsCandidate]) -> List[NewsCandidate]:
        now = datetime.now(tz=timezone.utc)
        scored: List[NewsCandidate] = []
        for candidate in candidates:
            hours_old = max(0.0, (now - candidate.published_at).total_seconds() / 3600.0)
            recency_weight = 0.5 ** (hours_old / self.recency_half_life_hours)
            manual_boost = 1.5 if candidate.manual_seed else 1.0
            link_count = max(1, len(candidate.corroborating_links))
            link_bonus = min(1.2, 0.8 + 0.1 * link_count)
            candidate.score = recency_weight * manual_boost * link_bonus
            scored.append(candidate)
        scored.sort(key=lambda c: c.score, reverse=True)
        logger.info("candidates_scored", total=len(scored))
        return scored


def dedupe_candidates(candidates: Iterable[NewsCandidate]) -> List[NewsCandidate]:
    items = list(candidates)
    seen_urls: set[str] = set()
    deduped: List[NewsCandidate] = []
    for candidate in items:
        url_key = candidate.url.split("#")[0]
        if url_key in seen_urls:
            continue
        seen_urls.add(url_key)
        deduped.append(candidate)
    logger.info("candidates_deduped", before=len(items), after=len(deduped))
    return deduped
