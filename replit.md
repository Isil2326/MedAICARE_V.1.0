# MediAI Care - Medical Dashboard

## Overview
MediAI Care (v3.3.2) is a specialized medical dashboard and decision-support system for managing diabetic patients. It is a Master's Thesis project in Biomedical Informatics integrating IoMT data with Explainable AI (XAI) to provide therapeutic recommendations.

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

## Design System — Premium Healthtech v5.2 (Vivid Emerald · 3D Icons · Modern Logo)
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
- **Centre d'alerte (clinicien)** — vue immersive V3-Dark "Salle de contrôle" (`AlertCenter.tsx`) avec strip patient, countdown live, cartes XAI (3 signaux pondérés), suggestion IA + alternatives, panneau décision (Appliquer/Modifier/Ignorer). Persistance via `engine/decisionLog.ts` (localStorage append-only, clé `(patientId, decisionId)`, traceID v4-like, vérification post-écriture, sync multi-onglet via `storage` event). Banner honnête : "Tracée dans le journal local" + traceID + acteur + horodatage ; `persisted=false` → banner d'erreur "Décision non tracée". Note SaMD : journal local non-autoritaire (démo).
- **Navigation clinicien** : landing par défaut + bouton logo → `alerts` (Centre d'alerte). Tab `Alertes` avec icône `Zap` ajoutée à la sidebar et au bottom nav mobile (rôle `clinician` uniquement).
