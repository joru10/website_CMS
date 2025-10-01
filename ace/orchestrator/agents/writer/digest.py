"""Writer agent responsible for News Digest narrative output."""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Dict, List, Optional

import structlog
from jinja2 import Environment, BaseLoader

from ...models import DigestEdition, DigestItem
from ...utils.llm import LLMClient

logger = structlog.get_logger(__name__)

EN_TEMPLATE = """---
track: news
title: "{{ title }}"
slug: "{{ slug }}"
generated_at: "{{ generated_at.isoformat() }}"
manual_item_ids:
{% for item in items if item.candidate_id.startswith('manual:') %}  - "{{ item.candidate_id }}"
{% endfor %}seed_ids:
{% for item in items %}  - "{{ item.candidate_id }}"
{% endfor %}itinerary:
{% for item in items %}  - "{{ item.headline }}"
{% endfor %}---

# {{ title }}

{% for item in items %}
## {{ item.headline }}

**What happened:** {{ item.what_happened }}

**Why it matters:** {{ item.why_it_matters }}

**Further reading:**
{% for link in item.links %}- [{{ link.title }}]({{ link.url }})
{% endfor %}
{% endfor %}
"""


SYSTEM_PROMPT = (
    "You are an expert AI editorial assistant who writes concise business-focused summaries "
    "highlighting why AI news matters to European SMEs. Maintain neutral tone, avoid hype, "
    "and provide actionable context in 2 sentences."
)


@dataclass(slots=True)
class DigestWriter:
    locales: List[str]
    llm: Optional[LLMClient] = None
    _env: Environment = field(init=False, repr=False)

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "_env",
            Environment(loader=BaseLoader(), autoescape=False, trim_blocks=True, lstrip_blocks=True),
        )

    def render(self, edition: DigestEdition) -> Dict[str, str]:
        prepared_items = [self._enhance_item(item) for item in edition.items]
        template = self._env.from_string(EN_TEMPLATE)
        english_output = template.render(
            title=edition.title,
            slug=edition.slug,
            generated_at=edition.generated_at,
            items=prepared_items,
        )
        outputs: Dict[str, str] = {"en": english_output}
        for locale in self.locales:
            if locale == "en":
                continue
            # Simple placeholder copy for now, translation agent to replace later
            outputs[locale] = english_output
        logger.info("digest_writer_rendered", locales=list(outputs.keys()))
        edition.locale_outputs = outputs
        edition.items = prepared_items
        return outputs

    def _enhance_item(self, item: DigestItem) -> DigestItem:
        if not self.llm:
            return item
        links_section = "\n".join(f"- {link.title} :: {link.url}" for link in item.links[:4]) or "- None"
        user_prompt = (
            "Craft a concise 'why it matters' summary (max 2 sentences) for SMEs about this AI news.\n"
            f"Headline: {item.headline}\n"
            f"Summary: {item.what_happened}\n"
            "Key sources:\n"
            f"{links_section}\n"
            "Focus on business impact, risks, and actionable takeaways."
        )
        response = self.llm.complete(SYSTEM_PROMPT, user_prompt)
        if not response:
            return item
        cleaned = response.strip().replace("\n", " ")
        return replace(item, why_it_matters=cleaned)
