// ============================================================================
// TYPES & INTERFACES — Architecture des données du prototype
// (Modèles inspirés des bonnes pratiques ISO 13485 / IEC 62304 — non certifié)
// ============================================================================

export interface PatientVitals {
  glucose: number;
  heartRate: number;
  steps: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hba1c: number;
  temperature: number;
  insulinDose: number;
  carbIntake: number;
  timestamp: number;
}

export interface XAIExplanation {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
  threshold: number;
  contribution: number;
  clinicalNote: string;
}

export interface SHAPValue {
  feature: string;
  value: number;
  impact: number;
  baseValue: number;
  color: string;
}

// Prédiction de tendance glycémique (30 min)
export interface GlycemicTrend {
  direction: 'rising' | 'falling' | 'stable';
  predictedValue: number;
  predictedChange: number; // mg/dL
  confidence: number;
  explanation: string; // Pourquoi cette direction ?
  contributingFactors: Array<{
    factor: string;
    impact: 'major' | 'moderate' | 'minor';
    direction: 'increasing' | 'decreasing' | 'neutral';
    explanation: string;
  }>;
}

// Rationnel de recommandation (chaîne de décision)
export interface RecommendationRationale {
  trigger: 'prediction' | 'alert' | 'routine';
  triggerDetails: string; // Quelle alerte/prédiction a déclenché ceci ?
  dataPoints: Array<{ name: string; value: number | string; status: 'normal' | 'warning' | 'critical' }>;
  reasoning: string; // Chaîne logique : "Parce que X → alors Y → donc Z"
  alternativeActions: string[]; // Pourquoi cette action plutôt qu'une autre ?
  evidenceLevel: 'A' | 'B' | 'C'; // Niveau de preuve (ADA)
}

export interface MedicalRecommendation {
  id: string;
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number;
  confidence: number;
  primaryFactors: XAIExplanation[];
  globalInterpretation: string;
  localInterpretation: string;
  action: string;
  actionDetails: string[];
  shapValues: SHAPValue[];
  modelUsed: string;
  timestamp: number;
  // NOUVEAU : XAI amélioré
  trendPrediction?: GlycemicTrend;
  rationale?: RecommendationRationale;
}

export interface IoMTDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'CGM' | 'BPM' | 'ACTIVITY' | 'BLOODPRESSURE' | 'GLUCOMETER' | 'SMARTWATCH' | 'INSULIN_PUMP';
  battery: number;
  lastSync: number;
  status: 'connected' | 'syncing' | 'disconnected' | 'error';
  firmware: string;
  dataPoints: number;
  icon: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: 'M' | 'F';
  diabetesType: 'T1D' | 'T2D';
  diabetesDuration: number;
  hba1c: number;
  tir: number;
  insulinDelivery: 'PUMP_AID' | 'PUMP_MANUAL' | 'MDI';
  pumpModel?: string;
  cgmDevice: 'Dexcom_G7' | 'FreeStyle_Libre_3' | 'Dexcom_G6_Pro';
  clinicalProfile: string;
  comorbidities: string[];
  dailyInsulinTotal: number;
  weight: number;
  insulinSensitivityFactor: number;
  insulinCarbRatio: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  // Backward compatibility fields
  name: string;
  gender: 'M' | 'F';
  diagnosisDate?: string;
  currentRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore?: number;
  lastVisit?: string;
  adherence: number;
  alerts: number;
  avatar?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  module: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  user: string;
  details: string;
  traceId: string;
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  recall: number;
  precision: number;
  f1Score: number;
  specificity: number;
  auc: number;
  trainingSamples: number;
  lastTrained: string;
  version: string;
}

export interface Alert {
  id: string;
  type: 'HYPO' | 'HYPER' | 'BRADYCARDIA' | 'TACHYCARDIA' | 'HYPERTENSION' | 'HYPOXIA' | 'GENERAL';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  patientId: string;
}

export type ViewMode = 'landing' | 'patient' | 'doctor' | 'devices' | 'audit' | 'messages';

// ============================================================================
// JOURNAL PATIENT — Évènements quotidiens (repas, insuline, activité, notes)
// ============================================================================

export type PatientEventType = 'meal' | 'insulin' | 'activity' | 'note' | 'glucose';

export interface PatientEvent {
  id: string;
  type: PatientEventType;
  timestamp: number;
  // Champs spécifiques selon le type
  carbs?: number;         // grammes (meal)
  mealName?: string;      // ex: "Petit-déjeuner"
  insulinUnits?: number;  // unités (insulin)
  insulinType?: 'rapid' | 'basal'; // (insulin)
  activityType?: string;  // ex: "Marche"
  durationMin?: number;   // minutes (activity)
  intensity?: 'low' | 'moderate' | 'high';
  noteText?: string;      // (note)
  glucoseValue?: number;  // mg/dL (glucose manual entry)
}

// AGP — Ambulatory Glucose Profile (norme ATTD 2017)
export interface AGPDataPoint {
  hour: number;     // 0-23
  p5: number;       // 5e percentile
  p25: number;      // 25e percentile
  p50: number;      // médiane
  p75: number;      // 75e percentile
  p95: number;      // 95e percentile
}

// Time in Range stratifié (5 zones — recommandation ATTD)
export interface TIRStratified {
  veryLow: number;   // <54 mg/dL
  low: number;       // 54-69
  inRange: number;   // 70-180
  high: number;      // 181-250
  veryHigh: number;  // >250
}

// Plan de soins (clinicien)
export interface CarePlan {
  patientId: string;
  updatedAt: number;
  updatedBy: string;
  glucoseTargetMin: number;
  glucoseTargetMax: number;
  hba1cTarget: number;
  insulinBasal: number;     // unités/jour
  insulinRatioCarbs: number; // 1U pour X grammes
  insulinSensitivity: number; // 1U fait baisser de X mg/dL
  notes: string;
}

// Annotation clinique
export interface ClinicalNote {
  id: string;
  patientId: string;
  authorName: string;
  authorRole: string;
  timestamp: number;
  text: string;
  category: 'consultation' | 'adjustment' | 'observation' | 'alert_review';
}

// Médicament
export interface Medication {
  id: string;
  name: string;
  dosage: string;       // ex: "10 mg"
  frequency: string;    // ex: "1 fois/jour"
  startDate: number;
  prescribedBy: string;
  active: boolean;
}

// ============================================================================
// v3.1.0 — Plage temporelle (visualisation rétrospective)
// ============================================================================

export type TimeRangeKey = 'live' | 'h1' | 'h6' | 'd1' | 'd7' | 'm1' | 'm3';

export interface TimeRangeOption {
  key: TimeRangeKey;
  label: string;        // ex: "H-1"
  description: string;  // ex: "Dernière heure"
  durationMs: number;
  bucketMs: number;     // granularité d'agrégation
  isLive: boolean;
}

// ============================================================================
// v3.1.0 — Journal historique (clinicien)
// Trace toutes les alertes + recommandations + événements pour un patient
// ============================================================================

export type HistoricalEntryType = 'alert' | 'recommendation' | 'event' | 'decision';

export interface HistoricalEntry {
  id: string;
  patientId: string;
  type: HistoricalEntryType;
  timestamp: number;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  // Métadonnées contextuelles
  module?: string;          // ex: "AI Engine", "CGM", "Patient"
  metricValue?: number;     // ex: glycémie au moment de l'événement
  metricUnit?: string;      // ex: "mg/dL"
  recommendationAction?: string; // ex: "Bolus 2U recommandé"
  acknowledged?: boolean;   // alerte acquittée ?
  acknowledgedBy?: string;
  outcomeStatus?: 'pending' | 'accepted' | 'modified' | 'rejected'; // suite donnée
  traceId?: string;         // lien audit
}

// ============================================================================
// v3.1.0 — Décision clinique en cours (proposée par l'IA, en attente du clinicien)
// ============================================================================

export interface PendingClinicalDecision {
  id: string;
  patientId: string;
  createdAt: number;
  expiresAt: number;            // si non traitée → escalade
  triggerReason: string;        // ex: "Hypoglycémie prédite à H+30 min"
  aiRecommendation: string;     // ex: "Réduire bolus dîner de 1U"
  aiConfidence: number;         // 0-1
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  contextSnapshot: {
    glucose: number;
    glucoseTrend: 'rising' | 'falling' | 'stable';
    timeInRange24h: number;
    activeInsulin: number;      // unités à bord
    lastMealCarbs?: number;
    lastMealAgoMin?: number;
  };
  reasoning: string[];          // explication courte (2-4 puces)
  alternativeOptions: Array<{
    label: string;
    risk: 'lower' | 'similar' | 'higher';
    rationale: string;
  }>;
  status: 'pending' | 'accepted' | 'modified' | 'rejected';
}

// ============================================================================
// MODULE QR CODE — RAPPORTS D'ANALYSES BIOLOGIQUES (v3.2.0)
// ============================================================================

/**
 * Format JSON simple attendu dans le QR code labo.
 * Extensible vers HL7 FHIR Observation.
 */
export interface LabReportPayload {
  version: string;              // "1.0"
  reportId: string;             // identifiant unique du bilan
  laboratory: {
    name: string;
    accreditation?: string;     // ex: "COFRAC ISO 15189"
    contact?: string;
  };
  patient: {
    externalId: string;         // ID patient au laboratoire
    firstName?: string;
    lastName?: string;
    birthDate?: string;         // ISO 8601
  };
  collectionDate: string;       // ISO 8601 — prélèvement
  reportDate: string;           // ISO 8601 — édition rapport
  prescriber?: string;
  results: LabResult[];
  signature?: string;           // hash SHA-256 du rapport
}

export interface LabResult {
  code: string;                 // code interne (ex: "HBA1C")
  loincCode?: string;           // standard LOINC (ex: "4548-4")
  label: string;                // libellé lisible
  value: number;
  unit: string;                 // ex: "%", "mg/dL", "mmol/L"
  refRange: {
    low?: number;
    high?: number;
    text?: string;              // ex: "< 5.7"
  };
  flag?: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
  category: 'glycemia' | 'lipids' | 'renal' | 'thyroid' | 'other';
}

/**
 * Bilan persisté dans le dossier patient après scan.
 */
export interface LabReport {
  id: string;                   // UUID interne
  patientId: string;
  source: 'qr-scan' | 'manual' | 'import';
  scannedAt: number;            // timestamp du scan
  payload: LabReportPayload;
  validation: {
    schemaValid: boolean;
    signatureValid: boolean;
    anomaliesDetected: string[];
  };
  traceId: string;              // pour audit
  appliedToPredictions: boolean; // mis à jour dans les prédictions ?
}

/**
 * Synthèse du panel diabète extraite et utilisable par le moteur IA.
 */
export interface DiabetesPanelSummary {
  hba1c?: number;               // %
  fastingGlucose?: number;      // mg/dL
  postprandialGlucose?: number; // mg/dL
  totalCholesterol?: number;    // mg/dL
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  creatinine?: number;          // mg/dL
  egfr?: number;                // mL/min/1.73m²
  microalbuminuria?: number;    // mg/L
  tsh?: number;                 // mUI/L
  reportDate: string;
}

// ============================================================================
// v3.4.0 — Plan thérapeutique & prescriptions (Clinicien → Patient)
// ============================================================================

/** Catégorie pharmacologique simplifiée pour le diabète */
export type DrugClass =
  | 'insulin-rapid'      // Humalog, Novorapid, Apidra
  | 'insulin-basal'      // Lantus, Toujeo, Tresiba, Levemir
  | 'insulin-mixed'      // Novomix, Humalog Mix
  | 'biguanide'          // Metformine
  | 'sulfonylurea'       // Glimepiride, Gliclazide
  | 'dpp4'               // Sitagliptine, Vildagliptine
  | 'glp1'               // Liraglutide, Semaglutide, Dulaglutide
  | 'sglt2'              // Empagliflozine, Dapagliflozine
  | 'antihypertensive'   // IEC, ARA2, beta-bloquants
  | 'statin'             // Atorvastatine, Rosuvastatine
  | 'antiplatelet'       // Aspirine
  | 'other';

export type RouteOfAdministration = 'oral' | 'subcutaneous' | 'intramuscular' | 'topical' | 'inhaled';

/** Prescription enrichie v3.4.0 — remplace progressivement Medication */
export interface Prescription {
  id: string;
  patientId: string;
  // Identification produit
  drugName: string;             // Nom commercial (ex: "Lantus")
  genericName?: string;         // DCI (ex: "Insuline glargine")
  drugClass: DrugClass;
  // Posologie
  dose: number;                 // valeur numérique
  doseUnit: string;             // ex: "UI", "mg", "g"
  frequency: string;            // ex: "1 fois/jour", "Avant chaque repas"
  route: RouteOfAdministration;
  timing?: string;              // ex: "Au coucher", "Avec le repas"
  // Validité
  startDate: number;            // timestamp
  endDate?: number;             // si non défini = traitement chronique
  duration?: string;            // ex: "30 jours", "Au long cours"
  refillsAllowed?: number;      // nombre de renouvellements
  // Traçabilité
  prescribedBy: string;         // nom clinicien
  prescribedById: string;       // ID clinicien (auth)
  prescribedAt: number;         // timestamp création
  lastModifiedAt?: number;
  modifiedBy?: string;
  // État
  status: 'active' | 'paused' | 'discontinued' | 'completed';
  reasonForChange?: string;     // Si modifié/arrêté
  // Sécurité clinique
  indication: string;           // Pourquoi ce traitement (ex: "Diabète T1 - Insulinothérapie basale")
  warnings?: string[];          // Alertes (interactions, allergies)
  patientNotes?: string;        // Conseils patient (ex: "À conserver au frigo")
  // Audit
  signature: string;            // SHA-256 de la prescription (intégrité)
  version: number;              // incrémenté à chaque modification
}

/** Historique d'une prescription : chaque modification crée une entrée */
export interface PrescriptionAudit {
  id: string;
  prescriptionId: string;
  patientId: string;
  action: 'created' | 'dose_changed' | 'frequency_changed' | 'paused' | 'resumed' | 'discontinued' | 'replaced';
  performedBy: string;          // Nom clinicien
  performedById: string;
  performedAt: number;
  before?: Partial<Prescription>;
  after?: Partial<Prescription>;
  reason: string;               // Justification clinique obligatoire
  signature: string;            // SHA-256 traçabilité
}

/** Plan thérapeutique global d'un patient */
export interface TreatmentPlan {
  patientId: string;
  prescriptions: Prescription[];
  // Objectifs cliniques
  targetHbA1c?: number;         // ex: 7.0
  targetGlucoseRangeMin?: number; // ex: 70 mg/dL
  targetGlucoseRangeMax?: number; // ex: 180 mg/dL
  targetTIR?: number;           // % temps dans la cible (ex: 70)
  // Recommandations non médicamenteuses
  lifestyleRecommendations?: string[];
  followUpDate?: number;        // Prochain RDV
  lastReviewedAt: number;
  lastReviewedBy: string;
}

