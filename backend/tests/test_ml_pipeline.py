"""Tests d'intégration Phase 2 : dataset, registry, training, inference, endpoint.

Les artefacts sont redirigés vers un dossier temporaire (monkeypatch config) pour
ne pas polluer le dépôt. Données 100% synthétiques.
"""
from __future__ import annotations

import pytest

from datetime import datetime, timezone

from app.ml import config, dataset_builder, features_adapter, inference_service, registry, training
from app.models import AuditLog, CgmReading, Prediction
from tests.conftest import register_and_login
from tests.ml_helpers import get_patient, insert_synthetic_series, synthetic_points


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture()
def ml_artifacts(tmp_path, monkeypatch):
    """Redirige les chemins d'artefacts ML vers un tmp_path isolé."""
    monkeypatch.setattr(config, "ARTIFACTS_DIR", tmp_path)
    monkeypatch.setattr(config, "MODELS_DIR", tmp_path / "models")
    monkeypatch.setattr(config, "DATASETS_DIR", tmp_path / "datasets")
    monkeypatch.setattr(config, "METRICS_DIR", tmp_path / "metrics")
    monkeypatch.setattr(config, "REGISTRY_JSON", tmp_path / "registry.json")
    config.ensure_dirs()
    inference_service.clear_cache()
    yield tmp_path
    inference_service.clear_cache()


# --- Dataset builder --------------------------------------------------------
def test_build_dataframe_has_features_and_labels(client, db_session, ml_artifacts):
    db, _ = db_session
    register_and_login(client, role="patient", email="dsb@test.fr")
    patient = get_patient(db, "dsb@test.fr")
    insert_synthetic_series(db, patient.id)

    df = dataset_builder.build_dataframe(db)
    assert not df.empty
    for col in config.FEATURE_COLUMNS:
        assert col in df.columns
    assert config.label_column("hypo", 30) in df.columns
    meta = dataset_builder.dataset_meta(df)
    assert meta["n_rows"] == len(df)
    assert meta["is_synthetic"] is True


# --- Training + registry + inference ---------------------------------------
def test_train_target_registers_active_model(client, db_session, ml_artifacts):
    db, _ = db_session
    register_and_login(client, role="patient", email="train@test.fr")
    patient = get_patient(db, "train@test.fr")
    insert_synthetic_series(db, patient.id)

    res = training.train_target(
        db, target="hypo", horizon_min=30,
        model_keys=["expert_rules", "logreg", "xgboost"],
    )
    assert res["status"] == "ok", res
    assert res["test_metrics"]["n"] > 0

    active = registry.get_active("hypo", 30)
    assert active is not None
    assert active["is_active"] is True
    assert active["target"] == "hypo"

    # Inference open-loop : probabilité dans [0,1], aucun champ de décision.
    out = inference_service.predict(db, patient_id=patient.id, target="hypo", horizon_min=30)
    assert out["calculable"] is True
    assert 0.0 <= out["probability"] <= 1.0
    assert out["is_synthetic"] is True


def test_inference_not_calculable_without_model(client, db_session, ml_artifacts):
    db, _ = db_session
    register_and_login(client, role="patient", email="nomodel@test.fr")
    patient = get_patient(db, "nomodel@test.fr")
    insert_synthetic_series(db, patient.id)
    out = inference_service.predict(db, patient_id=patient.id, target="hyper", horizon_min=60)
    assert out["calculable"] is False
    assert out["probability"] is None
    assert out["reason"]


# --- Endpoint /ml/predict : RBAC + ownership + audit + persist -------------
def _train_for(db, patient_id):
    training.train_target(
        db, target="hypo", horizon_min=30, model_keys=["expert_rules", "logreg"]
    )


def test_predict_endpoint_patient(client, db_session, ml_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="pp@test.fr")
    patient = get_patient(db, "pp@test.fr")
    insert_synthetic_series(db, patient.id)
    _train_for(db, patient.id)
    inference_service.clear_cache()

    res = client.post(
        "/api/v1/ml/predict",
        json={"target": "hypo", "horizon_min": 30},
        headers=_auth(pat),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["calculable"] is True
    assert 0.0 <= body["probability"] <= 1.0
    assert "open_loop" in body["open_loop_notice"].lower() or "open-loop" in body["open_loop_notice"].lower()
    assert body["persisted"] is False


def test_predict_endpoint_unauthenticated(client, ml_artifacts):
    res = client.post("/api/v1/ml/predict", json={"target": "hypo", "horizon_min": 30})
    assert res.status_code == 401


def test_predict_endpoint_bad_horizon(client, db_session, ml_artifacts):
    pat = register_and_login(client, role="patient", email="bh@test.fr")
    res = client.post(
        "/api/v1/ml/predict", json={"target": "hypo", "horizon_min": 17}, headers=_auth(pat)
    )
    assert res.status_code == 400


def test_predict_endpoint_clinician_requires_patient_id(client, db_session, ml_artifacts):
    clin = register_and_login(client, role="clinician", email="mlc@test.fr")
    res = client.post(
        "/api/v1/ml/predict", json={"target": "hypo", "horizon_min": 30}, headers=_auth(clin)
    )
    assert res.status_code == 400


def test_predict_endpoint_persist_and_audit(client, db_session, ml_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="persist@test.fr")
    patient = get_patient(db, "persist@test.fr")
    insert_synthetic_series(db, patient.id)
    _train_for(db, patient.id)
    inference_service.clear_cache()

    res = client.post(
        "/api/v1/ml/predict",
        json={"target": "hypo", "horizon_min": 30, "persist": True},
        headers=_auth(pat),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["persisted"] is True
    assert body["prediction_id"]

    db.expire_all()
    preds = db.query(Prediction).filter(Prediction.patient_id == patient.id).all()
    assert len(preds) == 1
    assert preds[0].is_synthetic is True
    assert preds[0].predicted_event == "hypo"

    audits = db.query(AuditLog).filter(AuditLog.action == "ml.predict").all()
    assert len(audits) >= 1


def test_clinician_can_predict_with_patient_id(client, db_session, ml_artifacts):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="owned@test.fr")
    patient = get_patient(db, "owned@test.fr")
    insert_synthetic_series(db, patient.id)
    _train_for(db, patient.id)
    inference_service.clear_cache()

    clin = register_and_login(client, role="clinician", email="reader@test.fr")
    res = client.post(
        "/api/v1/ml/predict",
        json={"target": "hypo", "horizon_min": 30, "patient_id": str(patient.id)},
        headers=_auth(clin),
    )
    assert res.status_code == 200, res.text
    assert res.json()["calculable"] is True


# --- Gardes de sécurité Phase 2 --------------------------------------------
def test_ml_ignores_non_synthetic_data(client, db_session, ml_artifacts):
    """Le ML ne doit JAMAIS consommer de données non synthétiques (is_synthetic=False)."""
    db, _ = db_session
    register_and_login(client, role="patient", email="nonsynth@test.fr")
    patient = get_patient(db, "nonsynth@test.fr")
    # Insère UNIQUEMENT des lectures NON synthétiques.
    for p in synthetic_points(n_steps=96, step_min=15):
        db.add(CgmReading(
            patient_id=patient.id, ts=p.ts, glucose_mgdl=p.value,
            source="real", is_synthetic=False,
        ))
    db.commit()

    # Exclu de la liste des patients ML et des séries chargées.
    assert patient.id not in dataset_builder.list_patient_ids(db)
    series = features_adapter.load_series(db, patient.id)
    assert series["cgm"] == []


def test_predict_endpoint_naive_timestamp_is_coerced(client, db_session, ml_artifacts):
    """Un `at` naïf (sans tz) ne doit pas provoquer de 500 : coercition UTC déterministe."""
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="naive@test.fr")
    patient = get_patient(db, "naive@test.fr")
    insert_synthetic_series(db, patient.id)
    _train_for(db, patient.id)
    inference_service.clear_cache()

    naive_at = datetime.now().replace(microsecond=0).isoformat()  # pas de tz
    res = client.post(
        "/api/v1/ml/predict",
        json={"target": "hypo", "horizon_min": 30, "at": naive_at},
        headers=_auth(pat),
    )
    assert res.status_code == 200, res.text
    assert res.json()["calculable"] in (True, False)


def _reg_entry(model_id, *, model_name="logreg"):
    """Entrée de registre minimale (données 100% synthétiques)."""
    return {
        "model_id": model_id,
        "target": "hypo",
        "horizon_min": 30,
        "model_name": model_name,
        "model_version": "1.0.0",
        "artifact_path": f"/tmp/{model_id}.joblib",
        "calibrated": False,
        "feature_columns": list(config.FEATURE_COLUMNS),
        "metrics": {},
        "dataset_meta": {"is_synthetic": True},
    }


def test_train_evaluable_couple_is_active_with_status(client, db_session, ml_artifacts):
    """Un couple évaluable (positifs ET négatifs au test) est ACTIF et porte un
    evaluation_status non mono-classe, propagé au JSON et au miroir DB."""
    from app.repositories import ml_registry_repo

    db, _ = db_session
    register_and_login(client, role="patient", email="evcouple@test.fr")
    patient = get_patient(db, "evcouple@test.fr")
    insert_synthetic_series(db, patient.id)

    res = training.train_target(
        db, target="hypo", horizon_min=30, model_keys=["expert_rules", "logreg"]
    )
    assert res["status"] == "ok", res
    # La série de test traverse hypo et hyper -> couple évaluable, donc actif.
    assert res["activated"] is True
    assert res["evaluation_status"] != config.EVAL_STATUS_MONO_CLASS
    assert "test_bootstrap" in res

    active = registry.get_active("hypo", 30)
    assert active is not None and active["is_active"] is True
    assert active["evaluation_status"] == res["evaluation_status"]

    rows = [r for r in ml_registry_repo.list_all(db) if r.model_id == res["model_id"]]
    assert rows and rows[0].evaluation_status == res["evaluation_status"]


def test_train_mono_class_test_not_activated(client, db_session, ml_artifacts, monkeypatch):
    """Si le test est mono-classe, le modèle reste candidat (non actif) et le
    statut est not_evaluable_mono_class_test : aucune activation d'un non-évaluable."""
    db, _ = db_session
    register_and_login(client, role="patient", email="monocls@test.fr")
    patient = get_patient(db, "monocls@test.fr")
    insert_synthetic_series(db, patient.id)

    # Force un test mono-classe en neutralisant les positifs détectés au test.
    real_eval = training.evaluation.evaluate

    def _mono_eval(y_true, y_prob, **kw):
        rep = real_eval(y_true, y_prob, **kw)
        rep["positives"], rep["negatives"] = 0, int(rep.get("n", 0))
        rep["auroc"] = rep["auprc"] = None
        return rep

    monkeypatch.setattr(training.evaluation, "evaluate", _mono_eval)

    res = training.train_target(
        db, target="hypo", horizon_min=30, model_keys=["expert_rules", "logreg"]
    )
    assert res["status"] == "ok", res
    assert res["activated"] is False
    assert res["evaluation_status"] == config.EVAL_STATUS_MONO_CLASS
    # Pas d'actif pour ce couple (candidat documenté seulement).
    assert registry.get_active("hypo", 30) is None


def test_registry_json_db_lifecycle_parity(db_session, ml_artifacts):
    """Parité JSON canonique ↔ miroir DB sur le cycle de vie active/candidate/archived.

    Séquence : actif A → candidate B → actif C. Attendu (JSON ET DB identiques) :
    A archived, B candidate (inchangé), C active ; un seul actif par couple.
    """
    from app.repositories import ml_registry_repo

    db, _ = db_session
    registry.register(_reg_entry("A"), db=db, set_active=True)
    registry.register(_reg_entry("B", model_name="ebm"), db=db, set_active=False)
    registry.register(_reg_entry("C", model_name="random_forest"), db=db, set_active=True)

    json_status = {e["model_id"]: (e["is_active"], e["status"]) for e in registry.list_entries()}
    db_rows = ml_registry_repo.list_all(db)
    db_status = {r.model_id: (r.is_active, r.status) for r in db_rows}

    expected = {
        "A": (False, "archived"),
        "B": (False, "candidate"),
        "C": (True, "active"),
    }
    assert json_status == expected
    assert db_status == expected
    # Un seul modèle actif par couple, des deux côtés.
    assert sum(1 for v in json_status.values() if v[0]) == 1
    assert sum(1 for r in db_rows if r.is_active) == 1
