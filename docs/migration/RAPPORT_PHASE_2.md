# Rapport Phase 2 — Modélisation IA/ML (version complète)

> Prototype de thèse · **non certifié** · **données simulées** (`is_synthetic=True`) ·
> **open-loop strict** (probabilités uniquement, aucune décision auto) · anti-leakage strict ·
> aucune métrique inventée. À valider avant tout démarrage de la **Phase 3 (XAI clinique)**.
>
> **Exécution de référence** : seed synthétique (4 profils patients), fenêtre
> **2026-05-28 23:07 → 2026-05-31 21:37 UTC** (~3 jours), 472 lignes d'échantillons.
> Toutes les valeurs ci-dessous sont **réelles** (issues de `artifacts/registry.json` après
> `python -m app.ml.train`) et **régénérables**. Elles n'ont **aucune** portée clinique.

---

## 1. Synthèse en 16 points (points 12 → 16 inclus)

1. **Périmètre tenu.** Modélisation du risque glycémique `hypo`/`hyper` aux horizons **30/60 min**,
   sortie = **probabilité calibrée** uniquement. Aucun champ de décision/dose nulle part.
2. **Anti-leakage by design.** Features sur `ts <= T`, labels sur `(T, T+h]` (vérité terrain), split
   **temporel** train/val/test ; sélection sur **validation**, évaluation unique sur **test**.
3. **Package `backend/app/ml/`** complet : config, schemas, labels, features_adapter, splits,
   models (règles/LogReg/RF/XGBoost/EBM), evaluation, calibration, tuning, dataset_builder,
   registry, training, inference_service, + 3 CLI.
4. **Réutilisation Phase 1.** `feature_engineering` (fonctions pures) consommé tel quel ; **18
   features** sérialisées de façon déterministe (bool → 0/1).
5. **Modèles entraînés.** 5 familles disponibles ; **EBM opérationnel** (interpret 0.7.8).
   Sélection automatique du meilleur par couple `(cible, horizon)` sur la **validation**.
6. **Évaluation réelle, jamais inventée.** AUROC, AUPRC, précision, rappel, F1, spécificité,
   sensibilité, Brier, ECE, confusion. **Classe absente → `null` + note** « non calculable ».
7. **Calibration honnête.** Platt/Isotonic appliquée **seulement si elle améliore** ; statut tracé
   dans le registre (`calibrated`).
8. **Registre de modèles.** Table additive `model_registry` (migrations `b2c3d4e5f6a7` +
   `c3d4e5f6a7b8`) + JSON canonique `artifacts/registry.json` ; **un seul modèle actif** par
   `(cible, horizon)`, garanti par **index unique partiel** en base.
9. **Endpoint open-loop** `POST /api/v1/ml/predict` : **RBAC + ownership**, horizon validé, **audit
   systématique**, `persist` optionnel vers `predictions` (`is_synthetic=True`), `open_loop_notice`
   explicite.
10. **Pipeline exécuté de bout en bout** sur PostgreSQL réel (données seed synthétiques) : 4 couples
    entraînés, artefacts + métriques écrits.
11. **Tests** : **26 Phase 2** + **66 Phase 1** = **92 verts** (dont la régression anti-leakage
    « aucun timestamp partagé entre splits » et la parité cycle de vie JSON↔DB du registry).
12. **Endpoint validé en live** (port 8000) : non authentifié **401**, prédiction valide **200**
    (proba calibrée + `open_loop_notice` + `is_synthetic=true`), horizon invalide **400**.
13. **Robustesse tz.** Normalisation des timestamps en **UTC tz-aware** côté chargement
    (SQLite naïf / PG tz-aware) — corrige une comparaison naïve/aware en inférence.
14. **Optuna indisponible** (pas de wheel Linux) → **fallback grille fixe** documenté ; aucune
    dépendance bloquante.
15. **Reproductibilité** : CLI `build_dataset` / `train` / `evaluate` ; artefacts **gitignorés**
    (régénérables) ; versions `dataset_version` / `features_version` tracées dans le registre.
16. **Limites assumées** (cf. §10) : données simulées, petit jeu rendant le segment de test `hypo`
    **mono-classe** (métriques `null` = honnête), XAI clinique reporté Phase 3, open-loop strict.

---

## 2. Résultats réels par couple `(cible, horizon)`

Sélection du modèle actif **sur la validation** (max AUROC, départage AUPRC) ; métriques
**rapportées sur le test** (jamais vu en sélection). Seuil de décision = 0.5.

### 2.1 hypo · 30 min — modèle actif : `logreg` (calibré : oui)
| Élément | Valeur |
| --- | --- |
| Taille train / val / test | **283 / 96 / 93** |
| Taux de positifs train / val / test | 6,01 % (17) / 8,33 % (8) / **0,00 % (0)** |
| AUROC | **non calculable** (test mono-classe) |
| AUPRC | **non calculable** |
| Précision | **non calculable** |
| Rappel / Sensibilité | **non calculable** |
| Spécificité | 1,000 |
| F1 | **non calculable** |
| Brier Score | 0,00007 |
| ECE | 0,0029 |
| Matrice de confusion (TN, FP, FN, TP) | **93, 0, 0, 0** |
| Calibration appliquée | oui (Platt/Isotonic conditionnelle) |
| **Justification** | Val : `logreg` AUROC 0,9134 / AUPRC **0,6827** à égalité d'AUROC avec EBM (0,9134) mais **AUPRC supérieure** (vs 0,5567) — départage en faveur de la classe rare. |

### 2.2 hypo · 60 min — modèle actif : `ebm` (calibré : oui)
| Élément | Valeur |
| --- | --- |
| Taille train / val / test | **283 / 96 / 93** |
| Taux de positifs train / val / test | 8,13 % (23) / 11,46 % (11) / **0,00 % (0)** |
| AUROC | **non calculable** (test mono-classe) |
| AUPRC | **non calculable** |
| Précision | **non calculable** |
| Rappel / Sensibilité | **non calculable** |
| Spécificité | 1,000 |
| F1 | **non calculable** |
| Brier Score | 0,000 |
| ECE | 0,000 |
| Matrice de confusion (TN, FP, FN, TP) | **93, 0, 0, 0** |
| Calibration appliquée | oui |
| **Justification** | Val : `ebm` **AUROC 0,9818** (meilleure ; vs xgboost 0,9797, logreg 0,9786) et **AUPRC 0,8315** (meilleure). |

### 2.3 hyper · 30 min — modèle actif : `random_forest` (calibré : oui)
| Élément | Valeur |
| --- | --- |
| Taille train / val / test | **283 / 96 / 93** |
| Taux de positifs train / val / test | 25,44 % (72) / 15,62 % (15) / 15,05 % (14) |
| AUROC | **0,943** |
| AUPRC | **0,609** |
| Précision | 0,600 |
| Rappel / Sensibilité | 0,857 |
| Spécificité | 0,899 |
| F1 | 0,706 |
| Brier Score | 0,0748 |
| ECE | 0,0378 |
| Matrice de confusion (TN, FP, FN, TP) | **71, 8, 2, 12** |
| Calibration appliquée | oui |
| **Justification** | Val : `random_forest` **AUROC 0,9556** (meilleure) et **AUPRC 0,7621** (meilleure ; vs ebm 0,7441, logreg 0,7426). |

### 2.4 hyper · 60 min — modèle actif : `ebm` (calibré : oui)
| Élément | Valeur |
| --- | --- |
| Taille train / val / test | **283 / 96 / 93** |
| Taux de positifs train / val / test | 30,04 % (85) / 21,88 % (21) / 19,35 % (18) |
| AUROC | **0,974** |
| AUPRC | **0,844** |
| Précision | 0,720 |
| Rappel / Sensibilité | 1,000 |
| Spécificité | 0,907 |
| F1 | 0,837 |
| Brier Score | 0,0574 |
| ECE | 0,0519 |
| Matrice de confusion (TN, FP, FN, TP) | **68, 7, 0, 18** |
| Calibration appliquée | oui |
| **Justification** | Val : `ebm` **AUROC 0,9784** (meilleure) et **AUPRC 0,8971** (meilleure ; vs random_forest 0,8844, logreg 0,8824). EBM = modèle « verre transparent », pertinent pour la Phase 3. |

> **« non calculable » = choix d'honnêteté, pas un échec masqué.** Les segments de test `hypo`
> (30 et 60 min) ne contiennent **aucun positif** : AUROC/AUPRC/précision/rappel/F1 n'y sont **pas
> définissables**, donc renvoyés `null` (cf. §10, limite « distribution artificielle du seed »).
> Le code **n'invente jamais** de valeur de remplacement.

---

## 3. Liste exacte des 18 features

Ordre canonique (`app.ml.config.FEATURE_COLUMNS`), identique dans chaque artefact
(`feature_columns` du registre). Booléens sérialisés en 0/1.

| # | Feature | Description |
| --- | --- | --- |
| 1 | `cgm_mean_30` | Moyenne CGM, fenêtre passée 30 min |
| 2 | `cgm_mean_60` | Moyenne CGM, fenêtre passée 60 min |
| 3 | `cgm_std_30` | Écart-type CGM, 30 min |
| 4 | `cgm_slope_30` | Pente (régression) CGM, 30 min |
| 5 | `cgm_dg_dt` | Dérivée instantanée (mg/dL/min) |
| 6 | `cgm_delta_15` | Variation sur 15 min |
| 7 | `cgm_delta_30` | Variation sur 30 min |
| 8 | `cgm_delta_60` | Variation sur 60 min |
| 9 | `tir_60` | Time-in-range (70–180), 60 min |
| 10 | `minutes_since_meal` | Minutes depuis le dernier repas |
| 11 | `minutes_since_insulin` | Minutes depuis la dernière insuline |
| 12 | `post_prandial` (bool) | Fenêtre post-prandiale active |
| 13 | `post_insulin` (bool) | Fenêtre post-injection active |
| 14 | `hour_of_day` | Heure du jour (0–23) |
| 15 | `day_of_week` | Jour de semaine (0–6) |
| 16 | `is_night` (bool) | Période nocturne |
| 17 | `cgm_count_60` | Nb de points CGM, 60 min |
| 18 | `cgm_gap_60` (bool) | Trou de données CGM sur 60 min |

Toutes calculées **uniquement à partir de `ts <= T`** (fonctions pures de Phase 1, refusant tout
point futur).

---

## 4. Stratégie de split temporel exacte (anti-leakage)

Split **purement chronologique** (jamais aléatoire) sur la colonne `at`, fractions
**0,6 / 0,2 / 0,2** (`app.ml.splits.temporal_split`). Train = passé le plus ancien, test = futur
le plus récent. Périodes réelles de l'exécution de référence :

| Split | n | Période (UTC) |
| --- | --- | --- |
| **train** | 283 | 2026-05-28 23:07:00 → 2026-05-30 21:37:00 |
| **validation** | 96 | 2026-05-30 22:05:38 → 2026-05-31 09:37:00 |
| **test** | 93 | 2026-05-31 10:05:38 → 2026-05-31 21:37:00 |

**Garanties anti-leakage (vérifiées, pas seulement déclarées) :**
- **Coupes alignées sur les frontières de timestamps** (`_advance_to_boundary`) : un instant `at`
  donné — potentiellement partagé par plusieurs patients — appartient **entièrement à un seul
  split**. Aucun instant ne peut être coupé en deux.
- **Aucun timestamp du train ne fuit** dans validation/test ; **aucun** chevauchement non plus
  entre validation et test. Mesuré sur les 4 couples : **chevauchement = 0 / 0 / 0**
  (train∩val, val∩test, train∩test).
- Double garde levant une exception en cas de violation :
  `assert_temporal_disjoint` (`max(train.at) < min(val.at) < ...`) **et**
  `assert_no_timestamp_overlap` (intersection ensembliste vide).
- Features sur `ts <= T` uniquement ; labels sur `(T, T+h]` (la vérité terrain regarde le futur,
  **jamais** les features).
- **Régression de test dédiée** : `test_temporal_split_no_timestamp_leaks_across_splits`
  (instants dupliqués entre 2 patients → vérifie l'absence de straddle au bord).

---

## 5. Table `model_registry` (structure + contraintes)

Miroir DB requêtable du registre JSON canonique (`artifacts/registry.json`). Modèle
SQLAlchemy `app.models.ml_registry.ModelRegistryEntry`.

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | UUID | clé primaire |
| `model_id` | String(120) | **unique**, indexé — identifiant horodaté de l'artefact |
| `target` | String(20) | indexé — `hypo` / `hyper` |
| `horizon_min` | Integer | indexé — 30 / 60 |
| `model_name` | String(80) | `logreg` / `random_forest` / `xgboost` / `ebm` / `expert_rules` |
| `model_version` | String(40) | semver de la famille (`1.0.0`) |
| `artifact_path` | String(255) | chemin du `.joblib` |
| `calibrated` | Boolean | calibration appliquée ou non |
| `is_active` | Boolean | indexé — drapeau d'activation |
| `status` | String(20) | indexé — **`active` / `candidate` / `archived`** |
| `dataset_version` | String(40) | version de définition du dataset (`1.0.0`) |
| `features_version` | String(40) | version de définition des features (`1.0.0`) |
| `synthetic_only` | Boolean | **toujours `True`** (contrainte projet) |
| `feature_columns` | JSON | les 18 features (ordre canonique) |
| `metrics` | JSON | `validation` + `test` (toutes métriques §2) |
| `dataset_meta` | JSON | effectifs, prévalences, fenêtre, `is_synthetic` |
| `created_at` / `updated_at` | DateTime(tz) | horodatage |

**Contraintes :**
- `model_id` **unique** (index `ix_model_registry_model_id`).
- **Un seul modèle actif par `(target, horizon_min)`** — garanti au niveau **base** par un
  **index UNIQUE PARTIEL** `uq_model_registry_active_couple` sur `(target, horizon_min)` filtré
  sur `is_active` (clauses `postgresql_where` / `sqlite_where`). À l'enregistrement, les anciens
  modèles du couple sont d'abord **archivés** (`is_active=False`, `status='archived'`) **puis**
  le nouveau actif est inséré (ordre garantissant l'absence de double-actif transitoire).
- Indexes additionnels sur `target`, `horizon_min`, `is_active`, `status`.

**Vérification réelle (DB de référence)** : 4 couples → **exactement 1 actif chacun** ;
`status` = {active: 4, archived: 8} ; `synthetic_only` = True partout ;
`dataset_version` = `features_version` = `1.0.0`.

---

## 6. Artefacts produits + convention de versioning

Tous sous `backend/artifacts/` (**gitignorés**, **régénérables**) :

| Type | Chemin |
| --- | --- |
| Modèles | `backend/artifacts/models/<model_name>-<target>-<horizon>-<YYYYMMDDHHMMSS>.joblib` |
| Dataset | `backend/artifacts/datasets/dataset.parquet` |
| Méta dataset | `backend/artifacts/datasets/dataset.meta.json` |
| Métriques JSON | `backend/artifacts/metrics/` (par entraînement) |
| Registre canonique | `backend/artifacts/registry.json` |

Modèles actifs de référence :
- `models/logreg-hypo-30-20260531233838.joblib`
- `models/ebm-hypo-60-20260531233850.joblib`
- `models/random_forest-hyper-30-20260531233907.joblib`
- `models/ebm-hyper-60-20260531233922.joblib`

**Convention de versioning :**
- `model_id = <model_name>-<target>-<horizon>-<timestamp>` → identifiant **unique** par
  entraînement (traçabilité, pas d'écrasement).
- `model_version` = semver de la **famille** de modèle (`1.0.0`).
- `dataset_version` (`1.0.0`) / `features_version` (`1.0.0`) = versions de **définition**,
  incrémentées manuellement en cas de changement de schéma dataset/features.
- `registry.json` = source canonique côté fichiers (`{"version": 1, "models": [...]}`), la table
  DB en est le miroir.

---

## 7. Commandes réellement utilisées

```bash
# 1. Construire le dataset tabulaire (PG → Parquet + méta JSON)
cd backend && python -m app.ml.build_dataset

# 2. Entraîner les 4 couples (build → split → train → eval → calibrate → save → registry)
cd backend && python -m app.ml.train
#   (ciblage possible : python -m app.ml.train --target hyper --horizon 60)

# 3. Évaluer le(s) modèle(s) actif(s) sur le test
cd backend && python -m app.ml.evaluate

# 4. Tests
cd backend && python -m pytest -q

# Pré-requis base (rappel) :
cd backend && alembic upgrade head && python -m app.seed
```

---

## 8. Sortie complète des tests

```text
92 passed in ~18s
```
Répartition : **66 tests Phase 1** (conservés verts) + **26 tests Phase 2** (labels,
anti-leakage features, splits + **régression no-timestamp-leak**, évaluation classe-absente,
calibration, dataset_builder, training, inference, registry, endpoint RBAC/ownership/audit/persist,
coercition tz, filtre `is_synthetic`). Exécutés sur SQLite isolé (`create_all`), production sur
PostgreSQL.

---

## 9. Documentation produite

- `docs/migration/PHASE_2_MODELISATION_ML.md` — architecture, choix, procédure.
- `docs/migration/RAPPORT_PHASE_2.md` — **ce rapport** (sections limites scientifiques §10,
  anti-leakage §4, calibration §2 + ci-dessous).
- `backend/README.md` + `replit.md` — mis à jour (exécution, stack, périmètre Phase 2).

**Section calibration.** Calibration **conditionnelle** (Platt/Isotonic) appliquée par couple
**uniquement si elle améliore** le Brier/ECE sur la validation ; sinon le modèle brut est conservé.
Le statut final est tracé (`calibrated`). Sur l'exécution de référence, les 4 modèles actifs sont
calibrés. La qualité de calibration est mesurée par **Brier** et **ECE** (cf. §2), jamais inventée.

---

## 10. Limites scientifiques assumées

- **Données simulées uniquement** (`is_synthetic=True`) — aucune donnée patient réelle.
- **Absence totale de validation clinique** — aucune lecture des chiffres comme « performance
  clinique ».
- **Taille du dataset très faible** : 472 lignes, 4 profils, ~3 jours.
- **Robustesse limitée** : variance élevée, pas d'intervalle de confiance fiable.
- **Généralisation impossible** : un seed synthétique ne représente pas la diversité réelle.
- **Résultats non interprétables comme performance clinique** — métriques indicatives seulement.
- **Distribution artificielle du seed** : les hypoglycémies sont concentrées hors de la fenêtre
  de test → **test `hypo` mono-classe** → AUROC/AUPRC/précision/rappel/F1 **non calculables**
  (rapportés `null`, jamais inventés). Un jeu plus long/plus varié corrigerait cela.
- **Validation externe ultérieure indispensable** avant toute revendication.
- **Optuna indisponible** (pas de wheel) → recherche d'hyperparamètres par **grille fixe**
  documentée (sous-optimale mais reproductible).

---

## 11. Endpoint ML disponible

**`POST /api/v1/ml/predict`** — open-loop strict.

**Payload (`PredictRequest`)**
```json
{
  "patient_id": "uuid (optionnel pour un patient ; REQUIS pour clinicien/admin)",
  "target": "hypo | hyper",
  "horizon_min": 30,
  "at": "2026-05-31T12:00:00Z (optionnel ; défaut = maintenant)",
  "persist": false
}
```

**Réponse (`PredictResponse`)** — exemple réel (live, port 8000) :
```json
{
  "patient_id": "b63aa08d-...","at": "2026-05-31T23:41:04.919590Z",
  "target": "hyper","horizon_min": 60,
  "probability": 0.1083,"risk_label": "faible","calculable": true,"reason": null,
  "model_name": "ebm","model_version": "1.0.0","calibrated": true,
  "is_synthetic": true,"persisted": false,"prediction_id": null,"n_cgm_points": 288,
  "open_loop_notice": "Score de risque indicatif (open-loop, données simulées). Aucune décision thérapeutique automatique : validation clinique humaine requise."
}
```

- **RBAC + ownership** : un **patient** n'accède qu'à **son** dossier (`patient_id` contrôlé) ;
  **clinicien/admin** doivent fournir `patient_id` (résolu via `resolve_read_scope`).
- **Audit** : **toute** inférence est auditée (persistée ou non) via `audit_service.record`.
- **Option `persist`** : si `true` **et** prédiction calculable → écriture dans `predictions`
  avec **`is_synthetic=True`** (et audit de l'écriture).
- **Garantie open-loop** : la réponse ne contient **que** une probabilité + libellé de risque +
  `open_loop_notice`. **Aucune** dose, **aucune** recommandation, **aucune** action.
- **Cas d'erreur** : `401` non authentifié · `403` accès à un dossier non autorisé · `404`
  patient introuvable · `400` cible/horizon invalide (ou `patient_id` manquant pour
  clinicien/admin) · `422` payload mal formé.

---

## 12. Tests endpoint ML (couverture)

| Cas | Attendu | Couvert |
| --- | --- | --- |
| Patient autorisé (son dossier) | 200 + proba | ✅ test + live |
| Patient non propriétaire | 403 | ✅ |
| Clinicien/admin avec `patient_id` | 200 | ✅ test + live |
| Clinicien/admin sans `patient_id` | 400 | ✅ |
| Non authentifié | 401 | ✅ test + **live (401)** |
| Horizon invalide | 400 | ✅ test + **live (400)** |
| `persist=true` → écrit `predictions` (`is_synthetic=True`) | prediction_id non nul | ✅ |
| Audit créé à chaque appel | entrée audit | ✅ |

---

## 13. Confirmations explicites

- ✅ **Aucune recommandation automatique** n'est générée.
- ✅ **Aucune dose** n'est suggérée.
- ✅ **Aucune notification clinique automatique** n'est déclenchée.
- ✅ Les prédictions persistées restent **`is_synthetic=True`**.
- ✅ **SHAP/LIME ne sont pas présentés comme validés** — la **Phase 3 (XAI clinique) n'est pas
  démarrée**. Le choix d'EBM (modèle intrinsèquement interprétable) prépare cette phase sans
  rien anticiper.

---

## Conformité aux contraintes non négociables
✅ Données simulées · ✅ Open-loop strict (probas seules) · ✅ Anti-leakage (features passé /
labels futur, **0 chevauchement de timestamp** vérifié) · ✅ Aucune métrique inventée · ✅ Pas de
mobile · ✅ Pas de XAI avancé · ✅ RBAC + ownership + audit. **Phase 3 non démarrée** (en attente
de validation de ce rapport).
