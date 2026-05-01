# MediAI Care - Medical Dashboard

## Overview
MediAI Care (v1.0.0-prototype) is a specialized medical dashboard and decision-support system for managing diabetic patients. It is a Master's Thesis project in Biomedical Informatics integrating IoMT data with Explainable AI (XAI) to provide therapeutic recommendations. **Status: academic prototype — not destined for clinical use. No regulatory certification (MDR, IEC 62304, ISO 13485, HDS, operational GDPR).** See `MedAICare_V.3_10Patients/LIMITATIONS.md` for the full scope of intentional limits.

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
- Demo credentials: patient@demo.fr / clinicien@demo.fr (Demo1234!)

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
