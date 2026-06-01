"""Tests Phase 4 — moteur de recommandation OPEN-LOOP.

Deux niveaux :
- moteur PUR (engine/rules/safety/scoring/workflow) testé directement avec des
  prédictions/XAI fabriquées (pas besoin de modèle entraîné) ;
- endpoints/RBAC/workflow/audit testés via une Prediction pré-insérée + /generate
  (include_xai=false) car l'environnement de test SQLite n'a aucun modèle actif.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models import AuditLog, Patient, Prediction, Recommendation
from app.models.clinical import RecommendationStatus
from app.recommendations import engine, safety, workflow
from app.recommendations.schemas import GeneratedRecommendation, RecommendationCategory, SafetyLevel
from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# --------------------------------------------------------------------------- #
# Moteur PUR
# --------------------------------------------------------------------------- #
def _pred(target="hypo", prob=0.85, horizon=30):
    return {
        "target": target, "horizon_min": horizon, "probability": prob,
        "calculable": True, "model_name": f"m_{target}", "model_version": "1.1.0",
        "calibrated": True, "patient_id": None, "prediction_id": None,
    }


def test_engine_generates_hypo_alert():
    cands = engine.generate_candidates(prediction=_pred("hypo", 0.85), xai=None)
    assert len(cands) == 1
    c = cands[0]
    assert c.category == RecommendationCategory.ALERT_CRITICAL
    assert c.rule_id == "HYPO_RISK_CRITICAL"
    assert c.rule_version == "1.0.0"
    assert c.is_synthetic is True
    assert c.open_loop_notice
    assert "hypoglycémie" in c.message_patient.lower()


def test_engine_generates_hyper_behavioral():
    cands = engine.generate_candidates(prediction=_pred("hyper", 0.60), xai=None)
    assert len(cands) == 1
    assert cands[0].category == RecommendationCategory.RECOMMENDATION_BEHAVIORAL
    assert cands[0].rule_id == "HYPER_RISK_BEHAVIORAL"


def test_engine_not_calculable_returns_empty():
    pred = _pred()
    pred["calculable"] = False
    pred["probability"] = None
    assert engine.generate_candidates(prediction=pred, xai=None) == []


def test_engine_no_messages_contain_dose_or_forbidden_terms():
    for target, prob in (("hypo", 0.85), ("hypo", 0.5), ("hyper", 0.85), ("hyper", 0.6)):
        for c in engine.generate_candidates(prediction=_pred(target, prob), xai=None):
            assert safety.check_message(c.message_patient) == []
            assert safety.check_message(c.message_clinician) == []


def test_xai_not_reliable_adds_referral_and_never_clinical_justification():
    xai = {
        "calculable": True,
        "xai_reliability_status": "not_reliable_for_clinical_interpretation",
        "top_features": [{"feature": "cgm_std_30", "contribution": 0.1, "direction": "indéterminé"}],
        "xai_warnings": ["physio nulle"],
    }
    cands = engine.generate_candidates(prediction=_pred("hypo", 0.85), xai=xai)
    rule_ids = {c.rule_id for c in cands}
    # Le risque déclenche toujours (XAI n'est PAS la condition principale) + renvoi clinique.
    assert "HYPO_RISK_CRITICAL" in rule_ids
    assert "XAI_LOW_RELIABILITY" in rule_ids
    for c in cands:
        # Verrou Phase 4.1 : jamais une justification clinique, jamais l'ancien champ.
        assert c.rationale["xai"]["clinical_justification_allowed"] is False
        assert "used_as_clinical_justification" not in c.rationale["xai"]


def test_xai_reliable_is_display_only_never_justification():
    """Verrou Phase 4.1 : même une XAI fiable n'est jamais une justification clinique."""
    xai = {
        "calculable": True,
        "xai_reliability_status": "reliable_for_model_debug",
        "top_features": [{"feature": "cgm_slope_30", "contribution": -0.4, "direction": "augmente"}],
        "xai_warnings": [],
    }
    cands = engine.generate_candidates(prediction=_pred("hypo", 0.85), xai=xai)
    risk = [c for c in cands if c.rule_id == "HYPO_RISK_CRITICAL"][0]
    xai_block = risk.rationale["xai"]
    assert xai_block["clinical_justification_allowed"] is False
    assert xai_block["usage"] == "model_explanation_display_only"
    assert xai_block["included"] is True
    assert xai_block["principal_features"]
    assert "used_as_clinical_justification" not in xai_block


def test_no_candidate_ever_allows_clinical_justification():
    """Invariant global : aucune combinaison ne produit clinical_justification_allowed=True."""
    statuses = (
        "reliable_for_model_debug",
        "caution_semantic_limits",
        "not_reliable_for_clinical_interpretation",
        None,
    )
    for status_ in statuses:
        xai = None
        if status_ is not None:
            xai = {
                "calculable": True,
                "xai_reliability_status": status_,
                "top_features": [{"feature": "f", "contribution": 0.2, "direction": "augmente"}],
                "xai_warnings": [],
            }
        for target, prob in (("hypo", 0.85), ("hyper", 0.85), ("hypo", 0.5)):
            for c in engine.generate_candidates(prediction=_pred(target, prob), xai=xai):
                assert c.rationale["xai"]["clinical_justification_allowed"] is False
                assert safety.validate(c).passed is True


def test_safety_allows_negative_disclaimer_but_blocks_instruction():
    """Le disclaimer négatif est autorisé ; l'instruction thérapeutique est bloquée."""
    disclaimer = "Ne modifiez jamais votre traitement sans avis médical."
    instruction = "Modifiez votre traitement dès maintenant."
    assert safety.check_message(disclaimer) == []
    assert safety.check_message(instruction) != []


def test_safety_blocks_explicit_clinical_justification_flag():
    """L'invariant safety rejette toute reco marquée justification clinique."""
    reco = GeneratedRecommendation(
        patient_id=None, prediction_id=None,
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        message_patient="Surveillez votre glycémie selon vos habitudes.",
        message_clinician="Suggestion non prescriptive, à valider.",
        rationale={"xai": {"clinical_justification_allowed": True}},
        priority=2, target="hypo", horizon_min=30,
        probability=0.6, model_name="m", model_version="1", rule_id="R", rule_version="1",
        trigger_name="t", safety_level=SafetyLevel.monitoring, xai_reliability_status=None,
        open_loop_notice="ok", is_synthetic=True,
        actionability=engine.evaluation.score(
            category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
            safety_level=SafetyLevel.monitoring, probability=0.6, calibrated=False,
            xai_available=False, xai_reliability_status=None, safety_passed=True,
            message_len=50,
        ),
    )
    res = safety.validate(reco)
    assert res.passed is False
    assert "xai_clinical_justification_not_allowed" in res.violations


def test_safety_blocks_forbidden_term():
    bad = GeneratedRecommendation(
        patient_id=None, prediction_id=None,
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        message_patient="Augmentez votre dose de 4 unités d'insuline maintenant.",
        message_clinician="ok",
        rationale={"x": 1}, priority=2, target="hypo", horizon_min=30,
        probability=0.6, model_name="m", model_version="1", rule_id="R", rule_version="1",
        trigger_name="t", safety_level=SafetyLevel.monitoring, xai_reliability_status=None,
        actionability=engine.evaluation.score(
            category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
            safety_level=SafetyLevel.monitoring, probability=0.6, calibrated=False,
            xai_available=False, xai_reliability_status=None, safety_passed=True,
            message_len=50,
        ),
    )
    res = safety.validate(bad)
    assert res.passed is False
    assert any("dose" in v for v in res.violations)


def test_safety_dose_regex_detects_units():
    assert safety.contains_dose("prendre 6 UI") is True
    assert safety.contains_dose("12 unités") is True
    assert safety.contains_dose("aucune dose ici") is False


# --------------------------------------------------------------------------- #
# Workflow (transitions)
# --------------------------------------------------------------------------- #
def test_workflow_valid_and_invalid_transitions():
    assert workflow.can_transition("pending", "approved") is True
    assert workflow.can_transition("pending", "modified") is True
    assert workflow.can_transition("modified", "approved") is True
    assert workflow.can_transition("approved", "rejected") is False
    assert workflow.can_transition("rejected", "approved") is False
    try:
        workflow.assert_transition("approved", "pending")
        assert False, "devrait lever"
    except ValueError:
        pass


# --------------------------------------------------------------------------- #
# Endpoints / RBAC / persistance / audit
# --------------------------------------------------------------------------- #
def _seed_patient_prediction(TestingSessionLocal, *, target="hypo", prob=0.85) -> tuple[str, str]:
    db = TestingSessionLocal()
    try:
        patient = db.query(Patient).first()
        pred = Prediction(
            patient_id=patient.id, ts=datetime.now(timezone.utc),
            horizon_min=30, predicted_event=target, probability=prob,
            model_name="seed_model", model_version="1.1.0",
        )
        db.add(pred)
        db.commit()
        return str(patient.id), str(pred.id)
    finally:
        db.close()


def test_patient_cannot_generate(client):
    pat = register_and_login(client, role="patient", email="g1@test.fr")
    res = client.post("/api/v1/recommendations/generate", json={"horizon_min": 30}, headers=_auth(pat))
    assert res.status_code == 403


def test_clinician_generate_persists_pending(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g2@test.fr")
    clin = register_and_login(client, role="clinician", email="gc2@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)

    res = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    assert res.status_code == 200
    body = res.json()
    assert body["calculable"] is True
    assert len(body["generated"]) >= 1
    rec = body["generated"][0]
    assert rec["status"] == RecommendationStatus.pending.value
    assert rec["is_synthetic"] is True
    assert rec["rule_id"] == "HYPO_RISK_CRITICAL"
    assert rec["rule_version"] == "1.0.0"
    assert rec["category"] == "ALERT_CRITICAL"
    assert rec["probability"] == 0.85


def test_clinician_requires_patient_id(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g3@test.fr")
    clin = register_and_login(client, role="clinician", email="gc3@test.fr")
    res = client.post(
        "/api/v1/recommendations/generate", json={"horizon_min": 30}, headers=_auth(clin)
    )
    assert res.status_code == 400


def test_generate_audit_recorded(client, db_session):
    db, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g4@test.fr")
    clin = register_and_login(client, role="clinician", email="gc4@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hyper", prob=0.85)
    client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    check = TestingSessionLocal()
    try:
        actions = {a.action for a in check.query(AuditLog).all()}
    finally:
        check.close()
    assert "recommendation.generated" in actions


def test_full_open_loop_flow_generate_then_approve(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g5@test.fr")
    clin = register_and_login(client, role="clinician", email="gc5@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    gen = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    rec_id = gen.json()["generated"][0]["id"]
    appr = client.post(
        f"/api/v1/recommendations/{rec_id}/approve", json={"note": "ok"}, headers=_auth(clin)
    )
    assert appr.status_code == 200
    assert appr.json()["status"] == RecommendationStatus.approved.value


def test_modify_then_reject_flow(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g6@test.fr")
    clin = register_and_login(client, role="clinician", email="gc6@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    gen = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    rec_id = gen.json()["generated"][0]["id"]
    mod = client.post(
        f"/api/v1/recommendations/{rec_id}/modify",
        json={"message": "Surveillance renforcée, à revoir en consultation.", "note": "amendé"},
        headers=_auth(clin),
    )
    assert mod.status_code == 200
    assert mod.json()["status"] == RecommendationStatus.modified.value
    # Depuis `modified`, le rejet reste possible (workflow).
    rej = client.post(
        f"/api/v1/recommendations/{rec_id}/reject", json={"note": "finalement non"}, headers=_auth(clin)
    )
    assert rej.status_code == 200
    assert rej.json()["status"] == RecommendationStatus.rejected.value


def test_patient_sees_only_approved(client, db_session):
    _, TestingSessionLocal = db_session
    pat = register_and_login(client, role="patient", email="g7@test.fr")
    clin = register_and_login(client, role="clinician", email="gc7@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    gen = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    rec_id = gen.json()["generated"][0]["id"]

    # Avant approbation : la liste patient est vide.
    mine = client.get("/api/v1/recommendations/mine", headers=_auth(pat))
    assert mine.status_code == 200
    assert mine.json() == []

    # Détail interdit tant que non approuvée.
    detail = client.get(f"/api/v1/recommendations/{rec_id}", headers=_auth(pat))
    assert detail.status_code == 403

    client.post(f"/api/v1/recommendations/{rec_id}/approve", json={}, headers=_auth(clin))
    mine2 = client.get("/api/v1/recommendations/mine", headers=_auth(pat))
    assert any(r["id"] == rec_id for r in mine2.json())


def test_modify_blocks_forbidden_term(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g9@test.fr")
    clin = register_and_login(client, role="clinician", email="gc9@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    gen = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    rec_id = gen.json()["generated"][0]["id"]
    res = client.post(
        f"/api/v1/recommendations/{rec_id}/modify",
        json={"message": "Augmentez votre dose d'insuline."},
        headers=_auth(clin),
    )
    assert res.status_code == 400
    # La suggestion reste pending (modification non persistée).
    check = TestingSessionLocal()
    try:
        rec = check.query(Recommendation).filter(Recommendation.id == uuid.UUID(rec_id)).first()
        assert rec.status == RecommendationStatus.pending.value
        actions = {a.action for a in check.query(AuditLog).all()}
    finally:
        check.close()
    assert "recommendation.safety_blocked" in actions


def test_modify_blocks_numeric_dose(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g10@test.fr")
    clin = register_and_login(client, role="clinician", email="gc10@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    gen = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    rec_id = gen.json()["generated"][0]["id"]
    res = client.post(
        f"/api/v1/recommendations/{rec_id}/modify",
        json={"message": "Prenez 4 unités maintenant."},
        headers=_auth(clin),
    )
    assert res.status_code == 400


def test_patient_cannot_approve(client, db_session):
    _, TestingSessionLocal = db_session
    pat = register_and_login(client, role="patient", email="g8@test.fr")
    register_and_login(client, role="clinician", email="gc8@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    res = client.post(
        f"/api/v1/recommendations/{uuid.uuid4()}/approve", json={}, headers=_auth(pat)
    )
    assert res.status_code == 403


# --------------------------------------------------------------------------- #
# Phase 4.1 — source-of-truth des probabilités
# --------------------------------------------------------------------------- #
def test_generate_rejects_client_supplied_probability(client, db_session):
    """Verrou Phase 4.1 : injecter une probabilité côté client → 422 (extra forbidden)."""
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g11@test.fr")
    clin = register_and_login(client, role="clinician", email="gc11@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    res = client.post(
        "/api/v1/recommendations/generate",
        json={
            "patient_id": pid,
            "prediction_id": pred_id,
            "include_xai": False,
            "probability": 0.99,  # tentative de spoof
        },
        headers=_auth(clin),
    )
    assert res.status_code == 422


def test_generate_rejects_client_supplied_model_fields(client, db_session):
    """Verrou Phase 4.1 : injecter model_name/xai_status côté client → 422."""
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g12@test.fr")
    clin = register_and_login(client, role="clinician", email="gc12@test.fr")
    pid, pred_id = _seed_patient_prediction(TestingSessionLocal, target="hypo", prob=0.85)
    res = client.post(
        "/api/v1/recommendations/generate",
        json={
            "patient_id": pid,
            "prediction_id": pred_id,
            "include_xai": False,
            "model_name": "fake_model",
            "xai_status": "reliable_for_model_debug",
        },
        headers=_auth(clin),
    )
    assert res.status_code == 422


def test_generate_rejects_non_synthetic_prediction(client, db_session):
    """Verrou Phase 4.1 : une prédiction non synthétique est refusée (400)."""
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="g13@test.fr")
    clin = register_and_login(client, role="clinician", email="gc13@test.fr")
    db = TestingSessionLocal()
    try:
        patient = db.query(Patient).first()
        pred = Prediction(
            patient_id=patient.id, ts=datetime.now(timezone.utc),
            horizon_min=30, predicted_event="hypo", probability=0.85,
            model_name="seed_model", model_version="1.1.0", is_synthetic=False,
        )
        db.add(pred)
        db.commit()
        pid, pred_id = str(patient.id), str(pred.id)
    finally:
        db.close()
    res = client.post(
        "/api/v1/recommendations/generate",
        json={"patient_id": pid, "prediction_id": pred_id, "include_xai": False},
        headers=_auth(clin),
    )
    assert res.status_code == 400
