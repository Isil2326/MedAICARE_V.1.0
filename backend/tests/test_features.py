"""Tests des fonctions pures de feature engineering (sans ML, sans DB)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.services import feature_engineering as fe
from app.services.feature_engineering import TimePoint


def _series(values, *, step_min=5, end=None):
    """Construit une série régulière se terminant à `end` (défaut: maintenant)."""
    end = end or datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    n = len(values)
    return [
        TimePoint(ts=end - timedelta(minutes=step_min * (n - 1 - i)), value=v)
        for i, v in enumerate(values)
    ]


def test_rolling_mean_and_std():
    pts = _series([100, 110, 120, 130])
    at = pts[-1].ts
    assert fe.rolling_mean(pts, at, 60) == 115.0
    assert fe.rolling_std(pts, at, 60) is not None


def test_slope_positive():
    pts = _series([100, 110, 120, 130])
    at = pts[-1].ts
    slope = fe.glucose_slope(pts, at, 60)
    assert slope is not None and slope > 0


def test_dg_dt():
    pts = _series([100, 115], step_min=5)
    at = pts[-1].ts
    assert fe.dg_dt(pts, at) == (115 - 100) / 5


def test_delta_over():
    pts = _series([100, 110, 120, 130], step_min=5)
    at = pts[-1].ts
    # 15 min avant le dernier point -> 1er point (100), courant 130
    assert fe.delta_over(pts, at, 15) == 30.0


def test_tir_rolling():
    pts = _series([60, 80, 100, 200])  # 2 dans [70,180] sur 4
    at = pts[-1].ts
    assert fe.tir_rolling(pts, at, 60) == 0.5


def test_time_since_last_and_post_flag():
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    meals = [TimePoint(ts=at - timedelta(minutes=30), value=50)]
    assert fe.time_since_last(meals, at) == 30.0
    assert fe.post_event_flag(meals, at, 120) is True
    assert fe.post_event_flag(meals, at, 15) is False


def test_calendar_helpers():
    at = datetime(2026, 5, 31, 3, 0, tzinfo=timezone.utc)  # dimanche 03:00
    assert fe.hour_of_day(at) == 3
    assert fe.night_flag(at) is True
    assert fe.day_of_week(at) == 6  # dimanche


def test_gap_flag():
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    dense = [TimePoint(ts=at - timedelta(minutes=5 * (3 - i)), value=100) for i in range(4)]
    assert fe.cgm_gap_flag(dense, at, 60) is False
    sparse = [TimePoint(ts=at - timedelta(minutes=50), value=100)]
    assert fe.cgm_gap_flag(sparse, at, 60) is True


def test_compute_features_full_vector():
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    cgm = _series([100, 110, 120, 130], end=at)
    meals = [TimePoint(ts=at - timedelta(minutes=40), value=60)]
    insulin = [TimePoint(ts=at - timedelta(minutes=35), value=6)]
    feats = fe.compute_features(at, cgm=cgm, meals=meals, insulin=insulin)
    for key in ("cgm_mean_30", "cgm_slope_30", "tir_60", "minutes_since_meal",
                "post_prandial", "hour_of_day", "is_night", "cgm_gap_60"):
        assert key in feats
    assert feats["post_prandial"] is True
    assert feats["minutes_since_meal"] == 40.0
