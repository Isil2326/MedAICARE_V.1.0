"""Tests des contrats Pydantic temporels + validation stricte des timestamps."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.timeseries import (
    CgmReadingCreate,
    InsulinEventCreate,
    MealEventCreate,
    ActivityEventCreate,
    TimeseriesQuery,
)


def _utc(**kw):
    return datetime.now(timezone.utc).replace(microsecond=0) - timedelta(**kw)


def test_cgm_accepts_tzaware_and_normalizes_utc():
    ts = datetime(2026, 5, 31, 8, 0, tzinfo=timezone(timedelta(hours=2)))
    m = CgmReadingCreate(ts=ts, glucose_mgdl=120)
    assert m.ts.tzinfo == timezone.utc
    assert m.ts.hour == 6  # 08:00+02:00 -> 06:00 UTC


def test_naive_timestamp_rejected():
    with pytest.raises(ValidationError):
        CgmReadingCreate(ts=datetime(2026, 5, 31, 8, 0), glucose_mgdl=120)


def test_future_timestamp_rejected():
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    with pytest.raises(ValidationError):
        CgmReadingCreate(ts=future, glucose_mgdl=120)


def test_cgm_bounds():
    with pytest.raises(ValidationError):
        CgmReadingCreate(ts=_utc(minutes=1), glucose_mgdl=29)
    with pytest.raises(ValidationError):
        CgmReadingCreate(ts=_utc(minutes=1), glucose_mgdl=601)
    CgmReadingCreate(ts=_utc(minutes=1), glucose_mgdl=30)
    CgmReadingCreate(ts=_utc(minutes=1), glucose_mgdl=600)


def test_insulin_bounds():
    with pytest.raises(ValidationError):
        InsulinEventCreate(ts=_utc(minutes=1), units=0)
    with pytest.raises(ValidationError):
        InsulinEventCreate(ts=_utc(minutes=1), units=101)
    InsulinEventCreate(ts=_utc(minutes=1), units=6, insulin_type="bolus")


def test_meal_bounds():
    with pytest.raises(ValidationError):
        MealEventCreate(ts=_utc(minutes=1), carbs_g=-1)
    with pytest.raises(ValidationError):
        MealEventCreate(ts=_utc(minutes=1), carbs_g=301)
    MealEventCreate(ts=_utc(minutes=1), carbs_g=0)


def test_activity_bounds_and_intensity_enum():
    with pytest.raises(ValidationError):
        ActivityEventCreate(ts=_utc(minutes=1), duration_min=0)
    with pytest.raises(ValidationError):
        ActivityEventCreate(ts=_utc(minutes=1), duration_min=1, intensity="extreme")
    ActivityEventCreate(ts=_utc(minutes=1), duration_min=30, intensity="moderate")


def test_query_window_order():
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        TimeseriesQuery(start=now, end=now - timedelta(hours=1))
    q = TimeseriesQuery(start=now - timedelta(hours=1), end=now)
    assert q.start < q.end


def test_extra_fields_forbidden():
    with pytest.raises(ValidationError):
        CgmReadingCreate(ts=_utc(minutes=1), glucose_mgdl=120, hacker="x")
