"""Tests Phase 3 — XAI clinique (explicabilité open-loop, données synthétiques).

Artefacts ML + XAI redirigés vers tmp_path (aucune pollution du dépôt). Modèles
entraînés en mémoire sur séries synthétiques. Vérifie : chargement modèle, global,
local, RBAC/ownership, validations, traductions non prescriptives, audit, cache,
métriques d'évaluation, persistance. Aucune donnée réelle (is_synthetic=True).
"""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.ml import config, inference_service, registry, training
from app.models import AuditLog
from app.models.xai_explanation import XaiExplanation
from app.xai import (
    cache,
    evaluation,
    global_explanations,
    service,
    translation,
)
from app.xai.translation import FORBIDDEN_TERMS
from tests.conftest import register_and_login
from tests.ml_helpers import get_patient, insert_synthetic_series


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture()
def xai_artifacts(tmp_path, monkeypatch):
    """Redirige artefacts ML/XAI vers tmp_path isolé + reset caches."""
    monkeypatch.setattr(config, "ARTIFACTS_DIR", tmp_path)
    monkeypatch.setattr(config, "MODELS_DIR", tmp_path / "models")
    monkeypatch.setattr(config, "DATASETS_DIR", tmp_path / "datasets")
    monkeypatch.setattr(config, "METRICS_DIR", tmp_path / "metrics")
    monkeypatch.setattr(config, "REGISTRY_JSON", tmp_path / "registry.json")
    config.ensure_dirs()
    inference_service.clear_cache()
    cache.clear()
    yield tmp_path
    inference_service.clear_cache()
    cache.clear()


def _setup_patient_model(client, db, email, *, target="hypo", horizon=30,
                         model_keys=("expert_rules", "logreg", "xgboost")):
    register_and_login(client, role="patient", email=email)
    patient = get_patient(db, email)
    insert_synthetic_series(db, patient.id)
    res = training.train_target(
        db, target=target, horizon_min=horizon, model_keys=list(model_keys)
    )
    assert res["status"] == "ok", res
    inference_service.clear_cache()
    cache.clear()
    return patient


# --- Chargement modèle actif -----------------------------------------------
def test_load_active_model(client, db_session, xai_artifacts):
    from app.xai import utils
    db, _ = db_session
    _setup_patient_model(client, db, "load@test.fr")
    model, entry = utils.load_active_model("hypo", 30)
    assert model is not None
    assert entry is not None
    assert entry["target"] == "hypo"


# --- Explication globale ----------------------------------------------------
def test_global_explanation(client, db_session, xai_artifacts):
    db, _ = db_session
    _setup_patient_model(client, db, "glob@test.fr")
    payload = service.get_global(db, target="hypo", horizon_min=30)
    assert payload["target"] == "hypo"
    assert payload["synthetic_only"] is True
    assert payload["model_name"] is not None
    # Artefact écrit puis relu (deuxième appel sert le JSON).
    again = service.get_global(db, target="hypo", horizon_min=30)
    assert again["target"] == "hypo"


# --- Explication locale -----------------------------------------------------
def test_local_explanation_calculable(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "loc@test.fr")
    at = datetime.now(timezone.utc)
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30, at=at,
    )
    assert res["calculable"] is True
    assert 0.0 <= res["probability"] <= 1.0
    assert res["synthetic_only"] is True
    assert res["xai_method"] in {"shap", "lime", "native", "occlusion"}
    assert isinstance(res["top_features"], list) and res["top_features"]
    # open-loop : aucun champ de dose/décision dans le résultat.
    assert "dose" not in res


# --- Endpoint /xai/explain : RBAC + ownership + validations -----------------
def test_explain_endpoint_patient(client, db_session, xai_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="ep@test.fr")
    patient = get_patient(db, "ep@test.fr")
    insert_synthetic_series(db, patient.id)
    training.train_target(db, target="hypo", horizon_min=30,
                          model_keys=["expert_rules", "logreg"])
    inference_service.clear_cache(); cache.clear()

    res = client.post(
        "/api/v1/xai/explain",
        json={"target": "hypo", "horizon_min": 30, "audience": "patient"},
        headers=_auth(pat),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["calculable"] is True
    assert body["synthetic_only"] is True
    assert "open" in body["open_loop_notice"].lower()


def test_explain_endpoint_unauthenticated(client, xai_artifacts):
    res = client.post("/api/v1/xai/explain", json={"target": "hypo", "horizon_min": 30})
    assert res.status_code == 401


def test_explain_endpoint_bad_horizon(client, db_session, xai_artifacts):
    pat = register_and_login(client, role="patient", email="bh@test.fr")
    res = client.post(
        "/api/v1/xai/explain", json={"target": "hypo", "horizon_min": 17},
        headers=_auth(pat),
    )
    assert res.status_code == 400


def test_explain_endpoint_bad_method(client, db_session, xai_artifacts):
    pat = register_and_login(client, role="patient", email="bm@test.fr")
    res = client.post(
        "/api/v1/xai/explain",
        json={"target": "hypo", "horizon_min": 30, "method": "magic"},
        headers=_auth(pat),
    )
    assert res.status_code == 400


def test_explain_endpoint_clinician_requires_patient_id(client, db_session, xai_artifacts):
    clin = register_and_login(client, role="clinician", email="ec@test.fr")
    res = client.post(
        "/api/v1/xai/explain", json={"target": "hypo", "horizon_min": 30},
        headers=_auth(clin),
    )
    assert res.status_code == 400


def test_explain_endpoint_non_owner_forbidden(client, db_session, xai_artifacts):
    db, _ = db_session
    register_and_login(client, role="patient", email="owner@test.fr")
    owner = get_patient(db, "owner@test.fr")
    intruder = register_and_login(client, role="patient", email="intruder@test.fr")
    res = client.post(
        "/api/v1/xai/explain",
        json={"target": "hypo", "horizon_min": 30, "patient_id": str(owner.id)},
        headers=_auth(intruder),
    )
    assert res.status_code in (403, 404)


# --- Global endpoint réservé clinicien/admin -------------------------------
def test_global_endpoint_patient_forbidden(client, db_session, xai_artifacts):
    pat = register_and_login(client, role="patient", email="gp@test.fr")
    res = client.get(
        "/api/v1/xai/global", params={"target": "hypo", "horizon_min": 30},
        headers=_auth(pat),
    )
    assert res.status_code == 403


# --- Traductions : patient non prescriptive, clinicien technique -----------
def test_patient_text_not_prescriptive(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "tp@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc), audience="patient",
    )
    text = (res["explanation_text_patient"] + " " + res["explanation_text_clinician"]).lower()
    for term in FORBIDDEN_TERMS:
        assert term.lower() not in text, f"Terme prescriptif/causal interdit présent : {term}"


def test_translation_builders_no_forbidden_terms():
    # Construction directe sur contributions factices : aucun terme interdit.
    feats = [
        {"feature": "cgm_last", "value": 65.0, "contribution": 0.4, "direction": "augmente"},
        {"feature": "cgm_slope_30", "value": -1.2, "contribution": 0.2, "direction": "augmente"},
    ]
    patient_txt = translation.build_patient_text(
        target="hypo", horizon_min=30, probability=0.7, risk_label="élevé",
        top_features=feats, calculable=True, reason=None,
    )
    clin_txt = translation.build_clinician_text(
        target="hypo", horizon_min=30, probability=0.7, risk_label="élevé",
        top_features=feats, method="shap", explains="modèle non calibré",
        calculable=True, reason=None, fallback=False,
    )
    blob = (patient_txt + " " + clin_txt).lower()
    for term in FORBIDDEN_TERMS:
        assert term.lower() not in blob


# --- Audit ------------------------------------------------------------------
def test_explain_audited(client, db_session, xai_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="au@test.fr")
    patient = get_patient(db, "au@test.fr")
    insert_synthetic_series(db, patient.id)
    training.train_target(db, target="hypo", horizon_min=30,
                          model_keys=["expert_rules", "logreg"])
    inference_service.clear_cache(); cache.clear()

    client.post(
        "/api/v1/xai/explain", json={"target": "hypo", "horizon_min": 30},
        headers=_auth(pat),
    )
    logs = db.query(AuditLog).filter(AuditLog.action == "xai.explain").all()
    assert len(logs) >= 1


# --- Cache hit/miss ---------------------------------------------------------
def test_cache_hit_miss(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "ca@test.fr")
    at = datetime.now(timezone.utc)
    first = service.explain_local(db, patient_id=patient.id, target="hypo",
                                  horizon_min=30, at=at)
    assert first["cached"] is False
    second = service.explain_local(db, patient_id=patient.id, target="hypo",
                                   horizon_min=30, at=at)
    assert second["cached"] is True


def test_persist_on_cache_hit(client, db_session, xai_artifacts):
    """persist=True doit écrire même quand le résultat vient du cache (traçabilité)."""
    db, _ = db_session
    patient = _setup_patient_model(client, db, "pch@test.fr")
    at = datetime.now(timezone.utc)
    first = service.explain_local(db, patient_id=patient.id, target="hypo",
                                  horizon_min=30, at=at)
    assert first["cached"] is False
    second = service.explain_local(db, patient_id=patient.id, target="hypo",
                                   horizon_min=30, at=at, persist=True)
    db.commit()
    assert second["cached"] is True
    assert second["explanation_id"] is not None
    assert db.get(XaiExplanation, second["explanation_id"]) is not None


# --- Persistance ------------------------------------------------------------
def test_persist_explanation(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "pe@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc), persist=True,
    )
    db.commit()
    assert res["explanation_id"] is not None
    row = db.get(XaiExplanation, res["explanation_id"])
    assert row is not None
    assert row.is_synthetic is True
    assert row.target == "hypo"


# --- Évaluation XAI : métriques réelles ou None -----------------------------
def test_evaluation_metrics(client, db_session, xai_artifacts):
    db, _ = db_session
    _setup_patient_model(client, db, "ev@test.fr")
    out = evaluation.evaluate_couple(db, target="hypo", horizon_min=30)
    assert out["synthetic_only"] is True
    # Chaque métrique a une 'value' (float ou None) — jamais inventée.
    for key in ("stability", "deletion", "agreement", "physio_congruence"):
        assert "value" in out[key]
        v = out[key]["value"]
        assert v is None or isinstance(v, float)


def test_no_real_data_in_explanation(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "sd@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc), persist=True,
    )
    db.commit()
    row = db.get(XaiExplanation, res["explanation_id"])
    assert row.is_synthetic is True
