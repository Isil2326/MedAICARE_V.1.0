"""CLI : génère les explications globales des couples actifs (Phase 3 XAI).

Usage :
    python -m app.xai.generate_global                       # 4 couples actifs
    python -m app.xai.generate_global --target hypo --horizon 30

Écrit un artefact JSON par couple sous `artifacts/xai/global/` (régénérable,
gitignoré). Décrit la PONDÉRATION du modèle, PAS la causalité. Données synthétiques.
"""
from __future__ import annotations

import argparse
import json

from app.core.database import SessionLocal
from app.ml import config
from app.xai import global_explanations


def main() -> None:
    parser = argparse.ArgumentParser(description="Génération des explications globales XAI (Phase 3).")
    parser.add_argument("--target", choices=config.TARGETS, default=None)
    parser.add_argument("--horizon", type=int, choices=config.HORIZONS_MIN, default=None)
    args = parser.parse_args()

    if args.target and args.horizon:
        couples = [(args.target, args.horizon)]
    else:
        couples = [(t, h) for t in config.TARGETS for h in config.HORIZONS_MIN]

    db = SessionLocal()
    summary = []
    try:
        for target, horizon in couples:
            payload = global_explanations.compute_global(db, target=target, horizon_min=horizon)
            path = global_explanations.write_artifact(payload)
            summary.append({
                "target": target,
                "horizon_min": horizon,
                "model_name": payload.get("model_name"),
                "xai_method": payload.get("xai_method"),
                "method_fallback": payload.get("method_fallback"),
                "n_top_features": len(payload.get("top_features") or []),
                "n_background": payload.get("n_background"),
                "artifact": str(path),
            })
    finally:
        db.close()

    print(json.dumps(summary, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
