"""Construction des labels (vérité terrain) — anti-leakage strict.

Un label à l'instant T pour (cible, horizon h) répond à la question :
« un événement <cible> survient-il dans la fenêtre FUTURE (T, T+h] ? »

- hypo  : au moins une lecture CGM `glucose < HYPO_THRESHOLD` dans (T, T+h].
- hyper : au moins une lecture CGM `glucose > HYPER_THRESHOLD` dans (T, T+h].

ANTI-LEAKAGE : la fenêtre de label est STRICTEMENT future (`T < ts <= T+h`).
Le label regarde le futur UNIQUEMENT pour établir la vérité terrain ; il n'est
JAMAIS réinjecté comme feature. Les features (voir feature_engineering) n'utilisent
que `ts <= T`. Les deux ensembles sont donc disjoints autour de T.

`make_label` renvoie `None` quand le label est INDÉTERMINABLE (aucune lecture CGM
dans la fenêtre future) : on ne devine pas, la ligne sera exclue de l'entraînement
pour cette cible/horizon (pas de métrique inventée).
"""
from __future__ import annotations

from datetime import datetime, timedelta

from app.ml.config import threshold_for


def _future_window(cgm, at: datetime, horizon_min: int):
    """Lectures CGM strictement futures : `at < ts <= at + horizon`."""
    end = at + timedelta(minutes=horizon_min)
    return [p for p in cgm if at < p.ts <= end]


def make_label(cgm, at: datetime, horizon_min: int, target: str) -> int | None:
    """Label binaire futur pour (cible, horizon) à l'instant T.

    `cgm` : liste de points avec `.ts` (tz-aware) et `.value` (mg/dL), tout
    horizon confondu (la fonction filtre elle-même la fenêtre future).
    Retourne 1 (événement), 0 (pas d'événement), ou None (indéterminable).
    """
    window = _future_window(cgm, at, horizon_min)
    if not window:
        return None  # indéterminable : pas de futur observé → exclure
    threshold = threshold_for(target)
    if target == "hypo":
        return 1 if any(p.value < threshold for p in window) else 0
    if target == "hyper":
        return 1 if any(p.value > threshold for p in window) else 0
    raise ValueError(f"Cible inconnue : {target!r}.")
