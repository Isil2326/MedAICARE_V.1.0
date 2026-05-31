"""Helpers de test Phase 2 : générateurs de séries synthétiques (anti-leakage friendly)."""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timedelta, timezone

from app.ml.features_adapter import Point
from app.models import CgmReading, InsulinEvent, MealEvent, Patient, User
from app.repositories import user_repo


def synthetic_points(
    *, n_steps: int = 192, step_min: int = 15, start: datetime | None = None
) -> list[Point]:
    """Glycémie oscillante traversant régulièrement 70 et 180 (deux classes garanties)."""
    start = start or (datetime.now(timezone.utc).replace(second=0, microsecond=0)
                      - timedelta(minutes=n_steps * step_min))
    pts = []
    for i in range(n_steps):
        ts = start + timedelta(minutes=i * step_min)
        # mean 125, amplitude 70 -> ~55..195 : franchit hypo (<70) et hyper (>180).
        value = 125.0 + 70.0 * math.sin(2 * math.pi * i / 8.0)
        pts.append(Point(ts=ts, value=round(value, 1)))
    return pts


def get_patient(db, email: str) -> Patient:
    user = user_repo.get_user_by_email(db, email)
    return user_repo.get_patient_by_user(db, user.id)


def insert_synthetic_series(db, patient_id: uuid.UUID, *, n_steps: int = 192, step_min: int = 15):
    """Insère une série CGM synthétique (+ quelques repas/insuline) pour un patient."""
    pts = synthetic_points(n_steps=n_steps, step_min=step_min)
    for p in pts:
        db.add(CgmReading(
            patient_id=patient_id, ts=p.ts, glucose_mgdl=p.value,
            source="sim", is_synthetic=True,
        ))
    # Quelques repas/insuline répartis (contexte features).
    for i in range(0, n_steps, 16):
        ts = pts[i].ts
        db.add(MealEvent(patient_id=patient_id, ts=ts, carbs_g=50.0, source="sim", is_synthetic=True))
        db.add(InsulinEvent(patient_id=patient_id, ts=ts, units=5.0, source="sim", is_synthetic=True))
    db.commit()
    return pts
