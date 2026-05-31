# Rapport Phase 2 — Modélisation IA/ML

> Prototype de thèse · **non certifié** · **données simulées** (`is_synthetic=True`) ·
> **open-loop strict** (probabilités uniquement, aucune décision auto) · anti-leakage strict ·
> aucune métrique inventée. À valider avant tout démarrage de la **Phase 3 (XAI clinique)**.

## Synthèse en 16 points

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
   Sélection automatique du meilleur par couple `(cible, horizon)`.
6. **Évaluation réelle, jamais inventée.** AUROC, AUPRC, précision, rappel, F1, spécificité,
   sensibilité, Brier, ECE, confusion. **Classe absente → `null` + note** « non calculable ».
7. **Calibration honnête.** Platt/Isotonic appliquée **seulement si elle améliore** ; statut tracé
   dans le registre (`calibrated`).
8. **Registre de modèles.** Table additive `model_registry` (migration `b2c3d4e5f6a7`) + JSON
   canonique `artifacts/registry.json` ; un **modèle actif** par `(cible, horizon)`.
9. **Endpoint open-loop** `POST /api/v1/ml/predict` : **RBAC + ownership**, horizon validé, **audit
   systématique**, `persist` optionnel vers `predictions` (`is_synthetic=True`), `open_loop_notice`
   explicite.
10. **Pipeline exécuté de bout en bout** sur PostgreSQL réel (données seed synthétiques) : 4 couples
    entraînés, artefacts + métriques écrits.
11. **Tests** : **22 nouveaux** (labels, anti-leakage, splits, évaluation classe-absente,
    calibration, dataset, training, inference, endpoint RBAC/ownership/audit/persist). **66 Phase 1
    conservés** → **88 verts**.
12. **Endpoint validé en live** (port 8000) : patient 200 (proba calibrée), non authentifié 401,
    horizon invalide 400.
13. **Robustesse tz.** Normalisation des timestamps en **UTC tz-aware** côté chargement
    (SQLite naïf / PG tz-aware) — corrige une comparaison naïve/aware en inférence.
14. **Optuna indisponible** (pas de wheel Linux) → **fallback grille fixe** documenté ; aucune
    dépendance bloquante.
15. **Reproductibilité** : CLI `build_dataset` / `train` / `evaluate` ; artefacts **gitignorés**
    (régénérables). Procédure complète dans `PHASE_2_MODELISATION_ML.md`.
16. **Limites assumées** (cf. §Limites) : données simulées, petit jeu pouvant rendre un segment de
    test mono-classe (métriques `null` = honnête), XAI clinique reporté Phase 3, open-loop strict.

## Résultats de l'exécution de référence (seed synthétique, ~3 jours, 3 profils)
> Valeurs **indicatives** sur données **simulées** — **aucune** portée clinique. Split temporel :
> ~283 train / 94 val / 95 test.

| Cible | Horizon | Modèle actif | Calibré | AUROC | AUPRC | Rappel | Brier | ECE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hypo | 30 | logreg | oui | **non calculable*** | — | — | — | — |
| hypo | 60 | ebm | oui | **non calculable*** | — | — | — | — |
| hyper | 30 | random_forest | oui | 0.944 | 0.609 | 0.857 | 0.073 | 0.038 |
| hyper | 60 | ebm | oui | 0.975 | 0.844 | 1.000 | 0.056 | 0.052 |

\* **non calculable** = segment de test **mono-classe** pour cette cible → AUROC non définissable.
C'est le comportement **voulu** (pas d'invention de métrique), conséquence directe de la **petite
taille** du jeu simulé + split temporel. Régénérable avec un jeu plus large.

## Implémenté / Simulé / Reste-à-faire
- **Implémenté (réel)** : pipeline ML complet, anti-leakage, split temporel, 5 familles de modèles,
  évaluation honnête, calibration conditionnelle, registre JSON+DB, endpoint RBAC/audit/persist,
  CLI, 88 tests.
- **Simulé** : toutes les données patients (`is_synthetic=True`) ; aucune donnée réelle, aucune
  validité clinique.
- **Reste-à-faire (Phase 3+)** : XAI clinique (SHAP/LIME, importances par patient), jeux plus larges
  / multi-patients réalistes, tuning Optuna si wheel dispo, monitoring de drift, étude utilisateur.

## Conformité aux contraintes non négociables
✅ Données simulées · ✅ Open-loop strict (probas seules) · ✅ Anti-leakage (features passé / labels
futur) · ✅ Aucune métrique inventée · ✅ Pas de mobile · ✅ Pas de XAI avancé · ✅ RBAC + ownership +
audit. **Phase 3 non démarrée** (en attente de validation de ce rapport).
