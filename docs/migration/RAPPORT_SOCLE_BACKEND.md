# Rapport — Socle Backend MediAI Care (Phase Fondation)

> **Statut :** livré et fonctionnel en environnement Replit (dev).
> **Périmètre :** option 2 du cahier des charges `PROMPT_RECADRE_MIGRATION` —
> construire d'abord la **fondation sécurité + base de données réelle**, avant la
> couche mobile (Expo) et la couche ML/XAI.
> **Posture :** prototype académique honnête, **open-loop strict**, **données
> simulées uniquement**, **non certifié**.

---

## 1. Ce qui est réellement implémenté (fonctionnel)

### Infrastructure & persistance
- **PostgreSQL réel** branché via `DATABASE_URL` (fourni par Replit), connexion
  normalisée en `postgresql+psycopg2://`.
- **SQLAlchemy 2** avec **types portables** (Uuid, JSON, DateTime avec timezone)
  — le même code tourne sur PostgreSQL (prod/dev) et SQLite (tests).
- **Alembic** configuré et branché sur le metadata des modèles : migration
  initiale générée et **appliquée** (toutes les tables créées dans la base de
  dev).
- **14 modèles** : Role, User, Patient, ClinicianProfile, Consent,
  RefreshToken, AuditLog, CgmReading, InsulinEvent, MealEvent, ActivityEvent,
  LabReport, Prediction, Recommendation. Tables de séries temporelles
  « Timescale-ready » avec index `(patient_id, ts)` et repli natif si
  TimescaleDB indisponible.

### Sécurité & authentification
- **Mots de passe argon2** (jamais stockés en clair).
- **Access token JWT** signé, courte durée (15 min, configurable).
- **Refresh token opaque** : valeur aléatoire dont **seul le hash SHA-256 est
  persisté** ; **rotation** systématique ; **détection de réutilisation** d'un
  token déjà tourné → révocation de toute la famille de sessions + entrée
  d'audit.
- **RBAC côté serveur** (`require_role`) : patient / clinician / admin. Les
  autorisations ne dépendent jamais du client.
- **En-têtes de sécurité** HTTP (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`) + CORS configurable.

### Traçabilité
- **Journal d'audit append-only chaîné** : chaque entrée porte un hash SHA-256
  calculé sur ses champs immuables + le hash de l'entrée précédente
  (`GENESIS_HASH` à l'origine). Endpoint `/verify` qui recalcule la chaîne et
  signale la première rupture. Événements tracés : register, login,
  refresh/rotation, réutilisation détectée, logout, lecture de dossiers,
  arbitrage de recommandations, seed.

### API & logique métier
- API REST versionnée `/api/v1` documentée automatiquement (`/docs`).
- Routers : `auth`, `patients`, `recommendations`, `audit-logs`.
- **Workflow open-loop strict** : une recommandation naît `pending` et ne passe
  à `approved`/`rejected` que par **décision explicite d'un clinicien**. Aucune
  transition automatique, aucune action thérapeutique exécutée par le système.
  Double arbitrage interdit (409).

### Qualité
- **27 tests pytest** verts, sur base SQLite isolée (jamais la base de dev) :
  modèles, auth (rotation/réutilisation/révocation/logout), RBAC,
  chaîne d'audit (croissance / vérification / détection d'altération),
  endpoints critiques, flux open-loop.
- **Test end-to-end** validé contre le serveur en marche avec les comptes démo.

---

## 2. Ce qui est simulé / placeholder (assumé)

- **Données patient** : 100 % synthétiques (`is_synthetic=True`). Le seed génère
  24 h de CGM simulé (96 points), une prédiction et une recommandation de
  démonstration.
- **Prédictions ML** : `model_name="placeholder"`, `model_version="0.0.0"`.
  Aucun vrai modèle entraîné — l'infrastructure de stockage des prédictions est
  prête, le modèle viendra dans une phase ultérieure.
- **XAI** : champ `rationale` (JSON) prévu mais non alimenté par une vraie
  méthode d'explicabilité.
- **Consentement** : modèle `Consent` versionné présent, mais le parcours UX de
  recueil n'est pas branché (phase mobile).

---

## 3. Reste à faire (phases ultérieures)

1. **Couche mobile (Expo)** : application patient/clinicien consommant cette API
   (aucune donnée santé stockée côté client).
2. **Couche ML/XAI réelle** : entraînement, versioning, méthode d'explicabilité,
   remplacement des placeholders.
3. **Sécurité renforcée** : chiffrement au repos applicatif des champs
   sensibles, rotation des secrets, rate-limiting, verrouillage de compte.
4. **Audit inviolable** : passage de la *détectabilité* actuelle à un ancrage
   WORM / horodatage externe pour une vraie non-répudiation.
5. **Conformité opérationnelle** : RGPD/loi 18-07 (registre, DPO, durées de
   conservation), parcours de consentement, hébergement de santé certifié.
6. **Synchronisation schéma dev → production** Replit (voir skill `database` /
   `post_merge_setup`).

---

## 4. Adaptations spécifiques à Replit (documentées)

- **Secrets** : `DATABASE_URL` et `JWT_SECRET_KEY` gérés via le système de
  secrets Replit (jamais committés).
- **Deux workflows coexistants** : l'app React existante reste sur le port 5000
  (« Start application ») ; le backend tourne sur le port 8000 (« Backend
  API », outputType console).
- **Base de dev** : PostgreSQL fourni par l'environnement (`heliumdb`). La base
  de production de déploiement est distincte et nécessitera l'application du
  schéma séparément.
- **TimescaleDB non garanti** : modèles conçus pour en bénéficier si présent,
  avec repli sur PostgreSQL natif sinon.

---

## 5. Comment vérifier

```bash
cd backend
alembic upgrade head        # schéma
python -m app.seed          # données démo simulées
python -m pytest -q         # 27 tests verts
# serveur déjà lancé par le workflow « Backend API » (port 8000)
curl -s localhost:8000/health
# → {"status":"ok",...}
```

Documentation interactive : `http://localhost:8000/docs`.
Comptes démo : `patient@demo.fr` / `clinicien@demo.fr` (mot de passe
`Demo1234!`).
