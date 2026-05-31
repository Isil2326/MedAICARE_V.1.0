"""Accès données recommandations."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Recommendation


def get(db: Session, rec_id: uuid.UUID) -> Recommendation | None:
    return db.get(Recommendation, rec_id)


def list_by_status(
    db: Session, *, status: str | None = None, limit: int = 100, offset: int = 0
) -> list[Recommendation]:
    stmt = select(Recommendation)
    if status:
        stmt = stmt.where(Recommendation.status == status)
    stmt = stmt.order_by(Recommendation.priority, Recommendation.created_at).offset(offset).limit(limit)
    return list(db.scalars(stmt))


def list_for_patient(db: Session, patient_id: uuid.UUID) -> list[Recommendation]:
    return list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.patient_id == patient_id)
            .order_by(Recommendation.created_at.desc())
        )
    )
