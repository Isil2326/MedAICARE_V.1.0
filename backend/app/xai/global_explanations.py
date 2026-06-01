"""Explication GLOBALE d'un modèle actif (par couple cible/horizon).

Importance moyenne des features sur la matrice de fond synthétique (SHAP pour
XGB/RF/LogReg, native pour EBM). Produit un artefact JSON régénérable sous
`artifacts/xai/global/`. Décrit la pondération du modèle, PAS la causalité.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.ml import config
from app.xai import ebm_explainer, reliability, shap_explainer, utils

GLOBAL_DIR = Path(config.ARTIFACTS_DIR) / "xai" / "global" if hasattr(config, "ARTIFACTS_DIR") else Path("artifacts/xai/global")


def _global_dir() -> Path:
    base = getattr(config, "ARTIFACTS_DIR", "artifacts")
    return Path(base) / "xai" / "global"


def _qualify_direction(raw_sign: str, is_ebm: bool) -> tuple[str, str | None]:
    """Traduit un signe agrégé brut en direction GLOBALE qualifiée (Phase 3.1).

    On ne présente jamais une moyenne signée comme une vérité simple :
    - EBM (effet dépendant de la valeur) → `not_globalizable` (interpréter localement) ;
    - SHAP (contribution moyenne signée au score) → `aggregated_signed_effect`.
    Le signe brut est conservé séparément à titre informatif (`aggregated_sign`).
    """
    sign = raw_sign if raw_sign in ("augmente", "diminue", "mixte") else None
    if is_ebm:
        return "not_globalizable", sign
    if sign is None:
        return "indéterminé", None
    return "aggregated_signed_effect", sign


def _safe_evaluate(db: Session, *, target: str, horizon_min: int, method: str) -> dict | None:
    """Calcule les métriques d'évaluation réelles (jamais inventées) ; None si échec."""
    from app.xai import evaluation
    try:
        ev = evaluation.evaluate_couple(db, target=target, horizon_min=horizon_min, method=method)
    except Exception:  # robustesse : l'absence de métrique ne casse pas l'artefact
        return None
    return ev


def compute_global(
    db: Session, *, target: str, horizon_min: int, top_k: int = 12, with_evaluation: bool = True
) -> dict:
    """Importance globale du modèle actif. Renvoie un dict conforme à `GlobalExplanation`."""
    model, entry = utils.load_active_model(target, horizon_min)
    now = datetime.now(timezone.utc)
    cols = list(config.FEATURE_COLUMNS)
    base = {
        "target": target,
        "horizon_min": horizon_min,
        "model_id": (entry or {}).get("artifact_path", "none"),
        "model_name": (entry or {}).get("model_name", "none"),
        "model_version": (entry or {}).get("model_version", "0.0.0"),
        "xai_method": "none",
        "method_fallback": False,
        "calibrated": bool((entry or {}).get("calibrated", False)),
        "explains": "modèle non calibré",
        "top_features": [],
        "dataset_version": (entry or {}).get("dataset_version"),
        "features_version": (entry or {}).get("features_version"),
        "synthetic_only": True,
        "n_background": 0,
        "generated_at": now,
        "direction_semantics": reliability.DIRECTION_SEMANTICS,
        "evaluation": None,
    }
    if model is None:
        base["xai_method"] = "unavailable"
        base["method_fallback"] = True
        base.update(_attach_reliability(base, physio=None, stability=None))
        return base

    bg = utils.background_matrix(db)
    base["n_background"] = int(bg.shape[0])
    is_ebm = (entry or {}).get("model_name") == "ebm"

    if is_ebm:
        res = ebm_explainer.global_importance(model, entry, db)
    else:
        res = shap_explainer.global_importance(model, entry, db)

    base["xai_method"] = res.get("method", "none")
    base["method_fallback"] = bool(res.get("fallback"))
    importances = res.get("importances")
    directions = res.get("directions") or {}
    if importances:
        ordered = sorted(importances.items(), key=lambda kv: -(kv[1] or 0.0))[:top_k]
        feats = []
        for name, val in ordered:
            direction, sign = _qualify_direction(directions.get(name, "indéterminé"), is_ebm)
            feats.append({
                "feature": name,
                "mean_abs_importance": float(val) if val is not None else None,
                "direction": direction,
                "aggregated_sign": sign,
            })
        base["top_features"] = feats
    else:
        # Aucune importance calculable : on n'invente rien, top_features reste vide.
        base["top_features"] = []

    # Évaluation réelle embarquée (physio/stabilité pilotent la fiabilité).
    physio = stability = None
    if with_evaluation:
        method = res.get("method", "shap")
        ev = _safe_evaluate(db, target=target, horizon_min=horizon_min, method=method)
        base["evaluation"] = ev
        if ev is not None:
            physio = (ev.get("physio_congruence") or {}).get("value")
            stability = (ev.get("stability") or {}).get("value")

    base.update(_attach_reliability(base, physio=physio, stability=stability))
    return base


def _attach_reliability(base: dict, *, physio: float | None, stability: float | None) -> dict:
    """Dérive le statut de fiabilité sémantique + notices pour l'explication globale."""
    has_indeterminate = any(
        (f.get("direction") in reliability.NON_GLOBALIZABLE_DIRECTIONS)
        for f in base.get("top_features", [])
    ) or not base.get("top_features")
    rel = reliability.assess(
        synthetic_only=True,
        explains=base.get("explains", "modèle non calibré"),
        method_fallback=bool(base.get("method_fallback")),
        xai_method=base.get("xai_method"),
        has_indeterminate_direction=has_indeterminate,
        physio_congruence=physio,
        stability=stability,
    )
    rel["calibration_notice"] = reliability.CALIBRATION_NOTICE
    rel["synthetic_data_notice"] = reliability.SYNTHETIC_DATA_NOTICE
    return rel


def write_artifact(payload: dict) -> Path:
    """Écrit l'artefact JSON global (régénérable, gitignoré)."""
    out_dir = _global_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"global-{payload['target']}-{payload['horizon_min']}.json"
    path = out_dir / fname
    serializable = dict(payload)
    serializable["generated_at"] = payload["generated_at"].isoformat()
    path.write_text(json.dumps(serializable, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def load_artifact(target: str, horizon_min: int) -> dict | None:
    path = _global_dir() / f"global-{target}-{horizon_min}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))
