// ============================================================================
// v4.0.0 — Sélecteur de plage temporelle — Thème Naturel
// ============================================================================

import { Clock, Radio } from 'lucide-react';
import type { TimeRangeKey } from '../../types/medical';
import { TIME_RANGES } from '../../engine/patient-data';
import { cn } from '../../utils/cn';

interface Props {
  value: TimeRangeKey;
  onChange: (key: TimeRangeKey) => void;
  accent?: 'green' | 'blue';
  compact?: boolean;
}

export function TimeRangeSelector({ value, onChange, accent = 'green', compact = false }: Props) {
  const accentMap = {
    green: {
      active: 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-200',
      dot:    'bg-brand-500',
    },
    blue: {
      active: 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200',
      dot:    'bg-blue-500',
    },
  };
  const a     = accentMap[accent];
  const items = compact
    ? TIME_RANGES.filter(r => ['live', 'h6', 'd1', 'd7', 'm1'].includes(r.key))
    : TIME_RANGES;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-[11px] text-sage-400 font-semibold px-1">
        <Clock className="w-3.5 h-3.5" />
        <span>Période</span>
      </div>
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-sage-100 border border-sage-200">
        {items.map(r => {
          const isActive = value === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onChange(r.key)}
              title={r.description}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5',
                isActive ? a.active : 'text-sage-500 hover:text-sage-800 hover:bg-white/60'
              )}
            >
              {r.isLive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', a.dot)} />
                  <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', a.dot)} />
                </span>
              )}
              {r.isLive && !isActive ? <Radio className="w-3 h-3" /> : null}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TimeRangeSelector;
