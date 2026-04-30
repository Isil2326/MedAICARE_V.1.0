// ============================================================================
// PATIENT DASHBOARD v4.0.0 — MediAI Care · Thème Naturel
// Inspiré mySugr : chaleureux, lisible, empathique
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Line, ComposedChart } from 'recharts';
import {
  Droplets, Activity, AlertTriangle, Sparkles, ChevronRight,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Plus, Utensils,
  Syringe, Footprints, FileText, Target, Pill, Clock,
  Calendar, Info, ScanLine, BarChart3, BookOpen, FlaskConical,
  Stethoscope, PenLine,
} from 'lucide-react';
import LabReportScanner from './LabReportScanner';
import LabReportTimeline from './LabReportTimeline';
import { getReportsForPatient } from '../engine/labReportService';
import type { LabReport } from '../types/medical';
import type { PatientVitals, MedicalRecommendation, Alert, PatientEvent } from '../types/medical';
import { generateSimulatedIoMTData, generateAlerts } from '../engine/simulator';
import { analyzeMedicalRisk } from '../engine/ai-engine';
import { generateRecommendations } from '../engine/recommendationService';
import { ClinicalRecommendationCard } from './ClinicalRecommendationCard';
import {
  generatePatientEvents, generateAGP, generateTIRStratified,
  getCarePlan, getMedications, getPatientStats,
} from '../engine/patient-data';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

type Tab = 'today' | 'journal' | 'trends' | 'treatment' | 'bilans';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDateRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function PatientTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'today',     label: "Aujourd'hui", Icon: Activity },
    { key: 'journal',   label: 'Journal',     Icon: BookOpen },
    { key: 'trends',    label: 'Tendances',   Icon: BarChart3 },
    { key: 'bilans',    label: 'Mes bilans',  Icon: FlaskConical },
    { key: 'treatment', label: 'Traitement',  Icon: Stethoscope },
  ];
  return (
    <div className="flex items-center gap-0 border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-1">
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all whitespace-nowrap border-b-2 -mb-px relative',
              isActive
                ? 'text-brand-700 border-brand-600'
                : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, onClick, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void;
  color: 'emerald' | 'coral' | 'amber' | 'sky';
}) {
  const iconClass = {
    emerald: 'icon-vivid-emerald',
    coral: 'icon-vivid-coral',
    amber: 'icon-vivid-amber',
    sky: 'icon-vivid-sky',
  }[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl transition-all hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-100 hover:border-transparent"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconClass)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState<Tab>('today');
  const [vitalsHistory, setVitalsHistory] = useState<PatientVitals[]>([]);
  const [currentVitals, setCurrentVitals] = useState<PatientVitals | null>(null);
  const [recommendation, setRecommendation] = useState<MedicalRecommendation | null>(null);
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [events, setEvents]     = useState<PatientEvent[]>([]);
  const [showXAI, setShowXAI]   = useState(false);
  const [logModal, setLogModal] = useState<null | 'meal' | 'insulin' | 'activity' | 'note'>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [labReports, setLabReports]   = useState<LabReport[]>([]);

  const refreshLabReports = useCallback(() => {
    setLabReports(getReportsForPatient(user?.id || 'p1'));
  }, [user?.id]);
  useEffect(() => { refreshLabReports(); }, [refreshLabReports]);

  const stats     = useMemo(() => getPatientStats(), []);
  const agp       = useMemo(() => generateAGP(), []);
  const tir       = useMemo(() => generateTIRStratified(), []);
  const carePlan  = useMemo(() => getCarePlan(user?.id || 'p1'), [user?.id]);
  const medications = useMemo(() => getMedications(user?.id || 'p1'), [user?.id]);

  const updateVitals = useCallback(() => {
    const v = generateSimulatedIoMTData('normal');
    setVitalsHistory(prev => [...prev.slice(-29), v]);
    setCurrentVitals(v);
    setRecommendation(analyzeMedicalRisk(v));
    const newAlerts = generateAlerts(v);
    if (newAlerts.length) setAlerts(prev => [...newAlerts, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    const init = Array.from({ length: 18 }, () => generateSimulatedIoMTData('normal'));
    setVitalsHistory(init);
    setCurrentVitals(init[init.length - 1]);
    setRecommendation(analyzeMedicalRisk(init[init.length - 1]));
    setEvents(generatePatientEvents(2));
    const id = setInterval(updateVitals, 5000);
    return () => clearInterval(id);
  }, [updateVitals]);

  const handleLogEvent = (type: 'meal' | 'insulin' | 'activity' | 'note', data: Partial<PatientEvent>) => {
    const evt: PatientEvent = { id: `evt_${Date.now()}`, type, timestamp: Date.now(), ...data };
    setEvents(prev => [evt, ...prev]);
    setLogModal(null);
  };

  if (!currentVitals || !recommendation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-400 text-[13px] font-medium">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Chargement de vos données…
        </div>
      </div>
    );
  }

  const glucose     = currentVitals.glucose;
  const inTarget    = glucose >= carePlan.glucoseTargetMin && glucose <= carePlan.glucoseTargetMax;
  const isLow       = glucose < carePlan.glucoseTargetMin;
  const activeAlert = alerts.find(a => !a.acknowledged);
  const firstName   = user?.name?.split(' ')[0] || 'Patient';

  // Glucose status
  const glucoseStatus = inTarget
    ? { label: 'Dans votre cible ✓', color: 'text-brand-700', bg: 'bg-brand-50 ring-brand-200' }
    : isLow
    ? { label: 'En dessous de la cible ↓', color: 'text-amber-700', bg: 'bg-amber-50 ring-amber-200' }
    : { label: 'Au dessus de la cible ↑', color: 'text-coral-600', bg: 'bg-coral-50 ring-coral-200' };

  const chartData = vitalsHistory.map(v => ({ time: formatTime(v.timestamp), g: v.glucose }));

  // Glucose trend from prediction or computed from last 2 readings
  const glucoseTrendDir: 'rising' | 'falling' | 'stable' =
    recommendation.trendPrediction?.direction ??
    (vitalsHistory.length >= 2
      ? Math.abs(vitalsHistory[vitalsHistory.length - 1].glucose - vitalsHistory[vitalsHistory.length - 2].glucose) < 3
        ? 'stable'
        : vitalsHistory[vitalsHistory.length - 1].glucose > vitalsHistory[vitalsHistory.length - 2].glucose
        ? 'rising'
        : 'falling'
      : 'stable');

  return (
    <div className="space-y-5 pb-20 lg:pb-0">

      {/* ── GREETING BANNER ── */}
      <div className="bg-white rounded-2xl card-shadow border border-slate-100/80 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Tableau de bord</div>
            <div className="text-[26px] font-bold text-slate-900 mt-0.5 tracking-tight">{firstName}</div>
            <div className="text-[12.5px] text-slate-400 mt-0.5 font-medium capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">TIR 7j</div>
              <div className="text-[24px] font-bold text-brand-600 tabular-nums leading-none">{tir.inRange}%</div>
              <div className={`text-[10px] font-bold mt-1 ${tir.inRange >= 70 ? 'text-brand-500' : tir.inRange >= 55 ? 'text-amber-500' : 'text-coral-500'}`}>
                {tir.inRange >= 70 ? 'Excellent' : tir.inRange >= 55 ? 'Correct' : 'À améliorer'}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Moy. 7j</div>
              <div className="text-[24px] font-bold text-slate-800 tabular-nums leading-none">{stats.avgGlucose}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">mg/dL</div>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">GMI</div>
              <div className="text-[24px] font-bold text-slate-800 tabular-nums leading-none">{stats.gmi}%</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">estimé</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERT CRITIQUE ── */}
      {activeAlert && (
        <div className="bg-coral-50 border border-coral-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-coral-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-coral-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-coral-800 truncate">{activeAlert.message}</div>
              <div className="text-[11px] text-coral-500 font-medium">Votre clinicien a été notifié · {formatTime(activeAlert.timestamp)}</div>
            </div>
          </div>
          <button
            onClick={() => setAlerts(prev => prev.map(a => a.id === activeAlert.id ? { ...a, acknowledged: true } : a))}
            className="px-3 py-1.5 rounded-xl bg-coral-100 hover:bg-coral-200 text-coral-700 text-[12px] font-bold transition shrink-0"
          >
            Compris
          </button>
        </div>
      )}

      {/* ── TABS ── */}
      <PatientTabs active={tab} onChange={setTab} />

      {/* ===================== TAB: AUJOURD'HUI ===================== */}
      {tab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Hero glycémie */}
          <div className="lg:col-span-2 bg-white rounded-2xl card-shadow p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Votre glycémie</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">FreeStyle Libre 3 · {formatTime(currentVitals.timestamp)}</div>
                </div>
              </div>
              <div className={cn('px-3 py-1 rounded-full text-[12px] font-bold ring-1', glucoseStatus.bg, glucoseStatus.color)}>
                {glucoseStatus.label}
              </div>
            </div>

            <div className="flex items-end gap-3 mb-5">
              <div className="text-[68px] leading-none font-black text-slate-900 tabular-nums">{glucose}</div>
              {/* Trend arrow — standard CGM display (LibreLink / Dexcom Clarity) */}
              <div className="pb-3 flex flex-col items-center gap-0.5">
                {glucoseTrendDir === 'rising'
                  ? <TrendingUp className="w-8 h-8 text-coral-500" />
                  : glucoseTrendDir === 'falling'
                  ? <TrendingDown className="w-8 h-8 text-amber-500" />
                  : <Minus className="w-7 h-7 text-brand-500" />
                }
                <span className={cn(
                  'text-[10px] font-bold',
                  glucoseTrendDir === 'rising' ? 'text-coral-500' : glucoseTrendDir === 'falling' ? 'text-amber-500' : 'text-brand-500'
                )}>
                  {glucoseTrendDir === 'rising' ? 'Hausse' : glucoseTrendDir === 'falling' ? 'Baisse' : 'Stable'}
                </span>
              </div>
              <div className="pb-2">
                <div className="text-[15px] text-slate-400 font-semibold">mg/dL</div>
                <div className="text-[11px] text-slate-300 mt-1">Cible {carePlan.glucoseTargetMin}–{carePlan.glucoseTargetMax}</div>
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
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 280]} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                    formatter={(value: any) => [`${value} mg/dL`, 'Glycémie']}
                  />
                  <ReferenceArea y1={carePlan.glucoseTargetMin} y2={carePlan.glucoseTargetMax} fill="rgba(16,185,129,0.07)" stroke="rgba(16,185,129,0.25)" strokeDasharray="4 3" />
                  <Area type="monotone" dataKey="g" stroke="#10B981" strokeWidth={2.5} fill="url(#gluGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Actions rapides */}
            <div className="bg-white rounded-2xl card-shadow p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Enregistrer</div>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction icon={Utensils}   label="Repas"    color="emerald" onClick={() => setLogModal('meal')} />
                <QuickAction icon={Syringe}    label="Insuline" color="coral"   onClick={() => setLogModal('insulin')} />
                <QuickAction icon={Footprints} label="Sport"    color="amber"   onClick={() => setLogModal('activity')} />
                <QuickAction icon={PenLine}    label="Note"     color="sky"     onClick={() => setLogModal('note')} />
              </div>
            </div>

            {/* Derniers évènements */}
            <div className="bg-white rounded-2xl card-shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Récent</div>
                <button onClick={() => setTab('journal')} className="text-[12px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5">
                  Tout voir <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5">
                {events.slice(0, 4).map(e => <EventRow key={e.id} event={e} compact />)}
              </div>
            </div>
          </div>

          {/* Recommandations IA — pleine largeur */}
          <div className="lg:col-span-3 space-y-4">
            {generateRecommendations(currentVitals, false).map((rec, i) => (
              <ClinicalRecommendationCard key={i} rec={rec} isClinic={false} />
            ))}

            {/* Carte recommandation globale IA */}
            <div className="bg-white rounded-2xl card-shadow p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Recommandation IA</div>
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

              {/* XAI panel */}
              {showXAI && recommendation.trendPrediction && recommendation.rationale && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {recommendation.trendPrediction.direction === 'rising'
                        ? <TrendingUp className="w-4 h-4 text-coral-500" />
                        : recommendation.trendPrediction.direction === 'falling'
                        ? <TrendingDown className="w-4 h-4 text-amber-500" />
                        : <Minus className="w-4 h-4 text-brand-500" />}
                      <div className="text-[12.5px] font-bold text-slate-800">Prévision dans 30 min</div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-[30px] font-black text-slate-900 tabular-nums">{recommendation.trendPrediction.predictedValue}</span>
                      <span className="text-[12px] text-slate-400 font-medium">mg/dL</span>
                      <span className={cn('text-[12px] font-bold ml-1',
                        recommendation.trendPrediction.predictedChange > 0 ? 'text-coral-500' :
                        recommendation.trendPrediction.predictedChange < 0 ? 'text-amber-500' : 'text-brand-500'
                      )}>
                        ({recommendation.trendPrediction.predictedChange > 0 ? '+' : ''}{recommendation.trendPrediction.predictedChange})
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 leading-relaxed">{recommendation.trendPrediction.explanation}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                      <div className="text-[12.5px] font-bold text-slate-800">Pourquoi cette recommandation</div>
                    </div>
                    <div className="text-[12.5px] text-slate-600 leading-relaxed mb-3">{recommendation.rationale.reasoning}</div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-400 font-medium">Fiabilité</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${recommendation.confidence * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-brand-600 font-bold tabular-nums">{(recommendation.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: JOURNAL ===================== */}
      {tab === 'journal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[17px] font-bold text-slate-900 tracking-tight">Mon journal</div>
              <div className="text-[12.5px] text-slate-400 font-medium">{events.length} évènements · 2 derniers jours</div>
            </div>
            <button
              onClick={() => setLogModal('meal')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold transition shadow-[0_2px_8px_rgba(5,150,105,0.3)]"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          <div className="bg-white rounded-2xl card-shadow divide-y divide-slate-100">
            {events.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-[13px] font-medium">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                Aucun évènement enregistré. Commencez à loguer !
              </div>
            ) : (
              events.map(e => (
                <div key={e.id} className="p-4">
                  <EventRow event={e} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB: TENDANCES ===================== */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Glycémie moyenne', value: stats.avgGlucose, unit: 'mg/dL', target: '< 154', ok: stats.avgGlucose < 154 },
              { label: 'GMI estimé',       value: `${stats.gmi}%`, unit: '',       target: '< 7%',  ok: stats.gmi < 7 },
              { label: 'Variabilité',      value: `${stats.cv}%`,  unit: '',       target: '≤ 36%', ok: stats.cv <= 36 },
              { label: 'Capteur actif',    value: `${stats.timeActive}%`, unit: '', target: '≥ 70%', ok: stats.timeActive >= 70 },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl card-shadow p-4">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">{s.label}</div>
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

          {/* TIR stratifié */}
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

          {/* AGP */}
          <div className="bg-white rounded-2xl card-shadow p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Profil Glycémique Ambulatoire (AGP)</div>
                <div className="text-[12px] text-slate-400">Médiane et percentiles sur 24h · 14 jours agrégés</div>
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
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#1e293b' }}
                    labelFormatter={h => `${h}h00`}
                  />
                  <ReferenceArea y1={70} y2={180} fill="rgba(16,185,129,0.07)" stroke="rgba(16,185,129,0.25)" strokeDasharray="4 3" />
                  <Area type="monotone" dataKey="p95" stroke="rgba(16,185,129,0.12)" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpRange)" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="rgba(241,245,249,1)" />
                  <Area type="monotone" dataKey="p5"  stroke="rgba(16,185,129,0.12)" strokeWidth={1} fill="none" />
                  <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 mt-3 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-brand-500 rounded inline-block" /> Médiane</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-3 bg-brand-200/50 rounded-sm inline-block" /> Percentile 25–75</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-3 border border-brand-200 rounded-sm inline-block" /> Cible 70–180</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: TRAITEMENT ===================== */}
      {tab === 'treatment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Objectifs */}
          <div className="bg-white rounded-2xl card-shadow p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
                <Target className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Mes objectifs</div>
                <div className="text-[12px] text-slate-400">Définis avec votre médecin</div>
              </div>
            </div>
            <div className="space-y-1.5 divide-y divide-slate-100">
              <ObjectiveRow label="Glycémie cible"         value={`${carePlan.glucoseTargetMin}–${carePlan.glucoseTargetMax} mg/dL`} />
              <ObjectiveRow label="HbA1c cible"            value={`< ${carePlan.hba1cTarget}%`} />
              <ObjectiveRow label="Insuline basale"        value={`${carePlan.insulinBasal} UI/jour`} />
              <ObjectiveRow label="Ratio glucides"         value={`1 UI / ${carePlan.insulinRatioCarbs} g`} />
              <ObjectiveRow label="Sensibilité insuline"   value={`1 UI ↓ ${carePlan.insulinSensitivity} mg/dL`} />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Mis à jour {formatDateRelative(carePlan.updatedAt)} · {carePlan.updatedBy}
            </div>
          </div>

          {/* Médicaments */}
          <div className="bg-white rounded-2xl card-shadow p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Pill className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Mes médicaments</div>
                <div className="text-[12px] text-slate-400">{medications.filter(m => m.active).length} traitements actifs</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {medications.map(m => (
                <div key={m.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-900">{m.name}</div>
                      <div className="text-[12px] text-slate-400 mt-0.5">{m.dosage} · {m.frequency}</div>
                    </div>
                    {m.active && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold shrink-0">Actif</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3 h-3" />
                    {m.prescribedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note médecin */}
          <div className="lg:col-span-2 bg-brand-50 border border-brand-100 rounded-2xl p-5">
            <div className="text-[12px] font-bold text-brand-600 uppercase tracking-wide mb-2 flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5" /> Note de votre médecin</div>
            <div className="text-[14px] text-slate-700 leading-relaxed italic">"{carePlan.notes}"</div>
          </div>
        </div>
      )}

      {/* ===================== TAB: MES BILANS ===================== */}
      {tab === 'bilans' && (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Vos bilans biologiques</div>
                <div className="text-[12px] text-slate-500 mt-0.5">Scannez le QR code de vos rapports pour enrichir votre dossier et améliorer la précision de l'IA.</div>
              </div>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold shadow-[0_2px_10px_rgba(5,150,105,0.3)] transition whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4" /> Scanner un bilan
            </button>
          </div>

          {labReports.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl card-shadow p-3 text-center">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Total</div>
                <div className="text-[24px] font-black text-slate-900 tabular-nums mt-0.5">{labReports.length}</div>
              </div>
              <div className="bg-white rounded-xl card-shadow p-3 text-center">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Dernier</div>
                <div className="text-[13px] font-bold text-brand-600 mt-1">
                  {new Date(labReports[0].payload.reportDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="bg-white rounded-xl card-shadow p-3 text-center">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Anomalies</div>
                <div className="text-[24px] font-black text-amber-500 tabular-nums mt-0.5">
                  {labReports.reduce((sum, r) => sum + r.validation.anomaliesDetected.length, 0)}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl card-shadow p-5">
            <div className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-brand-500" />
              Historique de mes analyses
            </div>
            <LabReportTimeline
              reports={labReports}
              onChanged={refreshLabReports}
              showDelete={true}
              emptyMessage="Aucun bilan enregistré. Scannez le QR code de votre prochain rapport pour commencer."
            />
          </div>
        </div>
      )}

      {/* LOG MODAL */}
      {logModal && (
        <LogEventModal
          type={logModal}
          onClose={() => setLogModal(null)}
          onSubmit={(data) => handleLogEvent(logModal, data)}
        />
      )}

      {/* LAB SCANNER */}
      {showScanner && (
        <LabReportScanner
          patientId={user?.id || 'p1'}
          patientName={user?.name}
          onClose={() => setShowScanner(false)}
          onSaved={() => refreshLabReports()}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const EVENT_ICONS = {
  meal:     Utensils,
  insulin:  Syringe,
  activity: Footprints,
  note:     PenLine,
  glucose:  Droplets,
};

function EventRow({ event, compact = false }: { event: PatientEvent; compact?: boolean }) {
  const config = {
    meal:     { bg: 'bg-brand-50',  text: 'text-brand-700' },
    insulin:  { bg: 'bg-coral-50',  text: 'text-coral-600' },
    activity: { bg: 'bg-amber-50',  text: 'text-amber-700' },
    note:     { bg: 'bg-blue-50',   text: 'text-blue-700' },
    glucose:  { bg: 'bg-slate-100', text: 'text-slate-600' },
  };
  const c = config[event.type];
  const EventIcon = EVENT_ICONS[event.type];

  let title = '';
  let subtitle = '';
  if (event.type === 'meal') {
    title = event.mealName || 'Repas';
    subtitle = `${event.carbs}g de glucides`;
  } else if (event.type === 'insulin') {
    title = `Insuline ${event.insulinType === 'basal' ? 'basale' : 'rapide'}`;
    subtitle = `${event.insulinUnits} UI`;
  } else if (event.type === 'activity') {
    title = event.activityType || 'Activité';
    subtitle = `${event.durationMin} min · ${event.intensity === 'low' ? 'Faible' : event.intensity === 'high' ? 'Intense' : 'Modérée'}`;
  } else if (event.type === 'note') {
    title = 'Note personnelle';
    subtitle = event.noteText || '';
  } else if (event.type === 'glucose') {
    title = 'Glycémie manuelle';
    subtitle = `${event.glucoseValue} mg/dL`;
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
        <EventIcon className={cn('w-4.5 h-4.5', c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-800 truncate">{title}</div>
        <div className="text-[11.5px] text-slate-400 truncate font-medium">{subtitle}</div>
      </div>
      <div className="text-[11px] text-slate-300 font-medium shrink-0">
        {compact ? formatTime(event.timestamp) : formatDateRelative(event.timestamp)}
      </div>
    </div>
  );
}

function ObjectiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-slate-500 font-medium">{label}</span>
      <span className="text-[13px] text-slate-900 font-bold tabular-nums">{value}</span>
    </div>
  );
}

function TIRBar({ tir }: { tir: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number } }) {
  const segments = [
    { key: 'veryLow',  label: 'Très bas',    range: '<54',     value: tir.veryLow,  color: 'bg-red-400',    target: '<1%',   dot: 'bg-red-400',    textColor: 'text-red-600' },
    { key: 'low',      label: 'Bas',          range: '54–69',   value: tir.low,      color: 'bg-amber-400',  target: '<4%',   dot: 'bg-amber-400',  textColor: 'text-amber-700' },
    { key: 'inRange',  label: 'Dans la cible',range: '70–180',  value: tir.inRange,  color: 'bg-brand-500',  target: '>70%',  dot: 'bg-brand-500',  textColor: 'text-brand-700' },
    { key: 'high',     label: 'Élevé',        range: '181–250', value: tir.high,     color: 'bg-orange-400', target: '<25%',  dot: 'bg-orange-400', textColor: 'text-orange-700' },
    { key: 'veryHigh', label: 'Très élevé',   range: '>250',    value: tir.veryHigh, color: 'bg-coral-500',  target: '<5%',   dot: 'bg-coral-500',  textColor: 'text-coral-700' },
  ];
  return (
    <div>
      <div className="flex h-14 rounded-2xl overflow-hidden gap-0.5 mb-4">
        {segments.map(s => (
          <div
            key={s.key}
            className={cn(s.color, 'flex items-center justify-center text-[11px] font-bold text-white transition-all')}
            style={{ width: `${s.value}%`, minWidth: s.value > 0 ? '20px' : 0 }}
          >
            {s.value >= 8 ? `${s.value}%` : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {segments.map(s => (
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

// ── Log Event Modal ───────────────────────────────────────────────────────────
function LogEventModal({ type, onClose, onSubmit }: {
  type: 'meal' | 'insulin' | 'activity' | 'note';
  onClose: () => void;
  onSubmit: (data: Partial<PatientEvent>) => void;
}) {
  const [carbs, setCarbs]             = useState(50);
  const [mealName, setMealName]       = useState('Collation');
  const [insulinUnits, setInsulinUnits] = useState(5);
  const [insulinType, setInsulinType] = useState<'rapid' | 'basal'>('rapid');
  const [activityType, setActivityType] = useState('Marche');
  const [durationMin, setDurationMin] = useState(30);
  const [intensity, setIntensity]     = useState<'low' | 'moderate' | 'high'>('moderate');
  const [noteText, setNoteText]       = useState('');

  const titles: Record<typeof type, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
    meal:     { label: 'Enregistrer un repas', Icon: Utensils,   color: 'text-brand-600 bg-brand-100' },
    insulin:  { label: "Dose d'insuline",      Icon: Syringe,    color: 'text-coral-600 bg-coral-50'  },
    activity: { label: 'Activité physique',    Icon: Footprints,  color: 'text-amber-700 bg-amber-50'  },
    note:     { label: 'Ajouter une note',     Icon: PenLine,    color: 'text-blue-700 bg-blue-50'    },
  };

  const handleSubmit = () => {
    if (type === 'meal')     onSubmit({ mealName, carbs });
    else if (type === 'insulin')  onSubmit({ insulinUnits, insulinType });
    else if (type === 'activity') onSubmit({ activityType, durationMin, intensity });
    else onSubmit({ noteText });
  };

  const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:ring-2 focus:ring-brand-400/25 focus:border-brand-300 transition';
  const selectCls = inputCls;

  const { label: modalTitle, Icon: ModalIcon, color: modalColor } = titles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl card-shadow-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', modalColor)}>
            <ModalIcon className="w-5 h-5" />
          </div>
          <div className="text-[17px] font-bold text-slate-900 tracking-tight">{modalTitle}</div>
        </div>

        {type === 'meal' && (
          <div className="space-y-3">
            <Field label="Repas">
              <select value={mealName} onChange={e => setMealName(e.target.value)} className={selectCls}>
                <option>Petit-déjeuner</option><option>Déjeuner</option><option>Dîner</option><option>Collation</option>
              </select>
            </Field>
            <Field label="Glucides (grammes)">
              <input type="number" value={carbs} onChange={e => setCarbs(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        )}

        {type === 'insulin' && (
          <div className="space-y-3">
            <Field label="Type d'insuline">
              <div className="flex gap-2">
                {(['rapid', 'basal'] as const).map(t => (
                  <button key={t} onClick={() => setInsulinType(t)}
                    className={cn('flex-1 px-3 py-2.5 rounded-xl text-[13px] font-bold transition',
                      insulinType === t ? 'bg-coral-100 text-coral-700 ring-1 ring-coral-300' : 'bg-slate-50 text-slate-500 border border-slate-200'
                    )}>
                    {t === 'rapid' ? 'Rapide' : 'Basale'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Unités (UI)">
              <input type="number" value={insulinUnits} onChange={e => setInsulinUnits(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        )}

        {type === 'activity' && (
          <div className="space-y-3">
            <Field label="Type d'activité">
              <select value={activityType} onChange={e => setActivityType(e.target.value)} className={selectCls}>
                <option>Marche</option><option>Vélo</option><option>Course</option><option>Natation</option><option>Musculation</option><option>Yoga</option>
              </select>
            </Field>
            <Field label="Durée (minutes)">
              <input type="number" value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Intensité">
              <div className="flex gap-2">
                {(['low', 'moderate', 'high'] as const).map(i => (
                  <button key={i} onClick={() => setIntensity(i)}
                    className={cn('flex-1 px-3 py-2.5 rounded-xl text-[13px] font-bold transition',
                      intensity === i ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200'
                    )}>
                    {i === 'low' ? 'Faible' : i === 'moderate' ? 'Modérée' : 'Intense'}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {type === 'note' && (
          <Field label="Votre note">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
              className={cn(inputCls, 'resize-none')} placeholder="Symptôme, sensation, contexte…" />
          </Field>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[14px] font-bold border border-slate-200 transition">
            Annuler
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-bold transition shadow-[0_2px_8px_rgba(5,150,105,0.3)] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] text-slate-500 font-bold uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
