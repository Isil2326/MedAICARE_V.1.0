"""Endpoints XAI clinique (Phase 3) — explicabilité open-loop.

- POST /api/v1/xai/explain  : explication LOCALE d'une prédiction (contributions de
  features, textes patient/clinicien). RBAC + ownership identiques à `ml.predict` :
  patient → son dossier ; clinician/admin → `patient_id` requis ; non authentifié → 401.
- GET  /api/v1/xai/global   : importance globale d'un modèle actif (lecture, RBAC
  clinician/admin recommandé). Aucune donnée patient.

OPEN-LOOP STRICT : aucune dose, aucune décision. Toute explication est auditée.
Données 100 % synthétiques. XAI = pondération du modèle, PAS causalité clinique.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limiter
from app.ml import config
from app.models import User
from app.services import audit_service
from app.services.timeseries_service import TimeseriesError, resolve_read_scope
from app.xai import service
from app.xai.schemas import (
    GlobalExplanation,
    LocalExplainRequest,
    LocalExplanation,
)

router = APIRouter(prefix="/xai", tags=["xai"])

_VALID_METHODS = {"auto", "shap", "lime", "native"}

explain_rate_limit = rate_limiter(
    bucket="xai_explain",
    max_attempts=settings.rate_limit_xai_max,
    window_seconds=settings.rate_limit_xai_window,
)


@router.post(
    "/explain",
    response_model=LocalExplanation,
    dependencies=[Depends(explain_rate_limit)],
)
def post_explain(
    payload: LocalExplainRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.horizon_min not in config.HORIZONS_MIN:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Horizon non supporté : {payload.horizon_min} (attendu {config.HORIZONS_MIN}).",
        )
    if payload.method not in _VALID_METHODS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Méthode XAI invalide : {payload.method!r} (attendu {sorted(_VALID_METHODS)}).",
        )
    if payload.target not in config.TARGETS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cible invalide : {payload.target!r} (attendu {config.TARGETS}).",
        )
    # RBAC + ownership : même résolution que la lecture des séries / l'inférence.
    try:
        scope_pid = resolve_read_scope(db, user, payload.patient_id)
    except TimeseriesError as e:
        code = {
            "forbidden": status.HTTP_403_FORBIDDEN,
            "not_found": status.HTTP_404_NOT_FOUND,
            "bad_request": status.HTTP_400_BAD_REQUEST,
        }.get(e.code, status.HTTP_409_CONFLICT)
        raise HTTPException(code, e.message)

    result = service.explain_local(
        db,
        patient_id=scope_pid,
        target=payload.target,
        horizon_min=payload.horizon_min,
        at=payload.at,
        method=payload.method,
        audience=payload.audience,
        top_k=payload.top_k,
        persist=payload.persist,
    )

    # Audit systématique de l'explication (open-loop, traçabilité).
    audit_service.record(
        db,
        action="xai.explain",
        actor_user_id=user.id,
        resource_type="xai_explanation",
        resource_id=str(result.get("explanation_id")) if result.get("explanation_id") else None,
        event_metadata={
            "patient_id": str(scope_pid),
            "target": result["target"],
            "horizon_min": result["horizon_min"],
            "calculable": result["calculable"],
            "xai_method": result["xai_method"],
            "method_fallback": result["method_fallback"],
            "model_name": result["model_name"],
            "persisted": result.get("explanation_id") is not None,
            "synthetic": True,
            "open_loop": True,
        },
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()

    return LocalExplanation(**result)


@router.get("/global", response_model=GlobalExplanation)
def get_global(
    request: Request,
    target: str = Query(..., description="hypo | hyper"),
    horizon_min: int = Query(..., description="30 | 60"),
    regenerate: bool = Query(False, description="Recalcule l'artefact global."),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if horizon_min not in config.HORIZONS_MIN:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Horizon non supporté : {horizon_min} (attendu {config.HORIZONS_MIN}).",
        )
    if target not in config.TARGETS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cible invalide : {target!r} (attendu {config.TARGETS}).",
        )
    # Lecture d'agrégat modèle (aucune donnée patient) : réservé clinician/admin.
    if user.role_name == "patient":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Explication globale réservée aux cliniciens/administrateurs.",
        )
    payload = service.get_global(db, target=target, horizon_min=horizon_min, regenerate=regenerate)

    audit_service.record(
        db,
        action="xai.global",
        actor_user_id=user.id,
        resource_type="xai_global",
        resource_id=f"{target}-{horizon_min}",
        event_metadata={
            "target": target, "horizon_min": horizon_min,
            "xai_method": payload.get("xai_method"),
            "synthetic": True, "open_loop": True,
        },
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()

    return GlobalExplanation(**payload)
