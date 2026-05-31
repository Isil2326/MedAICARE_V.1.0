"""Baseline « règles expertes » — transparent, sans apprentissage.

Référence honnête pour situer les modèles ML. Le score est une transformation
logistique d'une combinaison MONOTONE et lisible de features cliniques (niveau,
pente, contexte). Ce n'est PAS un modèle entraîné : `fit` ne fait qu'enregistrer
les colonnes. La sortie reste une probabilité indicative (open-loop).
"""
from __future__ import annotations

import math

import numpy as np

from app.ml import config
from app.ml.models.base import BaseRiskModel


def _sigmoid(z: float) -> float:
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


class ExpertRulesModel(BaseRiskModel):
    MODEL_NAME = "expert_rules"
    MODEL_VERSION = "1.0.0"

    def __init__(self, feature_columns: list[str] | None = None, *, target: str = "hypo"):
        super().__init__(feature_columns)
        self.target = target

    def fit(self, X, y) -> "ExpertRulesModel":
        # Baseline non entraînée : on valide juste la cible.
        config.threshold_for(self.target)
        self.fitted = True
        return self

    def _row_proba(self, row: dict) -> float:
        mean = row.get("cgm_mean_30")
        slope = row.get("cgm_slope_30")
        night = row.get("is_night") or 0
        post_insulin = row.get("post_insulin") or 0
        post_prandial = row.get("post_prandial") or 0
        mean = 140.0 if mean is None or math.isnan(mean) else mean
        slope = 0.0 if slope is None or (isinstance(slope, float) and math.isnan(slope)) else slope

        if self.target == "hypo":
            # Risque hypo ↑ si moyenne basse, pente descendante, nuit, post-insuline.
            z = (
                -2.2
                + 0.06 * (config.HYPO_THRESHOLD + 20.0 - mean)
                + (-3.0) * slope
                + 0.5 * float(night)
                + 0.7 * float(post_insulin)
            )
        else:  # hyper
            # Risque hyper ↑ si moyenne haute, pente montante, post-prandial.
            z = (
                -2.2
                + 0.04 * (mean - (config.HYPER_THRESHOLD - 30.0))
                + 3.0 * slope
                + 0.7 * float(post_prandial)
            )
        return _sigmoid(z)

    def predict_proba(self, X) -> np.ndarray:
        import pandas as pd

        if isinstance(X, pd.DataFrame):
            records = X.reindex(columns=self.feature_columns).to_dict("records")
        else:
            arr = np.asarray(X, dtype=float)
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)
            records = [dict(zip(self.feature_columns, r)) for r in arr]
        return np.array([self._row_proba(r) for r in records], dtype=float)
