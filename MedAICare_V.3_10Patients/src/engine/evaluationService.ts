// ============================================================================
// EVALUATION SERVICE — Infrastructure d'évaluation XAI (objectif O4)
// ----------------------------------------------------------------------------
// Source : prototype académique. Ce service capture des réponses Likert et
// gère l'assignation A/B (cohorte avec ou sans explication visible) pour
// permettre une étude utilisateur ultérieure. Les données restent en
// localStorage (clé `mediai_evaluation_v1`) et ne sont JAMAIS envoyées à un
// serveur dans cette version. L'identifiant clinicien est anonymisé localement
// (pseudonyme aléatoire stable, ne contient ni e-mail ni nom).
// ============================================================================

export type Cohort = 'A' | 'B';
export type DecisionAction = 'applied' | 'modified' | 'dismissed';

export interface LikertResponses {
  /** Q1 — Confiance dans la recommandation IA (1=Pas du tout, 5=Totalement). */
  trustAI: number;
  /** Q2 — Clarté des explications fournies (1=Très peu claires, 5=Très claires). */
  explanationClarity: number;
  /** Q3 — Utilité perçue pour la décision (1=Inutile, 5=Très utile). */
  usefulness: number;
  /** Q4 — Effet sur le temps de décision (1=Ralenti, 5=Très accéléré). */
  timeToDecide: number;
  /** Q5 — Recommanderiez-vous cet outil en pratique (1=Non, 5=Oui absolument). */
  wouldUseInPractice: number;
}

export interface EvaluationEntry {
  id: string;
  timestamp: number;
  /** Pseudonyme stable, jamais l'e-mail. */
  anonymousActorId: string;
  /** A = recommandation IA AVEC explications visibles. B = sans. */
  cohort: Cohort;
  /** Spécialité conservée pour stratification (pas un identifiant). */
  actorSpecialty?: string;
  /** Identifiant de la décision concernée (sans données patient). */
  decisionId: string;
  /** Action arbitrée par le clinicien sur la suggestion IA. */
  decisionAction: DecisionAction;
  /** Réponses au questionnaire Likert. */
  responses: LikertResponses;
  /** Commentaire libre optionnel. */
  freeComment?: string;
}

interface ActorRecord {
  anonymousId: string;
  cohort: Cohort;
  createdAt: number;
}

interface EvaluationStore {
  schemaVersion: 1;
  /** Map e-mail clinicien → pseudonyme + cohorte. Reste local. */
  actors: Record<string, ActorRecord>;
  entries: EvaluationEntry[];
  /** Override manuel de cohorte (pour démonstration / debug). */
  cohortOverride: Cohort | null;
}

export const EVALUATION_STORAGE_KEY = 'mediai_evaluation_v1';
export const EVALUATION_CHANGE_EVENT = 'mediai:evaluation';

const EMPTY_STORE: EvaluationStore = {
  schemaVersion: 1,
  actors: {},
  entries: [],
  cohortOverride: null,
};

/**
 * Hash FNV-1a 32 bits → hex 8 caractères. Usage : pseudonymiser l'e-mail
 * clinicien dans la map `actors` afin que **même la clé** ne contienne
 * aucune PII en clair dans `localStorage`. Non-cryptographique mais
 * suffisant pour un prototype académique purement local (jamais envoyé).
 */
function hashEmail(emailLower: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < emailLower.length; i++) {
    h ^= emailLower.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Mix supplémentaire pour réduire les collisions évidentes
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return `h_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

function safeRandomId(prefix: string): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return `${prefix}_${globalThis.crypto.randomUUID()}`;
    }
  } catch {
    /* fallthrough */
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readStore(): EvaluationStore {
  try {
    const raw = localStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!raw) return { ...EMPTY_STORE };
    const parsed = JSON.parse(raw) as Partial<EvaluationStore>;
    return {
      schemaVersion: 1,
      actors: parsed.actors ?? {},
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      cohortOverride:
        parsed.cohortOverride === 'A' || parsed.cohortOverride === 'B'
          ? parsed.cohortOverride
          : null,
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function writeStore(store: EvaluationStore): { persisted: boolean; error?: string } {
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(store));
    try {
      window.dispatchEvent(new CustomEvent(EVALUATION_CHANGE_EVENT));
    } catch {
      /* SSR safe */
    }
    return { persisted: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown storage error';
    return { persisted: false, error: msg };
  }
}

/** Renvoie (ou crée) le pseudonyme et la cohorte associés à un e-mail clinicien.
 *  La clé de stockage est le **hash** de l'e-mail (pas l'e-mail en clair). */
export function getOrCreateActor(actorEmail: string): ActorRecord {
  if (!actorEmail) {
    return {
      anonymousId: safeRandomId('anon'),
      cohort: Math.random() < 0.5 ? 'A' : 'B',
      createdAt: Date.now(),
    };
  }
  const key = hashEmail(actorEmail.toLowerCase());
  const store = readStore();
  const existing = store.actors[key];
  if (existing) return existing;
  const created: ActorRecord = {
    anonymousId: safeRandomId('anon'),
    // Assignation alternée pour minimiser le biais de cohorte.
    cohort: (Object.keys(store.actors).length % 2 === 0 ? 'A' : 'B') as Cohort,
    createdAt: Date.now(),
  };
  store.actors[key] = created;
  writeStore(store);
  return created;
}

/** Cohorte effective : override admin > assignation par actor. */
export function getEffectiveCohort(actorEmail?: string): Cohort {
  const store = readStore();
  if (store.cohortOverride) return store.cohortOverride;
  if (!actorEmail) return 'A';
  return getOrCreateActor(actorEmail).cohort;
}

export function setCohortOverride(cohort: Cohort | null): void {
  const store = readStore();
  store.cohortOverride = cohort;
  writeStore(store);
}

export function getCohortOverride(): Cohort | null {
  return readStore().cohortOverride;
}

/** Indique si **au moins un acteur** a déjà soumis une évaluation pour cette décision.
 *  Utile pour des stats globales — pas pour piloter l'UI multi-acteurs. */
export function hasEvaluationFor(decisionId: string): boolean {
  return readStore().entries.some((e) => e.decisionId === decisionId);
}

/** Indique si **cet acteur précis** a déjà évalué cette décision.
 *  À utiliser pour piloter l'affichage du panneau dans l'UI clinicien. */
export function hasEvaluationForActor(actorEmail: string, decisionId: string): boolean {
  if (!actorEmail || !decisionId) return false;
  const store = readStore();
  const actor = store.actors[hashEmail(actorEmail.toLowerCase())];
  if (!actor) return false;
  return store.entries.some(
    (e) => e.decisionId === decisionId && e.anonymousActorId === actor.anonymousId,
  );
}

export interface RecordResult {
  persisted: boolean;
  entry?: EvaluationEntry;
  error?: string;
}

interface RecordInput {
  actorEmail: string;
  actorSpecialty?: string;
  decisionId: string;
  decisionAction: DecisionAction;
  responses: LikertResponses;
  freeComment?: string;
}

function isValidLikert(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
}

export function recordEvaluation(input: RecordInput): RecordResult {
  const { actorEmail, actorSpecialty, decisionId, decisionAction, responses, freeComment } = input;
  if (!decisionId) return { persisted: false, error: 'decisionId requis' };
  const fields: (keyof LikertResponses)[] = [
    'trustAI',
    'explanationClarity',
    'usefulness',
    'timeToDecide',
    'wouldUseInPractice',
  ];
  for (const f of fields) {
    if (!isValidLikert(responses[f])) {
      return { persisted: false, error: `Réponse Likert invalide : ${f}` };
    }
  }
  const actor = getOrCreateActor(actorEmail);
  const store = readStore();
  if (store.entries.some((e) => e.decisionId === decisionId && e.anonymousActorId === actor.anonymousId)) {
    return { persisted: false, error: 'Une évaluation existe déjà pour cette décision.' };
  }
  const entry: EvaluationEntry = {
    id: safeRandomId('ev'),
    timestamp: Date.now(),
    anonymousActorId: actor.anonymousId,
    cohort: store.cohortOverride ?? actor.cohort,
    actorSpecialty,
    decisionId,
    decisionAction,
    responses,
    freeComment: freeComment?.trim() ? freeComment.trim() : undefined,
  };
  store.entries.unshift(entry);
  const r = writeStore(store);
  if (!r.persisted) return { persisted: false, error: r.error };
  return { persisted: true, entry };
}

export function getAllEvaluations(): EvaluationEntry[] {
  return readStore().entries;
}

export interface CohortStats {
  total: number;
  cohortA: number;
  cohortB: number;
  avgByCohort: { A: Partial<Record<keyof LikertResponses, number>>; B: Partial<Record<keyof LikertResponses, number>> };
}

export function getCohortStats(): CohortStats {
  const entries = getAllEvaluations();
  const result: CohortStats = {
    total: entries.length,
    cohortA: 0,
    cohortB: 0,
    avgByCohort: { A: {}, B: {} },
  };
  const sums: Record<Cohort, Record<keyof LikertResponses, number>> = {
    A: { trustAI: 0, explanationClarity: 0, usefulness: 0, timeToDecide: 0, wouldUseInPractice: 0 },
    B: { trustAI: 0, explanationClarity: 0, usefulness: 0, timeToDecide: 0, wouldUseInPractice: 0 },
  };
  const counts: Record<Cohort, number> = { A: 0, B: 0 };
  for (const e of entries) {
    counts[e.cohort] += 1;
    (Object.keys(sums[e.cohort]) as (keyof LikertResponses)[]).forEach((k) => {
      sums[e.cohort][k] += e.responses[k];
    });
  }
  result.cohortA = counts.A;
  result.cohortB = counts.B;
  (['A', 'B'] as Cohort[]).forEach((c) => {
    if (counts[c] > 0) {
      (Object.keys(sums[c]) as (keyof LikertResponses)[]).forEach((k) => {
        result.avgByCohort[c][k] = Math.round((sums[c][k] / counts[c]) * 100) / 100;
      });
    }
  });
  return result;
}

export function exportEvaluationsAsJSON(): string {
  const store = readStore();
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      cohortOverride: store.cohortOverride,
      entries: store.entries,
      stats: getCohortStats(),
    },
    null,
    2,
  );
}

/** Réservé aux tests / réinitialisation manuelle. */
export function clearAllEvaluations(): void {
  try {
    localStorage.removeItem(EVALUATION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVALUATION_CHANGE_EVENT));
  } catch {
    /* noop */
  }
}
