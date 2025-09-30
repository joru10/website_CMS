"""Configuration loading for ACE orchestrator."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import structlog
from pydantic import BaseModel, Field
from ruamel.yaml import YAML

logger = structlog.get_logger(__name__)

yaml = YAML(typ="safe")


class TrackSourceConfig(BaseModel):
    primary_url: Optional[str] = None
    rss_allowlist: List[str] = Field(default_factory=list)


class TrackCronConfig(BaseModel):
    ingest: Optional[str] = None
    qa: Optional[str] = None
    notify: Optional[str] = None


class TrackConfig(BaseModel):
    source: Optional[TrackSourceConfig] = None
    review_ready: Optional[str] = None
    publish_time: Optional[str] = None
    items_min: Optional[int] = None
    items_max: Optional[int] = None
    require_corroboration: Optional[int] = None
    allow_manual_inserts: bool = False
    cadence: List[str] = Field(default_factory=list)
    candidates_window_days: Optional[int] = None
    candidates_notify: Optional[str] = None
    min_business_value_score: Optional[int] = None
    propose_count: Optional[int] = None
    manual_suggestions_enabled: bool = False
    cron: Optional[TrackCronConfig] = None


class GitConfig(BaseModel):
    repo_url: str
    content_branch: str
    main_branch: str
    pr_base: str
    author_name: str
    author_email: str


class NotificationsConfig(BaseModel):
    news_ready_email: Optional[str] = None
    manual_insert_alert: Optional[str] = None
    webhook_url: Optional[str] = None


class AppConfig(BaseModel):
    timezone: str = "Europe/Madrid"
    locale_defaults: List[str] = Field(default_factory=lambda: ["en", "es", "fr"])
    git: GitConfig
    notifications: NotificationsConfig = Field(default_factory=NotificationsConfig)


class StorageConfig(BaseModel):
    sqlite_path: str = "ace.db"
    qdrant: Dict[str, Any] = Field(default_factory=dict)


class PublishingPathsConfig(BaseModel):
    news: str
    blog: str
    use_case: str


class PublishingConfig(BaseModel):
    method: str = "git_pr"
    paths: PublishingPathsConfig


class LoggingConfig(BaseModel):
    level: str = "INFO"
    json: bool = False


class ACEConfig(BaseModel):
    app: AppConfig
    tracks: Dict[str, TrackConfig]
    storage: StorageConfig
    publishing: PublishingConfig
    logging: LoggingConfig = Field(default_factory=LoggingConfig)


@dataclass
class ConfigPaths:
    config_file: Path
    project_root: Path

    @staticmethod
    def default() -> "ConfigPaths":
        root = Path(__file__).resolve().parents[2]
        return ConfigPaths(
            config_file=root / "ace" / "config.yaml",
            project_root=root,
        )


def load_config(config_path: Optional[Path] = None) -> ACEConfig:
    paths = ConfigPaths.default()
    cfg_path = config_path or paths.config_file

    if not cfg_path.exists():
        raise FileNotFoundError(f"ACE config not found at {cfg_path}")

    logger.info("loading_config", path=str(cfg_path))
    with cfg_path.open("r", encoding="utf-8") as handle:
        data = yaml.load(handle) or {}

    config = ACEConfig(**data)
    logger.info("config_loaded", tracks=list(config.tracks.keys()))
    return config


__all__ = ["ACEConfig", "ConfigPaths", "load_config"]
