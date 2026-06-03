// ============================================================================
// PATIENT DASHBOARD v1.1.0 — Refonte produit
// 4 onglets : Aujourd'hui · Journal · Tendances · Mon traitement
// Différenciation visuelle : accent teal/cyan, fond plus clair, ton personnel
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Line, ComposedChart } from 'recharts';
import {
  Droplets, Activity, AlertTriangle, Sparkles, ChevronRight,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Plus, Utensils,
  Syringe, Footprints, FileText, Target, Pill, Clock,
  Calendar, Info, ScanLine,
} from 'lucide-react';
import LabReportScanner from './LabReportScanner';
import LabReportTimeline from './LabReportTimeline';
import { getReportsForPatient } from '../engine/labReportService';
import type { LabReport } from '../types/medical';
import type { PatientVitals, MedicalRecommendation, Alert, PatientEvent } from '../types/medical';
import { generateSimulatedIoMTData, generateAlerts } from '../engine/simulator';
import { analyzeMedicalRisk } from '../engine/ai-engine';
import { generateRecommendations, ClinicalSuggestion } from '../engine/recommendationService';
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
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// ---- Tabs primitive (patient style) ----
function PatientTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'today', label: "Aujourd'hui", icon: Activity },
    { key: 'journal', label: 'Journal', icon: FileText },
    { key: 'trends', label: 'Tendances', icon: TrendingUp },
    { key: 'bilans', label: 'Mes bilans', icon: ScanLine },
    { key: 'treatment', label: 'Mon traitement', icon: Pill },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl overflow-x-auto">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-white ring-1 ring-teal-400/30 shadow-[0_4px_20px_-8px_rgba(20,184,166,0.5)]'
                : 'text-white/55 hover:text-white/85 hover:bg-white/[0.03]'
            )}
          >
            <Icon className="w-4 h-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Quick action button ----
function QuickAction({ icon: Icon, label, onClick, accent }: { icon: any; label: string; onClick: () => void; accent: 'teal' | 'rose' | 'amber' | 'violet' }) {
  const accentMap = {
    teal:   'from-teal-500/20 to-cyan-500/5 hover:from-teal-500/30 ring-teal-400/30 text-teal-200',
    rose:   'from-rose-500/20 to-pink-500/5 hover:from-rose-500/30 ring-rose-400/30 text-rose-200',
    amber:  'from-amber-500/20 to-orange-500/5 hover:from-amber-500/30 ring-amber-400/30 text-amber-200',
    violet: 'from-violet-500/20 to-purple-500/5 hover:from-violet-500/30 ring-violet-400/30 text-violet-200',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br ring-1 transition-all hover:scale-[1.02] active:scale-[0.98]',
        accentMap[accent]
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[11.5px] font-medium text-white/85">{label}</span>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('today');
  const [vitalsHistory, setVitalsHistory] = useState<PatientVitals[]>([]);
  const [currentVitals, setCurrentVitals] = useState<PatientVitals | null>(null);
  const [recommendation, setRecommendation] = useState<MedicalRecommendation | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<PatientEvent[]>([]);
  const [showXAI, setShowXAI] = useState(false);
  const [logModal, setLogModal] = useState<null | 'meal' | 'insulin' | 'activity' | 'note'>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const refreshLabReports = useCallback(() => {
    setLabReports(getReportsForPatient(user?.id || 'p1'));
  }, [user?.id]);
  useEffect(() => { refreshLabReports(); }, [refreshLabReports]);

  const stats = useMemo(() => getPatientStats(), []);
  const agp = useMemo(() => generateAGP(), []);
  const tir = useMemo(() => generateTIRStratified(), []);
  const carePlan = useMemo(() => getCarePlan(user?.id || 'p1'), [user?.id]);
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
    const evt: PatientEvent = {
      id: `evt_${Date.now()}`,
      type,
      timestamp: Date.now(),
      ...data,
    };
    setEvents(prev => [evt, ...prev]);
    setLogModal(null);
  };

  if (!currentVitals || !recommendation) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-white/55 text-[13px]">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse mr-2" />
        Chargement de vos données…
      </div>
    );
  }

  const glucose = currentVitals.glucose;
  const inTarget = glucose >= carePlan.glucoseTargetMin && glucose <= carePlan.glucoseTargetMax;
  const activeAlert = alerts.find(a => !a.acknowledged);
  const firstName = user?.name?.split(' ')[0] || 'Patient';

  return (
    <div className="space-y-5">
      {/* === GREETING + Quick stats banner === */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-500/[0.12] via-cyan-500/[0.06] to-transparent border border-teal-500/[0.18] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[12px] text-teal-200/70 uppercase tracking-wider font-medium">Bonjour</div>
            <div className="text-[24px] font-bold text-white mt-0.5">{firstName} 👋</div>
            <div className="text-[13px] text-white/60 mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10.5px] text-white/45 uppercase tracking-wider">TIR 7j</div>
              <div className="text-[18px] font-bold text-emerald-300 tabular-nums mt-0.5">{tir.inRange}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10.5px] text-white/45 uppercase tracking-wider">Glycémie moy.</div>
              <div className="text-[18px] font-bold text-white tabular-nums mt-0.5">{stats.avgGlucose}</div>
            </div>
            <div className="text-center">
              <div className="text-[10.5px] text-white/45 uppercase tracking-wider">GMI</div>
              <div className="text-[18px] font-bold text-white tabular-nums mt-0.5">{stats.gmi}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical alert */}
      {activeAlert && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/[0.12] to-rose-500/[0.04] backdrop-blur-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 ring-1 ring-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{activeAlert.message}</div>
              <div className="text-[11px] text-rose-200/70">Votre clinicien a été notifié · {formatTime(activeAlert.timestamp)}</div>
            </div>
          </div>
          <button
            onClick={() => setAlerts(prev => prev.map(a => a.id === activeAlert.id ? { ...a, acknowledged: true } : a))}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-[12px] font-medium transition"
          >
            Compris
          </button>
        </div>
      )}

      {/* TABS */}
      <PatientTabs active={tab} onChange={setTab} />

      {/* ====================== TAB: AUJOURD'HUI ====================== */}
      {tab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hero — Glycémie + courbe */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/30 to-cyan-500/15 ring-1 ring-teal-500/30 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <div className="text-[11px] text-white/55 uppercase tracking-wider font-medium">Votre glycémie</div>
                  <div className="text-[10.5px] text-white/40 mt-0.5">FreeStyle Libre 3 · mise à jour {formatTime(currentVitals.timestamp)}</div>
                </div>
              </div>
              <div className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5',
                inTarget
                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
                  : glucose < carePlan.glucoseTargetMin
                    ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25'
                    : 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', inTarget ? 'bg-emerald-400' : glucose < carePlan.glucoseTargetMin ? 'bg-amber-400' : 'bg-orange-400')} />
                {inTarget ? 'Dans votre cible' : glucose < carePlan.glucoseTargetMin ? 'En dessous' : 'Au dessus'}
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="text-[64px] leading-none font-bold text-white tabular-nums tracking-tight">{glucose}</div>
              <div className="pb-2">
                <div className="text-[14px] text-white/55 font-medium">mg/dL</div>
                <div className="text-[11.5px] text-white/45 mt-1">Cible {carePlan.glucoseTargetMin}–{carePlan.glucoseTargetMax}</div>
              </div>
            </div>

            <div className="mt-4 h-[180px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vitalsHistory.map(v => ({ time: formatTime(v.timestamp), g: v.glucose }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gluGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 280]} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(11, 18, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    formatter={(value: any) => [`${value} mg/dL`, 'Glycémie']}
                  />
                  <ReferenceArea y1={carePlan.glucoseTargetMin} y2={carePlan.glucoseTargetMax} fill="rgba(16, 185, 129, 0.06)" stroke="rgba(16, 185, 129, 0.15)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="g" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gluGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column — Quick actions + Last events */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="text-[11px] text-white/55 uppercase tracking-wider font-medium mb-3">Action rapide</div>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction icon={Utensils} label="Repas" accent="teal" onClick={() => setLogModal('meal')} />
                <QuickAction icon={Syringe} label="Insuline" accent="rose" onClick={() => setLogModal('insulin')} />
                <QuickAction icon={Footprints} label="Activité" accent="amber" onClick={() => setLogModal('activity')} />
                <QuickAction icon={FileText} label="Note" accent="violet" onClick={() => setLogModal('note')} />
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-white/55 uppercase tracking-wider font-medium">Derniers évènements</div>
                <button onClick={() => setTab('journal')} className="text-[11px] text-teal-300 hover:text-teal-200 flex items-center gap-0.5">
                  Tout voir <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {events.slice(0, 4).map(e => (
                  <EventRow key={e.id} event={e} compact />
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation — Full width */}
          <div className="lg:col-span-3">
            {generateRecommendations(currentVitals, false).map((rec, i) => (
              <ClinicalRecommendationCard key={i} rec={rec} isClinic={false} />
            ))}

            <div className="rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] border border-violet-500/[0.18] backdrop-blur-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/15 ring-1 ring-violet-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-violet-200" />
                  </div>
                  <div>
                    <div className="text-[11px] text-violet-200/70 uppercase tracking-wider font-medium">Recommandation globale IA</div>
                    <div className="text-[15.5px] font-semibold text-white mt-0.5">{recommendation.action}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowXAI(!showXAI)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/85 text-[12px] font-medium flex items-center gap-1.5 transition shrink-0"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showXAI ? "Masquer l'explication" : 'Pourquoi ?'}
                </button>
              </div>

              {recommendation.actionDetails.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {recommendation.actionDetails.slice(0, 3).map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-white/75">
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-300 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* XAI panel — patient-friendly */}
              {showXAI && recommendation.trendPrediction && recommendation.rationale && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Prediction */}
                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {recommendation.trendPrediction.direction === 'rising'
                        ? <TrendingUp className="w-4 h-4 text-orange-300" />
                        : recommendation.trendPrediction.direction === 'falling'
                          ? <TrendingDown className="w-4 h-4 text-amber-300" />
                          : <Minus className="w-4 h-4 text-emerald-300" />}
                      <div className="text-[12.5px] font-semibold text-white">Dans 30 minutes</div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-[28px] font-bold text-white tabular-nums">{recommendation.trendPrediction.predictedValue}</span>
                      <span className="text-[11px] text-white/55">mg/dL</span>
                      <span className={cn('text-[11.5px] font-medium ml-1',
                        recommendation.trendPrediction.predictedChange > 0 ? 'text-orange-300' :
                        recommendation.trendPrediction.predictedChange < 0 ? 'text-amber-300' : 'text-emerald-300'
                      )}>
                        ({recommendation.trendPrediction.predictedChange > 0 ? '+' : ''}{recommendation.trendPrediction.predictedChange})
                      </span>
                    </div>
                    <div className="text-[11.5px] text-white/55 leading-relaxed">{recommendation.trendPrediction.explanation}</div>
                  </div>

                  {/* Rationale */}
                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <div className="text-[12.5px] font-semibold text-white">Pourquoi cette recommandation</div>
                    </div>
                    <div className="text-[12.5px] text-white/75 leading-relaxed mb-2">{recommendation.rationale.reasoning}</div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.05]">
                      <span className="text-[10.5px] text-white/45">Fiabilité</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${recommendation.confidence * 100}%` }} />
                      </div>
                      <span className="text-[10.5px] text-emerald-300 font-semibold tabular-nums">{(recommendation.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================== TAB: JOURNAL ====================== */}
      {tab === 'journal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[16px] font-semibold text-white">Mon journal</div>
              <div className="text-[12px] text-white/55">{events.length} évènements · 2 derniers jours</div>
            </div>
            <button
              onClick={() => setLogModal('meal')}
              className="px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-100 text-[12px] font-medium flex items-center gap-1.5 ring-1 ring-teal-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl divide-y divide-white/[0.04]">
            {events.length === 0 ? (
              <div className="p-12 text-center text-white/50 text-[13px]">Aucun évènement enregistré.</div>
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

      {/* ====================== TAB: TENDANCES ====================== */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Glycémie moyenne', value: stats.avgGlucose, unit: 'mg/dL', target: '< 154' },
              { label: 'GMI estimé', value: `${stats.gmi}%`, unit: '', target: '< 7%' },
              { label: 'Variabilité', value: `${stats.cv}%`, unit: '', target: '≤ 36%' },
              { label: 'Capteur actif', value: `${stats.timeActive}%`, unit: '', target: '≥ 70%' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
                <div className="text-[10.5px] text-white/45 uppercase tracking-wider">{s.label}</div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-[24px] font-bold text-white tabular-nums">{s.value}</span>
                  <span className="text-[11px] text-white/45">{s.unit}</span>
                </div>
                <div className="text-[10.5px] text-white/45 mt-1">Cible {s.target}</div>
              </div>
            ))}
          </div>

          {/* TIR stratifié */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-teal-300" />
              <div>
                <div className="text-[14px] font-semibold text-white">Time in Range — 14 derniers jours</div>
                <div className="text-[11.5px] text-white/55">Standard ATTD · 5 zones de glycémie</div>
              </div>
            </div>
            <TIRBar tir={tir} />
          </div>

          {/* AGP */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-cyan-300" />
              <div>
                <div className="text-[14px] font-semibold text-white">Profil glycémique ambulatoire (AGP)</div>
                <div className="text-[11.5px] text-white/55">Médiane et percentiles sur 24h · 14 jours agrégés</div>
              </div>
            </div>
            <div className="h-[260px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={agp} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agpRange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(11, 18, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                    labelFormatter={(h) => `${h}h00`}
                  />
                  <ReferenceArea y1={70} y2={180} fill="rgba(16, 185, 129, 0.06)" stroke="rgba(16, 185, 129, 0.15)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="p95" stroke="rgba(20,184,166,0.2)" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpRange)" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="rgba(11, 18, 32, 1)" />
                  <Area type="monotone" dataKey="p5" stroke="rgba(20,184,166,0.2)" strokeWidth={1} fill="none" />
                  <Line type="monotone" dataKey="p50" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10.5px] text-white/55">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400" /> Médiane</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-teal-500/30 rounded-sm" /> Percentile 25–75</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 border border-emerald-500/30 rounded-sm" /> Cible 70–180</span>
            </div>
          </div>
        </div>
      )}

      {/* ====================== TAB: MON TRAITEMENT ====================== */}
      {tab === 'treatment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cibles */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-teal-300" />
              <div>
                <div className="text-[14px] font-semibold text-white">Mes objectifs</div>
                <div className="text-[11.5px] text-white/55">Définis avec votre médecin</div>
              </div>
            </div>
            <div className="space-y-3">
              <ObjectiveRow label="Glycémie cible" value={`${carePlan.glucoseTargetMin}–${carePlan.glucoseTargetMax} mg/dL`} />
              <ObjectiveRow label="HbA1c cible" value={`< ${carePlan.hba1cTarget}%`} />
              <ObjectiveRow label="Insuline basale" value={`${carePlan.insulinBasal} UI/jour`} />
              <ObjectiveRow label="Ratio glucides" value={`1 UI / ${carePlan.insulinRatioCarbs} g`} />
              <ObjectiveRow label="Sensibilité insulinique" value={`1 UI ↓ ${carePlan.insulinSensitivity} mg/dL`} />
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-2 text-[10.5px] text-white/45">
              <Clock className="w-3 h-3" />
              Mis à jour {formatDateRelative(carePlan.updatedAt)} par {carePlan.updatedBy}
            </div>
          </div>

          {/* Médicaments */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Pill className="w-5 h-5 text-violet-300" />
              <div>
                <div className="text-[14px] font-semibold text-white">Mes médicaments</div>
                <div className="text-[11.5px] text-white/55">{medications.filter(m => m.active).length} traitements actifs</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {medications.map(m => (
                <div key={m.id} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white">{m.name}</div>
                      <div className="text-[11.5px] text-white/55 mt-0.5">{m.dosage} · {m.frequency}</div>
                    </div>
                    {m.active && (
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 text-[10px] text-emerald-300 font-semibold">Actif</div>
                    )}
                  </div>
                  <div className="text-[10.5px] text-white/40 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Prescrit par {m.prescribedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes médecin */}
          <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="text-[14px] font-semibold text-white mb-2">Note de votre médecin</div>
            <div className="text-[12.5px] text-white/70 leading-relaxed italic">"{carePlan.notes}"</div>
          </div>
        </div>
      )}

      {/* ====================== TAB: MES BILANS ====================== */}
      {tab === 'bilans' && (
        <div className="space-y-4">
          {/* Header bilans avec CTA scan */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-500/[0.08] to-cyan-500/[0.03] border border-teal-500/20 backdrop-blur-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 ring-1 ring-teal-500/30 flex items-center justify-center flex-shrink-0">
                <ScanLine className="w-5 h-5 text-teal-300" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-white">Vos bilans biologiques</div>
                <div className="text-[12px] text-white/55 mt-0.5">
                  Scannez le QR code de vos rapports de laboratoire pour enrichir votre dossier
                  et améliorer la précision des recommandations.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-[13px] font-semibold shadow-[0_4px_20px_-4px_rgba(20,184,166,0.5)] transition whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4" />
              Scanner un bilan
            </button>
          </div>

          {/* Stats rapides bilans */}
          {labReports.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-3 text-center">
                <div className="text-[10.5px] text-white/45 uppercase tracking-wider">Total bilans</div>
                <div className="text-[22px] font-bold text-white tabular-nums mt-0.5">{labReports.length}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-3 text-center">
                <div className="text-[10.5px] text-white/45 uppercase tracking-wider">Dernier</div>
                <div className="text-[12px] font-semibold text-teal-200 mt-1">
                  {new Date(labReports[0].payload.reportDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-3 text-center">
                <div className="text-[10.5px] text-white/45 uppercase tracking-wider">Anomalies</div>
                <div className="text-[22px] font-bold text-amber-300 tabular-nums mt-0.5">
                  {labReports.reduce((sum, r) => sum + r.validation.anomaliesDetected.length, 0)}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-5">
            <div className="text-[14px] font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-300" />
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

      {/* ====================== LOG MODAL ====================== */}
      {logModal && (
        <LogEventModal
          type={logModal}
          onClose={() => setLogModal(null)}
          onSubmit={(data) => handleLogEvent(logModal, data)}
        />
      )}

      {/* ====================== LAB REPORT SCANNER ====================== */}
      {showScanner && (
        <LabReportScanner
          patientId={user?.id || 'p1'}
          patientName={user?.name}
          onClose={() => setShowScanner(false)}
          onSaved={(_report) => refreshLabReports()}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EventRow({ event, compact = false }: { event: PatientEvent; compact?: boolean }) {
  const config = {
    meal:     { icon: Utensils,    color: 'text-teal-300',   bg: 'bg-teal-500/15 ring-teal-500/25' },
    insulin:  { icon: Syringe,     color: 'text-rose-300',   bg: 'bg-rose-500/15 ring-rose-500/25' },
    activity: { icon: Footprints,  color: 'text-amber-300',  bg: 'bg-amber-500/15 ring-amber-500/25' },
    note:     { icon: FileText,    color: 'text-violet-300', bg: 'bg-violet-500/15 ring-violet-500/25' },
    glucose:  { icon: Droplets,    color: 'text-cyan-300',   bg: 'bg-cyan-500/15 ring-cyan-500/25' },
  };
  const c = config[event.type];
  const Icon = c.icon;

  let title = '';
  let subtitle = '';
  if (event.type === 'meal') {
    title = event.mealName || 'Repas';
    subtitle = `${event.carbs}g glucides`;
  } else if (event.type === 'insulin') {
    title = `Insuline ${event.insulinType === 'basal' ? 'basale' : 'rapide'}`;
    subtitle = `${event.insulinUnits} UI`;
  } else if (event.type === 'activity') {
    title = event.activityType || 'Activité';
    subtitle = `${event.durationMin} min · intensité ${event.intensity === 'low' ? 'faible' : event.intensity === 'high' ? 'élevée' : 'modérée'}`;
  } else if (event.type === 'note') {
    title = 'Note';
    subtitle = event.noteText || '';
  } else if (event.type === 'glucose') {
    title = 'Glycémie manuelle';
    subtitle = `${event.glucoseValue} mg/dL`;
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center ring-1 shrink-0', c.bg)}>
        <Icon className={cn('w-4 h-4', c.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-white truncate">{title}</div>
        <div className="text-[11.5px] text-white/55 truncate">{subtitle}</div>
      </div>
      <div className="text-[10.5px] text-white/40 shrink-0">{compact ? formatTime(event.timestamp) : formatDateRelative(event.timestamp)}</div>
    </div>
  );
}

function ObjectiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px] text-white/65">{label}</span>
      <span className="text-[12.5px] text-white font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function TIRBar({ tir }: { tir: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number } }) {
  const segments = [
    { key: 'veryLow', label: 'Très bas', range: '<54', value: tir.veryLow, color: 'bg-red-500', target: '<1%', textColor: 'text-red-300' },
    { key: 'low', label: 'Bas', range: '54–69', value: tir.low, color: 'bg-amber-500', target: '<4%', textColor: 'text-amber-300' },
    { key: 'inRange', label: 'Cible', range: '70–180', value: tir.inRange, color: 'bg-emerald-500', target: '>70%', textColor: 'text-emerald-300' },
    { key: 'high', label: 'Élevé', range: '181–250', value: tir.high, color: 'bg-orange-500', target: '<25%', textColor: 'text-orange-300' },
    { key: 'veryHigh', label: 'Très élevé', range: '>250', value: tir.veryHigh, color: 'bg-rose-600', target: '<5%', textColor: 'text-rose-300' },
  ];
  return (
    <div>
      <div className="flex h-12 rounded-xl overflow-hidden ring-1 ring-white/[0.06]">
        {segments.map(s => (
          <div key={s.key} className={cn(s.color, 'flex items-center justify-center text-[11px] font-bold text-white relative')} style={{ width: `${s.value}%`, minWidth: s.value > 0 ? '24px' : 0 }}>
            {s.value >= 8 ? `${s.value}%` : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
        {segments.map(s => (
          <div key={s.key} className="flex items-start gap-2">
            <div className={cn('w-1 h-9 rounded-full', s.color)} />
            <div>
              <div className={cn('text-[11px] font-semibold', s.textColor)}>{s.label}</div>
              <div className="text-[10px] text-white/50">{s.range} mg/dL</div>
              <div className="text-[10px] text-white/40">{s.value}% · cible {s.target}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// LogEventModal — Saisie d'évènement
// ----------------------------------------------------------------------------

function LogEventModal({ type, onClose, onSubmit }: { type: 'meal' | 'insulin' | 'activity' | 'note'; onClose: () => void; onSubmit: (data: Partial<PatientEvent>) => void }) {
  const [carbs, setCarbs] = useState(50);
  const [mealName, setMealName] = useState('Collation');
  const [insulinUnits, setInsulinUnits] = useState(5);
  const [insulinType, setInsulinType] = useState<'rapid' | 'basal'>('rapid');
  const [activityType, setActivityType] = useState('Marche');
  const [durationMin, setDurationMin] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [noteText, setNoteText] = useState('');

  const titles = {
    meal: 'Enregistrer un repas',
    insulin: 'Enregistrer une dose',
    activity: 'Enregistrer une activité',
    note: 'Ajouter une note',
  };

  const handleSubmit = () => {
    if (type === 'meal') onSubmit({ mealName, carbs });
    else if (type === 'insulin') onSubmit({ insulinUnits, insulinType });
    else if (type === 'activity') onSubmit({ activityType, durationMin, intensity });
    else onSubmit({ noteText });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0F1729] border border-white/10 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="text-[15px] font-semibold text-white mb-4">{titles[type]}</div>

        {type === 'meal' && (
          <div className="space-y-3">
            <Field label="Nom du repas">
              <select value={mealName} onChange={e => setMealName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-teal-500/40">
                <option>Petit-déjeuner</option><option>Déjeuner</option><option>Dîner</option><option>Collation</option>
              </select>
            </Field>
            <Field label="Glucides (grammes)">
              <input type="number" value={carbs} onChange={e => setCarbs(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-teal-500/40" />
            </Field>
          </div>
        )}

        {type === 'insulin' && (
          <div className="space-y-3">
            <Field label="Type">
              <div className="flex gap-2">
                {(['rapid', 'basal'] as const).map(t => (
                  <button key={t} onClick={() => setInsulinType(t)} className={cn('flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition', insulinType === t ? 'bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/30' : 'bg-white/5 text-white/60 border border-white/10')}>
                    {t === 'rapid' ? 'Rapide' : 'Basale'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Unités (UI)">
              <input type="number" value={insulinUnits} onChange={e => setInsulinUnits(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-rose-500/40" />
            </Field>
          </div>
        )}

        {type === 'activity' && (
          <div className="space-y-3">
            <Field label="Type d'activité">
              <select value={activityType} onChange={e => setActivityType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40">
                <option>Marche</option><option>Vélo</option><option>Course</option><option>Natation</option><option>Musculation</option><option>Yoga</option>
              </select>
            </Field>
            <Field label="Durée (minutes)">
              <input type="number" value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40" />
            </Field>
            <Field label="Intensité">
              <div className="flex gap-2">
                {(['low', 'moderate', 'high'] as const).map(i => (
                  <button key={i} onClick={() => setIntensity(i)} className={cn('flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition', intensity === i ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/30' : 'bg-white/5 text-white/60 border border-white/10')}>
                    {i === 'low' ? 'Faible' : i === 'moderate' ? 'Modérée' : 'Élevée'}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {type === 'note' && (
          <Field label="Votre note">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-violet-500/40 resize-none" placeholder="Symptôme, sensation, contexte…" />
          </Field>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/75 text-[13px] font-medium border border-white/10 transition">Annuler</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-[13px] font-semibold transition">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-white/55 uppercase tracking-wider font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
