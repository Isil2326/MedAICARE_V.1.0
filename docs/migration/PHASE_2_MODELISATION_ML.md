# Phase 2 — Modélisation IA/ML (option 2)

> **Posture honnête.** Prototype de thèse, **non certifié**, **données simulées uniquement**
> (`is_synthetic=True`), **open-loop strict** : le système ne produit qu'une **probabilité de
> risque** indicative. **Aucune décision thérapeutique automatique.** XAI clinique avancé
> (SHAP/LIME) **reporté en Phase 3**. Aucune métrique inventée : calcul réel ou
> « non calculable ».

## 1. Objectif et périmètre
Construire la couche de **modélisation prédictive du risque glycémique** sur le socle temporel
anti-leakage de la Phase 1, sans franchir aucune des limites de sécurité du recadrage :

- **Cibles** : `hypo` (glycémie < 70 mg/dL) et `hyper` (> 180 mg/dL).
- **Horizons** : **30** et **60** minutes (fenêtre future stricte `(T, T+h]`).
- **Sortie** : probabilité calibrée ∈ [0,1] + libellé indicatif (faible / modéré / élevé /
  non calculable). **Jamais** de dose, d'action ou de prescription.

Hors périmètre (inchangé) : mobile, XAI clinique avancé, données réelles, boucle fermée.

## 2. Architecture du package `backend/app/ml/`

| Module | Rôle |
| --- | --- |
| `config.py` | Constantes : cibles, horizons, seuils (70/180), 18 features, split 0.6/0.2/0.2, stride 30 min, warmup 60 min, chemins d'artefacts, seeds. |
| `schemas.py` | Pydantic : `PredictRequest/Response` (open-loop, aucun champ décision), `MetricsReport`, `RegistryEntry`. |
| `labels.py` | Étiquetage binaire **futur** par horizon, fenêtre `(T, T+h]`, `None` si indéterminable (pas de point futur). |
| `features_adapter.py` | Charge les séries DB → `Point` (ts tz-aware UTC), `build_samples` **pur** réutilisant `feature_engineering` (Phase 1) — features sur le **passé** uniquement. |
| `splits.py` | Split **temporel** train/val/test chronologique, **aligné sur les frontières de timestamps** (`_advance_to_boundary` : un instant ne straddle jamais deux splits) ; double garde `assert_temporal_disjoint` + `assert_no_timestamp_overlap` (0 chevauchement). |
| `models/` | `base.py` (interface), `rules_baseline.py` (règles expertes transparentes), `sklearn_models.py` (LogReg, RandomForest), `xgb_model.py` (XGBoost), `ebm_model.py` (EBM, garde `EBM_AVAILABLE`). |
| `evaluation.py` | AUROC, AUPRC, précision, rappel, F1, spécificité, sensibilité, Brier, ECE, matrice de confusion. **Classe absente → `None` + note** (« non calculable »). |
| `calibration.py` | Platt / Isotonic, appliquée **seulement si elle améliore** (sinon ignorée). |
| `tuning.py` | Optuna **optionnel** ; **fallback grille fixe** (Optuna indisponible dans l'env). |
| `dataset_builder.py` | PG → DataFrame tabulaire (features + labels), méta dataset, écriture Parquet. |
| `registry.py` (+ table `model_registry`) | Registre **JSON canonique** + miroir DB ; **un seul modèle actif** par `(cible, horizon)` garanti par **index unique partiel** ; cycle de vie `status` (active/candidate/archived), `dataset_version`/`features_version`/`synthetic_only`. |
| `training.py` | Pipeline : build → split temporel → train (tous modèles) → **sélection sur validation** → **évaluation unique sur test** → calibration → sauvegarde artefacts → registre. |
| `inference_service.py` | Charge le modèle actif, features à T (passé), renvoie probabilité ou « non calculable ». Cache mémoire par artefact. |
| `build_dataset.py` / `train.py` / `evaluate.py` | CLI. |

## 3. Garanties anti-leakage (rappel et renforcement)
1. **Features** : calculées exclusivement sur les points `ts <= T` (`build_samples` filtre le passé,
   `feature_engineering` Phase 1 refuse tout point futur). Test unitaire : ajouter un point très
   futur **ne modifie aucune feature** d'une ligne existante.
2. **Labels** : regardent **uniquement** le futur `(T, T+h]` pour la **vérité terrain** ; un point
   **à** T est exclu. `None` si pas de futur observable (jamais étiqueté arbitrairement).
3. **Split temporel** : `train.at.max() <= val.at.min() <= test.at.min()`. Pas de mélange aléatoire,
   pas de fuite chronologique. **Sélection de modèle sur validation**, **évaluation finale unique
   sur test**.

## 4. Modèles
- **Règles expertes** (`expert_rules`) : baseline transparente (référence interprétable).
- **LogReg**, **RandomForest** (sklearn), **XGBoost**, **EBM** (interpret).
- Sélection automatique par AUPRC/score de validation ; le modèle retenu est marqué actif dans le
  registre. **EBM disponible** dans l'environnement ; **Optuna indisponible** → grille fixe.

## 5. Endpoint `POST /api/v1/ml/predict` (open-loop)
- **RBAC + ownership** (même résolution que les séries temporelles) : patient → son seul dossier ;
  clinicien/admin → `patient_id` requis ; non authentifié → 401.
- **Horizon** hors {30,60} → 400. **Audit systématique** de toute inférence (`ml.predict`).
- `persist=true` → écrit dans `predictions` (`is_synthetic=True`) et journalise l'écriture.
- Réponse : probabilité (ou `null` + `reason` si non calculable), libellé, `open_loop_notice`
  explicite. **Aucun** champ d'action thérapeutique.

## 6. Reproductibilité
```bash
cd backend
alembic upgrade head          # crée la table model_registry (additif)
python -m app.seed            # données synthétiques (idempotent)
python -m app.ml.build_dataset
python -m app.ml.train        # tous les couples (cible, horizon)
python -m app.ml.evaluate     # ré-évalue les modèles actifs sur le test
python -m pytest -q           # 92 tests verts (66 Phase 1 + 26 Phase 2)
```
Artefacts écrits sous `backend/artifacts/` (**gitignoré** — régénérables via CLI) :
`models/*.joblib`, `registry.json`, `datasets/`, `metrics/`.

## 7. Limites (assumées, non masquées)
- **Données simulées** : les performances ne reflètent **aucune** validité clinique.
- **Petit jeu** (3 profils synthétiques, ~3 jours) : le split temporel peut produire un segment de
  test **mono-classe** → métriques `null` (« non calculable ») — comportement **voulu et honnête**,
  pas un échec.
- **Optuna indisponible** (pas de wheel Linux) → hyper-paramètres par **grille fixe** documentée.
- **Calibration honnête** : appliquée uniquement si elle améliore le calibrage.
- **XAI clinique** (SHAP/LIME, importances par patient) → **Phase 3**.
- **Open-loop strict** : aucune recommandation de dose, aucune fermeture de boucle.

Voir `RAPPORT_PHASE_2.md` pour le détail implémenté / simulé / reste-à-faire.
