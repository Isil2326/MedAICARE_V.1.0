"""Pont entre la base PostgreSQL et le feature engineering pur (Phase 1).

Deux responsabilités séparées :
1. `load_series` : charge UNE FOIS les séries d'un patient depuis la DB et les
   convertit en points légers (`Point`) consommables par feature_engineering.
2. `build_samples` : FONCTION PURE (sans DB) qui, pour chaque instant T d'une
   grille échantillonnée, calcule le vecteur de features (passé `ts<=T`) et les
   labels (futur `(T, T+h]`). Cette séparation garde la logique testable hors DB.

ANTI-LEAKAGE : `build_samples` ne passe à `compute_features` que des points
`ts <= T` (vérifié par `assert_no_future` côté feature_engineering) ; les labels
sont calculés par `labels.make_label` sur la fenêtre future uniquement.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.ml import config
from app.ml.labels import make_label
from app.repositories import timeseries_repo
from app.services.feature_engineering import compute_features


@dataclass(frozen=True)
class Point:
    """Point temporel minimal (ts tz-aware + valeur principale)."""

    ts: datetime
    value: float


# Colonne de valeur principale par type d'événement.
_VALUE_ATTR = {
    "cgm": "glucose_mgdl",
    "insulin": "units",
    "meal": "carbs_g",
    "activity": "duration_min",
}


def _as_utc(ts: datetime) -> datetime:
    """Normalise un timestamp en tz-aware UTC (SQLite renvoie du naïf, PG du tz-aware)."""
    if ts.tzinfo is None:
        return ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc)


def _to_points(rows, kind: str) -> list[Point]:
    attr = _VALUE_ATTR[kind]
    return [Point(ts=_as_utc(r.ts), value=float(getattr(r, attr))) for r in rows]


def load_series(
    db: Session, patient_id: uuid.UUID, *, max_points: int = 100_000
) -> dict[str, list[Point]]:
    """Charge cgm/meal/insulin d'un patient, triés par ts croissant.

    `activity` n'est pas utilisé par les features actuelles (réservé futur).
    """
    series = {}
    for kind in ("cgm", "meal", "insulin"):
        rows = timeseries_repo.query_window(
            db, kind, patient_id=patient_id, limit=max_points
        )
        # Garde Phase 2 : ML sur données simulées uniquement (is_synthetic=True).
        rows = [r for r in rows if getattr(r, "is_synthetic", False)]
        series[kind] = _to_points(rows, kind)
    return series


def _serialize_features(feats: dict) -> dict:
    """Projette le dict de features sur les colonnes canoniques (bool -> 0/1)."""
    out: dict[str, float | int | None] = {}
    for col in config.FEATURE_COLUMNS:
        val = feats.get(col)
        if isinstance(val, bool):
            out[col] = int(val)
        else:
            out[col] = val
    return out


def build_samples(
    *,
    patient_id,
    cgm: list[Point],
    meals: list[Point] | None = None,
    insulin: list[Point] | None = None,
    stride_min: int = config.SAMPLE_STRIDE_MIN,
    warmup_min: int = config.WARMUP_MIN,
    horizons: tuple[int, ...] = config.HORIZONS_MIN,
    targets: tuple[str, ...] = config.TARGETS,
) -> list[dict]:
    """Construit les lignes (features + labels) pour un patient — PURE, sans DB.

    Grille des instants T : les timestamps CGM, sous-échantillonnés pour espacer
    consécutifs d'au moins `stride_min`. Une ligne est conservée si au moins un
    label (cible, horizon) est déterminable ; les labels indéterminables valent
    None (NaN dans le dataset, filtrés à l'entraînement).
    """
    meals = meals or []
    insulin = insulin or []
    cgm = sorted(cgm, key=lambda p: p.ts)
    if not cgm:
        return []

    first_ts = cgm[0].ts
    rows: list[dict] = []
    last_T: datetime | None = None

    for point in cgm:
        T = point.ts
        # Warmup : assez d'historique avant T.
        if (T - first_ts) < timedelta(minutes=warmup_min):
            continue
        # Sous-échantillonnage par stride.
        if last_T is not None and (T - last_T) < timedelta(minutes=stride_min):
            continue

        past_cgm = [p for p in cgm if p.ts <= T]
        past_meals = [p for p in meals if p.ts <= T]
        past_insulin = [p for p in insulin if p.ts <= T]

        feats = compute_features(
            at=T,
            cgm=past_cgm,
            meals=past_meals,
            insulin=past_insulin,
            window_short=config.WINDOW_SHORT_MIN,
            window_long=config.WINDOW_LONG_MIN,
        )
        row: dict = {"patient_id": str(patient_id), "at": T}
        row.update(_serialize_features(feats))

        any_label = False
        for target in targets:
            for h in horizons:
                lbl = make_label(cgm, T, h, target)
                row[config.label_column(target, h)] = lbl
                if lbl is not None:
                    any_label = True

        if any_label:
            rows.append(row)
            last_T = T

    return rows
