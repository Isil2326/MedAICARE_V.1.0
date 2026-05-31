"""Primitives de sécurité serveur : hachage de mot de passe (Argon2) + JWT.

- Hachage Argon2id (résistant GPU) — jamais de hash/salt côté client.
- Access token JWT court (15 min par défaut).
- Refresh token opaque (secret aléatoire) stocké haché en base → rotation
  et révocation côté serveur possibles.
"""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

_ph = PasswordHasher()


# --- Mots de passe ---
def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


# --- Access token JWT ---
def create_access_token(*, subject: str, role: str, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
        "jti": str(uuid.uuid4()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Décode et valide un access token. Lève jwt.PyJWTError si invalide."""
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("type de token inattendu")
    return payload


# --- Refresh token opaque ---
def generate_refresh_token() -> str:
    """Valeur opaque aléatoire transmise au client (jamais en clair en base)."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(raw: str) -> str:
    """Empreinte stockée en base ; permet révocation/rotation sans stocker le secret."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
