import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import {
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Info,
  Utensils,
  Syringe,
  Footprints,
  PenLine,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type {
  PatientVitals,
  PatientEvent,
  MedicalRecommendation,
} from '../../types/medical';
import { generateRecommendations } from '../../engine/recommendationService';
import { ClinicalRecommendationCard } from '../ClinicalRecommendationCard';
import { QuickAction } from './QuickAction';
import { EventRow } from './EventRow';
import { formatTime } from './formatters';
import type { Tab } from './formatters';

interface CarePlan {
  glucoseTargetMin: number;
  glucoseTargetMax: number;
}

interface Props {
  currentVitals: PatientVitals;
  recommendation: MedicalRecommendation;
  vitalsHistory: PatientVitals[];
  events: PatientEvent[];
  carePlan: CarePlan;
  showXAI: boolean;
  setShowXAI: (v: boolean) => void;
  setLogModal: (t: 'meal' | 'insulin' | 'activity' | 'note') => void;
  setTab: (t: Tab) => void;
}

export function TodayTab({
  currentVitals,
  recommendation,
  vitalsHistory,
  events,
  carePlan,
  showXAI,
  setShowXAI,
  setLogModal,
  setTab,
}: Props) {
  const glucose = currentVitals.glucose;
  const inTarget = glucose >= carePlan.glucoseTargetMin && glucose <= carePlan.glucoseTargetMax;
  const isLow = glucose < carePlan.glucoseTargetMin;

  const glucoseStatus = inTarget
    ? { label: 'Dans votre cible ✓', color: 'text-brand-700', bg: 'bg-brand-50 ring-brand-200' }
    : isLow
      ? { label: 'En dessous de la cible ↓', color: 'text-amber-700', bg: 'bg-amber-50 ring-amber-200' }
      : { label: 'Au dessus de la cible ↑', color: 'text-coral-600', bg: 'bg-coral-50 ring-coral-200' };

  const chartData = vitalsHistory.map((v) => ({ time: formatTime(v.timestamp), g: v.glucose }));

  const glucoseTrendDir: 'rising' | 'falling' | 'stable' =
    recommendation.trendPrediction?.direction ??
    (vitalsHistory.length >= 2
      ? Math.abs(
          vitalsHistory[vitalsHistory.length - 1].glucose -
            vitalsHistory[vitalsHistory.length - 2].glucose,
        ) < 3
        ? 'stable'
        : vitalsHistory[vitalsHistory.length - 1].glucose >
            vitalsHistory[vitalsHistory.length - 2].glucose
          ? 'rising'
          : 'falling'
      : 'stable');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                Votre glycémie
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                FreeStyle Libre 3 · {formatTime(currentVitals.timestamp)}
              </div>
            </div>
          </div>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-[12px] font-bold ring-1',
              glucoseStatus.bg,
              glucoseStatus.color,
            )}
          >
            {glucoseStatus.label}
          </div>
        </div>

        <div className="flex items-end gap-3 mb-5">
          <div className="text-[68px] leading-none font-black text-slate-900 tabular-nums">
            {glucose}
          </div>
          <div className="pb-3 flex flex-col items-center gap-0.5">
            {glucoseTrendDir === 'rising' ? (
              <TrendingUp className="w-8 h-8 text-coral-500" />
            ) : glucoseTrendDir === 'falling' ? (
              <TrendingDown className="w-8 h-8 text-amber-500" />
            ) : (
              <Minus className="w-7 h-7 text-brand-500" />
            )}
            <span
              className={cn(
                'text-[10px] font-bold',
                glucoseTrendDir === 'rising'
                  ? 'text-coral-500'
                  : glucoseTrendDir === 'falling'
                    ? 'text-amber-500'
                    : 'text-brand-500',
              )}
            >
              {glucoseTrendDir === 'rising'
                ? 'Hausse'
                : glucoseTrendDir === 'falling'
                  ? 'Baisse'
                  : 'Stable'}
            </span>
          </div>
          <div className="pb-2">
            <div className="text-[15px] text-slate-400 font-semibold">mg/dL</div>
            <div className="text-[11px] text-slate-300 mt-1">
              Cible {carePlan.glucoseTargetMin}–{carePlan.glucoseTargetMax}
            </div>
          </div>
        </div>

        <div className="h-[180px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gluGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[40, 280]}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#1e293b',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                formatter={(value: unknown) => [`${value} mg/dL`, 'Glycémie']}
              />
              <ReferenceArea
                y1={carePlan.glucoseTargetMin}
                y2={carePlan.glucoseTargetMax}
                fill="rgba(16,185,129,0.07)"
                stroke="rgba(16,185,129,0.25)"
                strokeDasharray="4 3"
              />
              <Area
                type="monotone"
                dataKey="g"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#gluGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl card-shadow p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Enregistrer
          </div>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={Utensils} label="Repas" color="emerald" onClick={() => setLogModal('meal')} />
            <QuickAction icon={Syringe} label="Insuline" color="coral" onClick={() => setLogModal('insulin')} />
            <QuickAction icon={Footprints} label="Sport" color="amber" onClick={() => setLogModal('activity')} />
            <QuickAction icon={PenLine} label="Note" color="sky" onClick={() => setLogModal('note')} />
          </div>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Récent</div>
            <button
              onClick={() => setTab('journal')}
              className="text-[12px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5"
            >
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {events.slice(0, 4).map((e) => (
              <EventRow key={e.id} event={e} compact />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        {generateRecommendations(currentVitals, false).map((rec, i) => (
          <ClinicalRecommendationCard key={i} rec={rec} isClinic={false} />
        ))}

        <div className="bg-white rounded-2xl card-shadow p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                  Recommandation IA
                </div>
                <div className="text-[15px] font-bold text-slate-900 mt-0.5">{recommendation.action}</div>
              </div>
            </div>
            <button
              onClick={() => setShowXAI(!showXAI)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[12px] font-semibold flex items-center gap-1.5 transition shrink-0 border border-slate-200"
            >
              <Info className="w-3.5 h-3.5" />
              {showXAI ? 'Masquer' : 'Pourquoi ?'}
            </button>
          </div>

          {recommendation.actionDetails.length > 0 && (
            <ul className="space-y-2 mb-4">
              {recommendation.actionDetails.slice(0, 3).map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}

          {showXAI && recommendation.trendPrediction && recommendation.rationale && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  {recommendation.trendPrediction.direction === 'rising' ? (
                    <TrendingUp className="w-4 h-4 text-coral-500" />
                  ) : recommendation.trendPrediction.direction === 'falling' ? (
                    <TrendingDown className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-brand-500" />
                  )}
                  <div className="text-[12.5px] font-bold text-slate-800">Prévision dans 30 min</div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[30px] font-black text-slate-900 tabular-nums">
                    {recommendation.trendPrediction.predictedValue}
                  </span>
                  <span className="text-[12px] text-slate-400 font-medium">mg/dL</span>
                  <span
                    className={cn(
                      'text-[12px] font-bold ml-1',
                      recommendation.trendPrediction.predictedChange > 0
                        ? 'text-coral-500'
                        : recommendation.trendPrediction.predictedChange < 0
                          ? 'text-amber-500'
                          : 'text-brand-500',
                    )}
                  >
                    ({recommendation.trendPrediction.predictedChange > 0 ? '+' : ''}
                    {recommendation.trendPrediction.predictedChange})
                  </span>
                </div>
                <div className="text-[12px] text-slate-500 leading-relaxed">
                  {recommendation.trendPrediction.explanation}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  <div className="text-[12.5px] font-bold text-slate-800">
                    Pourquoi cette recommandation
                  </div>
                </div>
                <div className="text-[12.5px] text-slate-600 leading-relaxed mb-3">
                  {recommendation.rationale.reasoning}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-400 font-medium">Fiabilité</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-700"
                      style={{ width: `${recommendation.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-brand-600 font-bold tabular-nums">
                    {(recommendation.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
