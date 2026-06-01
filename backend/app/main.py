"""Point d'entrée FastAPI MediAI Care (socle backend).

Prototype académique — aide à la décision OPEN-LOOP — non certifié.
"""
from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import get_db

API_DESCRIPTION = """
Socle backend **MediAI Care** — système d'aide à la décision **OPEN-LOOP**
pour le suivi du diabète.

> ⚠️ **Prototype académique non certifié** (mémoire de Master). Aucune
> certification MDR / IEC 62304 / ISO 13485 / HDS, RGPD non opérationnel.
> **Données 100 % simulées (`is_synthetic=True`)** — aucune donnée réelle.

**Posture clinique (invariants) :**
- **Open-loop strict** : l'API renvoie des *probabilités* et des *suggestions*,
  jamais une dose, une décision ou une action automatique.
- **Validation clinicien obligatoire** : toute recommandation naît `pending` et
  doit être arbitrée par un clinicien/admin (`approve` / `reject` / `modify`).
- **XAI = support d'affichage/audit uniquement**, jamais une justification
  clinique (`clinical_justification_allowed` toujours `false`).

**Authentification :** JWT Bearer (access court ~15 min) + refresh opaque
(rotation + détection de réutilisation). Cliquer sur **Authorize** et fournir
`Bearer <access_token>` obtenu via `POST /api/v1/auth/login`.
"""

openapi_tags = [
    {"name": "meta", "description": "Santé, readiness, racine — sondes non authentifiées."},
    {"name": "auth", "description": "Inscription, login, refresh, logout (JWT)."},
    {"name": "patients", "description": "Dossiers patients (RBAC + ownership)."},
    {"name": "timeseries", "description": "Ingestion/lecture CGM, insuline, repas, activité (synthétique)."},
    {"name": "ml", "description": "Inférence ML open-loop — probabilité de risque, jamais une décision."},
    {"name": "xai", "description": "Explicabilité (support d'affichage/audit) — jamais une justification clinique."},
    {"name": "recommendations", "description": "Suggestions open-loop soumises à validation clinicien."},
    {"name": "audit", "description": "Journal d'audit chaîné (lecture clinicien/admin)."},
]

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=API_DESCRIPTION,
    openapi_tags=openapi_tags,
    contact={"name": "MediAI Care — prototype académique"},
    license_info={"name": "Académique / non certifié"},
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


def custom_openapi():
    """Schéma OpenAPI durci : déclare le schéma de sécurité Bearer (JWT).

    Les endpoints protégés utilisent `HTTPBearer`, déjà reflété par FastAPI.
    On ajoute ici un `BearerAuth` (bearerFormat=JWT) explicite + un rappel de
    la posture open-loop / données synthétiques au niveau du document.
    """
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=openapi_tags,
    )
    components = schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT access token (`POST /api/v1/auth/login`).",
    }
    schema["info"]["x-open-loop"] = (
        "Open-loop strict — probabilités et suggestions uniquement, jamais une "
        "dose/décision/action automatique. XAI = affichage/audit, pas une "
        "justification clinique. Données 100% synthétiques (is_synthetic=True). "
        "Prototype académique non certifié."
    )
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi
