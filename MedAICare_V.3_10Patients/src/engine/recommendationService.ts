import type { PatientVitals } from '../types/medical';

export interface ClinicalSuggestion {
  id: string;
  type: string;
  title: string;
  condition: string;
  message_patient?: string;
  action: string;
  evidence: 'A' | 'B' | 'C' | 'E';
  level: 'PATIENT' | 'CLINICIAN';
  status: 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED';
  timestamp: number;
}

export function generateRecommendations(vitals: PatientVitals, isClinic: boolean): ClinicalSuggestion[] {
  const recs: ClinicalSuggestion[] = [];
  const now = Date.now();
  let idCount = 0;

  // NIVEAU 1 - RECOMMANDATIONS PATIENT
  if (vitals.glucose >= 70 && vitals.glucose <= 90) {
    recs.push({
      id: `REC-${now}-${idCount++}`,
      type: 'R_VIGILANCE_HYPO',
      title: 'Vigilance Hypoglycémie',
      condition: 'p_hypo_30 ∈ [0.30, 0.50[',
      message_patient: "Votre glycémie pourrait baisser dans les prochaines minutes. Gardez une collation à portée de main et évitez l'activité physique intense.",
      action: 'Surveillance à court terme et collation préventive',
      evidence: 'A',
      level: 'PATIENT',
      status: 'PENDING',
      timestamp: now,
    });
  }

  if (vitals.glucose < 70) {
    recs.push({
      id: `REC-${now}-${idCount++}`,
      type: 'R_ALERTE_HYPO',
      title: 'Alerte Hypoglycémie',
      condition: 'p_hypo_30 >= 0.50 OU cgm_current < 70',
      message_patient: "Risque d'hypoglycémie. Prenez immédiatement 15g de glucides rapides (jus sucré, resucrage). Revérifiez dans 15 minutes. Si les symptômes persistent, contactez votre médecin ou les urgences.",
      action: 'Resucrage immédiat + revérification',
      evidence: 'A',
      level: 'PATIENT',
      status: 'PENDING',
      timestamp: now,
    });
  }

  if (vitals.glucose >= 180 && vitals.glucose < 250) {
    recs.push({
      id: `REC-${now}-${idCount++}`,
      type: 'R_VIGILANCE_HYPER',
      title: 'Vigilance Hyperglycémie',
      condition: 'p_hyper_30 ∈ [0.30, 0.50[',
      message_patient: "Votre glycémie augmente. Hydratez-vous bien, évitez les glucides rapides, et si possible, faites de l'activité physique légère.",
      action: 'Hydratation + activité légère',
      evidence: 'B',
      level: 'PATIENT',
      status: 'PENDING',
      timestamp: now,
    });
  }

  if (vitals.glucose >= 250) {
    recs.push({
      id: `REC-${now}-${idCount++}`,
      type: 'R_ALERTE_HYPER',
      title: 'Alerte Hyperglycémie',
      condition: 'p_hyper_30 >= 0.50 OU cgm_current >= 250',
      message_patient: "Hyperglycémie sévère. Vérifiez avec une mesure capillaire. Si confirmée, contactez votre clinicien.",
      action: 'Vérification + contact clinicien',
      evidence: 'A',
      level: 'PATIENT',
      status: 'PENDING',
      timestamp: now,
    });
  }

  // NIVEAU 2 - SUGGESTIONS CLINIQUES AVANCÉES (Clinician Only)
  if (isClinic) {
    if (vitals.glucose > 180) {
      recs.push({
        id: `REC-${now}-${idCount++}`,
        type: 'SC_BASAL_REVIEW',
        title: 'Réévaluation du schéma basal recommandée',
        condition: 'Hyperglycémies nocturnes fréquentes',
        action: 'Discussion d\'un ajustement du profil basal nocturne lors de la prochaine consultation.',
        evidence: 'A',
        level: 'CLINICIAN',
        status: 'PENDING',
        timestamp: now,
      });
    }

    if (vitals.glucose < 70) {
      recs.push({
        id: `REC-${now}-${idCount++}`,
        type: 'SC_HYPO_PATTERN',
        title: 'Schéma d\'hypoglycémies récurrentes identifié',
        condition: 'Multiples épisodes < 70 mg/dL sur 7 jours',
        action: 'Discussion d\'une stratégie de réduction temporaire de l\'insuline active.',
        evidence: 'A',
        level: 'CLINICIAN',
        status: 'PENDING',
        timestamp: now,
      });
    }
  }

  return recs;
}
