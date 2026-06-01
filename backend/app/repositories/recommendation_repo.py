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


def list_filtered(
    db: Session,
    *,
    status: str | None = None,
    patient_id: uuid.UUID | None = None,
    category: str | None = None,
    priority: int | None = None,
    target: str | None = None,
    horizon_min: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Recommendation]:
    """Liste filtrée (clinicien/admin). Tri par priorité puis ancienneté."""
    stmt = select(Recommendation)
    if status:
        stmt = stmt.where(Recommendation.status == status)
    if patient_id:
        stmt = stmt.where(Recommendation.patient_id == patient_id)
    if category:
        stmt = stmt.where(Recommendation.category == category)
    if priority is not None:
        stmt = stmt.where(Recommendation.priority == priority)
    if target:
        stmt = stmt.where(Recommendation.target == target)
    if horizon_min is not None:
        stmt = stmt.where(Recommendation.horizon_min == horizon_min)
    stmt = (
        stmt.order_by(Recommendation.priority, Recommendation.created_at)
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(stmt))


def list_for_patient(db: Session, patient_id: uuid.UUID) -> list[Recommendation]:
    return list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.patient_id == patient_id)
            .order_by(Recommendation.created_at.desc())
        )
    )


def list_approved_for_patient(
    db: Session, patient_id: uuid.UUID, *, limit: int = 100, offset: int = 0
) -> list[Recommendation]:
    """Le patient ne lit QUE ses recommandations approuvées (open-loop)."""
    return list(
        db.scalars(
            select(Recommendation)
            .where(
                Recommendation.patient_id == patient_id,
                Recommendation.status == "approved",
            )
            .order_by(Recommendation.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
