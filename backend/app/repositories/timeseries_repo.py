"""Accès données séries temporelles (CGM, insuline, repas, activité).

Couche purement données : insertions, requêtes par patient / fenêtre,
détection de doublons. Aucune logique métier, aucune autorisation ici
(gérées dans `timeseries_service`).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import ActivityEvent, CgmReading, InsulinEvent, MealEvent

# Table event par "kind" logique.
MODEL_BY_KIND = {
    "cgm": CgmReading,
    "insulin": InsulinEvent,
    "meal": MealEvent,
    "activity": ActivityEvent,
}

# Colonne "valeur principale" par kind (pour la dedup logique + vue consolidée).
_VALUE_COL = {
    "cgm": "glucose_mgdl",
    "insulin": "units",
    "meal": "carbs_g",
    "activity": "duration_min",
}


def add(db: Session, obj) -> None:
    """Ajoute un objet event (flush géré par l'appelant)."""
    db.add(obj)


def find_by_external_id(
    db: Session, kind: str, *, patient_id: uuid.UUID, source: str, external_event_id: str
):
    """Retrouve un event par sa clé d'idempotence (patient, source, external_event_id)."""
    model = MODEL_BY_KIND[kind]
    return db.scalar(
        select(model).where(
            and_(
                model.patient_id == patient_id,
                model.source == source,
                model.external_event_id == external_event_id,
            )
        )
    )


def find_logical_duplicate(
    db: Session,
    kind: str,
    *,
    patient_id: uuid.UUID,
    source: str,
    ts: datetime,
    value: float,
):
    """Retrouve un doublon par clé logique (patient, source, ts, valeur principale).

    Utilisé quand aucun `external_event_id` n'est fourni.
    """
    model = MODEL_BY_KIND[kind]
    value_col = getattr(model, _VALUE_COL[kind])
    return db.scalar(
        select(model).where(
            and_(
                model.patient_id == patient_id,
                model.source == source,
                model.ts == ts,
                value_col == value,
            )
        )
    )


def query_window(
    db: Session,
    kind: str,
    *,
    patient_id: uuid.UUID,
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = 500,
    offset: int = 0,
) -> list:
    """Liste les events d'un patient sur une fenêtre temporelle, triés par ts croissant."""
    model = MODEL_BY_KIND[kind]
    stmt = select(model).where(model.patient_id == patient_id)
    if start is not None:
        stmt = stmt.where(model.ts >= start)
    if end is not None:
        stmt = stmt.where(model.ts <= end)
    stmt = stmt.order_by(model.ts.asc()).offset(offset).limit(limit)
    return list(db.scalars(stmt))


def query_all_kinds_window(
    db: Session,
    *,
    patient_id: uuid.UUID,
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = 500,
) -> dict[str, list]:
    """Récupère tous les types d'events d'un patient sur une fenêtre (vue consolidée)."""
    out: dict[str, list] = {}
    for kind in MODEL_BY_KIND:
        out[kind] = query_window(
            db, kind, patient_id=patient_id, start=start, end=end, limit=limit
        )
    return out
