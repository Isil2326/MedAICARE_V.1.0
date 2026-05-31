"""Endpoints de consultation du journal d'audit (clinicien/admin)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models import User
from app.repositories import audit_repo
from app.schemas.audit import AuditChainVerification, AuditLogPublic
from app.services import audit_service

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogPublic])
def list_audit_logs(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    return audit_repo.list_entries(db, limit=limit, offset=offset)


@router.get("/verify", response_model=AuditChainVerification)
def verify_chain(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    return audit_service.verify_chain(db)
