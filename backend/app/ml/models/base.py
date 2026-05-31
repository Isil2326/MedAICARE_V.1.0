"""Interface commune des modèles de risque (open-loop).

Contrat minimal : `fit(X, y)`, `predict_proba(X) -> P(classe=1)`, `save`, `load`.
Les modèles consomment un `DataFrame` (colonnes = features canoniques) ou un
`ndarray` aligné sur `feature_columns`. La persistance se fait via joblib sur
l'instance complète (l'estimateur entraîné est encapsulé).
"""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.ml import config


class BaseRiskModel:
    """Classe de base. `MODEL_NAME` / `MODEL_VERSION` identifient l'algorithme."""

    MODEL_NAME = "base"
    MODEL_VERSION = "0.0.0"

    def __init__(self, feature_columns: list[str] | None = None):
        self.feature_columns: list[str] = list(feature_columns or config.FEATURE_COLUMNS)
        self.fitted: bool = False

    # --- Accès noms -------------------------------------------------------
    @property
    def name(self) -> str:
        return self.MODEL_NAME

    @property
    def version(self) -> str:
        return self.MODEL_VERSION

    # --- Conversion entrée -----------------------------------------------
    def _as_matrix(self, X) -> np.ndarray:
        """Aligne X sur `feature_columns` et renvoie un ndarray float (NaN conservés)."""
        if isinstance(X, pd.DataFrame):
            X = X.reindex(columns=self.feature_columns)
            return X.to_numpy(dtype=float)
        arr = np.asarray(X, dtype=float)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        return arr

    # --- Contrat ----------------------------------------------------------
    def fit(self, X, y) -> "BaseRiskModel":  # pragma: no cover - interface
        raise NotImplementedError

    def predict_proba(self, X) -> np.ndarray:  # pragma: no cover - interface
        raise NotImplementedError

    # --- Persistance ------------------------------------------------------
    def save(self, path: str | Path) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        return path

    @staticmethod
    def load(path: str | Path) -> "BaseRiskModel":
        return joblib.load(Path(path))
