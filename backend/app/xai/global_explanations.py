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
from app.xai import ebm_explainer, shap_explainer, utils

GLOBAL_DIR = Path(config.ARTIFACTS_DIR) / "xai" / "global" if hasattr(config, "ARTIFACTS_DIR") else Path("artifacts/xai/global")


def _global_dir() -> Path:
    base = getattr(config, "ARTIFACTS_DIR", "artifacts")
    return Path(base) / "xai" / "global"


def compute_global(db: Session, *, target: str, horizon_min: int, top_k: int = 12) -> dict:
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
    }
    if model is None:
        base["xai_method"] = "unavailable"
        base["method_fallback"] = True
        return base

    bg = utils.background_matrix(db)
    base["n_background"] = int(bg.shape[0])

    if (entry or {}).get("model_name") == "ebm":
        res = ebm_explainer.global_importance(model, entry, db)
    else:
        res = shap_explainer.global_importance(model, entry, db)

    base["xai_method"] = res.get("method", "none")
    base["method_fallback"] = bool(res.get("fallback"))
    importances = res.get("importances")
    directions = res.get("directions") or {}
    if importances:
        ordered = sorted(importances.items(), key=lambda kv: -(kv[1] or 0.0))[:top_k]
        base["top_features"] = [
            {
                "feature": name,
                "mean_abs_importance": float(val) if val is not None else None,
                "direction": directions.get(name, "indéterminé"),
            }
            for name, val in ordered
        ]
    else:
        # Aucune importance calculable : on n'invente rien, top_features reste vide.
        base["top_features"] = []
    return base


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
