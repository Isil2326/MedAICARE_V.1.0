// ============================================================================
// SIMULATEUR DE DONNÉES PATIENT — Évènements, AGP, TIR, Plan de soins
// Aucun "scénario" visible. Données réalistes et stables pour démo crédible.
// ============================================================================

import type {
  PatientEvent, AGPDataPoint, TIRStratified,
  CarePlan, ClinicalNote, Medication,
  HistoricalEntry, PendingClinicalDecision, TimeRangeOption, TimeRangeKey,
} from '../types/medical';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ----------------------------------------------------------------------------
// JOURNAL D'ÉVÈNEMENTS — Reproductible via seed temporel
// ----------------------------------------------------------------------------

export function generatePatientEvents(daysBack = 1): PatientEvent[] {
  const now = Date.now();
  const events: PatientEvent[] = [];
  let id = 0;

  for (let d = 0; d < daysBack; d++) {
    const dayStart = new Date(now - d * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const base = dayStart.getTime();

    // Petit-déjeuner ~7h30
    events.push({
      id: `evt_${id++}`, type: 'meal', timestamp: base + 7.5 * HOUR,
      mealName: 'Petit-déjeuner', carbs: 45 + Math.round(Math.random() * 15),
    });
    events.push({
      id: `evt_${id++}`, type: 'insulin', timestamp: base + 7.5 * HOUR + 5 * 60 * 1000,
      insulinUnits: 6 + Math.round(Math.random() * 2), insulinType: 'rapid',
    });

    // Déjeuner ~12h30
    events.push({
      id: `evt_${id++}`, type: 'meal', timestamp: base + 12.5 * HOUR,
      mealName: 'Déjeuner', carbs: 60 + Math.round(Math.random() * 20),
    });
    events.push({
      id: `evt_${id++}`, type: 'insulin', timestamp: base + 12.5 * HOUR,
      insulinUnits: 8 + Math.round(Math.random() * 3), insulinType: 'rapid',
    });

    // Activité après-midi ~16h
    if (Math.random() > 0.4) {
      events.push({
        id: `evt_${id++}`, type: 'activity', timestamp: base + 16 * HOUR,
        activityType: ['Marche', 'Vélo', 'Course'][Math.floor(Math.random() * 3)],
        durationMin: 20 + Math.round(Math.random() * 40),
        intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'moderate' | 'high',
      });
    }

    // Dîner ~19h30
    events.push({
      id: `evt_${id++}`, type: 'meal', timestamp: base + 19.5 * HOUR,
      mealName: 'Dîner', carbs: 55 + Math.round(Math.random() * 20),
    });
    events.push({
      id: `evt_${id++}`, type: 'insulin', timestamp: base + 19.5 * HOUR,
      insulinUnits: 7 + Math.round(Math.random() * 3), insulinType: 'rapid',
    });

    // Insuline basale soir ~22h
    events.push({
      id: `evt_${id++}`, type: 'insulin', timestamp: base + 22 * HOUR,
      insulinUnits: 18, insulinType: 'basal',
    });
  }

  // Filtrer les évènements futurs
  return events.filter(e => e.timestamp <= now).sort((a, b) => b.timestamp - a.timestamp);
}

// ----------------------------------------------------------------------------
// AGP — Ambulatory Glucose Profile (24h, agrégé sur 14 jours simulés)
// ----------------------------------------------------------------------------

export function generateAGP(): AGPDataPoint[] {
  const data: AGPDataPoint[] = [];
  for (let h = 0; h < 24; h++) {
    // Profil typique : montée après repas (8h, 13h, 20h), descente nuit
    let median = 130;
    if (h >= 7 && h <= 9) median = 165;       // post-petit-dej
    else if (h >= 12 && h <= 14) median = 175; // post-déjeuner
    else if (h >= 19 && h <= 21) median = 170; // post-dîner
    else if (h >= 1 && h <= 5) median = 105;   // nuit
    else if (h >= 22 || h === 0) median = 120; // soir tard
    else median = 130;

    const variability = 25;
    data.push({
      hour: h,
      p5: Math.max(55, median - variability * 1.6),
      p25: median - variability * 0.7,
      p50: median,
      p75: median + variability * 0.7,
      p95: median + variability * 1.6,
    });
  }
  return data;
}

// ----------------------------------------------------------------------------
// TIME IN RANGE STRATIFIÉ (5 zones — standard ATTD)
// ----------------------------------------------------------------------------

export function generateTIRStratified(): TIRStratified {
  return {
    veryLow: 1,    // <54 mg/dL — cible <1%
    low: 3,        // 54-69     — cible <4%
    inRange: 68,   // 70-180    — cible >70%
    high: 22,     // 181-250   — cible <25%
    veryHigh: 6,   // >250      — cible <5%
  };
}

// ----------------------------------------------------------------------------
// PLAN DE SOINS (template)
// ----------------------------------------------------------------------------

export function getCarePlan(patientId: string): CarePlan {
  return {
    patientId,
    updatedAt: Date.now() - 5 * DAY,
    updatedBy: 'Dr. M. Renaud',
    glucoseTargetMin: 70,
    glucoseTargetMax: 180,
    hba1cTarget: 7.0,
    insulinBasal: 18,
    insulinRatioCarbs: 10, // 1U pour 10g
    insulinSensitivity: 40, // 1U baisse de 40 mg/dL
    notes: 'Cible TIR ≥ 70%. Réévaluation dans 3 mois. Surveillance accrue post-dîner.',
  };
}

// ----------------------------------------------------------------------------
// NOTES CLINIQUES
// ----------------------------------------------------------------------------

export function generateClinicalNotes(patientId: string): ClinicalNote[] {
  const now = Date.now();
  return [
    {
      id: 'note_1', patientId, authorName: 'Dr. M. Renaud', authorRole: 'Endocrinologue',
      timestamp: now - 5 * DAY, category: 'consultation',
      text: 'Consultation de suivi. TIR amélioré depuis dernière visite (+8pts). Maintenir schéma actuel. Envisager ajustement basale soir si tendance hypo nocturne persiste.',
    },
    {
      id: 'note_2', patientId, authorName: 'Dr. M. Renaud', authorRole: 'Endocrinologue',
      timestamp: now - 12 * DAY, category: 'adjustment',
      text: 'Augmentation ratio glucides repas du soir : 1U/10g → 1U/8g. Patient signale glycémie post-prandiale élevée.',
    },
    {
      id: 'note_3', patientId, authorName: 'Mme L. Dubois', authorRole: 'Infirmière coordinatrice',
      timestamp: now - 18 * DAY, category: 'observation',
      text: 'Patient adhérent. Bonne maîtrise du carb counting. Aucune difficulté technique avec le CGM rapportée.',
    },
  ];
}

// ----------------------------------------------------------------------------
// MÉDICAMENTS
// ----------------------------------------------------------------------------

export function getMedications(_patientId: string): Medication[] {
  const now = Date.now();
  return [
    {
      id: 'med_1', name: 'Insuline Lispro (Humalog)', dosage: 'selon schéma',
      frequency: 'avant chaque repas', startDate: now - 365 * DAY,
      prescribedBy: 'Dr. M. Renaud', active: true,
    },
    {
      id: 'med_2', name: 'Insuline Glargine (Lantus)', dosage: '18 UI',
      frequency: '1 fois/jour (22h)', startDate: now - 365 * DAY,
      prescribedBy: 'Dr. M. Renaud', active: true,
    },
    {
      id: 'med_3', name: 'Metformine 1000mg', dosage: '1000 mg',
      frequency: '2 fois/jour (matin, soir)', startDate: now - 180 * DAY,
      prescribedBy: 'Dr. M. Renaud', active: true,
    },
  ];
}

// ----------------------------------------------------------------------------
// STATISTIQUES PATIENT (résumé 14 jours)
// ----------------------------------------------------------------------------

export function getPatientStats() {
  return {
    avgGlucose: 142,
    gmi: 6.7,            // Glucose Management Indicator
    cv: 32,              // Coefficient of variation (%)
    timeActive: 87,      // % temps capteur actif
    eventsLogged: 42,    // Nb évènements derniers 7j
    daysWithData: 14,
  };
}

// ============================================================================
// v3.1.0 — PLAGES TEMPORELLES (sélecteur historique)
// ============================================================================

export const TIME_RANGES: TimeRangeOption[] = [
  { key: 'live', label: 'Live',  description: 'Temps réel (60 min)', durationMs: 60 * 60 * 1000,            bucketMs: 60 * 1000,        isLive: true  },
  { key: 'h1',   label: 'H-1',   description: 'Dernière heure',     durationMs: 60 * 60 * 1000,            bucketMs: 60 * 1000,        isLive: false },
  { key: 'h6',   label: 'H-6',   description: '6 dernières heures', durationMs: 6 * HOUR,                  bucketMs: 5 * 60 * 1000,    isLive: false },
  { key: 'd1',   label: 'J-1',   description: 'Dernières 24h',      durationMs: DAY,                       bucketMs: 15 * 60 * 1000,   isLive: false },
  { key: 'd7',   label: 'J-7',   description: '7 derniers jours',   durationMs: 7 * DAY,                   bucketMs: 60 * 60 * 1000,   isLive: false },
  { key: 'm1',   label: 'M-1',   description: '30 derniers jours',  durationMs: 30 * DAY,                  bucketMs: 6 * HOUR,         isLive: false },
  { key: 'm3',   label: 'M-3',   description: '90 derniers jours',  durationMs: 90 * DAY,                  bucketMs: 24 * HOUR,        isLive: false },
];

export function getTimeRange(key: TimeRangeKey): TimeRangeOption {
  return TIME_RANGES.find(r => r.key === key) ?? TIME_RANGES[0];
}

// Génère une série glycémique historique réaliste (déterministe par seed)
export function generateHistoricalGlucose(rangeKey: TimeRangeKey, seed = 1): Array<{ timestamp: number; glucose: number; }> {
  const range = getTimeRange(rangeKey);
  const now = Date.now();
  const start = now - range.durationMs;
  const points: Array<{ timestamp: number; glucose: number; }> = [];
  const buckets = Math.min(300, Math.floor(range.durationMs / range.bucketMs));
  const step = range.durationMs / buckets;

  // Générateur pseudo-aléatoire seedé
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  for (let i = 0; i <= buckets; i++) {
    const ts = start + i * step;
    const date = new Date(ts);
    const hour = date.getHours() + date.getMinutes() / 60;

    // Profil journalier (post-prandial, nuit)
    let base = 130;
    if (hour >= 7 && hour <= 9.5) base = 160 + 20 * Math.sin((hour - 7) * Math.PI / 2.5);
    else if (hour >= 12 && hour <= 14.5) base = 170 + 25 * Math.sin((hour - 12) * Math.PI / 2.5);
    else if (hour >= 19 && hour <= 21.5) base = 165 + 22 * Math.sin((hour - 19) * Math.PI / 2.5);
    else if (hour >= 1 && hour <= 5) base = 105 - 5 * rand();
    else if (hour >= 22 || hour < 1) base = 120;

    const noise = (rand() - 0.5) * 18;
    const glucose = Math.max(55, Math.min(280, Math.round(base + noise)));
    points.push({ timestamp: ts, glucose });
  }

  return points;
}

// ============================================================================
// v3.1.0 — JOURNAL HISTORIQUE (clinicien)
// Aggrège alertes + recommandations + événements pour un patient
// ============================================================================

export function generateHistoricalEntries(patientId: string, daysBack = 7): HistoricalEntry[] {
  const now = Date.now();
  const entries: HistoricalEntry[] = [];
  let id = 0;

  const push = (e: Omit<HistoricalEntry, 'id' | 'patientId'>) => {
    entries.push({ id: `hist_${id++}`, patientId, ...e });
  };

  // Génère un historique réaliste sur N jours
  for (let d = 0; d < daysBack; d++) {
    const dayStart = new Date(now - d * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const base = dayStart.getTime();

    // === ALERTES ===
    // Alerte hypo nocturne (1 fois sur 3)
    if (d % 3 === 0) {
      push({
        type: 'alert', timestamp: base + 3 * HOUR + Math.round(Math.random() * HOUR),
        severity: 'high', module: 'CGM',
        title: 'Hypoglycémie nocturne détectée',
        summary: 'Glycémie 58 mg/dL pendant 22 min — seuil critique <70 mg/dL franchi',
        metricValue: 58, metricUnit: 'mg/dL',
        acknowledged: true, acknowledgedBy: 'Dr. M. Renaud',
        traceId: `TRC-${1000 + d * 7}`,
      });
    }

    // Alerte hyper post-prandiale (la plupart des jours)
    if (d !== 1) {
      push({
        type: 'alert', timestamp: base + 14 * HOUR + Math.round(Math.random() * HOUR),
        severity: 'medium', module: 'CGM',
        title: 'Hyperglycémie post-prandiale',
        summary: 'Pic glycémique à 245 mg/dL 90 min après déjeuner',
        metricValue: 245, metricUnit: 'mg/dL',
        acknowledged: d > 0, acknowledgedBy: d > 0 ? 'Dr. M. Renaud' : undefined,
        traceId: `TRC-${1100 + d * 7}`,
      });
    }

    // === RECOMMANDATIONS ===
    push({
      type: 'recommendation', timestamp: base + 14 * HOUR + 5 * 60 * 1000,
      severity: 'medium', module: 'AI Engine',
      title: 'Recommandation post-déjeuner',
      summary: 'Modèle ensembliste calibré ADA — confiance 87%',
      recommendationAction: 'Marche modérée 15-20 min recommandée pour réduire pic glycémique',
      outcomeStatus: d > 0 ? 'accepted' : 'pending',
      traceId: `TRC-${2000 + d * 7}`,
    });

    if (d % 2 === 0) {
      push({
        type: 'recommendation', timestamp: base + 19 * HOUR,
        severity: 'low', module: 'AI Engine',
        title: 'Ajustement bolus dîner suggéré',
        summary: 'Tendance glycémique élevée détectée sur 3 derniers jours',
        recommendationAction: 'Augmenter bolus dîner de 1U (8U → 9U)',
        outcomeStatus: d > 1 ? 'modified' : 'pending',
        traceId: `TRC-${2100 + d * 7}`,
      });
    }

    // === DÉCISIONS CLINICIEN ===
    if (d === 2) {
      push({
        type: 'decision', timestamp: base + 10 * HOUR,
        severity: 'info', module: 'Clinicien',
        title: 'Plan de soins ajusté',
        summary: 'Ratio insuline/glucides repas du soir modifié : 1U/10g → 1U/9g',
        outcomeStatus: 'accepted',
        acknowledgedBy: 'Dr. M. Renaud',
      });
    }

    // === ÉVÉNEMENTS PATIENT MARQUANTS ===
    if (d % 4 === 0) {
      push({
        type: 'event', timestamp: base + 16 * HOUR,
        severity: 'info', module: 'Patient',
        title: 'Activité physique enregistrée',
        summary: 'Course 35 min · intensité modérée · 4.2 km',
      });
    }
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================================
// v3.1.0 — DÉCISIONS CLINIQUES EN COURS (proposées par l'IA)
// ============================================================================

export function getPendingDecisions(patientId: string): PendingClinicalDecision[] {
  const now = Date.now();
  return [
    {
      id: 'decision_1', patientId,
      createdAt: now - 12 * 60 * 1000,
      expiresAt: now + 4 * HOUR,
      triggerReason: 'Risque d\'hypoglycémie prédit dans 30 minutes (probabilité 78%)',
      aiRecommendation: 'Réduire bolus dîner de 2U (de 8U à 6U) ou prévoir collation 15g glucides à 18h45',
      aiConfidence: 0.87,
      riskLevel: 'HIGH',
      contextSnapshot: {
        glucose: 142,
        glucoseTrend: 'falling',
        timeInRange24h: 71,
        activeInsulin: 3.5,
        lastMealCarbs: 60,
        lastMealAgoMin: 175,
      },
      reasoning: [
        'Tendance glycémique descendante depuis 45 min (−18 mg/dL)',
        'Insuline active résiduelle élevée (3.5U) sur dernier repas',
        'Profil patient : 2 hypos nocturnes sur 7 derniers jours',
        'Historique : ratio 1U/10g insuffisamment couvrant en soirée',
      ],
      alternativeOptions: [
        { label: 'Maintenir bolus + collation 15g', risk: 'lower',   rationale: 'Sécurise sans réduire couverture du repas' },
        { label: 'Réduire bolus de 1U seulement',   risk: 'similar', rationale: 'Compromis si appétit élevé' },
        { label: 'Aucune action',                    risk: 'higher',  rationale: 'Risque d\'hypo nocturne maintenu' },
      ],
      status: 'pending',
    },
    {
      id: 'decision_2', patientId,
      createdAt: now - 2 * HOUR,
      expiresAt: now + 8 * HOUR,
      triggerReason: 'Tendance hyperglycémique post-prandiale persistante (3 jours)',
      aiRecommendation: 'Réviser ratio insuline/glucides repas midi : 1U/10g → 1U/8g',
      aiConfidence: 0.74,
      riskLevel: 'MODERATE',
      contextSnapshot: {
        glucose: 195,
        glucoseTrend: 'stable',
        timeInRange24h: 64,
        activeInsulin: 1.2,
      },
      reasoning: [
        'Pics post-déjeuner > 220 mg/dL sur 3 jours consécutifs',
        'TIR midi-15h en baisse de 12 points cette semaine',
        'Ratio actuel insuffisant pour repas riches en glucides complexes',
      ],
      alternativeOptions: [
        { label: 'Maintenir + conseils diététiques', risk: 'similar', rationale: 'Approche éducative d\'abord' },
        { label: 'Bolus pré-prandial avancé (15 min)', risk: 'lower', rationale: 'Améliore courbe sans changer ratio' },
      ],
      status: 'pending',
    },
  ];
}
