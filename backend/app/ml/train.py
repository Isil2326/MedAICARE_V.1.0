"""CLI : entraîne et enregistre le(s) modèle(s) de risque (open-loop).

Usage :
    python -m app.ml.train                         # tous les couples (target, horizon)
    python -m app.ml.train --target hypo --horizon 30
    python -m app.ml.train --no-calibrate

Sélection sur validation, évaluation unique sur test, calibration honnête.
"""
from __future__ import annotations

import argparse
import json

from app.core.database import SessionLocal
from app.ml import config, training


def main() -> None:
    parser = argparse.ArgumentParser(description="Entraînement des modèles ML (Phase 2).")
    parser.add_argument("--target", choices=config.TARGETS, default=None)
    parser.add_argument("--horizon", type=int, choices=config.HORIZONS_MIN, default=None)
    parser.add_argument("--no-calibrate", action="store_true")
    args = parser.parse_args()
    calibrate = not args.no_calibrate

    db = SessionLocal()
    try:
        if args.target and args.horizon:
            results = [training.train_target(
                db, target=args.target, horizon_min=args.horizon, calibrate=calibrate
            )]
        else:
            results = training.train_all(db, calibrate=calibrate)
    finally:
        db.close()

    print(json.dumps(results, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
