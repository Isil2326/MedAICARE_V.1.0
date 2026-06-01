# Phase 5 — Consolidation backend / API / sécurité / contrats

> Prototype académique **non certifié** · aide à la décision **open-loop** ·
> **données 100 % synthétiques** (`is_synthetic=True`). Mémoire de Master en
> informatique biomédicale.

## Objectif
Consolider le socle backend (Phases 0–4.1) **sans nouvelle fonctionnalité métier** :
durcissement de sécurité **mesuré**, documentation des contrats d'API, tests de bout en
bout, et **préparation** (non-implémentation) d'un futur client mobile. Cette phase prépare
une éventuelle Phase 6 mais **ne la démarre pas**.

## Non-négociables (tenus)
- **Pas de mobile** : aucun code Expo/React Native, aucun build mobile.
- **Pas de données réelles** : `is_synthetic=True` partout.
- **Pas de réentraînement ML** ni nouveau modèle ; **aucun changement de seuil**.
- **Open-loop strict** : probabilités + suggestions ; jamais de dose/décision/action automatique.
- **XAI = support affichage/audit** : `clinical_justification_allowed` jamais `true`.
- **Validation clinicien obligatoire** : toute recommandation naît `pending`.
- **Migrations additives et rejouables** (SQLite + PostgreSQL).
- **Tous les tests antérieurs restent verts** (158 → 172 avec les 14 nouveaux).

## Travaux réalisés

### 1. Durcissement sécurité (code)
- **Rate limiting des endpoints coûteux** : ajout d'un garde-fou (`rate_limiter`) sur
  `POST /ml/predict`, `POST /xai/explain`, `POST /recommendations/generate` (défaut
  60/60 s chacun, configurable via `config.py` / variables `RATE_LIMIT_*`). Le décorateur
  s'exécute **avant** l'authentification → `429` testable sans jeton. Réutilise l'infra
  existante (`app/core/rate_limit.py`, Redis-ready).
- **OpenAPI durci** (`app/main.py`) : `openapi_tags`, description enrichie (open-loop,
  données synthétiques, usage Bearer), `custom_openapi()` injectant le `securityScheme`
  **BearerAuth** et un champ d'information **`x-open-loop`**. Schémas critiques
  (Login/Predict/Explain/Generate) dotés d'exemples (`json_schema_extra`).
- **Déjà en place** (Phases antérieures, confirmé) : CORS par environnement (pas de `*`),
  en-têtes de sécurité (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`),
  `/ready` avec vérification DB (→ 503), rate-limit login/refresh, secret JWT obligatoire
  hors test, refresh hashé SHA-256 + rotation + détection de réutilisation.

### 2. Tests E2E + Phase 5
- `backend/tests/test_e2e_workflows.py` : parcours **patient**, **clinicien**, **sécurité**.
- `backend/tests/test_phase5.py` : OpenAPI durci, `/docs`, en-têtes, `/ready`, rate-limit
  `429` sur predict, absence de secrets dans l'audit, spoof `probability` → `422`, verrou
  safety XAI (`clinical_justification_allowed`).
- **172 tests verts** au total (158 antérieurs + 14). Exécution **par lots** (contrainte
  mémoire) via `scripts/run_test_batches.sh`.

### 3. Documentation des contrats
- `docs/api/API_V1_CONTRACTS.md` — cartographie complète (méthodes, rôles, ownership, erreurs, audit).
- `docs/api/ERROR_CATALOG.md` — catalogue des erreurs + format actuel + proposition d'enveloppe.
- `docs/security/RBAC_MATRIX.md`, `docs/security/AUDIT_COVERAGE.md`.
- `docs/ops/PERFORMANCE_NOTES.md`, `TEST_STRATEGY.md`, `VALIDATION_COMMANDS.md`.
- `docs/compliance/COMPLIANCE_SCOPE.md`, `SYNTHETIC_DATA_POLICY.md`.

### 4. Préparation mobile (sans implémentation)
- `docs/mobile/MOBILE_API_CONTRACTS.md` — ce qui rend l'API « mobile-ready », parcours
  types, contraintes à respecter, hors-scope explicite (aucun code mobile).

### 5. Outillage
- `backend/scripts/run_test_batches.sh` — exécution par lots (anti-OOM).
- `backend/scripts/validate_backend.py` — smoke contractuel sans serveur (OpenAPI/Bearer/
  open-loop, endpoints clés, `/health`, `/ready`, verrou XAI).

## Décisions de conception
- **Enveloppe d'erreur uniforme `{"error":{code,message,details}}` : NON implémentée.**
  L'introduire réécrirait le format `{"detail": ...}` (défaut FastAPI) sur lequel reposent
  les 158 tests et les contrats clients. La spécification autorisant « proposer **ou**
  implémenter », elle est **proposée** comme évolution Phase 6+ (`docs/api/ERROR_CATALOG.md`).
- **Rate limit par IP** (infra existante, généreux, configurable). Limite connue :
  l'idéal serait par-utilisateur derrière un proxy de confiance — documenté.
- **Pas de gestionnaire d'exception global** ajouté : le format d'erreur reste le défaut
  FastAPI, documenté tel quel.

## Migrations
**Aucune migration de schéma** n'est introduite en Phase 5 (consolidation : code, docs,
tests, OpenAPI). Les migrations antérieures restent additives et rejouables.

## Reste à faire / Phase 6 (NON démarrée)
- Éventuelle implémentation d'un client mobile (hors périmètre actuel).
- Enveloppe d'erreur uniforme + versionnement de schéma (si poursuite).
- Rate limit par-utilisateur, warm-up des artefacts, pagination par curseur.

**Phase 6 ne doit pas démarrer sans validation explicite du superviseur.**
