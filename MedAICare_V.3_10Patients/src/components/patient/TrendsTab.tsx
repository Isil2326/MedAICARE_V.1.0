import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { Target, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TIRBar } from './TIRBar';

interface Stats {
  avgGlucose: number;
  gmi: number;
  cv: number;
  timeActive: number;
}

interface TIR {
  veryLow: number;
  low: number;
  inRange: number;
  high: number;
  veryHigh: number;
}

interface AGPPoint {
  hour: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

interface Props {
  stats: Stats;
  tir: TIR;
  agp: AGPPoint[];
}

export function TrendsTab({ stats, tir, agp }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Glycémie moyenne',
            value: stats.avgGlucose,
            unit: 'mg/dL',
            target: '< 154',
            ok: stats.avgGlucose < 154,
          },
          { label: 'GMI estimé', value: `${stats.gmi}%`, unit: '', target: '< 7%', ok: stats.gmi < 7 },
          { label: 'Variabilité', value: `${stats.cv}%`, unit: '', target: '≤ 36%', ok: stats.cv <= 36 },
          {
            label: 'Capteur actif',
            value: `${stats.timeActive}%`,
            unit: '',
            target: '≥ 70%',
            ok: stats.timeActive >= 70,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl card-shadow p-4">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
              {s.label}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[26px] font-black text-slate-900 tabular-nums">{s.value}</span>
              {s.unit && <span className="text-[12px] text-slate-400 font-medium">{s.unit}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn('w-2 h-2 rounded-full', s.ok ? 'bg-brand-500' : 'bg-amber-400')} />
              <span className="text-[10.5px] text-slate-400">Cible {s.target}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
            <Target className="w-4.5 h-4.5 text-brand-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Time in Range</div>
            <div className="text-[12px] text-slate-400">14 derniers jours · Standard ATTD</div>
          </div>
        </div>
        <TIRBar tir={tir} />
      </div>

      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900">
              Profil Glycémique Ambulatoire (AGP)
            </div>
            <div className="text-[12px] text-slate-400">
              Médiane et percentiles sur 24h · 14 jours agrégés
            </div>
          </div>
        </div>
        <div className="h-[260px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={agp} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="agpRange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(h) => `${h}h`}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[40, 300]}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#1e293b',
                }}
                labelFormatter={(h) => `${h}h00`}
              />
              <ReferenceArea
                y1={70}
                y2={180}
                fill="rgba(16,185,129,0.07)"
                stroke="rgba(16,185,129,0.25)"
                strokeDasharray="4 3"
              />
              <Area
                type="monotone"
                dataKey="p95"
                stroke="rgba(16,185,129,0.12)"
                strokeWidth={1}
                fill="none"
              />
              <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpRange)" />
              <Area type="monotone" dataKey="p25" stroke="none" fill="rgba(241,245,249,1)" />
              <Area
                type="monotone"
                dataKey="p5"
                stroke="rgba(16,185,129,0.12)"
                strokeWidth={1}
                fill="none"
              />
              <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-brand-500 rounded inline-block" /> Médiane
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-3 bg-brand-200/50 rounded-sm inline-block" /> Percentile 25–75
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-3 border border-brand-200 rounded-sm inline-block" /> Cible 70–180
          </span>
        </div>
      </div>
    </div>
  );
}
