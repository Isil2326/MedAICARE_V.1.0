# MediAI Care — Commandes de validation (backend)

> Prototype non certifié · open-loop · données synthétiques. Phase 5.
> À exécuter depuis `backend/` sauf indication contraire.

## 1. Initialisation
```bash
cd backend
alembic upgrade head        # applique toutes les migrations (additives, rejouables)
python -m app.seed          # données synthétiques idempotentes (is_synthetic=True)
```

## 2. Lancement
```bash
# workflow « Backend API » :
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Santé : `curl -s http://localhost:8000/health`
- Disponibilité (DB) : `curl -s http://localhost:8000/ready`  (503 si DB injoignable)
- Contrats : `curl -s http://localhost:8000/openapi.json | head` · UI : `/docs`

## 3. Tests
```bash
# Par lots (recommandé — contrainte mémoire) :
cd backend && bash scripts/run_test_batches.sh

# Suite unique :
cd backend && APP_ENV=test python -m pytest tests/test_phase5.py -q
```

## 4. Smoke contractuel (sans serveur)
```bash
cd backend && APP_ENV=test python scripts/validate_backend.py
```
Vérifie : OpenAPI exposé (BearerAuth + marqueur open-loop), endpoints clés présents,
`/health` et `/ready` répondent, invariant XAI `clinical_justification_allowed=false`.

## 5. Vérifications d'intégrité (avec serveur + jeton clinicien)
```bash
# Chaîne d'audit :
curl -s -H "Authorization: Bearer <ACCESS>" http://localhost:8000/api/v1/audit-logs/verify
```

## Migrations — note Phase 5
Toutes les migrations sont **additives et rejouables** (SQLite + PostgreSQL). Aucune
migration destructive. `alembic upgrade head` est idempotent sur une base déjà à jour.
