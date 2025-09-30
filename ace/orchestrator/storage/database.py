"""Database helpers for ACE orchestrator."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base


def get_engine(sqlite_path: str) -> "Engine":
    db_path = Path(sqlite_path).expanduser().resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(f"sqlite:///{db_path}", echo=False, future=True)


def get_sessionmaker(engine: "Engine") -> sessionmaker[Session]:
    return sessionmaker(engine, expire_on_commit=False, class_=Session)


def init_db(engine: "Engine") -> None:
    Base.metadata.create_all(engine)
