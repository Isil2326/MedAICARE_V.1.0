"""Calibration des probabilités (Platt / isotonique) + courbe de fiabilité.

La calibration est ajustée sur le jeu de VALIDATION (jamais le test) puis
appliquée. On compare le Brier avant/après : si la calibration dégrade le Brier
sur la validation, on N'APPLIQUE PAS (posture honnête, pas d'amélioration feinte).
"""
from __future__ import annotations

import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss


class Calibrator:
    """Encapsule un calibrateur ajusté. `transform` mappe proba->proba calibrée."""

    def __init__(self, method: str, estimator):
        self.method = method
        self.estimator = estimator

    def transform(self, p) -> np.ndarray:
        p = np.asarray(p, dtype=float).reshape(-1)
        if self.method == "isotonic":
            return np.clip(self.estimator.predict(p), 0.0, 1.0)
        # platt : régression logistique sur la proba comme feature.
        return self.estimator.predict_proba(p.reshape(-1, 1))[:, 1]


def fit_calibrator(p_val, y_val, *, method: str = "isotonic") -> Calibrator | None:
    """Ajuste un calibrateur sur la validation. None si impossible (classe unique)."""
    p_val = np.asarray(p_val, dtype=float).reshape(-1)
    y_val = np.asarray(y_val, dtype=int).reshape(-1)
    if p_val.size == 0 or len(np.unique(y_val)) < 2:
        return None
    if method == "isotonic":
        iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
        iso.fit(p_val, y_val)
        return Calibrator("isotonic", iso)
    if method == "platt":
        lr = LogisticRegression()
        lr.fit(p_val.reshape(-1, 1), y_val)
        return Calibrator("platt", lr)
    raise ValueError(f"Méthode de calibration inconnue : {method!r}.")


def maybe_calibrate(p_val, y_val, *, method: str = "isotonic") -> Calibrator | None:
    """Ajuste un calibrateur SEULEMENT s'il améliore le Brier sur la validation."""
    cal = fit_calibrator(p_val, y_val, method=method)
    if cal is None:
        return None
    base = brier_score_loss(y_val, np.asarray(p_val, dtype=float))
    after = brier_score_loss(y_val, cal.transform(p_val))
    return cal if after <= base else None


def reliability_curve(y_true, y_prob, *, n_bins: int = 10) -> list[dict]:
    """Points (confiance moyenne, fréquence observée, effectif) par bin."""
    y_true = np.asarray(y_true, dtype=float)
    y_prob = np.asarray(y_prob, dtype=float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    idx = np.digitize(y_prob, bins[1:-1], right=False)
    points = []
    for b in range(n_bins):
        mask = idx == b
        if not mask.any():
            continue
        points.append({
            "bin": b,
            "mean_pred": float(y_prob[mask].mean()),
            "obs_freq": float(y_true[mask].mean()),
            "count": int(mask.sum()),
        })
    return points
