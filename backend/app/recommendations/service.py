"""Service de GÉNÉRATION des recommandations open-loop (orchestration DB/ML/XAI).

Pipeline : résolution prédiction (id existant ou inférence live) → XAI best-effort →
moteur de règles (pur) → couche safety → persistance `pending` (`is_synthetic=True`)
→ audit. Aucune décision, aucune dose : tout naît `pending` et exige une validation
clinicien. La XAI n'est qu'un support (jamais la condition principale).
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy.orm import Session

from app.ml import config, inference_service
from app.models import Prediction, Recommendation, User
from app.models.clinical import RecommendationStatus
from app.recommendations import engine, safety
from app.recommendations.schemas import GeneratedRecommendation
from app.repositories import recommendation_repo
from app.services import audit_service
from app.services.timeseries_service import resolve_read_scope
from app.xai import service as xai_service


class RecommendationGenerationError(Exception):
    def __init__(self, message: str, code: str = "generation_error"):
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass
class GenerateOutcome:
    generated: list[Recommendation] = field(default_factory=list)
    blocked: list[dict] = field(default_factory=list)
    calculable: bool = False
    reasons: list[str] = field(default_factory=list)


def _normalize_db_prediction(pred: Prediction) -> dict:
    return {
        "patient_id": pred.patient_id,
        "prediction_id": pred.id,
        "target": pred.predicted_event,
        "horizon_min": pred.horizon_min,
        "probability": pred.probability,
        "calculable": pred.probability is not None,
        "model_name": pred.model_name,
        "model_version": pred.model_version,
        "calibrated": False,
    }


def _normalize_ml(res: dict) -> dict:
    return {
        "patient_id": res["patient_id"],
        "prediction_id": None,
        "target": res["target"],
        "horizon_min": res["horizon_min"],
        "probability": res["probability"],
        "calculable": bool(res["calculable"]),
        "model_name": res["model_name"],
        "model_version": res["model_version"],
        "calibrated": bool(res.get("calibrated")),
    }


def _safe_xai(
    db: Session, *, patient_id: uuid.UUID, target: str, horizon_min: int, at: datetime | None
) -> dict | None:
    """XAI best-effort : un échec n'empêche jamais la suggestion (warning documenté)."""
    try:
        res = xai_service.explain_local(
            db,
            patient_id=patient_id,
            target=target,
            horizon_min=horizon_min,
            at=at,
            audience="clinician",
            persist=False,
            use_cache=False,
        )
        return res if res and res.get("calculable") else None
    except Exception:
        return None


def _resolve_predictions(
    db: Session,
    *,
    patient_id: uuid.UUID,
    prediction_id: uuid.UUID | None,
    target: str | None,
    horizon_min: int,
    at: datetime | None,
) -> tuple[list[dict], list[str]]:
    """Renvoie la liste de prédictions normalisées + d'éventuelles raisons (non calculable)."""
    reasons: list[str] = []

    if prediction_id is not None:
        pred = db.get(Prediction, prediction_id)
        if pred is None:
            raise RecommendationGenerationError("Prédiction introuvable.", "not_found")
        if pred.patient_id != patient_id:
            raise RecommendationGenerationError(
                "La prédiction n'appartient pas au patient ciblé.", "forbidden"
            )
        return [_normalize_db_prediction(pred)], reasons

    targets = [target] if target else list(config.TARGETS)
    preds: list[dict] = []
    for tgt in targets:
        res = inference_service.predict(
            db, patient_id=patient_id, target=tgt, horizon_min=horizon_min, at=at
        )
        norm = _normalize_ml(res)
        if not norm["calculable"]:
            reasons.append(f"{tgt}/{horizon_min}min: {res.get('reason') or 'non calculable'}")
        preds.append(norm)
    return preds, reasons


def _persist(
    db: Session,
    cand: GeneratedRecommendation,
    *,
    actor_user_id: uuid.UUID,
    ip,
    ua,
) -> Recommendation:
    rationale = {
        **(cand.rationale or {}),
        "message_patient": cand.message_patient,
        "message_clinician": cand.message_clinician,
    }
    rec = Recommendation(
        patient_id=cand.patient_id,
        prediction_id=cand.prediction_id,
        status=RecommendationStatus.pending.value,
        category=cand.category.value,
        message=cand.message_patient,
        rationale=rationale,
        priority=cand.priority,
        target=cand.target,
        horizon_min=cand.horizon_min,
        probability=cand.probability,
        model_name=cand.model_name,
        model_version=cand.model_version,
        rule_id=cand.rule_id,
        rule_version=cand.rule_version,
        trigger_name=cand.trigger_name,
        safety_level=cand.safety_level.value,
        xai_reliability_status=cand.xai_reliability_status,
        actionability_score=cand.actionability.overall_actionability_score,
        is_synthetic=True,
    )
    db.add(rec)
    db.flush()
    audit_service.record(
        db,
        action="recommendation.generated",
        actor_user_id=actor_user_id,
        resource_type="recommendation",
        resource_id=str(rec.id),
        event_metadata={
            "patient_id": str(rec.patient_id),
            "rule_id": rec.rule_id,
            "rule_version": rec.rule_version,
            "category": rec.category,
            "target": rec.target,
            "horizon_min": rec.horizon_min,
            "probability": rec.probability,
            "xai_reliability_status": rec.xai_reliability_status,
            "is_synthetic": rec.is_synthetic,
        },
        ip_address=ip,
        user_agent=ua,
    )
    return rec


def generate(
    db: Session,
    user: User,
    *,
    patient_id: uuid.UUID | None,
    prediction_id: uuid.UUID | None = None,
    target: str | None = None,
    horizon_min: int = 30,
    at: datetime | None = None,
    include_xai: bool = True,
    ip=None,
    ua=None,
) -> GenerateOutcome:
    """Génère des suggestions open-loop pour un patient (clinicien/admin uniquement)."""
    if target is not None and target not in config.TARGETS:
        raise RecommendationGenerationError(
            f"Cible inconnue : {target!r}.", "bad_request"
        )
    if horizon_min not in config.HORIZONS_MIN:
        raise RecommendationGenerationError(
            f"Horizon non supporté : {horizon_min}.", "bad_request"
        )

    # RBAC + ownership : clinicien/admin doivent cibler un patient_id explicite.
    scope_pid = resolve_read_scope(db, user, patient_id)

    preds, reasons = _resolve_predictions(
        db,
        patient_id=scope_pid,
        prediction_id=prediction_id,
        target=target,
        horizon_min=horizon_min,
        at=at,
    )

    outcome = GenerateOutcome(reasons=reasons)
    any_calculable = False

    for pred in preds:
        if not pred["calculable"] or pred["probability"] is None:
            continue
        any_calculable = True
        pred["patient_id"] = scope_pid

        xai = None
        if include_xai:
            xai = _safe_xai(
                db,
                patient_id=scope_pid,
                target=pred["target"],
                horizon_min=pred["horizon_min"],
                at=at,
            )

        candidates = engine.generate_candidates(prediction=pred, xai=xai)
        for cand in candidates:
            result = safety.validate(cand)
            if not result.passed:
                audit_service.record(
                    db,
                    action="recommendation.safety_blocked",
                    actor_user_id=user.id,
                    resource_type="recommendation",
                    resource_id=None,
                    event_metadata={
                        "patient_id": str(scope_pid),
                        "rule_id": cand.rule_id,
                        "violations": result.violations,
                    },
                    ip_address=ip,
                    user_agent=ua,
                )
                outcome.blocked.append(
                    {"rule_id": cand.rule_id, "violations": result.violations}
                )
                continue
            rec = _persist(db, cand, actor_user_id=user.id, ip=ip, ua=ua)
            outcome.generated.append(rec)

    outcome.calculable = any_calculable
    if not any_calculable:
        audit_service.record(
            db,
            action="recommendation.generate_skipped",
            actor_user_id=user.id,
            resource_type="recommendation",
            resource_id=None,
            event_metadata={"patient_id": str(scope_pid), "reasons": reasons},
            ip_address=ip,
            user_agent=ua,
        )

    db.commit()
    for rec in outcome.generated:
        db.refresh(rec)
    return outcome
