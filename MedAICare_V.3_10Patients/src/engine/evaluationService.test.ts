import { describe, it, expect, beforeEach } from 'vitest';
import {
  EVALUATION_STORAGE_KEY,
  clearAllEvaluations,
  exportEvaluationsAsJSON,
  getAllEvaluations,
  getCohortOverride,
  getCohortStats,
  getEffectiveCohort,
  getOrCreateActor,
  hasEvaluationFor,
  hasEvaluationForActor,
  recordEvaluation,
  setCohortOverride,
  type LikertResponses,
} from './evaluationService';

const VALID: LikertResponses = {
  trustAI: 4,
  explanationClarity: 5,
  usefulness: 4,
  timeToDecide: 3,
  wouldUseInPractice: 5,
};

// Suffixe unique par test pour éviter toute collision d'identifiants
// si la storage de test n'est pas parfaitement isolée entre tests.
let testCounter = 0;
function uniq(prefix: string): string {
  testCounter += 1;
  return `${prefix}-${testCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('evaluationService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllEvaluations();
  });

  describe('getOrCreateActor', () => {
    it('creates a stable anonymous actor record per email (case-insensitive)', () => {
      const email = `${uniq('Doc.A')}@hospital.fr`;
      const a1 = getOrCreateActor(email);
      const a2 = getOrCreateActor(email.toLowerCase());
      expect(a1.anonymousId).toBe(a2.anonymousId);
      expect(['A', 'B']).toContain(a1.cohort);
    });

    it('balances cohorts roughly across distinct actors', () => {
      const cohorts = ['a', 'b', 'c', 'd'].map((e) => getOrCreateActor(`${uniq(e)}@x.fr`).cohort);
      expect(new Set(cohorts).size).toBe(2);
    });

    it('never persists the email in plaintext anywhere in storage', () => {
      const email = `${uniq('alice.dupont')}@hospital.fr`;
      getOrCreateActor(email);
      recordEvaluation({
        actorEmail: email,
        decisionId: uniq('dec'),
        decisionAction: 'applied',
        responses: VALID,
      });
      const raw = localStorage.getItem(EVALUATION_STORAGE_KEY) || '';
      // Ni l'e-mail complet ni la partie locale ne doivent apparaître nulle part
      expect(raw).not.toContain(email);
      expect(raw).not.toContain(email.toLowerCase());
      expect(raw).not.toContain('alice.dupont');
      // Les clés actors doivent être des hashes (préfixe h_) — pas des e-mails
      const parsed = JSON.parse(raw);
      const actorKeys = Object.keys(parsed.actors);
      expect(actorKeys.length).toBeGreaterThanOrEqual(1);
      actorKeys.forEach((k) => expect(k).toMatch(/^h_[0-9a-f]{8}$/));
    });
  });

  describe('cohort override', () => {
    it('returns null by default and respects override A/B/null', () => {
      expect(getCohortOverride()).toBeNull();
      setCohortOverride('B');
      expect(getCohortOverride()).toBe('B');
      expect(getEffectiveCohort(`${uniq('foo')}@x.fr`)).toBe('B');
      setCohortOverride(null);
      expect(getCohortOverride()).toBeNull();
      expect(['A', 'B']).toContain(getEffectiveCohort(`${uniq('foo')}@x.fr`));
    });
  });

  describe('recordEvaluation', () => {
    it('rejects invalid Likert values (out of 1-5 range)', () => {
      const bad = { ...VALID, trustAI: 6 };
      const r = recordEvaluation({
        actorEmail: `${uniq('doc')}@x.fr`,
        decisionId: uniq('dec'),
        decisionAction: 'applied',
        responses: bad,
      });
      expect(r.persisted).toBe(false);
      expect(r.error).toMatch(/trustAI|invalide/i);
    });

    it('rejects empty decisionId', () => {
      const r = recordEvaluation({
        actorEmail: `${uniq('doc')}@x.fr`,
        decisionId: '',
        decisionAction: 'applied',
        responses: VALID,
      });
      expect(r.persisted).toBe(false);
    });

    it('persists a valid evaluation with anonymized actor and current cohort', () => {
      setCohortOverride('A');
      const decisionId = uniq('dec');
      const email = `${uniq('doc')}@x.fr`;
      const r = recordEvaluation({
        actorEmail: email,
        actorSpecialty: 'Endocrinologie',
        decisionId,
        decisionAction: 'applied',
        responses: VALID,
        freeComment: '  bon outil  ',
      });
      expect(r.persisted).toBe(true);
      expect(r.entry?.cohort).toBe('A');
      expect(r.entry?.actorSpecialty).toBe('Endocrinologie');
      expect(r.entry?.anonymousActorId).toMatch(/^anon_/);
      expect(r.entry?.freeComment).toBe('bon outil');
      // L'entrée stockée ne doit JAMAIS contenir l'e-mail
      const entries = getAllEvaluations();
      const storedEntry = entries.find((e) => e.decisionId === decisionId);
      expect(storedEntry).toBeDefined();
      expect(JSON.stringify(storedEntry)).not.toContain(email);
    });

    it('rejects duplicate evaluations for the same (actor, decision)', () => {
      const email = `${uniq('doc')}@x.fr`;
      const decisionId = uniq('dec');
      const first = recordEvaluation({
        actorEmail: email,
        decisionId,
        decisionAction: 'modified',
        responses: VALID,
      });
      expect(first.persisted).toBe(true);
      const second = recordEvaluation({
        actorEmail: email,
        decisionId,
        decisionAction: 'modified',
        responses: VALID,
      });
      expect(second.persisted).toBe(false);
      expect(second.error).toMatch(/déjà/i);
    });

    it('hasEvaluationFor reflects persistence (any actor)', () => {
      const decisionId = uniq('dec');
      expect(hasEvaluationFor(decisionId)).toBe(false);
      recordEvaluation({
        actorEmail: `${uniq('doc')}@x.fr`,
        decisionId,
        decisionAction: 'applied',
        responses: VALID,
      });
      expect(hasEvaluationFor(decisionId)).toBe(true);
    });

    it('hasEvaluationForActor is per-actor (different cliniciens can each evaluate)', () => {
      const decisionId = uniq('dec');
      const docA = `${uniq('docA')}@x.fr`;
      const docB = `${uniq('docB')}@x.fr`;
      expect(hasEvaluationForActor(docA, decisionId)).toBe(false);
      expect(hasEvaluationForActor(docB, decisionId)).toBe(false);
      const r1 = recordEvaluation({
        actorEmail: docA,
        decisionId,
        decisionAction: 'applied',
        responses: VALID,
      });
      expect(r1.persisted).toBe(true);
      expect(hasEvaluationForActor(docA, decisionId)).toBe(true);
      // docB ne doit PAS être considéré comme ayant déjà évalué
      expect(hasEvaluationForActor(docB, decisionId)).toBe(false);
      const r2 = recordEvaluation({
        actorEmail: docB,
        decisionId,
        decisionAction: 'modified',
        responses: VALID,
      });
      expect(r2.persisted).toBe(true);
      expect(hasEvaluationForActor(docB, decisionId)).toBe(true);
    });

    it('hasEvaluationForActor returns false on empty inputs', () => {
      expect(hasEvaluationForActor('', 'd1')).toBe(false);
      expect(hasEvaluationForActor('doc@x.fr', '')).toBe(false);
    });
  });

  describe('getCohortStats + export', () => {
    it('aggregates counts and averages by cohort (delta)', () => {
      const before = getCohortStats();
      setCohortOverride('A');
      recordEvaluation({
        actorEmail: `${uniq('a')}@x.fr`,
        decisionId: uniq('dec'),
        decisionAction: 'applied',
        responses: VALID,
      });
      setCohortOverride('B');
      recordEvaluation({
        actorEmail: `${uniq('b')}@x.fr`,
        decisionId: uniq('dec'),
        decisionAction: 'dismissed',
        responses: { ...VALID, trustAI: 2 },
      });
      const after = getCohortStats();
      expect(after.total - before.total).toBe(2);
      expect(after.cohortA - before.cohortA).toBe(1);
      expect(after.cohortB - before.cohortB).toBe(1);
    });

    it('exportEvaluationsAsJSON produces parseable JSON with stats + entries', () => {
      recordEvaluation({
        actorEmail: `${uniq('a')}@x.fr`,
        decisionId: uniq('dec'),
        decisionAction: 'applied',
        responses: VALID,
      });
      const json = exportEvaluationsAsJSON();
      const parsed = JSON.parse(json);
      expect(parsed.schemaVersion).toBe(1);
      expect(Array.isArray(parsed.entries)).toBe(true);
      expect(parsed.entries.length).toBeGreaterThanOrEqual(1);
      expect(parsed.stats.total).toBeGreaterThanOrEqual(1);
      expect(typeof parsed.exportedAt).toBe('string');
    });

    it('clearAllEvaluations wipes the store', () => {
      recordEvaluation({
        actorEmail: `${uniq('a')}@x.fr`,
        decisionId: uniq('dec'),
        decisionAction: 'applied',
        responses: VALID,
      });
      expect(getAllEvaluations().length).toBeGreaterThanOrEqual(1);
      clearAllEvaluations();
      expect(getAllEvaluations().length).toBe(0);
    });
  });
});
