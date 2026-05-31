"""Service d'inférence open-loop : probabilité de risque uniquement.

Charge le modèle ACTIF (registre JSON) pour (target, horizon), construit le
vecteur de features à l'instant T (anti-leakage : `ts <= T`) à partir des séries
DB du patient, et renvoie une PROBABILITÉ. AUCUN conseil, AUCUNE décision.

Si aucun modèle actif ou données insuffisantes : renvoie `calculable=False` avec
une raison — on N'INVENTE PAS de probabilité.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy.orm import Session

from app.ml import config, features_adapter, registry
from app.ml.models.base import BaseRiskModel

# Cache mémoire des artefacts chargés, clé = artifact_path.
_MODEL_CACHE: dict[str, BaseRiskModel] = {}


def _risk_label(prob: float | None) -> str:
    if prob is None:
        return "non calculable"
    if prob < 0.2:
        return "faible"
    if prob < 0.5:
        return "modéré"
    return "élevé"


def _load_active_bundle(target: str, horizon_min: int):
    from pathlib import Path

    entry = registry.get_active(target, horizon_min)
    if entry is None:
        return None, None
    path = entry.get("artifact_path")
    if not path or not Path(path).exists():
        return None, entry
    if path not in _MODEL_CACHE:
        _MODEL_CACHE[path] = BaseRiskModel.load(path)
    return _MODEL_CACHE[path], entry


def clear_cache() -> None:
    _MODEL_CACHE.clear()


def predict(
    db: Session,
    *,
    patient_id: uuid.UUID,
    target: str,
    horizon_min: int,
    at: datetime | None = None,
) -> dict:
    """Inférence open-loop pour un patient à l'instant T. Probabilité ou non calculable."""
    if target not in config.TARGETS:
        raise ValueError(f"Cible inconnue : {target!r}.")
    # Normalise T en tz-aware UTC (un `at` naïf comparé aux points tz-aware lèverait
    # un TypeError) — robustesse open-loop, comportement déterministe.
    at = features_adapter._as_utc(at) if at is not None else datetime.now(timezone.utc)

    bundle, entry = _load_active_bundle(target, horizon_min)
    result = {
        "patient_id": patient_id,
        "at": at,
        "target": target,
        "horizon_min": horizon_min,
        "probability": None,
        "risk_label": "non calculable",
        "calculable": False,
        "reason": None,
        "model_name": entry["model_name"] if entry else "none",
        "model_version": entry["model_version"] if entry else "0.0.0",
        "calibrated": bool(entry.get("calibrated")) if entry else False,
        "is_synthetic": True,
        "n_cgm_points": 0,
    }
    if bundle is None:
        result["reason"] = (
            "Aucun modèle actif pour cette cible/horizon (entraînement requis)."
            if entry is None else "Artefact du modèle actif introuvable sur disque."
        )
        return result

    # Construire les features au point T (passé uniquement).
    series = features_adapter.load_series(db, patient_id)
    cgm_past = [p for p in series["cgm"] if p.ts <= at]
    meals_past = [p for p in series["meal"] if p.ts <= at]
    insulin_past = [p for p in series["insulin"] if p.ts <= at]
    result["n_cgm_points"] = len(cgm_past)
    if not cgm_past:
        result["reason"] = "Données CGM insuffisantes avant T pour calculer les features."
        return result

    from app.services.feature_engineering import compute_features

    feats = compute_features(
        at=at, cgm=cgm_past, meals=meals_past, insulin=insulin_past,
        window_short=config.WINDOW_SHORT_MIN, window_long=config.WINDOW_LONG_MIN,
    )
    row = features_adapter._serialize_features(feats)
    X = pd.DataFrame([row], columns=list(config.FEATURE_COLUMNS))
    prob = float(bundle.predict_proba(X)[0])

    result["probability"] = prob
    result["risk_label"] = _risk_label(prob)
    result["calculable"] = True
    return result
