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

# ===========================================================================
# Phase 3.1 — Sécurisation sémantique XAI (statut fiabilité, warnings, scénarios)
# ===========================================================================
from app.xai import reliability  # noqa: E402


# --- Module reliability (pur, déterministe) --------------------------------
def test_reliability_synthetic_and_calibration_warnings():
    out = reliability.assess(synthetic_only=True, explains="modèle non calibré")
    txt = " ".join(out["xai_warnings"]).lower()
    assert "synthétiques" in txt
    assert "non calibré" in txt
    # Sans autre signal de doute : reste « debug modèle ».
    assert out["xai_reliability_status"] == "reliable_for_model_debug"
    assert any("decision engine" in s.lower() for s in out["semantic_limitations"])


def test_reliability_fallback_escalates_to_caution():
    out = reliability.assess(method_fallback=True)
    assert out["xai_reliability_status"] == "caution_semantic_limits"
    assert any("repli" in w.lower() for w in out["xai_warnings"])


def test_reliability_physio_low_caution_and_zero_not_reliable():
    low = reliability.assess(physio_congruence=0.3)
    assert low["xai_reliability_status"] == "caution_semantic_limits"
    zero = reliability.assess(physio_congruence=0.0)
    assert zero["xai_reliability_status"] == "not_reliable_for_clinical_interpretation"
    assert any("congruence physiologique" in w.lower() for w in zero["xai_warnings"])


def test_reliability_lime_low_stability_warns():
    out = reliability.assess(xai_method="lime", stability=0.2)
    assert out["xai_reliability_status"] == "caution_semantic_limits"
    assert any("lime" in w.lower() for w in out["xai_warnings"])
    # Stabilité haute : pas d'escalade depuis ce signal.
    ok = reliability.assess(xai_method="lime", stability=0.9)
    assert all("lime" not in w.lower() for w in ok["xai_warnings"])


def test_reliability_indeterminate_direction_warns():
    out = reliability.assess(has_indeterminate_direction=True)
    assert out["xai_reliability_status"] == "caution_semantic_limits"


# --- Réponse locale enrichie -----------------------------------------------
def test_local_response_carries_reliability_fields(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "rel_loc@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc),
    )
    assert res["xai_reliability_status"] in {
        "reliable_for_model_debug", "caution_semantic_limits",
        "not_reliable_for_clinical_interpretation",
    }
    # Données synthétiques + modèle non calibré → au moins deux warnings.
    assert len(res["xai_warnings"]) >= 2
    assert any("synthétiques" in w.lower() for w in res["xai_warnings"])
    assert res["calibration_notice"] and res["synthetic_data_notice"]
    assert any("decision engine" in s.lower() for s in res["semantic_limitations"])


def test_local_endpoint_exposes_reliability(client, db_session, xai_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="rel_ep@test.fr")
    patient = get_patient(db, "rel_ep@test.fr")
    insert_synthetic_series(db, patient.id)
    training.train_target(db, target="hypo", horizon_min=30,
                          model_keys=["expert_rules", "logreg"])
    inference_service.clear_cache(); cache.clear()
    res = client.post(
        "/api/v1/xai/explain", json={"target": "hypo", "horizon_min": 30},
        headers=_auth(pat),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert "xai_reliability_status" in body
    assert isinstance(body["xai_warnings"], list) and body["xai_warnings"]
    assert isinstance(body["semantic_limitations"], list)


# --- Réponse globale : directions clarifiées + reliability ------------------
def test_global_directions_clarified_and_reliability(client, db_session, xai_artifacts):
    db, _ = db_session
    _setup_patient_model(client, db, "rel_glob@test.fr",
                         model_keys=["expert_rules", "logreg", "xgboost"])
    payload = service.get_global(db, target="hypo", horizon_min=30)
    assert payload["direction_semantics"]
    assert "xai_reliability_status" in payload
    # Aucune direction globale présentée comme « augmente/diminue » brute.
    for f in payload["top_features"]:
        assert f["direction"] in {
            "not_globalizable", "aggregated_signed_effect",
            "context_dependent", "local_only", "indéterminé", "mixte",
        }
    # Métriques d'évaluation réelles embarquées (ou None, jamais inventées).
    assert "evaluation" in payload


# --- Cas hypo 30 : congruence faible → prudence (via module pur) ------------
def test_hypo30_low_congruence_flagged_with_caution():
    # Reproduit le cas réel rapporté (physio=0.000) sans fabriquer de métrique.
    out = reliability.assess(synthetic_only=True, physio_congruence=0.0,
                             explains="modèle non calibré")
    assert out["xai_reliability_status"] == "not_reliable_for_clinical_interpretation"
    assert any("analyse technique" in w.lower() for w in out["xai_warnings"])


# --- Scénarios canoniques (cohérence sémantique, PAS validation clinique) ---
def _build_row(db, overrides: dict):
    import numpy as np
    from app.xai import utils
    cols = list(config.FEATURE_COLUMNS)
    row = utils.median_reference(db).astype(float).copy()
    for name, val in overrides.items():
        row[cols.index(name)] = val
    return row, cols


def test_canonical_scenario_hyper(client, db_session, xai_artifacts):
    """Glycémie haute + pente montante + post-prandial → P(hyper) ne baisse pas."""
    import numpy as np
    from app.xai import shap_explainer, utils
    db, _ = db_session
    _setup_patient_model(client, db, "scen_hyper@test.fr", target="hyper", horizon=30,
                         model_keys=["expert_rules", "logreg", "xgboost"])
    model, entry = utils.load_active_model("hyper", 30)
    inner = utils.unwrap(model)
    high, cols = _build_row(db, {"cgm_mean_30": 260.0, "cgm_mean_60": 250.0,
                                 "cgm_slope_30": 2.5, "post_prandial": 1.0})
    low, _ = _build_row(db, {"cgm_mean_30": 90.0, "cgm_mean_60": 95.0,
                             "cgm_slope_30": -1.0, "post_prandial": 0.0})
    p_high = float(np.asarray(inner.predict_proba(high.reshape(1, -1))).reshape(-1)[0])
    p_low = float(np.asarray(inner.predict_proba(low.reshape(1, -1))).reshape(-1)[0])
    assert p_high >= p_low  # le risque hyper va dans le sens attendu
    # Au moins un facteur glycémique plausible dans l'attribution.
    import pandas as pd
    X = pd.DataFrame([high], columns=cols)
    contribs = shap_explainer.explain_local(model, entry, X, db).get("contributions")
    top = set(np.argsort(-np.abs(contribs))[:6].tolist())
    plausible = {cols.index(c) for c in ("cgm_mean_30", "cgm_mean_60", "cgm_slope_30",
                                         "cgm_delta_30", "cgm_delta_60")}
    assert top & plausible


def test_canonical_scenario_hypo(client, db_session, xai_artifacts):
    """Glycémie basse + pente descendante + nuit → P(hypo) ne baisse pas."""
    import numpy as np
    from app.xai import shap_explainer, utils
    db, _ = db_session
    _setup_patient_model(client, db, "scen_hypo@test.fr", target="hypo", horizon=30,
                         model_keys=["expert_rules", "logreg", "xgboost"])
    model, entry = utils.load_active_model("hypo", 30)
    inner = utils.unwrap(model)
    low, cols = _build_row(db, {"cgm_mean_30": 62.0, "cgm_mean_60": 70.0,
                                "cgm_slope_30": -2.5, "is_night": 1.0})
    high, _ = _build_row(db, {"cgm_mean_30": 160.0, "cgm_mean_60": 155.0,
                              "cgm_slope_30": 1.5, "is_night": 0.0})
    p_low = float(np.asarray(inner.predict_proba(low.reshape(1, -1))).reshape(-1)[0])
    p_high = float(np.asarray(inner.predict_proba(high.reshape(1, -1))).reshape(-1)[0])
    assert p_low >= p_high  # risque hypo plus élevé quand la glycémie est basse
    import pandas as pd
    X = pd.DataFrame([low], columns=cols)
    contribs = shap_explainer.explain_local(model, entry, X, db).get("contributions")
    top = set(np.argsort(-np.abs(contribs))[:6].tolist())
    plausible = {cols.index(c) for c in ("cgm_mean_30", "cgm_mean_60", "cgm_slope_30",
                                         "cgm_delta_30", "cgm_delta_60")}
    assert top & plausible


# --- XAI n'est PAS un moteur de décision -----------------------------------
def test_xai_not_a_decision_engine(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "nodec@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc),
    )
    for forbidden_field in ("dose", "decision", "recommendation", "recommandation", "action"):
        assert forbidden_field not in res
    # Garde-fou explicite présent dans les limites sémantiques.
    assert any("decision engine" in s.lower() for s in res["semantic_limitations"])


# --- Persistance des champs de fiabilité -----------------------------------
def test_reliability_persisted(client, db_session, xai_artifacts):
    db, _ = db_session
    patient = _setup_patient_model(client, db, "relpers@test.fr")
    res = service.explain_local(
        db, patient_id=patient.id, target="hypo", horizon_min=30,
        at=datetime.now(timezone.utc), persist=True,
    )
    db.commit()
    row = db.get(XaiExplanation, res["explanation_id"])
    assert row.xai_reliability_status == res["xai_reliability_status"]
    assert isinstance(row.xai_warnings, list) and row.xai_warnings


# --- Texte patient renforcé (anti-ambiguïté, non causal) -------------------
def test_patient_text_reinforced_non_causal():
    feats = [
        {"feature": "cgm_mean_30", "value": 62.0, "contribution": 0.4, "direction": "augmente"},
    ]
    txt = translation.build_patient_text(
        target="hypo", horizon_min=30, probability=0.7, risk_label="élevé",
        top_features=feats, calculable=True, reason=None,
    ).lower()
    assert "ne modifiez jamais votre traitement sans avis médical" in txt
    assert "cause médicale" in txt  # explicitement nié dans la phrase
    assert "le modèle a surtout utilisé" in txt
    for term in FORBIDDEN_TERMS:
        assert term.lower() not in txt
