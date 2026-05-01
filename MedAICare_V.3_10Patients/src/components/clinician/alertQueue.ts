// ============================================================================
// alertQueue · Source unique de vérité pour la file d'alertes ACTIVES
// Filtre les décisions déjà arbitrées via le journal d'audit (decisionLog).
// Utilisé par TriageView, ClinicianHub (compteur), FocusView (strip patient).
// ============================================================================

import type { PendingClinicalDecision, Patient } from '../../types/medical';
import { getSimulatedPatients } from '../../engine/simulator';
import { getPendingDecisions } from '../../engine/patient-data';
import { getLatestActionFor } from '../../engine/decisionLog';

/** Décisions encore réellement en attente pour un patient (non arbitrées). */
export function getActivePendingDecisions(patientId: string): PendingClinicalDecision[] {
  return getPendingDecisions(patientId).filter(d => !getLatestActionFor(patientId, d.id));
}

export interface QueueEntry {
  patient: Patient;
  decision: PendingClinicalDecision;
  decisions: PendingClinicalDecision[];
}

const RISK_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3,
};

/** File d'alertes triée par risque puis par expiration imminente. */
export function buildAlertQueue(): QueueEntry[] {
  const patients = getSimulatedPatients();
  return patients
    .map(p => {
      const decisions = getActivePendingDecisions(p.id);
      if (decisions.length === 0) return null;
      return { patient: p, decision: decisions[0], decisions };
    })
    .filter((x): x is QueueEntry => x !== null)
    .sort((a, b) => {
      const r = (RISK_ORDER[a.decision.riskLevel] ?? 9) - (RISK_ORDER[b.decision.riskLevel] ?? 9);
      if (r !== 0) return r;
      return a.decision.expiresAt - b.decision.expiresAt;
    });
}

/** Nombre de patients avec au moins une décision active. */
export function getActiveAlertCount(): number {
  const patients = getSimulatedPatients();
  let n = 0;
  for (const p of patients) {
    if (getActivePendingDecisions(p.id).length > 0) n++;
  }
  return n;
}
