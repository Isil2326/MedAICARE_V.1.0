"""CLI : construit le dataset ML depuis PostgreSQL et l'écrit en artefact.

Usage :
    python -m app.ml.build_dataset [--name dataset] [--stride 30] [--warmup 60]

DONNÉES SIMULÉES uniquement (is_synthetic=True).
"""
from __future__ import annotations

import argparse
import json

from app.core.database import SessionLocal
from app.ml import config, dataset_builder


def main() -> None:
    parser = argparse.ArgumentParser(description="Construction du dataset ML (Phase 2).")
    parser.add_argument("--name", default="dataset")
    parser.add_argument("--stride", type=int, default=config.SAMPLE_STRIDE_MIN)
    parser.add_argument("--warmup", type=int, default=config.WARMUP_MIN)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        df = dataset_builder.build_dataframe(
            db, stride_min=args.stride, warmup_min=args.warmup
        )
        out = dataset_builder.save_dataset(df, name=args.name)
    finally:
        db.close()

    print(json.dumps(out["meta_dict"], indent=2, ensure_ascii=False))
    print(f"\nDataset écrit : {out['parquet']}")


if __name__ == "__main__":
    main()
