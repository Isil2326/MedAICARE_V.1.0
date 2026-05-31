"""Feature engineering temporel — fonctions PURES, anti-leakage strict.

PAS DE ML EN PHASE 1 : ce module ne fait QUE de la préparation de features
(aucun entraînement, aucune inférence, aucun SHAP/LIME, aucune métrique
inventée). Les fonctions sont pures : pas d'accès base de données, entrée =
listes ordonnées de points, sortie = valeurs calculées.

ANTI TEMPORAL LEAKAGE (politique stricte) :
- à un instant d'évaluation T, seules les données `ts <= T` sont utilisées ;
- aucune donnée future ne peut influencer une feature passée ;
- les fonctions de fenêtre filtrent explicitement `point.ts <= T` ;
- `assert_no_future` documente et garde cette invariante.

Les "points" attendus sont des objets/namedtuples exposant au minimum `.ts`
(datetime tz-aware) et le champ de valeur pertinent (ex. `.glucose_mgdl`).
Voir la section "Anti temporal leakage policy" de
docs/migration/PHASE_1_DATA_ENGINEERING.md.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta

# Plage cible TIR standard diabète (mg/dL).
TIR_LOW = 70.0
TIR_HIGH = 180.0
# Heures considérées "nuit" (00:00–05:59 UTC, simplifié pour le prototype).
NIGHT_HOURS = set(range(0, 6))
# Au-delà de cet écart entre deux lectures CGM consécutives → gap signalé.
DEFAULT_GAP_MINUTES = 20.0


@dataclass(frozen=True)
class TimePoint:
    """Point temporel minimal et générique (utilisable en test sans la DB)."""

    ts: datetime
    value: float


def assert_no_future(points, at: datetime, *, field: str = "ts") -> None:
    """Garde anti-leakage : aucun point fourni ne doit être strictement après `at`."""
    for p in points:
        if p.ts > at:
            raise ValueError(
                f"Anti-leakage: point {field}={p.ts.isoformat()} > T={at.isoformat()}."
            )


def _past_window(points, at: datetime, minutes: float):
    """Sous-ensemble strictement passé : `start < ts <= at` (anti-leakage)."""
    start = at - timedelta(minutes=minutes)
    return [p for p in points if start < p.ts <= at]


def _at_or_before(points, at: datetime):
    """Tous les points `ts <= at` (anti-leakage)."""
    return [p for p in points if p.ts <= at]


# --- Statistiques glissantes ------------------------------------------------
def rolling_mean(points, at: datetime, minutes: float) -> float | None:
    """Moyenne des valeurs sur la fenêtre passée [at-minutes, at]."""
    w = _past_window(points, at, minutes)
    if not w:
        return None
    return sum(p.value for p in w) / len(w)


def rolling_std(points, at: datetime, minutes: float) -> float | None:
    """Écart-type (population) sur la fenêtre passée."""
    w = _past_window(points, at, minutes)
    if len(w) < 2:
        return None
    vals = [p.value for p in w]
    m = sum(vals) / len(vals)
    var = sum((v - m) ** 2 for v in vals) / len(vals)
    return math.sqrt(var)


def glucose_slope(points, at: datetime, minutes: float) -> float | None:
    """Pente (mg/dL par minute) par régression linéaire sur la fenêtre passée."""
    w = _past_window(points, at, minutes)
    if len(w) < 2:
        return None
    t0 = w[0].ts
    xs = [(p.ts - t0).total_seconds() / 60.0 for p in w]
    ys = [p.value for p in w]
    n = len(w)
    mx = sum(xs) / n
    my = sum(ys) / n
    denom = sum((x - mx) ** 2 for x in xs)
    if denom == 0:
        return None
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return num / denom


def dg_dt(points, at: datetime) -> float | None:
    """Dérivée instantanée approchée (mg/dL/min) sur les 2 derniers points <= at."""
    past = _at_or_before(points, at)
    if len(past) < 2:
        return None
    p_prev, p_last = past[-2], past[-1]
    dt = (p_last.ts - p_prev.ts).total_seconds() / 60.0
    if dt <= 0:
        return None
    return (p_last.value - p_prev.value) / dt


def delta_over(points, at: datetime, minutes: float) -> float | None:
    """Variation valeur(at) - valeur(at-minutes) en utilisant le passé uniquement."""
    past = _at_or_before(points, at)
    if not past:
        return None
    current = past[-1].value
    target = at - timedelta(minutes=minutes)
    before = [p for p in past if p.ts <= target]
    if not before:
        return None
    return current - before[-1].value


def tir_rolling(points, at: datetime, minutes: float,
                low: float = TIR_LOW, high: float = TIR_HIGH) -> float | None:
    """Time-in-range glissant : fraction [0,1] des lectures dans [low, high]."""
    w = _past_window(points, at, minutes)
    if not w:
        return None
    in_range = sum(1 for p in w if low <= p.value <= high)
    return in_range / len(w)


# --- Contexte événementiel --------------------------------------------------
def time_since_last(events, at: datetime) -> float | None:
    """Minutes écoulées depuis le dernier événement `ts <= at` (repas/insuline…)."""
    past = _at_or_before(events, at)
    if not past:
        return None
    return (at - past[-1].ts).total_seconds() / 60.0


def post_event_flag(events, at: datetime, window_min: float) -> bool:
    """Vrai si un événement a eu lieu dans les `window_min` minutes précédant at."""
    t = time_since_last(events, at)
    return t is not None and t <= window_min


# --- Calendrier -------------------------------------------------------------
def hour_of_day(at: datetime) -> int:
    return at.hour


def day_of_week(at: datetime) -> int:
    """Lundi=0 … Dimanche=6."""
    return at.weekday()


def night_flag(at: datetime) -> bool:
    return at.hour in NIGHT_HOURS


# --- Couverture / qualité CGM ----------------------------------------------
def cgm_count_in_window(points, at: datetime, minutes: float) -> int:
    return len(_past_window(points, at, minutes))


def cgm_gap_flag(points, at: datetime, minutes: float,
                 max_gap_min: float = DEFAULT_GAP_MINUTES) -> bool:
    """Vrai si un trou > max_gap_min existe entre lectures consécutives de la fenêtre.

    Inclut le délai entre la dernière lecture et `at`.
    """
    w = _past_window(points, at, minutes)
    if not w:
        return True  # aucune donnée = couverture nulle = gap
    times = [p.ts for p in w]
    for prev, nxt in zip(times, times[1:]):
        if (nxt - prev).total_seconds() / 60.0 > max_gap_min:
            return True
    return (at - times[-1]).total_seconds() / 60.0 > max_gap_min


# --- Agrégateur -------------------------------------------------------------
def compute_features(
    at: datetime,
    *,
    cgm: list,
    meals: list | None = None,
    insulin: list | None = None,
    window_short: float = 30.0,
    window_long: float = 60.0,
    post_window: float = 120.0,
) -> dict:
    """Calcule le vecteur de features à l'instant T en respectant l'anti-leakage.

    `cgm` : points avec `.ts` et `.value` (mg/dL). `meals`/`insulin` : événements
    avec `.ts`. Toutes les entrées doivent être `ts <= at` (vérifié).
    """
    meals = meals or []
    insulin = insulin or []
    assert_no_future(cgm, at, field="cgm.ts")
    assert_no_future(meals, at, field="meal.ts")
    assert_no_future(insulin, at, field="insulin.ts")

    return {
        "at": at,
        "cgm_mean_30": rolling_mean(cgm, at, window_short),
        "cgm_mean_60": rolling_mean(cgm, at, window_long),
        "cgm_std_30": rolling_std(cgm, at, window_short),
        "cgm_slope_30": glucose_slope(cgm, at, window_short),
        "cgm_dg_dt": dg_dt(cgm, at),
        "cgm_delta_15": delta_over(cgm, at, 15),
        "cgm_delta_30": delta_over(cgm, at, 30),
        "cgm_delta_60": delta_over(cgm, at, 60),
        "tir_60": tir_rolling(cgm, at, window_long),
        "minutes_since_meal": time_since_last(meals, at),
        "minutes_since_insulin": time_since_last(insulin, at),
        "post_prandial": post_event_flag(meals, at, post_window),
        "post_insulin": post_event_flag(insulin, at, post_window),
        "hour_of_day": hour_of_day(at),
        "day_of_week": day_of_week(at),
        "is_night": night_flag(at),
        "cgm_count_60": cgm_count_in_window(cgm, at, window_long),
        "cgm_gap_60": cgm_gap_flag(cgm, at, window_long),
    }
