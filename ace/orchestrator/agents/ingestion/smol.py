"""news.smol.ai ingestion agent."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from urllib.parse import urlparse

import httpx
import structlog

from ...models import NewsCandidate, SourceLink

logger = structlog.get_logger(__name__)


class SmolNewsIngestionAgent:
    """Fetches daily highlights from news.smol.ai."""

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def fetch_async(self) -> List[NewsCandidate]:
        url = f"{self.base_url}/api/highlights"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                payload = response.json()
        except Exception as exc:  # pragma: no cover - network variability
            logger.warning("smol_fetch_failed", url=url, error=str(exc))
            return []

        highlights = payload if isinstance(payload, list) else payload.get("items", [])
        candidates: List[NewsCandidate] = []
        for item in highlights[:20]:
            title = (item.get("title") or "").strip()
            summary = (item.get("summary") or item.get("description") or "").strip()
            link = item.get("url") or item.get("link")
            if not title or not link:
                continue
            published = item.get("published") or item.get("date")
            published_at = self._parse_datetime(published)
            source = urlparse(link).netloc
            candidate = NewsCandidate(
                id=f"smol:{hash(link)}",
                title=title,
                summary=summary,
                why_it_matters=item.get("sme_context") or "",
                published_at=published_at,
                source=source,
                url=link,
                tags=item.get("tags", []),
                corroborating_links=[SourceLink(title=title, url=link)],
            )
            candidates.append(candidate)
        logger.info("smol_candidates_collected", count=len(candidates))
        return candidates

    def _parse_datetime(self, value: str | None) -> datetime:
        if not value:
            return datetime.now(tz=timezone.utc)
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(tz=timezone.utc)
