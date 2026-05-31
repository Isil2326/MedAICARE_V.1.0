"""Modèle principal : XGBoost (gradient boosting).

XGBoost gère nativement les valeurs manquantes (NaN) : pas d'imputation requise.
Le déséquilibre est traité via `scale_pos_weight` calculé sur le jeu d'entraînement.
Les hyperparamètres proviennent de `tuning` (Optuna si disponible, sinon config fixe).
"""
from __future__ import annotations

import numpy as np
from xgboost import XGBClassifier

from app.ml import config
from app.ml.models.base import BaseRiskModel


class XGBoostModel(BaseRiskModel):
    MODEL_NAME = "xgboost"
    MODEL_VERSION = "1.0.0"

    def __init__(self, feature_columns: list[str] | None = None, *, params: dict | None = None):
        super().__init__(feature_columns)
        self.params = dict(params or {})
        self.model: XGBClassifier | None = None
        self._single_class: int | None = None

    def fit(self, X, y):
        mat = self._as_matrix(X)
        y = np.asarray(y).astype(int)
        classes = np.unique(y)
        if len(classes) < 2:
            self._single_class = int(classes[0])
            self.fitted = True
            return self
        n_pos = int((y == 1).sum())
        n_neg = int((y == 0).sum())
        spw = (n_neg / n_pos) if n_pos > 0 else 1.0
        base = dict(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=config.RANDOM_SEED,
            n_jobs=-1,
        )
        base.update(self.params)
        base["scale_pos_weight"] = base.get("scale_pos_weight", spw)
        self.model = XGBClassifier(**base)
        self.model.fit(mat, y)
        self.fitted = True
        return self

    def predict_proba(self, X) -> np.ndarray:
        mat = self._as_matrix(X)
        if self._single_class is not None:
            return np.full(mat.shape[0], float(self._single_class), dtype=float)
        if self.model is None:
            raise RuntimeError("Modèle non entraîné.")
        return self.model.predict_proba(mat)[:, 1]
