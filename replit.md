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

## Design System — Premium Healthtech v5.0 (Linear/Notion-level polish)
Full UI/UX transformation as of v5.0 — minimaliste, lumineux, sobre, rassurant:
- **Body background:** neutral slate-50 (#f8fafc) — no green tint
- **Brand palette:** brand-green (#4a8a35/#3a6e28), coral (#e8441f), amber — unchanged brand colors
- **Slate neutrals:** all text/borders/backgrounds use slate-* tokens for neutral feel
- **Card shadows:** neutral rgba(15,23,42,...) shadow system (not green-tinted)
- **Tabs:** underline-style (border-b-2) across all views — no pill containers
- **Zero emojis:** all navigation, dashboard tabs, quick actions use Lucide icons
- **Design primitives v5:** `src/components/ui/primitives.tsx` — TabBar, StatTile, Card with slate-100 border
- **Landing page v5:** mySugr-inspired hero with CSS phone mockup, App Store badges, 3 pillars
- **AuthModal v5:** premium form, uppercase tracking labels, input-premium class
- **App.tsx sidebar v5:** square icon containers, active=brand-50+left indicator, no emoji in nav
- **PatientDashboard v5:** underline tabs (Activity/BookOpen/BarChart3/FlaskConical/Stethoscope), Lucide QuickActions, clean greeting banner
- **DoctorDashboard v5:** underline ClinicianTabs, premium ClinicalKPI cards with accent colors
- All secondary views (Messaging, AuditLog, DevicesView) fully converted to slate-* neutrals
- Demo credentials: patient@demo.fr / clinicien@demo.fr (Demo1234!)

## Key Features
- Patient and clinician dashboards with role-based views
- IoMT device integration (CGM, insulin pumps, smartwatches)
- Explainable AI recommendations using EBM and XGBoost
- Secure messaging between patients and clinicians (iMessage-like bubbles)
- Audit log for medical decision traceability
- QR code scanning for lab report import
- Prescription management with full audit trail
