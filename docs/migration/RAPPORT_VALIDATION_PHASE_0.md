# Rapport de validation — Socle backend (Phase 0)

**Projet :** MediAI Care — SaMD diabète, prototype de thèse (Master Informatique Biomédicale)
**Périmètre :** validation technique stricte du socle backend AVANT passage à la Phase 1 (Data Engineering & Pipeline temporel).
**Posture :** open-loop strict · données simulées uniquement (`is_synthetic=True`) · **non certifié** (MDR / IEC 62304 / ISO 13485 / HDS / RGPD opérationnel).
**Statut serveur :** FastAPI sur port **8000** (workflow « Backend API »), séparé de l'app React (port 5000).

> Honnêteté de cadrage : ce socle pose les fondations de sécurité et de données réelles. Il ne fournit ni ML/XAI réel, ni mobile, ni conformité réglementaire opérationnelle. Les sections 9 et 10 listent explicitement ce qui reste à compléter.

---

## 1. Arborescence réelle du backend

```
backend/
├── alembic.ini                     # Config Alembic (pointée sur app.core)
├── pytest.ini                      # Config tests (env=test, SQLite isolé)
├── requirements.txt                # Dépendances épinglées
├── .env.example                    # Variables d'environnement attendues (sans secrets)
├── README.md                       # Exécution, API, init
│
├── alembic/                        # MIGRATIONS
│   ├── env.py                      # Branché sur Base.metadata + DATABASE_URL
│   ├── script.py.mako
│   └── versions/
│       ├── 5d2d8c797582_initial_schema.py
│       └── 8e901cc3bbbc_audit_chain_unique_constraints.py
│
├── app/
│   ├── main.py                     # App FastAPI, CORS, headers sécurité, /health, /
│   │
│   ├── core/                       # CONFIGURATION + primitives
│   │   ├── config.py               # Settings 12-factor (env), CORS par environnement
│   │   ├── database.py             # Engine SQLAlchemy + SessionLocal + get_db
│   │   └── security.py             # Argon2 (mdp) + JWT access + refresh opaque (sha256)
│   │
│   ├── models/                     # MODÈLES ORM (SQLAlchemy 2, types portables)
│   │   ├── base.py                 # Base, UUIDMixin, TimestampMixin
│   │   ├── user.py                 # Role, User
│   │   ├── profile.py              # Patient, ClinicianProfile
│   │   ├── consent.py              # Consent
│   │   ├── token.py                # RefreshToken
│   │   ├── audit.py                # AuditLog (chaîné)
│   │   ├── timeseries.py           # CgmReading, InsulinEvent, MealEvent, ActivityEvent
│   │   ├── lab.py                  # LabReport
│   │   └── clinical.py             # Prediction, Recommendation, RecommendationStatus
│   │
│   ├── schemas/                    # CONTRATS Pydantic (validation I/O)
│   │   ├── auth.py                 # Register/Login/Refresh/Logout/TokenPair/UserPublic
│   │   ├── patient.py              # PatientPublic
│   │   ├── recommendation.py       # RecommendationPublic, ReviewRequest
│   │   └── audit.py                # AuditLogPublic, AuditChainVerification
│   │
│   ├── repositories/               # ACCÈS DONNÉES (isolé, testable)
│   │   ├── user_repo.py            # Users, roles, patients
│   │   ├── token_repo.py           # Refresh tokens (rotation atomique, révocation famille)
│   │   ├── audit_repo.py           # Append + lecture chaîne
│   │   └── recommendation_repo.py  # Recommandations
│   │
│   ├── services/                   # LOGIQUE MÉTIER
│   │   ├── auth_service.py         # register/login/refresh/logout + audit
│   │   ├── audit_service.py        # Hash chaîné + vérification d'intégrité
│   │   └── recommendation_service.py # Arbitrage open-loop atomique (approve/reject)
│   │
│   ├── api/
│   │   ├── deps.py                 # get_db, get_current_user, require_role (RBAC)
│   │   └── v1/
│   │       ├── router.py           # Agrège les sous-routeurs sous /api/v1
│   │       ├── auth.py             # ROUTES auth
│   │       ├── patients.py         # ROUTES patients
│   │       ├── recommendations.py  # ROUTES recommandations open-loop
│   │       └── audit.py            # ROUTES journal d'audit
│   │
│   └── seed.py                     # Seed idempotent (rôles, comptes démo, data synthétique)
│
└── tests/                          # TESTS (SQLite jetable, isolé)
    ├── conftest.py                 # Fixtures : DB isolée, client, helpers auth
    ├── test_models.py
    ├── test_auth.py
    ├── test_rbac.py
    ├── test_audit.py
    └── test_endpoints.py
```

| Élément | Emplacement |
|---|---|
| **Modèles** | `app/models/` |
| **Routes** | `app/api/v1/` |
| **Services** | `app/services/` (logique) + `app/repositories/` (accès données) |
| **Tests** | `backend/tests/` |
| **Migrations Alembic** | `backend/alembic/versions/` |
| **Configuration** | `backend/app/core/config.py` (+ `.env.example`, `alembic.ini`, `pytest.ini`) |

---

## 2. Schéma de base de données réel (PostgreSQL)

> Vérifié en direct via `information_schema` sur la base PostgreSQL réelle. **14 tables** + table technique `alembic_version`.
> Conventions communes : PK `id uuid`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz` (via `TimestampMixin`). Toutes les tables de données médicales portent `is_synthetic boolean NOT NULL` (donnée simulée).

### Vue d'ensemble des tables et relations

```
roles ──< users ──< refresh_tokens
                └──< audit_logs (actor_user_id, nullable)
users ──1:1── patients (profil dossier patient)
users ──1:1── clinician_profiles
patients ──< cgm_readings / insulin_events / meal_events / activity_events
patients ──< lab_reports
patients ──< consents
patients ──< predictions ──< recommendations
recommendations ── reviewed_by ──> users (clinicien arbitre)
```

### Détail par table

**`roles`** — référentiel RBAC
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| name | varchar | NOT NULL · **UNIQUE** (`ix_roles_name`) |
| description | varchar | nullable |
| created_at / updated_at | timestamptz | NOT NULL / NOT NULL |

Valeurs seedées : `patient`, `clinician`, `admin`.

**`users`** — comptes
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| email | varchar | NOT NULL · **UNIQUE** (`ix_users_email`) |
| hashed_password | varchar | NOT NULL (Argon2 — jamais en clair) |
| is_active | boolean | NOT NULL |
| role_id | uuid | **FK → roles.id** (NO ACTION), index `ix_users_role_id` |

**`patients`** — dossier patient
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | **FK → users.id** (NO ACTION) · **UNIQUE** (`ix_patients_user_id`) → 1:1 |
| first_name / last_name | varchar | NOT NULL |
| birth_date | date | nullable |
| diabetes_type | varchar | nullable |
| is_synthetic | boolean | NOT NULL |

**`clinician_profiles`**
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | **FK → users.id** (NO ACTION) · **UNIQUE** → 1:1 |
| first_name / last_name | varchar | NOT NULL |
| specialty / license_number | varchar | nullable |

**`refresh_tokens`** — sessions
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | **FK → users.id** (NO ACTION), index |
| token_hash | varchar | NOT NULL · **UNIQUE** (`ix_refresh_tokens_token_hash`) — SHA-256, jamais le secret en clair |
| expires_at | timestamptz | NOT NULL |
| revoked | boolean | NOT NULL |
| revoked_at | timestamptz | nullable |
| rotated_from | varchar | nullable (traçabilité de la rotation) |
| user_agent / ip_address | varchar | nullable |

**`consents`** — RGPD (structure prête)
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| patient_id | uuid | **FK → patients.id** (NO ACTION), index |
| consent_type | varchar | NOT NULL |
| policy_version | varchar | NOT NULL |
| granted | boolean | NOT NULL |
| granted_at / revoked_at | timestamptz | nullable |

**`audit_logs`** — journal chaîné (voir §6)
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| actor_user_id | uuid | **FK → users.id** (NO ACTION), nullable (événements système), index |
| action | varchar(80) | NOT NULL, index |
| resource_type | varchar | nullable |
| resource_id | varchar | nullable |
| ip_address / user_agent | varchar | nullable |
| event_metadata | json | nullable (jamais de secret) |
| prev_hash | varchar(64) | nullable (genesis = 64×`0`) |
| entry_hash | varchar(64) | NOT NULL · **UNIQUE** (`ix_audit_logs_entry_hash`) |
| sequence | integer | NOT NULL · **UNIQUE** (`ix_audit_logs_sequence`) — anti-fork de chaîne |

**Tables séries temporelles** — `cgm_readings`, `insulin_events`, `meal_events`, `activity_events`
Toutes : `id uuid PK`, `patient_id uuid` **FK → patients.id** (NO ACTION), `ts timestamptz NOT NULL`, `is_synthetic boolean NOT NULL`, + colonnes métier :
- `cgm_readings` : `glucose_mgdl float NOT NULL`, `trend varchar`, `device_id varchar`
- `insulin_events` : `units float NOT NULL`, `insulin_type varchar`
- `meal_events` : `carbs_g float NOT NULL`, `description varchar`
- `activity_events` : `duration_min float NOT NULL`, `activity_type varchar`, `intensity varchar`

**Index composite clé pour la Phase 1** : chaque table série porte un index `(patient_id, ts)` (`ix_cgm_patient_ts`, `ix_insulin_patient_ts`, `ix_meal_patient_ts`, `ix_activity_patient_ts`) — requêtes temporelles par patient déjà optimisées. Index simples sur `patient_id` et `ts` également présents.

**`lab_reports`**
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| patient_id | uuid | **FK → patients.id** (NO ACTION), index |
| ts | timestamptz | NOT NULL, index |
| source | varchar | nullable |
| verified | boolean | NOT NULL |
| signature | varchar | nullable (QR signé — vérification réelle en phase ultérieure) |
| payload | json | nullable |
| is_synthetic | boolean | NOT NULL |

**`predictions`** — sortie modèle (placeholder pour l'instant)
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| patient_id | uuid | **FK → patients.id** (NO ACTION), index |
| ts | timestamptz | NOT NULL, index |
| horizon_min | integer | NOT NULL |
| predicted_event | varchar | NOT NULL |
| probability | float | NOT NULL |
| model_name / model_version | varchar | NOT NULL |
| is_synthetic | boolean | NOT NULL |

**`recommendations`** — open-loop
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| patient_id | uuid | **FK → patients.id** (NO ACTION), index |
| prediction_id | uuid | **FK → predictions.id** (NO ACTION), nullable, index |
| status | varchar | NOT NULL, index — **enum applicatif** `RecommendationStatus` : `pending` / `approved` / `rejected` |
| category | varchar | NOT NULL |
| message | text | NOT NULL |
| rationale | json | nullable (placeholder XAI) |
| priority | integer | NOT NULL |
| reviewed_by | uuid | **FK → users.id** (NO ACTION), nullable (clinicien arbitre) |
| reviewed_at | timestamptz | nullable |
| review_note | text | nullable |

> **Note honnête sur les règles de suppression** : toutes les FK sont en `NO ACTION` (pas de cascade). Choix volontaire pour un système médical — aucune suppression en cascade silencieuse de données patient. La gestion du cycle de vie (anonymisation/suppression RGPD) est un sujet explicite de phase ultérieure (§10).
>
> **Statut enum** : `RecommendationStatus` est un enum Python (`str, Enum`) stocké en `varchar`. Pas de type ENUM natif PostgreSQL — choix de portabilité (mêmes modèles sur PostgreSQL prod et SQLite de test). À renforcer en Phase 1 si verrouillage au niveau base souhaité (CHECK ou ENUM natif).

---

## 3. Migrations Alembic

```
$ alembic history
5d2d8c797582 -> 8e901cc3bbbc (head), audit chain unique constraints
<base> -> 5d2d8c797582, initial schema
```

- ✅ **Migration initiale présente** : `5d2d8c797582_initial_schema.py` (les 14 tables).
- ✅ **Migration additive** : `8e901cc3bbbc` ajoute les contraintes d'unicité `sequence` + `entry_hash` du journal d'audit (durcissement anti-fork — voir §6).
- ✅ **Historique linéaire** `base → head`, rejouable sur base vide.
- ✅ **Pas de création implicite non contrôlée** : `Base.metadata.create_all()` n'est **utilisé que dans les tests** (`conftest.py`, SQLite jetable). En dev/prod, le schéma est **exclusivement** géré par Alembic. `env.py` est branché sur `Base.metadata` et lit `DATABASE_URL`.

**Procédure dev → prod sur Replit :**
1. Dev : appliquer les migrations sur la base Replit de développement.
2. Générer toute nouvelle migration : `alembic revision --autogenerate -m "..."`, **relire le script généré** (l'autogenerate n'est jamais appliqué aveuglément).
3. Prod : déployer le même code, fournir `DATABASE_URL` de production via les secrets, puis exécuter `alembic upgrade head` sur la base de production **avant** la mise en service.

**Commande exacte pour appliquer les migrations :**
```bash
cd backend && alembic upgrade head
```
Init complète d'une base neuve (migrations + données démo simulées) :
```bash
cd backend && alembic upgrade head && python -m app.seed
```

---

## 4. Authentification

| Paramètre | Valeur | Source |
|---|---|---|
| **Durée access token** | **15 min** (configurable `ACCESS_TOKEN_EXPIRE_MINUTES`) | `core/config.py` |
| **Durée refresh token** | **7 jours** (configurable `REFRESH_TOKEN_EXPIRE_DAYS`) | `core/config.py` |
| **Algorithme JWT** | **HS256** | `core/security.py` |
| **Hachage mot de passe** | **Argon2id** (`argon2-cffi`) | `core/security.py` |
| **Stockage refresh token** | **opaque** (`secrets.token_urlsafe(48)`), **seul le SHA-256 est stocké** (`token_hash`, UNIQUE) | `core/security.py` |

**Claims de l'access token JWT** : `sub` (user id), `role`, `type="access"` (vérifié au décodage — un refresh ne peut pas servir d'access), `iat`, `exp`, `jti` (uuid4 unique).

**Rotation** : à chaque `/auth/refresh`, l'ancien refresh est révoqué **atomiquement** (`token_repo.revoke_if_active` — `UPDATE ... WHERE revoked=false` conditionnel, immunisé contre la course) et un nouveau couple access+refresh est émis. `rotated_from` trace la filiation.

**Détection de réutilisation** : si un refresh **déjà révoqué** est présenté (rejeu d'un token volé ou expiré par rotation), le système considère la session compromise, **révoque toute la famille de sessions de l'utilisateur** et journalise `auth.refresh_reuse_detected`.

**Révocation de famille** : `token_repo` peut révoquer tous les refresh actifs d'un utilisateur — utilisé par la détection de réutilisation et disponible pour une révocation administrative.

**Logout** : `/auth/logout` révoque le refresh fourni **après contrôle de propriété** — un utilisateur ne peut révoquer que ses propres tokens (vérifié en test : un patient ne peut pas invalider la session d'un clinicien). Idempotent.

**Stratégie en cas de token compromis :**
- *Access token volé* : portée limitée par la courte durée (15 min), non révocable individuellement (nature stateless du JWT — compromis assumé et documenté).
- *Refresh token volé* : dès que le token légitime OU le token volé est utilisé après rotation, la réutilisation est détectée → **révocation de toute la famille**, forçant une réauthentification complète.

**Événements d'audit générés par l'authentification** (voir §6) : `auth.login`, `auth.login_failed`, `auth.refresh`, `auth.refresh_reuse_detected`, `auth.logout`, `user.register`.

---

## 5. RBAC serveur — matrice de permissions

RBAC **côté serveur** via `deps.require_role(*roles)` (403 si le rôle ne correspond pas) et `get_current_user` (401 si non authentifié). Le rôle provient de l'utilisateur en base, **jamais** d'une donnée client.

| Endpoint | Patient | Clinician | Admin | Non authentifié |
|---|:---:|:---:|:---:|:---:|
| `GET /auth/me` | ✅ | ✅ | ✅ | ❌ 401 |
| `GET /patients/me` | ✅ (son dossier) | ❌ 403 | ❌ 403 | ❌ 401 |
| `GET /patients/{id}` | ✅ **uniquement le sien** (sinon 403) | ✅ tous | ✅ tous | ❌ 401 |
| `GET /patients` | ❌ 403 | ✅ | ✅ | ❌ 401 |
| `GET /recommendations` | ❌ 403 | ✅ | ✅ | ❌ 401 |
| `POST /recommendations/{id}/approve` | ❌ 403 | ✅ | ✅ | ❌ 401 |
| `POST /recommendations/{id}/reject` | ❌ 403 | ✅ | ✅ | ❌ 401 |
| `GET /audit-logs` | ❌ 403 | ✅ | ✅ | ❌ 401 |
| `GET /audit-logs/verify` | ❌ 403 | ✅ | ✅ | ❌ 401 |

> `GET /patients/{id}` applique en plus un contrôle **par ressource** (ownership) : un patient authentifié n'accède qu'à son propre dossier ; toute autre cible renvoie 403. Tous les accès aux dossiers patients sont audités (`patient.read`, `patient.read_self`, `patient.list`).

---

## 6. Audit logs

**Champs d'une entrée** (`audit_logs`) : `id`, `actor_user_id` (nullable pour événements système), `action`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `event_metadata` (JSON), `prev_hash`, `entry_hash`, `sequence`, `created_at`.

**Calcul du hash** : SHA-256 d'une sérialisation JSON **canonique** (`sort_keys=True`, séparateurs compacts) des champs immuables :
`{sequence, actor_user_id, action, resource_type, resource_id, event_metadata, created_at, prev_hash}`.

**Chaînage** : `prev_hash` de l'entrée N = `entry_hash` de l'entrée N-1 ; la première entrée référence un genesis (`"0"×64`). `sequence` est un compteur strictement croissant. Les deux colonnes `entry_hash` et `sequence` portent une **contrainte d'unicité en base** (migration `8e901cc3bbbc`) : impossible d'insérer deux entrées au même rang ni de « forker » la chaîne sans violation de contrainte.

**Événements audités** : `auth.login`, `auth.login_failed`, `auth.refresh`, `auth.refresh_reuse_detected`, `auth.logout`, `user.register`, `patient.list`, `patient.read`, `patient.read_self`, `recommendation.approve`, `recommendation.reject`, `system.seed`.

**Scénario de détection d'altération** : `GET /audit-logs/verify` recalcule toute la chaîne. En cas de modification, suppression ou réordonnancement d'une entrée, le hash recalculé diverge ou le `prev_hash` ne correspond plus → réponse `{"valid": false, "checked": N, "broken_at": <sequence>}`. Couvert par le test `test_tampering_breaks_chain`.

**Jamais de secret journalisé** : ✅ confirmé. Aucun mot de passe, hash de mot de passe, token brut ni hash de token n'est écrit dans l'audit. `event_metadata` ne contient que des métadonnées non sensibles (ex. `{"synthetic": true, "demo_accounts": 2}`). Les actions sensibles référencent des **identifiants** (`resource_id`), pas des contenus.

**Limites assumées (honnêteté SaMD)** : ce mécanisme garantit la **détectabilité** d'une altération, **pas son impossibilité**. Le hash et la base sont gérés par le même système ; un attaquant disposant d'un accès total à la base pourrait recalculer toute la chaîne. Une inviolabilité réelle exige stockage **WORM** + **ancrage externe** + signature par clé gérée séparément → **hors périmètre de ce socle** (§10).

**Tests associés** : `test_chain_grows_and_links`, `test_verify_chain_valid`, `test_tampering_breaks_chain`, `test_login_creates_audit_entry`, `test_audit_verify_endpoint`.

---

## 7. Tests

```
$ cd backend && python -m pytest -q
...........................                                              [100%]
27 passed, 5 warnings in 6.43s
```

> Les 5 warnings sont des `DeprecationWarning` de dépendances tierces (Pydantic/Starlette/httpx), sans impact fonctionnel. Tests exécutés sur **SQLite jetable isolé** (aucune dépendance à PostgreSQL ni effet de bord sur la base de dev).

**Couverture par catégorie (27 tests) :**

| Catégorie demandée | Tests |
|---|---|
| **Modèles** | `test_metadata_has_all_tables`, `test_create_user_with_role`, `test_patient_timeseries_marked_synthetic`, `test_recommendation_defaults_pending` |
| **Auth** | `test_register_patient_then_login`, `test_duplicate_email_rejected`, `test_login_wrong_password`, `test_me_requires_auth` |
| **Refresh rotation** | `test_refresh_rotation_issues_new_and_revokes_old` |
| **Reuse detection** | `test_refresh_reuse_revokes_all_sessions` |
| **Logout** | `test_logout_revokes_refresh` |
| **Politique mot de passe** | `test_weak_password_rejected` |
| **RBAC** | `test_patient_cannot_list_patients`, `test_clinician_can_list_patients`, `test_clinician_cannot_access_patient_me`, `test_patient_can_read_own_record`, `test_recommendations_require_clinician`, `test_audit_requires_clinician` |
| **Audit chain** | `test_chain_grows_and_links`, `test_verify_chain_valid`, `test_tampering_breaks_chain`, `test_login_creates_audit_entry` |
| **Endpoints patients** | (couverts via RBAC : `test_patient_can_read_own_record`, `test_clinician_can_list_patients`, `test_clinician_cannot_access_patient_me`) |
| **Endpoints recommandations / open-loop approval-rejection** | `test_open_loop_approve_flow`, `test_approve_unknown_reco_404` |
| **Endpoints audit** | `test_audit_verify_endpoint` |
| **Santé / divers** | `test_health`, `test_root_has_disclaimer` |

---

## 8. Documentation OpenAPI

Vérifié sur `/openapi.json` (OpenAPI **3.1.0**, titre « MediAI Care API », version `0.1.0-backend-foundation`). Interface interactive sur **`/docs`** (Swagger UI).

- ✅ **Tous les endpoints exposés** : `/`, `/health`, et sous `/api/v1` : `auth/register/patient`, `auth/register/clinician`, `auth/login`, `auth/refresh`, `auth/logout`, `auth/me`, `patients`, `patients/me`, `patients/{patient_id}`, `recommendations`, `recommendations/{rec_id}/approve`, `recommendations/{rec_id}/reject`, `audit-logs`, `audit-logs/verify`.
- ✅ **Schémas Pydantic exposés** : `PatientRegister`, `ClinicianRegister`, `LoginRequest`, `RefreshRequest`, `LogoutRequest`, `TokenPair`, `UserPublic`, `PatientPublic`, `RecommendationPublic`, `ReviewRequest`, `AuditLogPublic`, `AuditChainVerification`, `HTTPValidationError`, `ValidationError`.
- ✅ **Réponses d'erreur** : `422` (validation) documentée automatiquement ; codes métier `401/403/404/409` levés explicitement par les routes.
- ✅ **Schéma d'authentification Bearer** : `securitySchemes: HTTPBearer` (bouton « Authorize » dans Swagger).
- ⚠️ **Exemples de payloads** : les schémas portent les contraintes de champs (longueurs, formats `EmailStr`, etc.) mais **pas encore d'exemples explicites** (`json_schema_extra`/`examples`). Amélioration de confort à ajouter (non bloquante).

---

## 9. Sécurité minimale — état avant Phase 1

| Élément | État | Détail |
|---|---|---|
| **CORS restrictif par environnement** | ✅ **Ajouté** | `cors_origins` calculé par environnement (`core/config.py`) : allow-list explicite via `CORS_ORIGINS`, défaut localhost en dev, **refus strict (liste vide) en production** sans config. Plus de `*`. Vérifié en direct : origine autorisée → en-tête renvoyé ; origine non autorisée → bloquée. |
| **Validation stricte des inputs** | ✅ | Pydantic sur toutes les entrées (types, longueurs, `EmailStr`) ; UUID typés ; bornes sur `limit`/`offset`. |
| **Politique de mot de passe** | ✅ (minimale) | min **8** / max 128 caractères (`schemas/auth.py`), testée (`test_weak_password_rejected`). À durcir si besoin (complexité, dictionnaire). |
| **Variables d'environnement obligatoires** | ✅ | `JWT_SECRET_KEY` requis hors test (**fail-loud** au démarrage si absent), `DATABASE_URL`. Documentées dans `.env.example`. |
| **Absence de secrets hardcodés** | ✅ | Aucun secret en dur ; tout vient de l'environnement / secrets Replit. |
| **DEBUG=false en production** | ✅ | FastAPI n'active pas le mode debug ; pas de traceback exposé. `environment` piloté par `APP_ENV`. |
| **Headers de sécurité** | ✅ | Middleware ajoutant `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`. |
| **Endpoint `/health`** | ✅ | `GET /health` → `{status, version, environment}`. |
| **Redaction des logs sensibles** | ✅ | L'audit ne journalise jamais mot de passe/token/PII inutile (§6). |
| **HTTPS/TLS** | ✅ (plateforme) | TLS terminé par Replit (déploiement) ; en interne prévoir HSTS au déploiement. |
| **Rate limiting login/refresh** | ⚠️ **Non implémenté — à faire** | Pas de limitation de débit. Recommandé en Phase 1+ (limiteur sur `/auth/login` et `/auth/refresh`). Sur instance unique, un limiteur en mémoire suffit en prototype ; un store partagé (Redis) serait requis en multi-instances. **Documenté comme à compléter, non bloquant pour le socle.** |
| **Endpoint `/ready`** | ⚠️ Non implémenté | `/health` suffit pour le prototype. Une vraie sonde *readiness* (ping DB) sera utile à la mise en production. |

---

## 10. Limites restantes — explicitement hors périmètre de ce socle

| Domaine | Statut |
|---|---|
| **Mobile Expo** | ❌ Non commencé — le socle est une API ; l'app mobile viendra après la base de données/sécurité. |
| **ML/XAI réel** | ❌ Placeholders uniquement (`model_name="placeholder"`, `rationale` factice). Aucune inférence réelle. |
| **TimescaleDB / hypertables** | ❌ Non activé — tables série en PostgreSQL standard, avec index `(patient_id, ts)` déjà prêts. Activation = objet de la **Phase 1**. |
| **MQTT / ingestion IoMT** | ❌ Aucune ingestion temps réel ; données injectées par seed simulé. |
| **Chiffrement applicatif au repos** | ❌ Au-delà du chiffrement disque de la plateforme, pas de chiffrement applicatif champ-à-champ. |
| **WORM / ancrage externe de l'audit** | ❌ Audit = détectabilité, pas inviolabilité (§6). |
| **Conformité RGPD opérationnelle** | ❌ Table `consents` présente (structure) mais pas de workflow consentement/effacement/portabilité opérationnel. |
| **QR signé vérifié** | ❌ `lab_reports.signature` existe ; vérification cryptographique réelle non implémentée. |
| **Notifications push** | ❌ Hors périmètre. |
| **Messagerie temps réel** | ❌ Hors périmètre (pas de WebSocket/SSE). |
| **Rate limiting / `/ready`** | ⚠️ À compléter (§9). |

---

## Conclusion

Le socle backend remplit les objectifs de sécurité et de données réelles fixés pour la Phase 0 : PostgreSQL réel piloté par Alembic, authentification serveur robuste (Argon2 + JWT court + refresh opaque haché avec rotation atomique, détection de réutilisation et révocation de famille), RBAC serveur avec contrôle par ressource, recommandations strictement open-loop, et journal d'audit chaîné vérifiable. **27/27 tests verts.** Les écarts résiduels (rate limiting, `/ready`, exemples OpenAPI) sont identifiés, non bloquants, et documentés.

**La Phase 1 (Data Engineering & Pipeline temporel) n'a pas été démarrée**, conformément à la consigne — elle attend votre validation de ce rapport.
