// ============================================================================
// DECISION LOG — Traçabilité SaMD des actions cliniciens sur alertes
// Persistance localStorage. Append-only. Trace-ID unique par action.
// Note SaMD : journal local non-autoritaire (démo). En prod, brancher API
// + signature serveur. Le clé combine (patientId, decisionId) car les IDs
// de décision sont réutilisés entre patients dans le générateur.
// ============================================================================

const STORAGE_KEY = 'mediai.decisionLog.v1';

export type DecisionAction = 'applied' | 'modified' | 'dismissed';

export interface DecisionLogEntry {
  traceId: string;             // ID unique (uuid v4-like)
  decisionId: string;          // ID de PendingClinicalDecision
  patientId: string;           // Combiné avec decisionId pour la clé logique
  action: DecisionAction;
  appliedRecommendation: string;
  actorEmail: string;
  actorName: string;
  actorSpecialty?: string;
  timestamp: number;
  rationale?: string;
}

export interface LogResult {
  entry: DecisionLogEntry;
  persisted: boolean;          // false = écriture localStorage a échoué
  error?: string;
}

function genTraceId(): string {
  const rnd = (n: number) => Math.random().toString(16).slice(2, 2 + n).padEnd(n, '0');
  return `tr-${rnd(8)}-${rnd(4)}-4${rnd(3)}-${rnd(4)}-${rnd(12)}`;
}

function readAll(): DecisionLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as DecisionLogEntry[] : [];
  } catch {
    return [];
  }
}

/**
 * Tente d'écrire en re-lisant juste avant pour atténuer les races multi-onglets.
 * Retourne true uniquement si l'écriture est observable après-coup.
 */
function safeAppend(entry: DecisionLogEntry): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Re-lire juste avant pour merger d'autres onglets éventuels
    const fresh = readAll();
    fresh.push(entry);
    const trimmed = fresh.length > 500 ? fresh.slice(-500) : fresh;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    // Vérifier la présence après écriture
    const verify = readAll();
    return verify.some(e => e.traceId === entry.traceId);
  } catch {
    return false;
  }
}

/**
 * Append a decision to the log. Returns { entry, persisted } so the UI
 * can render an honest status (no false traceability claim).
 */
export function logDecision(input: Omit<DecisionLogEntry, 'traceId' | 'timestamp'>): LogResult {
  const entry: DecisionLogEntry = {
    ...input,
    traceId: genTraceId(),
    timestamp: Date.now(),
  };
  const persisted = safeAppend(entry);
  // Notify same-tab listeners (storage event only fires cross-tab).
  if (persisted && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('mediai:decisionlog', { detail: { entry } }));
    } catch { /* ignore */ }
  }
  return persisted
    ? { entry, persisted: true }
    : { entry, persisted: false, error: 'Écriture journal locale impossible (quota ou navigation privée).' };
}

/** Get all decision log entries, newest first. */
export function getDecisionLog(): DecisionLogEntry[] {
  return readAll().sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Latest action for a given (patientId, decisionId) pair.
 * IMPORTANT: keying must be combined because PendingClinicalDecision ids
 * (decision_1, decision_2…) are reused across patients in the simulator.
 */
export function getLatestActionFor(patientId: string, decisionId: string): DecisionLogEntry | null {
  const matches = readAll().filter(e => e.decisionId === decisionId && e.patientId === patientId);
  if (!matches.length) return null;
  return matches.sort((a, b) => b.timestamp - a.timestamp)[0];
}

/** Storage key constant for cross-tab subscription. */
export const DECISION_LOG_STORAGE_KEY = STORAGE_KEY;
