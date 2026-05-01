import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logDecision,
  getDecisionLog,
  getLatestActionFor,
  DECISION_LOG_STORAGE_KEY,
} from './decisionLog';

const baseEntry = {
  decisionId: 'decision_1',
  patientId: 'PAT-001',
  action: 'applied' as const,
  appliedRecommendation: 'Augmenter basal +10%',
  actorEmail: 'doc@x.fr',
  actorName: 'Dr Test',
};

describe('decisionLog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('logDecision', () => {
    it('appends an entry with a generated traceId and timestamp', () => {
      const before = Date.now();
      const r = logDecision(baseEntry);
      expect(r.persisted).toBe(true);
      expect(r.entry.traceId).toMatch(/^tr-/);
      expect(r.entry.timestamp).toBeGreaterThanOrEqual(before);
    });

    it('produces unique traceIds across calls', () => {
      const a = logDecision(baseEntry);
      const b = logDecision(baseEntry);
      const c = logDecision(baseEntry);
      const ids = new Set([a.entry.traceId, b.entry.traceId, c.entry.traceId]);
      expect(ids.size).toBe(3);
    });

    it('persists into the documented localStorage key', () => {
      logDecision(baseEntry);
      const raw = localStorage.getItem(DECISION_LOG_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].decisionId).toBe('decision_1');
    });

    it('dispatches a mediai:decisionlog CustomEvent on success', () => {
      const handler = vi.fn();
      window.addEventListener('mediai:decisionlog', handler);
      logDecision(baseEntry);
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener('mediai:decisionlog', handler);
    });

    it('returns persisted=false with an error message when storage throws', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('quota');
      };
      const r = logDecision(baseEntry);
      Storage.prototype.setItem = original;
      expect(r.persisted).toBe(false);
      expect(r.error).toBeTruthy();
    });
  });

  describe('getDecisionLog', () => {
    it('returns an empty array when nothing has been logged', () => {
      expect(getDecisionLog()).toEqual([]);
    });

    it('returns all entries newest first', async () => {
      logDecision({ ...baseEntry, decisionId: 'd1' });
      await new Promise((r) => setTimeout(r, 5));
      logDecision({ ...baseEntry, decisionId: 'd2' });
      await new Promise((r) => setTimeout(r, 5));
      logDecision({ ...baseEntry, decisionId: 'd3' });

      const all = getDecisionLog();
      expect(all).toHaveLength(3);
      expect(all[0].decisionId).toBe('d3');
      expect(all[2].decisionId).toBe('d1');
    });
  });

  describe('getLatestActionFor', () => {
    it('returns null when no entry matches', () => {
      expect(getLatestActionFor('PAT-999', 'decision_99')).toBeNull();
    });

    it('keys correctly on the (patientId, decisionId) pair (no cross-patient leak)', () => {
      logDecision({ ...baseEntry, patientId: 'PAT-001', decisionId: 'decision_1' });
      logDecision({ ...baseEntry, patientId: 'PAT-002', decisionId: 'decision_1' });

      const a = getLatestActionFor('PAT-001', 'decision_1');
      const b = getLatestActionFor('PAT-002', 'decision_1');
      expect(a?.patientId).toBe('PAT-001');
      expect(b?.patientId).toBe('PAT-002');
      expect(a?.traceId).not.toBe(b?.traceId);
    });

    it('returns the most recent matching entry when several exist', async () => {
      logDecision({ ...baseEntry, action: 'applied' });
      await new Promise((r) => setTimeout(r, 5));
      logDecision({ ...baseEntry, action: 'modified' });
      await new Promise((r) => setTimeout(r, 5));
      logDecision({ ...baseEntry, action: 'dismissed' });

      const latest = getLatestActionFor(baseEntry.patientId, baseEntry.decisionId);
      expect(latest?.action).toBe('dismissed');
    });
  });
});
