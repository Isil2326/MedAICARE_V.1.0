# Matrice de traçabilité — MediAI Care

> **Phase 7.** Exigence → Implémentation → Test → Document → Limite. Prototype non
> certifié · synthétique · open-loop · XAI support-only.

| # | Exigence | Implémentation (où) | Test (preuve) | Document | Limite |
|---|---|---|---|---|---|
| 1 | **Open-loop strict** (aucune dose/décision auto) | recos créées `pending` ; safety anti-dose (`recommendations/`) ; ML = probabilités seules | `test_recommendations_engine.py`, `test_phase5.py` (verrou XAI/safety) ; mobile `components.test` (rappel open-loop) | `PHASE_4_RECOMMENDATION_ENGINE.md`, `FINAL_ARCHITECTURE.md` §7 | Seuils synthétiques NON cliniques |
| 2 | **Synthetic-only** | `is_synthetic=True` forcé à l'ingestion/persistance ; seed synthétique | `test_timeseries.py`, `test_ml_pipeline.py` ; smoke `validate_backend.py` | `compliance/SYNTHETIC_DATA_POLICY.md` | Aucune donnée réelle introduite |
| 3 | **RBAC** (rôle + ownership) | dépendances FastAPI (`resolve_read_scope`, gardes endpoints) ; mobile gardes de groupe | `test_rbac.py`, `test_e2e_workflows.py` ; mobile `recommendations.rbac.test.ts` | `security/RBAC_MATRIX.md` | Autorité = serveur (mobile non autoritaire) |
| 4 | **Audit** append-only chaîné | `audit_service.py`, `models/audit.py` (sequence+prev_hash+entry_hash) | `test_audit.py` (incl. `verify_chain`) | `security/AUDIT_COVERAGE.md`, `security/AUDIT_CONCURRENCY.md` | Journal web (app React) non-autoritaire (démo) |
| 5 | **Refresh rotation + reuse detection** | `auth_service.py` (rotation, TokenFamily, révocation) ; refresh hashé | `test_auth.py`, `test_hardening.py` ; mobile `client.test.ts` (refresh 401) | `security/PASSWORD_POLICY.md`, `MOBILE_SECURITY_REVIEW.md` | Rate-limit par IP |
| 6 | **Anti-leakage** (split temporel) | `ml/splits.py` (`temporal_split`, `_advance_to_boundary`, `assert_no_timestamp_overlap`) | `test_antileakage.py`, `test_ml_pipeline.py` | `PHASE_1_DATA_ENGINEERING.md`, `PHASE_2_MODELISATION_ML.md` | — |
| 7 | **ML metrics** (réelles ou « non calculable ») | `ml/evaluation.py` (AUROC/AUPRC/F1/Brier/ECE… ; classe absente→null) ; bootstrap IC95 | `test_ml_unit.py`, `test_ml_pipeline.py` | `RAPPORT_PHASE_2.md`, `AMENDEMENT_PHASE_2_1_BENCHMARK_SYNTHETIQUE.md` | Benchmark séparable, non transférable clinique |
| 8 | **XAI warnings / fiabilité** | `xai/reliability.py` (status + warnings + limites) ; `translation.py` (termes interdits) | `test_xai.py` | `PHASE_3_XAI_CLINIQUE.md`, `AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md` | XAI ≠ causalité ; explique modèle non calibré |
| 9 | **Recommendation safety** | `recommendations/safety.py` (FORBIDDEN_TERMS + regex dose) ; revalidation sur `modify` | `test_recommendations_engine.py`, `test_phase5.py` | `PHASE_4_RECOMMENDATION_ENGINE.md`, `AMENDEMENT_PHASE_4_1_VERROUILLAGE_RECOMMANDATION.md` | `clinical_justification_allowed` jamais true |
| 10 | **Mobile token security** | `services/secureStore.ts` (SecureStore natif / mémoire web) ; pas d'AsyncStorage ; logout/refresh effacent | mobile `secureStore.native/web.test.ts`, `auth.service.test.ts`, `no-token-leak.test.ts` | `MOBILE_SECURITY_REVIEW.md`, `docs/mobile/PHASE_6_MOBILE_APP.md` | Web = session volatile (par choix) |
| 11 | **Accessibility** | `theme.ts` (`MIN_TOUCH_TARGET=44`) ; `accessibilityRole/State` ; non-couleur-seule (badges, XAI) | mobile `components.test.tsx` (rendu bannières/XAI) | `qa/ACCESSIBILITY_REVIEW.md`, `mobile/README.md` | VoiceOver/TalkBack non testés (Expo Web) |
| 12 | **API source-of-truth** | mobile n'a aucun moteur ML/XAI/reco ; tout vient de l'API | mobile `recommendations.rbac.test.ts`, `client.test.ts` | `docs/mobile/MOBILE_API_CONTRACTS.md`, `API_V1_CONTRACTS.md` | — |
| 13 | **Probabilité verrouillée (anti-spoof)** | `GenerateRequest extra="forbid"` ; lecture prédiction synthétique en base | `test_phase5.py` (spoof 422) | `AMENDEMENT_PHASE_4_1_VERROUILLAGE_RECOMMANDATION.md` | — |
| 14 | **Durcissement API** | rate-limit endpoints coûteux ; headers ; `/ready`→503 ; CORS env | `test_hardening.py`, `test_phase5.py` | `PHASE_5_CONSOLIDATION.md`, `ops/PERFORMANCE_NOTES.md` | Enveloppe d'erreur uniforme non implémentée |

## Couverture de test (résumé)
- **Backend** : 172 tests (16 fichiers) — exécution par lots (`scripts/run_test_batches.sh`)
  + smoke contractuel (`scripts/validate_backend.py`, vert).
- **Mobile** : 7 suites / 29 tests (`npx jest --ci --runInBand`) + `npx tsc --noEmit` (rc=0).

Détail commandes & stratégie : `docs/ops/TEST_STRATEGY.md`,
`docs/ops/VALIDATION_COMMANDS.md`.
