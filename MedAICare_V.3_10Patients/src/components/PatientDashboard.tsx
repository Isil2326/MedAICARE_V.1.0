// ============================================================================
// PATIENT DASHBOARD — MediAI Care
// Orchestrator: state, effects, data fetching. UI éclatée dans ./patient/
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import LabReportScanner from './LabReportScanner';
import { getReportsForPatient } from '../engine/labReportService';
import type { LabReport } from '../types/medical';
import type {
  PatientVitals,
  MedicalRecommendation,
  Alert,
  PatientEvent,
} from '../types/medical';
import { generateSimulatedIoMTData, generateAlerts } from '../engine/simulator';
import { analyzeMedicalRisk } from '../engine/ai-engine';
import {
  generatePatientEvents,
  generateAGP,
  generateTIRStratified,
  getCarePlan,
  getMedications,
  getPatientStats,
} from '../engine/patient-data';
import { useAuth } from '../auth/AuthContext';

import { PatientTabs } from './patient/PatientTabs';
import { TodayTab } from './patient/TodayTab';
import { JournalTab } from './patient/JournalTab';
import { TrendsTab } from './patient/TrendsTab';
import { TreatmentTab } from './patient/TreatmentTab';
import { BilansTab } from './patient/BilansTab';
import { LogEventModal } from './patient/LogEventModal';
import { formatTime, type Tab } from './patient/formatters';

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
  useEffect(() => {
    refreshLabReports();
  }, [refreshLabReports]);

  const stats = useMemo(() => getPatientStats(), []);
  const agp = useMemo(() => generateAGP(), []);
  const tir = useMemo(() => generateTIRStratified(), []);
  const carePlan = useMemo(() => getCarePlan(user?.id || 'p1'), [user?.id]);
  const medications = useMemo(() => getMedications(user?.id || 'p1'), [user?.id]);

  const updateVitals = useCallback(() => {
    const v = generateSimulatedIoMTData('normal');
    setVitalsHistory((prev) => [...prev.slice(-29), v]);
    setCurrentVitals(v);
    setRecommendation(analyzeMedicalRisk(v));
    const newAlerts = generateAlerts(v);
    if (newAlerts.length) setAlerts((prev) => [...newAlerts, ...prev].slice(0, 8));
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

  const handleLogEvent = (
    type: 'meal' | 'insulin' | 'activity' | 'note',
    data: Partial<PatientEvent>,
  ) => {
    const evt: PatientEvent = { id: `evt_${Date.now()}`, type, timestamp: Date.now(), ...data };
    setEvents((prev) => [evt, ...prev]);
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

  const activeAlert = alerts.find((a) => !a.acknowledged);
  const firstName = user?.name?.split(' ')[0] || 'Patient';

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* ── GREETING BANNER ── */}
      <div className="bg-white rounded-2xl card-shadow border border-slate-100/80 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Tableau de bord
            </div>
            <div className="text-[26px] font-bold text-slate-900 mt-0.5 tracking-tight">{firstName}</div>
            <div className="text-[12.5px] text-slate-400 mt-0.5 font-medium capitalize">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
                TIR 7j
              </div>
              <div className="text-[24px] font-bold text-brand-600 tabular-nums leading-none">
                {tir.inRange}%
              </div>
              <div
                className={`text-[10px] font-bold mt-1 ${tir.inRange >= 70 ? 'text-brand-500' : tir.inRange >= 55 ? 'text-amber-500' : 'text-coral-500'}`}
              >
                {tir.inRange >= 70 ? 'Excellent' : tir.inRange >= 55 ? 'Correct' : 'À améliorer'}
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
                Moy. 7j
              </div>
              <div className="text-[24px] font-bold text-slate-800 tabular-nums leading-none">
                {stats.avgGlucose}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">mg/dL</div>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-center">
              <div className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
                GMI
              </div>
              <div className="text-[24px] font-bold text-slate-800 tabular-nums leading-none">
                {stats.gmi}%
              </div>
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
              <div className="text-[11px] text-coral-500 font-medium">
                Votre clinicien a été notifié · {formatTime(activeAlert.timestamp)}
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              setAlerts((prev) =>
                prev.map((a) => (a.id === activeAlert.id ? { ...a, acknowledged: true } : a)),
              )
            }
            className="px-3 py-1.5 rounded-xl bg-coral-100 hover:bg-coral-200 text-coral-700 text-[12px] font-bold transition shrink-0"
          >
            Compris
          </button>
        </div>
      )}

      {/* ── TABS ── */}
      <PatientTabs active={tab} onChange={setTab} />

      {tab === 'today' && (
        <TodayTab
          currentVitals={currentVitals}
          recommendation={recommendation}
          vitalsHistory={vitalsHistory}
          events={events}
          carePlan={carePlan}
          showXAI={showXAI}
          setShowXAI={setShowXAI}
          setLogModal={setLogModal}
          setTab={setTab}
        />
      )}

      {tab === 'journal' && <JournalTab events={events} onAdd={() => setLogModal('meal')} />}

      {tab === 'trends' && <TrendsTab stats={stats} tir={tir} agp={agp} />}

      {tab === 'treatment' && <TreatmentTab carePlan={carePlan} medications={medications} />}

      {tab === 'bilans' && (
        <BilansTab
          labReports={labReports}
          onScan={() => setShowScanner(true)}
          onChanged={refreshLabReports}
        />
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
