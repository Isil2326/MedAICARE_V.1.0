"""Accès données aux explications XAI persistées (Phase 3).

Persistance OPTIONNELLE (le calcul XAI fonctionne sans). `is_synthetic=True`
toujours. Le commit est délégué à l'appelant (cohérence avec l'audit chaîné).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.xai_explanation import XaiExplanation


def create_from_result(db: Session, result: dict) -> XaiExplanation:
    """Crée une ligne d'explication à partir du dict produit par le service local.

    N'ajoute PAS de commit (l'appelant orchestre transaction + audit).
    """
    row = XaiExplanation(
        patient_id=result["patient_id"],
        ts=result["at"],
        target=result["target"],
        horizon_min=result["horizon_min"],
        probability=result.get("probability"),
        risk_label=result.get("risk_label", "non calculable"),
        calculable=bool(result.get("calculable", False)),
        model_name=result.get("model_name", "none"),
        model_version=result.get("model_version", "0.0.0"),
        calibrated=bool(result.get("calibrated", False)),
        explains=result.get("explains", "modèle non calibré"),
        xai_method=result.get("xai_method", "none"),
        method_fallback=bool(result.get("method_fallback", False)),
        top_features=result.get("top_features"),
        baseline=result.get("baseline"),
        explanation_text_patient=result.get("explanation_text_patient"),
        explanation_text_clinician=result.get("explanation_text_clinician"),
        xai_reliability_status=result.get("xai_reliability_status", "reliable_for_model_debug"),
        xai_warnings=result.get("xai_warnings"),
        semantic_limitations=result.get("semantic_limitations"),
        is_synthetic=True,
    )
    db.add(row)
    db.flush()
    return row


def get(db: Session, explanation_id: uuid.UUID) -> XaiExplanation | None:
    return db.get(XaiExplanation, explanation_id)


def list_for_patient(
    db: Session, patient_id: uuid.UUID, *, limit: int = 50
) -> list[XaiExplanation]:
    stmt = (
        select(XaiExplanation)
        .where(XaiExplanation.patient_id == patient_id)
        .order_by(XaiExplanation.ts.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())
