import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActivePendingDecisions,
  buildAlertQueue,
  getActiveAlertCount,
} from './alertQueue';
import { logDecision } from '../../engine/decisionLog';
import { getSimulatedPatients } from '../../engine/simulator';

const RISK_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MODERATE: 2,
  LOW: 3,
};

function arbitrate(patientId: string, decisionId: string) {
  logDecision({
    decisionId,
    patientId,
    action: 'applied',
    appliedRecommendation: 'test',
    actorEmail: 'doc@x.fr',
    actorName: 'Dr Test',
  });
}

describe('alertQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getActivePendingDecisions', () => {
    it('returns decisions for a known patient when none have been arbitrated', () => {
      const patients = getSimulatedPatients();
      expect(patients.length).toBeGreaterThan(0);
      const id = patients[0].id;
      const initial = getActivePendingDecisions(id);
      expect(initial.length).toBeGreaterThan(0);
    });

    it('removes a decision once it has been logged', () => {
      const id = getSimulatedPatients()[0].id;
      const initial = getActivePendingDecisions(id);
      const initialCount = initial.length;
      arbitrate(id, initial[0].id);
      const after = getActivePendingDecisions(id);
      expect(after.length).toBe(initialCount - 1);
      expect(after.some((d) => d.id === initial[0].id)).toBe(false);
    });

    it('isolates arbitration per patient (no cross-patient leak)', () => {
      const [a, b] = getSimulatedPatients();
      const decId = getActivePendingDecisions(a.id)[0].id;
      arbitrate(a.id, decId);
      expect(getActivePendingDecisions(a.id).some((d) => d.id === decId)).toBe(false);
      expect(getActivePendingDecisions(b.id).some((d) => d.id === decId)).toBe(true);
    });
  });

  describe('buildAlertQueue', () => {
    it('returns one entry per patient that still has at least one pending decision', () => {
      const patients = getSimulatedPatients();
      const queue = buildAlertQueue();
      expect(queue.length).toBe(patients.length);
    });

    it('is sorted by risk level (CRITICAL → HIGH → MODERATE → LOW)', () => {
      const queue = buildAlertQueue();
      for (let i = 1; i < queue.length; i++) {
        const prev = RISK_ORDER[queue[i - 1].decision.riskLevel] ?? 9;
        const curr = RISK_ORDER[queue[i].decision.riskLevel] ?? 9;
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('exposes the full list of remaining decisions for each patient', () => {
      const queue = buildAlertQueue();
      for (const entry of queue) {
        expect(entry.decisions.length).toBeGreaterThan(0);
        expect(entry.decisions[0]).toEqual(entry.decision);
      }
    });

    it('drops a patient from the queue once all their decisions are arbitrated', () => {
      const patients = getSimulatedPatients();
      const target = patients[0].id;
      for (const d of getActivePendingDecisions(target)) {
        arbitrate(target, d.id);
      }
      const queue = buildAlertQueue();
      expect(queue.some((q) => q.patient.id === target)).toBe(false);
      expect(queue.length).toBe(patients.length - 1);
    });
  });

  describe('getActiveAlertCount', () => {
    it('matches the queue size when no arbitration has happened', () => {
      expect(getActiveAlertCount()).toBe(buildAlertQueue().length);
    });

    it('decreases by exactly one once a patient is fully arbitrated', () => {
      const initial = getActiveAlertCount();
      const target = getSimulatedPatients()[0].id;
      for (const d of getActivePendingDecisions(target)) {
        arbitrate(target, d.id);
      }
      expect(getActiveAlertCount()).toBe(initial - 1);
    });

    it('stays unchanged when only one of several decisions is arbitrated', () => {
      const initial = getActiveAlertCount();
      const target = getSimulatedPatients()[0].id;
      const first = getActivePendingDecisions(target)[0];
      arbitrate(target, first.id);
      expect(getActiveAlertCount()).toBe(initial);
    });
  });
});
