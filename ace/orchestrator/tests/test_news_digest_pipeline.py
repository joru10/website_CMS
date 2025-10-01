from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import xml.etree.ElementTree as ET

from ace.orchestrator.models import DigestEdition, DigestItem, SourceLink
from ace.orchestrator.pipelines.news_digest import (
    _build_rss_feed,
    _load_manifest_slugs,
)


def make_config(public_base_url: str = "https://example.com/news") -> SimpleNamespace:
    publishing = SimpleNamespace(public_base_url=public_base_url)
    app = SimpleNamespace(locale_defaults=["en", "es", "fr"])
    return SimpleNamespace(app=app, publishing=publishing)


def make_edition(slug: str = "weekly-20251001") -> DigestEdition:
    item = DigestItem(
        order=1,
        candidate_id="auto:001",
        headline="AI regulation update",
        what_happened="The EU released new AI guidelines.",
        why_it_matters="Offers clear compliance direction for SMEs.",
        links=[
            SourceLink(title="EU announcement", url="https://example.org/eu"),
            SourceLink(title="Analysis", url="https://example.org/analysis"),
        ],
    )
    return DigestEdition(
        title="RapidAI Weekly Digest",
        slug=slug,
        track="news",
        generated_at=datetime(2025, 10, 1, 7, 0, tzinfo=timezone.utc),
        locale_outputs={},
        items=[item],
        metadata={},
    )


def test_load_manifest_slugs(tmp_path: Path) -> None:
    missing = tmp_path / "missing.json"
    assert _load_manifest_slugs(missing) == []

    invalid = tmp_path / "invalid.json"
    invalid.write_text("not json", encoding="utf-8")
    assert _load_manifest_slugs(invalid) == []

    manifest = tmp_path / "manifest.json"
    manifest.write_text('{"slugs": ["weekly-001", "weekly-002"]}', encoding="utf-8")
    assert _load_manifest_slugs(manifest) == ["weekly-001", "weekly-002"]


def test_build_rss_feed_creates_entry(tmp_path: Path) -> None:
    publish_dir = Path("content/news")
    (tmp_path / publish_dir).mkdir(parents=True, exist_ok=True)

    manifest_slugs = ["weekly-20251001", "weekly-002"]
    edition = make_edition(slug="weekly-20251001")
    config = make_config("https://rapiai.ai/news")
    english_output = "# RapidAI Weekly Digest\n\nSummary"

    original_cwd = os.getcwd()
    try:
        os.chdir(tmp_path)
        rss_content = _build_rss_feed(
            manifest_slugs=manifest_slugs,
            publish_dir=publish_dir,
            edition=edition,
            config=config,
            english_output=english_output,
        )

        rss_path = tmp_path / publish_dir / "rss.xml"
        rss_path.write_text(rss_content, encoding="utf-8")

        root = ET.fromstring(rss_content)
        items = root.findall("channel/item")
        assert items, "RSS feed should contain at least one item"
        latest = items[0]
        assert latest.find("guid").text == edition.slug
        assert latest.find("link").text == f"https://rapiai.ai/news/{edition.slug}"
        assert "Offers clear compliance direction" in latest.find("description").text
    finally:
        os.chdir(original_cwd)


def test_build_rss_feed_trims_items(tmp_path: Path) -> None:
    publish_dir = Path("content/news")
    (tmp_path / publish_dir).mkdir(parents=True, exist_ok=True)

    edition = make_edition(slug="weekly-20251001")
    config = make_config("https://rapiai.ai/news")

    original_cwd = os.getcwd()
    try:
        os.chdir(tmp_path)
        # Pre-populate RSS with many items
        existing = ET.Element("rss", version="2.0")
        channel = ET.SubElement(existing, "channel")
        for i in range(30):
            item = ET.SubElement(channel, "item")
            ET.SubElement(item, "guid").text = f"weekly-{i:02d}"
        rss_path = tmp_path / publish_dir / "rss.xml"
        ET.ElementTree(existing).write(rss_path, encoding="utf-8", xml_declaration=True)

        rss_content = _build_rss_feed(
            manifest_slugs=[edition.slug],
            publish_dir=publish_dir,
            edition=edition,
            config=config,
            english_output="",
            max_items=10,
        )

        root = ET.fromstring(rss_content)
        assert len(root.findall("channel/item")) == 10
        guids = {item.find("guid").text for item in root.findall("channel/item")}
        assert edition.slug in guids
    finally:
        os.chdir(original_cwd)
