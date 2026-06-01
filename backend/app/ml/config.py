"""Configuration centrale de la Phase 2 (ML) — constantes, seuils, chemins.

Aucune logique : uniquement des constantes et des chemins d'artefacts. Importé
partout dans `app.ml` ; volontairement SANS dépendance ML lourde (numpy/sklearn)
pour rester importable dans des tests rapides.
"""
from __future__ import annotations

from pathlib import Path

# --- Cible clinique --------------------------------------------------------
# Seuils physiologiques standard (mg/dL). Cohérents avec feature_engineering.
HYPO_THRESHOLD = 70.0   # hypoglycémie : glycémie < 70
HYPER_THRESHOLD = 180.0  # hyperglycémie : glycémie > 180

TARGETS = ("hypo", "hyper")          # événements prédits (open-loop : risque seul)
HORIZONS_MIN = (30, 60)              # horizons de prédiction en minutes

# --- Reproductibilité ------------------------------------------------------
RANDOM_SEED = 42

# --- Versioning des artefacts ----------------------------------------------
# Conventions de versions (incrémentées manuellement lors d'un changement de
# définition). `model_id` reste l'identifiant unique horodaté par entraînement.
DATASET_VERSION = "1.1.0"   # Phase 2.1 : benchmark synthétique v2 (10 profils, 14 j)
FEATURES_VERSION = "1.0.0"  # définition des 18 features (FEATURE_COLUMNS) — inchangée
# Statuts du cycle de vie d'un modèle dans le registre.
MODEL_STATUS_ACTIVE = "active"
MODEL_STATUS_CANDIDATE = "candidate"
MODEL_STATUS_ARCHIVED = "archived"

# --- Statut d'évaluation scientifique (Phase 2.1) --------------------------
# Un couple (target, horizon) n'est ACTIVABLE que s'il est évaluable sur le test
# (au moins un positif ET un négatif). Sinon le modèle reste candidat documenté.
EVAL_STATUS_EVALUATED = "evaluated"                       # >= MIN_TEST_POSITIVES positifs
EVAL_STATUS_INSUFFICIENT = "insufficient_test_positives"  # 1..MIN-1 positifs (évaluable, fragile)
EVAL_STATUS_MONO_CLASS = "not_evaluable_mono_class_test"  # 0 positif OU 0 négatif → non activable
EVAL_STATUS_CANDIDATE_ONLY = "candidate_only"
# Seuil recommandé de positifs dans le test pour considérer un couple « évalué ».
MIN_TEST_POSITIVES = 10

# --- Construction du dataset ----------------------------------------------
# Cadence d'échantillonnage des instants d'évaluation T (réduit l'autocorrélation
# entre lignes consécutives ; le CGM simulé est à 15 min).
SAMPLE_STRIDE_MIN = 30
# Historique minimal requis avant de produire une ligne (warmup anti-bord).
WARMUP_MIN = 60
# Fenêtres de features (passées) — alignées sur feature_engineering.
WINDOW_SHORT_MIN = 30.0
WINDOW_LONG_MIN = 60.0

# --- Splits temporels ------------------------------------------------------
# Fractions chronologiques (train le plus ancien, test le plus récent).
SPLIT_FRACTIONS = (0.6, 0.2, 0.2)  # (train, val, test)

# --- Features --------------------------------------------------------------
# Ordre canonique des colonnes de features (doit matcher compute_features,
# clé "at" exclue). Les booléens sont sérialisés en 0/1, les None en NaN.
FEATURE_COLUMNS: tuple[str, ...] = (
    "cgm_mean_30",
    "cgm_mean_60",
    "cgm_std_30",
    "cgm_slope_30",
    "cgm_dg_dt",
    "cgm_delta_15",
    "cgm_delta_30",
    "cgm_delta_60",
    "tir_60",
    "minutes_since_meal",
    "minutes_since_insulin",
    "post_prandial",
    "post_insulin",
    "hour_of_day",
    "day_of_week",
    "is_night",
    "cgm_count_60",
    "cgm_gap_60",
)
# Colonnes booléennes parmi les features (sérialisées 0/1).
BOOL_FEATURE_COLUMNS = ("post_prandial", "post_insulin", "is_night", "cgm_gap_60")

# --- Chemins d'artefacts ---------------------------------------------------
# Racine = backend/ (parent de app/). Artefacts volumineux, non versionnés.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = BACKEND_ROOT / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"
DATASETS_DIR = ARTIFACTS_DIR / "datasets"
METRICS_DIR = ARTIFACTS_DIR / "metrics"
REGISTRY_JSON = ARTIFACTS_DIR / "registry.json"


def ensure_dirs() -> None:
    """Crée les répertoires d'artefacts s'ils n'existent pas (idempotent)."""
    for d in (ARTIFACTS_DIR, MODELS_DIR, DATASETS_DIR, METRICS_DIR):
        d.mkdir(parents=True, exist_ok=True)


def label_column(target: str, horizon_min: int) -> str:
    """Nom de colonne de label normalisé, ex. `label_hypo_30`."""
    return f"label_{target}_{horizon_min}"


def threshold_for(target: str) -> float:
    if target == "hypo":
        return HYPO_THRESHOLD
    if target == "hyper":
        return HYPER_THRESHOLD
    raise ValueError(f"Cible inconnue : {target!r} (attendu : {TARGETS}).")
