# Phase 3 — XAI Clinique (Explicabilité open-loop)

> **Statut : livré, à valider.** Prototype de thèse, **non certifié**, **données 100 % synthétiques** (`is_synthetic=True`), **open-loop strict**. La Phase 3 **explique** les prédictions ML de la Phase 2/2.1 ; elle **ne produit aucune décision thérapeutique, aucune dose, aucune recommandation, aucune action automatique**. **Phase 4 NON démarrée** (attente validation de ce rapport).

---

## 1. Objectif

Construire une couche d'explicabilité **exploitable, testable et documentée** pour les 4 modèles actifs (Phase 2.1), en distinguant explicitement :
- explications **techniques** pour cliniciens ;
- explications **simplifiées** pour patients ;
- **importance statistique** de pondération du modèle ;
- **absence de causalité** clinique ;
- **limites** liées au benchmark synthétique.

## 2. Périmètre

- Package `backend/app/xai/` : chargement modèle, préparation features, explication globale/locale, traduction patient/clinicien, évaluation, cache, audit.
- Méthodes : **EBM natif** (InterpretML), **SHAP** (TreeExplainer XGB/RF, LinearExplainer LogReg), **LIME** tabulaire, **fallback occlusion** documenté.
- Explications **globales** (4 couples) + **locales** (par prédiction).
- API `POST /api/v1/xai/explain` et `GET /api/v1/xai/global` (RBAC + audit).
- Table additive `xai_explanations` (persistance optionnelle) + migration.
- Métriques d'évaluation XAI (stabilité, deletion, agreement, congruence physiologique).

## 3. Hors périmètre (non négociable)

- **Pas de Phase 4** : aucun moteur de recommandation, aucune règle de décision clinique, aucune reco comportementale.
- **Pas de mobile** : aucune interface React Native/Expo. Les API/structures sont prêtes pour un affichage futur, sans interface livrée.
- **Aucune donnée réelle**, **aucun claim clinique**, **aucune dose/décision/notification automatique**.

## 4. Modèles expliqués

Les 4 couples actifs issus de la Phase 2.1 (`model_version 1.0.0`, `dataset_version 1.1.0`, `features_version 1.0.0`, **18 features**) :

| Couple | Modèle actif | Méthode XAI par défaut |
|---|---|---|
| hypo 30 | EBM | **native** (InterpretML) |
| hypo 60 | RandomForest | **SHAP** (TreeExplainer) |
| hyper 30 | XGBoost | **SHAP** (TreeExplainer) |
| hyper 60 | XGBoost | **SHAP** (TreeExplainer) |

La sélection de la méthode (`resolve_method`) : `auto` → `native` pour EBM, sinon `shap` ; une méthode `native` demandée sur un modèle non-EBM **retombe sur SHAP** (`method_fallback=True`, documenté). `lime` disponible pour tous les modèles compatibles.

## 5. Méthodes XAI

### EBM (natif InterpretML)
Importance globale + contributions locales **natives** (`explain_global`/`explain_local`), sans approximation post-hoc. Direction par signe de la contribution.

### XGBoost / RandomForest (SHAP)
`shap.TreeExplainer` sur l'estimateur interne (XGB : `inner.model` ; RF : `inner.pipeline.named_steps` imputation + classifieur). Contributions signées réelles. **Si SHAP échoue → fallback occlusion documenté** (`fallback=True` + `reason`).

### Logistic Regression (SHAP linéaire)
`shap.LinearExplainer` ; à défaut, coefficients normalisés. (LogReg n'est actif sur aucun couple actuel mais est supporté.)

### LIME
`LimeTabularExplainer`, **seed fixe** (`RANDOM_SEED=42`), **1000 perturbations**, `predict_proba` enveloppé en 2 colonnes sur le modèle interne. Stabilité **limitée par construction** (échantillonnage) — documentée et mesurée (§9).

### Fallback honnête
Aucune méthode n'est forcée. Tout échec d'explainer renvoie une **occlusion model-agnostic** avec `method_fallback=True` et un `reason` explicite. **Jamais de contribution inventée.**

## 6. Ce qui est expliqué exactement — calibration et limites

**Point critique de transparence :** les modèles actifs sont **calibrés** (Platt/Isotonic conditionnelle, Phase 2). SHAP/LIME/EBM-natif expliquent la **sortie du modèle de base NON calibré** (l'estimateur), tandis que la **probabilité affichée** (`probability`) est la **probabilité calibrée** servie par le bundle (`predict_proba` applique le calibrateur).

Chaque explication locale porte donc :
- `calibrated` : le modèle est-il calibré (proba affichée = calibrée) ;
- `explains` : **`"modèle non calibré"`** — la cible expliquée par l'attribution.

Cette dissociation est **assumée et documentée** : on n'attribue pas faussement l'attribution à la proba calibrée. Un wrapper expliquant la chaîne complète (modèle + calibration) est une amélioration possible mais n'a pas été imposé pour ne pas masquer cette limite.

**XAI ≠ causalité.** Les textes n'emploient jamais « la cause est » ni de formulation prescriptive (liste `FORBIDDEN_TERMS` testée). Formulations retenues : « le modèle a principalement pondéré… », « ce facteur contribue au score selon le modèle… », « interprétation indicative sur données simulées ».

## 7. Formats patient / clinicien

Module `translation.py` à **templates contrôlés** (pas de génération libre). `FEATURE_LABELS` traduit les 18 features en libellés lisibles.

**Patient** (langage simple, non prescriptif) :
> Estimation indicative du risque de hypoglycémie dans les 30 prochaines minutes : niveau faible (0 %). Éléments que le modèle a le plus pris en compte : variabilité de la glycémie (30 min) (pèse contre ce risque) ; tendance de la glycémie (30 min) (pèse contre ce risque) ; heure de la journée (pèse vers ce risque). Ces éléments décrivent ce que le modèle a observé, pas une cause médicale. Parlez-en à votre soignant ; cet outil ne propose aucun traitement.

**Clinicien** (technique : feature, valeur, contribution signée, direction, méthode, calibration, qualité données) :
> Risque hypoglycémie 30 min : p=0.000 (niveau faible). Attribution locale [méthode=native, cible expliquée : modèle non calibré]. Contributions : cgm_std_30=n/a → -8.0304 (diminue le score) | cgm_slope_30=n/a → -5.3576 (diminue le score) | hour_of_day=1.000 → +4.2634 (augmente le score) | … Importance statistique de pondération du modèle (≠ causalité physiologique). Données synthétiques. Open-loop : aucune dose, aucune décision automatique.

**Interdits** (`FORBIDDEN_TERMS`, vérifiés par test) : « vous devez », « injectez », « la cause est », « le traitement recommandé est », etc.

## 8. API XAI

### `POST /api/v1/xai/explain` — explication locale
Payload : `patient_id` (optionnel patient / requis clinicien-admin), `target` (`hypo|hyper`), `horizon_min` (`30|60`), `at` (optionnel), `method` (`auto|shap|lime|native`), `audience` (`patient|clinician`), `persist` (bool), `top_k` (1–18).

RBAC + ownership identiques à `ml.predict` (`resolve_read_scope`) : patient → son dossier ; clinicien/admin → `patient_id` requis ; non authentifié → **401**. Validations : `horizon` invalide → **400**, `method` invalide → **400**, `target` invalide → **400**, non-propriétaire → **403/404**. **Audit systématique** (`action="xai.explain"`).

### `GET /api/v1/xai/global` — explication globale
Paramètres : `target`, `horizon_min`, `regenerate` (bool). **Réservé clinicien/admin** (patient → **403**) : agrégat modèle, aucune donnée patient. Audit `action="xai.global"`.

Toutes les réponses portent `open_loop_notice`, `limitations`, `synthetic_only=True`. **Aucun champ de dose/décision.**

## 9. Stockage XAI

- **Artefacts JSON** : `backend/artifacts/xai/global/global-<target>-<horizon>.json` (régénérables, **gitignorés**).
- **Table additive `xai_explanations`** (migration `e5f6a7b8c9d0`, chaînée sur `d4e5f6a7b8c9`, idempotente, **SQLite + PostgreSQL**) : `patient_id`, `ts`, `target`, `horizon_min`, `probability`, `risk_label`, `calculable`, `model_name`, `model_version`, `calibrated`, `explains`, `xai_method`, `method_fallback`, `top_features` (JSON), `baseline`, `explanation_text_patient/clinician`, `is_synthetic=True`. Persistance **optionnelle** (`persist=true`).

## 10. Cache et performance

`cache.py` : cache mémoire thread-safe, clé = `model_id + patient_id + target + horizon + at + method + features_hash`, **TTL 15 min**, **invalidation par `model_id`** (réentraînement/réactivation). Le cache local n'est activé que si `at` est fourni (une explication « maintenant » varie par nature).

Notes latence : **SHAP global** est pré-calculé (artefacts) ; **LIME local** est le plus lent (1000 perturbations) ; en cas d'échec/lenteur d'un explainer, **fallback occlusion** documenté.

## 11. Évaluation XAI

`evaluation.py` — métriques **techniques** sur sous-échantillon synthétique (jamais inventées : `value=None` si non calculable). **Ne vaut pas validation clinique.**

- **Stabilité** : perturbation légère → Jaccard du top-k.
- **Deletion / fidélité** : retrait des top features vs faibles → `faithfulness_win_rate`.
- **Agreement SHAP/LIME** : overlap top-k.
- **Congruence physiologique** : heuristiques directionnelles (glycémie haute → hyper, basse/pente↓ → hypo). Note explicite « PAS une validation clinique ».

### Résultats d'évaluation (réentraînement live, dev DB)

| Couple | Méthode | Stabilité top-k (Jaccard) | Deletion (win rate) | Agreement SHAP/LIME | Congruence physio |
|---|---|---|---|---|---|
| hyper 30 | SHAP | 0.853 | 1.00 | 0.291 | 0.533 |
| hyper 60 | SHAP | 0.863 | 1.00 | 0.288 | 0.533 |

(hypo 30 = EBM natif, hypo 60 = RF SHAP : métriques générées par `python -m app.xai.evaluate`.) L'**agreement SHAP/LIME modéré (~0.29)** est attendu (LIME stochastique, modèles tree non additifs) et documenté comme **divergence**, pas comme anomalie.

## 12. Limites scientifiques

- Données **synthétiques scénarisées séparables** → scores et stabilité **non transférables au clinique**.
- L'attribution explique le **modèle non calibré**, pas la proba calibrée affichée (§6).
- Congruence physiologique = **heuristique**, pas vérité terrain.
- LIME = stabilité limitée ; SHAP TreeExplainer = approximation pour ensembles.
- **Aucune** validité clinique, **aucun** usage en boucle fermée.

## 13. Commandes

```bash
cd backend && python -m app.xai.generate_global          # 4 artefacts globaux
cd backend && python -m app.xai.generate_global --target hypo --horizon 30
cd backend && python -m app.xai.evaluate                 # métriques XAI 4 couples
cd backend && python -m pytest -q                        # 118 tests
```

## 14. Tests

`tests/test_xai.py` (**17 tests**) : chargement modèle actif, explication globale, explication locale, RBAC, ownership, 401, non-propriétaire (403/404), méthode invalide (400), horizon invalide (400), traduction patient non prescriptive, traduction clinicien technique, audit créé, cache hit/miss, persistance (`is_synthetic`), absence de données réelles, métriques d'évaluation (stabilité/deletion/agreement/physio), global réservé clinicien (403). Compatibilité **SQLite** (tests) prouvée ; schéma additif **PostgreSQL** (dev) via migration.

**Sortie pytest :** `118 passed` (101 antérieurs Phase 0/0.1/1/2/2.1 + 17 Phase 3). Tous les tests antérieurs **restent verts**.

## 15. Fichiers ajoutés / modifiés

**Ajoutés** : `app/xai/{__init__,schemas,utils,cache,shap_explainer,lime_explainer,ebm_explainer,global_explanations,local_explanations,translation,evaluation,service,generate_global,evaluate}.py`, `app/models/xai_explanation.py`, `app/repositories/xai_repo.py`, `app/api/v1/xai.py`, `alembic/versions/e5f6a7b8c9d0_phase3_xai_explanations.py`, `tests/test_xai.py`, ce document.
**Modifiés** : `app/api/v1/router.py` (enregistrement router), `app/models/__init__.py` (export `XaiExplanation`).

## 16. Critères de passage Phase 4 (proposé)

Phase 3 livrée : explicabilité fonctionnelle, sécurisée, auditée, testée, documentée, **open-loop strict**, **synthétique**. **Décision proposée : NE PAS démarrer la Phase 4** (moteur de recommandation thérapeutique) sans validation explicite de ce rapport par le superviseur. Tout passage en Phase 4 supposerait un cadre réglementaire/éthique (données réelles, validation clinique) hors périmètre du prototype actuel.

## 17. Phase 3.1 — Sécurisation sémantique XAI (amendement obligatoire, livré, à valider)

Amendement demandé par le superviseur **avant** Phase 4 : qualifier la **fiabilité sémantique** de chaque explication et exposer ses limites **sans rien corriger artificiellement**. Aucun réentraînement, aucune reco/dose/règle, aucune donnée réelle, open-loop strict.

- **Module pur** `app/xai/reliability.py` → `assess(...)` : `xai_reliability_status` (`reliable_for_model_debug` / `caution_semantic_limits` / `not_reliable_for_clinical_interpretation`, escalade monotone), `xai_warnings[]` **jamais masqués**, `semantic_limitations[]`. Règles : synthétique → warning systématique · modèle non calibré → warning systématique · repli occlusion → caution · direction non globalisable/indéterminée → caution · LIME stabilité < 0.5 → caution · physio < 0.5 → caution · **physio == 0.0 → not_reliable**. Un signal `None` n'escalade pas.
- **Directions globales clarifiées** : EBM → `not_globalizable` (« interpréter localement ») ; SHAP → `aggregated_signed_effect` (signe brut conservé dans `aggregated_sign`). Disclaimer `direction_semantics`. Artefacts globaux **régénérés**.
- **Cas hypo 30** : congruence physio **0.000 conservée** (non corrigée) → artefact marqué `not_reliable_for_clinical_interpretation` + warning « analyse technique uniquement ». EBM natif **non remplacé silencieusement**.
- **API enrichie** (local + global) : `xai_reliability_status`, `xai_warnings`, `semantic_limitations`, `calibration_notice`, `synthetic_data_notice` (+ `direction_semantics`, `evaluation` réelle/`null` côté global). Champs **persistés** (`xai_reliability_status`, `xai_warnings`, `semantic_limitations`) via migration additive `f6a7b8c9d0e1`.
- **Texte patient renforcé** (non causal) : « Le modèle a surtout utilisé… », « Ces éléments influencent le score du modèle », « Cela ne signifie pas que ces éléments sont la cause médicale », « Ne modifiez jamais votre traitement sans avis médical ». `FORBIDDEN_TERMS` inchangés et testés.
- **Garde-fou Phase 4** : **« XAI is display/support only, not a decision engine. »** Un futur moteur doit lire `xai_reliability_status` et **refuser** une explication `not_reliable_for_clinical_interpretation`.
- **Tests** : +14 (module reliability, champs local/global, hypo 30 prudence, scénarios canoniques hypo/hyper, XAI non décisionnelle, persistance fiabilité, texte patient). **133 verts** (119 + 14).
- **Détails** : `docs/migration/AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md`. **Phase 4 toujours suspendue** jusqu'à validation de cet amendement.
