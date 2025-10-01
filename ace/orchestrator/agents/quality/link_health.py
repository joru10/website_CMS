"""Link health checking utilities."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
from urllib.parse import urlparse

import httpx
import structlog

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class LinkHealthReport:
    status_map: Dict[str, int]
    broken_links: List[str]
    details: Dict[str, str]

    @property
    def ok(self) -> bool:
        return not self.broken_links


class LinkHealthChecker:
    """Checks HTTP links for accessibility using HEAD/GET requests."""

    def __init__(
        self,
        timeout: float = 6.0,
        user_agent: str = "ACE-LinkChecker/0.1",
        max_concurrency: int = 5,
    ) -> None:
        self.timeout = timeout
        self.user_agent = user_agent
        self.max_concurrency = max_concurrency

    async def check_links_async(self, links: Iterable[str]) -> LinkHealthReport:
        urls = [link for link in {link.strip(): None for link in links if self._is_http_url(link)}]
        if not urls:
            return LinkHealthReport(status_map={}, broken_links=[], details={})

        semaphore = asyncio.Semaphore(self.max_concurrency)
        status_map: Dict[str, int] = {}
        broken: List[str] = []

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            tasks = [self._check_url(client, url, semaphore) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                logger.debug("link_check_error", url=url, error=str(result))
                status_map[url] = 0
                broken.append(url)
                continue
            status_code, error = result
            status_map[url] = status_code
            if status_code >= 400 or error:
                broken.append(url)

        return LinkHealthReport(
            status_map=status_map,
            broken_links=broken,
            details={"checked": str(len(urls))},
        )

    def check_links(self, links: Iterable[str]) -> LinkHealthReport:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            return LinkHealthReport(status_map={}, broken_links=list(links), details={"error": "event_loop_running"})
        return asyncio.run(self.check_links_async(links))

    async def _check_url(
        self, client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore
    ) -> tuple[int, Optional[str]]:
        headers = {"User-Agent": self.user_agent}
        async with semaphore:
            try:
                response = await client.head(url, headers=headers)
                if response.status_code >= 400:
                    response = await client.get(url, headers=headers)
                return response.status_code, None
            except Exception as exc:  # pragma: no cover - network exceptions
                return 0, str(exc)

    def _is_http_url(self, url: str) -> bool:
        parsed = urlparse(url)
        return parsed.scheme in {"http", "https"}
