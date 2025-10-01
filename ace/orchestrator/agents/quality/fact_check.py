"""Fact check utilities for news digest items."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence, Tuple
from urllib.parse import urlparse

import structlog

from ...models import DigestEdition, DigestItem

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class FactCheckResult:
    issues: List[str]
    unique_domains: List[str]

    @property
    def ok(self) -> bool:
        return not self.issues


class FactCheckAgent:
    """Performs lightweight corroboration checks on digest items."""

    def __init__(self, min_unique_domains: int = 2) -> None:
        self.min_unique_domains = min_unique_domains

    def evaluate(self, edition: DigestEdition) -> FactCheckResult:
        issues: List[str] = []
        domains: set[str] = set()
        for item in edition.items:
            item_domains = self._extract_domains(item)
            domains.update(item_domains)
            if len(item_domains) < self.min_unique_domains:
                issues.append(
                    f"Item {item.candidate_id} corroboration too low ({len(item_domains)} domains, min {self.min_unique_domains})"
                )
            if len(item.what_happened.split()) < 12:
                issues.append(f"Item {item.candidate_id} what_happened text too short for review")
            if not item.why_it_matters.strip():
                issues.append(f"Item {item.candidate_id} missing why_it_matters content")
        result = FactCheckResult(issues=issues, unique_domains=sorted(domains))
        logger.info(
            "fact_check_evaluated",
            issues=len(result.issues),
            domains=result.unique_domains,
        )
        return result

    def _extract_domains(self, item: DigestItem) -> List[str]:
        domains: set[str] = set()
        for link in item.links:
            parsed = urlparse(link.url)
            if parsed.netloc:
                domains.add(parsed.netloc)
        return list(domains)
