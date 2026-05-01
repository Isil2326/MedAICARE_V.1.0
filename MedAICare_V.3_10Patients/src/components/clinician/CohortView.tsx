// ============================================================================
// CohortView · Vue d'ensemble cohorte V3-Dark · Lien d'exception (browse)
// Pour explorer la cohorte hors urgence — tri/filtre par risque, HbA1c, TIR
// ============================================================================

import { useState, useMemo } from 'react';
import { getSimulatedPatients } from '../../engine/simulator';
import { getPendingDecisions } from '../../engine/patient-data';
import {
  BG, SURFACE, BORDER, AMBER, AMBER_DIM, GREEN, RED, MUTED, MUTED_2, BRIGHT, ORANGE,
  RISK_COLOR, RISK_LABEL, RISK_ORDER, initials,
} from './v3DarkTheme';

type RiskFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
type SortKey = 'risk' | 'hba1c' | 'tir' | 'name';

export interface CohortViewProps {
  onSelectPatient: (patientId: string) => void;
}

function hba1cColor(v: number): string {
  if (v >= 8.5) return RED;
  if (v >= 7.5) return AMBER;
  if (v >= 7.0) return ORANGE;
  return GREEN;
}

function tirColor(v: number): string {
  if (v >= 70) return GREEN;
  if (v >= 50) return AMBER;
  return RED;
}

export default function CohortView({ onSelectPatient }: CohortViewProps) {
  const [filter, setFilter] = useState<RiskFilter>('ALL');
  const [sort, setSort] = useState<SortKey>('risk');

  const patients = useMemo(() => getSimulatedPatients(), []);

  const enriched = useMemo(() => patients.map(p => ({
    patient: p,
    pendingCount: getPendingDecisions(p.id).length,
  })), [patients]);

  const filtered = useMemo(() => {
    const f = filter === 'ALL' ? enriched : enriched.filter(e => e.patient.riskLevel === filter);
    const sorted = [...f].sort((a, b) => {
      switch (sort) {
        case 'risk':
          return (RISK_ORDER[a.patient.riskLevel] ?? 9) - (RISK_ORDER[b.patient.riskLevel] ?? 9);
        case 'hba1c': return b.patient.hba1c - a.patient.hba1c;
        case 'tir':   return a.patient.tir - b.patient.tir;
        case 'name':  return a.patient.name.localeCompare(b.patient.name, 'fr');
      }
    });
    return sorted;
  }, [enriched, filter, sort]);

  const counts = useMemo(() => ({
    ALL: enriched.length,
    CRITICAL: enriched.filter(e => e.patient.riskLevel === 'CRITICAL').length,
    HIGH: enriched.filter(e => e.patient.riskLevel === 'HIGH').length,
    MODERATE: enriched.filter(e => e.patient.riskLevel === 'MODERATE').length,
    LOW: enriched.filter(e => e.patient.riskLevel === 'LOW').length,
  }), [enriched]);

  const filterChips: { key: RiskFilter; color: string }[] = [
    { key: 'ALL',      color: BRIGHT },
    { key: 'CRITICAL', color: RED },
    { key: 'HIGH',     color: AMBER },
    { key: 'MODERATE', color: ORANGE },
    { key: 'LOW',      color: GREEN },
  ];

  const sortLabels: Record<SortKey, string> = {
    risk: 'Risque',
    hba1c: 'HbA1c',
    tir: 'TIR',
    name: 'Nom',
  };

  return (
    <div style={{
      background: BG, flex: 1,
      fontFamily: "'Inter', system-ui, sans-serif", color: BRIGHT, fontSize: 13,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: '20px 28px',
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
            Cohorte <span style={{ color: AMBER }}>· {patients.length}</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            vue d'ensemble · explorer hors urgence
          </div>
        </div>

        {/* Filter + sort */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filterChips.map(chip => {
              const active = filter === chip.key;
              const label = chip.key === 'ALL' ? `Tous · ${counts.ALL}` : `${RISK_LABEL[chip.key]} · ${counts[chip.key]}`;
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
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
              Trier par
            </span>
            {(Object.keys(sortLabels) as SortKey[]).map(k => {
              const active = sort === k;
              return (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  style={{
                    padding: '5px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: active ? AMBER_DIM : 'transparent',
                    border: `1px solid ${active ? AMBER + '50' : BORDER}`,
                    color: active ? AMBER : MUTED_2,
                  }}
                >
                  {sortLabels[k]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 28px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12,
        alignContent: 'start',
      }}>
        {filtered.map(({ patient: p, pendingCount }) => {
          const riskCol = RISK_COLOR[p.riskLevel] ?? AMBER;
          const hCol = hba1cColor(p.hba1c);
          const tCol = tirColor(p.tir);
          return (
            <button
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              style={{
                background: SURFACE, border: `1px solid ${BORDER}`,
                borderTop: `2px solid ${riskCol}`,
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 12,
                cursor: 'pointer', textAlign: 'left',
                color: BRIGHT, fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `${riskCol}15`, border: `1.5px solid ${riskCol}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: riskCol,
                  flexShrink: 0,
                }}>
                  {initials(p.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {p.id} · {p.age} ans · {p.diabetesType}
                  </div>
                </div>
                {pendingCount > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: AMBER,
                    background: AMBER_DIM, border: `1px solid ${AMBER}40`,
                    borderRadius: 4, padding: '3px 7px',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    flexShrink: 0,
                  }}>
                    {pendingCount} alerte{pendingCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Risk badge */}
              <div style={{
                fontSize: 9, fontWeight: 800, color: riskCol,
                background: `${riskCol}15`, border: `1px solid ${riskCol}30`,
                borderRadius: 4, padding: '3px 8px',
                textTransform: 'uppercase', letterSpacing: '0.10em',
                alignSelf: 'flex-start',
              }}>
                Risque {RISK_LABEL[p.riskLevel] ?? p.riskLevel}
              </div>

              {/* Stats grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                paddingTop: 8, borderTop: `1px solid ${BORDER}`,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                    HbA1c
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: hCol, letterSpacing: '-0.02em' }}>
                    {p.hba1c.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                    TIR 24h
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: tCol, letterSpacing: '-0.02em' }}>
                    {p.tir}%
                  </div>
                </div>
              </div>

              {/* Footer device */}
              <div style={{
                fontSize: 10, color: MUTED, paddingTop: 6,
                borderTop: `1px solid ${BORDER}`,
              }}>
                {p.cgmDevice.replace(/_/g, ' ')}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: MUTED, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
            Aucun patient ne correspond à ce filtre
          </div>
        )}
      </div>
    </div>
  );
}
