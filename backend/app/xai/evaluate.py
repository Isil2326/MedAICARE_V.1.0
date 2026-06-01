"""CLI : évalue techniquement les explications XAI des couples actifs (Phase 3).

Usage :
    python -m app.xai.evaluate                          # 4 couples actifs
    python -m app.xai.evaluate --target hypo --horizon 30

Calcule stabilité (top-k Jaccard), fidélité par deletion, accord SHAP/LIME et
congruence physiologique sur un sous-échantillon synthétique. AUCUNE validité
clinique : métriques techniques uniquement. Données synthétiques.
"""
from __future__ import annotations

import argparse
import json

from app.core.database import SessionLocal
from app.ml import config
from app.xai import evaluation


def main() -> None:
    parser = argparse.ArgumentParser(description="Évaluation technique XAI (Phase 3).")
    parser.add_argument("--target", choices=config.TARGETS, default=None)
    parser.add_argument("--horizon", type=int, choices=config.HORIZONS_MIN, default=None)
    args = parser.parse_args()

    if args.target and args.horizon:
        couples = [(args.target, args.horizon)]
    else:
        couples = [(t, h) for t in config.TARGETS for h in config.HORIZONS_MIN]

    db = SessionLocal()
    results = []
    try:
        for target, horizon in couples:
            results.append(evaluation.evaluate_couple(db, target=target, horizon_min=horizon))
    finally:
        db.close()

    print(json.dumps(results, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
