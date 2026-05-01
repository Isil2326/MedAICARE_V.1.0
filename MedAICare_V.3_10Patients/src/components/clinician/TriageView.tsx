// ============================================================================
// TriageView · File d'alertes V3-Dark · Landing clinicien
// "Qu'est-ce qui demande mon attention maintenant ?" — file priorisée
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { DECISION_LOG_STORAGE_KEY } from '../../engine/decisionLog';
import { buildAlertQueue } from './alertQueue';
import {
  BG, SURFACE, BORDER, AMBER, AMBER_DIM, GREEN, RED, MUTED, MUTED_2, BRIGHT,
  RISK_COLOR, RISK_LABEL, initials, formatCountdown, timeAgo,
} from './v3DarkTheme';

type RiskFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface TriageViewProps {
  onSelectPatient: (patientId: string) => void;
}

export default function TriageView({ onSelectPatient }: TriageViewProps) {
  const [filter, setFilter] = useState<RiskFilter>('ALL');
  const [now, setNow] = useState<number>(Date.now());
  // Bumps when decisionLog changes (action applied/dismissed in another view or tab)
  const [logVersion, setLogVersion] = useState<number>(0);

  // Tick every second so countdowns stay live
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Listen for decision log writes (cross-tab + same-tab via custom event)
  useEffect(() => {
    const onChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== DECISION_LOG_STORAGE_KEY) return;
      setLogVersion(v => v + 1);
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('mediai:decisionlog', onChange as EventListener);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('mediai:decisionlog', onChange as EventListener);
    };
  }, []);

  // Refresh queue when component mounts (after returning from focus) + on log change
  const queue = useMemo(() => buildAlertQueue(), [logVersion]);

  // KPIs
  const kpis = useMemo(() => {
    const total = queue.length;
    const critical = queue.filter(q => q.decision.riskLevel === 'CRITICAL').length;
    const high = queue.filter(q => q.decision.riskLevel === 'HIGH').length;
    // average delay since alert was created (minutes)
    const delays = queue.map(q => Math.max(0, now - q.decision.createdAt) / 60000);
    const avgDelay = delays.length > 0
      ? Math.round(delays.reduce((s, x) => s + x, 0) / delays.length)
      : 0;
    return { total, critical, high, avgDelay };
  }, [queue, now]);

  // Filter
  const filtered = useMemo(() => {
    if (filter === 'ALL') return queue;
    return queue.filter(q => q.decision.riskLevel === filter);
  }, [queue, filter]);

  // Empty state
  if (queue.length === 0) {
    return (
      <div style={{
        background: BG, flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        color: BRIGHT, fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `${GREEN}20`, border: `2px solid ${GREEN}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: GREEN, fontSize: 32, fontWeight: 900,
          boxShadow: `0 0 30px ${GREEN}30`,
        }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Aucune alerte en attente
        </div>
        <div style={{ color: MUTED, fontSize: 13 }}>
          Toutes les décisions cliniques de ta cohorte sont à jour
        </div>
      </div>
    );
  }

  const filterChips: { key: RiskFilter; label: string; color: string }[] = [
    { key: 'ALL',      label: `Tous · ${queue.length}`,        color: BRIGHT },
    { key: 'CRITICAL', label: `Critiques · ${kpis.critical}`,  color: RED },
    { key: 'HIGH',     label: `Élevés · ${kpis.high}`,         color: AMBER },
    { key: 'MODERATE', label: `Modérés · ${queue.filter(q => q.decision.riskLevel === 'MODERATE').length}`, color: '#F59E0B' },
    { key: 'LOW',      label: `Faibles · ${queue.filter(q => q.decision.riskLevel === 'LOW').length}`,      color: GREEN },
  ];

  return (
    <div style={{
      background: BG, flex: 1,
      fontFamily: "'Inter', system-ui, sans-serif", color: BRIGHT, fontSize: 13,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── KPI strip + filters ───────────────────────────────────── */}
      <div style={{
        flexShrink: 0, padding: '20px 28px',
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Headline */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
            File d'alertes <span style={{ color: AMBER }}>· {kpis.total}</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            triées par risque · délai moyen depuis émission {kpis.avgDelay} min
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'En attente',    val: String(kpis.total),    color: AMBER, sub: 'décisions IA' },
            { label: 'Critiques',     val: String(kpis.critical), color: RED,   sub: 'risque vital' },
            { label: 'Élevés',        val: String(kpis.high),     color: AMBER, sub: 'priorité' },
            { label: 'Délai moyen',   val: `${kpis.avgDelay} min`, color: BRIGHT, sub: 'depuis émission' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                {k.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {k.val}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterChips.map(chip => {
            const active = filter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: active ? `${chip.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? chip.color + '60' : BORDER}`,
                  color: active ? chip.color : MUTED_2,
                  letterSpacing: '0.02em',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Alert cards stack ─────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 28px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {filtered.length === 0 && (
          <div style={{
            color: MUTED, fontSize: 13, textAlign: 'center', padding: '40px 0',
          }}>
            Aucune alerte ne correspond à ce filtre
          </div>
        )}

        {filtered.map(({ patient, decision }) => {
          const riskCol = RISK_COLOR[decision.riskLevel] ?? AMBER;
          const remainingMs = decision.expiresAt - now;
          const { mm, ss } = formatCountdown(remainingMs);
          const expired = remainingMs <= 0;

          return (
            <button
              key={`${patient.id}-${decision.id}`}
              onClick={() => onSelectPatient(patient.id)}
              style={{
                background: SURFACE, border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${riskCol}`,
                borderRadius: 12, padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '44px 1fr auto auto auto',
                alignItems: 'center', gap: 16,
                cursor: 'pointer', textAlign: 'left',
                color: BRIGHT, fontFamily: 'inherit',
                transition: 'background 0.15s',
                boxShadow: decision.riskLevel === 'CRITICAL' ? `0 0 24px ${riskCol}15` : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; }}
            >
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: `${riskCol}15`, border: `1.5px solid ${riskCol}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: riskCol,
                boxShadow: `0 0 10px ${riskCol}25`,
                flexShrink: 0,
              }}>
                {initials(patient.name)}
              </div>

              {/* Identity + reason */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
                    {patient.name}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: riskCol,
                    background: `${riskCol}15`, border: `1px solid ${riskCol}30`,
                    borderRadius: 4, padding: '2px 6px',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {RISK_LABEL[decision.riskLevel] ?? decision.riskLevel}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, color: MUTED_2, lineHeight: 1.4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {decision.triggerReason}
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
                  {patient.id} · {patient.diabetesType} · émise {timeAgo(decision.createdAt)}
                </div>
              </div>

              {/* AI confidence */}
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  IA
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: BRIGHT, letterSpacing: '-0.02em' }}>
                  {Math.round(decision.aiConfidence * 100)}%
                </div>
              </div>

              {/* Countdown */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  {expired ? 'Expirée' : 'Délai'}
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 900,
                  color: expired ? RED : (remainingMs < 5 * 60 * 1000 ? AMBER : BRIGHT),
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {expired ? '—' : `${mm}:${ss}`}
                </div>
              </div>

              {/* Open arrow */}
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: AMBER_DIM, border: `1px solid ${AMBER}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: AMBER, fontSize: 16, fontWeight: 900,
                flexShrink: 0,
              }}>
                →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
