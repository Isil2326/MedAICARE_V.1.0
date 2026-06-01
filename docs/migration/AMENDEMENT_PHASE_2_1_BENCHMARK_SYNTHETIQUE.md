# Amendement Phase 2.1 — Remédiation scientifique du benchmark synthétique

> **Statut : livré, en attente de validation superviseur.**
> Données **100 % simulées** (`is_synthetic=True`), **open-loop strict** (probabilités
> uniquement, aucune décision/dose), **anti-leakage strict**, **aucune métrique inventée**,
> **aucune XAI clinique** (réservée Phase 3). Prototype académique non certifié.

## 1. Objectif

Rendre **évaluables sur le jeu de test** les **quatre** couples `(cible, horizon)` :
`hypo 30`, `hypo 60`, `hyper 30`, `hyper 60`. Un couple est dit *évaluable* lorsque son
segment de test contient **à la fois** des positifs **et** des négatifs (métriques de
ranking AUROC/AUPRC calculables).

## 2. Raison de l'amendement

La Phase 2 a été validée techniquement, mais le superviseur a **bloqué le passage à la
Phase 3 (XAI clinique)** pour une raison scientifique : produire des explications sur des
modèles dont le comportement test n'a jamais été observé sur des **cas positifs** est
méthodologiquement fragile.

## 3. Problème du test mono-classe (hypo)

Sur le benchmark v1 (3 profils, ~3 jours), les segments de **test** `hypo 30` et `hypo 60`
étaient **mono-classe (0 positif)**. Les hypoglycémies, rares et concentrées dans le temps,
tombaient hors de la fenêtre de test (la plus récente du split temporel 60/20/20). Les
métriques principales restaient donc `null` — honnêtement rapportées, mais les modèles hypo
ne pouvaient pas être considérés comme évalués.

## 4. Stratégie : dataset synthétique v2

Le seed temporel a été **réécrit** (`backend/app/seed_timeseries.py`) pour produire un
benchmark **scénarisé** garantissant la présence des deux classes dans **chaque** période
temporelle (train / validation / test), **sans fuite de label** :

- **10 profils** patients synthétiques (cf. §5), **14 jours**, CGM toutes les **5 minutes** ;
- épisodes hypo (<70) et hyper (>180) **programmés quotidiennement** (et non sur quelques
  jours), de sorte qu'ils tombent **naturellement** dans les trois segments du split
  chronologique ;
- contexte complet : **repas**, **insuline** (bolus, ratio glucides/insuline ajusté pour
  les profils insulino-sensibles), **activité** ;
- profil `sparse_cgm` : **lacunes** CGM (~35 % de points manquants) pour tester la
  robustesse aux trous (`cgm_gap_60`, `cgm_count_60`) ;
- **toutes** les lignes restent `is_synthetic=True`.

> **Posture honnête.** Ce benchmark est un **dispositif de test scénarisé**, **jamais**
> une représentation de patients réels. La « clé de scénario » d'un profil pilote
> **uniquement la génération** du seed ; elle n'est **jamais** exposée comme feature
> (cf. §7, anti-fuite vérifiée par test).

`DATASET_VERSION` passe de `1.0.0` à **`1.1.0`** ; `FEATURES_VERSION` reste `1.0.0`
(les 18 features sont inchangées).

## 5. Profils synthétiques

| Clé de scénario        | Email                         | Type | Caractéristique générée |
|------------------------|-------------------------------|------|--------------------------|
| `stable`               | patient.stable@demo.fr        | T1   | Glycémie équilibrée, faibles excursions |
| `hypo_prone`           | patient.hypo@demo.fr          | T1   | Hypo nocturne + dip matinal post-insuline |
| `hyper_prone`          | patient.hyper@demo.fr         | T2   | Excursions post-prandiales quotidiennes |
| `post_prandial_hyper`  | patient.pphyper@demo.fr       | T2   | Forte hyper post-déjeuner |
| `nocturnal_hypo`       | patient.nighthypo@demo.fr     | T1   | Creux nocturne profond (2–4 h) |
| `high_variability`     | patient.variable@demo.fr      | T1   | Forte variabilité, hypo + hyper |
| `sparse_cgm`           | patient.sparse@demo.fr        | T2   | Lacunes CGM (~35 %) + hyper |
| `insulin_sensitive`    | patient.sensitive@demo.fr     | T1   | Chutes marquées ~1 h après bolus |
| `stable` (variante)    | patient.stable2@demo.fr       | T2   | Équilibré (second cas stable) |
| `mixed`                | patient.mixed@demo.fr         | T1   | Hypo un jour sur deux + hyper |

## 6. Split temporel

Split **chronologique strict** 60/20/20 sur l'instant `at`, **aligné sur les frontières de
timestamps** (aucun timestamp partagé entre segments — vérifié par
`assert_no_timestamp_overlap`). Train = passé, validation = intermédiaire, test = futur.
Les positifs sont présents dans chaque segment **par conception du seed** (épisodes
quotidiens), **pas** par fuite de label.

- Fenêtre temporelle : **2026-05-18 → 2026-06-01** (~14 jours).
- Dataset : **6 693 lignes**, **11 patients** synthétiques (10 profils v2 + le patient
  démo `patient@demo.fr`, lui aussi `is_synthetic=True`).
- Tailles par segment (lignes labellisées par couple) : **train ≈ 4 020 · val ≈ 1 346 ·
  test ≈ 1 327**.

### Distribution des classes (dataset complet)

| Couple      | Labellisés | Positifs | Négatifs | Prévalence |
|-------------|-----------:|---------:|---------:|-----------:|
| `hypo_30`   | 6 692      | 206      | 6 486    | 3,08 %     |
| `hypo_60`   | 6 693      | 272      | 6 421    | 4,06 %     |
| `hyper_30`  | 6 692      | 1 093    | 5 599    | 16,33 %    |
| `hyper_60`  | 6 693      | 1 347    | 5 346    | 20,13 %    |

### Positifs par segment (critère ≥ 1 pos & 1 nég partout — SATISFAIT)

| Couple      | Pos. train | Pos. val | Pos. test | Critère recommandé (≥ 10 test) |
|-------------|-----------:|---------:|----------:|:------------------------------:|
| `hypo_30`   | 133        | 43       | 30        | ✅ |
| `hypo_60`   | 174        | 58       | 40        | ✅ |
| `hyper_30`  | 657        | 221      | 215       | ✅ |
| `hyper_60`  | 808        | 276      | 263       | ✅ |

Les **4 couples** sont désormais évaluables sur le test, avec ≥ 10 positifs chacun.

## 7. Pas de fuite par scénario (anti-leakage)

Aucune variable de scénario n'est utilisée comme feature. Les 18 `FEATURE_COLUMNS` restent
**physiologiques/temporelles** (moyennes/écart-type/pente CGM, TIR, minutes depuis
repas/insuline, heure, jour, nuit, comptage/gap CGM). `patient_id` et `at` sont des
colonnes **structurelles** (clé de groupe du split, instant d'évaluation), **jamais**
features : `X = df[FEATURE_COLUMNS]` exclusivement.

Tests dédiés (`tests/test_ml_unit.py`) :
- `test_feature_columns_have_no_scenario_leakage` — aucun champ `profile/scenario/
  patient_id/hypo_prone/hyper_prone/label/...` dans `FEATURE_COLUMNS` ;
- `test_build_samples_row_features_subset_of_feature_columns` — une ligne d'échantillon ne
  contient que features + labels + colonnes structurelles.

## 8. Métriques recalculées (calcul réel, jeu de test, seuil 0.5)

> Métriques **calibrées** (isotonic appliquée quand elle améliore la calibration en
> validation). Valeurs **réelles** — aucune n'est inventée.

| Couple     | Modèle actif    | Calib. | AUROC  | AUPRC  | Préc.  | Rappel/Sens. | Spéc.  | F1     | Brier  | ECE    |
|------------|-----------------|:------:|-------:|-------:|-------:|-------------:|-------:|-------:|-------:|-------:|
| `hypo_30`  | EBM             | oui    | 0,9995 | 0,9590 | 0,9655 | 0,9333       | 0,9992 | 0,9492 | 0,0018 | 0,0051 |
| `hypo_60`  | Random Forest   | oui    | 0,9934 | 0,9043 | 0,9459 | 0,8750       | 0,9984 | 0,9091 | 0,0054 | 0,0073 |
| `hyper_30` | XGBoost         | oui    | 0,9953 | 0,9815 | 0,9531 | 0,9442       | 0,9910 | 0,9486 | 0,0148 | 0,0094 |
| `hyper_60` | XGBoost         | oui    | 0,9959 | 0,9807 | 0,9000 | 0,9582       | 0,9737 | 0,9282 | 0,0205 | 0,0121 |

### Matrices de confusion (test, seuil 0.5)

| Couple     | TN    | FP | FN | TP  |
|------------|------:|---:|---:|----:|
| `hypo_30`  | 1 296 | 1  | 2  | 28  |
| `hypo_60`  | 1 285 | 2  | 5  | 35  |
| `hyper_30` | 1 102 | 10 | 12 | 203 |
| `hyper_60` | 1 036 | 28 | 11 | 252 |

### Justification du choix du modèle actif

Sélection **sur la validation** (max AUROC, départage par Brier le plus faible), évaluation
**unique** sur le test. Le modèle gagnant diffère selon le couple (EBM, Random Forest,
XGBoost), ce qui reflète une sélection honnête par couple plutôt qu'un favori imposé.

> ⚠️ **Lecture critique des scores.** Ces AUROC/AUPRC très élevés sont attendus sur un
> benchmark **scénarisé** où les épisodes sont générés selon des règles régulières : la
> tâche est plus séparable que la réalité clinique. Ces chiffres mesurent la **cohérence du
> pipeline**, **pas** une performance clinique transférable.

## 9. Intervalles d'incertitude (bootstrap)

Bootstrap par rééchantillonnage du test avec remise, **200 répétitions**, graine fixe
(`RANDOM_SEED=42`), IC percentile **95 %** (`evaluation.bootstrap_metrics`). Appliqué à
AUROC, AUPRC, F1, Brier. Si une métrique n'est jamais définie (rééchantillon mono-classe),
ses bornes valent `None` — **jamais inventées**.

| Couple     | AUROC IC95            | AUPRC IC95            | F1 IC95               | Brier IC95            |
|------------|-----------------------|-----------------------|-----------------------|-----------------------|
| `hypo_30`  | [0,9986 ; 1,0000]     | [0,8914 ; 1,0000]     | [0,8845 ; 1,0000]     | [0,0003 ; 0,0039]     |
| `hypo_60`  | [0,9837 ; 0,9991]     | [0,8240 ; 0,9652]     | [0,8285 ; 0,9621]     | [0,0028 ; 0,0084]     |
| `hyper_30` | [0,9886 ; 0,9986]     | [0,9682 ; 0,9912]     | [0,9267 ; 0,9673]     | [0,0107 ; 0,0209]     |
| `hyper_60` | [0,9937 ; 0,9976]     | [0,9693 ; 0,9887]     | [0,9022 ; 0,9474]     | [0,0155 ; 0,0265]     |

Les IC plus larges pour `hypo` (peu de positifs en test : 30 et 40) traduisent
honnêtement la variance d'un petit dataset.

## 10. Registre modèle renforcé

Nouveau champ **`evaluation_status`** sur `model_registry` (migration additive
`d4e5f6a7b8c9`, chaînée sur `c3d4e5f6a7b8`) et dans le JSON canonique :

- `evaluated` — ≥ `MIN_TEST_POSITIVES` (=10) positifs **et** des négatifs en test ;
- `insufficient_test_positives` — 1..9 positifs (évaluable mais fragile) ;
- `not_evaluable_mono_class_test` — 0 positif **ou** 0 négatif → **non activable** ;
- `candidate_only`.

**Règle d'activation** : un modèle n'est `active` **que si son couple est évaluable sur le
test** (test bi-classe). Sinon il est enregistré comme **candidat documenté** et n'est pas
activé. Garanties conservées : **un seul actif par `(cible, horizon)`** (index unique
partiel en base + parité JSON↔DB), `synthetic_only=True`, `dataset_version`,
`features_version`, `metrics`, `artifact_path`.

**État courant du registre** (après réentraînement) : 4 modèles actifs, tous
`status=active`, `evaluation_status=evaluated`, un par couple.

## 11. Endpoint ML

`POST /api/v1/ml/predict` reste fonctionnel après réentraînement et **open-loop** :
probabilité + risque indicatif + modèle/version + notice open-loop ; **aucun** conseil
thérapeutique, **aucune** dose, **aucune** notification automatique. Comportements couverts
par les tests : patient propriétaire 200, clinicien avec `patient_id` 200, clinicien sans
`patient_id` 400, non authentifié 401, horizon invalide 400, `persist=true` écrit dans
`predictions` (`is_synthetic=True`), audit créé.

## 12. Commandes exactes (reproductibilité)

```bash
# 0) Migration (ajoute evaluation_status)
cd backend && alembic upgrade head

# 1) Réinitialiser les données synthétiques de dev (recommandations→prédictions→séries),
#    puis reseeder le benchmark v2 (idempotent). Voir "Réinitialisation" ci-dessous.
cd backend && python -m app.seed

# 2) Construire le dataset, entraîner les 4 couples, ré-évaluer
cd backend && python -m app.ml.build_dataset
cd backend && python -m app.ml.train          # ou par couple : --target hypo --horizon 30
cd backend && python -m app.ml.evaluate

# 3) Tests
cd backend && python -m pytest -q
```

> **Note d'exécution Replit.** L'entraînement des 4 couples (XGBoost + EBM + bootstrap
> ×200) dépasse une fenêtre de 2 min : on peut entraîner **un couple à la fois**
> (`--target … --horizon …`, ~50 s chacun) sans changer le résultat.

**Réinitialisation des données synthétiques de dev** (la PG de dev contenait le benchmark
v1) : supprimer dans l'ordre les `recommendations` référençant des `predictions`
synthétiques, puis les `predictions`, `cgm_readings`, `insulin_events`, `meal_events`,
`activity_events` avec `is_synthetic=True`, avant de relancer le seed v2.

## 13. Tests Phase 2.1

Suite complète **verte : 101 tests** (66 Phase 1 + 26 Phase 2 + **9 Phase 2.1** ;
les couches Phase 0/0.1 sont incluses dans le total). Ajouts Phase 2.1 :

- anti-fuite de scénario (features & lignes d'échantillon) ;
- `evaluation_status` (mono-classe / insuffisant / évalué) ;
- bootstrap (intervalles réels, mono-classe → `None`, reproductibilité) ;
- couple évaluable → actif + statut propagé JSON & DB ;
- couple mono-classe en test → **non activé** (candidat), statut `not_evaluable_mono_class_test`.

## 14. Limites scientifiques

- Données **100 % simulées scénarisées** : performances **non transférables** au réel.
- Scores volontairement élevés (tâche séparable) — mesurent la **cohérence pipeline**.
- Pas de validation externe, pas de patients réels, pas de XAI clinique.
- Open-loop strict : **aucune** recommandation thérapeutique, **aucune** dose.
- Prototype académique **non certifié** (MDR, IEC 62304, ISO 13485, HDS, RGPD opérationnel).

## 15. Décision proposée pour la Phase 3

Les **4 couples** sont désormais **évaluables et évalués** sur le test (≥ 10 positifs,
métriques réelles + IC bootstrap), le registre reflète honnêtement le statut d'évaluation,
et la règle d'activation interdit d'activer un modèle non évaluable. Le blocage
scientifique soulevé en Phase 2 est levé **dans le cadre synthétique**.

➡️ **Proposition : autoriser le démarrage de la Phase 3 (XAI clinique : SHAP/LIME) après
validation du présent rapport.** Conformément à la consigne, la Phase 3 **n'est pas
démarrée** tant que cet amendement n'est pas validé.
