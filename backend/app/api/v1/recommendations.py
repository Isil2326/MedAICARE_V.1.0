"""Endpoints recommandations open-loop (génération + validation clinicien).

Open-loop strict : toute suggestion naît `pending` ; seul un clinicien/admin peut
l'arbitrer (approve/reject/modify). Aucune dose, aucune décision automatique. Un
patient ne lit que SES recommandations approuvées (`GET /recommendations/mine`).
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, require_role
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limiter
from app.models import User
from app.recommendations import service as generation_service
from app.recommendations.service import RecommendationGenerationError
from app.repositories import recommendation_repo
from app.repositories import user_repo
from app.schemas.recommendation import (
    GenerateRequest,
    GenerateResponse,
    ModifyRequest,
    RecommendationPublic,
    ReviewRequest,
)
from app.services import recommendation_service
from app.services.recommendation_service import RecommendationError

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

_GEN_ERROR_CODES = {
    "not_found": status.HTTP_404_NOT_FOUND,
    "forbidden": status.HTTP_403_FORBIDDEN,
    "bad_request": status.HTTP_400_BAD_REQUEST,
}

generate_rate_limit = rate_limiter(
    bucket="reco_generate",
    max_attempts=settings.rate_limit_generate_max,
    window_seconds=settings.rate_limit_generate_window,
)


@router.post(
    "/generate",
    response_model=GenerateResponse,
    dependencies=[Depends(generate_rate_limit)],
)
def generate_recommendations(
    body: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    """Génère des suggestions open-loop (probabilité → règles → safety → pending)."""
    try:
        outcome = generation_service.generate(
            db,
            user,
            patient_id=body.patient_id,
            prediction_id=body.prediction_id,
            target=body.target,
            horizon_min=body.horizon_min,
            at=body.at,
            include_xai=body.include_xai,
            ip=client_ip(request),
            ua=client_ua(request),
        )
    except RecommendationGenerationError as e:
        raise HTTPException(_GEN_ERROR_CODES.get(e.code, status.HTTP_400_BAD_REQUEST), e.message)
    # TimeseriesError (RBAC) : patient_id manquant pour clinicien, etc.
    except Exception as e:  # noqa: BLE001
        code = getattr(e, "code", None)
        if code in _GEN_ERROR_CODES:
            raise HTTPException(_GEN_ERROR_CODES[code], getattr(e, "message", str(e)))
        raise

    return GenerateResponse(
        generated=[RecommendationPublic.model_validate(r) for r in outcome.generated],
        blocked=outcome.blocked,
        calculable=outcome.calculable,
        reasons=outcome.reasons,
    )


@router.get("", response_model=list[RecommendationPublic])
def list_recommendations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
    status_filter: str | None = Query(default=None, alias="status"),
    patient_id: uuid.UUID | None = Query(default=None),
    category: str | None = Query(default=None),
    priority: int | None = Query(default=None),
    target: str | None = Query(default=None),
    horizon_min: int | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Liste filtrée — réservée clinicien/admin (RBAC)."""
    return recommendation_repo.list_filtered(
        db,
        status=status_filter,
        patient_id=patient_id,
        category=category,
        priority=priority,
        target=target,
        horizon_min=horizon_min,
        limit=limit,
        offset=offset,
    )


@router.get("/mine", response_model=list[RecommendationPublic])
def list_my_recommendations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("patient")),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Le patient ne lit QUE ses recommandations APPROUVÉES (open-loop)."""
    patient = user_repo.get_patient_by_user(db, user.id)
    if patient is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Aucun dossier patient associé.")
    return recommendation_repo.list_approved_for_patient(
        db, patient.id, limit=limit, offset=offset
    )


@router.get("/{rec_id}", response_model=RecommendationPublic)
def get_recommendation(
    rec_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("patient", "clinician", "admin")),
):
    """Détail : clinicien/admin → toute reco ; patient → seulement la sienne approuvée.

    Deny-by-default : seuls les rôles explicitement listés accèdent à cet endpoint.
    """
    rec = recommendation_repo.get(db, rec_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recommandation introuvable.")
    if user.role_name == "patient":
        patient = user_repo.get_patient_by_user(db, user.id)
        if patient is None or rec.patient_id != patient.id or rec.status != "approved":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé.")
    return rec


@router.post("/{rec_id}/approve", response_model=RecommendationPublic)
def approve(
    rec_id: uuid.UUID,
    body: ReviewRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    try:
        return recommendation_service.approve(
            db, rec_id, clinician_id=user.id, note=body.note,
            ip=client_ip(request), ua=client_ua(request),
        )
    except RecommendationError as e:
        code = status.HTTP_404_NOT_FOUND if e.code == "not_found" else status.HTTP_409_CONFLICT
        raise HTTPException(code, e.message)


@router.post("/{rec_id}/reject", response_model=RecommendationPublic)
def reject(
    rec_id: uuid.UUID,
    body: ReviewRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    try:
        return recommendation_service.reject(
            db, rec_id, clinician_id=user.id, note=body.note,
            ip=client_ip(request), ua=client_ua(request),
        )
    except RecommendationError as e:
        code = status.HTTP_404_NOT_FOUND if e.code == "not_found" else status.HTTP_409_CONFLICT
        raise HTTPException(code, e.message)


@router.post("/{rec_id}/modify", response_model=RecommendationPublic)
def modify(
    rec_id: uuid.UUID,
    body: ModifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    """Amende une suggestion pending (reste non prescriptive) → statut `modified`."""
    try:
        return recommendation_service.modify(
            db, rec_id, clinician_id=user.id, message=body.message, note=body.note,
            ip=client_ip(request), ua=client_ua(request),
        )
    except RecommendationError as e:
        if e.code == "not_found":
            code = status.HTTP_404_NOT_FOUND
        elif e.code == "safety_blocked":
            code = status.HTTP_400_BAD_REQUEST
        else:
            code = status.HTTP_409_CONFLICT
        raise HTTPException(code, e.message)
