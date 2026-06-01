# MediAI Care - Medical Dashboard

## Overview
MediAI Care (v1.0.0-prototype) is a specialized medical dashboard and decision-support system for managing diabetic patients. It is a Master's Thesis project in Biomedical Informatics integrating IoMT data with Explainable AI (XAI) to provide therapeutic recommendations. **Status: academic prototype — not destined for clinical use. No regulatory certification (MDR, IEC 62304, ISO 13485, HDS, operational GDPR).** See `MedAICare_V.3_10Patients/LIMITATIONS.md` for the full scope of intentional limits.

## Backend Foundation (migration option 2 — `backend/`)
Socle backend **FastAPI + PostgreSQL réel** construit en priorité (sécurité + base de données réelle) avant la couche mobile et ML/XAI. **Open-loop strict, données simulées uniquement (`is_synthetic=True`), non certifié.** Runs sur le port **8000** (workflow « Backend API »), séparé de l'app React (port 5000).
- **Stack :** FastAPI · SQLAlchemy 2 (types portables) · Alembic · JWT access court + refresh opaque (rotation atomique + détection de réutilisation) · argon2 · RBAC serveur · audit append-only chaîné (SHA-256, contraintes d'unicité anti-fork).
- **Init :** `cd backend && alembic upgrade head && python -m app.seed` · **Tests :** `cd backend && python -m pytest -q` (SQLite isolé).
- **Docs :** `backend/README.md` (exécution/API) · `docs/migration/RAPPORT_SOCLE_BACKEND.md` (implémenté/simulé/reste-à-faire) · `docs/migration/PHASE_0_INITIALISATION.md` (architecture).

### Phase 2 — Modélisation IA/ML (livré, à valider)
Couche prédictive **open-loop stricte** (probabilités uniquement, AUCUNE décision/dose), **données simulées** (`is_synthetic=True`), anti-leakage strict, **aucune métrique inventée** (calcul réel ou « non calculable »). Cibles `hypo`(<70)/`hyper`(>180), horizons **30/60 min**, fenêtre future `(T, T+h]`, split **temporel** 0.6/0.2/0.2 **aligné sur les frontières de timestamps** (`_advance_to_boundary` + `assert_no_timestamp_overlap` : 0 chevauchement train/val/test vérifié), sélection sur val, éval unique sur test, **18 features** réutilisant `feature_engineering` (Phase 1, pures). Package `backend/app/ml/` : config·schemas·labels·features_adapter·splits·models (règles expertes/LogReg/RF/XGBoost/**EBM**)·evaluation (AUROC/AUPRC/prec/rappel/F1/spéc/sens/Brier/ECE/confusion, classe absente→`null`)·calibration (Platt/Isotonic conditionnelle)·tuning (**Optuna indispo → grille fixe**)·dataset_builder·registry (table additive `model_registry`, migrations `b2c3d4e5f6a7`+`c3d4e5f6a7b8` ; colonnes lifecycle `status` active/candidate/archived, `dataset_version`/`features_version`/`synthetic_only` ; **index unique partiel** garantissant **un seul actif par `(target,horizon)`** en base ; JSON canonique miroir)·training·inference_service + CLI `build_dataset`/`train`/`evaluate`. **Endpoint `POST /api/v1/ml/predict`** : RBAC+ownership (patient=son dossier, clinicien/admin=`patient_id` requis), horizon validé (400), **audit systématique**, `persist` optionnel→`predictions` (`is_synthetic=True`), `open_loop_notice` explicite. **92 tests verts** (66 Phase 1 + 26 Phase 2). Artefacts sous `backend/artifacts/` (**gitignorés**, régénérables). Note tz : timestamps normalisés UTC tz-aware au chargement (SQLite naïf/PG aware). Docs : `docs/migration/PHASE_2_MODELISATION_ML.md` + `RAPPORT_PHASE_2.md` (16 points). **Phase 3 (XAI clinique SHAP/LIME) NON démarrée** — attente validation.

### Phase 2.1 — Remédiation scientifique du benchmark synthétique (livré, à valider)
Correctif **bloquant** demandé par le superviseur : en Phase 2 les segments **test** `hypo 30/60` étaient **mono-classe (0 positif)** → modèles hypo non évaluables, donc XAI clinique (Phase 3) prématurée. Phase 2.1 rend les **4 couples évaluables** **sans** données réelles, **sans** métrique inventée, **sans** XAI, **open-loop strict**. **Dataset synthétique v2** (`seed_timeseries.py` réécrit) : **10 profils** scénarisés (stable×2, hypo_prone, hyper_prone, post_prandial_hyper, nocturnal_hypo, high_variability, sparse_cgm, insulin_sensitive, mixed), **14 jours**, CGM **5 min**, épisodes hypo(<70)/hyper(>180) **quotidiens** → présents dans train/val/test **par conception** (pas de fuite de label ; la clé de scénario pilote la génération, **jamais** une feature). `DATASET_VERSION=1.1.0`. **Registre** : colonne `evaluation_status` (migration additive `d4e5f6a7b8c9` chaînée sur `c3d4e5f6a7b8`) — `evaluated`/`insufficient_test_positives`/`not_evaluable_mono_class_test`/`candidate_only` ; **activation conditionnelle** : `active` seulement si couple évaluable sur test (bi-classe), sinon candidat documenté (`MIN_TEST_POSITIVES=10`). **Bootstrap d'incertitude** (`evaluation.bootstrap_metrics`) : IC95 percentile, 200 reps, graine fixe, sur AUROC/AUPRC/F1/Brier (bornes `None` si non définies). **Réentraînement live** : dataset 6 693 lignes/11 patients, fenêtre 2026-05-18→06-01 ; **4 couples actifs/évalués** — hypo_30 (EBM, AUROC 0.9995), hypo_60 (RF, 0.9934), hyper_30 (XGB, 0.9953), hyper_60 (XGB, 0.9959), ≥30 positifs test chacun. **Scores volontairement élevés (benchmark scénarisé séparable) = cohérence pipeline, non transférable au clinique.** **101 tests verts** (+9 Phase 2.1). Docs : `docs/migration/AMENDEMENT_PHASE_2_1_BENCHMARK_SYNTHETIQUE.md`. **Phase 3 NON démarrée** — attente validation de cet amendement.

### Phase 3 — XAI Clinique (livré, à valider)
Couche d'explicabilité **open-loop stricte** sur les 4 modèles actifs (Phase 2.1), **données synthétiques uniquement**, **XAI ≠ causalité** (jamais « la cause est » ; « le modèle a pondéré… »), **aucune dose/décision/reco**. Package `backend/app/xai/` : schemas·utils·cache·shap_explainer (TreeExplainer XGB/RF, LinearExplainer LogReg)·lime_explainer (seed 42, 1000 perturbations)·ebm_explainer (natif InterpretML)·global_explanations·local_explanations (`resolve_method` auto→native EBM sinon shap ; native non-EBM→fallback shap)·translation (templates contrôlés patient/clinicien, `FORBIDDEN_TERMS` testés)·evaluation·service·CLI `generate_global`/`evaluate`. **Méthodes** : hypo30=EBM natif, hypo60=RF SHAP, hyper30/60=XGB SHAP ; tout échec explainer → **occlusion fallback documenté** (`method_fallback=True`, jamais de contribution inventée). **Transparence calibration** : l'attribution explique le **modèle non calibré** (`explains`), la `probability` affichée est la **proba calibrée** du bundle — dissociation assumée. **Endpoints** : `POST /api/v1/xai/explain` (local, RBAC+ownership comme `ml.predict`, 401/403/404/400, audit `xai.explain`, `persist` optionnel→table `xai_explanations`), `GET /api/v1/xai/global` (réservé clinicien/admin, audit `xai.global`). Table additive `xai_explanations` (migration `e5f6a7b8c9d0` chaînée sur `d4e5f6a7b8c9`, SQLite+PG, `is_synthetic=True`). Cache mémoire TTL 15 min, clé `model_id+patient+target+horizon+at+method+features_hash`, invalidation par `model_id`. **Évaluation technique** (sous-échantillon synthétique, jamais inventée→`None`) : stabilité top-k Jaccard, deletion win_rate, agreement SHAP/LIME, congruence physiologique (heuristique, PAS validation clinique) — ex. hyper30 : stabilité 0.85, deletion 1.0, agreement 0.29, physio 0.53. Artefacts JSON globaux sous `backend/artifacts/xai/global/` (gitignorés). **119 tests verts** (101 antérieurs + 18 Phase 3). Docs : `docs/migration/PHASE_3_XAI_CLINIQUE.md` (16 sections) + `docs/migration/RAPPORT_PHASE_3.md` (rapport structuré 13 points + résultats réels). **Phase 4 (moteur de reco thérapeutique) NON démarrée** — attente validation de ce rapport.

### Phase 3.1 — Sécurisation sémantique XAI avant recommandations (livré, à valider)
Amendement **obligatoire** (superviseur) **avant** Phase 4 : qualifier la **fiabilité sémantique** de chaque explication et exposer ses limites **sans rien corriger artificiellement**. **Non-négociables tenus** : aucun réentraînement · aucune reco/décision/dose · aucune règle de décision · aucun mobile · données synthétiques uniquement · open-loop strict · tous tests antérieurs verts. Module **pur** `backend/app/xai/reliability.py` → `assess(...)` renvoie `xai_reliability_status` (`reliable_for_model_debug`/`caution_semantic_limits`/`not_reliable_for_clinical_interpretation`, escalade monotone), `xai_warnings[]` **jamais masqués**, `semantic_limitations[]`. Règles : synthétique→warning systématique · modèle non calibré→warning systématique · repli occlusion→caution · direction non globalisable/indéterminée→caution · LIME stabilité <0.5→caution · physio <0.5→caution · **physio ==0.0→not_reliable** ; signal `None`→pas d'escalade. **Directions globales clarifiées** : EBM→`not_globalizable`, SHAP→`aggregated_signed_effect` (signe brut dans `aggregated_sign`), disclaimer `direction_semantics` ; artefacts globaux **régénérés**. **Cas hypo 30** : congruence physio **0.000 conservée** (non corrigée)→artefact `not_reliable_for_clinical_interpretation`, EBM natif **non remplacé silencieusement**. **API enrichie** (local + global) : `xai_reliability_status`, `xai_warnings`, `semantic_limitations`, `calibration_notice`, `synthetic_data_notice` (+ `direction_semantics`, `evaluation` réelle/`null` côté global) ; champs **persistés** via migration additive `f6a7b8c9d0e1` (chaînée `e5f6a7b8c9d0`, SQLite+PG). **Texte patient renforcé** non causal (« Le modèle a surtout utilisé… », « Cela ne signifie pas que ces éléments sont la cause médicale », « Ne modifiez jamais votre traitement sans avis médical ») ; `FORBIDDEN_TERMS` inchangés. **Garde-fou Phase 4** : « XAI is display/support only, not a decision engine. » + scénarios canoniques (cohérence sémantique synthétique, PAS validation clinique). **133 tests verts** (119 + 14 Phase 3.1). Docs : `docs/migration/AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md`. **Phase 4 NON démarrée** — attente validation de cet amendement.

### Phase 4 — Moteur de recommandation OPEN-LOOP (livré, à valider)
Transforme les prédictions (Phase 2/2.1) + explications (Phase 3/3.1) en **suggestions non prescriptives** soumises à **validation clinicien obligatoire**. **Non-négociables tenus** : open-loop strict (toute suggestion naît `pending`) · AUCUNE dose/décision/action automatique · synthétique uniquement (`is_synthetic=True`) · pas de mobile · pas de réentraînement/nouveau modèle · le moteur **lit** `xai_reliability_status` et **refuse la XAI comme justification clinique** si `not_reliable_for_clinical_interpretation` · tous les tests antérieurs verts. Package **pur** `backend/app/recommendations/` (`schemas·dsl·rules·templates·safety·evaluation·workflow·utils·engine·service·generate_demo`). **Catégories** (toutes non prescriptives) : `ALERT_CRITICAL`/`RECOMMENDATION_BEHAVIORAL`/`CLINICAL_REFERRAL`/`THERAPY_SUGGESTION_REVIEW_ONLY`. **Règles versionnées** (seuils synthétiques NON cliniques) : HYPO_RISK_CRITICAL (p≥0.70)/HYPO_RISK_BEHAVIORAL (0.40–0.70)/HYPER_RISK_CRITICAL (p≥0.80)/HYPER_RISK_BEHAVIORAL (0.50–0.80) + **XAI_LOW_RELIABILITY** (renvoi clinique si XAI non fiable ET p≥0.40 — **s'ajoute** au risque, ne le remplace pas ; `used_as_clinical_justification=False`). **Safety** : `FORBIDDEN_TERMS` + regex dose → message bloqué (`safety_blocked`) ; notice open-loop + disclaimer « Ne modifiez jamais votre traitement sans avis médical » sur chaque suggestion. **Scores d'actionnabilité** (clarity/safety/urgency/explainability/confidence/overall) = priorisation/documentation, **jamais une décision**. **Workflow** : `pending → approved|rejected`, `pending → modified → approved|rejected` (transitions gardées, RBAC clinicien/admin). **Endpoints** : `POST /api/v1/recommendations/generate` (clin/admin), `GET /` filtré (clin/admin), `GET /mine` (patient → **uniquement approuvées**), `GET /{id}`, `approve`/`reject`/`modify`. **Décision RBAC** : `GET /recommendations` reste clinicien/admin (préserve test_rbac 403 patient) ; patient lit via `/mine`. **Audit systématique** (`recommendation.generated`/`safety_blocked`/`generate_skipped`). Migration additive idempotente `a7b8c9d0e1f2` (down_revision `f6a7b8c9d0e1`, SQLite+PG) : colonnes traçabilité (`target·horizon_min·probability·model_name·model_version·rule_id·rule_version·trigger_name·safety_level·xai_reliability_status·actionability_score·is_synthetic`) + statut `modified`. CLI démo `python -m app.recommendations.generate_demo` (n'écrit rien). **150 tests verts** (133 + 17 Phase 4). Docs : `docs/migration/PHASE_4_RECOMMENDATION_ENGINE.md`. **Phase 5 NON démarrée** — attente validation.

### Phase 1 — Data Engineering & Pipeline temporel (livré, validé)
Socle temporel **anti-leakage** prêt pour ML/XAI, **sans** ML/XAI réel. 4 tables event enrichies (mixin pipeline : source/external_event_id/device_id/quality_flag/ingestion_batch_id/unit/event_metadata) + index dedup unique partiel + index `(patient_id, ts)`. Migration additive non destructive. **9 routes `/api/v1/timeseries`** (cgm/insulin/meals/activity + events) : ingestion idempotente (201 créé / 200 doublon, concurrency-safe via IntegrityError), RBAC rôle+ownership (patient écrit/lit le sien, clinicien/admin lit avec `patient_id`), audit des écritures. Timestamps tz-aware obligatoires normalisés UTC, bornes physiologiques. `feature_engineering.py` = fonctions pures (rolling/slope/TIR/post-prandial/calendaires) refusant tout point futur. Seed 3 profils synthétiques (stable/hypo/hyper) idempotent. **66 tests verts.** Décision **TimescaleDB → repli PG standard** (hypertables = PK composite destructive + conflit FK predictions ; architecture TimescaleDB-ready documentée). Docs : `docs/migration/PHASE_1_DATA_ENGINEERING.md` + `RAPPORT_PHASE_1.md` (14 points).

## Tech Stack
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4.0 (via Vite plugin)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Package Manager:** npm

## Project Structure
The project source lives in `MedAICare_V.3_10Patients/`:
- `src/auth/` - Role-based access control (RBAC) with patient and clinician roles
- `src/engine/` - AI engine, simulator, lab report and recommendation services
- `src/components/` - React components including dashboards, devices view, messaging, audit log
- `src/types/` - TypeScript type definitions for medical data

## Running the App
The app runs via the "Start application" workflow:
```
cd MedAICare_V.3_10Patients && npm run dev
```
Serves on port 5000.

## Deployment
Configured as a static site deployment:
- **Build:** `cd MedAICare_V.3_10Patients && npm run build`
- **Public Dir:** `MedAICare_V.3_10Patients/dist`

## Architecture clinicien v6.0 — Triage → Focus (V3-Dark "Salle de Contrôle")
**Refonte complète** de l'expérience clinicien. L'ancien `DoctorDashboard` (3 onglets clairs) est remplacé par un hub immersif sombre plein écran. Pour les patients, le shell sidebar clair est conservé inchangé.

### Composants (`src/components/clinician/`)
- **`v3DarkTheme.ts`** — palette V3-Dark + helpers (RISK_COLOR, RISK_LABEL, RISK_ORDER, initials, formatCountdown, timeAgo). BG #07090F · SURFACE #0E1118 · AMBER #FFAB00 · CYAN #00E5FF · VIOLET #BF5AF2 · GREEN #30D158 · RED #EF4444.
- **`ClinicianHub.tsx`** — orchestrateur top-level. Top bar V3-Dark (logo + badge "Clinicien Pro" + tabs Triage/Cohorte/Messages/Audit + indicateur pulse "X alertes" + avatar/déconnexion). State `mode + focusedPatientId`, mode persisté dans localStorage (clé `medai_clinician_mode_v1`).
- **`TriageView.tsx`** — landing par défaut. File d'alertes priorisée par risque : KPI strip (en attente/critiques/élevés/délai moyen) + filtres chips (Tous/Critiques/Élevés/Modérés/Faibles) + cartes empilées avec border-left coloré, countdown live (refresh 1s), badge IA confiance, statut décision si déjà tracée. Click → focus.
- **`FocusView.tsx`** — patient + décision IA en mode action (refonte de l'ancien `AlertCenter`, accepte `patientId/onBack/onSelectPatient` en props). Patient strip à gauche (60px) pour switcher entre alertes sans revenir à la file. Bouton "← Retour à la file" en sub-header. Réutilise `engine/decisionLog.ts` pour persistance + sync multi-onglet.
- **`CohortView.tsx`** — vue secondaire d'exploration hors-urgence. Grille de cartes patients avec HbA1c/TIR colorés, badge alertes en attente, filtres par risque, tris (risque/HbA1c/TIR/nom). Click → focus.

### Routing (`App.tsx`)
- `user.role === 'clinician'` → render direct `<ClinicianHub />` plein écran (pas de sidebar App, pas de header). ClinicianHub gère sa propre navigation interne.
- `user.role === 'patient'` → shell sidebar/header conservé (PatientDashboard / Messaging / DevicesView).
- Modes Messages/Audit du clinicien réutilisent les composants existants (Messaging, AuditLog) en thème clair, encadrés par la top bar sombre.

### Anciens composants supprimés
- `src/components/AlertCenter.tsx` (631 l.) — logique migrée vers `clinician/FocusView.tsx`.
- `src/components/DoctorDashboard.tsx` (1101 l.) — remplacé par l'architecture Triage/Focus.

## Design System — Premium Healthtech v5.2 (Vivid Emerald · 3D Icons · Modern Logo) — patient uniquement
Full UI/UX transformation — minimaliste, lumineux, sobre, rassurant. Vivid & soothing healthtech aesthetic.
- **Body background:** `#f0fdf8` (mint-tinted, fresh, medical)
- **Brand palette:** Vivid Emerald — #10B981/#059669/#047857 family (ECFDF5→064E3B scale)
- **Zero legacy green:** No #4a8a35 / #3a6e28 / rgba(74,138,53,...) / rgba(58,110,40,...) anywhere
- **3D icon containers:** `.icon-vivid-{emerald|coral|amber|sky|violet|indigo|rose|teal|blue}` CSS classes with gradient bg + multi-layer box-shadow
- **Logo:** 3D vivid emerald container + gradient "AI" text (.gradient-text-brand) + "Intelligence médicale" sub-slogan
- **Hero:** `hero-gradient` CSS class + ambient animated glowing orbs (emerald/cyan/teal)
- **Tagline:** "Intelligence médicale. Clarté humaine." in gradient emerald-sky text
- **QuickActions:** Upgraded to 3D gradient icon containers (white card + colored icon box)
- **Clinician card:** Dark gradient bg (slate-900 → brand-900) with ambient glow
- **Card shadows:** neutral rgba(15,23,42,...) shadow system
- **Tabs:** underline-style (border-b-2) across all views — no pill containers

### v5.1 Fixes (complete):
- **LandingPage:** 0 sage-* classes remaining (was 78) — AIFeatureCard, DataFeatureCard, Trust Band, section bgs, hero gradient, footer all converted to slate-*
- **LandingPage:** Hero gradient `from-[#f8fafc]` (neutral) — was greenish `#f0f5eb`
- **LandingPage:** All section backgrounds `bg-slate-50` — was greenish `#f6f8f3`
- **LandingPage:** Phone mockup frame `bg-slate-900/border-slate-800` — premium dark slate
- **PatientDashboard:** Glucose trend arrow added inline (TrendingUp/Minus/TrendingDown from trendPrediction.direction) — standard CGM display (LibreLink/Dexcom Clarity pattern)
- **PatientDashboard + DoctorDashboard:** AGP p25 fill `rgba(241,245,249,1)` (slate-50) — was greenish `rgba(244,246,239,1)`
- **DoctorDashboard:** Tab bar double-border removed (inner `border-b` eliminated, outer card border sufficient)
- **App.tsx:** Mobile bottom nav has text labels (short: Accueil/Messages/Appareils/Clinique/Audit/Quitter) under each icon
- **AuthModal:** Bug fixed — LandingPage now passes correct props (isOpen/type/defaultMode)
- Demo credentials: patient@demo.fr / clinicien@demo.fr (DemoMediAI2026!)

## Key Features
- Patient and clinician dashboards with role-based views
- IoMT device integration (CGM, insulin pumps, smartwatches)
- Explainable AI recommendations using EBM and XGBoost
- Secure messaging between patients and clinicians (iMessage-like bubbles)
- Audit log for medical decision traceability
- QR code scanning for lab report import
- Prescription management with full audit trail
- **Hub clinicien V3-Dark (v6.0)** — voir section "Architecture clinicien v6.0" plus haut. Triage (file priorisée) → Focus (patient + décision IA + XAI) avec persistance audit-trail via `engine/decisionLog.ts` (localStorage append-only, traceID v4-like, sync multi-onglet via `storage` event, banner honnête "Tracée dans le journal local" / "Décision non tracée"). Note SaMD : journal local non-autoritaire (démo).
- **Infrastructure d'évaluation XAI (Vague 5, objectif O4)** — `engine/evaluationService.ts` capture des réponses Likert post-décision avec assignation A/B (cohorte A = explications visibles, cohorte B = sans). E-mails cliniciens hashés (FNV-1a `h_xxxxxxxx`) — aucune PII en clair dans `localStorage` (clé `mediai_evaluation_v1`). `EvaluationPanel` s'affiche après arbitrage dans `FocusView` ; bouton "Reprendre l'évaluation" si reportée ; `EvaluationExportButton` dans le menu profil de `ClinicianHub` permet l'export JSON normalisé + reset. Posture honnête : outil de mesure prêt, étude utilisateur IRB-compliant à conduire ensuite.
