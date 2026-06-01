"""Tests Phase 5 — consolidation : OpenAPI durci, rate limit endpoints coûteux,
en-têtes sécurité, /ready, absence de secrets dans l'audit, invariants conservés.

Les invariants Phase 4.1 (source-of-truth des probabilités via `extra="forbid"`,
`clinical_justification_allowed` toujours `False`) sont déjà couverts en détail par
`test_recommendations_engine.py` ; on en ajoute ici une vérification de
non-régression légère au niveau du contrat HTTP / de l'utilitaire.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _ts(minutes_ago=10):
    return (
        datetime.now(timezone.utc).replace(microsecond=0)
        - timedelta(minutes=minutes_ago)
    ).isoformat()


# --- OpenAPI durci ----------------------------------------------------------
def test_openapi_accessible_and_hardened(client):
    res = client.get("/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    # Schéma de sécurité Bearer déclaré explicitement.
    schemes = schema.get("components", {}).get("securitySchemes", {})
    assert "BearerAuth" in schemes
    assert schemes["BearerAuth"]["scheme"] == "bearer"
    # Rappel de posture open-loop au niveau du document.
    assert "x-open-loop" in schema["info"]
    assert "open-loop" in schema["info"]["description"].lower()
    # Tags métiers présents.
    tag_names = {t["name"] for t in schema.get("tags", [])}
    assert {"auth", "ml", "xai", "recommendations"} <= tag_names


def test_docs_endpoint_served(client):
    assert client.get("/docs").status_code == 200


# --- En-têtes de sécurité ---------------------------------------------------
def test_security_headers_present(client):
    res = client.get("/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "no-referrer"


# --- /ready -----------------------------------------------------------------
def test_ready_reports_db(client):
    res = client.get("/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"


# --- Rate limit sur endpoints coûteux --------------------------------------
def test_predict_rate_limited(client):
    """Au-delà de la limite généreuse, /ml/predict renvoie 429 (anti-abus léger)."""
    tokens = register_and_login(client, role="patient", email="rl_pat@test.fr")
    h = _auth(tokens)
    limit = settings.rate_limit_predict_max
    statuses = []
    for _ in range(limit + 2):
        r = client.post(
            "/api/v1/ml/predict",
            json={"target": "hypo", "horizon_min": 30},
            headers=h,
        )
        statuses.append(r.status_code)
    assert statuses[0] == 200
    assert statuses[-1] == 429
    assert "retry-after" in {k.lower() for k in (
        client.post("/api/v1/ml/predict",
                    json={"target": "hypo", "horizon_min": 30}, headers=h).headers
    )}


# --- Absence de secrets dans l'audit ---------------------------------------
def test_no_secrets_in_audit(client):
    """Les écritures d'audit ne contiennent ni mot de passe ni jeton en clair."""
    password = "Strong1234!@"
    pat = register_and_login(client, role="patient", email="audit_pat@test.fr", password=password)
    clin = register_and_login(client, role="clinician", email="audit_clin@test.fr")
    logs = client.get("/api/v1/audit-logs", headers=_auth(clin))
    assert logs.status_code == 200
    blob = str(logs.json()).lower()
    assert password.lower() not in blob
    assert pat["access_token"] not in str(logs.json())
    assert pat["refresh_token"] not in str(logs.json())


# --- Invariant : XAI jamais une justification clinique ---------------------
def test_safety_rejects_xai_clinical_justification(client, db_session):
    """La safety refuse tout bloc XAI dont le verrou est altéré (non-régression).

    L'invariant `clinical_justification_allowed=False` est déjà couvert sur le
    chemin de génération ; on vérifie ici directement le garde-fou safety.
    """
    from app.recommendations import engine, safety
    from app.recommendations.schemas import (
        GeneratedRecommendation,
        RecommendationCategory,
        SafetyLevel,
    )

    reco = GeneratedRecommendation(
        patient_id=None,
        prediction_id=None,
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        message_patient="Surveillez votre glycémie selon vos habitudes.",
        message_clinician="Suggestion non prescriptive, à valider.",
        rationale={"xai": {"clinical_justification_allowed": True}},  # verrou altéré
        priority=2,
        target="hypo",
        horizon_min=30,
        probability=0.6,
        model_name="m",
        model_version="1",
        rule_id="R",
        rule_version="1",
        trigger_name="t",
        safety_level=SafetyLevel.monitoring,
        xai_reliability_status=None,
        open_loop_notice="ok",
        is_synthetic=True,
        actionability=engine.evaluation.score(
            category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
            safety_level=SafetyLevel.monitoring,
            probability=0.6,
            calibrated=False,
            xai_available=False,
            xai_reliability_status=None,
            safety_passed=True,
            message_len=50,
        ),
    )
    result = safety.validate(reco)
    assert result.passed is False
    assert "xai_clinical_justification_not_allowed" in result.violations


# --- Invariant : source-of-truth probabilité (spoof rejeté) ----------------
def test_generate_rejects_client_supplied_probability(client, db_session):
    """Injecter une probabilité côté client → 422 (extra='forbid')."""
    clin = register_and_login(client, role="clinician", email="sot_clin@test.fr")
    register_and_login(client, role="patient", email="sot_pat@test.fr")
    patients = client.get("/api/v1/patients", headers=_auth(clin)).json()
    pid = patients[0]["id"]
    res = client.post(
        "/api/v1/recommendations/generate",
        json={
            "patient_id": pid,
            "target": "hypo",
            "horizon_min": 30,
            "probability": 0.99,  # champ interdit
        },
        headers=_auth(clin),
    )
    assert res.status_code == 422


# --- Rate limit : autres endpoints coûteux --------------------------------
def test_xai_explain_rate_limited(client):
    """Au-delà de la limite, /xai/explain renvoie 429 (quel que soit le statut amont)."""
    tokens = register_and_login(client, role="patient", email="rl_xai@test.fr")
    h = _auth(tokens)
    statuses = []
    for _ in range(settings.rate_limit_xai_max + 2):
        r = client.post(
            "/api/v1/xai/explain",
            json={"target": "hypo", "horizon_min": 30},
            headers=h,
        )
        statuses.append(r.status_code)
    assert 429 in statuses
    assert statuses[-1] == 429


def test_generate_rate_limited(client):
    """Au-delà de la limite, /recommendations/generate renvoie 429."""
    clin = register_and_login(client, role="clinician", email="rl_gen_clin@test.fr")
    register_and_login(client, role="patient", email="rl_gen_pat@test.fr")
    pid = client.get("/api/v1/patients", headers=_auth(clin)).json()[0]["id"]
    h = _auth(clin)
    statuses = []
    for _ in range(settings.rate_limit_generate_max + 2):
        r = client.post(
            "/api/v1/recommendations/generate",
            json={"patient_id": pid, "target": "hypo", "horizon_min": 30},
            headers=h,
        )
        statuses.append(r.status_code)
    assert 429 in statuses
    assert statuses[-1] == 429


def test_costly_limiter_runs_before_auth(client):
    """Le garde-fou rate-limit s'exécute AVANT l'auth : sans jeton, on finit en 429
    (et non 401), preuve que la limite borne l'abus même non authentifié."""
    statuses = []
    for _ in range(settings.rate_limit_predict_max + 2):
        r = client.post(
            "/api/v1/ml/predict",
            json={"target": "hypo", "horizon_min": 30},
        )  # aucun header Authorization
        statuses.append(r.status_code)
    assert statuses[0] == 401  # d'abord refus d'auth
    assert statuses[-1] == 429  # puis blocage par le rate-limit (avant l'auth)
