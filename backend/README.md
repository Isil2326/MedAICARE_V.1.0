# MediAI Care — Socle Backend (FastAPI + PostgreSQL)

> **Prototype académique — non certifié.** Système d'aide à la décision
> **OPEN-LOOP** pour le suivi du diabète. Aucune action thérapeutique
> automatique. **Données simulées uniquement** (`is_synthetic=True`). Aucune
> donnée de santé réelle, aucune certification MDR / IEC 62304 / ISO 13485 / HDS.

Ce backend constitue la **fondation sécurité + base de données réelle** de la
migration (option 2 du cahier des charges `PROMPT_RECADRE_MIGRATION`), à
construire **avant** la couche mobile Expo et la couche ML/XAI.

## Stack

- **FastAPI** (API REST versionnée `/api/v1`)
- **PostgreSQL** (fourni par Replit via `DATABASE_URL`)
- **SQLAlchemy 2** (ORM, types portables Uuid/JSON/DateTime tz)
- **Alembic** (migrations de schéma)
- **JWT** (access token court 15 min) + **refresh token opaque** (rotation +
  détection de réutilisation), mots de passe hachés **argon2**
- **RBAC serveur** (rôles `patient` / `clinician` / `admin`)
- **Journal d'audit append-only chaîné** (hash SHA-256 par entrée)

## Arborescence

```
backend/
├── app/
│   ├── core/          config, database, security (argon2 + JWT)
│   ├── models/        14 modèles SQLAlchemy (types portables)
│   ├── schemas/       schémas Pydantic (I/O API)
│   ├── repositories/  accès données isolé
│   ├── services/      auth, audit (chaîne), recommandations (open-loop)
│   ├── api/v1/        routers auth / patients / recommendations / audit
│   ├── main.py        app FastAPI (CORS, headers sécurité, /health)
│   └── seed.py        seed idempotent (rôles + comptes + données simulées)
├── alembic/           migrations
├── tests/             pytest (SQLite isolé)
├── requirements.txt
└── .env.example
```

## Variables d'environnement

Sur Replit, `DATABASE_URL` et `JWT_SECRET_KEY` sont déjà fournis comme secrets.
Voir `.env.example` pour la liste complète :

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | (fourni par Replit) |
| `JWT_SECRET_KEY` | Signature des access tokens | (secret) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée access token | 15 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Durée refresh token | 7 |
| `APP_ENV` | `development` / `test` / `production` | development |

## Exécution

Le workflow **« Backend API »** lance le serveur sur le port **8000** :

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Première initialisation

```bash
cd backend
alembic upgrade head     # crée le schéma dans PostgreSQL
python -m app.seed       # rôles + comptes démo + données simulées
```

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Patient | `patient@demo.fr` | `DemoMediAI2026!` |
| Clinicien | `clinicien@demo.fr` | `DemoMediAI2026!` |

### Points d'entrée utiles

- `GET /health` — état du service (liveness)
- `GET /ready` — readiness : DB joignable + table critique accessible (`200 ready` / `503 not ready`)
- `GET /docs` — documentation OpenAPI interactive (Swagger UI), avec exemples de payloads
- `GET /` — bannière + disclaimer

### Smoke test PostgreSQL (schéma réel)

Les tests unitaires tournent sur SQLite jetable. Pour vérifier le schéma sur la
base **PostgreSQL réelle** (tables, index temporels `(patient_id, ts)`,
contraintes d'unicité audit) après migration :

```bash
cd backend
alembic upgrade head
python -m scripts.smoke_postgres
```

## Migrations (Alembic)

```bash
cd backend
alembic revision --autogenerate -m "description"   # générer
alembic upgrade head                               # appliquer
alembic downgrade -1                               # revenir en arrière
```

> **Note Replit / production :** en dev, Alembic gère le schéma de la base
> PostgreSQL de l'environnement. En production (déploiement Replit), la base est
> distincte ; le schéma doit y être appliqué séparément (voir la skill
> `database` / `post_merge_setup` du dépôt pour la procédure de synchronisation
> dev → prod).

## Tests

```bash
cd backend && python -m pytest -q
```

Les tests tournent sur une base **SQLite jetable** (jamais la base PostgreSQL de
dev), ce qui garantit isolation et reproductibilité. Couverture : modèles,
authentification (rotation/réutilisation/révocation), RBAC, chaîne d'audit
(croissance, vérification, détection d'altération), endpoints critiques et flux
open-loop d'approbation/rejet.

## Endpoints API (v1)

### Authentification (`/api/v1/auth`)
- `POST /register/patient` — création compte patient + profil
- `POST /register/clinician` — création compte clinicien + profil
- `POST /login` — renvoie `{access_token, refresh_token}`
- `POST /refresh` — rotation du refresh token (révoque l'ancien)
- `POST /logout` — révoque le refresh token (auth requise)
- `GET /me` — utilisateur courant

### Patients (`/api/v1/patients`)
- `GET ` — liste (clinicien/admin uniquement)
- `GET /me` — dossier du patient connecté
- `GET /{id}` — dossier (patient : le sien seul ; clinicien/admin : tous)

### Recommandations (`/api/v1/recommendations`) — **open-loop**
- `GET ` — liste filtrable par statut (clinicien/admin)
- `POST /{id}/approve` — validation clinicien (pending → approved)
- `POST /{id}/reject` — rejet clinicien (pending → rejected)

### Séries temporelles (`/api/v1/timeseries`) — **Phase 1, simulé**
Ingestion/lecture des événements IoMT simulés (`is_synthetic=True`). Validation
stricte des timestamps (tz-aware, UTC, anti-futur) et bornes physiologiques.
- `POST /cgm` · `GET /cgm` — glycémie CGM (mg/dL)
- `POST /insulin` · `GET /insulin` — doses d'insuline (U)
- `POST /meals` · `GET /meals` — repas (glucides g)
- `POST /activity` · `GET /activity` — activité physique (min)
- `GET /events` — vue consolidée multi-types
- **RBAC/ownership** : patient écrit/lit le sien ; clinicien/admin lit avec
  `patient_id` explicite. Écritures auditées. **201** créé / **200** doublon
  idempotent. Détails : `docs/migration/PHASE_1_DATA_ENGINEERING.md`.

### ML — Risque glycémique (`/api/v1/ml`) — **Phase 2, simulé, open-loop**
Inférence **open-loop stricte** : renvoie une **probabilité** de risque (`hypo`/`hyper`)
aux horizons **30/60 min**, jamais de décision/dose. Données simulées
(`is_synthetic=True`), anti-leakage strict, aucune métrique inventée.
- `POST /predict` — body : `target` (`hypo`/`hyper`), `horizon_min` (30/60),
  `patient_id` (requis clinicien/admin ; ignoré pour un patient → son dossier),
  `at` (optionnel), `persist` (optionnel). Réponse : `probability` (ou `null` +
  `reason` si **non calculable**), `risk_label`, `calibrated`, `open_loop_notice`.
- **RBAC/ownership** comme les séries temporelles ; horizon hors {30,60} → **400** ;
  non authentifié → **401**. **Audit systématique** (`ml.predict`). `persist=true`
  écrit dans `predictions` (`is_synthetic=True`).
- **CLI** : `python -m app.ml.build_dataset` · `python -m app.ml.train
  [--target --horizon]` · `python -m app.ml.evaluate`. Artefacts sous
  `backend/artifacts/` (gitignorés, régénérables). Détails :
  `docs/migration/PHASE_2_MODELISATION_ML.md` + `RAPPORT_PHASE_2.md`.
- **Phase 2.1 (benchmark synthétique v2)** : seed v2 (10 profils, 14 j, CGM 5 min,
  épisodes hypo/hyper quotidiens) rendant les **4 couples évaluables** sur le test ;
  registre `evaluation_status` + **activation conditionnelle** (actif seulement si test
  bi-classe) ; **bootstrap** d'incertitude (IC95, 200 reps). `DATASET_VERSION=1.1.0`,
  migration `d4e5f6a7b8c9`. Détails :
  `docs/migration/AMENDEMENT_PHASE_2_1_BENCHMARK_SYNTHETIQUE.md`.

### XAI — Explicabilité (`/api/v1/xai`) — **Phase 3 + 3.1, simulé, open-loop**
Explications **open-loop strictes** (contributions de features = pondération du modèle,
**PAS** causalité). Données synthétiques. SHAP/LIME/EBM natif + repli occlusion documenté.
- `POST /explain` — explication **locale** d'une prédiction (patient/clinicien). RBAC +
  ownership identiques à `ml.predict` ; horizon hors {30,60} → **400** ; non authentifié →
  **401**. Audit `xai.explain`. `persist=true` → table `xai_explanations`
  (`is_synthetic=True`).
- `GET /global` — importance **globale** d'un couple actif (réservé clinicien/admin).
- **Phase 3.1 — sécurisation sémantique (jamais masquée).** Chaque réponse expose
  `xai_reliability_status` (`reliable_for_model_debug` / `caution_semantic_limits` /
  `not_reliable_for_clinical_interpretation`), `xai_warnings[]`, `semantic_limitations[]`,
  `calibration_notice`, `synthetic_data_notice` ; le global ajoute `direction_semantics` +
  `evaluation` (métriques réelles ou `null`). Directions globales **qualifiées** (EBM →
  `not_globalizable` ; SHAP → `aggregated_signed_effect`), jamais « augmente/diminue » brut.
  Cas **hypo 30** (congruence physio = 0.000) marqué `not_reliable_for_clinical_interpretation`
  (métrique **non corrigée**). Garde-fou : **« XAI is display/support only, not a decision
  engine. »** Migration additive `f6a7b8c9d0e1`.
- **CLI** : `python -m app.xai.generate_global` · `python -m app.xai.evaluate`. Détails :
  `docs/migration/PHASE_3_XAI_CLINIQUE.md`, `RAPPORT_PHASE_3.md`,
  `AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md`.

### Audit (`/api/v1/audit-logs`)
- `GET ` — consultation du journal (clinicien/admin)
- `GET /verify` — vérification de l'intégrité de la chaîne

## Posture de sécurité (honnête)

- **Mots de passe** : argon2 (jamais en clair).
- **Access token** : JWT signé, courte durée (15 min).
- **Refresh token** : valeur opaque aléatoire, **seul son hash SHA-256 est
  stocké** ; rotation à chaque usage ; la réutilisation d'un token déjà tourné
  déclenche la révocation de toute la famille de sessions (signal de
  compromission) et une entrée d'audit.
- **Rate limiting** : `POST /login` et `POST /refresh` sont limités par IP
  (fenêtre glissante en mémoire ; défauts 5/60 s et 10/60 s, configurables via
  `RATE_LIMIT_*`). Au-delà : `429 Too Many Requests` + en-tête `Retry-After`.
  Redis-ready (voir `app/core/rate_limit.py`) pour un déploiement multi-instances.
- **Politique mot de passe** : min 12 caractères + lettre + chiffre + caractère
  spécial (validation serveur, `422` sinon). Détail et limites :
  `docs/security/PASSWORD_POLICY.md`.
- **Concurrence audit** : verrou applicatif léger + contraintes d'unicité DB
  (`sequence`, `entry_hash`). Détail et limites : `docs/security/AUDIT_CONCURRENCY.md`.
- **RBAC côté serveur** : les autorisations ne dépendent jamais du client.
- **Audit append-only chaîné** : chaque entrée référence le hash de la
  précédente. Toute altération devient **détectable** via `/verify`. ⚠️ Il
  s'agit de **détectabilité**, pas d'immutabilité cryptographique forte : un
  attaquant disposant d'un accès en écriture total pourrait recalculer toute la
  chaîne. Une vraie inviolabilité nécessiterait un stockage WORM / ancrage
  externe (hors périmètre de ce prototype).
- **En-têtes de sécurité** : `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`.

## Limites assumées

Voir `docs/migration/PHASE_0_INITIALISATION.md` et `MedAICare_V.3_10Patients/LIMITATIONS.md`.
Ce socle ne traite volontairement pas : ML/XAI réels (placeholders uniquement),
mobile Expo, chiffrement au repos applicatif, conformité réglementaire
opérationnelle. Ce sont des phases ultérieures.
