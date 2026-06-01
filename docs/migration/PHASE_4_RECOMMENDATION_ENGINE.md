# Phase 4 — Moteur de recommandation OPEN-LOOP

> **Statut : livré, à valider.** Prototype de thèse, **non certifié**, **données 100 % synthétiques** (`is_synthetic=True`), **open-loop strict**. La Phase 4 transforme les prédictions (Phase 2/2.1) et leurs explications (Phase 3/3.1) en **suggestions non prescriptives** soumises à **validation clinicien obligatoire**. Elle **ne produit aucune dose, aucune décision thérapeutique, aucune action automatique**. **Phase 5 NON démarrée** (attente validation de ce rapport).

---

## 1. Objectif

Construire un moteur qui, à partir d'une **probabilité de risque** (modèle actif Phase 2.1) et de son **explication** (Phase 3/3.1), génère des **suggestions indicatives** :
- **non prescriptives** (jamais de dose, jamais de changement de traitement) ;
- **explicables et traçables** (règle versionnée + rationale + scores) ;
- **open-loop strict** : toute suggestion naît `pending` et exige l'arbitrage d'un clinicien ;
- **honnêtes vis-à-vis de la XAI** : si `xai_reliability_status == not_reliable_for_clinical_interpretation`, l'explication **n'est pas** utilisée comme justification clinique et un **renvoi en revue humaine** est émis.

## 2. Périmètre

- Package pur `backend/app/recommendations/` : `schemas`, `dsl`, `rules`, `templates`, `safety`, `evaluation`, `workflow`, `utils`, `engine`, `service`, `generate_demo` (CLI).
- Extension `app/services/recommendation_service.py` : `modify(...)` + `approve/reject` acceptant la source `pending|modified`.
- Extension `app/repositories/recommendation_repo.py` : `list_filtered`, `list_approved_for_patient`.
- Schémas API `app/schemas/recommendation.py` + endpoints `app/api/v1/recommendations.py`.
- Migration additive `a7b8c9d0e1f2` (colonnes de traçabilité + statut `modified`).

## 3. Hors périmètre (non négociable)

- **Aucune dose, aucune posologie, aucune instruction de modification de traitement.**
- **Aucune décision ni action automatique** : la suggestion est inerte tant qu'un clinicien ne l'a pas validée.
- **Pas de Phase 5** : pas de boucle fermée, pas d'exécution automatique, pas de notification active au patient.
- **Pas de mobile** (aucune interface React Native/Expo).
- **Aucune donnée réelle**, **aucun réentraînement ML**, **aucun nouveau modèle**.
- **La XAI reste support uniquement** : jamais une condition suffisante de décision, jamais une justification clinique si elle est jugée non fiable.

## 4. Catégories de suggestions (toutes NON prescriptives)

| Catégorie | Sens | Exemple |
|---|---|---|
| `ALERT_CRITICAL` | Risque élevé à porter à l'attention | risque indicatif d'hypo/hyper au-dessus du seuil critique |
| `RECOMMENDATION_BEHAVIORAL` | Surveillance comportementale (suivi habituel) | risque modéré : surveiller l'évolution selon ses habitudes |
| `CLINICAL_REFERRAL` | Renvoi explicite vers une revue humaine | explication XAI non fiable → validation clinicien avant interprétation |
| `THERAPY_SUGGESTION_REVIEW_ONLY` | « élément à revoir avec un clinicien » — **jamais** de dose ni d'instruction | réservé à une revue, aucune action |

## 5. Règles expertes versionnées

Toutes les règles se déclenchent sur la **probabilité** d'un couple cible/horizon, sont **versionnées** (`rule_id` + `rule_version`) et tracées. **Seuils = choix de prototype synthétique, NON validés cliniquement.**

| `rule_id` | Condition (synthétique) | Catégorie | Priorité |
|---|---|---|---|
| `HYPO_RISK_CRITICAL` | `target=hypo AND p>=0.70` | `ALERT_CRITICAL` | 1 |
| `HYPO_RISK_BEHAVIORAL` | `target=hypo AND 0.40<=p<0.70` | `RECOMMENDATION_BEHAVIORAL` | 2 |
| `HYPER_RISK_CRITICAL` | `target=hyper AND p>=0.80` | `ALERT_CRITICAL` | 1 |
| `HYPER_RISK_BEHAVIORAL` | `target=hyper AND 0.50<=p<0.80` | `RECOMMENDATION_BEHAVIORAL` | 2 |
| `XAI_LOW_RELIABILITY` | `xai_reliability_status=not_reliable AND p>=0.40` | `CLINICAL_REFERRAL` | 2 |

**Important** : `XAI_LOW_RELIABILITY` s'ajoute aux règles de risque **sans** les remplacer — le risque reste fondé sur la **probabilité du modèle**, jamais sur la XAI. Quand l'explication est non fiable, la trace marque `used_as_clinical_justification = False`.

## 6. Garde-fous de sécurité (safety)

- `FORBIDDEN_TERMS` (dose, posologie, injecter, augmenter/diminuer la dose, unités d'insuline, etc.) + **regex de détection de dose** (`6 UI`, `12 unités`, …).
- Chaque message **patient et clinicien** est validé : tout terme/dose interdit → suggestion **bloquée** (`safety_blocked`, jamais persistée comme suggestion exploitable).
- Notice open-loop attachée à **chaque** suggestion (jamais masquée) : *« aucune dose, aucune décision ni action thérapeutique automatique. Validation ou rejet par un clinicien obligatoire. »*
- Disclaimer patient systématique : *« Ne modifiez jamais votre traitement sans avis médical. »*

## 7. Scores d'actionnabilité (NON cliniques)

`clarity / safety / urgency / explainability / confidence / overall` : servent **uniquement** à prioriser/documenter la file de validation. **Jamais une décision.** Note explicite portée dans la sortie : *« Scores non cliniques : priorisation/documentation, jamais une décision. »*

## 8. Workflow open-loop (transitions)

```
pending ──approve──▶ approved
pending ──reject───▶ rejected
pending ──modify───▶ modified ──approve──▶ approved
                              └─reject───▶ rejected
```

- Toute suggestion **naît `pending`**.
- `approve`/`reject`/`modify` réservés **clinicien/admin** (RBAC serveur).
- Transitions invalides (ex. `approved → pending`) **rejetées** par `workflow.assert_transition`.
- Le patient ne voit **que** ses suggestions `approved`.

## 9. API

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/v1/recommendations/generate` | génère des suggestions `pending` | clinicien/admin |
| `GET` | `/api/v1/recommendations` | liste filtrée (status/patient/category/priority/target/horizon) | clinicien/admin |
| `GET` | `/api/v1/recommendations/mine` | **uniquement** les suggestions approuvées du patient | patient |
| `GET` | `/api/v1/recommendations/{id}` | détail (patient : seulement la sienne approuvée) | tous |
| `POST` | `/api/v1/recommendations/{id}/approve` | arbitrage | clinicien/admin |
| `POST` | `/api/v1/recommendations/{id}/reject` | arbitrage | clinicien/admin |
| `POST` | `/api/v1/recommendations/{id}/modify` | amende (reste non prescriptive) → `modified` | clinicien/admin |

**Décision RBAC** : `GET /recommendations` reste **clinicien/admin** (préserve le contrat `test_rbac` : patient → 403). Le patient lit via la route dédiée `GET /recommendations/mine`.

`POST /generate` résout la prédiction par `prediction_id` **ou** via `ml.predict` (`patient_id` requis pour clinicien) ; XAI en **best-effort** (`include_xai`) ; règles → safety → persistance `pending` (`is_synthetic=True`) → **audit systématique** (`recommendation.generated` / `safety_blocked` / `generate_skipped`).

## 10. Modèle de données & migration

Migration **additive idempotente** `a7b8c9d0e1f2` (down_revision `f6a7b8c9d0e1`), gardes `_has_table`/`_has_column` (SQLite `create_all` + PostgreSQL `upgrade head`). Colonnes ajoutées à `recommendations` : `target`, `horizon_min`, `probability`, `model_name`, `model_version`, `rule_id`, `rule_version`, `trigger_name`, `safety_level`, `xai_reliability_status`, `actionability_score`, `is_synthetic` (server_default `true`). Statut `modified` ajouté à `RecommendationStatus`.

## 11. Commandes

```bash
# Démonstration du moteur PUR (n'écrit rien en base, données fabriquées)
cd backend && python -m app.recommendations.generate_demo

# Migration
cd backend && alembic upgrade head

# Tests
cd backend && python -m pytest -q
```

## 12. Tests

**150 tests verts** (133 antérieurs + 17 Phase 4) — `tests/test_recommendations_engine.py` :
- moteur pur : génération hypo/hyper (critical/behavioral), non calculable → vide, aucun message avec dose/terme interdit, XAI fiable → justification utilisée, XAI non fiable → renvoi clinique + `used_as_clinical_justification=False` (XAI **non** condition principale) ;
- safety : blocage terme interdit, détection de dose ;
- workflow : transitions valides/invalides ;
- endpoints/RBAC : patient ne peut ni générer ni approuver, clinicien génère→`pending` (`is_synthetic`, `rule_id`/`rule_version`, catégorie, probabilité), `patient_id` requis pour clinicien, audit `recommendation.generated`, flux complet generate→approve, modify→reject, patient ne voit que l'approuvé (liste + détail 403 avant approbation).

## 13. Limites assumées

- **Seuils non cliniques** : calés sur le benchmark synthétique séparable (Phase 2.1), **non transférables au clinique**.
- **Scores d'actionnabilité heuristiques** : priorisation/documentation seulement.
- **Pas de validation clinique** des messages ni des règles : prototype de thèse.
- **Journal/persistance non autoritaires** : démo, non certifiée.

## 14. Critères de passage Phase 5 (proposé)

Phase 5 **NON démarrée**. Toute suite reste conditionnée à la validation du superviseur de ce rapport et au maintien strict de l'open-loop (aucune boucle fermée sans cadre réglementaire).
