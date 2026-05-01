// ============================================================================
// FocusView · Patient + décision unique en mode "Salle de contrôle" V3-Dark
// Refactor de l'ancien AlertCenter — accepte maintenant patientId + onBack
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import type { PendingClinicalDecision } from '../../types/medical';
import { getSimulatedPatients } from '../../engine/simulator';
import {
  logDecision, getLatestActionFor,
  DECISION_LOG_STORAGE_KEY,
  type DecisionAction, type DecisionLogEntry,
} from '../../engine/decisionLog';
import { getActivePendingDecisions } from './alertQueue';
import { useAuth } from '../../auth/AuthContext';
import {
  BG, SURFACE, BORDER, AMBER, AMBER_DIM, CYAN, VIOLET, GREEN, RED, MUTED, BRIGHT,
  RISK_COLOR, initials, formatCountdown, timeAgo,
} from './v3DarkTheme';

const XAI_COLORS = [
  { color: CYAN,   glow: 'rgba(0,229,255,0.15)',   icon: '↓' },
  { color: VIOLET, glow: 'rgba(191,90,242,0.12)',  icon: '⚡' },
  { color: GREEN,  glow: 'rgba(48,209,88,0.10)',   icon: '◉' },
];
const XAI_WEIGHTS = [42, 33, 25, 18];

export interface FocusViewProps {
  patientId: string;
  onBack: () => void;
  onSelectPatient: (patientId: string) => void;
}

export default function FocusView({ patientId, onBack, onSelectPatient }: FocusViewProps) {
  const allPatients = useMemo(() => getSimulatedPatients(), []);
  const [logVersion, setLogVersion] = useState(0);

  // Active alert queue (excludes already-arbitrated decisions)
  const alertPatients = useMemo(() =>
    allPatients
      .map(p => ({ patient: p, decisions: getActivePendingDecisions(p.id) }))
      .filter(x => x.decisions.length > 0)
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
        return order[a.decisions[0].riskLevel] - order[b.decisions[0].riskLevel];
      }),
    [allPatients, logVersion]
  );

  const { user } = useAuth();
  const [persistedAction, setPersistedAction] = useState<DecisionLogEntry | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Resolve current patient: STRICT match by prop. No silent fallback.
  // If the requested patient has no active decision, we render an explicit empty state
  // for that exact patient (so we never show data for the wrong person).
  const requestedPatient = useMemo(
    () => allPatients.find(p => p.id === patientId) ?? null,
    [allPatients, patientId]
  );
  const currentMatch = alertPatients.find(x => x.patient.id === patientId);
  const current = currentMatch ?? null;
  const currentPatientId = current?.patient.id;
  const currentDecisionId = current?.decisions[0]?.id;

  useEffect(() => {
    setPersistError(null);
    if (!currentPatientId || !currentDecisionId) { setPersistedAction(null); return; }
    setPersistedAction(getLatestActionFor(currentPatientId, currentDecisionId));
  }, [currentPatientId, currentDecisionId]);

  // Listen for cross-tab + same-tab decision log changes.
  useEffect(() => {
    const onChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== DECISION_LOG_STORAGE_KEY) return;
      setLogVersion(v => v + 1);
      if (currentPatientId && currentDecisionId) {
        setPersistedAction(getLatestActionFor(currentPatientId, currentDecisionId));
      }
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('mediai:decisionlog', onChange as EventListener);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('mediai:decisionlog', onChange as EventListener);
    };
  }, [currentPatientId, currentDecisionId]);

  const decisionStatus: 'pending' | DecisionAction = persistedAction?.action ?? 'pending';

  const handleAction = (action: DecisionAction) => {
    if (!current || !user || persistedAction) return;
    const dec = current.decisions[0];
    const result = logDecision({
      decisionId: dec.id,
      patientId: current.patient.id,
      action,
      appliedRecommendation: dec.aiRecommendation,
      actorEmail: user.email,
      actorName: user.name,
      actorSpecialty: user.specialty,
    });
    if (result.persisted) {
      setPersistedAction(result.entry);
      setPersistError(null);
    } else {
      setPersistError(result.error ?? 'Persistance impossible');
    }
  };

  // ── Empty state #1 : aucun patient n'a d'alerte active ──────────────────
  if (alertPatients.length === 0) {
    return (
      <div style={{
        background: BG, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 18,
      }}>
        <div style={{ fontSize: 56 }}>✓</div>
        <div style={{ color: BRIGHT, fontSize: 20, fontWeight: 700 }}>Aucune alerte active</div>
        <div style={{ color: MUTED, fontSize: 13 }}>
          Toutes les décisions cliniques sont à jour
        </div>
        <button onClick={onBack} style={{
          marginTop: 20, padding: '10px 22px', borderRadius: 9,
          background: AMBER, border: 'none', color: '#07090F',
          fontSize: 13, fontWeight: 800, cursor: 'pointer',
          boxShadow: `0 0 16px ${AMBER}33`,
        }}>
          ← Retour à la file
        </button>
      </div>
    );
  }

  // ── Empty state #2 : ce patient précis n'a pas d'alerte (mais d'autres oui) ─
  // CRUCIAL : on affiche l'IDENTITÉ DU PATIENT DEMANDÉ (pas de fallback silencieux
  // vers un autre patient). Si patientId est invalide, requestedPatient sera null.
  if (!currentMatch) {
    return (
      <div style={{
        background: BG, flex: 1,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif", color: BRIGHT, fontSize: 13,
      }}>
        {/* Sub-header avec retour */}
        <div style={{
          height: 44, padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          borderBottom: `1px solid ${BORDER}`, background: SURFACE,
        }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
            borderRadius: 7, padding: '6px 14px', cursor: 'pointer',
            color: BRIGHT, fontSize: 12, fontWeight: 600,
          }}>
            ← Retour à la file
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Patient strip — toujours dispo pour switcher */}
          <div style={{
            width: 60, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 0', gap: 10,
            borderRight: `1px solid ${BORDER}`, background: SURFACE,
            overflowY: 'auto',
          }}>
            <div style={{
              fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.30)',
              textTransform: 'uppercase', letterSpacing: '0.10em',
              textAlign: 'center', lineHeight: 1.4,
            }}>
              {alertPatients.length}<br />pts
            </div>
            {alertPatients.map(({ patient: p, decisions }) => {
              const riskCol = RISK_COLOR[decisions[0].riskLevel] ?? AMBER;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  aria-label={`Ouvrir l'alerte de ${p.name}, niveau ${decisions[0].riskLevel}`}
                  title={`${p.name} · ${decisions[0].riskLevel}`}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${riskCol}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: MUTED,
                    boxShadow: `0 0 6px ${riskCol}22`,
                  }}
                >
                  {initials(p.name)}
                </button>
              );
            })}
          </div>

          {/* Empty state body */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 14, padding: 32,
          }}>
            {requestedPatient ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `${GREEN}15`, border: `2px solid ${GREEN}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: GREEN,
                  boxShadow: `0 0 24px ${GREEN}30`,
                }}>
                  {initials(requestedPatient.name)}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center' }}>
                  {requestedPatient.name}
                </div>
                <div style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
                  {requestedPatient.id} · {requestedPatient.diabetesType} · {requestedPatient.age} ans
                </div>
                <div style={{
                  marginTop: 6, padding: '10px 16px', borderRadius: 8,
                  background: `${GREEN}12`, border: `1px solid ${GREEN}30`,
                  color: GREEN, fontSize: 12, fontWeight: 700,
                }}>
                  ✓ Aucune décision IA en attente pour ce patient
                </div>
                <div style={{ fontSize: 12, color: MUTED, maxWidth: 380, textAlign: 'center', lineHeight: 1.5 }}>
                  Sélectionne un autre patient dans la barre de gauche pour traiter une alerte active,
                  ou retourne à la file.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48 }}>?</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: BRIGHT }}>
                  Patient introuvable
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  L'identifiant <code style={{ color: AMBER }}>{patientId}</code> n'existe pas dans la cohorte.
                </div>
              </>
            )}
            <button onClick={onBack} style={{
              marginTop: 12, padding: '10px 22px', borderRadius: 9,
              background: AMBER, border: 'none', color: '#07090F',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 0 16px ${AMBER}33`,
            }}>
              ← Retour à la file
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Past the empty-state guards above, currentMatch is guaranteed non-null.
  const patient = currentMatch.patient;
  const decision: PendingClinicalDecision = currentMatch.decisions[0];
  const ctx = decision.contextSnapshot;

  const remainingMs = decision.expiresAt - now;
  const { mm, ss } = formatCountdown(remainingMs);
  const expired = remainingMs <= 0 && decisionStatus === 'pending';

  const xaiCards = decision.reasoning.slice(0, 3).map((reason, i) => ({
    ...XAI_COLORS[i],
    val: reason,
    pct: XAI_WEIGHTS[i] ?? 15,
  }));

  const trendArrow = ctx.glucoseTrend === 'falling' ? '↘' : ctx.glucoseTrend === 'rising' ? '↗' : '→';

  return (
    <div style={{
      background: BG, flex: 1,
      fontFamily: "'Inter', system-ui, sans-serif", color: BRIGHT, fontSize: 13,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── Sub-header (mode banner + back) ─────────────────────────── */}
      <div style={{
        height: 44, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`, background: SURFACE,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
          borderRadius: 7, padding: '6px 14px', cursor: 'pointer',
          color: BRIGHT, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Retour à la file
        </button>
        <span style={{
          fontSize: 9, fontWeight: 800, color: AMBER, background: AMBER_DIM,
          border: '1px solid rgba(255,171,0,0.25)', borderRadius: 4, padding: '3px 9px',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          ⚡ Mode focus · Décision IA
        </span>
        <span style={{ fontSize: 11, color: MUTED }}>
          Justifiée par IA explicable · Tracée pour audit
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: RED, boxShadow: `0 0 0 4px rgba(239,68,68,0.15)` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>
            {alertPatients.length} patient{alertPatients.length > 1 ? 's' : ''} en alerte
          </span>
        </div>
      </div>

      {/* ── Layout: patient strip + focus ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* PATIENT STRIP */}
        <div style={{
          width: 60, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0', gap: 10,
          borderRight: `1px solid ${BORDER}`, background: SURFACE,
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.30)',
            textTransform: 'uppercase', letterSpacing: '0.10em',
            textAlign: 'center', lineHeight: 1.4,
          }}>
            {alertPatients.length}<br />pts
          </div>

          {alertPatients.map(({ patient: p, decisions }) => {
            const active = p.id === patient.id;
            const riskCol = RISK_COLOR[decisions[0].riskLevel] ?? AMBER;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                aria-label={`${active ? 'Patient affiché : ' : 'Ouvrir l\'alerte de '}${p.name}, niveau ${decisions[0].riskLevel}`}
                aria-current={active ? 'true' : undefined}
                title={`${p.name} · ${decisions[0].riskLevel}`}
                style={{
                  width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
                  background: active ? AMBER_DIM : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${active ? AMBER : riskCol + '55'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: active ? AMBER : MUTED,
                  boxShadow: active
                    ? `0 0 0 4px ${AMBER_DIM}, 0 0 14px ${AMBER_DIM}`
                    : `0 0 6px ${riskCol}22`,
                  position: 'relative', padding: 0, flexShrink: 0,
                }}
              >
                {initials(p.name)}
                {!active && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, width: 9, height: 9,
                    borderRadius: '50%', background: riskCol, border: `1.5px solid ${BG}`,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* FOCUS ZONE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ALERT HEADER */}
          <div style={{
            flexShrink: 0, padding: '18px 28px',
            background: `linear-gradient(135deg, rgba(255,171,0,0.08) 0%, rgba(255,171,0,0.03) 100%)`,
            borderBottom: '1px solid rgba(255,171,0,0.15)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: AMBER_DIM, border: '1.5px solid rgba(255,171,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, color: AMBER, fontSize: 14,
                boxShadow: '0 0 16px rgba(255,171,0,0.20)',
              }}>{initials(patient.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: AMBER,
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4,
                }}>
                  ⚡ Alerte prioritaire · IA confiance {Math.round(decision.aiConfidence * 100)}%
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 900, color: BRIGHT,
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {patient.name} · {decision.triggerReason.split('(')[0].trim()}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                  {patient.age} ans · {patient.diabetesType} · {patient.id} · {patient.cgmDevice.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: MUTED,
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4,
              }}>
                Délai de décision restant
              </div>
              <div style={{
                fontSize: 56, fontWeight: 900, color: AMBER,
                letterSpacing: '-0.06em', lineHeight: 1,
                textShadow: `0 0 30px ${AMBER}55, 0 0 60px ${AMBER}22`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {mm}:{ss}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,171,0,0.55)', marginTop: 2 }}>
                Émise {timeAgo(decision.createdAt)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180, flexShrink: 0 }}>
              <button
                onClick={() => handleAction('applied')}
                disabled={decisionStatus !== 'pending' || expired}
                style={{
                  padding: '10px 18px', borderRadius: 9, border: 'none',
                  background: decisionStatus === 'applied' ? GREEN : AMBER,
                  fontSize: 13, fontWeight: 800, color: '#07090F',
                  cursor: decisionStatus === 'pending' && !expired ? 'pointer' : 'default',
                  letterSpacing: '-0.01em',
                  boxShadow: `0 0 20px ${AMBER}44`,
                  opacity: decisionStatus === 'pending' || decisionStatus === 'applied' ? 1 : 0.4,
                }}
              >
                {decisionStatus === 'applied' ? '✓ Prise en charge' : '✓ Prendre en charge'}
              </button>
              <button
                onClick={() => handleAction('dismissed')}
                disabled={decisionStatus !== 'pending' || expired}
                style={{
                  padding: '8px 18px', borderRadius: 9,
                  border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)',
                  fontSize: 12, fontWeight: 600, color: MUTED,
                  cursor: decisionStatus === 'pending' && !expired ? 'pointer' : 'default',
                  opacity: decisionStatus === 'pending' || decisionStatus === 'dismissed' ? 1 : 0.4,
                }}
              >
                {decisionStatus === 'dismissed' ? '✕ Marquée fausse alerte' : 'Fausse alerte'}
              </button>
            </div>
          </div>

          {/* SCROLL CONTENT */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '18px 24px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>

            {/* XAI CARDS */}
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: MUTED,
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
              }}>
                Pourquoi l'IA prédit ce risque — {xaiCards.length} signaux combinés
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${xaiCards.length}, 1fr)`, gap: 10 }}>
                {xaiCards.map((c, i) => (
                  <div key={i} style={{
                    background: SURFACE, borderRadius: 14,
                    border: `1px solid ${c.color}30`,
                    padding: '16px 18px',
                    boxShadow: `0 0 20px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`,
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: `${c.color}15`, border: `1px solid ${c.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: c.color, fontWeight: 900,
                      }}>{c.icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: c.color, letterSpacing: '-0.04em' }}>
                        {c.pct}%
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: BRIGHT, lineHeight: 1.45, fontWeight: 600 }}>
                      {c.val}
                    </div>
                    <div style={{ marginTop: 12, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{
                        height: 3, width: `${(c.pct / 42) * 100}%`,
                        background: c.color, borderRadius: 2,
                        boxShadow: `0 0 6px ${c.color}`,
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Contribution au risque
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUGGESTION + DECISION */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

              <div style={{
                flex: '1 1 380px', background: SURFACE, borderRadius: 14,
                border: `1px solid ${AMBER}25`, padding: '16px 20px',
                boxShadow: `0 0 24px rgba(255,171,0,0.06)`,
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: MUTED,
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
                }}>
                  Suggestion thérapeutique · IA · Confiance {Math.round(decision.aiConfidence * 100)}%
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 900, color: BRIGHT,
                  lineHeight: 1.4, letterSpacing: '-0.02em', marginBottom: 14,
                }}>
                  {decision.aiRecommendation}
                </div>

                {decision.alternativeOptions && decision.alternativeOptions.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: MUTED,
                      textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8,
                    }}>
                      Alternatives évaluées
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {decision.alternativeOptions.map((alt, i) => {
                        const riskC = alt.risk === 'lower' ? GREEN : alt.risk === 'higher' ? RED : '#F59E0B';
                        const riskLabel = alt.risk === 'lower' ? 'risque ↓' : alt.risk === 'higher' ? 'risque ↑' : 'risque =';
                        return (
                          <div key={i} style={{
                            background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                            borderRadius: 9, padding: '8px 12px',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, color: riskC,
                              background: `${riskC}15`, border: `1px solid ${riskC}30`,
                              borderRadius: 4, padding: '2px 6px', flexShrink: 0,
                            }}>{riskLabel}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: BRIGHT, fontWeight: 600 }}>{alt.label}</div>
                              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{alt.rationale}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: MUTED,
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                }}>
                  Votre décision
                </div>

                <button
                  onClick={() => handleAction('applied')}
                  disabled={decisionStatus !== 'pending' || expired}
                  style={{
                    minHeight: 78, borderRadius: 12, border: 'none',
                    background: decisionStatus === 'applied'
                      ? GREEN
                      : `linear-gradient(135deg, ${AMBER}, #FF8C00)`,
                    fontSize: 15, fontWeight: 900, color: '#07090F',
                    cursor: decisionStatus === 'pending' && !expired ? 'pointer' : 'default',
                    letterSpacing: '-0.02em',
                    boxShadow: `0 4px 20px ${AMBER}44`,
                    lineHeight: 1.4,
                    opacity: decisionStatus === 'pending' || decisionStatus === 'applied' ? 1 : 0.4,
                  }}
                >
                  {decisionStatus === 'applied' ? '✓ Appliqué' : '✓ Appliquer'}
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, marginTop: 3 }}>
                    {decisionStatus === 'applied' ? 'Tracée dans le journal local' : 'Valider la suggestion IA'}
                  </div>
                </button>

                <button
                  onClick={() => handleAction('modified')}
                  disabled={decisionStatus !== 'pending' || expired}
                  style={{
                    minHeight: 64, borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    background: decisionStatus === 'modified' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                    fontSize: 14, fontWeight: 700, color: BRIGHT,
                    cursor: decisionStatus === 'pending' && !expired ? 'pointer' : 'default',
                    lineHeight: 1.4,
                    opacity: decisionStatus === 'pending' || decisionStatus === 'modified' ? 1 : 0.4,
                  }}
                >
                  ✎ Modifier
                  <div style={{ fontSize: 10, fontWeight: 400, color: MUTED, marginTop: 3 }}>
                    {decisionStatus === 'modified' ? 'Plan ajusté' : 'Ajuster et valider'}
                  </div>
                </button>

                <button
                  onClick={() => handleAction('dismissed')}
                  disabled={decisionStatus !== 'pending' || expired}
                  style={{
                    padding: '10px', borderRadius: 9,
                    border: `1px solid ${BORDER}`, background: 'transparent',
                    fontSize: 12, fontWeight: 500, color: MUTED,
                    cursor: decisionStatus === 'pending' && !expired ? 'pointer' : 'default',
                    opacity: decisionStatus === 'pending' || decisionStatus === 'dismissed' ? 1 : 0.4,
                  }}
                >
                  Ignorer · Annoter
                </button>
              </div>
            </div>

            {/* Context bar */}
            <div style={{
              background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`,
              padding: '12px 18px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: MUTED,
                textTransform: 'uppercase', letterSpacing: '0.14em', flexShrink: 0,
              }}>Contexte</div>
              {[
                { label: 'Glycémie', val: `${ctx.glucose} mg/dL ${trendArrow}`, color: ctx.glucoseTrend === 'falling' ? CYAN : ctx.glucoseTrend === 'rising' ? AMBER : BRIGHT },
                { label: 'TIR 24h', val: `${ctx.timeInRange24h}%`, color: ctx.timeInRange24h >= 70 ? GREEN : AMBER },
                { label: 'HbA1c', val: `${patient.hba1c.toFixed(1)}%`, color: VIOLET },
                { label: 'Insuline active', val: `${ctx.activeInsulin}U`, color: AMBER },
                ...(ctx.lastMealCarbs ? [{ label: 'Dernier repas', val: `${ctx.lastMealCarbs}g · ${Math.round((ctx.lastMealAgoMin ?? 0) / 60)}h`, color: BRIGHT }] : []),
                { label: 'Capteur', val: patient.cgmDevice.replace(/_/g, ' '), color: BRIGHT },
              ].map(c => (
                <div key={c.label}>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>

            {persistError && (
              <div style={{
                background: `${RED}15`, border: `1px solid ${RED}40`,
                borderRadius: 10, padding: '10px 16px',
                fontSize: 12, color: BRIGHT, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span>
                  <strong>Décision non tracée</strong> · {persistError}
                  {' '}Réessayez ou contactez l'administrateur.
                </span>
              </div>
            )}

            {expired && (
              <div style={{
                background: `${RED}15`, border: `1px solid ${RED}40`,
                borderRadius: 10, padding: '10px 16px',
                fontSize: 12, color: BRIGHT, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 14 }}>⏱</span>
                <span>
                  <strong>Délai dépassé</strong> · Cette alerte aurait dû être traitée.
                  Une escalade automatique serait déclenchée en production.
                </span>
              </div>
            )}

            {persistedAction && (
              <div style={{
                background: persistedAction.action === 'applied' ? `${GREEN}15` : persistedAction.action === 'modified' ? `${AMBER}15` : `${MUTED}15`,
                border: `1px solid ${persistedAction.action === 'applied' ? GREEN : persistedAction.action === 'modified' ? AMBER : MUTED}30`,
                borderRadius: 10, padding: '12px 16px',
                fontSize: 12, color: BRIGHT,
                display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>
                  {persistedAction.action === 'applied' ? '✓' : persistedAction.action === 'modified' ? '✎' : '✕'}
                </span>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ marginBottom: 4 }}>
                    Décision <strong>{persistedAction.action === 'applied' ? 'appliquée' : persistedAction.action === 'modified' ? 'modifiée' : 'rejetée'}</strong>
                    {' '}par <strong>{persistedAction.actorName}</strong>
                    {' · '}{new Date(persistedAction.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    Trace ID · {persistedAction.traceId}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
