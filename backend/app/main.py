"""Point d'entrée FastAPI MediAI Care (socle backend).

Prototype académique — aide à la décision OPEN-LOOP — non certifié.
"""
from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import get_db

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Socle backend MediAI Care — système d'aide à la décision OPEN-LOOP "
        "pour le suivi du diabète. Prototype académique non certifié. "
        "Données simulées uniquement."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "version": settings.app_version, "environment": settings.environment}


@app.get("/ready", tags=["meta"])
def ready(db: Session = Depends(get_db)):
    """Sonde de readiness : DB joignable + table critique accessible.

    Renvoie 200 {"status": "ready"} si OK, 503 sinon.
    """
    try:
        db.execute(text("SELECT 1"))
        db.execute(text("SELECT 1 FROM users LIMIT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="not ready",
        )
    return {"status": "ready"}


@app.get("/", tags=["meta"])
def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "disclaimer": "Prototype académique non certifié — aide à la décision open-loop — données simulées.",
        "docs": "/docs",
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)
