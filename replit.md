# MediAI Care — document de pilotage

## Projet
**MediAI Care** (v1.0.0-prototype) — dashboard médical et système d'aide à la décision
pour le suivi de patients diabétiques (mémoire de Master en Informatique Biomédicale,
IoMT + XAI). Trois couches : app web React (`MedAICare_V.3_10Patients/`), socle backend
FastAPI (`backend/`), app mobile Expo (`mobile/`).

## Posture (non-négociables — toujours valables)
- **Prototype académique NON certifié** — pas destiné à un usage clinique (aucune
  certification MDR, IEC 62304, ISO 13485, HDS, RGPD opérationnel).
- **Données 100 % synthétiques uniquement** (`is_synthetic=True`, bannières visibles).
- **Open-loop strict** — aucune dose, aucune décision/action automatique.
- **XAI = support d'affichage/audit uniquement** (jamais une justification clinique ;
  `clinical_justification_allowed` jamais `true` ; XAI ≠ causalité).
- **API backend = source de vérité** — aucun calcul de risque/reco côté client/mobile.
- **Jetons mobiles jamais dans AsyncStorage/localStorage** (SecureStore en natif,
  mémoire volatile sur web ; jamais loggés ; logout/refresh échoué efface).
- Voir limites complètes : `MedAICare_V.3_10Patients/LIMITATIONS.md`.

## Stack
- **Web :** React 19 · TypeScript · Vite 7 · Tailwind 4 · Recharts · Framer Motion (port 5000).
- **Backend :** FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL (réel) · JWT (access court +
  refresh opaque rotation/reuse-detection) · argon2 · RBAC serveur · audit chaîné SHA-256 ·
  ML (LogReg/RF/XGBoost/EBM) · XAI (SHAP/LIME/EBM natif) (port 8000).
- **Mobile :** Expo · React Native · TypeScript · Expo Router · TanStack Query ·
  expo-secure-store (port 5173, Expo Web en preview).

## État actuel des phases
| Phase | Sujet | Statut |
|------|-------|--------|
| 0 | Initialisation socle backend | **validée** |
| 0.1 | Amendement initialisation | **validée** |
| 1 | Data engineering & pipeline temporel | **validée** |
| 2 | Modélisation IA/ML | **livré, à valider** |
| 2.1 | Remédiation benchmark synthétique | **livré, à valider** |
| 3 | XAI clinique | **livré, à valider** |
| 3.1 | Sécurisation sémantique XAI | **livré, à valider** |
| 4 | Moteur de recommandation open-loop | **livré, à valider** |
| 4.1 | Verrouillage sémantique & source-of-truth | **livré, à valider** |
| 5 | Consolidation backend/API/sécurité/contrats | **livré, à valider** |
| 6 | Application mobile Expo + intégration API | **livré, à valider** |
| 7 | — | **NON démarrée — attente validation superviseur** |

> Les statuts « livré, à valider » reflètent l'attente de validation du superviseur.
> Mettre à jour cette colonne au fil des validations réelles.

## Commandes essentielles
```bash
# Backend
cd backend && alembic upgrade head          # migrations
cd backend && python -m app.seed            # seed synthétique
cd backend && bash scripts/run_test_batches.sh   # tests par lots (anti-OOM)
cd backend && python scripts/validate_backend.py  # smoke contractuel (sans serveur)

# Mobile
cd mobile && npm install                     # install
cd mobile && npx tsc --noEmit                # typecheck (rc=0 attendu)
cd mobile && npx jest --ci --runInBand       # tests (7 suites / 29 verts)

# Lancement (workflows Replit)
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000   # « Backend API »
cd mobile && npx expo start --web --port 5173                   # « Mobile App »
cd MedAICare_V.3_10Patients && npm run dev                      # « Start application » (web, 5000)
```

## Workflows Replit
- **Backend API** — FastAPI/uvicorn, port 8000, injecte `CORS_ORIGINS` (autorise l'origine 5173).
- **Mobile App** — Expo Web, port 5173, `EXPO_PUBLIC_API_BASE_URL` pointant le backend.
- **Start application** — app React/Vite, port 5000 (déploiement site statique, `dist/`).

## Attention Replit
- **Tests backend lourds** → exécuter **par lots** (`scripts/run_test_batches.sh`) pour
  éviter l'OOM (3 workflows + dépendances ML).
- **Mobile = Expo Web uniquement** en preview : device/QR, builds EAS, caméra, push
  natifs, Keychain/Keystore réel et capture d'écran Expo automatisée **indisponibles**.
- Jetons mobiles sur **web** = mémoire volatile (perdus au refresh, plus strict que
  localStorage) ; SecureStore réel seulement sur device.
- **CORS** piloté par env (`CORS_ORIGINS`) côté backend ; l'origine du preview mobile
  (5173) doit y figurer.
- **Variables d'environnement / secrets** : gérées via l'outillage Replit (jamais en
  clair dans le code) ; mobile lit `EXPO_PUBLIC_API_BASE_URL`.

## Documents de référence
**Rapports & migration** (`docs/migration/`)
- Socle : `RAPPORT_SOCLE_BACKEND.md` · `PHASE_0_INITIALISATION.md` ·
  `AMENDEMENT_PHASE_0_1.md` · `RAPPORT_VALIDATION_PHASE_0.md`
- Phase 1 : `PHASE_1_DATA_ENGINEERING.md` · `RAPPORT_PHASE_1.md`
- Phase 2 : `PHASE_2_MODELISATION_ML.md` · `RAPPORT_PHASE_2.md`
- Phase 2.1 : `AMENDEMENT_PHASE_2_1_BENCHMARK_SYNTHETIQUE.md`
- Phase 3 : `PHASE_3_XAI_CLINIQUE.md` · `RAPPORT_PHASE_3.md`
- Phase 3.1 : `AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md`
- Phase 4 : `PHASE_4_RECOMMENDATION_ENGINE.md` · `RAPPORT_PHASE_4.md`
- Phase 4.1 : `AMENDEMENT_PHASE_4_1_VERROUILLAGE_RECOMMANDATION.md`
- Phase 5 : `PHASE_5_CONSOLIDATION.md` · `RAPPORT_PHASE_5.md`
- Phase 6 : `RAPPORT_PHASE_6.md`

**API** (`docs/api/`) — `API_V1_CONTRACTS.md` · `ERROR_CATALOG.md`
**Sécurité** (`docs/security/`) — `RBAC_MATRIX.md` · `AUDIT_COVERAGE.md` ·
`AUDIT_CONCURRENCY.md` · `PASSWORD_POLICY.md`
**Ops** (`docs/ops/`) — `PERFORMANCE_NOTES.md` · `TEST_STRATEGY.md` · `VALIDATION_COMMANDS.md`
**Mobile** (`docs/mobile/`) — `PHASE_6_MOBILE_APP.md` · `MOBILE_API_CONTRACTS.md`
**Conformité** (`docs/compliance/`) — `COMPLIANCE_SCOPE.md` · `SYNTHETIC_DATA_POLICY.md`
**Frontend web** (`docs/frontend/`) — `REACT_APP_ARCHITECTURE.md` (clinicien v6.0,
design system, features web)
**Backend** — `backend/README.md` · **Mobile** — `mobile/README.md`

## Limites connues
- Prototype non certifié, données synthétiques uniquement (cf. posture + `LIMITATIONS.md`).
- Scores ML élevés = benchmark synthétique séparable (cohérence pipeline, **non
  transférable au clinique**).
- Rate-limit backend **par IP** (idéal par-utilisateur derrière proxy — documenté).
- Enveloppe d'erreur uniforme `{"error":{...}}` **proposée, non implémentée** (préserve
  le format `{"detail"}` FastAPI + tests existants).
- Mobile : limites Expo Web sur Replit (cf. « Attention Replit »).
- Journal de décision web = `localStorage` non-autoritaire (démo, pas un dossier source).

## Prochaine phase attendue
**Phase 7 — NON démarrée.** Ne pas la démarrer sans validation explicite du superviseur.
Pistes proposées (open-loop, synthétiques, sans changement ML/XAI) : durcissement device
réel (EAS, Keychain/Keystore, audit lecteur d'écran), graphiques séries temporelles
mobiles (lecture seule), parcours d'évaluation clinicien A/B porté sur mobile.
