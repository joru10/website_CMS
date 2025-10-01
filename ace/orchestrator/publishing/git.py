"""Git publishing utilities for ACE."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import structlog

from ..models import GitCommitFile, GitCommitPayload

logger = structlog.get_logger(__name__)


class GitPublishingError(RuntimeError):
    """Raised when git publishing operations fail."""


@dataclass(slots=True)
class GitPublishingResult:
    branch: str
    commit: str | None
    files_written: List[str]
    pushed: bool


class GitPublishingService:
    """Applies `GitCommitPayload` objects onto a local git working tree."""

    def __init__(
        self,
        repo_path: Path | str = Path.cwd(),
        remote: str = "origin",
        base_branch: str = "main",
        push: bool = False,
        allow_dirty: bool = False,
    ) -> None:
        self.repo_path = Path(repo_path).resolve()
        self.remote = remote
        self.base_branch = base_branch
        self.push = push
        self.allow_dirty = allow_dirty

    def apply(self, payload: GitCommitPayload) -> GitPublishingResult:
        self._assert_repo()
        if not self.allow_dirty:
            self._ensure_clean()

        branch = payload.branch_name
        logger.info(
            "git_publish_prepare",
            repo=str(self.repo_path),
            branch=branch,
            base=self.base_branch,
        )

        self._checkout_base()
        self._run_git(["checkout", "-B", branch])

        files_written = self._write_files(payload.files)
        if not files_written:
            logger.warning("git_publish_no_files", branch=branch)
            return GitPublishingResult(branch=branch, commit=None, files_written=[], pushed=False)

        self._run_git(["add", *files_written])

        if not payload.commit_message:
            raise GitPublishingError("Commit message is required for git publishing")

        if not self._has_staged_changes():
            logger.info("git_publish_no_changes", branch=branch)
            return GitPublishingResult(branch=branch, commit=None, files_written=files_written, pushed=False)

        self._run_git(["commit", "-m", payload.commit_message])
        commit = self._run_git(["rev-parse", "HEAD"]).strip()

        pushed = False
        if self.push:
            self._run_git(["push", "-u", self.remote, branch])
            pushed = True

        logger.info(
            "git_publish_complete",
            branch=branch,
            commit=commit,
            pushed=pushed,
        )
        return GitPublishingResult(branch=branch, commit=commit, files_written=files_written, pushed=pushed)

    # Internal helpers -----------------------------------------------------------------

    def _assert_repo(self) -> None:
        if not (self.repo_path / ".git").exists():
            raise GitPublishingError(f"Not a git repository: {self.repo_path}")

    def _ensure_clean(self) -> None:
        status = self._run_git(["status", "--porcelain"])
        if status.strip():
            raise GitPublishingError("Working tree is dirty; aborting publishing")

    def _checkout_base(self) -> None:
        try:
            self._run_git(["fetch", self.remote, self.base_branch])
        except GitPublishingError:
            logger.warning("git_fetch_failed", remote=self.remote, branch=self.base_branch)
        self._run_git(["checkout", self.base_branch])
        try:
            self._run_git(["pull", self.remote, self.base_branch])
        except GitPublishingError:
            logger.warning("git_pull_failed", remote=self.remote, branch=self.base_branch)

    def _write_files(self, files: Iterable[GitCommitFile]) -> List[str]:
        written: List[str] = []
        for file in files:
            rel_path = Path(file.path)
            dest_path = (self.repo_path / rel_path).resolve()
            try:
                dest_path.relative_to(self.repo_path)
            except ValueError as exc:  # pragma: no cover - safety guard
                raise GitPublishingError(f"File path escapes repository: {dest_path}") from exc
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_text(file.content, encoding="utf-8")
            written.append(str(rel_path))
        return written

    def _has_staged_changes(self) -> bool:
        diff = self._run_git(["diff", "--cached", "--name-only"])
        return bool(diff.strip())

    def _run_git(self, args: List[str]) -> str:
        cmd = ["git", *args]
        try:
            completed = subprocess.run(
                cmd,
                cwd=self.repo_path,
                check=True,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as exc:  # pragma: no cover - git failure
            logger.error("git_command_failed", cmd=" ".join(cmd), stderr=exc.stderr)
            raise GitPublishingError(exc.stderr.strip()) from exc
        return completed.stdout
