// ============================================================================
// DOCTOR DASHBOARD v1.1.0 — Refonte produit
// 3 onglets : Cohorte · Fiche patient · Performance modèles
// Différenciation visuelle : accent bleu/violet, densité élevée, ton clinique
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
  Line, ComposedChart, ReferenceArea,
} from 'recharts';
import {
  Users, AlertTriangle, Search, Brain, Activity,
  Download, ChevronRight, Sparkles, Filter,
  FileText, ArrowLeft, Stethoscope,
  ClipboardList, MessageSquare, Target, Clock,
  Phone, Edit3, Zap, CheckCircle2, XCircle, Bell,
  History, ShieldCheck,
} from 'lucide-react';
import type { Patient, ClinicalNote, TimeRangeKey, HistoricalEntry, PendingClinicalDecision } from '../types/medical';
import { getSimulatedPatients } from '../engine/simulator';
import { getModelMetrics } from '../engine/ai-engine';
import {
  generateAGP, generateTIRStratified, getCarePlan,
  generateClinicalNotes, getMedications,
  generateHistoricalGlucose, generateHistoricalEntries, getPendingDecisions,
  getTimeRange,
} from '../engine/patient-data';
import { TimeRangeSelector } from './ui/TimeRangeSelector';
import TreatmentEditor from './TreatmentEditor';
import LabReportTimeline from './LabReportTimeline';
import { getReportsForPatient } from '../engine/labReportService';
import { cn } from '../utils/cn';

const RISK_META: Record<string, { label: string; color: string; bg: string; ring: string; text: string }> = {
  LOW:      { label: 'Stable',   color: '#10b981', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30', text: 'text-emerald-300' },
  MODERATE: { label: 'Modéré',   color: '#f59e0b', bg: 'bg-amber-500/15',   ring: 'ring-amber-500/30',   text: 'text-amber-300' },
  HIGH:     { label: 'Élevé',    color: '#f97316', bg: 'bg-orange-500/15',  ring: 'ring-orange-500/30',  text: 'text-orange-300' },
  CRITICAL: { label: 'Critique', color: '#ef4444', bg: 'bg-rose-500/15',    ring: 'ring-rose-500/30',    text: 'text-rose-300' },
};

type Tab = 'cohort' | 'patient' | 'models';

// ============================================================================
// MAIN
// ============================================================================

export default function DoctorDashboard() {
  const patients = useMemo(() => getSimulatedPatients(), []);
  const modelMetrics = useMemo(() => getModelMetrics(), []);
  const [tab, setTab] = useState<Tab>('cohort');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('all');

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || p.currentRisk === riskFilter;
    return matchSearch && matchRisk;
  });

  const avgTIR = Math.round(patients.reduce((s, p) => s + p.tir, 0) / patients.length);
  const criticalCount = patients.filter(p => p.currentRisk === 'CRITICAL' || p.currentRisk === 'HIGH').length;
  const totalAlerts = patients.reduce((s, p) => s + p.alerts, 0);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setTab('patient');
  };

  return (
    <div className="space-y-5">
      {/* === TOP BAR — Clinical metrics row === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKPI label="Patients suivis" value={patients.length} unit="actifs" icon={Users} accent="blue" />
        <ClinicalKPI label="Cas prioritaires" value={criticalCount} unit={`/ ${patients.length}`} icon={AlertTriangle} accent="rose" highlight />
        <ClinicalKPI label="TIR cohorte" value={`${avgTIR}%`} unit="cible ≥70%" icon={Target} accent="emerald" />
        <ClinicalKPI label="Alertes 24h" value={totalAlerts} unit="à traiter" icon={MessageSquare} accent="violet" />
      </div>

      {/* === Tab switcher (clinician style) === */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <ClinicianTab active={tab === 'cohort'} onClick={() => setTab('cohort')} icon={Users} label="Cohorte" badge={patients.length} />
          <ClinicianTab active={tab === 'patient'} onClick={() => selectedPatient && setTab('patient')} icon={Stethoscope} label="Fiche patient" disabled={!selectedPatient} />
          <ClinicianTab active={tab === 'models'} onClick={() => setTab('models')} icon={Brain} label="Performance IA" />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/75 text-[12px] font-medium flex items-center gap-1.5 transition">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-[12px] font-semibold flex items-center gap-1.5 transition shadow-[0_4px_20px_-8px_rgba(59,130,246,0.6)]">
            <FileText className="w-3.5 h-3.5" /> Rapport ATTD
          </button>
        </div>
      </div>

      {/* ============== TAB: COHORTE ============== */}
      {tab === 'cohort' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Patients list */}
          <div className="xl:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.05]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-[14px] font-semibold text-white">Liste des patients</div>
                  <div className="text-[11px] text-white/50">{filtered.length} sur {patients.length} · triés par risque IA</div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher patient ou ID…"
                    className="pl-8 pr-3 py-1.5 w-56 rounded-lg bg-white/[0.04] border border-white/[0.1] text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                {(['all', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map(r => {
                  const count = r === 'all' ? patients.length : patients.filter(p => p.currentRisk === r).length;
                  const label = r === 'all' ? 'Tous' : RISK_META[r].label;
                  return (
                    <button
                      key={r}
                      onClick={() => setRiskFilter(r)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                        riskFilter === r
                          ? r === 'all' ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/30' : cn(RISK_META[r].bg, RISK_META[r].text, 'ring-1', RISK_META[r].ring)
                          : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
                      )}
                    >
                      {label} <span className="opacity-60 ml-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[640px] overflow-y-auto divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-white/45 text-[13px]">Aucun patient ne correspond aux critères.</div>
              ) : (
                filtered.map(p => {
                  const meta = RISK_META[p.currentRisk];
                  const isSel = selectedPatient?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all',
                        isSel ? 'bg-blue-500/[0.08]' : 'hover:bg-white/[0.03]'
                      )}
                    >
                      <div
                        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${meta.color}40, ${meta.color}15)`, boxShadow: `inset 0 0 0 1px ${meta.color}30` }}
                      >
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        {p.alerts > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#070B14]">
                            {p.alerts}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 min-w-0">
                          <div className="text-[13px] font-semibold text-white truncate">{p.name}</div>
                          <div className="text-[10.5px] text-white/45">{p.id} · {p.age}a · {p.diabetesType}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-[11.5px] font-semibold text-white tabular-nums">{p.hba1c}%</div>
                          <div className="text-[9.5px] text-white/40 uppercase tracking-wider">HbA1c</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-[11.5px] font-semibold text-white tabular-nums">{p.tir}%</div>
                          <div className="text-[9.5px] text-white/40 uppercase tracking-wider">TIR</div>
                        </div>
                        <div className="col-span-3 text-right">
                          <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ring-1', meta.bg, meta.ring, meta.text)}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                            {meta.label}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — Risk distribution + cohort trend */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <div className="text-[13px] font-semibold text-white">Stratification du risque</div>
              </div>
              <div className="space-y-3">
                {(['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map(r => {
                  const count = patients.filter(p => p.currentRisk === r).length;
                  const pct = Math.round((count / patients.length) * 100);
                  const meta = RISK_META[r];
                  return (
                    <div key={r}>
                      <div className="flex items-center justify-between text-[11.5px] mb-1">
                        <span className="text-white/75">{meta.label}</span>
                        <span className="text-white/55 tabular-nums">{count} <span className="text-white/35">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}80)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-300" />
                <div>
                  <div className="text-[13px] font-semibold text-white">TIR cohorte 14j</div>
                  <div className="text-[10.5px] text-white/50">Cible ADA ≥ 70%</div>
                </div>
              </div>
              <div className="h-[150px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 14 }, (_, i) => ({ d: `J-${13 - i}`, t: 60 + Math.round(Math.sin(i / 2) * 8 + Math.random() * 4) }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cohortTir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="d" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} domain={[40, 90]} />
                    <Tooltip contentStyle={{ background: 'rgba(11, 18, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                    <Area type="monotone" dataKey="t" stroke="#10b981" strokeWidth={2} fill="url(#cohortTir)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== TAB: PATIENT FILE ============== */}
      {tab === 'patient' && selectedPatient && (
        <PatientFile patient={selectedPatient} onBack={() => setTab('cohort')} />
      )}

      {/* ============== TAB: MODEL PERFORMANCE ============== */}
      {tab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {modelMetrics.map((m, i) => {
            const colors = [
              { gauge: '#3b82f6', accent: 'blue' as const },
              { gauge: '#8b5cf6', accent: 'violet' as const },
              { gauge: '#06b6d4', accent: 'cyan' as const },
            ][i % 3];
            return (
              <div key={m.name} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1',
                      colors.accent === 'blue' ? 'bg-blue-500/15 ring-blue-500/25' :
                      colors.accent === 'violet' ? 'bg-violet-500/15 ring-violet-500/25' :
                      'bg-cyan-500/15 ring-cyan-500/25'
                    )}>
                      <Brain className={cn('w-5 h-5',
                        colors.accent === 'blue' ? 'text-blue-300' :
                        colors.accent === 'violet' ? 'text-violet-300' :
                        'text-cyan-300'
                      )} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-white">{m.name}</div>
                      <div className="text-[10.5px] text-white/45">v{m.version} · {m.lastTrained}</div>
                    </div>
                  </div>
                  {i === 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 text-[10px] text-emerald-300 font-semibold">Production</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] ring-1 ring-white/10 text-[10px] text-white/55 font-medium">Candidat</span>
                  )}
                </div>

                <div className="h-[140px] -mx-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: 'F1', value: m.f1Score * 100, fill: colors.gauge }]} startAngle={210} endAngle={-30}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.06)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-2">
                    <div className="text-[26px] font-bold text-white tabular-nums">{(m.f1Score * 100).toFixed(1)}</div>
                    <div className="text-[9.5px] text-white/45 uppercase tracking-wider">F1-Score</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Précision', value: m.precision },
                    { label: 'Rappel', value: m.recall },
                    { label: 'Spécificité', value: m.specificity },
                    { label: 'AUC-ROC', value: m.auc },
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-white/65">{metric.label}</span>
                        <span className="text-white font-semibold tabular-nums">{(metric.value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${metric.value * 100}%`, background: colors.gauge }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.05] text-[10.5px] text-white/45">
                  Validé sur {m.trainingSamples.toLocaleString()} échantillons · k=5 cross-validation
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ClinicalKPI({ label, value, unit, icon: Icon, accent, highlight }: { label: string; value: string | number; unit?: string; icon: any; accent: 'blue' | 'rose' | 'emerald' | 'violet'; highlight?: boolean }) {
  const accentMap = {
    blue:    'bg-blue-500/15 ring-blue-500/25 text-blue-300',
    rose:    'bg-rose-500/15 ring-rose-500/25 text-rose-300',
    emerald: 'bg-emerald-500/15 ring-emerald-500/25 text-emerald-300',
    violet:  'bg-violet-500/15 ring-violet-500/25 text-violet-300',
  };
  return (
    <div className={cn(
      'rounded-2xl border backdrop-blur-xl p-4 transition',
      highlight
        ? 'bg-gradient-to-br from-rose-500/[0.08] to-rose-500/[0.02] border-rose-500/[0.18]'
        : 'bg-white/[0.02] border-white/[0.06]'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1', accentMap[accent])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] text-white/55 uppercase tracking-wider font-medium">{label}</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[22px] font-bold text-white tabular-nums">{value}</span>
            {unit && <span className="text-[10.5px] text-white/45">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicianTab({ active, onClick, icon: Icon, label, badge, disabled }: { active: boolean; onClick: () => void; icon: any; label: string; badge?: number; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all',
        disabled
          ? 'text-white/25 cursor-not-allowed'
          : active
            ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-white ring-1 ring-blue-400/30 shadow-[0_4px_20px_-8px_rgba(59,130,246,0.5)]'
            : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge !== undefined && (
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums', active ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-white/55')}>{badge}</span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------------------
// PATIENT FILE — Vraie fiche clinique
// ----------------------------------------------------------------------------

function PatientFile({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const meta = RISK_META[patient.currentRisk];
  const agp = useMemo(() => generateAGP(), []);
  const tir = useMemo(() => generateTIRStratified(), []);
  const carePlan = useMemo(() => getCarePlan(patient.id), [patient.id]);
  const patientLabReports = useMemo(() => getReportsForPatient(patient.id), [patient.id]);
  const notes = useMemo(() => generateClinicalNotes(patient.id), [patient.id]);
  // getMedications est utilisé indirectement via TreatmentEditor (qui gère les prescriptions actives)
  useMemo(() => getMedications(patient.id), [patient.id]);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [localNotes, setLocalNotes] = useState<ClinicalNote[]>(notes);

  // v3.1.0 — Plage temporelle (par défaut Live)
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('live');
  const range = useMemo(() => getTimeRange(timeRange), [timeRange]);
  const showAGP = ['d7', 'm1', 'm3'].includes(timeRange);
  const seriesSeed = useMemo(() => Array.from(patient.id).reduce((s, c) => s + c.charCodeAt(0), 1), [patient.id]);
  const historicalGlucose = useMemo(
    () => generateHistoricalGlucose(timeRange, seriesSeed),
    [timeRange, seriesSeed]
  );

  // v3.1.0 — Journal historique
  const historyDays = timeRange === 'm3' ? 30 : timeRange === 'm1' ? 14 : 7;
  const historicalEntries = useMemo(
    () => generateHistoricalEntries(patient.id, historyDays),
    [patient.id, historyDays]
  );
  const [historyFilter, setHistoryFilter] = useState<'all' | 'alert' | 'recommendation' | 'event' | 'decision'>('all');
  const filteredEntries = historicalEntries.filter(e => historyFilter === 'all' || e.type === historyFilter);

  // v3.1.0 — Décisions cliniques en cours
  const initialDecisions = useMemo(() => getPendingDecisions(patient.id), [patient.id]);
  const [decisions, setDecisions] = useState<PendingClinicalDecision[]>(initialDecisions);

  const handleDecisionAction = (id: string, status: 'accepted' | 'modified' | 'rejected') => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    setLocalNotes(prev => [{
      id: `note_new_${Date.now()}`, patientId: patient.id, authorName: 'Vous',
      authorRole: 'Clinicien', timestamp: Date.now(), category: 'observation', text: newNote,
    }, ...prev]);
    setNewNote('');
    setShowNoteEditor(false);
  };

  return (
    <div className="space-y-4">
      {/* Patient header */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/[0.08] via-violet-500/[0.04] to-transparent border border-blue-500/[0.15] backdrop-blur-xl p-5">
        <button onClick={onBack} className="text-[11.5px] text-white/55 hover:text-white flex items-center gap-1 mb-3 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la cohorte
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${meta.color}40, ${meta.color}15)`, boxShadow: `inset 0 0 0 1px ${meta.color}40` }}
            >
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold text-white">{patient.name}</span>
                <span className="text-[11px] text-white/45">· {patient.id}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12px] text-white/65">
                <span>{patient.age} ans · {patient.gender === 'M' ? 'H' : 'F'}</span>
                <span className="text-white/25">·</span>
                <span>{patient.diabetesType}</span>
                <span className="text-white/25">·</span>
                <span>Suivi depuis {patient.diagnosisDate || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold ring-1', meta.bg, meta.ring, meta.text)}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </span>
            <button className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/75 text-[11.5px] font-medium border border-white/10 flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5" /> Téléconsulter
            </button>
            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition">
              <FileText className="w-3.5 h-3.5" /> Rapport ATTD
            </button>
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniMetric label="HbA1c" value={`${patient.hba1c}%`} target="< 7%" status={patient.hba1c < 7 ? 'good' : 'warn'} />
        <MiniMetric label="Time in Range" value={`${patient.tir}%`} target="> 70%" status={patient.tir > 70 ? 'good' : 'warn'} />
        <MiniMetric label="GMI estimé" value="6.8%" target="< 7%" status="good" />
        <MiniMetric label="Variabilité (CV)" value="32%" target="≤ 36%" status="good" />
        <MiniMetric label="Adhésion" value={`${patient.adherence}%`} target="> 85%" status={patient.adherence > 85 ? 'good' : 'warn'} />
      </div>

      {/* v3.1.0 — Sélecteur de plage temporelle */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} accent="blue" />
        <div className="text-[11px] text-white/45 flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          <span>{range.description}</span>
          {!range.isLive && (
            <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/10 ring-1 ring-amber-500/20 text-amber-300 text-[10px] font-semibold">
              Vue rétrospective
            </span>
          )}
        </div>
      </div>

      {/* v3.1.0 — DÉCISIONS EN COURS / ACTIONS PROPOSÉES PAR L'IA */}
      <PendingDecisionsPanel
        decisions={decisions}
        patientName={patient.name}
        onAction={handleDecisionAction}
      />

      {/* AGP / Courbe historique + TIR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13.5px] font-semibold text-white">
                {showAGP ? 'Profil glycémique ambulatoire' : 'Glycémie continue'}
              </div>
              <div className="text-[11px] text-white/50">
                {showAGP
                  ? `AGP standard ATTD · ${range.description} · ${patient.tir}% TIR`
                  : `${range.description} · ${historicalGlucose.length} mesures · CGM 5 min`}
              </div>
            </div>
            <span className="text-[10.5px] text-white/45">Dexcom G7 · 96% capteur actif</span>
          </div>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              {showAGP ? (
                <ComposedChart data={agp} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agpDoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip contentStyle={{ background: 'rgba(11, 18, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} labelFormatter={(h) => `${h}h00`} />
                  <ReferenceArea y1={70} y2={180} fill="rgba(16, 185, 129, 0.06)" stroke="rgba(16, 185, 129, 0.15)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="p95" stroke="rgba(59,130,246,0.2)" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpDoc)" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="rgba(11, 18, 32, 1)" />
                  <Area type="monotone" dataKey="p5" stroke="rgba(59,130,246,0.2)" strokeWidth={1} fill="none" />
                  <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={historicalGlucose} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGlucose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(ts) => {
                      const d = new Date(ts);
                      if (range.durationMs <= 6 * 60 * 60 * 1000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      if (range.durationMs <= 24 * 60 * 60 * 1000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    }}
                    minTickGap={30}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(11, 18, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                    labelFormatter={(ts) => new Date(ts as number).toLocaleString('fr-FR')}
                    formatter={(v: any) => [`${v} mg/dL`, 'Glycémie']}
                  />
                  <ReferenceArea y1={70} y2={180} fill="rgba(16, 185, 129, 0.06)" stroke="rgba(16, 185, 129, 0.15)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="glucose" stroke="#3b82f6" strokeWidth={2} fill="url(#histGlucose)" dot={false} isAnimationActive={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
          <div className="text-[13.5px] font-semibold text-white mb-1">TIR stratifié</div>
          <div className="text-[11px] text-white/50 mb-4">5 zones — standard ATTD</div>
          <div className="space-y-2.5">
            {[
              { label: 'Très élevé', range: '>250', value: tir.veryHigh, color: '#dc2626', target: '<5%' },
              { label: 'Élevé', range: '181-250', value: tir.high, color: '#f97316', target: '<25%' },
              { label: 'Cible', range: '70-180', value: tir.inRange, color: '#10b981', target: '>70%' },
              { label: 'Bas', range: '54-69', value: tir.low, color: '#f59e0b', target: '<4%' },
              { label: 'Très bas', range: '<54', value: tir.veryLow, color: '#dc2626', target: '<1%' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold text-white">{s.label}</span>
                    <span className="text-[10px] text-white/45">{s.range}</span>
                  </div>
                  <div className="text-[10px] text-white/45">cible {s.target}</div>
                </div>
                <div className="text-[14px] font-bold text-white tabular-nums">{s.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes + Plan + Meds + Recent events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notes cliniques */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-300" />
              <div className="text-[13.5px] font-semibold text-white">Notes cliniques</div>
            </div>
            <button onClick={() => setShowNoteEditor(!showNoteEditor)} className="text-[11px] text-blue-300 hover:text-blue-200 flex items-center gap-1 transition">
              <Edit3 className="w-3 h-3" /> Annoter
            </button>
          </div>
          {showNoteEditor && (
            <div className="mb-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Observation clinique, ajustement thérapeutique…"
                rows={3}
                className="w-full bg-transparent text-[12px] text-white placeholder:text-white/30 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowNoteEditor(false)} className="px-2.5 py-1 rounded-md text-[11px] text-white/55 hover:text-white transition">Annuler</button>
                <button onClick={addNote} className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition">Enregistrer</button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {localNotes.map(n => (
              <div key={n.id} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[11.5px] font-semibold text-white">{n.authorName} <span className="text-white/45 font-normal">· {n.authorRole}</span></div>
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(n.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <div className="text-[11.5px] text-white/70 leading-relaxed">{n.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan de soins */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-300" />
            <div className="text-[13.5px] font-semibold text-white">Plan de soins</div>
          </div>
          <div className="space-y-2.5">
            <PlanRow label="Glycémie cible" value={`${carePlan.glucoseTargetMin}–${carePlan.glucoseTargetMax} mg/dL`} />
            <PlanRow label="HbA1c cible" value={`< ${carePlan.hba1cTarget}%`} />
            <PlanRow label="Insuline basale" value={`${carePlan.insulinBasal} UI/jour`} />
            <PlanRow label="Ratio glucides" value={`1 UI / ${carePlan.insulinRatioCarbs} g`} />
            <PlanRow label="Sensibilité" value={`1 UI ↓ ${carePlan.insulinSensitivity} mg/dL`} />
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <div className="text-[11px] text-white/55 italic leading-relaxed">"{carePlan.notes}"</div>
          </div>
        </div>

      </div>

      {/* v3.4.0 — Plan thérapeutique complet (édition prescriptions + audit) */}
      <TreatmentEditor patientId={patient.id} patientName={patient.name} readOnly={false} />

      {/* v3.2.0 — BILANS BIOLOGIQUES (timeline + comparaison HbA1c, lipides, rénal…) */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-300" />
            <div className="text-[13.5px] font-semibold text-white">Bilans biologiques du patient</div>
            {patientLabReports.length > 0 && (
              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                {patientLabReports.length}
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/45">
            Importés via QR code · Intégrés aux prédictions
          </div>
        </div>
        <LabReportTimeline
          reports={patientLabReports}
          showDelete={false}
          emptyMessage="Aucun bilan biologique scanné par ce patient pour le moment."
        />
      </div>

      {/* v3.1.0 — JOURNAL HISTORIQUE — Alertes + Recommandations + Événements + Décisions */}
      <HistoricalJournal
        entries={filteredEntries}
        totalCount={historicalEntries.length}
        rangeLabel={range.description}
        filter={historyFilter}
        onFilterChange={setHistoryFilter}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// v3.1.0 — PANNEAU "DÉCISION EN COURS / ACTION PROPOSÉE"
// ----------------------------------------------------------------------------

function PendingDecisionsPanel({
  decisions, patientName, onAction,
}: {
  decisions: PendingClinicalDecision[];
  patientName: string;
  onAction: (id: string, status: 'accepted' | 'modified' | 'rejected') => void;
}) {
  const pending = decisions.filter(d => d.status === 'pending');
  const treated = decisions.filter(d => d.status !== 'pending');

  if (decisions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent border border-amber-500/[0.18] backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-amber-300" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-white flex items-center gap-2">
              Décisions en attente
              {pending.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 ring-1 ring-amber-500/30 text-amber-200 text-[10px] font-bold tabular-nums">
                  {pending.length}
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/55">Recommandations IA en attente de votre arbitrage clinique pour {patientName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] text-amber-200/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Décision finale : clinicien · IEC 62304 § 5.1</span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <div className="text-[12.5px] text-white/75 font-medium">Toutes les décisions ont été traitées</div>
          <div className="text-[10.5px] text-white/45 mt-0.5">{treated.length} décision{treated.length > 1 ? 's' : ''} arbitré{treated.length > 1 ? 'es' : 'e'}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(d => (
            <DecisionCard key={d.id} decision={d} onAction={onAction} />
          ))}
        </div>
      )}

      {treated.length > 0 && (
        <details className="mt-3 group">
          <summary className="text-[11px] text-white/55 hover:text-white/85 cursor-pointer flex items-center gap-1.5 transition">
            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            {treated.length} décision{treated.length > 1 ? 's' : ''} déjà traitée{treated.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-1.5">
            {treated.map(d => (
              <div key={d.id} className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-white/65 truncate">{d.aiRecommendation}</span>
                <span className={cn(
                  'shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9.5px] font-semibold',
                  d.status === 'accepted' && 'bg-emerald-500/15 text-emerald-300',
                  d.status === 'modified' && 'bg-amber-500/15 text-amber-300',
                  d.status === 'rejected' && 'bg-rose-500/15 text-rose-300',
                )}>
                  {d.status === 'accepted' ? 'Acceptée' : d.status === 'modified' ? 'Modifiée' : 'Rejetée'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function DecisionCard({ decision, onAction }: {
  decision: PendingClinicalDecision;
  onAction: (id: string, status: 'accepted' | 'modified' | 'rejected') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const riskMeta = RISK_META[decision.riskLevel];
  const ageMin = Math.round((Date.now() - decision.createdAt) / 60000);
  const expiresInH = Math.round((decision.expiresAt - Date.now()) / 3600000);

  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn('px-2 py-1 rounded-md ring-1 text-[10px] font-bold uppercase tracking-wider shrink-0', riskMeta.bg, riskMeta.ring, riskMeta.text)}>
            {riskMeta.label}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-white leading-snug">{decision.triggerReason}</div>
            <div className="flex items-center gap-2 mt-1 text-[10.5px] text-white/45">
              <Clock className="w-2.5 h-2.5" />
              <span>il y a {ageMin} min</span>
              <span className="text-white/25">·</span>
              <span>expire dans {expiresInH}h</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-white/45 uppercase tracking-wider">Confiance IA</div>
          <div className="text-[16px] font-bold text-white tabular-nums">{Math.round(decision.aiConfidence * 100)}%</div>
        </div>
      </div>

      <div className="rounded-lg bg-blue-500/[0.08] border border-blue-500/20 p-3 mb-3">
        <div className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Action proposée
        </div>
        <div className="text-[12.5px] text-white leading-relaxed">{decision.aiRecommendation}</div>
      </div>

      {/* Snapshot contextuel compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <ContextChip label="Glycémie" value={`${decision.contextSnapshot.glucose}`} unit="mg/dL" />
        <ContextChip label="Tendance" value={decision.contextSnapshot.glucoseTrend === 'falling' ? '↘ Baisse' : decision.contextSnapshot.glucoseTrend === 'rising' ? '↗ Hausse' : '→ Stable'} />
        <ContextChip label="Insuline active" value={`${decision.contextSnapshot.activeInsulin}`} unit="UI" />
        <ContextChip label="TIR 24h" value={`${decision.contextSnapshot.timeInRange24h}`} unit="%" />
      </div>

      {expanded && (
        <div className="space-y-3 mb-3 pt-3 border-t border-white/[0.06]">
          <div>
            <div className="text-[10px] text-white/45 uppercase tracking-wider font-semibold mb-2">Raisonnement IA</div>
            <ul className="space-y-1.5">
              {decision.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11.5px] text-white/75">
                  <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] text-white/45 uppercase tracking-wider font-semibold mb-2">Alternatives évaluées</div>
            <div className="space-y-1.5">
              {decision.alternativeOptions.map((alt, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] py-1.5 px-2.5 rounded-lg bg-white/[0.02]">
                  <span className={cn(
                    'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                    alt.risk === 'lower' && 'bg-emerald-500/15 text-emerald-300',
                    alt.risk === 'similar' && 'bg-white/10 text-white/65',
                    alt.risk === 'higher' && 'bg-rose-500/15 text-rose-300',
                  )}>
                    {alt.risk === 'lower' ? 'Risque ↓' : alt.risk === 'similar' ? 'Équivalent' : 'Risque ↑'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-white/85 font-medium">{alt.label}</div>
                    <div className="text-white/50 text-[10.5px] mt-0.5">{alt.rationale}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-blue-300 hover:text-blue-200 flex items-center gap-1 transition">
          <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
          {expanded ? 'Masquer' : 'Voir le raisonnement & alternatives'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(decision.id, 'rejected')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 hover:text-rose-200 text-white/65 text-[11.5px] font-medium border border-white/10 hover:border-rose-500/30 flex items-center gap-1.5 transition"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeter
          </button>
          <button
            onClick={() => onAction(decision.id, 'modified')}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-200 text-white/65 text-[11.5px] font-medium border border-white/10 hover:border-amber-500/30 flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={() => onAction(decision.id, 'accepted')}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition shadow-[0_4px_20px_-8px_rgba(16,185,129,0.6)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepter & Tracer
          </button>
        </div>
      </div>
    </div>
  );
}

function ContextChip({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
      <div className="text-[9.5px] text-white/45 uppercase tracking-wider">{label}</div>
      <div className="text-[12px] font-bold text-white tabular-nums">
        {value}{unit && <span className="text-[10px] text-white/55 font-normal ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// v3.1.0 — JOURNAL HISTORIQUE (alertes + recommandations + événements + décisions)
// ----------------------------------------------------------------------------

function HistoricalJournal({
  entries, totalCount, rangeLabel, filter, onFilterChange,
}: {
  entries: HistoricalEntry[];
  totalCount: number;
  rangeLabel: string;
  filter: 'all' | 'alert' | 'recommendation' | 'event' | 'decision';
  onFilterChange: (f: 'all' | 'alert' | 'recommendation' | 'event' | 'decision') => void;
}) {
  const counts = {
    alert: entries.filter(e => e.type === 'alert').length,
    recommendation: entries.filter(e => e.type === 'recommendation').length,
    event: entries.filter(e => e.type === 'event').length,
    decision: entries.filter(e => e.type === 'decision').length,
  };

  const filterTabs: Array<{ key: typeof filter; label: string; icon: any; count: number; color: string }> = [
    { key: 'all',            label: 'Tout',            icon: History,        count: totalCount,           color: 'text-white/75' },
    { key: 'alert',          label: 'Alertes',         icon: Bell,           count: counts.alert,         color: 'text-rose-300' },
    { key: 'recommendation', label: 'Recommandations', icon: Sparkles,       count: counts.recommendation,color: 'text-blue-300' },
    { key: 'decision',       label: 'Décisions',       icon: Stethoscope,    count: counts.decision,      color: 'text-violet-300' },
    { key: 'event',          label: 'Événements',      icon: Activity,       count: counts.event,         color: 'text-cyan-300' },
  ];

  // Groupement par jour
  const groupedByDay = entries.reduce<Record<string, HistoricalEntry[]>>((acc, e) => {
    const dayKey = new Date(e.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(e);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-violet-300" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-white">Journal historique</div>
            <div className="text-[11px] text-white/55">Alertes système · recommandations IA · événements patient · {rangeLabel}</div>
          </div>
        </div>
        <button className="text-[11px] text-blue-300 hover:text-blue-200 flex items-center gap-1.5 transition">
          <Download className="w-3 h-3" /> Exporter (PDF / CSV)
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {filterTabs.map(t => {
          const Icon = t.icon;
          const isActive = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onFilterChange(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                isActive
                  ? 'bg-white/[0.08] ring-1 ring-white/15 text-white'
                  : 'bg-white/[0.02] text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('w-3 h-3', isActive ? t.color : '')} />
              {t.label}
              <span className={cn('px-1.5 py-0.5 rounded text-[9.5px] font-bold tabular-nums', isActive ? 'bg-white/15' : 'bg-white/[0.04] text-white/45')}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline groupée */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-white/45 text-[12px]">
          Aucune entrée pour ce filtre sur la période sélectionnée.
        </div>
      ) : (
        <div className="space-y-5 max-h-[520px] overflow-y-auto pr-2 -mr-2">
          {Object.entries(groupedByDay).map(([day, dayEntries]) => (
            <div key={day}>
              <div className="sticky top-0 bg-[#0B1220]/95 backdrop-blur-sm py-1.5 mb-2 -mx-1 px-1 z-10">
                <div className="text-[10.5px] font-semibold text-white/55 uppercase tracking-wider">{day}</div>
              </div>
              <div className="space-y-1.5">
                {dayEntries.map(e => (
                  <HistoricalEntryRow key={e.id} entry={e} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10.5px] text-white/45">
        <span>{entries.length} entrée{entries.length > 1 ? 's' : ''} affichée{entries.length > 1 ? 's' : ''} · {totalCount} au total</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          Journal signé · Conforme IEC 62304 · Trace ID auditable
        </span>
      </div>
    </div>
  );
}

function HistoricalEntryRow({ entry }: { entry: HistoricalEntry }) {
  const typeMeta: Record<HistoricalEntry['type'], { icon: any; bg: string; ring: string; text: string; label: string }> = {
    alert:          { icon: Bell,        bg: 'bg-rose-500/10',    ring: 'ring-rose-500/20',    text: 'text-rose-300',    label: 'Alerte' },
    recommendation: { icon: Sparkles,    bg: 'bg-blue-500/10',    ring: 'ring-blue-500/20',    text: 'text-blue-300',    label: 'Recommandation' },
    decision:       { icon: Stethoscope, bg: 'bg-violet-500/10',  ring: 'ring-violet-500/20',  text: 'text-violet-300',  label: 'Décision' },
    event:          { icon: Activity,    bg: 'bg-cyan-500/10',    ring: 'ring-cyan-500/20',    text: 'text-cyan-300',    label: 'Événement' },
  };
  const m = typeMeta[entry.type];
  const Icon = m.icon;
  const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition group">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center ring-1 shrink-0 mt-0.5', m.bg, m.ring)}>
        <Icon className={cn('w-3.5 h-3.5', m.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={cn('px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider', m.bg, m.text)}>
            {m.label}
          </span>
          {entry.module && (
            <span className="text-[10px] text-white/45">{entry.module}</span>
          )}
          {entry.severity === 'high' || entry.severity === 'critical' ? (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[9.5px] font-bold uppercase">
              {entry.severity === 'critical' ? 'Critique' : 'Sévère'}
            </span>
          ) : null}
          <span className="ml-auto text-[10.5px] text-white/45 tabular-nums shrink-0">{time}</span>
        </div>
        <div className="text-[12.5px] font-semibold text-white leading-snug">{entry.title}</div>
        <div className="text-[11.5px] text-white/65 mt-0.5 leading-relaxed">{entry.summary}</div>
        {entry.recommendationAction && (
          <div className="mt-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/[0.08] border-l-2 border-blue-400 text-[11.5px] text-blue-100">
            → {entry.recommendationAction}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/45">
          {entry.acknowledgedBy && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              {entry.acknowledgedBy}
            </span>
          )}
          {entry.outcomeStatus && entry.outcomeStatus !== 'pending' && (
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[9.5px] font-semibold',
              entry.outcomeStatus === 'accepted' && 'bg-emerald-500/15 text-emerald-300',
              entry.outcomeStatus === 'modified' && 'bg-amber-500/15 text-amber-300',
              entry.outcomeStatus === 'rejected' && 'bg-rose-500/15 text-rose-300',
            )}>
              {entry.outcomeStatus === 'accepted' ? 'Acceptée' : entry.outcomeStatus === 'modified' ? 'Modifiée' : 'Rejetée'}
            </span>
          )}
          {entry.traceId && (
            <span className="font-mono text-white/35">{entry.traceId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, target, status }: { label: string; value: string; target: string; status: 'good' | 'warn' | 'bad' }) {
  const statusColor = { good: 'text-emerald-300', warn: 'text-amber-300', bad: 'text-rose-300' }[status];
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-3">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={cn('text-[18px] font-bold tabular-nums', statusColor)}>{value}</span>
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">cible {target}</div>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11.5px] text-white/65">{label}</span>
      <span className="text-[11.5px] text-white font-semibold tabular-nums">{value}</span>
    </div>
  );
}
