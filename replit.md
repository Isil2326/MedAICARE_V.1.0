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

## Design System — Thème Naturel (mySugr-inspired)
Complete light/warm redesign as of v4.0.0:
- **Brand palette:** brand-green (#4a8a35), sage (#f4f6ef), coral (#e8441f), amber — all defined as CSS custom properties in `index.css`
- **Design primitives:** `src/components/ui/primitives.tsx` — Card, StatTile, Badge, TimeRangeSelector
- All dark `bg-white/[0.x]` / `text-white/x` classes replaced with light sage/white equivalents
- Components fully converted: `DoctorDashboard`, `PatientDashboard`, `Messaging`, `AuditLog`, `DevicesView`, `TreatmentEditor`, `LabReportTimeline`, `LabReportScanner`, `LandingPage`, `ClinicalRecommendationCard`, `TimeRangeSelector`
- Engine/auth files intentionally untouched

## Key Features
- Patient and clinician dashboards with role-based views
- IoMT device integration (CGM, insulin pumps, smartwatches)
- Explainable AI recommendations using EBM and XGBoost
- Secure messaging between patients and clinicians (iMessage-like bubbles)
- Audit log for medical decision traceability
- QR code scanning for lab report import
- Prescription management with full audit trail
