"""Rate limiting minimal — protection anti-bruteforce sur login/refresh.

Implémentation en mémoire (fenêtre glissante par IP + bucket), suffisante pour
un prototype mono-instance sur Replit. Thread-safe via un verrou.

Redis-ready : pour un déploiement multi-instances, remplacer `InMemoryRateLimiter`
par une implémentation respectant la même interface `hit(key, max_attempts,
window_seconds) -> (allowed, retry_after)` adossée à Redis (INCR + EXPIRE, ou
script Lua pour l'atomicité). Le reste du code (dépendance FastAPI) reste inchangé.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Fenêtre glissante simple : conserve les horodatages récents par clé."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(
        self, key: str, max_attempts: int, window_seconds: int, *, now: float | None = None
    ) -> tuple[bool, int]:
        """Enregistre une tentative. Renvoie (autorisé, secondes avant réessai)."""
        now = now if now is not None else time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            dq = self._hits[key]
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) >= max_attempts:
                retry_after = int(dq[0] + window_seconds - now) + 1
                return False, max(retry_after, 1)
            dq.append(now)
            return True, 0

    def reset(self) -> None:
        """Vide tout l'état (utilisé entre les tests)."""
        with self._lock:
            self._hits.clear()


limiter = InMemoryRateLimiter()


def rate_limiter(*, bucket: str, max_attempts: int, window_seconds: int):
    """Fabrique une dépendance FastAPI qui limite le débit par IP + bucket."""

    def dependency(request: Request) -> None:
        host = request.client.host if request.client else "unknown"
        key = f"{bucket}:{host}"
        allowed, retry_after = limiter.hit(key, max_attempts, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Trop de tentatives. Réessayez plus tard.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency
