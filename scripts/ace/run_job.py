"""CLI entry for running ACE jobs."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import structlog

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

from ace.orchestrator.config import load_config, ConfigPaths  # noqa: E402
from ace.orchestrator.jobs.news_digest import run_news_digest_job  # noqa: E402

logger = structlog.get_logger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ACE content job")
    parser.add_argument("--job", required=True, help="Job identifier (news_digest|blog_insight|use_case)")
    parser.add_argument("--config", type=Path, default=None, help="Optional path to config file")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config_path = args.config or ConfigPaths.default().config_file
    config = load_config(config_path)
    logger.info("job_start", job=args.job, config=str(config_path))
    if args.job == "news_digest":
        run_news_digest_job(config)
    else:
        raise ValueError(f"Unsupported job: {args.job}")
    logger.info("job_complete", job=args.job)


if __name__ == "__main__":
    main()
