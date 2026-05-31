"""Construction du dataset tabulaire à partir des séries PostgreSQL simulées.

Lit les séries (cgm/meal/insulin) de chaque patient, délègue la fabrication des
lignes (features passées + labels futurs) à `features_adapter.build_samples`
(anti-leakage), puis agrège en DataFrame. Sauvegarde en Parquet (+ méta JSON).

DONNÉES SIMULÉES uniquement : aucune donnée réelle n'entre ici.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml import config, features_adapter
from app.models import CgmReading


def list_patient_ids(db: Session) -> list[uuid.UUID]:
    """Patients disposant d'au moins une lecture CGM **synthétique**.

    Garde de sécurité Phase 2 : le ML ne s'entraîne QUE sur des données simulées
    (`is_synthetic=True`). Toute donnée non synthétique est exclue à la source.
    """
    rows = db.execute(
        select(CgmReading.patient_id)
        .where(CgmReading.is_synthetic.is_(True))
        .distinct()
    ).all()
    return [r[0] for r in rows]


def build_dataframe(
    db: Session,
    *,
    patient_ids: list[uuid.UUID] | None = None,
    stride_min: int = config.SAMPLE_STRIDE_MIN,
    warmup_min: int = config.WARMUP_MIN,
) -> pd.DataFrame:
    if patient_ids is None:
        patient_ids = list_patient_ids(db)
    all_rows: list[dict] = []
    for pid in patient_ids:
        series = features_adapter.load_series(db, pid)
        rows = features_adapter.build_samples(
            patient_id=pid,
            cgm=series["cgm"],
            meals=series["meal"],
            insulin=series["insulin"],
            stride_min=stride_min,
            warmup_min=warmup_min,
        )
        all_rows.extend(rows)
    if not all_rows:
        return pd.DataFrame(
            columns=["patient_id", "at", *config.FEATURE_COLUMNS,
                     *(config.label_column(t, h) for t in config.TARGETS for h in config.HORIZONS_MIN)]
        )
    df = pd.DataFrame(all_rows)
    return df.sort_values("at", kind="mergesort").reset_index(drop=True)


def dataset_meta(df: pd.DataFrame) -> dict:
    """Métadonnées honnêtes : effectifs, prévalences, fenêtre temporelle."""
    meta: dict = {
        "n_rows": int(len(df)),
        "n_patients": int(df["patient_id"].nunique()) if not df.empty else 0,
        "feature_columns": list(config.FEATURE_COLUMNS),
        "stride_min": config.SAMPLE_STRIDE_MIN,
        "warmup_min": config.WARMUP_MIN,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_synthetic": True,
        "labels": {},
    }
    if not df.empty:
        meta["time_range"] = {
            "start": str(df["at"].min()),
            "end": str(df["at"].max()),
        }
        for t in config.TARGETS:
            for h in config.HORIZONS_MIN:
                col = config.label_column(t, h)
                if col in df:
                    valid = df[col].dropna()
                    meta["labels"][col] = {
                        "labeled": int(valid.size),
                        "positives": int((valid == 1).sum()),
                        "negatives": int((valid == 0).sum()),
                        "prevalence": float((valid == 1).mean()) if valid.size else None,
                    }
    return meta


def save_dataset(df: pd.DataFrame, *, name: str = "dataset") -> dict:
    """Écrit le Parquet + la méta JSON dans artifacts/datasets/. Retourne les chemins."""
    config.ensure_dirs()
    pq_path = config.DATASETS_DIR / f"{name}.parquet"
    meta_path = config.DATASETS_DIR / f"{name}.meta.json"
    df.to_parquet(pq_path, index=False)
    meta = dataset_meta(df)
    meta["parquet_path"] = str(pq_path)
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    return {"parquet": str(pq_path), "meta": str(meta_path), "meta_dict": meta}


def load_dataset(name: str = "dataset") -> pd.DataFrame:
    pq_path = config.DATASETS_DIR / f"{name}.parquet"
    if not pq_path.exists():
        raise FileNotFoundError(f"Dataset introuvable : {pq_path}. Lancer build_dataset d'abord.")
    return pd.read_parquet(pq_path)
