// ============================================================================
// v3.1.0 — Sélecteur de plage temporelle
// Permet de basculer entre vue temps réel et vues rétrospectives (H-1, J-1, M-1…)
// ============================================================================

import { Clock, Radio } from 'lucide-react';
import type { TimeRangeKey } from '../../types/medical';
import { TIME_RANGES } from '../../engine/patient-data';
import { cn } from '../../utils/cn';

interface Props {
  value: TimeRangeKey;
  onChange: (key: TimeRangeKey) => void;
  /** Visuel adapté au contexte (patient = teal, clinicien = bleu) */
  accent?: 'teal' | 'blue';
  /** Limite les options affichées (ex: pour mobile) */
  compact?: boolean;
}

export function TimeRangeSelector({ value, onChange, accent = 'teal', compact = false }: Props) {
  const accentMap = {
    teal: {
      active: 'bg-gradient-to-br from-teal-500/25 to-cyan-500/15 ring-teal-400/40 text-teal-100 shadow-[0_4px_20px_-8px_rgba(20,184,166,0.6)]',
      live:  'text-teal-300',
      dot:   'bg-teal-400',
    },
    blue: {
      active: 'bg-gradient-to-br from-blue-500/25 to-violet-500/15 ring-blue-400/40 text-blue-100 shadow-[0_4px_20px_-8px_rgba(59,130,246,0.6)]',
      live:  'text-blue-300',
      dot:   'bg-blue-400',
    },
  };
  const a = accentMap[accent];
  const items = compact ? TIME_RANGES.filter(r => ['live', 'h6', 'd1', 'd7', 'm1'].includes(r.key)) : TIME_RANGES;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-[11px] text-white/45 px-1">
        <Clock className="w-3.5 h-3.5" />
        <span>Période</span>
      </div>
      <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
        {items.map(r => {
          const isActive = value === r.key;
          const isLive = r.isLive;
          return (
            <button
              key={r.key}
              onClick={() => onChange(r.key)}
              title={r.description}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                isActive
                  ? a.active + ' ring-1'
                  : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
              )}
            >
              {isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', a.dot)} />
                  <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', a.dot)} />
                </span>
              )}
              {isLive && !isActive ? <Radio className="w-3 h-3" /> : null}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TimeRangeSelector;
