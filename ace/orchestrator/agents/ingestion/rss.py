"""RSS ingestion agent for News Digest pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List
from urllib.parse import urlparse

import feedparser
import structlog

from ...models import NewsCandidate, SourceLink

logger = structlog.get_logger(__name__)


class RSSIngestionAgent:
    """Fetches and normalizes RSS items into `NewsCandidate` objects."""

    def __init__(self, timeout: int = 10) -> None:
        self.timeout = timeout

    def fetch(self, feed_urls: Iterable[str]) -> List[NewsCandidate]:
        candidates: List[NewsCandidate] = []
        for url in feed_urls:
            try:
                parsed = feedparser.parse(url)
            except Exception as exc:  # pragma: no cover - feedparser handles most errors
                logger.warning("rss_fetch_failed", feed=url, error=str(exc))
                continue

            for entry in parsed.entries[:20]:
                link = entry.get("link")
                title = (entry.get("title") or "").strip()
                summary = (entry.get("summary") or entry.get("description") or "").strip()
                if not title or not link:
                    continue

                published = self._parse_published(entry)
                source = urlparse(link).netloc
                candidate = NewsCandidate(
                    id=f"rss:{hash(link)}",
                    title=title,
                    summary=summary,
                    why_it_matters="",
                    published_at=published,
                    source=source,
                    url=link,
                    tags=[],
                    corroborating_links=[SourceLink(title=title, url=link)],
                )
                candidates.append(candidate)
        logger.info("rss_candidates_collected", count=len(candidates))
        return candidates

    def _parse_published(self, entry: any) -> datetime:
        published_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
        if published_parsed:
            return datetime(*published_parsed[:6], tzinfo=timezone.utc)
        return datetime.now(tz=timezone.utc)
