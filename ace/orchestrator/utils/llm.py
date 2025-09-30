"""Simple HTTP client for calling LLM endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx
import structlog

from ..config import LLMConfig

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class LLMClient:
    """Minimal chat-completion compatible client."""

    base_url: str
    model: str
    api_key: Optional[str] = None
    temperature: float = 0.3
    timeout: float = 30.0

    @classmethod
    def from_config(cls, config: Optional[LLMConfig]) -> Optional["LLMClient"]:
        if not config:
            return None
        return cls(
            base_url=config.base_url.rstrip("/"),
            model=config.model,
            api_key=config.api_key,
            temperature=config.temperature,
        )

    def complete(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": self.model,
            "temperature": self.temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        try:
            response = httpx.post(url, json=payload, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                logger.warning("llm_no_choices", url=url)
                return None
            message = choices[0].get("message") or {}
            content = message.get("content")
            return content.strip() if content else None
        except Exception as exc:  # pragma: no cover - network errors
            logger.warning("llm_completion_failed", error=str(exc))
            return None
