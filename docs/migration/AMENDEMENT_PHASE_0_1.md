# Amendement — Phase 0.1 : Hardening minimal

> Prototype académique non certifié — aide à la décision **open-loop** — données
> simulées uniquement (`is_synthetic=True`). Cet amendement complète le socle
> backend validé en Phase 0, avant le démarrage de la Phase 1.

## Périmètre traité

Les 6 points demandés pour le durcissement minimal :

1. Rate limiting `POST /login` + `POST /refresh`
2. Endpoint `GET /ready`
3. Smoke test PostgreSQL / Alembic
4. Exemples OpenAPI (`json_schema_extra`)
5. Politique de mot de passe (règle minimale + documentation)
6. Note de concurrence audit (+ verrou applicatif léger)

---

## 1. Rate limiting

- **`app/core/rate_limit.py`** (nouveau) : `InMemoryRateLimiter` (fenêtre
  glissante par IP + bucket, thread-safe) et la fabrique de dépendance FastAPI
  `rate_limiter(bucket, max_attempts, window_seconds)`.
- Appliqué via `dependencies=[Depends(...)]` sur `POST /api/v1/auth/login` et
  `POST /api/v1/auth/refresh` (`app/api/v1/auth.py`).
- Réponses : **`429 Too Many Requests`** + en-tête **`Retry-After`**.
- Défauts configurables (`app/core/config.py`) : login **5 / 60 s**,
  refresh **10 / 60 s** (`RATE_LIMIT_LOGIN_MAX/_WINDOW`, `RATE_LIMIT_REFRESH_MAX/_WINDOW`).
- **Redis-ready** : remplacer le singleton `limiter` par une implémentation Redis
  respectant la même interface `hit(...)`, sans toucher au reste du code
  (documenté en tête de `rate_limit.py`).

## 2. Endpoint `/ready`

- **`app/main.py`** : `GET /ready` exécute `SELECT 1` + `SELECT 1 FROM users LIMIT 1`.
  Renvoie **`200 {"status":"ready"}`** si OK, **`503 not ready`** sinon.
- `GET /health` (liveness) reste inchangé.

## 3. Smoke test PostgreSQL / Alembic

- **`backend/scripts/smoke_postgres.py`** (nouveau) : vérifie sur la base
  PostgreSQL réelle (lecture du catalogue uniquement) :
  - présence des **14 tables** ;
  - index temporels **`(patient_id, ts)`** sur `cgm_readings`, `insulin_events`,
    `meal_events`, `activity_events` ;
  - contraintes d'**unicité audit** : `audit_logs.sequence`, `audit_logs.entry_hash` ;
  - clés étrangères critiques (`patients→users`, `clinician_profiles→users`,
    `recommendations→patients`, `cgm_readings→patients`).
- Commande : `cd backend && alembic upgrade head && python -m scripts.smoke_postgres`.

## 4. Exemples OpenAPI

`model_config["json_schema_extra"]` ajouté à :
- `PatientRegister`, `ClinicianRegister`, `LoginRequest`, `RefreshRequest`,
  `LogoutRequest` (`app/schemas/auth.py`) ;
- `ReviewRequest` (approve / reject — `app/schemas/recommendation.py`).

Les exemples apparaissent dans Swagger UI (`/docs`).

## 5. Politique de mot de passe

- **Règle minimale implémentée** (validation serveur, `422` sinon,
  `app/schemas/auth.py`) : **min 12 caractères**, ≥ 1 lettre, ≥ 1 chiffre,
  ≥ 1 caractère spécial.
- **Documentation** : `docs/security/PASSWORD_POLICY.md` (politique actuelle,
  limites, améliorations prévues : complexité avancée, dictionnaire, contrôle de
  fuite, verrouillage temporaire, MFA).
- Mot de passe de démonstration mis en conformité : **`DemoMediAI2026!`**
  (mise à jour seed + README + replit.md + rapports + comptes démo en base dev).

## 6. Concurrence audit

- **Verrou applicatif léger** : `audit_service.record()` sérialise le calcul de
  `sequence` + l'append sous un `threading.Lock` de module (`app/services/audit_service.py`).
- **Garantie dure conservée** : contraintes d'unicité DB `sequence` + `entry_hash`
  (au plus une insertion concurrente réussit — pas de fourche silencieuse).
- **Documentation** : `docs/security/AUDIT_CONCURRENCY.md` (risque de course,
  garde-fous, limite multi-processus, trous de séquence non bloquants car
  `verify_chain` valide par `prev_hash`, pistes : `pg_advisory_xact_lock` / Redis).

---

## Fichiers modifiés / ajoutés

**Ajoutés :**
- `backend/app/core/rate_limit.py`
- `backend/scripts/__init__.py`, `backend/scripts/smoke_postgres.py`
- `backend/tests/test_hardening.py`
- `docs/security/PASSWORD_POLICY.md`, `docs/security/AUDIT_CONCURRENCY.md`
- `docs/migration/AMENDEMENT_PHASE_0_1.md` (ce document)

**Modifiés :**
- `backend/app/core/config.py` (réglages rate limiting)
- `backend/app/main.py` (`/ready`)
- `backend/app/api/v1/auth.py` (dépendances rate limiting)
- `backend/app/schemas/auth.py` (politique mot de passe + exemples)
- `backend/app/schemas/recommendation.py` (exemples approve/reject)
- `backend/app/services/audit_service.py` (verrou applicatif)
- `backend/app/seed.py` (mot de passe démo conforme)
- `backend/tests/conftest.py` (reset limiter entre tests + mot de passe par défaut conforme)
- `backend/tests/test_auth.py` (mots de passe de test conformes)
- `backend/README.md`, `replit.md`, `docs/migration/RAPPORT_SOCLE_BACKEND.md` (doc / creds)

## Tests ajoutés (`backend/tests/test_hardening.py`)

- `test_ready_ok` — `/ready` → 200 `ready`
- `test_health_ok` — `/health` → 200 `ok`
- `test_login_rate_limited` — 6e tentative login → 429 + `Retry-After`
- `test_refresh_rate_limited` — 11e tentative refresh → 429
- `test_normal_login_not_blocked` — usage normal jamais bloqué

## Sortie pytest

```
32 passed, 5 warnings in ~8.6s
```

(27 tests Phase 0 + 5 tests Phase 0.1 ; SQLite jetable isolé ; les 5 warnings
sont des dépréciations Pydantic v2 `class Config` préexistantes, non bloquantes.)

## Confirmations

- **`/health`** : `200 {"status":"ok",...}` ✅
- **`/ready`** : `200 {"status":"ready"}` ✅ (renvoie `503` si DB injoignable)
- **Rate limiting** : login bloqué dès la 6e tentative (`429`) en vérification
  live ✅ ; comportement normal non bloqué ✅
- **Migrations PostgreSQL rejouables** : `smoke_postgres.py` exécuté sur la base
  PostgreSQL réelle issue d'`alembic upgrade head` → **toutes les vérifications
  OK** (14 tables, index temporels, unicité audit, FKs critiques) ✅

## Hors périmètre (rappel)

La Phase 1 (pipeline temporel, ingestion, feature engineering, anti-leakage,
TimescaleDB/fallback) n'est **pas** démarrée. Aucune donnée réelle, aucune
recommandation thérapeutique automatisée, open-loop strict maintenu.
