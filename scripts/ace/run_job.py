"""CLI entry for running ACE jobs."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import structlog

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from orchestrator.config import load_config, ConfigPaths  # noqa: E402

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
    # TODO: invoke specific job orchestration once implemented
    logger.info("job_complete", job=args.job)


if __name__ == "__main__":
    main()
