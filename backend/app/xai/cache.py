"""Cache mémoire des explications XAI (l'explicabilité peut être coûteuse).

Clé = (model_id, patient_id, target, horizon, at, method, audience, features_hash).
TTL configurable ; invalidation par model_id (lors d'un réentraînement/réactivation).
Process-local et best-effort : ce N'EST PAS une source de vérité (démo/prototype).
"""
from __future__ import annotations

import hashlib
import json
import time
from threading import Lock
from typing import Any

DEFAULT_TTL_SECONDS = 900  # 15 min

_STORE: dict[str, tuple[float, Any]] = {}
_LOCK = Lock()


def features_hash(row: dict) -> str:
    """Hash stable d'un vecteur de features (indépendant de l'ordre des clés)."""
    payload = json.dumps(row, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def make_key(
    *,
    model_id: str,
    patient_id: str,
    target: str,
    horizon_min: int,
    at: str,
    method: str,
    audience: str,
    feats_hash: str,
) -> str:
    raw = f"{model_id}|{patient_id}|{target}|{horizon_min}|{at}|{method}|{audience}|{feats_hash}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get(key: str, *, ttl: int = DEFAULT_TTL_SECONDS) -> Any | None:
    with _LOCK:
        item = _STORE.get(key)
        if item is None:
            return None
        ts, value = item
        if (time.time() - ts) > ttl:
            _STORE.pop(key, None)
            return None
        return value


def set(key: str, value: Any) -> None:
    with _LOCK:
        _STORE[key] = (time.time(), value)


def invalidate_model(model_id: str) -> int:
    """Invalide toutes les entrées portant ce model_id (clé hashée → on purge tout).

    Le hash de clé empêche un filtrage ciblé : on vide donc le cache entier, ce qui
    est correct et sûr (au pire un recalcul). Renvoie le nombre d'entrées purgées.
    """
    with _LOCK:
        n = len(_STORE)
        _STORE.clear()
        return n


def clear() -> None:
    with _LOCK:
        _STORE.clear()


def size() -> int:
    with _LOCK:
        return len(_STORE)
