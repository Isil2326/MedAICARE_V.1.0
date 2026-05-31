"""Explainable Boosting Machine (EBM, InterpretML) — modèle « glassbox ».

Intelligibilité NATIVE (fonctions de forme additives par feature) — utile pour la
transparence sans recourir à SHAP/LIME (réservés Phase 3). Si `interpret` n'est
pas installable dans l'environnement, ce module reste importable et expose
`EBM_AVAILABLE = False` : on N'INVENTE PAS de modèle de remplacement, on documente
simplement l'indisponibilité.
"""
from __future__ import annotations

import numpy as np

from app.ml import config
from app.ml.models.base import BaseRiskModel

try:
    from interpret.glassbox import ExplainableBoostingClassifier

    EBM_AVAILABLE = True
except Exception:  # pragma: no cover - dépend de l'environnement
    ExplainableBoostingClassifier = None  # type: ignore
    EBM_AVAILABLE = False


class ExplainableBoostingModel(BaseRiskModel):
    MODEL_NAME = "ebm"
    MODEL_VERSION = "1.0.0"

    def __init__(self, feature_columns: list[str] | None = None):
        super().__init__(feature_columns)
        if not EBM_AVAILABLE:
            raise RuntimeError(
                "EBM indisponible : le paquet `interpret` n'est pas installé. "
                "Aucun modèle de substitution n'est fabriqué (posture honnête)."
            )
        self.model = None
        self._single_class: int | None = None

    def fit(self, X, y):
        mat = self._as_matrix(X)
        y = np.asarray(y).astype(int)
        classes = np.unique(y)
        if len(classes) < 2:
            self._single_class = int(classes[0])
            self.fitted = True
            return self
        self.model = ExplainableBoostingClassifier(
            feature_names=self.feature_columns,
            random_state=config.RANDOM_SEED,
        )
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
