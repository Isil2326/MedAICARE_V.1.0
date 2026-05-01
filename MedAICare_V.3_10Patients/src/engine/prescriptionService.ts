// ============================================================================
// PRESCRIPTION SERVICE — Prototype académique
// Gestion des prescriptions, plans de traitement, audit thérapeutique
// • Persistance localStorage avec versioning
// • Signature SHA-256 pour intégrité (côté client uniquement, démo)
// • Audit trail local (NON immuable au sens réglementaire)
//
// LIMITES : voir LIMITATIONS.md. Une vraie traçabilité IEC 62304 / ISO 13485
// exigerait un backend append-only signé et une gestion documentée du cycle
// de vie logiciel. Le présent service est une démonstration pédagogique.
// ============================================================================

import type {
  Prescription, PrescriptionAudit, TreatmentPlan, DrugClass,
} from '../types/medical';

const PRESCRIPTIONS_KEY = 'mediai_prescriptions_v1';
const AUDIT_KEY = 'mediai_prescription_audit_v1';
const PLANS_KEY = 'mediai_treatment_plans_v1';
const UPDATE_EVENT = 'mediai:prescriptions:updated';

// ─── Hash léger SHA-256 (Web Crypto API) ─────────────────────────────────────

async function computeSignature(data: string): Promise<string> {
  try {
    const buf = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } catch {
    // Fallback synchrone si Web Crypto indisponible
    let h = 0;
    for (let i = 0; i < data.length; i++) h = (h * 31 + data.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(8, '0');
  }
}

function buildPayloadString(p: Partial<Prescription>): string {
  return JSON.stringify({
    drug: p.drugName,
    dose: p.dose,
    unit: p.doseUnit,
    freq: p.frequency,
    route: p.route,
    status: p.status,
    version: p.version,
  });
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadPrescriptions(): Prescription[] {
  try { return JSON.parse(localStorage.getItem(PRESCRIPTIONS_KEY) || '[]'); }
  catch { return []; }
}

function savePrescriptions(list: Prescription[]) {
  localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function loadAuditTrail(): PrescriptionAudit[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); }
  catch { return []; }
}

function saveAuditTrail(list: PrescriptionAudit[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
}

export function loadTreatmentPlans(): TreatmentPlan[] {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || '[]'); }
  catch { return []; }
}

function saveTreatmentPlans(list: TreatmentPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(list));
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export function getPrescriptionsForPatient(patientId: string): Prescription[] {
  return loadPrescriptions()
    .filter(p => p.patientId === patientId)
    .sort((a, b) => b.prescribedAt - a.prescribedAt);
}

export function getActivePrescriptions(patientId: string): Prescription[] {
  return getPrescriptionsForPatient(patientId).filter(p => p.status === 'active');
}

export function getAuditForPatient(patientId: string): PrescriptionAudit[] {
  return loadAuditTrail()
    .filter(a => a.patientId === patientId)
    .sort((a, b) => b.performedAt - a.performedAt);
}

export function getTreatmentPlan(patientId: string): TreatmentPlan | null {
  return loadTreatmentPlans().find(p => p.patientId === patientId) || null;
}

// ─── Écriture (avec audit obligatoire) ───────────────────────────────────────

export interface CreatePrescriptionInput {
  patientId: string;
  drugName: string;
  genericName?: string;
  drugClass: DrugClass;
  dose: number;
  doseUnit: string;
  frequency: string;
  route: Prescription['route'];
  timing?: string;
  startDate?: number;
  endDate?: number;
  duration?: string;
  indication: string;
  warnings?: string[];
  patientNotes?: string;
  prescribedBy: string;
  prescribedById: string;
}

export async function createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
  const now = Date.now();
  const id = `rx_${now}_${Math.random().toString(36).slice(2, 6)}`;

  const draft: Prescription = {
    id,
    patientId: input.patientId,
    drugName: input.drugName,
    genericName: input.genericName,
    drugClass: input.drugClass,
    dose: input.dose,
    doseUnit: input.doseUnit,
    frequency: input.frequency,
    route: input.route,
    timing: input.timing,
    startDate: input.startDate || now,
    endDate: input.endDate,
    duration: input.duration,
    prescribedBy: input.prescribedBy,
    prescribedById: input.prescribedById,
    prescribedAt: now,
    status: 'active',
    indication: input.indication,
    warnings: input.warnings,
    patientNotes: input.patientNotes,
    signature: '',
    version: 1,
  };

  draft.signature = await computeSignature(buildPayloadString(draft));

  const all = loadPrescriptions();
  all.push(draft);
  savePrescriptions(all);

  // Audit
  await appendAudit({
    prescriptionId: id,
    patientId: input.patientId,
    action: 'created',
    performedBy: input.prescribedBy,
    performedById: input.prescribedById,
    after: draft,
    reason: `Nouvelle prescription : ${input.drugName} ${input.dose} ${input.doseUnit}`,
  });

  return draft;
}

export interface ModifyPrescriptionInput {
  prescriptionId: string;
  changes: Partial<Pick<Prescription,
    'dose' | 'doseUnit' | 'frequency' | 'timing' | 'endDate' | 'patientNotes' | 'warnings'
  >>;
  reason: string;
  performedBy: string;
  performedById: string;
}

export async function modifyPrescription(input: ModifyPrescriptionInput): Promise<Prescription | null> {
  const all = loadPrescriptions();
  const idx = all.findIndex(p => p.id === input.prescriptionId);
  if (idx === -1) return null;

  const before = { ...all[idx] };

  // Détecter le type d'action principal
  let action: PrescriptionAudit['action'] = 'dose_changed';
  if (input.changes.dose !== undefined && input.changes.dose !== before.dose) action = 'dose_changed';
  else if (input.changes.frequency && input.changes.frequency !== before.frequency) action = 'frequency_changed';

  const updated: Prescription = {
    ...before,
    ...input.changes,
    lastModifiedAt: Date.now(),
    modifiedBy: input.performedBy,
    version: before.version + 1,
    reasonForChange: input.reason,
    signature: '',
  };
  updated.signature = await computeSignature(buildPayloadString(updated));

  all[idx] = updated;
  savePrescriptions(all);

  await appendAudit({
    prescriptionId: input.prescriptionId,
    patientId: before.patientId,
    action,
    performedBy: input.performedBy,
    performedById: input.performedById,
    before,
    after: updated,
    reason: input.reason,
  });

  return updated;
}

export async function changePrescriptionStatus(
  prescriptionId: string,
  newStatus: Prescription['status'],
  reason: string,
  performedBy: string,
  performedById: string,
): Promise<Prescription | null> {
  const all = loadPrescriptions();
  const idx = all.findIndex(p => p.id === prescriptionId);
  if (idx === -1) return null;

  const before = { ...all[idx] };
  const updated: Prescription = {
    ...before,
    status: newStatus,
    lastModifiedAt: Date.now(),
    modifiedBy: performedBy,
    version: before.version + 1,
    reasonForChange: reason,
    signature: '',
  };
  updated.signature = await computeSignature(buildPayloadString(updated));
  all[idx] = updated;
  savePrescriptions(all);

  const actionMap: Record<Prescription['status'], PrescriptionAudit['action']> = {
    active: 'resumed',
    paused: 'paused',
    discontinued: 'discontinued',
    completed: 'discontinued',
  };

  await appendAudit({
    prescriptionId,
    patientId: before.patientId,
    action: actionMap[newStatus],
    performedBy,
    performedById,
    before,
    after: updated,
    reason,
  });

  return updated;
}

// ─── Audit trail ──────────────────────────────────────────────────────────────

interface AppendAuditInput {
  prescriptionId: string;
  patientId: string;
  action: PrescriptionAudit['action'];
  performedBy: string;
  performedById: string;
  before?: Partial<Prescription>;
  after?: Partial<Prescription>;
  reason: string;
}

async function appendAudit(input: AppendAuditInput): Promise<PrescriptionAudit> {
  const entry: PrescriptionAudit = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    prescriptionId: input.prescriptionId,
    patientId: input.patientId,
    action: input.action,
    performedBy: input.performedBy,
    performedById: input.performedById,
    performedAt: Date.now(),
    before: input.before,
    after: input.after,
    reason: input.reason,
    signature: '',
  };
  entry.signature = await computeSignature(JSON.stringify(entry));

  const all = loadAuditTrail();
  all.push(entry);
  saveAuditTrail(all);
  return entry;
}

// ─── Treatment plan (objectifs cliniques) ────────────────────────────────────

export function upsertTreatmentPlan(plan: Omit<TreatmentPlan, 'lastReviewedAt'> & { lastReviewedAt?: number }): TreatmentPlan {
  const all = loadTreatmentPlans();
  const idx = all.findIndex(p => p.patientId === plan.patientId);
  const now = Date.now();
  const final: TreatmentPlan = { ...plan, lastReviewedAt: plan.lastReviewedAt || now };
  if (idx === -1) all.push(final);
  else all[idx] = final;
  saveTreatmentPlans(all);
  return final;
}

// ─── Bibliothèque de médicaments fréquents (autocomplete) ────────────────────

export interface DrugTemplate {
  drugName: string;
  genericName: string;
  drugClass: DrugClass;
  defaultDose: number;
  defaultUnit: string;
  defaultFrequency: string;
  route: Prescription['route'];
  defaultIndication: string;
  warnings?: string[];
}

export const DRUG_LIBRARY: DrugTemplate[] = [
  // Insulines
  { drugName: 'Lantus', genericName: 'Insuline glargine', drugClass: 'insulin-basal',
    defaultDose: 20, defaultUnit: 'UI', defaultFrequency: '1 fois/jour au coucher',
    route: 'subcutaneous', defaultIndication: 'Diabète T1 — insulinothérapie basale',
    warnings: ['Risque hypoglycémie', 'Conserver au frigo (2-8°C)'] },
  { drugName: 'Toujeo', genericName: 'Insuline glargine 300 UI/mL', drugClass: 'insulin-basal',
    defaultDose: 20, defaultUnit: 'UI', defaultFrequency: '1 fois/jour',
    route: 'subcutaneous', defaultIndication: 'Diabète — insulinothérapie basale concentrée',
    warnings: ['Ne pas confondre avec Lantus 100 UI/mL'] },
  { drugName: 'Humalog', genericName: 'Insuline lispro', drugClass: 'insulin-rapid',
    defaultDose: 6, defaultUnit: 'UI', defaultFrequency: 'Avant chaque repas',
    route: 'subcutaneous', defaultIndication: 'Diabète — insuline rapide prandiale',
    warnings: ['Injecter 0-15 min avant repas', 'Adapter selon glucides'] },
  { drugName: 'Novorapid', genericName: 'Insuline aspart', drugClass: 'insulin-rapid',
    defaultDose: 6, defaultUnit: 'UI', defaultFrequency: 'Avant chaque repas',
    route: 'subcutaneous', defaultIndication: 'Diabète — insuline rapide prandiale',
    warnings: ['Surveillance glycémique post-prandiale'] },
  // Antidiabétiques oraux
  { drugName: 'Metformine', genericName: 'Metformine HCl', drugClass: 'biguanide',
    defaultDose: 1000, defaultUnit: 'mg', defaultFrequency: '2 fois/jour aux repas',
    route: 'oral', defaultIndication: 'Diabète T2 — première intention',
    warnings: ['Surveiller fonction rénale (DFG)', 'Tolérance digestive à monitorer'] },
  { drugName: 'Ozempic', genericName: 'Semaglutide', drugClass: 'glp1',
    defaultDose: 0.5, defaultUnit: 'mg', defaultFrequency: '1 fois/semaine',
    route: 'subcutaneous', defaultIndication: 'Diabète T2 — analogue GLP-1',
    warnings: ['Nausées initiales fréquentes', 'Surveillance pancréatite'] },
  { drugName: 'Forxiga', genericName: 'Dapagliflozine', drugClass: 'sglt2',
    defaultDose: 10, defaultUnit: 'mg', defaultFrequency: '1 fois/jour le matin',
    route: 'oral', defaultIndication: 'Diabète T2 — inhibiteur SGLT2',
    warnings: ['Risque acidocétose euglycémique', 'Hydratation suffisante'] },
  { drugName: 'Januvia', genericName: 'Sitagliptine', drugClass: 'dpp4',
    defaultDose: 100, defaultUnit: 'mg', defaultFrequency: '1 fois/jour',
    route: 'oral', defaultIndication: 'Diabète T2 — inhibiteur DPP-4', warnings: [] },
  // Comorbidités fréquentes
  { drugName: 'Atorvastatine', genericName: 'Atorvastatine', drugClass: 'statin',
    defaultDose: 20, defaultUnit: 'mg', defaultFrequency: '1 fois/jour le soir',
    route: 'oral', defaultIndication: 'Dyslipidémie associée au diabète',
    warnings: ['Surveillance hépatique', 'Myalgies à signaler'] },
  { drugName: 'Ramipril', genericName: 'Ramipril', drugClass: 'antihypertensive',
    defaultDose: 5, defaultUnit: 'mg', defaultFrequency: '1 fois/jour le matin',
    route: 'oral', defaultIndication: 'HTA + néphroprotection diabétique',
    warnings: ['Surveiller créatinine et kaliémie', 'Toux possible'] },
  { drugName: 'Aspirine 75', genericName: 'Acide acétylsalicylique', drugClass: 'antiplatelet',
    defaultDose: 75, defaultUnit: 'mg', defaultFrequency: '1 fois/jour',
    route: 'oral', defaultIndication: 'Prévention cardiovasculaire',
    warnings: ['Risque hémorragique'] },
];

export const DRUG_CLASS_LABELS: Record<DrugClass, string> = {
  'insulin-rapid': 'Insuline rapide',
  'insulin-basal': 'Insuline basale',
  'insulin-mixed': 'Insuline mixte',
  'biguanide': 'Biguanide',
  'sulfonylurea': 'Sulfamide hypoglycémiant',
  'dpp4': 'Inhibiteur DPP-4',
  'glp1': 'Analogue GLP-1',
  'sglt2': 'Inhibiteur SGLT2',
  'antihypertensive': 'Antihypertenseur',
  'statin': 'Statine',
  'antiplatelet': 'Antiagrégant plaquettaire',
  'other': 'Autre',
};

// ─── Seed démo (1ère utilisation) ────────────────────────────────────────────

export async function seedDemoPrescriptions(patientId: string, clinicianName: string, clinicianId: string) {
  const SEED_KEY = 'mediai_rx_seed_v3.4.0';
  if (localStorage.getItem(SEED_KEY) === patientId) return;

  const existing = getPrescriptionsForPatient(patientId);
  if (existing.length > 0) {
    localStorage.setItem(SEED_KEY, patientId);
    return;
  }

  await createPrescription({
    patientId,
    drugName: 'Lantus',
    genericName: 'Insuline glargine',
    drugClass: 'insulin-basal',
    dose: 22, doseUnit: 'UI',
    frequency: '1 fois/jour au coucher',
    route: 'subcutaneous',
    timing: '22h00',
    indication: 'Diabète T1 — insulinothérapie basale',
    warnings: ['Risque hypoglycémie nocturne — collation si glycémie < 100 mg/dL'],
    patientNotes: 'Conserver au réfrigérateur. Sortir 30 min avant injection.',
    prescribedBy: clinicianName,
    prescribedById: clinicianId,
  });

  await createPrescription({
    patientId,
    drugName: 'Humalog',
    genericName: 'Insuline lispro',
    drugClass: 'insulin-rapid',
    dose: 6, doseUnit: 'UI',
    frequency: 'Avant chaque repas (3 fois/jour)',
    route: 'subcutaneous',
    timing: '0-15 min avant repas',
    indication: 'Diabète T1 — insuline rapide prandiale',
    warnings: ['Adapter la dose selon glycémie pré-prandiale et glucides du repas'],
    patientNotes: 'Ratio insuline/glucides : 1 UI pour 10g de glucides',
    prescribedBy: clinicianName,
    prescribedById: clinicianId,
  });

  await createPrescription({
    patientId,
    drugName: 'Atorvastatine',
    genericName: 'Atorvastatine',
    drugClass: 'statin',
    dose: 20, doseUnit: 'mg',
    frequency: '1 fois/jour',
    route: 'oral',
    timing: 'Le soir au coucher',
    indication: 'Prévention cardiovasculaire — LDL > 1.0 g/L',
    warnings: ['Signaler toute douleur musculaire'],
    prescribedBy: clinicianName,
    prescribedById: clinicianId,
  });

  upsertTreatmentPlan({
    patientId,
    prescriptions: [],
    targetHbA1c: 7.0,
    targetGlucoseRangeMin: 70,
    targetGlucoseRangeMax: 180,
    targetTIR: 70,
    lifestyleRecommendations: [
      'Activité physique modérée 30 min, 5 j/semaine',
      'Contrôle glycémique 4-6 fois/jour',
      'Suivi nutritionnel mensuel',
      'HbA1c trimestrielle',
    ],
    followUpDate: Date.now() + 30 * 86400000,
    lastReviewedBy: clinicianName,
  });

  localStorage.setItem(SEED_KEY, patientId);
}
