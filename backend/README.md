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
| Patient | `patient@demo.fr` | `Demo1234!` |
| Clinicien | `clinicien@demo.fr` | `Demo1234!` |

### Points d'entrée utiles

- `GET /health` — état du service
- `GET /docs` — documentation OpenAPI interactive (Swagger UI)
- `GET /` — bannière + disclaimer

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
