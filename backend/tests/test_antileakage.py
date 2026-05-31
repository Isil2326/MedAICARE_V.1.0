"""Tests anti temporal leakage : aucune donnée future ne modifie le passé."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.services import feature_engineering as fe
from app.services.feature_engineering import TimePoint


def _series(values, *, step_min=5, end):
    n = len(values)
    return [
        TimePoint(ts=end - timedelta(minutes=step_min * (n - 1 - i)), value=v)
        for i, v in enumerate(values)
    ]


def test_future_point_does_not_change_past_features():
    """Ajouter un point STRICTEMENT futur ne doit pas altérer les features à T."""
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    past = _series([100, 110, 120, 130], end=at)

    feats_before = fe.compute_features(at, cgm=past)

    # Série identique + 1 point futur (au-delà de T).
    future_point = TimePoint(ts=at + timedelta(minutes=5), value=400)
    with_future = past + [future_point]

    # compute_features doit refuser des données futures (garde anti-leakage).
    with pytest.raises(ValueError):
        fe.compute_features(at, cgm=with_future)

    # Les fonctions de fenêtre, elles, ignorent simplement le futur.
    assert feats_before["cgm_mean_60"] == fe.rolling_mean(past, at, 60)
    assert fe.rolling_mean(with_future, at, 60) == fe.rolling_mean(past, at, 60)
    assert fe.glucose_slope(with_future, at, 60) == fe.glucose_slope(past, at, 60)
    assert fe.tir_rolling(with_future, at, 60) == fe.tir_rolling(past, at, 60)


def test_assert_no_future_raises():
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    pts = [TimePoint(ts=at + timedelta(minutes=1), value=100)]
    with pytest.raises(ValueError):
        fe.assert_no_future(pts, at)


def test_window_strictly_past():
    at = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)
    pts = [
        TimePoint(ts=at - timedelta(minutes=10), value=100),
        TimePoint(ts=at, value=110),
        TimePoint(ts=at + timedelta(minutes=10), value=999),  # futur
    ]
    # Seuls les 2 premiers (ts <= at) comptent.
    assert fe.cgm_count_in_window(pts, at, 60) == 2
