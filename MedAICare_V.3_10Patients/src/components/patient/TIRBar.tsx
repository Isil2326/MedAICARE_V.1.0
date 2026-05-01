import { cn } from '../../utils/cn';

interface Props {
  tir: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number };
}

export function TIRBar({ tir }: Props) {
  const segments = [
    { key: 'veryLow', label: 'Très bas', range: '<54', value: tir.veryLow, color: 'bg-red-400', target: '<1%', dot: 'bg-red-400', textColor: 'text-red-600' },
    { key: 'low', label: 'Bas', range: '54–69', value: tir.low, color: 'bg-amber-400', target: '<4%', dot: 'bg-amber-400', textColor: 'text-amber-700' },
    { key: 'inRange', label: 'Dans la cible', range: '70–180', value: tir.inRange, color: 'bg-brand-500', target: '>70%', dot: 'bg-brand-500', textColor: 'text-brand-700' },
    { key: 'high', label: 'Élevé', range: '181–250', value: tir.high, color: 'bg-orange-400', target: '<25%', dot: 'bg-orange-400', textColor: 'text-orange-700' },
    { key: 'veryHigh', label: 'Très élevé', range: '>250', value: tir.veryHigh, color: 'bg-coral-500', target: '<5%', dot: 'bg-coral-500', textColor: 'text-coral-700' },
  ];
  return (
    <div>
      <div className="flex h-14 rounded-2xl overflow-hidden gap-0.5 mb-4">
        {segments.map((s) => (
          <div
            key={s.key}
            className={cn(
              s.color,
              'flex items-center justify-center text-[11px] font-bold text-white transition-all',
            )}
            style={{ width: `${s.value}%`, minWidth: s.value > 0 ? '20px' : 0 }}
          >
            {s.value >= 8 ? `${s.value}%` : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {segments.map((s) => (
          <div key={s.key} className="flex items-start gap-2">
            <div className={cn('w-1 h-10 rounded-full mt-0.5 shrink-0', s.dot)} />
            <div>
              <div className={cn('text-[12px] font-bold', s.textColor)}>{s.label}</div>
              <div className="text-[10.5px] text-slate-400">{s.range} mg/dL</div>
              <div className="text-[10.5px] text-slate-700 font-semibold">{s.value}%</div>
              <div className="text-[10px] text-slate-300">cible {s.target}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
