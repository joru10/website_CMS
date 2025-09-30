"""SQLAlchemy models for ACE foundational storage."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.sqlite import BLOB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class CandidateDecision(Base):
    __tablename__ = "candidate_decisions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    track: Mapped[str] = mapped_column(String(32), nullable=False)
    candidate_id: Mapped[str] = mapped_column(String(64), nullable=False)
    decision: Mapped[str] = mapped_column(
        Enum("approve", "hold", "reject", name="decision_state"), nullable=False
    )
    reviewer: Mapped[str] = mapped_column(String(128), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text())
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    audit_events: Mapped[list["AuditLog"]] = relationship(back_populates="candidate_decision")


class ManualInsertRecord(Base):
    __tablename__ = "manual_insert_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    track: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    summary: Mapped[str] = mapped_column(Text(), nullable=False)
    source_links: Mapped[list[str]] = mapped_column(JSON, default=list)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "rejected", name="manual_insert_status"), default="pending"
    )
    submitted_by: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    audit_events: Mapped[list["AuditLog"]] = relationship(back_populates="manual_insert")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False)
    event: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[bytes | None] = mapped_column(BLOB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    user: Mapped[str | None] = mapped_column(String(128))

    candidate_decision_id: Mapped[str | None] = mapped_column(ForeignKey("candidate_decisions.id"))
    manual_insert_id: Mapped[str | None] = mapped_column(ForeignKey("manual_insert_records.id"))

    candidate_decision: Mapped[CandidateDecision | None] = relationship(back_populates="audit_events")
    manual_insert: Mapped[ManualInsertRecord | None] = relationship(back_populates="audit_events")
