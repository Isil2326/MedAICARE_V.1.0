# 📝 CHANGELOG — MediAI Care

> Format inspiré de [Keep a Changelog](https://keepachangelog.com/) · Versionnement [SemVer](https://semver.org/)
>
> **Règle Obs 001** : chaque version est accompagnée d'un fichier `AUDIT_REPORT_v[X.Y.Z].md` détaillant les modifications, justifications et plan de tests.

---

## [v1.0.0-prototype] — 2026-05-01 — 🎓 ALIGNEMENT HONNÊTE PROTOTYPE

> 📄 Audits : [`RAPPORT_COMMISSION_AUDIT_PLURIDISCIPLINAIRE.md`](./RAPPORT_COMMISSION_AUDIT_PLURIDISCIPLINAIRE.md) · [`RAPPORT_JURY_ACADEMIQUE_EXPERTS.md`](./RAPPORT_JURY_ACADEMIQUE_EXPERTS.md) · [`LIMITATIONS.md`](./LIMITATIONS.md)

### 🔬 Vague 5 — Infrastructure d'évaluation XAI (action 9 de l'audit, objectif O4)
- Création du service `src/engine/evaluationService.ts` — **outil de mesure prêt, étude utilisateur à conduire ensuite**.
  - **Anonymisation renforcée (post-review)** : la clé interne du dictionnaire `actors` est désormais le **hash FNV-1a (`h_xxxxxxxx`)** de l'e-mail, et plus l'e-mail en clair. Aucune PII ne traîne dans `localStorage`.
  - Pseudonyme stable par clinicien (`anon_<uuid>`), e-mail jamais persisté ni dans les entrées ni comme clé.
  - Assignation de cohorte A/B équilibrée (alternance pair/impair sur l'ordre d'enregistrement).
  - Override manuel de cohorte (utile pour démonstration / soutenance).
  - 5 questions Likert (1-5) : `trustAI`, `explanationClarity`, `usefulness`, `timeToDecide`, `wouldUseInPractice` + commentaire libre.
  - Stockage `localStorage` clé `mediai_evaluation_v1`, jamais transmis à un serveur.
  - Évènement `mediai:evaluation` pour rafraîchir l'UI.
  - Garde-fou anti-doublon : (acteur, décision) unique.
  - **`hasEvaluationForActor(email, decisionId)` (post-review)** : nouvelle fonction par-acteur — l'ancien `hasEvaluationFor` (global) ne pilote plus l'UI ; deux cliniciens distincts peuvent désormais évaluer indépendamment la même décision.
  - Export JSON normalisé (`schemaVersion`, `exportedAt`, `cohortOverride`, `entries`, `stats`).
- Composants cliniciens :
  - `EvaluationPanel.tsx` — panneau Likert affiché après arbitrage d'une décision dans `FocusView`. Le panneau adopte la cohorte effective et masque/affiche les rappels XAI selon le bras de l'étude.
  - `EvaluationExportButton.tsx` — bouton export JSON avec stats agrégées par cohorte + sélecteur d'override + reset, intégré dans le menu profil de `ClinicianHub`.
- Intégration `FocusView` :
  - Les **cartes XAI** (Top contributions, Pourquoi pas autre chose) **ET le bloc « Alternatives évaluées »** (post-review) sont conditionnellement masqués pour la cohorte B, avec un bandeau honnête « Cohorte B — Évaluation IA sans explications visibles ». L'isolement « sans explication » est désormais strict.
  - Après arbitrage (Apply / Modify / Dismiss), le panneau d'évaluation s'affiche automatiquement sous le bandeau de confirmation.
  - **« Plus tard » réouvrable (post-review)** : si le clinicien clique « Passer », un bandeau ambré « Évaluation reportée » apparaît avec un bouton **« Reprendre l'évaluation »** ; ce n'est plus un dismiss définitif.
- Tests `evaluationService.test.ts` (14 tests) : création d'acteur stable et anonyme, équilibrage de cohorte, **vérification stricte d'absence de PII en clair dans le storage** (post-review), override A/B/null, validations Likert, rejet decisionId vide, persistance correcte, anti-doublon, **isolation par acteur de `hasEvaluationForActor`** (post-review), statistiques par cohorte, export JSON, reset.
- **Posture honnête** : libellés UI rappellent qu'il s'agit d'un **prototype académique** — la collecte sert à préparer une étude IRB-compliant ultérieure ; aucune conclusion d'efficacité clinique n'est dérivée à ce stade.
- **Acceptance** : 50 tests verts (vs 36 avant Vague 5), `tsc --noEmit` vert, lint 0 erreur, build 11.8 s, panneau fonctionnel et données exportables, 4 correctifs de revue intégrés (PII, multi-acteur, masquage XAI strict cohorte B, « Plus tard » réouvrable).

### 🧱 Vague 4 — Refactor PatientDashboard (action 8 de l'audit)
- Éclatement du monolithe `PatientDashboard.tsx` (**928 → 240 lignes**, ~74 % de réduction) en sous-composants thématiques sous `src/components/patient/`.
- Nouveaux modules :
  - `formatters.ts` — utilitaires (`formatTime`, `formatDateRelative`, `EVENT_ICONS`, type `Tab`).
  - `PatientTabs.tsx` (40 lignes) — barre d'onglets.
  - `QuickAction.tsx` (28) — bouton d'action rapide.
  - `EventRow.tsx` (56) — ligne d'évènement (repas/insuline/activité/note/glycémie).
  - `TIRBar.tsx` (46) — barre Time in Range stratifiée.
  - `LogEventModal.tsx` (200) — modale d'enregistrement d'évènement (repas/insuline/activité/note).
  - `TodayTab.tsx` (345) — onglet Aujourd'hui (hero glycémie, chart, actions rapides, recommandation IA + panneau XAI).
  - `JournalTab.tsx` (43) — historique évènements.
  - `TrendsTab.tsx` (185) — KPI + TIR + AGP.
  - `TreatmentTab.tsx` (118) — objectifs, médicaments, note médecin.
  - `BilansTab.tsx` (77) — bilans biologiques + scanner.
- `PatientDashboard.tsx` ne conserve que l'orchestration : état, effets, fetch, bandeau salutation, alerte critique, routing onglet, modales globales.
- Correctifs TS au passage : cast `unknown` → `Record<string, unknown>` dans `authService.test.ts` ; type formatter recharts assoupli.
- **Acceptance** : `tsc --noEmit` vert, `npm run lint` 0 erreur, 36 tests verts, build 13 s, preview rendu identique.

### 🧪 Vague 3 — Tests unitaires (action 4 de l'audit)
- Installation **Vitest 4** + **@testing-library/react** + **jsdom** + `@vitest/coverage-v8`.
- Configuration `vitest.config.ts` (jsdom, alias `@`, setup file, coverage v8 ciblée sur les 3 services testés).
- Setup `src/test/setup.ts` : reset `localStorage`/`sessionStorage` entre tests, polyfill `crypto.subtle` via `node:crypto.webcrypto` si absent.
- **Tests `authService.test.ts`** (16 tests) : validations register (champs, email, mot de passe), unicité email case-insensitive, RBAC (patient/clinician), login (succès, casse email, identifiants invalides), session (logout, getCurrentUser), `getAllUsers` sans hash/salt.
- **Tests `decisionLog.test.ts`** (10 tests) : append + traceId unique, persistance dans la clé `mediai.decisionLog.v1`, dispatch `mediai:decisionlog`, gestion erreur quota, ordre tri (newest first), isolation `(patientId, decisionId)`, latest action.
- **Tests `alertQueue.test.ts`** (10 tests) : `getActivePendingDecisions` initial / après arbitrage / isolation cross-patient, `buildAlertQueue` (taille = nb patients, tri par risque, decisions exposées), `getActiveAlertCount` (cohérence avec la queue, décrément après arbitrage complet, invariance après arbitrage partiel).
- Nouveaux scripts npm : `test`, `test:watch`, `test:coverage`.
- CI : étape `npm test` ajoutée à `.github/workflows/ci.yml`.
- **Acceptance** : 36 tests passants en 4.3 s.

### 🛠 Vague 2 — Outillage qualité (actions 3, 7 de l'audit)
- Ajout d'**ESLint 9** (config flat moderne) avec `typescript-eslint`, `eslint-plugin-react-hooks` v6, `eslint-plugin-react-refresh`. Fichier : `eslint.config.js`.
- Ajout de **Prettier 3** + `eslint-config-prettier`. Fichiers : `.prettierrc.json`, `.prettierignore`.
- Nouveaux scripts npm : `typecheck`, `lint`, `lint:fix`, `format`, `format:check`.
- Pipeline **GitHub Actions** : `.github/workflows/ci.yml` (typecheck → lint → prettier-check (informatif) → build) sur push/PR `main`/`master`.
- Correction lint réelle : regex inutilement échappée dans `labReportService.ts` (séparateur `\/`).
- **Décision lucide-react** : conservation de `^1.8.0`. Vérification npm : la branche `1.x` est officielle (latest `1.14.0`, 666 versions publiées). L'observation initiale de l'audit (« version anormale ») se révèle inexacte — pas de migration nécessaire.
- 30 warnings restants (purity/set-state-in-effect React 19, no-explicit-any, no-useless-assignment) volontairement non bloquants pour un prototype ; ils documentent les chantiers futurs sans empêcher le CI de passer.
- **Acceptance** : `npm run typecheck`, `npm run lint`, `npm run build` exit 0.

### 🔧 Vague 1 — Honnêteté & cohérence (actions 1, 2, 5, 6, 10 de l'audit)
- Renommage projet : `react-vite-tailwind` → **`mediai-care`**, version `0.0.0` → **`1.0.0-prototype`** (alignement `package.json` ↔ `replit.md`).
- Nouveau bandeau permanent **`PrototypeBanner`** affiché en haut de chaque écran (dismiss local), assorti de `utils/prototypeNotice.ts` (constantes `APP_VERSION`, `APP_STATUS_LABEL`, `APP_DISCLAIMER`, `TECH_FACTS`).
- Création de **`LIMITATIONS.md`** (10 sections) : architecture, sécurité, données, IA/XAI, conformité, qualité, accessibilité, cohérence UI, roadmap, engagements honnêtes.
- **Requalification systématique** des revendications de conformité dans l'UI :
  - `App.tsx` (footer / sidebar) : suppression `Session sécurisée AES-256` et `IEC 62304 · ISO 13485 · RGPD · HDS · v6.0.0`.
  - `LandingPage.tsx` : bloc cliniciens et section sécurité requalifiés (« version commerciale viserait… »).
  - `AuditLog.tsx` : référentiels étiquetés **`Non implémenté`** + pipeline renommé « architecture cible ».
  - `AuthModal.tsx`, `DevicesView.tsx`, `ErrorBoundary.tsx` : badges HDS / RGPD / IEC retirés.
  - `Messaging.tsx` (3 endroits) : « chiffrement E2E · HDS » → « démo · stockage navigateur (non chiffré) ».
  - `TreatmentEditor.tsx` : « Signature SHA-256 · IEC 62304 » → « Prototype non certifié ».
  - Commentaires en-tête de `authService.ts`, `prescriptionService.ts`, `types/medical.ts`, `Messaging.tsx` : limites explicitées.
  - `simulator.ts` : log « Conformité RGPD » → « Export démo ».
- Corrections TypeScript résiduelles : `LandingPage` (Framer `EASE_OUT_EXPO as const`), `AuditLog` (import `Clock` retiré), `AuthModal` (import `Shield` retiré), `ai-engine` (`trend` → `_trend`).
- **Acceptance** : `npx tsc --noEmit` vert, plus aucune revendication HDS/AES/E2E/conformité non requalifiée dans `src/`.

---

## [v3.3.0] — 2025-07-10 — 💬 MESSAGERIE + AUDIT PRODUIT
> 📄 Audit : [`AUDIT_REPORT_v3.3.0.md`](./AUDIT_REPORT_v3.3.0.md) · Rectifications : [`RECTIFICATION_REPORT_v3.3.0.md`](./RECTIFICATION_REPORT_v3.3.0.md)

### ✨ Ajouté
- `Messaging.tsx` : messagerie bidirectionnelle Patient ↔ Clinicien
  - Threads, accusés de lecture (✓ / ✓✓ bleu), groupement par jour
  - Persistance localStorage (`mediai_messages_v1`)
  - 4 messages démo pré-chargés (conversation Dr. Martin / Marc Dupont)
  - Mode compact (panneau) + mode plein écran
  - Mention "Chiffré · HDS" visible dans l'interface
- Badge non-lus dynamique (polling 3s) dans sidebar + topbar
- Bouton raccourci Messages dans la topbar avec badge
- `ViewMode 'messages'` : route accessible aux deux rôles (RBAC partagé)

### 🔧 Modifié
- `App.tsx` : navigation refondée (5 items + badge), version v3.2.3 → **v3.3.0**
- `types/medical.ts` : ViewMode étendu avec `'messages'`
- Import ViewMode centralisé (suppression du doublon dans App.tsx)

### 🐛 Corrigé
- Import `Bell` inutilisé supprimé (App.tsx)
- Doublon export `ViewMode` éliminé

### 📋 Reporté → v3.4.0
- Modification du traitement patient par le clinicien
- XAI visible par défaut (panneau ouvert au chargement)
- Export CSV fonctionnel
- Journal patient enrichi (alertes + recos + actions fusionnés)

---

## [v3.1.0] — 2026 — 🩺 OUTILLAGE CLINICIEN (Obs 001 — vague 1/3)

> 📄 Audit complet : [`AUDIT_REPORT_v3.1.0.md`](./AUDIT_REPORT_v3.1.0.md)

### 🔢 Versionnement
- Bascule officielle en **SemVer strict** (`MAJEUR.MINEUR.PATCH`)
- Numéro affiché en sidebar : `v2.1` → **`v3.1.0`**
- Engagement : 1 rapport d'audit par version désormais

### ✨ Ajouté — Sélecteur de plage temporelle
- Composant `TimeRangeSelector` (Live · H-1 · H-6 · J-1 · J-7 · M-1 · M-3)
- Défaut = **Live** (temps réel) avec pulse animé
- Bascule auto : courbe glycémique pour H-1→J-1, AGP pour J-7+
- Badge « Vue rétrospective » quand mode historique
- Données déterministes par patient (`generateHistoricalGlucose`)

### ✨ Ajouté — Décisions en cours / Actions proposées
- Panneau `PendingDecisionsPanel` en haut de la fiche patient (clinicien)
- Carte `DecisionCard` par décision avec :
  - Niveau de risque + score de confiance IA
  - Action proposée explicite
  - Snapshot contextuel (4 chips : glycémie, tendance, insuline active, TIR)
  - Raisonnement IA (puces) + Alternatives évaluées (risque ↓ ↔ ↑)
  - 3 actions cliniciennes : **Accepter & Tracer** / **Modifier** / **Rejeter**
- Conformité **IEC 62304 § 5.1** : décision finale = clinicien
- Section pliable « décisions déjà traitées »

### ✨ Ajouté — Journal historique
- Refonte complète de l'ancien « journal d'événements »
- Composant `HistoricalJournal` agrégeant : Alertes (CGM/IoMT) + Recommandations (AI) + Décisions (clinicien) + Événements (patient)
- 4 filtres avec compteurs (Alertes / Recommandations / Décisions / Événements)
- Groupement par jour avec en-têtes sticky
- Affichage par entrée : titre · résumé · action recommandée · acquittement · statut · **trace ID auditable**
- Fenêtre adaptative : J-7 → 7j d'historique, M-1 → 14j, M-3 → 30j
- Pied : « Journal signé · Conforme IEC 62304 »

### 🗑️ Supprimé / restreint
- Onglet **« Dispositifs »** masqué pour le clinicien (sans valeur opérationnelle)
- Section « Activité récente patient » de la fiche clinicien (intégrée au journal historique)

### 🆕 Types ajoutés
- `TimeRangeKey`, `TimeRangeOption`
- `HistoricalEntryType`, `HistoricalEntry`
- `PendingClinicalDecision` (avec `contextSnapshot`, `reasoning`, `alternativeOptions`)

### 🆕 Données simulées (engine)
- `TIME_RANGES`, `getTimeRange`
- `generateHistoricalGlucose(rangeKey, seed)` — série déterministe seedée
- `generateHistoricalEntries(patientId, daysBack)` — agrégation alertes/recommandations/événements
- `getPendingDecisions(patientId)` — 2 décisions exemples

### 📦 Build
- Bundle : 287 kB gzippé (+25 kB vs v1.1.0)
- Modules : 2 797
- Erreurs TS : 0

### 🗺️ Reste à faire (Obs 001)
- v3.2.0 → Messagerie Patient ↔ Clinicien
- v3.3.0 → Modification du traitement par clinicien
- v3.4.0 → Lecture QR code rapport d'analyses

---

## [v1.1.0] — 2026 — 🎨 REFONTE PRODUIT (Patient & Clinicien)

### 🗑️ Supprimé (effet "démo" éliminé)
- Sélecteur de scénarios cliniques visible côté patient ("Stable / Hypo / Hyper / Critique")
- Bouton Pause/Reprendre du flux IoMT
- Badge "Live · 4s" et noms de modèles ML côté patient
- Vocabulaire technique exposé au patient ("Score IA 75/100", IDs de décision)

### ✨ Ajouté — Patient (4 onglets)
- **Aujourd'hui** : Hero personnalisé "Bonjour [prénom]" + glycémie + 4 actions rapides + recommandation IA expliquée
- **Journal** : Timeline d'évènements avec saisie (Repas / Insuline / Activité / Note)
- **Tendances** : 4 KPIs cliniques + TIR stratifié 5 zones + AGP 14j (standard ATTD)
- **Mon traitement** : Cibles glycémiques + médicaments + note du médecin
- XAI patient-friendly : "Dans 30 minutes" + "Pourquoi cette recommandation"

### ✨ Ajouté — Clinicien (3 onglets)
- **Cohorte** : Liste enrichie (HbA1c, TIR, statut) + filtres rapides + stratification du risque
- **Fiche patient** : Composant `PatientFile` complet (header, 5 KPIs, AGP, TIR stratifié, notes annotables, plan de soins, médicaments, activité patient)
- **Performance IA** : 3 modèles avec gauges F1 et métriques détaillées
- Boutons : Téléconsulter, Rapport ATTD, Export CSV, Annoter, Prescrire

### 🎨 Différenciation visuelle
- Patient : palette **teal/cyan**, ton chaleureux/personnel
- Clinicien : palette **bleu/violet**, densité élevée, ton clinique pro

### 🆕 Nouveau module
- `src/engine/patient-data.ts` : génération réaliste (évènements, AGP, TIR, plan de soins, notes, médicaments)

### 🆕 Types ajoutés
- `PatientEvent`, `AGPDataPoint`, `TIRStratified`, `CarePlan`, `ClinicalNote`, `Medication`

### 📊 Métriques de couverture (charte)
- O2 (modèle IA recommandation) : 60% → **80%**
- O3 (XAI compréhensible) : 70% → **85%**

### 📄 Documentation
- `AUDIT_PRODUCT_v1.1.0.md` — Audit produit détaillé
- `REPORT_v1.1.0.md` — Rapport de livraison + métriques avant/après

---

## [v1.0.0] — 2026 — 🎯 ALIGNEMENT SUR LA CHARTE

### 📋 Documents fondateurs créés
- `PROJECT_CHARTER_v1.0.0.md` — Charte de référence absolue (scope diabète + XAI + IoMT)
- `CHANGELOG.md` — Historique structuré des versions
- `AUDIT_ALIGNMENT_v1.0.0.md` — Audit d'alignement entre l'existant et la charte

### 🎯 Décisions structurantes
- **Maladie cible recentrée :** DIABÈTE (Type 1 et Type 2) uniquement
- **Variables IoMT figées** : 8 variables physiologiques validées
- **5 types de recommandations** définis et délimités
- **Scope évaluation (O4)** ajouté comme manque critique à combler

---

## [v0.9.x] — Versions Pré-Charte (ARCHIVÉ)

### v0.9.5 — Refonte XAI
- Ajout prédiction glycémique 30 min
- Ajout rationnel de recommandation
- Types `GlycemicTrend`, `RecommendationRationale`

### v0.9.4 — Authentification réelle
- PBKDF2-SHA256 (100k itérations)
- RBAC strict Patient ≠ Clinicien
- Comptes démo

### v0.9.3 — Refonte Design System
- Primitives UI partagées (`primitives.tsx`)
- Dark theme premium unifié
- Suppression "Analytiques IA" (redondant avec Médecin)

### v0.9.2 — Pipeline Landing Page
- Refontes successives du pipeline visuel
- Adoption design Tidepool-inspired

### v0.9.1 — Authentification fictive (déprécié)
- Boutons "Créer mon espace" et "Demande d'accès Pro"
- Modal d'authentification simple

### v0.9.0 — Base initiale
- Architecture initiale : Patient/Médecin dashboards
- Simulateur IoMT
- Premier moteur IA + XAI
