"""CLI : ré-évalue le(s) modèle(s) actif(s) sur le jeu de test temporel.

Usage :
    python -m app.ml.evaluate [--target hypo] [--horizon 30]

Recharge l'artefact actif depuis le registre, reconstruit le dataset, applique le
MÊME split temporel et calcule les métriques (sans réentraîner). Métriques non
calculables → « non calculable » (pas d'invention).
"""
from __future__ import annotations

import argparse
import json

from app.core.database import SessionLocal
from app.ml import config, dataset_builder, evaluation, registry
from app.ml.models.base import BaseRiskModel
from app.ml.splits import temporal_split


def _evaluate_one(db, target: str, horizon_min: int) -> dict:
    entry = registry.get_active(target, horizon_min)
    if entry is None:
        return {"target": target, "horizon_min": horizon_min, "status": "no_active_model"}
    from pathlib import Path

    path = entry["artifact_path"]
    if not Path(path).exists():
        return {"target": target, "horizon_min": horizon_min, "status": "artifact_missing"}

    bundle = BaseRiskModel.load(path)
    df = dataset_builder.build_dataframe(db)
    col = config.label_column(target, horizon_min)
    data = df[df[col].notna()].copy()
    if data.empty:
        return {"target": target, "horizon_min": horizon_min, "status": "no_data"}
    data[col] = data[col].astype(int)
    splits = temporal_split(data)
    test = splits["test"]
    X = test[list(config.FEATURE_COLUMNS)]
    y = test[col].to_numpy(dtype=int)
    p = bundle.predict_proba(X)
    metrics = evaluation.evaluate(y, p, target=target, horizon_min=horizon_min)
    return {
        "target": target, "horizon_min": horizon_min, "status": "ok",
        "model_id": entry["model_id"], "model_name": entry["model_name"],
        "calibrated": entry.get("calibrated", False), "test_metrics": metrics,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Évaluation des modèles ML (Phase 2).")
    parser.add_argument("--target", choices=config.TARGETS, default=None)
    parser.add_argument("--horizon", type=int, choices=config.HORIZONS_MIN, default=None)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        targets = [args.target] if args.target else list(config.TARGETS)
        horizons = [args.horizon] if args.horizon else list(config.HORIZONS_MIN)
        results = [
            _evaluate_one(db, t, h) for t in targets for h in horizons
        ]
    finally:
        db.close()

    print(json.dumps(results, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
