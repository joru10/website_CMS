"""Core dataclasses representing ACE content artifacts."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass(slots=True)
class SourceLink:
    title: str
    url: str


@dataclass(slots=True)
class NewsCandidate:
    id: str
    title: str
    summary: str
    why_it_matters: str
    published_at: datetime
    source: str
    url: str
    score: float = 0.0
    tags: List[str] = field(default_factory=list)
    corroborating_links: List[SourceLink] = field(default_factory=list)
    manual_seed: bool = False


@dataclass(slots=True)
class DigestItem:
    order: int
    candidate_id: str
    headline: str
    what_happened: str
    why_it_matters: str
    links: List[SourceLink]


@dataclass(slots=True)
class DigestEdition:
    title: str
    slug: str
    track: str
    generated_at: datetime
    locale_outputs: Dict[str, str]
    items: List[DigestItem]
    metadata: Dict[str, Any]


@dataclass(slots=True)
class QualityReport:
    readability: float
    link_health_passed: bool
    duplicate_flag: bool
    translation_ready: bool
    details: Dict[str, str] = field(default_factory=dict)


@dataclass(slots=True)
class MarkdownArtifact:
    path: str
    content: str
    locale: str


@dataclass(slots=True)
class PipelineResult:
    artifacts: List[MarkdownArtifact]
    quality: QualityReport
    edition: DigestEdition
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class GitCommitFile:
    path: str
    content: str


@dataclass(slots=True)
class GitCommitPayload:
    branch_name: str
    commit_message: str
    files: List[GitCommitFile]
    metadata: Dict[str, Any] = field(default_factory=dict)

