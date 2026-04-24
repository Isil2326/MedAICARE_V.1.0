// ============================================================================
// MODULE IoMT — Simulation de Capteurs Médicaux (CGM, BPM, Activité)
// Pipeline: Acquisition → Normalisation → Streaming
// ============================================================================

import type { PatientVitals, IoMTDevice, Patient, AuditLogEntry, Alert } from '../types/medical';

let glucoseTrend = 0;
let hrTrend = 0;

export function generateSimulatedIoMTData(scenarioMode: 'normal' | 'hypo' | 'hyper' | 'crisis' = 'normal'): PatientVitals {
  // Realistic physiological simulation with autocorrelation
  glucoseTrend += (Math.random() - 0.5) * 8;
  glucoseTrend = Math.max(-30, Math.min(60, glucoseTrend));
  hrTrend += (Math.random() - 0.5) * 4;
  hrTrend = Math.max(-15, Math.min(25, hrTrend));

  let baseGlucose = 95;
  let baseHr = 72;
  let baseSpo2 = 97;
  let baseSys = 118;
  let baseDia = 76;
  let baseTemp = 36.6;
  let baseInsulin = 4.5;
  let baseCarbs = 45;

  switch (scenarioMode) {
    case 'hypo':
      baseGlucose = 58 + Math.random() * 15;
      baseHr = 85 + Math.random() * 20;
      baseSpo2 = 95 + Math.random() * 3;
      break;
    case 'hyper':
      baseGlucose = 220 + Math.random() * 80;
      baseHr = 90 + Math.random() * 15;
      baseSpo2 = 94 + Math.random() * 4;
      baseTemp = 37.2 + Math.random() * 0.5;
      break;
    case 'crisis':
      baseGlucose = 320 + Math.random() * 80;
      baseHr = 110 + Math.random() * 20;
      baseSpo2 = 88 + Math.random() * 6;
      baseSys = 155 + Math.random() * 20;
      baseDia = 95 + Math.random() * 10;
      baseTemp = 38.0 + Math.random() * 1.0;
      break;
    default:
      baseGlucose = 85 + Math.random() * 30 + glucoseTrend * 0.3;
      baseHr = 65 + Math.random() * 15 + hrTrend * 0.2;
      break;
  }

  return {
    glucose: Math.round(Math.max(40, Math.min(400, baseGlucose))),
    heartRate: Math.round(Math.max(40, Math.min(180, baseHr))),
    spo2: Math.round(Math.max(80, Math.min(100, baseSpo2))),
    systolic: Math.round(Math.max(80, Math.min(200, baseSys))),
    diastolic: Math.round(Math.max(50, Math.min(130, baseDia))),
    steps: Math.floor(3000 + Math.random() * 8000),
    hba1c: parseFloat((5.5 + Math.random() * 3.5).toFixed(1)),
    temperature: parseFloat(baseTemp.toFixed(1)),
    insulinDose: parseFloat((baseInsulin + Math.random() * 3).toFixed(1)),
    carbIntake: Math.round(baseCarbs + Math.random() * 40),
    timestamp: Date.now(),
  };
}

export function getIoMTDevices(): IoMTDevice[] {
  try {
    const devices: IoMTDevice[] = [
      {
        id: 'cgm-001',
        name: 'FreeStyle Libre 3',
        manufacturer: 'Abbott',
        type: 'CGM',
        battery: 87,
        lastSync: Date.now() - 120000,
        status: 'connected',
        firmware: 'v3.2.1',
        dataPoints: 2847,
        icon: '📊',
      },
      {
        id: 'pump-001',
        name: 'Omnipod 5',
        manufacturer: 'Insulet',
        type: 'INSULIN_PUMP',
        battery: 72,
        lastSync: Date.now() - 60000,
        status: 'connected',
        firmware: 'v5.1.0',
        dataPoints: 1523,
        icon: '💉',
      },
      {
        id: 'watch-001',
        name: 'Apple Watch Ultra 2',
        manufacturer: 'Apple',
        type: 'SMARTWATCH',
        battery: 64,
        lastSync: Date.now() - 30000,
        status: 'syncing',
        firmware: 'watchOS 11.2',
        dataPoints: 5621,
        icon: '⌚',
      },
      {
        id: 'bpm-001',
        name: 'Omron Evolv',
        manufacturer: 'Omron',
        type: 'BLOODPRESSURE',
        battery: 95,
        lastSync: Date.now() - 3600000,
        status: 'connected',
        firmware: 'v2.0.3',
        dataPoints: 412,
        icon: '🩺',
      },
      {
        id: 'gluco-001',
        name: 'Contour Next One',
        manufacturer: 'Ascensia',
        type: 'GLUCOMETER',
        battery: 53,
        lastSync: Date.now() - 7200000,
        status: 'connected',
        firmware: 'v1.4.2',
        dataPoints: 856,
        icon: '🔬',
      },
      {
        id: 'cgm-002',
        name: 'Dexcom G7',
        manufacturer: 'Dexcom',
        type: 'CGM',
        battery: 41,
        lastSync: Date.now() - 900000,
        status: 'disconnected',
        firmware: 'v1.8.5',
        dataPoints: 3291,
        icon: '📈',
      },
    ];

    // Validation: chaque dispositif doit avoir les champs requis
    const validDevices = devices.filter(d => 
      d.id && 
      d.name && 
      d.type && 
      typeof d.battery === 'number' &&
      typeof d.dataPoints === 'number'
    );

    console.log('[Simulator] Dispositifs IoMT chargés:', validDevices.length);
    return validDevices;
  } catch (error) {
    console.error('[Simulator] Erreur getIoMTDevices:', error);
    // Retourner tableau vide sécurisé au lieu de crash
    return [];
  }
}

export function getSimulatedPatients(): Patient[] {
  return [
    {
      id: 'PAT-001',
      firstName: 'Karim',
      lastName: 'Mansouri',
      name: 'Karim Mansouri',
      age: 45,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 22,
      hba1c: 7.2,
      tir: 64,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Insulin Omnipod 5',
      cgmDevice: 'Dexcom_G7',
      riskLevel: 'LOW',
      currentRisk: 'LOW',
      clinicalProfile: "Adulte actif sous pompe AID, contrôle acceptable mais hyperglycémies post-prandiales récurrentes liées à un comptage glucidique approximatif.",
      comorbidities: [],
      dailyInsulinTotal: 42,
      weight: 78,
      insulinSensitivityFactor: 40,
      insulinCarbRatio: 10,
      avatar: '👨‍💼',
      alerts: 1,
      adherence: 85
    },
    {
      id: 'PAT-002',
      firstName: 'Yasmine',
      lastName: 'Belkacem',
      name: 'Yasmine Belkacem',
      age: 28,
      sex: 'F',
      gender: 'F',
      diabetesType: 'T1D',
      diabetesDuration: 18,
      hba1c: 6.8,
      tir: 75,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Tandem t:slim X2',
      cgmDevice: 'Dexcom_G6_Pro',
      riskLevel: 'LOW',
      currentRisk: 'LOW',
      clinicalProfile: "Excellente gestion depuis l'enfance. Experte de sa maladie, faible variabilité, TIR exemplaire.",
      comorbidities: [],
      dailyInsulinTotal: 34,
      weight: 62,
      insulinSensitivityFactor: 50,
      insulinCarbRatio: 12,
      avatar: '👩‍⚕️',
      alerts: 0,
      adherence: 98
    },
    {
      id: 'PAT-003',
      firstName: 'Ahmed',
      lastName: 'Boukhalfa',
      name: 'Ahmed Boukhalfa',
      age: 62,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 35,
      hba1c: 8.4,
      tir: 48,
      insulinDelivery: 'MDI',
      cgmDevice: 'FreeStyle_Libre_3',
      riskLevel: 'HIGH',
      currentRisk: 'HIGH',
      clinicalProfile: "Diabète ancien sous MDI, contrôle insuffisant, complications micro-vasculaires débutantes. Candidate à une transition vers pompe.",
      comorbidities: ["Microalbuminurie", "Rétinopathie débutante"],
      dailyInsulinTotal: 58,
      weight: 85,
      insulinSensitivityFactor: 30,
      insulinCarbRatio: 8,
      avatar: '👴',
      alerts: 4,
      adherence: 65
    },
    {
      id: 'PAT-004',
      firstName: 'Lina',
      lastName: 'Ouali',
      name: 'Lina Ouali',
      age: 14,
      sex: 'F',
      gender: 'F',
      diabetesType: 'T1D',
      diabetesDuration: 8,
      hba1c: 8.8,
      tir: 38,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Insulin Omnipod 5',
      cgmDevice: 'Dexcom_G7',
      riskLevel: 'MODERATE',
      currentRisk: 'MODERATE',
      clinicalProfile: "Jeune ado sportive (course, natation), hypoglycémies induites par l'exercice. Bon contrôle global mais gestion du sport nécessitant ajustements.",
      comorbidities: [],
      dailyInsulinTotal: 28,
      weight: 55,
      insulinSensitivityFactor: 55,
      insulinCarbRatio: 14,
      avatar: '👧',
      alerts: 2,
      adherence: 70
    },
    {
      id: 'PAT-005',
      firstName: 'Hocine',
      lastName: 'Benali',
      name: 'Hocine Benali',
      age: 55,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 12,
      hba1c: 7.7,
      tir: 55,
      insulinDelivery: 'MDI',
      cgmDevice: 'FreeStyle_Libre_3',
      riskLevel: 'HIGH',
      currentRisk: 'HIGH',
      clinicalProfile: "LADA diagnostiqué tardivement. Polyurique, risque hypoglycémique nocturne accru par insuffisance rénale modérée.",
      comorbidities: ["Insuffisance rénale modérée (eGFR 52)"],
      dailyInsulinTotal: 38,
      weight: 82,
      insulinSensitivityFactor: 35,
      insulinCarbRatio: 9,
      avatar: '👨‍🦳',
      alerts: 3,
      adherence: 80
    },
    {
      id: 'PAT-006',
      firstName: 'Sami',
      lastName: 'Cherif',
      name: 'Sami Cherif',
      age: 18,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 10,
      hba1c: 9.4,
      tir: 28,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Tandem t:slim X2',
      cgmDevice: 'Dexcom_G7',
      riskLevel: 'CRITICAL',
      currentRisk: 'CRITICAL',
      clinicalProfile: "Adolescent rebelle, forte variabilité glycémique. Résistance à l'insuline fluctuante, compliance variable selon contexte scolaire.",
      comorbidities: [],
      dailyInsulinTotal: 65,
      weight: 72,
      insulinSensitivityFactor: 25,
      insulinCarbRatio: 7,
      avatar: '👨‍🎓',
      alerts: 6,
      adherence: 45
    },
    {
      id: 'PAT-007',
      firstName: 'Nadia',
      lastName: 'Haddad',
      name: 'Nadia Haddad',
      age: 34,
      sex: 'F',
      gender: 'F',
      diabetesType: 'T1D',
      diabetesDuration: 15,
      hba1c: 7.6,
      tir: 55,
      insulinDelivery: 'MDI',
      cgmDevice: 'FreeStyle_Libre_3',
      riskLevel: 'MODERATE',
      currentRisk: 'MODERATE',
      clinicalProfile: "Mauvaise observance due au stress professionnel et troubles du sommeil. Oublis fréquents de bolus, repas irréguliers, hyperglycémies à jeun matinales.",
      comorbidities: ["Anxiété", "Troubles du sommeil"],
      dailyInsulinTotal: 48,
      weight: 68,
      insulinSensitivityFactor: 35,
      insulinCarbRatio: 10,
      avatar: '👩‍💼',
      alerts: 2,
      adherence: 60
    },
    {
      id: 'PAT-008',
      firstName: 'Malik',
      lastName: 'Bouzid',
      name: 'Malik Bouzid',
      age: 52,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 20,
      hba1c: 9.1,
      tir: 35,
      insulinDelivery: 'PUMP_MANUAL',
      pumpModel: 'Medtronic MiniMed',
      cgmDevice: 'FreeStyle_Libre_3',
      riskLevel: 'CRITICAL',
      currentRisk: 'CRITICAL',
      clinicalProfile: "Diabète instable avec nombreux rebonds. Neuropathie limitant la perception des hypoglycémies (hypoglycemia unawareness). Urgence thérapeutique.",
      comorbidities: ["Neuropathie périphérique", "Hypertension"],
      dailyInsulinTotal: 52,
      weight: 95,
      insulinSensitivityFactor: 20,
      insulinCarbRatio: 6,
      avatar: '👨',
      alerts: 5,
      adherence: 50
    },
    {
      id: 'PAT-009',
      firstName: 'Rania',
      lastName: 'Khelifi',
      name: 'Rania Khelifi',
      age: 26,
      sex: 'F',
      gender: 'F',
      diabetesType: 'T1D',
      diabetesDuration: 10,
      hba1c: 6.9,
      tir: 72,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Insulin Omnipod 5',
      cgmDevice: 'Dexcom_G7',
      riskLevel: 'LOW',
      currentRisk: 'LOW',
      clinicalProfile: "Étudiante, bonne gestion. Voyage fréquent (changement de routine, décalage horaire). Profil stable mais sensible aux perturbations contextuelles.",
      comorbidities: [],
      dailyInsulinTotal: 38,
      weight: 58,
      insulinSensitivityFactor: 50,
      insulinCarbRatio: 13,
      avatar: '👩‍🎓',
      alerts: 1,
      adherence: 90
    },
    {
      id: 'PAT-010',
      firstName: 'Sofiane',
      lastName: 'Mebarki',
      name: 'Sofiane Mebarki',
      age: 38,
      sex: 'M',
      gender: 'M',
      diabetesType: 'T1D',
      diabetesDuration: 14,
      hba1c: 7.0,
      tir: 70,
      insulinDelivery: 'PUMP_AID',
      pumpModel: 'Tandem t:slim X2',
      cgmDevice: 'Dexcom_G6_Pro',
      riskLevel: 'LOW',
      currentRisk: 'LOW',
      clinicalProfile: "Suivi longitudinal stable. Ancien non-observant (HbA1c > 8.5%), amélioration progressive après passage sous pompe AID. Modèle de réussite thérapeutique.",
      comorbidities: [],
      dailyInsulinTotal: 60,
      weight: 76,
      insulinSensitivityFactor: 42,
      insulinCarbRatio: 11,
      avatar: '👨‍💻',
      alerts: 0,
      adherence: 92
    }
  ];
}

export function generateAuditLogs(): AuditLogEntry[] {
  const now = Date.now();
  return [
    { id: 'LOG-001', timestamp: now - 5000, action: 'Recommandation IA générée', module: 'AI Engine', severity: 'INFO', user: 'SYSTEM', details: 'Score de risque calculé: 42/100 | Modèle: RF v2.3 | Confiance: 94%', traceId: 'TRC-a1b2c3' },
    { id: 'LOG-002', timestamp: now - 15000, action: 'Données IoMT reçues', module: 'IoMT Gateway', severity: 'INFO', user: 'CGM-001', details: 'Glycémie: 142 mg/dL | Source: FreeStyle Libre 3', traceId: 'TRC-d4e5f6' },
    { id: 'LOG-003', timestamp: now - 30000, action: 'Alerte hyperglycémie déclenchée', module: 'Alert Engine', severity: 'WARNING', user: 'SYSTEM', details: 'Patient PAT-003: Glycémie > 250 mg/dL pendant 45 min', traceId: 'TRC-g7h8i9' },
    { id: 'LOG-004', timestamp: now - 60000, action: 'Explication XAI générée', module: 'XAI Module', severity: 'INFO', user: 'SYSTEM', details: 'SHAP values calculées pour 6 features | Méthode: TreeSHAP', traceId: 'TRC-j0k1l2' },
    { id: 'LOG-005', timestamp: now - 120000, action: 'Synchronisation capteur réussie', module: 'IoMT Gateway', severity: 'INFO', user: 'PUMP-001', details: 'Omnipod 5 synchronisé | 48 nouveaux points de données', traceId: 'TRC-m3n4o5' },
    { id: 'LOG-006', timestamp: now - 180000, action: 'Authentification médecin', module: 'Auth', severity: 'INFO', user: 'DR-BENMOUSSA', details: 'Connexion réussie | IP: 192.168.1.xxx | 2FA: Validé', traceId: 'TRC-p6q7r8' },
    { id: 'LOG-007', timestamp: now - 300000, action: 'Versioning modèle IA', module: 'MLOps', severity: 'INFO', user: 'SYSTEM', details: 'Modèle RF v2.3 déployé | Dataset: v4.1 | AUC: 0.96', traceId: 'TRC-s9t0u1' },
    { id: 'LOG-008', timestamp: now - 450000, action: 'Échec synchronisation', module: 'IoMT Gateway', severity: 'ERROR', user: 'CGM-002', details: 'Dexcom G7: Timeout après 30s | Batterie faible: 41%', traceId: 'TRC-v2w3x4' },
    { id: 'LOG-009', timestamp: now - 600000, action: 'Rapport patient exporté', module: 'Reports', severity: 'INFO', user: 'DR-BENMOUSSA', details: 'Rapport PDF généré pour PAT-001 | Période: 30 jours | Conformité RGPD', traceId: 'TRC-y5z6a7' },
    { id: 'LOG-010', timestamp: now - 900000, action: 'Alerte critique — SpO2 basse', module: 'Alert Engine', severity: 'CRITICAL', user: 'SYSTEM', details: 'Patient PAT-003: SpO2 < 90% | Notification urgente envoyée', traceId: 'TRC-b8c9d0' },
  ];
}

export function generateAlerts(vitals: PatientVitals): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  if (vitals.glucose < 70) {
    alerts.push({
      id: `ALR-${now}-1`,
      type: 'HYPO',
      severity: vitals.glucose < 54 ? 'critical' : 'high',
      message: `Hypoglycémie détectée: ${vitals.glucose} mg/dL`,
      timestamp: now,
      acknowledged: false,
      patientId: 'PAT-001',
    });
  }
  if (vitals.glucose > 180) {
    alerts.push({
      id: `ALR-${now}-2`,
      type: 'HYPER',
      severity: vitals.glucose > 250 ? 'critical' : 'high',
      message: `Hyperglycémie détectée: ${vitals.glucose} mg/dL`,
      timestamp: now,
      acknowledged: false,
      patientId: 'PAT-001',
    });
  }
  if (vitals.heartRate > 100) {
    alerts.push({
      id: `ALR-${now}-3`,
      type: 'TACHYCARDIA',
      severity: vitals.heartRate > 120 ? 'high' : 'medium',
      message: `Tachycardie: ${vitals.heartRate} bpm`,
      timestamp: now,
      acknowledged: false,
      patientId: 'PAT-001',
    });
  }
  if (vitals.spo2 < 94) {
    alerts.push({
      id: `ALR-${now}-4`,
      type: 'HYPOXIA',
      severity: vitals.spo2 < 90 ? 'critical' : 'high',
      message: `Saturation O2 basse: ${vitals.spo2}%`,
      timestamp: now,
      acknowledged: false,
      patientId: 'PAT-001',
    });
  }

  return alerts;
}
