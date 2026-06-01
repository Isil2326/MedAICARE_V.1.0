# Rapport Phase 4 — Moteur de recommandation OPEN-LOOP (version complète)

> Prototype de thèse · **non certifié** · **données 100 % synthétiques** (`is_synthetic=True`) ·
> **open-loop strict** · **aucune dose, aucune décision, aucune action thérapeutique automatique** ·
> **XAI = support uniquement** (jamais une justification clinique si non fiable). La Phase 4
> transforme les prédictions (Phase 2/2.1) et leurs explications (Phase 3/3.1) en **suggestions
> non prescriptives** soumises à **validation clinicien obligatoire**. À valider avant tout
> démarrage de la **Phase 5**.
>
> **Exécution de référence** : moteur PUR exercé via `python -m app.recommendations.generate_demo`
> (probabilités fabriquées à but de démonstration, **n'écrit rien en base**) + suite de tests
> `python -m pytest` (base SQLite isolée). Aucune valeur ci-dessous n'a de portée clinique.

---

## 1. Synthèse en 16 points

1. **Périmètre tenu.** Moteur de **suggestions** à partir d'une probabilité de risque d'un couple
   actif (Phase 2.1) + explication optionnelle (Phase 3/3.1). Sortie = suggestion **non
   prescriptive** uniquement ; **aucun champ dose/décision/action** nulle part.
2. **Open-loop strict respecté.** Toute suggestion **naît `pending`** ; aucune transition
   automatique vers `approved` ; seul un clinicien/admin arbitre. `open_loop_notice` sur chaque
   suggestion.
3. **Package pur `backend/app/recommendations/`** : `schemas`, `dsl`, `rules`, `templates`,
   `safety`, `evaluation`, `workflow`, `utils`, `engine`, `service`, + CLI `generate_demo`.
4. **Catégories toutes non prescriptives** : `ALERT_CRITICAL`, `RECOMMENDATION_BEHAVIORAL`,
   `CLINICAL_REFERRAL`, `THERAPY_SUGGESTION_REVIEW_ONLY` (jamais de dose/instruction).
5. **Règles versionnées et tracées** : `rule_id` + `rule_version` (1.0.0). Seuils = **choix de
   prototype synthétique, NON validés cliniquement**, documentés pour traçabilité.
6. **XAI lue mais jamais condition principale.** Le risque est fondé sur la **probabilité du
   modèle**. Si `xai_reliability_status == not_reliable_for_clinical_interpretation`, une suggestion
   `CLINICAL_REFERRAL` est ajoutée (renvoi en revue humaine) — **sans** remplacer la règle de
   risque. **Mise à jour Phase 4.1** : la XAI est un **support d'affichage/audit uniquement**,
   `clinical_justification_allowed = false` **toujours** (même fiable) ; le champ legacy
   `used_as_clinical_justification` a été **supprimé**. Voir
   `AMENDEMENT_PHASE_4_1_VERROUILLAGE_RECOMMANDATION.md`.
7. **Couche safety défensive.** `FORBIDDEN_TERMS` (dose, posologie, « modifiez votre traitement »,
   « unités d'insuline », etc.) + **regex de dose chiffrée** (`4 unités`, `6 UI`…). Toute violation
   → suggestion **bloquée** (`recommendation.safety_blocked`), jamais persistée/affichée.
8. **Safety appliquée sur TOUS les chemins d'écriture.** La génération **et** l'amendement
   clinicien (`modify`) revalident le texte libre. Le contournement par édition après génération
   est fermé (constat d'une revue d'architecture, corrigé + test de non-régression).
9. **Workflow à états gardé** : `pending → approved|rejected`, `pending → modified →
   approved|rejected`. Transitions invalides refusées (`workflow.assert_transition`). Arbitrage
   atomique anti-course (UPDATE conditionnel sur `status`).
10. **RBAC serveur.** Génération/arbitrage réservés clinicien/admin. `GET /recommendations` reste
    clinicien/admin (contrat `test_rbac` : patient → 403). Le patient lit **uniquement ses
    suggestions approuvées** via `GET /recommendations/mine`. `GET /{id}` durci deny-by-default.
11. **Audit systématique** : `recommendation.generated` / `recommendation.safety_blocked` /
    `recommendation.generate_skipped` / `recommendation.{approved|rejected|modified}`.
12. **Persistance synthétique** : chaque suggestion `is_synthetic=True`. Aucune donnée réelle.
13. **Migration additive idempotente** `a7b8c9d0e1f2` (down_revision `f6a7b8c9d0e1`), gardes
    `_has_table`/`_has_column` : `alembic upgrade head` OK (PostgreSQL), `create_all` OK (SQLite),
    rejouable.
14. **Scores d'actionnabilité non cliniques** (clarity/safety/urgency/explainability/confidence/
    overall) : **priorisation/documentation seulement**, jamais une décision (note explicite).
15. **Aucun réentraînement ML, aucun nouveau modèle, aucun mobile.** Le moteur **consomme** les
    artefacts existants ; rien n'est ré-appris.
16. **152 tests verts** (150 antérieurs + 2 non-régression safety `modify`). Suite exécutée par
    lots (limite mémoire de l'environnement avec les workflows ML/XAI actifs).

## 2. Catégories et règles déclenchées

| `rule_id` | Condition (synthétique, NON clinique) | Catégorie | Priorité |
|---|---|---|---|
| `HYPO_RISK_CRITICAL` | `target=hypo AND p ≥ 0.70` | `ALERT_CRITICAL` | 1 |
| `HYPO_RISK_BEHAVIORAL` | `target=hypo AND 0.40 ≤ p < 0.70` | `RECOMMENDATION_BEHAVIORAL` | 2 |
| `HYPER_RISK_CRITICAL` | `target=hyper AND p ≥ 0.80` | `ALERT_CRITICAL` | 1 |
| `HYPER_RISK_BEHAVIORAL` | `target=hyper AND 0.50 ≤ p < 0.80` | `RECOMMENDATION_BEHAVIORAL` | 2 |
| `XAI_LOW_RELIABILITY` | `xai_reliability_status = not_reliable AND p ≥ 0.40` | `CLINICAL_REFERRAL` | 2 |

`XAI_LOW_RELIABILITY` **s'ajoute** à la règle de risque (jamais en remplacement) : le risque reste
fondé sur la probabilité, et l'explication non fiable déclenche un renvoi explicite en validation
humaine.

## 3. Workflow open-loop (transitions autorisées)

```
generated ─▶ pending
pending  ──approve──▶ approved
pending  ──reject───▶ rejected
pending  ──modify───▶ modified ──approve──▶ approved
                               └─reject───▶ rejected
approved : terminal      rejected : terminal
```

- Toute suggestion **naît `pending`**, jamais `approved`.
- `approve`/`reject`/`modify` : **clinicien/admin** uniquement.
- Transition invalide (ex. `approved → pending`) → refus.
- Le patient ne voit **que** l'état `approved` de ses suggestions.

## 4. Couche de sécurité (safety) — garde-fou défensif

- `FORBIDDEN_TERMS` (sous-chaînes, minuscules) : injectez/injecter, augmentez/diminuez/ajustez/
  changez la dose, modifiez (votre) traitement/basal/bolus, arrêtez/commencez le traitement,
  prescription/prescrivez, administrez, bolus de, unités d'insuline, etc.
- **Regex de dose chiffrée** : `\d+ (unités|UI|u|u.i.)` — détecte « 4 unités », « 6 UI », « 3 u ».
- Validation **avant persistance** des messages **patient ET clinicien** à la génération.
- Validation **à l'amendement** : `modify` revalide le `message` édité **et** la `note`
  (terme interdit / dose → HTTP 400 + audit `recommendation.safety_blocked`, la suggestion reste
  `pending`, rien n'est persisté). Ferme le contournement post-génération.
- Notice open-loop + disclaimer « Ne modifiez jamais votre traitement sans avis médical » présents
  sur chaque suggestion.

## 5. API disponible

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| `POST` | `/api/v1/recommendations/generate` | clinicien/admin | probabilité → règles → safety → `pending` ; `patient_id` requis ; XAI best-effort (`include_xai`) |
| `GET` | `/api/v1/recommendations` | clinicien/admin | liste filtrée (status/patient/category/priority/target/horizon) |
| `GET` | `/api/v1/recommendations/mine` | patient | **uniquement** ses suggestions approuvées |
| `GET` | `/api/v1/recommendations/{id}` | tous (deny-by-default) | détail ; patient : seulement la sienne approuvée |
| `POST` | `/api/v1/recommendations/{id}/approve` | clinicien/admin | arbitrage |
| `POST` | `/api/v1/recommendations/{id}/reject` | clinicien/admin | arbitrage |
| `POST` | `/api/v1/recommendations/{id}/modify` | clinicien/admin | amende (non prescriptif) → `modified` |

Mapping d'erreurs : `not_found` → 404 · `safety_blocked` (modify) → 400 · `already_reviewed` → 409 ·
manque `patient_id` (clinicien) → 400 · accès refusé → 403 · non authentifié → 401.

## 6. Modèle de données & migration

Migration **additive idempotente** `a7b8c9d0e1f2` (down_revision `f6a7b8c9d0e1`). Colonnes ajoutées
à `recommendations` : `target`, `horizon_min`, `probability`, `model_name`, `model_version`,
`rule_id`, `rule_version`, `trigger_name`, `safety_level`, `xai_reliability_status`,
`actionability_score`, `is_synthetic` (server_default `true`). Statut `modified` ajouté à
`RecommendationStatus`. `message` = message patient ; `rationale` (JSON) porte
`message_clinician` + trace complète (règle, contexte, scores, bloc XAI ; Phase 4.1 :
`clinical_justification_allowed=false`, l'ancien `used_as_clinical_justification` a été supprimé).

## 7. Commandes réellement utilisées

```bash
# Démonstration du moteur PUR (n'écrit rien en base, probabilités fabriquées)
cd backend && python -m app.recommendations.generate_demo

# Migration (appliquée à PostgreSQL dev — head a7b8c9d0e1f2)
cd backend && alembic upgrade head

# Tests
cd backend && python -m pytest -q
```

## 8. Exemple réel (sortie `generate_demo`, données fabriquées)

- **Hypo 30 min, p=0.82, XAI fiable** → `[ALERT_CRITICAL] HYPO_RISK_CRITICAL` · safety OK ·
  message patient non causal + disclaimer · scores `overall≈0.894` · XAI utilisée comme
  justification.
- **Hyper 60 min, p=0.58, XAI absente** → `[RECOMMENDATION_BEHAVIORAL] HYPER_RISK_BEHAVIORAL` ·
  safety OK · `explainability=0.2`.
- **Hypo 60 min, p=0.66, XAI NON fiable** → `[RECOMMENDATION_BEHAVIORAL] HYPO_RISK_BEHAVIORAL`
  **+** `[CLINICAL_REFERRAL] XAI_LOW_RELIABILITY` · message clinicien : « L'explication XAI n'est
  PAS utilisée comme justification clinique (fiabilité insuffisante) : revue humaine requise. »

Aucun message ne contient de dose ni d'instruction thérapeutique.

## 9. Limites scientifiques assumées

- **Seuils non cliniques** : calés sur le benchmark synthétique séparable (Phase 2.1), **non
  transférables au clinique**.
- **Scores d'actionnabilité heuristiques** : priorisation/documentation seulement, pas une mesure
  validée.
- **Pas de validation clinique** des messages ni des règles : prototype de thèse.
- **Journal/persistance non autoritaires** : démo, non certifiée.
- **XAI = support** : aucune causalité, aucune décision.

## 10. Tests (résumé)

**152 tests verts** (150 antérieurs + 2 non-régression). Couverture Phase 4
(`tests/test_recommendations_engine.py`) :
- moteur pur : génération hypo/hyper (critical/behavioral), non calculable → vide, aucun message
  avec dose/terme interdit, **XAI = affichage uniquement quelle que soit la fiabilité**
  (`clinical_justification_allowed=false`, Phase 4.1), XAI non fiable → renvoi clinique ;
- safety : blocage terme interdit, détection de dose, **blocage `modify` (terme interdit + dose)** ;
- workflow : transitions valides/invalides ;
- endpoints/RBAC : patient ne peut ni générer ni approuver, clinicien génère→`pending`
  (`is_synthetic`, `rule_id`/`rule_version`, catégorie, probabilité), `patient_id` requis,
  audit `recommendation.generated`, flux complet generate→approve, modify→reject, patient ne voit
  que l'approuvé (liste + détail 403 avant approbation).

> Note d'exécution : la suite complète a été lancée **par lots** (recommandations+RBAC, lot léger,
> lot ML/XAII), la limite mémoire de l'environnement ne permettant pas de charger simultanément
> xgboost/shap/ebm avec les 3 workflows actifs. Chaque lot est vert.

## 11. Documentation produite

- `docs/migration/PHASE_4_RECOMMENDATION_ENGINE.md` (doc technique, 14 sections).
- `docs/migration/RAPPORT_PHASE_4.md` (le présent rapport).
- `replit.md` + `backend/README.md` mis à jour (section Phase 4 / endpoints recommandations).

## 12. Confirmations explicites

- ✅ Open-loop strict : toute suggestion `pending`, validation clinicien obligatoire.
- ✅ Aucune dose, aucune décision, aucune action thérapeutique automatique.
- ✅ Données 100 % synthétiques (`is_synthetic=True`).
- ✅ XAI = support : `not_reliable` ⇒ jamais une justification clinique (+ renvoi humain).
- ✅ Aucun réentraînement ML, aucun nouveau modèle, aucun mobile.
- ✅ RBAC serveur + audit systématique + migration additive rejouable.
- ✅ Tous les tests antérieurs restent verts (152 au total).
- ✅ **Phase 5 NON démarrée** — en attente de validation de ce rapport.

## Conformité aux contraintes non négociables

| Contrainte | Statut |
|---|---|
| Open-loop strict (suggestion `pending`, validation humaine) | ✅ |
| Aucune dose / décision / action automatique | ✅ |
| Données simulées uniquement (`is_synthetic=True`) | ✅ |
| XAI support only (refus de justification si non fiable) | ✅ |
| Pas de mobile | ✅ |
| Pas de réentraînement / nouveau modèle ML | ✅ |
| RBAC + ownership + audit + Pydantic strict | ✅ |
| Migration additive non destructive, rejouable | ✅ |
| Non certifié (disclaimer conservé) | ✅ |
| Tests antérieurs verts | ✅ (152) |
