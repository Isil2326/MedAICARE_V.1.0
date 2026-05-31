"""Endpoints recommandations open-loop (validation clinicien)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, require_role
from app.core.database import get_db
from app.models import User
from app.repositories import recommendation_repo
from app.schemas.recommendation import RecommendationPublic, ReviewRequest
from app.services import recommendation_service
from app.services.recommendation_service import RecommendationError

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationPublic])
def list_recommendations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    return recommendation_repo.list_by_status(
        db, status=status_filter, limit=limit, offset=offset
    )


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
