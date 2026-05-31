"""Accès données refresh tokens (sessions) — rotation et révocation."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import RefreshToken


def store_refresh_token(
    db: Session,
    *,
    user_id: uuid.UUID,
    token_hash: str,
    expires_at: datetime,
    rotated_from: str | None = None,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> RefreshToken:
    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        rotated_from=rotated_from,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(rt)
    db.flush()
    return rt


def get_by_hash(db: Session, token_hash: str) -> RefreshToken | None:
    return db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))


def revoke(db: Session, rt: RefreshToken) -> None:
    rt.revoked = True
    rt.revoked_at = datetime.now(timezone.utc)
    db.flush()


def revoke_if_active(db: Session, token_id: uuid.UUID) -> bool:
    """Révoque un token de façon atomique. Renvoie True si CE call a effectué
    la révocation, False si le token était déjà révoqué (course concurrente).

    Permet une rotation à usage unique sûre : seul le premier appelant gagne.
    """
    result = db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token_id, RefreshToken.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(timezone.utc))
    )
    db.flush()
    return (result.rowcount or 0) == 1


def revoke_all_for_user(db: Session, user_id: uuid.UUID) -> int:
    result = db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(timezone.utc))
    )
    db.flush()
    return result.rowcount or 0


def is_usable(rt: RefreshToken) -> bool:
    if rt.revoked:
        return False
    expires = rt.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires > datetime.now(timezone.utc)
