# MediAI Care — Stratégie de test (backend)

> Prototype non certifié · open-loop · données synthétiques. Phase 5.

## Principes
- **Isolation** : suite exécutée sur **SQLite en mémoire** (types portables SQLAlchemy), `APP_ENV=test`.
- **Déterminisme** : graines fixes (ML/XAI), `_reset_rate_limiter` autouse entre tests.
- **Aucune métrique inventée** : un résultat non calculable est `null`, jamais fabriqué.
- **Non-régression** : tout changement doit garder **toutes** les suites antérieures vertes.

## Total : 172 tests verts (158 antérieurs + 14 Phase 5)

| Suite | Portée |
|---|---|
| `test_auth.py` | Inscription, login/refresh, rotation, reuse-detection, logout |
| `test_models.py` | Modèles SQLAlchemy, contraintes |
| `test_endpoints.py` | Endpoints patients/meta |
| `test_rbac.py` | Rôles + ownership (403/404 deny-by-default) |
| `test_audit.py` | Chaînage SHA-256, vérification, pas de secrets |
| `test_features.py` | Feature engineering pur, anti-futur |
| `test_antileakage.py` | Splits temporels, 0 chevauchement |
| `test_timeseries.py` / `test_timeseries_schemas.py` | Ingestion idempotente, RBAC, schémas |
| `test_ml_unit.py` / `test_ml_pipeline.py` | Modèles, éval, calibration, registry, predict |
| `test_xai.py` | SHAP/LIME/EBM, fallback occlusion, fiabilité, endpoints |
| `test_recommendations_engine.py` | Règles, safety, workflow, source-of-truth, verrou XAI |
| `test_e2e_workflows.py` *(Phase 5)* | Parcours patient, clinicien, sécurité de bout en bout |
| `test_phase5.py` *(Phase 5)* | OpenAPI durci, `/docs`, headers, `/ready`, rate-limit 429, no-secrets, spoof 422, verrou XAI safety |

## Exécution par lots (contrainte mémoire)
Trois workflows tournent en parallèle dans l'environnement de dev → risque OOM si toute
la suite tourne d'un bloc. Exécuter **par lots** (voir `backend/scripts/run_test_batches.sh`).

## Commandes
- Suite ciblée : `cd backend && APP_ENV=test python -m pytest tests/<fichier>.py -q`
- Par lots : `cd backend && bash scripts/run_test_batches.sh`
- Smoke contractuel : `cd backend && APP_ENV=test python scripts/validate_backend.py`
