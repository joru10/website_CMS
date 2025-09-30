"""Writer agent responsible for News Digest narrative output."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List

import structlog
from jinja2 import Environment, BaseLoader

from ...models import DigestEdition, DigestItem

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


@dataclass(slots=True)
class DigestWriter:
    locales: List[str]

    def __post_init__(self) -> None:
        self._env = Environment(loader=BaseLoader(), autoescape=False, trim_blocks=True, lstrip_blocks=True)

    def render(self, edition: DigestEdition) -> Dict[str, str]:
        template = self._env.from_string(EN_TEMPLATE)
        english_output = template.render(
            title=edition.title,
            slug=edition.slug,
            generated_at=edition.generated_at,
            items=edition.items,
        )
        outputs: Dict[str, str] = {"en": english_output}
        for locale in self.locales:
            if locale == "en":
                continue
            # Simple placeholder copy for now, translation agent to replace later
            outputs[locale] = english_output
        logger.info("digest_writer_rendered", locales=list(outputs.keys()))
        edition.locale_outputs = outputs
        return outputs
