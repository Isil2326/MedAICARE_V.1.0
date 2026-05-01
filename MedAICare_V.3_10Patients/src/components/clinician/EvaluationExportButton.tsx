// ============================================================================
// EvaluationExportButton — déclenche le téléchargement JSON anonymisé.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  EVALUATION_CHANGE_EVENT,
  exportEvaluationsAsJSON,
  getCohortStats,
  setCohortOverride,
  getCohortOverride,
  type Cohort,
} from '../../engine/evaluationService';
import { SURFACE, BORDER, AMBER, MUTED, BRIGHT } from './v3DarkTheme';

export default function EvaluationExportButton() {
  const [stats, setStats] = useState(() => getCohortStats());
  const [override, setOverride] = useState<Cohort | null>(() => getCohortOverride());

  useEffect(() => {
    const refresh = () => {
      setStats(getCohortStats());
      setOverride(getCohortOverride());
    };
    window.addEventListener(EVALUATION_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(EVALUATION_CHANGE_EVENT, refresh);
  }, []);

  const handleExport = () => {
    const json = exportEvaluationsAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediai-evaluation-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCohortChange = (c: Cohort | null) => {
    setCohortOverride(c);
    setOverride(c);
  };

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        Évaluation O4 · {stats.total} réponse{stats.total > 1 ? 's' : ''}
      </div>
      <div style={{ fontSize: 11, color: BRIGHT, lineHeight: 1.5 }}>
        Cohorte A : <strong>{stats.cohortA}</strong> · Cohorte B : <strong>{stats.cohortB}</strong>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['A', 'B', null] as (Cohort | null)[]).map((c) => {
          const active = override === c;
          const label = c === null ? 'Auto' : `Force ${c}`;
          return (
            <button
              key={c ?? 'auto'}
              onClick={() => handleCohortChange(c)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 6,
                border: `1px solid ${active ? AMBER : BORDER}`,
                background: active ? `${AMBER}20` : 'rgba(255,255,255,0.03)',
                color: active ? AMBER : MUTED,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleExport}
        disabled={stats.total === 0}
        style={{
          padding: '7px 12px',
          borderRadius: 7,
          border: 'none',
          background: stats.total > 0 ? AMBER : 'rgba(255,255,255,0.06)',
          color: stats.total > 0 ? '#07090F' : MUTED,
          fontSize: 11,
          fontWeight: 800,
          cursor: stats.total > 0 ? 'pointer' : 'not-allowed',
        }}
      >
        ↓ Exporter JSON
      </button>
    </div>
  );
}
