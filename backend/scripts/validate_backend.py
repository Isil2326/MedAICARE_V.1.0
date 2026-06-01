"""MediAI Care — smoke contractuel du backend (sans serveur lancé).

Vérifie les invariants Phase 5 sans dépendre d'un serveur en cours d'exécution :
- OpenAPI exposé avec le securityScheme Bearer et un marqueur open-loop ;
- endpoints clés présents ;
- /health et /ready répondent ;
- invariant XAI : `clinical_justification_allowed` jamais `true`.

Usage : cd backend && APP_ENV=test python scripts/validate_backend.py
Sortie : code 0 si tout est vert, 1 sinon. Aucune donnée écrite.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("JWT_SECRET_KEY", "validate-smoke-secret")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

checks: list[tuple[str, bool]] = []


def check(label: str, ok: bool) -> None:
    checks.append((label, bool(ok)))


# 1. OpenAPI : Bearer + marqueur open-loop
schema = app.openapi()
security_schemes = (schema.get("components", {}) or {}).get("securitySchemes", {})
check("openapi: BearerAuth présent", "BearerAuth" in security_schemes)
check("openapi: marqueur open-loop", "x-open-loop" in schema or "open-loop" in str(schema.get("info", {})).lower())

# 2. Endpoints clés présents
paths = schema.get("paths", {})
for ep in [
    "/api/v1/auth/login",
    "/api/v1/ml/predict",
    "/api/v1/xai/explain",
    "/api/v1/recommendations/generate",
]:
    check(f"endpoint présent: {ep}", ep in paths)

# 3. Santé / disponibilité
client = TestClient(app)
check("/health 200", client.get("/health").status_code == 200)
check("/ready répond", client.get("/ready").status_code in (200, 503))

# 4. Invariant XAI : clinical_justification_allowed jamais true (garde-fou safety)
try:
    from app.recommendations import engine, safety
    from app.recommendations.schemas import (
        GeneratedRecommendation,
        RecommendationCategory,
        SafetyLevel,
    )

    reco = GeneratedRecommendation(
        patient_id=None, prediction_id=None,
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        message_patient="Surveillez votre glycémie selon vos habitudes.",
        message_clinician="Suggestion non prescriptive, à valider.",
        rationale={"xai": {"clinical_justification_allowed": True}},
        priority=2, target="hypo", horizon_min=30, probability=0.6,
        model_name="m", model_version="1", rule_id="R", rule_version="1",
        trigger_name="t", safety_level=SafetyLevel.monitoring,
        xai_reliability_status=None, open_loop_notice="ok", is_synthetic=True,
        actionability=engine.evaluation.score(
            category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
            safety_level=SafetyLevel.monitoring, probability=0.6, calibrated=False,
            xai_available=False, xai_reliability_status=None, safety_passed=True,
            message_len=50,
        ),
    )
    res = safety.validate(reco)
    check(
        "safety refuse XAI justification clinique",
        (not res.passed) and ("xai_clinical_justification_not_allowed" in res.violations),
    )
except Exception as exc:  # pragma: no cover - smoke
    check(f"invariant XAI (exception: {exc})", False)


# Rapport
print("=== MediAI Care — smoke contractuel backend ===")
ok_all = True
for label, ok in checks:
    print(f"  [{'OK' if ok else 'FAIL'}] {label}")
    ok_all = ok_all and ok

print("=== RESULTAT :", "OK" if ok_all else "ECHEC", "===")
sys.exit(0 if ok_all else 1)
