# MediAI Care — Cartographie des contrats API v1

> Prototype académique **non certifié** — aide à la décision **open-loop** —
> **données 100 % synthétiques** (`is_synthetic=True`). Aucune donnée réelle.
> Phase 5 (consolidation). Préfixe : `/api/v1`. Endpoints `meta` hors préfixe.

Authentification : **JWT Bearer** (access ~15 min) + **refresh opaque** (rotation +
détection de réutilisation). En-tête : `Authorization: Bearer <access_token>`.

Le schéma machine complet est exposé en `GET /openapi.json` et l'UI en `GET /docs`.
Ce document est la vue humaine de référence (rôles, ownership, erreurs, audit).

## Légende
- **Rôle** : `none` (public), `patient`, `clinician`, `admin`, `auth` (tout utilisateur authentifié).
- **Ownership** : contrainte au-delà du rôle (ex. patient limité à son propre dossier).
- **Audit** : nom d'action écrit dans le journal append-only chaîné.

---

## Meta (non authentifié) — `app/main.py`

| Méthode | Chemin | Rôle | Réponse | Erreurs |
|---|---|---|---|---|
| GET | `/health` | none | `{status, version, environment}` | — |
| GET | `/ready` | none | `{status:"ready"}` | 503 (DB/table injoignable) |
| GET | `/` | none | `{name, version, disclaimer, docs}` | — |

## Auth — `app/api/v1/auth.py`

| Méthode | Chemin | Rôle | Body | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|
| POST | `/auth/register/patient` | none | `PatientRegister` | `UserPublic` (201) | 409 (email pris), 422 | `user.register` |
| POST | `/auth/register/clinician` | none | `ClinicianRegister` | `UserPublic` (201) | 409, 422 | `user.register` |
| POST | `/auth/login` | none | `LoginRequest` | `TokenPair` | 401, 422, **429** (rate limit) | `auth.login`, `auth.login_failed` |
| POST | `/auth/refresh` | none | `RefreshRequest` | `TokenPair` | 401, 422, **429** | `auth.refresh`, `auth.refresh_reuse_detected` |
| POST | `/auth/logout` | auth | `LogoutRequest` | 204 | 401 | `auth.logout` |
| GET | `/auth/me` | auth | — | `UserPublic` | 401 | — |

Rate limit : login **5 / 60 s**, refresh **10 / 60 s** par IP (configurable). Réutilisation
d'un refresh révoqué → **révocation de toutes les sessions** de l'utilisateur.

## Patients — `app/api/v1/patients.py`

| Méthode | Chemin | Rôle | Ownership | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|
| GET | `/patients` | clinician/admin | — | `list[PatientPublic]` | 401, 403 | `patient.list` |
| GET | `/patients/me` | patient | self | `PatientPublic` | 401, 403, 404 | `patient.read_self` |
| GET | `/patients/{id}` | auth | patient→self ; clin/admin→tout | `PatientPublic` | 401, 403, 404 | `patient.read` |

## Timeseries — `app/api/v1/timeseries.py`

Écritures **réservées au patient** (son propre dossier), ingestion **idempotente**
(201 créé / 200 doublon). Lectures : patient → son dossier ; clinicien/admin → `patient_id` requis.

| Méthode | Chemin | Rôle | Body/Query | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|
| POST | `/timeseries/cgm` | patient | `CgmReadingCreate` | `IngestionResult` (201/200) | 401, 403, 422 | `timeseries.cgm.create` |
| POST | `/timeseries/insulin` | patient | `InsulinEventCreate` | `IngestionResult` | 401, 403, 422 | `timeseries.insulin.create` |
| POST | `/timeseries/meals` | patient | `MealEventCreate` | `IngestionResult` | 401, 403, 422 | `timeseries.meal.create` |
| POST | `/timeseries/activity` | patient | `ActivityEventCreate` | `IngestionResult` | 401, 403, 422 | `timeseries.activity.create` |
| GET | `/timeseries/cgm` | auth | scope+fenêtre | `list[CgmReadingPublic]` | 400 (fenêtre), 401, 403 | — |
| GET | `/timeseries/insulin` | auth | scope+fenêtre | `list[InsulinEventPublic]` | 400, 401, 403 | — |
| GET | `/timeseries/meals` | auth | scope+fenêtre | `list[MealEventPublic]` | 400, 401, 403 | — |
| GET | `/timeseries/activity` | auth | scope+fenêtre | `list[ActivityEventPublic]` | 400, 401, 403 | — |
| GET | `/timeseries/events` | auth | scope+fenêtre | `list[TimeseriesEventPublic]` | 400, 401, 403 | — |

## ML (open-loop) — `app/api/v1/ml.py`

| Méthode | Chemin | Rôle | Ownership | Body | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|---|
| POST | `/ml/predict` | auth | patient→self ; clin/admin→`patient_id` requis | `PredictRequest` | `PredictResponse` (probabilité only) | 400 (horizon), 401, 403, 404, **429** | `ml.predict` |

`PredictResponse` ne contient **aucun** champ décision/dose/action. `open_loop_notice`
explicite. `persist=true` → écrit dans `predictions` (`is_synthetic=True`). Audit systématique.

## XAI (support affichage/audit) — `app/api/v1/xai.py`

| Méthode | Chemin | Rôle | Ownership | Body/Query | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|---|
| POST | `/xai/explain` | auth | comme `ml.predict` | `LocalExplainRequest` | `LocalExplanation` | 400 (horizon/méthode/cible), 401, 403, 404, **429** | `xai.explain` |
| GET | `/xai/global` | clinician/admin | — | `target`, `horizon_min`, `regenerate` | `GlobalExplanation` | 400, 401, 403 | `xai.global` |

XAI = **pondération du modèle, pas une causalité clinique**. `clinical_justification_allowed`
n'est jamais `true` côté recommandations. Fiabilité sémantique exposée (`xai_reliability_status`).

## Recommandations (open-loop, validation clinicien) — `app/api/v1/recommendations.py`

| Méthode | Chemin | Rôle | Body/Query | Réponse | Erreurs | Audit |
|---|---|---|---|---|---|---|
| POST | `/recommendations/generate` | clinician/admin | `GenerateRequest` (`extra="forbid"`) | `GenerateResponse` | 400 (safety/horizon), 401, 403, 404, 422 (spoof), **429** | `recommendation.generated` / `recommendation.safety_blocked` / `recommendation.generate_skipped` |
| GET | `/recommendations` | clinician/admin | filtres | `list[RecommendationPublic]` | 401, 403 | — |
| GET | `/recommendations/mine` | patient | pagination | `list[RecommendationPublic]` (**approuvées seules**) | 401, 403 | — |
| GET | `/recommendations/{id}` | auth | patient→sienne approuvée | `RecommendationPublic` | 401, 403, 404 | — |
| POST | `/recommendations/{id}/approve` | clinician/admin | `ReviewRequest` | `RecommendationPublic` | 401, 403, 404, 409 | `recommendation.approved` |
| POST | `/recommendations/{id}/reject` | clinician/admin | `ReviewRequest` | `RecommendationPublic` | 401, 403, 404, 409 | `recommendation.rejected` |
| POST | `/recommendations/{id}/modify` | clinician/admin | `ModifyRequest` | `RecommendationPublic` | 400 (safety), 401, 403, 404, 409 | `recommendation.modified` / `recommendation.safety_blocked` |

**Source-of-truth des probabilités** : la probabilité provient soit d'une prédiction
synthétique persistée (`prediction_id`, ownership + `is_synthetic=True` sinon 400),
soit du calcul serveur (`ml.predict`). Toute injection client de `probability` /
`model_name` / `xai_status` → **422** (`extra="forbid"`). Toute suggestion naît `pending`.

## Audit — `app/api/v1/audit.py`

| Méthode | Chemin | Rôle | Réponse | Erreurs |
|---|---|---|---|---|
| GET | `/audit-logs` | clinician/admin | `list[AuditLogPublic]` | 401, 403 |
| GET | `/audit-logs/verify` | clinician/admin | `AuditChainVerification` (`{valid: bool, ...}`) | 401, 403 |

Journal **append-only chaîné** (SHA-256, contraintes anti-fork). Aucun secret (mot de
passe / jeton) n'est stocké dans `event_metadata`.

---

## Invariants transverses
- **Open-loop strict** : probabilités + suggestions uniquement ; jamais de dose/décision/action automatique.
- **Validation clinicien obligatoire** pour toute recommandation (cycle `pending → approved|rejected|modified`).
- **RBAC serveur** (`require_role`) + **ownership** (`resolve_read_scope`) sur chaque accès patient.
- **Audit systématique** des écritures et inférences.
- **Données synthétiques** : tout enregistrement porte `is_synthetic=True`.
