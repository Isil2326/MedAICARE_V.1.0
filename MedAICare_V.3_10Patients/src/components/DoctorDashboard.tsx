// ============================================================================
// DOCTOR DASHBOARD v4.0.0 — MediAI Care · Thème Naturel — Console Clinique
// 3 onglets : Cohorte · Fiche patient · Performance modèles IA
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

// ── Risk meta — light theme ───────────────────────────────────────────────────
const RISK_META: Record<string, { label: string; color: string; bg: string; ring: string; text: string; dot: string }> = {
  LOW:      { label: 'Stable',   color: '#4a8a35', bg: 'bg-brand-50',  ring: 'ring-brand-200',  text: 'text-brand-700',  dot: 'bg-brand-500' },
  MODERATE: { label: 'Modéré',   color: '#d97706', bg: 'bg-amber-50',  ring: 'ring-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  HIGH:     { label: 'Élevé',    color: '#ea580c', bg: 'bg-orange-50', ring: 'ring-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critique', color: '#dc2626', bg: 'bg-red-50',    ring: 'ring-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
};

type Tab = 'cohort' | 'patient' | 'models';

// ============================================================================
// MAIN
// ============================================================================

export default function DoctorDashboard() {
  const patients     = useMemo(() => getSimulatedPatients(), []);
  const modelMetrics = useMemo(() => getModelMetrics(), []);
  const [tab, setTab]               = useState<Tab>('cohort');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch]         = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('all');

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchRisk   = riskFilter === 'all' || p.currentRisk === riskFilter;
    return matchSearch && matchRisk;
  });

  const avgTIR       = Math.round(patients.reduce((s, p) => s + p.tir, 0) / patients.length);
  const criticalCount = patients.filter(p => p.currentRisk === 'CRITICAL' || p.currentRisk === 'HIGH').length;
  const totalAlerts  = patients.reduce((s, p) => s + p.alerts, 0);

  const handleSelectPatient = (p: Patient) => { setSelectedPatient(p); setTab('patient'); };

  return (
    <div className="space-y-5 pb-20 lg:pb-0">

      {/* === KPI ROW === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKPI label="Patients suivis"  value={patients.length} unit="actifs"           icon={Users}         accent="blue"    />
        <ClinicalKPI label="Cas prioritaires" value={criticalCount}   unit={`/ ${patients.length}`} icon={AlertTriangle} accent="coral" highlight />
        <ClinicalKPI label="TIR cohorte"      value={`${avgTIR}%`}   unit="cible ≥70%"       icon={Target}        accent="green"   />
        <ClinicalKPI label="Alertes 24h"      value={totalAlerts}     unit="à traiter"         icon={MessageSquare} accent="violet"  />
      </div>

      {/* === TABS + ACTIONS === */}
      <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-between overflow-hidden">
        <div className="flex items-center border-b border-slate-200 w-full">
          <div className="flex items-center px-1">
            <ClinicianTab active={tab === 'cohort'}  onClick={() => setTab('cohort')}  icon={Users}        label="Cohorte"        badge={patients.length} />
            <ClinicianTab active={tab === 'patient'} onClick={() => selectedPatient && setTab('patient')} icon={Stethoscope}  label="Fiche patient"  disabled={!selectedPatient} />
            <ClinicianTab active={tab === 'models'}  onClick={() => setTab('models')}  icon={Brain}        label="Performance IA" />
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-2 shrink-0">
            <button className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11.5px] font-semibold flex items-center gap-1.5 transition">
              <Download className="w-3 h-3" /> CSV
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition shadow-[0_2px_6px_rgba(37,99,235,0.2)]">
              <FileText className="w-3 h-3" /> Rapport ATTD
            </button>
          </div>
        </div>
      </div>

      {/* ============== TAB: COHORTE ============== */}
      {tab === 'cohort' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Liste patients */}
          <div className="xl:col-span-2 bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-[14px] font-bold text-slate-900">Liste des patients</div>
                  <div className="text-[11px] text-slate-400 font-medium">{filtered.length} sur {patients.length} · triés par risque IA</div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher patient ou ID…"
                    className="pl-8 pr-3 py-1.5 w-56 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {(['all', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map(r => {
                  const count = r === 'all' ? patients.length : patients.filter(p => p.currentRisk === r).length;
                  const meta  = r !== 'all' ? RISK_META[r] : null;
                  return (
                    <button
                      key={r}
                      onClick={() => setRiskFilter(r)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                        riskFilter === r
                          ? r === 'all' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : cn(meta?.bg, meta?.text, 'ring-1', meta?.ring)
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      )}
                    >
                      {r === 'all' ? 'Tous' : meta?.label} <span className="opacity-60 ml-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-[13px] font-medium">Aucun patient ne correspond aux critères.</div>
              ) : (
                filtered.map(p => {
                  const meta  = RISK_META[p.currentRisk];
                  const isSel = selectedPatient?.id === p.id;
                  const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all',
                        isSel ? 'bg-blue-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 relative ring-1',
                        meta.bg, meta.ring, meta.text
                      )}>
                        {initials}
                        {p.alerts > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                            {p.alerts}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 min-w-0">
                          <div className="text-[13px] font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-[10.5px] text-slate-400">{p.id} · {p.age}a · {p.diabetesType}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-[12px] font-bold text-slate-800 tabular-nums">{p.hba1c}%</div>
                          <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">HbA1c</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-[12px] font-bold text-slate-800 tabular-nums">{p.tir}%</div>
                          <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">TIR</div>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ring-1', meta.bg, meta.ring, meta.text)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                            {meta.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Stratification du risque */}
            <div className="bg-white rounded-2xl card-shadow p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <div className="text-[13px] font-bold text-slate-900">Stratification du risque</div>
              </div>
              <div className="space-y-3">
                {(['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map(r => {
                  const count = patients.filter(p => p.currentRisk === r).length;
                  const pct   = Math.round((count / patients.length) * 100);
                  const meta  = RISK_META[r];
                  return (
                    <div key={r}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className={cn('font-semibold', meta.text)}>{meta.label}</span>
                        <span className="text-slate-500 font-medium tabular-nums">{count} <span className="text-slate-300">({pct}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TIR cohorte 14j */}
            <div className="bg-white rounded-2xl card-shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-brand-600" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">TIR cohorte 14j</div>
                  <div className="text-[11px] text-slate-400">Cible ADA ≥ 70%</div>
                </div>
              </div>
              <div className="h-[150px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={Array.from({ length: 14 }, (_, i) => ({ d: `J-${13 - i}`, t: 60 + Math.round(Math.sin(i / 2) * 8 + Math.random() * 4) }))}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="cohortTir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4a8a35" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#4a8a35" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="d" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} domain={[40, 90]} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, color: '#1e293b' }} />
                    <Area type="monotone" dataKey="t" stroke="#4a8a35" strokeWidth={2} fill="url(#cohortTir)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== TAB: FICHE PATIENT ============== */}
      {tab === 'patient' && selectedPatient && (
        <PatientFile patient={selectedPatient} onBack={() => setTab('cohort')} />
      )}

      {/* ============== TAB: MODÈLES IA ============== */}
      {tab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {modelMetrics.map((m, i) => {
            const accentColors = [
              { gauge: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200' },
              { gauge: '#8b5cf6', bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
              { gauge: '#06b6d4', bg: 'bg-cyan-100',   text: 'text-cyan-700',   ring: 'ring-cyan-200' },
            ][i % 3];
            return (
              <div key={m.name} className="bg-white rounded-2xl card-shadow p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1', accentColors.bg, accentColors.ring)}>
                      <Brain className={cn('w-5 h-5', accentColors.text)} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold text-slate-900">{m.name}</div>
                      <div className="text-[10.5px] text-slate-400">v{m.version} · {m.lastTrained}</div>
                    </div>
                  </div>
                  {i === 0
                    ? <span className="px-2 py-0.5 rounded-full bg-brand-50 ring-1 ring-brand-200 text-[10px] text-brand-700 font-bold">Production</span>
                    : <span className="px-2 py-0.5 rounded-full bg-slate-50 ring-1 ring-slate-200 text-[10px] text-slate-500 font-semibold">Candidat</span>
                  }
                </div>

                <div className="h-[140px] -mx-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: 'F1', value: m.f1Score * 100, fill: accentColors.gauge }]} startAngle={210} endAngle={-30}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f1f5f9' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-2">
                    <div className="text-[26px] font-black text-slate-900 tabular-nums">{(m.f1Score * 100).toFixed(1)}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">F1-Score</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Précision',     value: m.precision },
                    { label: 'Rappel',        value: m.recall },
                    { label: 'Spécificité',   value: m.specificity },
                    { label: 'AUC-ROC',       value: m.auc },
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">{metric.label}</span>
                        <span className="text-slate-900 font-bold tabular-nums">{(metric.value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${metric.value * 100}%`, background: accentColors.gauge }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 font-medium">
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

function ClinicalKPI({ label, value, unit, icon: Icon, accent, highlight }: {
  label: string; value: string | number; unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'blue' | 'coral' | 'green' | 'violet';
  highlight?: boolean;
}) {
  const accentMap = {
    blue:   { icon: 'bg-blue-100 text-blue-600', val: 'text-blue-700' },
    coral:  { icon: 'bg-coral-50 text-coral-500', val: 'text-coral-600' },
    green:  { icon: 'bg-brand-100 text-brand-600', val: 'text-brand-700' },
    violet: { icon: 'bg-violet-100 text-violet-600', val: 'text-violet-700' },
  };
  const a = accentMap[accent];
  return (
    <div className={cn('bg-white rounded-2xl card-shadow border border-slate-100/80 p-4 transition', highlight && 'border-coral-200 bg-coral-50/40')}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', a.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] text-slate-400 uppercase tracking-widest font-semibold">{label}</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={cn('text-[24px] font-bold tabular-nums leading-none', a.val)}>{value}</span>
            {unit && <span className="text-[10.5px] text-slate-400 font-medium">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicianTab({ active, onClick, icon: Icon, label, badge, disabled }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string; badge?: number; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-[12.5px] font-semibold transition-all border-b-2 -mb-px',
        disabled
          ? 'text-slate-200 cursor-not-allowed border-transparent'
          : active
            ? 'text-blue-700 border-blue-600'
            : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge !== undefined && (
        <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums', active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── PATIENT FILE ──────────────────────────────────────────────────────────────

function PatientFile({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const meta              = RISK_META[patient.currentRisk];
  const agp               = useMemo(() => generateAGP(), []);
  const tir               = useMemo(() => generateTIRStratified(), []);
  const carePlan          = useMemo(() => getCarePlan(patient.id), [patient.id]);
  const patientLabReports = useMemo(() => getReportsForPatient(patient.id), [patient.id]);
  const notes             = useMemo(() => generateClinicalNotes(patient.id), [patient.id]);
  useMemo(() => getMedications(patient.id), [patient.id]);

  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [newNote, setNewNote]               = useState('');
  const [localNotes, setLocalNotes]         = useState<ClinicalNote[]>(notes);

  const [timeRange, setTimeRange] = useState<TimeRangeKey>('live');
  const range    = useMemo(() => getTimeRange(timeRange), [timeRange]);
  const showAGP  = ['d7', 'm1', 'm3'].includes(timeRange);
  const seriesSeed = useMemo(() => Array.from(patient.id).reduce((s, c) => s + c.charCodeAt(0), 1), [patient.id]);
  const historicalGlucose = useMemo(() => generateHistoricalGlucose(timeRange, seriesSeed), [timeRange, seriesSeed]);

  const historyDays = timeRange === 'm3' ? 30 : timeRange === 'm1' ? 14 : 7;
  const historicalEntries = useMemo(() => generateHistoricalEntries(patient.id, historyDays), [patient.id, historyDays]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'alert' | 'recommendation' | 'event' | 'decision'>('all');
  const filteredEntries = historicalEntries.filter(e => historyFilter === 'all' || e.type === historyFilter);

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

  const initials = patient.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="space-y-4">

      {/* Patient header */}
      <div className="bg-white rounded-2xl card-shadow p-5 border-l-4 border-l-blue-400">
        <button onClick={onBack} className="text-[11.5px] text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-3 font-semibold transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la cohorte
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold ring-1 shrink-0', meta.bg, meta.ring, meta.text)}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[21px] font-black text-slate-900">{patient.name}</span>
                <span className="text-[11px] text-slate-400 font-medium">· {patient.id}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12.5px] text-slate-400 font-medium flex-wrap">
                <span>{patient.age} ans · {patient.gender === 'M' ? 'Homme' : 'Femme'}</span>
                <span className="text-slate-200">·</span>
                <span>{patient.diabetesType}</span>
                <span className="text-slate-200">·</span>
                <span>Suivi depuis {patient.diagnosisDate || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold ring-1', meta.bg, meta.ring, meta.text)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
              {meta.label}
            </span>
            <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11.5px] font-semibold flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5" /> Téléconsulter
            </button>
            <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-semibold flex items-center gap-1.5 transition shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
              <FileText className="w-3.5 h-3.5" /> Rapport ATTD
            </button>
          </div>
        </div>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniMetric label="HbA1c"       value={`${patient.hba1c}%`}      target="< 7%"   status={patient.hba1c < 7 ? 'good' : 'warn'} />
        <MiniMetric label="Time in Range" value={`${patient.tir}%`}       target="> 70%"  status={patient.tir > 70 ? 'good' : 'warn'} />
        <MiniMetric label="GMI estimé"  value="6.8%"                     target="< 7%"   status="good" />
        <MiniMetric label="Variabilité" value="32%"                       target="≤ 36%"  status="good" />
        <MiniMetric label="Adhésion"    value={`${patient.adherence}%`}   target="> 85%"  status={patient.adherence > 85 ? 'good' : 'warn'} />
      </div>

      {/* Sélecteur de plage temporelle */}
      <div className="bg-white rounded-2xl card-shadow px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} accent="blue" />
        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-medium">
          <History className="w-3.5 h-3.5" />
          <span>{range.description}</span>
          {!range.isLive && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 text-amber-700 text-[10px] font-bold">
              Vue rétrospective
            </span>
          )}
        </div>
      </div>

      {/* Décisions en cours */}
      <PendingDecisionsPanel decisions={decisions} patientName={patient.name} onAction={handleDecisionAction} />

      {/* AGP / Courbe + TIR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl card-shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] font-bold text-slate-900">
                {showAGP ? 'Profil glycémique ambulatoire' : 'Glycémie continue'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {showAGP
                  ? `AGP standard ATTD · ${range.description} · ${patient.tir}% TIR`
                  : `${range.description} · ${historicalGlucose.length} mesures · CGM 5 min`}
              </div>
            </div>
            <span className="text-[10.5px] text-slate-400 font-medium">Dexcom G7 · 96% actif</span>
          </div>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              {showAGP ? (
                <ComposedChart data={agp} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agpDoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, color: '#1e293b' }} labelFormatter={h => `${h}h00`} />
                  <ReferenceArea y1={70} y2={180} fill="rgba(74,138,53,0.06)" stroke="rgba(74,138,53,0.2)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="p95" stroke="rgba(59,130,246,0.2)" strokeWidth={1} fill="none" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="url(#agpDoc)" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="rgba(244,246,239,1)" />
                  <Area type="monotone" dataKey="p5"  stroke="rgba(59,130,246,0.2)" strokeWidth={1} fill="none" />
                  <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={historicalGlucose} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGlucose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={ts => {
                      const d = new Date(ts);
                      if (range.durationMs <= 24 * 60 * 60 * 1000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    }}
                    minTickGap={30}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 300]} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, color: '#1e293b' }}
                    labelFormatter={ts => new Date(ts as number).toLocaleString('fr-FR')}
                    formatter={(v: any) => [`${v} mg/dL`, 'Glycémie']}
                  />
                  <ReferenceArea y1={70} y2={180} fill="rgba(74,138,53,0.06)" stroke="rgba(74,138,53,0.2)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="glucose" stroke="#3b82f6" strokeWidth={2} fill="url(#histGlucose)" dot={false} isAnimationActive={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* TIR stratifié */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <div className="text-[14px] font-bold text-slate-900 mb-1">TIR stratifié</div>
          <div className="text-[11px] text-slate-400 mb-4 font-medium">5 zones — standard ATTD</div>
          <div className="space-y-3">
            {[
              { label: 'Très élevé', range: '>250',    value: tir.veryHigh, color: '#dc2626', target: '<5%',  textColor: 'text-red-600' },
              { label: 'Élevé',      range: '181-250', value: tir.high,     color: '#f97316', target: '<25%', textColor: 'text-orange-600' },
              { label: 'Cible',      range: '70-180',  value: tir.inRange,  color: '#4a8a35', target: '>70%', textColor: 'text-brand-700' },
              { label: 'Bas',        range: '54-69',   value: tir.low,      color: '#d97706', target: '<4%',  textColor: 'text-amber-700' },
              { label: 'Très bas',   range: '<54',     value: tir.veryLow,  color: '#dc2626', target: '<1%',  textColor: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-[12.5px] font-bold', s.textColor)}>{s.label}</span>
                    <span className="text-[10px] text-slate-400">{s.range}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">cible {s.target}</div>
                </div>
                <div className={cn('text-[16px] font-black tabular-nums', s.textColor)}>{s.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes + Plan de soins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Notes cliniques */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-[14px] font-bold text-slate-900">Notes cliniques</div>
            </div>
            <button onClick={() => setShowNoteEditor(!showNoteEditor)}
              className="text-[11.5px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition">
              <Edit3 className="w-3 h-3" /> Annoter
            </button>
          </div>
          {showNoteEditor && (
            <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Observation clinique, ajustement thérapeutique…"
                rows={3}
                className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowNoteEditor(false)} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-800 transition font-medium">Annuler</button>
                <button onClick={addNote} className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition">Enregistrer</button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {localNotes.map(n => (
              <div key={n.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[11.5px] font-bold text-slate-900">{n.authorName} <span className="text-slate-400 font-normal">· {n.authorRole}</span></div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(n.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <div className="text-[12px] text-slate-600 leading-relaxed">{n.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan de soins */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 ring-1 ring-blue-200 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-[14px] font-bold text-slate-900">Plan de soins</div>
          </div>
          <div className="space-y-1.5 divide-y divide-slate-100">
            <PlanRow label="Glycémie cible"    value={`${carePlan.glucoseTargetMin}–${carePlan.glucoseTargetMax} mg/dL`} />
            <PlanRow label="HbA1c cible"       value={`< ${carePlan.hba1cTarget}%`} />
            <PlanRow label="Insuline basale"   value={`${carePlan.insulinBasal} UI/jour`} />
            <PlanRow label="Ratio glucides"    value={`1 UI / ${carePlan.insulinRatioCarbs} g`} />
            <PlanRow label="Sensibilité"       value={`1 UI ↓ ${carePlan.insulinSensitivity} mg/dL`} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[12px] text-slate-500 italic leading-relaxed">"{carePlan.notes}"</div>
          </div>
        </div>
      </div>

      {/* Plan thérapeutique */}
      <TreatmentEditor patientId={patient.id} patientName={patient.name} readOnly={false} />

      {/* Bilans biologiques */}
      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 ring-1 ring-blue-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-[14px] font-bold text-slate-900">Bilans biologiques du patient</div>
            {patientLabReports.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10.5px] font-bold ring-1 ring-slate-200">
                {patientLabReports.length}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Importés via QR code · Intégrés aux prédictions</div>
        </div>
        <LabReportTimeline reports={patientLabReports} showDelete={false} emptyMessage="Aucun bilan biologique scanné par ce patient pour le moment." />
      </div>

      {/* Journal historique */}
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

// ── Pending Decisions Panel ───────────────────────────────────────────────────

function PendingDecisionsPanel({ decisions, patientName, onAction }: {
  decisions: PendingClinicalDecision[];
  patientName: string;
  onAction: (id: string, status: 'accepted' | 'modified' | 'rejected') => void;
}) {
  const pending = decisions.filter(d => d.status === 'pending');
  const treated = decisions.filter(d => d.status !== 'pending');
  if (decisions.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
              Décisions en attente
              {pending.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black tabular-nums">{pending.length}</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Recommandations IA en attente de votre arbitrage pour {patientName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] text-amber-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Décision finale : clinicien · IEC 62304 § 5.1
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-brand-500 mx-auto mb-2" />
          <div className="text-[12.5px] text-slate-700 font-semibold">Toutes les décisions ont été traitées</div>
          <div className="text-[10.5px] text-slate-400 mt-0.5">{treated.length} décision{treated.length > 1 ? 's' : ''} arbitrée{treated.length > 1 ? 's' : ''}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(d => <DecisionCard key={d.id} decision={d} onAction={onAction} />)}
        </div>
      )}

      {treated.length > 0 && (
        <details className="mt-3 group">
          <summary className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1.5 font-semibold transition">
            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            {treated.length} décision{treated.length > 1 ? 's' : ''} déjà traitée{treated.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-1.5">
            {treated.map(d => (
              <div key={d.id} className="flex items-center justify-between text-[11px] py-1.5 px-3 rounded-xl bg-white border border-slate-100">
                <span className="text-slate-600 truncate">{d.aiRecommendation}</span>
                <span className={cn(
                  'shrink-0 ml-2 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold',
                  d.status === 'accepted' && 'bg-brand-100 text-brand-700',
                  d.status === 'modified' && 'bg-amber-100 text-amber-700',
                  d.status === 'rejected' && 'bg-coral-50 text-coral-600',
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
  const riskMeta   = RISK_META[decision.riskLevel];
  const ageMin     = Math.round((Date.now() - decision.createdAt) / 60000);
  const expiresInH = Math.round((decision.expiresAt - Date.now()) / 3600000);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={cn('px-2 py-1 rounded-lg ring-1 text-[10px] font-bold uppercase tracking-wider shrink-0', riskMeta.bg, riskMeta.ring, riskMeta.text)}>
            {riskMeta.label}
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold text-slate-900 leading-snug">{decision.triggerReason}</div>
            <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-400 font-medium">
              <Clock className="w-2.5 h-2.5" />
              <span>il y a {ageMin} min</span>
              <span className="text-slate-200">·</span>
              <span>expire dans {expiresInH}h</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confiance IA</div>
          <div className="text-[17px] font-black text-slate-900 tabular-nums">{Math.round(decision.aiConfidence * 100)}%</div>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-3">
        <div className="text-[10px] text-blue-600 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Action proposée
        </div>
        <div className="text-[12.5px] text-slate-800 leading-relaxed">{decision.aiRecommendation}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <ContextChip label="Glycémie"     value={`${decision.contextSnapshot.glucose}`} unit="mg/dL" />
        <ContextChip label="Tendance"     value={decision.contextSnapshot.glucoseTrend === 'falling' ? '↘ Baisse' : decision.contextSnapshot.glucoseTrend === 'rising' ? '↗ Hausse' : '→ Stable'} />
        <ContextChip label="Insuline act." value={`${decision.contextSnapshot.activeInsulin}`} unit="UI" />
        <ContextChip label="TIR 24h"      value={`${decision.contextSnapshot.timeInRange24h}`} unit="%" />
      </div>

      {expanded && (
        <div className="space-y-3 mb-3 pt-3 border-t border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Raisonnement IA</div>
            <ul className="space-y-1.5">
              {decision.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11.5px] text-slate-700">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Alternatives évaluées</div>
            <div className="space-y-1.5">
              {decision.alternativeOptions.map((alt, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className={cn(
                    'shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase',
                    alt.risk === 'lower'  && 'bg-brand-100 text-brand-700',
                    alt.risk === 'similar' && 'bg-slate-100 text-slate-600',
                    alt.risk === 'higher'  && 'bg-coral-50 text-coral-600',
                  )}>
                    {alt.risk === 'lower' ? 'Risque ↓' : alt.risk === 'similar' ? 'Équivalent' : 'Risque ↑'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-slate-800 font-semibold">{alt.label}</div>
                    <div className="text-slate-500 text-[10.5px] mt-0.5">{alt.rationale}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition">
          <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
          {expanded ? 'Masquer' : 'Voir le raisonnement & alternatives'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(decision.id, 'rejected')}
            className="px-3 py-1.5 rounded-xl bg-coral-50 hover:bg-coral-100 text-coral-600 text-[11.5px] font-semibold border border-coral-200 flex items-center gap-1.5 transition"
          >
            <XCircle className="w-3.5 h-3.5" /> Rejeter
          </button>
          <button
            onClick={() => onAction(decision.id, 'modified')}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11.5px] font-semibold border border-amber-200 flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={() => onAction(decision.id, 'accepted')}
            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[11.5px] font-bold flex items-center gap-1.5 transition shadow-[0_2px_8px_rgba(58,110,40,0.25)]"
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
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
      <div className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-[12.5px] font-black text-slate-900 tabular-nums mt-0.5">
        {value}{unit && <span className="text-[10px] text-slate-400 font-normal ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

// ── Historical Journal ────────────────────────────────────────────────────────

function HistoricalJournal({ entries, totalCount, rangeLabel, filter, onFilterChange }: {
  entries: HistoricalEntry[];
  totalCount: number;
  rangeLabel: string;
  filter: 'all' | 'alert' | 'recommendation' | 'event' | 'decision';
  onFilterChange: (f: 'all' | 'alert' | 'recommendation' | 'event' | 'decision') => void;
}) {
  const counts = {
    alert:          entries.filter(e => e.type === 'alert').length,
    recommendation: entries.filter(e => e.type === 'recommendation').length,
    event:          entries.filter(e => e.type === 'event').length,
    decision:       entries.filter(e => e.type === 'decision').length,
  };

  const filterTabs: Array<{ key: typeof filter; label: string; icon: React.ComponentType<{ className?: string }>; count: number; color: string }> = [
    { key: 'all',            label: 'Tout',            icon: History,      count: totalCount,             color: 'text-slate-600' },
    { key: 'alert',          label: 'Alertes',         icon: Bell,         count: counts.alert,           color: 'text-coral-500' },
    { key: 'recommendation', label: 'Recommandations', icon: Sparkles,     count: counts.recommendation,  color: 'text-blue-600' },
    { key: 'decision',       label: 'Décisions',       icon: Stethoscope,  count: counts.decision,        color: 'text-violet-600' },
    { key: 'event',          label: 'Événements',      icon: Activity,     count: counts.event,           color: 'text-brand-600' },
  ];

  const groupedByDay = entries.reduce<Record<string, HistoricalEntry[]>>((acc, e) => {
    const dayKey = new Date(e.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(e);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900">Journal historique</div>
            <div className="text-[11px] text-slate-400 font-medium">Alertes · recommandations · événements · {rangeLabel}</div>
          </div>
        </div>
        <button className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-semibold transition">
          <Download className="w-3 h-3" /> Exporter (PDF / CSV)
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {filterTabs.map(t => {
          const Icon    = t.icon;
          const isActive = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onFilterChange(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all',
                isActive ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              )}
            >
              <Icon className={cn('w-3 h-3', isActive ? t.color : '')} />
              {t.label}
              <span className={cn('px-1.5 py-0.5 rounded-full text-[9.5px] font-bold tabular-nums', isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-[13px] font-medium">
          Aucune entrée pour ce filtre sur la période sélectionnée.
        </div>
      ) : (
        <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
          {Object.entries(groupedByDay).map(([day, dayEntries]) => (
            <div key={day}>
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-1.5 mb-2 -mx-1 px-1 z-10">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider capitalize">{day}</div>
              </div>
              <div className="space-y-1.5">
                {dayEntries.map(e => <HistoricalEntryRow key={e.id} entry={e} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
        <span>{entries.length} entrée{entries.length > 1 ? 's' : ''} affichée{entries.length > 1 ? 's' : ''} · {totalCount} au total</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-brand-500" />
          Journal signé · IEC 62304 · Trace ID auditable
        </span>
      </div>
    </div>
  );
}

function HistoricalEntryRow({ entry }: { entry: HistoricalEntry }) {
  const typeMeta: Record<HistoricalEntry['type'], { icon: React.ComponentType<{ className?: string }>; bg: string; ring: string; text: string; label: string }> = {
    alert:          { icon: Bell,        bg: 'bg-coral-50',  ring: 'ring-coral-200',  text: 'text-coral-600',  label: 'Alerte' },
    recommendation: { icon: Sparkles,   bg: 'bg-blue-50',   ring: 'ring-blue-200',   text: 'text-blue-700',   label: 'Recommandation' },
    decision:       { icon: Stethoscope,bg: 'bg-violet-50', ring: 'ring-violet-200', text: 'text-violet-700', label: 'Décision' },
    event:          { icon: Activity,   bg: 'bg-brand-50',  ring: 'ring-brand-200',  text: 'text-brand-700',  label: 'Événement' },
  };
  const m    = typeMeta[entry.type];
  const Icon = m.icon;
  const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center ring-1 shrink-0 mt-0.5', m.bg, m.ring)}>
        <Icon className={cn('w-3.5 h-3.5', m.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={cn('px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ring-1', m.bg, m.ring, m.text)}>
            {m.label}
          </span>
          {entry.module && <span className="text-[10px] text-slate-400">{entry.module}</span>}
          {(entry.severity === 'high' || entry.severity === 'critical') && (
            <span className="px-1.5 py-0.5 rounded-full bg-coral-50 ring-1 ring-coral-200 text-coral-600 text-[9.5px] font-bold uppercase">
              {entry.severity === 'critical' ? 'Critique' : 'Sévère'}
            </span>
          )}
          <span className="ml-auto text-[10.5px] text-slate-400 tabular-nums font-medium shrink-0">{time}</span>
        </div>
        <div className="text-[12.5px] font-bold text-slate-900 leading-snug">{entry.title}</div>
        <div className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{entry.summary}</div>
        {entry.recommendationAction && (
          <div className="mt-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border-l-2 border-blue-400 text-[11.5px] text-blue-800 font-medium">
            → {entry.recommendationAction}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
          {entry.acknowledgedBy && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-brand-500" />
              {entry.acknowledgedBy}
            </span>
          )}
          {entry.outcomeStatus && entry.outcomeStatus !== 'pending' && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[9.5px] font-bold',
              entry.outcomeStatus === 'accepted' && 'bg-brand-100 text-brand-700',
              entry.outcomeStatus === 'modified' && 'bg-amber-100 text-amber-700',
              entry.outcomeStatus === 'rejected' && 'bg-coral-50 text-coral-600',
            )}>
              {entry.outcomeStatus === 'accepted' ? 'Acceptée' : entry.outcomeStatus === 'modified' ? 'Modifiée' : 'Rejetée'}
            </span>
          )}
          {entry.traceId && <span className="font-mono text-slate-300">{entry.traceId}</span>}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, target, status }: { label: string; value: string; target: string; status: 'good' | 'warn' | 'bad' }) {
  const statusMap = {
    good: { text: 'text-brand-700', dot: 'bg-brand-500' },
    warn: { text: 'text-amber-700', dot: 'bg-amber-500' },
    bad:  { text: 'text-coral-600', dot: 'bg-coral-500' },
  };
  const s = statusMap[status];
  return (
    <div className="bg-white rounded-xl card-shadow p-3">
      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={cn('text-[19px] font-black tabular-nums', s.text)}>{value}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
        <span className="text-[10px] text-slate-400 font-medium">cible {target}</span>
      </div>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12.5px] text-slate-500 font-medium">{label}</span>
      <span className="text-[12.5px] text-slate-900 font-bold tabular-nums">{value}</span>
    </div>
  );
}
