"""Accès données journal d'audit (lecture + dernière entrée pour chaînage)."""
from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import AuditLog


def get_last_entry(db: Session) -> AuditLog | None:
    return db.scalar(select(AuditLog).order_by(desc(AuditLog.sequence)).limit(1))


def add_entry(db: Session, entry: AuditLog) -> AuditLog:
    db.add(entry)
    db.flush()
    return entry


def list_entries(db: Session, *, limit: int = 100, offset: int = 0) -> list[AuditLog]:
    return list(
        db.scalars(
            select(AuditLog)
            .order_by(AuditLog.sequence)
            .offset(offset)
            .limit(limit)
        )
    )


def all_entries_ordered(db: Session) -> list[AuditLog]:
    return list(db.scalars(select(AuditLog).order_by(AuditLog.sequence)))
