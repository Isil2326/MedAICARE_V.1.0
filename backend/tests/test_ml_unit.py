"""Tests unitaires Phase 2 : labels, splits, anti-leakage, évaluation, calibration."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import pytest

from app.ml import calibration, config
from app.ml.evaluation import evaluate, expected_calibration_error
from app.ml.features_adapter import Point, build_samples
from app.ml.labels import make_label
from app.ml.splits import SplitError, temporal_split
from tests.ml_helpers import synthetic_points


def _t(minute: int) -> datetime:
    return datetime(2026, 1, 1, 0, 0, tzinfo=timezone.utc) + timedelta(minutes=minute)


# --- Labels -----------------------------------------------------------------
def test_make_label_hypo_detects_future_low():
    cgm = [Point(_t(0), 120), Point(_t(15), 110), Point(_t(30), 60)]
    # à T=0, fenêtre (0, 30] contient 60 < 70 -> hypo=1
    assert make_label(cgm, _t(0), 30, "hypo") == 1


def test_make_label_zero_when_no_event():
    cgm = [Point(_t(0), 120), Point(_t(15), 130), Point(_t(30), 140)]
    assert make_label(cgm, _t(0), 30, "hypo") == 0
    assert make_label(cgm, _t(0), 30, "hyper") == 0


def test_make_label_none_when_no_future():
    cgm = [Point(_t(0), 120)]
    assert make_label(cgm, _t(0), 30, "hypo") is None


def test_make_label_window_is_strictly_future():
    # un point AU temps T ne doit pas compter (fenêtre (T, T+h]).
    cgm = [Point(_t(30), 50), Point(_t(60), 120)]
    assert make_label(cgm, _t(30), 30, "hypo") == 0  # 50 est à T, exclu


# --- Anti-leakage de build_samples -----------------------------------------
def test_build_samples_features_ignore_future():
    pts = synthetic_points(n_steps=40, step_min=15)
    rows = build_samples(patient_id="p", cgm=pts, stride_min=15, warmup_min=30)
    assert rows, "des lignes doivent être produites"
    # Ajouter un point TRÈS futur ne doit PAS changer les features des lignes existantes.
    far_future = pts + [Point(pts[-1].ts + timedelta(hours=5), 999.0)]
    rows2 = build_samples(patient_id="p", cgm=far_future, stride_min=15, warmup_min=30)
    by_at = {r["at"]: r for r in rows2}
    for r in rows:
        r2 = by_at[r["at"]]
        for col in config.FEATURE_COLUMNS:
            assert r.get(col) == r2.get(col), f"feature {col} influencée par le futur"


def test_build_samples_produces_both_classes():
    pts = synthetic_points(n_steps=192, step_min=15)
    rows = build_samples(patient_id="p", cgm=pts, stride_min=30, warmup_min=60)
    labels = [r[config.label_column("hypo", 30)] for r in rows if r[config.label_column("hypo", 30)] is not None]
    assert 0 in labels and 1 in labels


# --- Splits temporels -------------------------------------------------------
def test_temporal_split_is_chronological():
    df = pd.DataFrame({"at": [_t(i) for i in range(100)], "x": range(100)})
    parts = temporal_split(df)
    assert parts["train"]["at"].max() <= parts["val"]["at"].min()
    assert parts["val"]["at"].max() <= parts["test"]["at"].min()
    assert len(parts["train"]) + len(parts["val"]) + len(parts["test"]) == 100


def test_temporal_split_rejects_bad_fractions():
    df = pd.DataFrame({"at": [_t(i) for i in range(10)]})
    with pytest.raises(SplitError):
        temporal_split(df, fractions=(0.5, 0.3, 0.3))


def test_temporal_split_no_timestamp_leaks_across_splits():
    """Anti-leakage : un timestamp partagé (multi-patients) ne doit jamais
    straddle deux splits. Ici chaque instant est dupliqué (2 'patients')."""
    rows = []
    for i in range(60):
        rows.append({"at": _t(i), "patient_id": "A", "x": i})
        rows.append({"at": _t(i), "patient_id": "B", "x": i})
    df = pd.DataFrame(rows)
    parts = temporal_split(df)
    tr = set(parts["train"]["at"]); va = set(parts["val"]["at"]); te = set(parts["test"]["at"])
    assert tr & va == set()
    assert va & te == set()
    assert tr & te == set()
    # frontières strictement disjointes (pas d'égalité au bord)
    assert parts["train"]["at"].max() < parts["val"]["at"].min()
    assert parts["val"]["at"].max() < parts["test"]["at"].min()


# --- Évaluation : aucune métrique inventée ----------------------------------
def test_evaluate_single_class_returns_none_auroc():
    y = np.zeros(20, dtype=int)
    p = np.linspace(0, 1, 20)
    rep = evaluate(y, p, target="hypo", horizon_min=30)
    assert rep["auroc"] is None
    assert rep["brier"] is not None  # Brier reste calculable
    assert any("une seule classe" in n for n in rep["notes"])


def test_evaluate_perfect_separation():
    y = np.array([0, 0, 1, 1])
    p = np.array([0.1, 0.2, 0.8, 0.9])
    rep = evaluate(y, p, target="hypo", horizon_min=30)
    assert rep["auroc"] == 1.0
    assert rep["recall"] == 1.0


def test_ece_in_unit_interval():
    rng = np.random.default_rng(0)
    p = rng.uniform(size=200)
    y = (rng.uniform(size=200) < p).astype(int)
    ece = expected_calibration_error(y, p)
    assert 0.0 <= ece <= 1.0


# --- Calibration : appliquée seulement si elle aide -------------------------
def test_maybe_calibrate_returns_none_single_class():
    p = np.linspace(0, 1, 30)
    y = np.zeros(30, dtype=int)
    assert calibration.maybe_calibrate(p, y) is None


def test_calibrator_outputs_probabilities():
    rng = np.random.default_rng(1)
    y = rng.integers(0, 2, size=200)
    p = rng.uniform(size=200)
    cal = calibration.fit_calibrator(p, y, method="isotonic")
    out = cal.transform(p)
    assert out.min() >= 0.0 and out.max() <= 1.0
