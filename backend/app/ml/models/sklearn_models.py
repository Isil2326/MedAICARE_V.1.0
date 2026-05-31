"""Modèles scikit-learn : régression logistique et forêt aléatoire.

Pipeline robuste aux valeurs manquantes : imputation médiane (les features
peuvent être None aux bords de série), puis standardisation (LogReg) ou non
(RF). `class_weight='balanced'` gère le déséquilibre des événements rares.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.ml import config
from app.ml.models.base import BaseRiskModel


class _SklearnRiskModel(BaseRiskModel):
    """Base commune : encapsule un pipeline sklearn, gère la classe unique."""

    def __init__(self, feature_columns: list[str] | None = None):
        super().__init__(feature_columns)
        self.pipeline: Pipeline | None = None
        self._single_class: int | None = None

    def _build_pipeline(self) -> Pipeline:  # pragma: no cover - overridden
        raise NotImplementedError

    def fit(self, X, y):
        mat = self._as_matrix(X)
        y = np.asarray(y).astype(int)
        classes = np.unique(y)
        if len(classes) < 2:
            # Une seule classe observée : on mémorise, predict_proba sera constant.
            self._single_class = int(classes[0])
            self.fitted = True
            return self
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(mat, y)
        self.fitted = True
        return self

    def predict_proba(self, X) -> np.ndarray:
        mat = self._as_matrix(X)
        if self._single_class is not None:
            return np.full(mat.shape[0], float(self._single_class), dtype=float)
        if self.pipeline is None:
            raise RuntimeError("Modèle non entraîné.")
        return self.pipeline.predict_proba(mat)[:, 1]


class LogRegModel(_SklearnRiskModel):
    MODEL_NAME = "logreg"
    MODEL_VERSION = "1.0.0"

    def _build_pipeline(self) -> Pipeline:
        return Pipeline([
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=config.RANDOM_SEED,
            )),
        ])


class RandomForestModel(_SklearnRiskModel):
    MODEL_NAME = "random_forest"
    MODEL_VERSION = "1.0.0"

    def _build_pipeline(self) -> Pipeline:
        return Pipeline([
            ("impute", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(
                n_estimators=300,
                max_depth=8,
                class_weight="balanced",
                random_state=config.RANDOM_SEED,
                n_jobs=-1,
            )),
        ])
