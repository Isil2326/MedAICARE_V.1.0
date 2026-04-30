// ============================================================================
// TREATMENT EDITOR v4.0.0 — MediAI Care · Thème Naturel
// Clinicien : créer / modifier / arrêter les prescriptions d'un patient
// • Audit trail visible · Bibliothèque médicaments · Justification obligatoire
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Pill, Plus, Edit3, Pause, Play, X, AlertTriangle, Check, Clock,
  History, ChevronRight, Activity, Shield, FileSignature,
} from 'lucide-react';
import type { Prescription, PrescriptionAudit } from '../types/medical';
import {
  getPrescriptionsForPatient, getAuditForPatient, createPrescription,
  modifyPrescription, changePrescriptionStatus, seedDemoPrescriptions,
  DRUG_LIBRARY, DRUG_CLASS_LABELS, type DrugTemplate,
} from '../engine/prescriptionService';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h    = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d    = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// ── Status styles — light theme ───────────────────────────────────────────────

const STATUS_STYLES: Record<Prescription['status'], { label: string; bg: string; text: string; ring: string; dot: string }> = {
  active:       { label: 'Active',    bg: 'bg-brand-100', text: 'text-brand-700',  ring: 'ring-brand-200',  dot: 'bg-brand-500' },
  paused:       { label: 'En pause',  bg: 'bg-amber-100', text: 'text-amber-700',  ring: 'ring-amber-200',  dot: 'bg-amber-500' },
  discontinued: { label: 'Arrêtée',   bg: 'bg-coral-50',  text: 'text-coral-600',  ring: 'ring-coral-200',  dot: 'bg-coral-500' },
  completed:    { label: 'Terminée',  bg: 'bg-slate-100',  text: 'text-slate-500',   ring: 'ring-slate-200',   dot: 'bg-slate-400' },
};

const ACTION_LABELS: Record<PrescriptionAudit['action'], string> = {
  created:           'Création',
  dose_changed:      'Modification dose',
  frequency_changed: 'Modification posologie',
  paused:            'Mise en pause',
  resumed:           'Reprise',
  discontinued:      'Arrêt',
  replaced:          'Remplacement',
};

// ── Shared form field styles ──────────────────────────────────────────────────
const FIELD_BASE = 'w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 text-[13px] text-slate-900 focus:outline-none transition placeholder:text-slate-400';
const LABEL_BASE = 'block text-[10.5px] uppercase tracking-wider text-slate-500 font-bold mb-1.5';

// ── Modal overlay ─────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative">
        {children}
      </div>
    </div>
  );
}

// ── Modal : Nouvelle prescription ─────────────────────────────────────────────

function NewPrescriptionModal({ patientId, patientName, clinicianName, clinicianId, onClose, onCreated }: {
  patientId: string;
  patientName: string;
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<DrugTemplate | null>(null);
  const [dose, setDose]               = useState<number>(0);
  const [unit, setUnit]               = useState('');
  const [frequency, setFrequency]     = useState('');
  const [timing, setTiming]           = useState('');
  const [indication, setIndication]   = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return DRUG_LIBRARY;
    const q = search.toLowerCase();
    return DRUG_LIBRARY.filter(d =>
      d.drugName.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      DRUG_CLASS_LABELS[d.drugClass].toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (drug: DrugTemplate) => {
    setSelected(drug);
    setDose(drug.defaultDose);
    setUnit(drug.defaultUnit);
    setFrequency(drug.defaultFrequency);
    setIndication(drug.defaultIndication);
  };

  const canSubmit   = selected && dose > 0 && unit && frequency && indication;

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    try {
      await createPrescription({
        patientId,
        drugName: selected.drugName, genericName: selected.genericName,
        drugClass: selected.drugClass,
        dose, doseUnit: unit, frequency, timing,
        route: selected.route, indication,
        warnings: selected.warnings, patientNotes,
        prescribedBy: clinicianName, prescribedById: clinicianId,
      });
      onCreated();
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4.5 h-4.5 text-blue-600" />
              Nouvelle prescription
            </div>
            <div className="text-[11.5px] text-slate-400 mt-0.5 font-medium">Patient : {patientName}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Drug library */}
          <div className="w-[280px] border-r border-slate-100 flex flex-col shrink-0 bg-slate-50">
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un médicament…"
                className={FIELD_BASE}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-[12px] text-slate-400 text-center font-medium">Aucun résultat</div>
              ) : filtered.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(d)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-slate-100 transition',
                    selected?.drugName === d.drugName ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-white'
                  )}
                >
                  <div className="text-[12.5px] font-bold text-slate-900">{d.drugName}</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">{d.genericName}</div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{DRUG_CLASS_LABELS[d.drugClass]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Pill className="w-12 h-12 mb-3 text-slate-200" strokeWidth={1.5} />
                <div className="text-[13px] text-slate-400 font-medium">Sélectionnez un médicament dans la liste</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-[14px] font-bold text-slate-900">{selected.drugName}</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5 font-medium">{selected.genericName} · {DRUG_CLASS_LABELS[selected.drugClass]}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL_BASE}>Dose *</label>
                    <input type="number" min={0} step={0.1} value={dose} onChange={e => setDose(Number(e.target.value))} className={FIELD_BASE} />
                  </div>
                  <div>
                    <label className={LABEL_BASE}>Unité *</label>
                    <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className={FIELD_BASE} />
                  </div>
                  <div>
                    <label className={LABEL_BASE}>Voie</label>
                    <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[13px] text-slate-600 font-medium capitalize">{selected.route}</div>
                  </div>
                </div>

                <div>
                  <label className={LABEL_BASE}>Posologie *</label>
                  <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} className={FIELD_BASE} />
                </div>

                <div>
                  <label className={LABEL_BASE}>Timing (optionnel)</label>
                  <input type="text" value={timing} onChange={e => setTiming(e.target.value)} placeholder="ex: Au coucher, Avant repas…" className={FIELD_BASE} />
                </div>

                <div>
                  <label className={LABEL_BASE}>Indication clinique *</label>
                  <textarea rows={2} value={indication} onChange={e => setIndication(e.target.value)} className={cn(FIELD_BASE, 'resize-none')} />
                </div>

                <div>
                  <label className={LABEL_BASE}>Conseils au patient</label>
                  <textarea rows={2} value={patientNotes} onChange={e => setPatientNotes(e.target.value)} placeholder="Conditions de conservation, prise, contre-indications…" className={cn(FIELD_BASE, 'resize-none')} />
                </div>

                {selected.warnings && selected.warnings.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Avertissements</span>
                    </div>
                    <ul className="space-y-1">
                      {selected.warnings.map((w, i) => (
                        <li key={i} className="text-[11.5px] text-amber-800 flex gap-1.5">
                          <span>•</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
            <Shield className="w-3 h-3 text-brand-600" />
            Prescription tracée · Signature SHA-256 · Conforme IEC 62304
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12.5px] text-slate-600 hover:bg-slate-200 transition font-semibold">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 transition',
                canSubmit && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <FileSignature className="w-3.5 h-3.5" />
              {submitting ? 'Signature…' : 'Prescrire & Signer'}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Modal : Modification d'une prescription ───────────────────────────────────

function ModifyPrescriptionModal({ prescription, clinicianName, clinicianId, onClose, onSaved }: {
  prescription: Prescription;
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dose, setDose]           = useState(prescription.dose);
  const [frequency, setFrequency] = useState(prescription.frequency);
  const [timing, setTiming]       = useState(prescription.timing || '');
  const [reason, setReason]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasChanges = dose !== prescription.dose || frequency !== prescription.frequency || timing !== (prescription.timing || '');
  const canSubmit  = hasChanges && reason.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await modifyPrescription({ prescriptionId: prescription.id, changes: { dose, frequency, timing }, reason: reason.trim(), performedBy: clinicianName, performedById: clinicianId });
      onSaved();
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            Modifier — {prescription.drugName}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_BASE}>
                Dose ({prescription.doseUnit})
                {dose !== prescription.dose && <span className="ml-2 text-amber-600 normal-case font-bold">→ modifiée</span>}
              </label>
              <input type="number" min={0} step={0.1} value={dose} onChange={e => setDose(Number(e.target.value))} className={FIELD_BASE} />
              <div className="text-[10px] text-slate-400 mt-1 font-medium">Avant : {prescription.dose}</div>
            </div>
            <div>
              <label className={LABEL_BASE}>Timing</label>
              <input type="text" value={timing} onChange={e => setTiming(e.target.value)} className={FIELD_BASE} />
            </div>
          </div>

          <div>
            <label className={LABEL_BASE}>
              Posologie
              {frequency !== prescription.frequency && <span className="ml-2 text-amber-600 normal-case font-bold">→ modifiée</span>}
            </label>
            <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} className={FIELD_BASE} />
            <div className="text-[10px] text-slate-400 mt-1 font-medium">Avant : {prescription.frequency}</div>
          </div>

          <div>
            <label className={LABEL_BASE}>
              Justification clinique *
              <span className="ml-2 text-coral-500 normal-case font-semibold">(min. 10 caractères)</span>
            </label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ex : HbA1c à 8.2% malgré observance, augmentation dose basale…"
              className={cn(FIELD_BASE, 'resize-none')}
            />
            <div className="text-[10px] text-slate-400 mt-1 font-medium">{reason.length}/10 minimum · Tracé dans l'audit</div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <div className="text-[10.5px] text-slate-400 font-medium">Version actuelle : v{prescription.version}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-[12px] text-slate-600 hover:bg-slate-200 transition font-semibold">Annuler</button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition',
                canSubmit && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Check className="w-3.5 h-3.5" />
              {submitting ? '…' : 'Valider modification'}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Modal : Arrêt / Pause ─────────────────────────────────────────────────────

function StatusChangeModal({ prescription, action, clinicianName, clinicianId, onClose, onSaved }: {
  prescription: Prescription;
  action: 'pause' | 'resume' | 'discontinue';
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason]           = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const config = {
    pause:       { title: 'Mettre en pause', newStatus: 'paused' as const,       bannerClass: 'bg-amber-50 border-amber-200 text-amber-800',   btnClass: 'bg-amber-600 hover:bg-amber-700', verb: 'mise en pause' },
    resume:      { title: 'Reprendre',       newStatus: 'active' as const,       bannerClass: 'bg-brand-50 border-brand-200 text-brand-800',   btnClass: 'bg-brand-600 hover:bg-brand-700', verb: 'reprise' },
    discontinue: { title: 'Arrêter',         newStatus: 'discontinued' as const, bannerClass: 'bg-coral-50 border-coral-200 text-coral-800',   btnClass: 'bg-coral-600 hover:bg-coral-700', verb: 'arrêtée' },
  }[action];

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return;
    setSubmitting(true);
    try {
      await changePrescriptionStatus(prescription.id, config.newStatus, reason.trim(), clinicianName, clinicianId);
      onSaved();
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="text-[15px] font-bold text-slate-900">{config.title} — {prescription.drugName}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className={cn('p-3.5 rounded-xl border text-[13px] font-medium', config.bannerClass)}>
            Cette prescription sera <strong>{config.verb}</strong>. Le patient sera notifié et l'action est tracée dans l'audit.
          </div>
          <div>
            <label className={LABEL_BASE}>
              Justification clinique *
              <span className="ml-2 text-coral-500 normal-case font-semibold">(min. 10 caractères)</span>
            </label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Raison médicale détaillée…" className={cn(FIELD_BASE, 'resize-none')} />
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-100 bg-slate-50 gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-[12px] text-slate-600 hover:bg-slate-200 transition font-semibold">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length < 10 || submitting}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[12px] font-bold text-white transition shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
              reason.trim().length >= 10 && !submitting ? config.btnClass : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {submitting ? '…' : `Confirmer ${config.title.toLowerCase()}`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface TreatmentEditorProps {
  patientId: string;
  patientName: string;
  readOnly?: boolean;
}

export default function TreatmentEditor({ patientId, patientName, readOnly = false }: TreatmentEditorProps) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions]   = useState<Prescription[]>([]);
  const [audit, setAudit]                   = useState<PrescriptionAudit[]>([]);
  const [showNew, setShowNew]               = useState(false);
  const [modifying, setModifying]           = useState<Prescription | null>(null);
  const [statusChange, setStatusChange]     = useState<{ rx: Prescription; action: 'pause' | 'resume' | 'discontinue' } | null>(null);
  const [tab, setTab]                       = useState<'active' | 'all' | 'audit'>('active');
  const [expandedAudit, setExpandedAudit]   = useState<string | null>(null);

  const clinicianName = user?.name || 'Clinicien';
  const clinicianId   = user?.id   || 'unknown';

  const refresh = () => {
    setPrescriptions(getPrescriptionsForPatient(patientId));
    setAudit(getAuditForPatient(patientId));
  };

  useEffect(() => {
    (async () => { await seedDemoPrescriptions(patientId, clinicianName, clinicianId); refresh(); })();
    window.addEventListener('mediai:prescriptions:updated', refresh);
    return () => window.removeEventListener('mediai:prescriptions:updated', refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const visiblePrescriptions = tab === 'active' ? prescriptions.filter(p => p.status === 'active') : prescriptions;
  const activeCount          = prescriptions.filter(p => p.status === 'active').length;
  const totalCount           = prescriptions.length;

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-[14px] font-bold text-slate-900">Plan thérapeutique</span>
            <span className="px-1.5 py-0.5 rounded-full bg-brand-100 ring-1 ring-brand-200 text-[10px] font-bold text-brand-700">
              {activeCount} active{activeCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
            {readOnly ? 'Vue patient (lecture seule)' : 'Édition réservée au clinicien'} · Audit automatique
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition"
          >
            <Plus className="w-3.5 h-3.5" /> Prescrire
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100 bg-slate-50">
        {([
          { k: 'active', l: `Actives (${activeCount})` },
          { k: 'all',    l: `Tout l'historique (${totalCount})` },
          { k: 'audit',  l: `Audit (${audit.length})` },
        ] as const).map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition',
              tab === t.k ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {tab !== 'audit' ? (
          visiblePrescriptions.length === 0 ? (
            <div className="text-center py-10">
              <Pill className="w-10 h-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[13px] text-slate-500 font-semibold">Aucune prescription</div>
              {!readOnly && <div className="text-[11px] text-slate-400 mt-1">Cliquez sur "Prescrire" pour ajouter un traitement.</div>}
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePrescriptions.map(rx => {
                const style = STATUS_STYLES[rx.status];
                return (
                  <div key={rx.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-4 hover:bg-white hover:border-slate-300 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-bold text-slate-900">{rx.drugName}</span>
                          {rx.genericName && rx.genericName !== rx.drugName && (
                            <span className="text-[11px] text-slate-400 font-medium">({rx.genericName})</span>
                          )}
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ring-1', style.bg, style.text, style.ring)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                            {style.label}
                          </span>
                          {rx.version > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 ring-1 ring-blue-200 text-[9.5px] text-blue-700 font-bold font-mono">
                              v{rx.version}
                            </span>
                          )}
                        </div>

                        <div className="text-[12px] text-slate-600 mt-1.5 flex items-center gap-3 flex-wrap font-medium">
                          <span><strong className="text-slate-900 font-bold">{rx.dose} {rx.doseUnit}</strong> — {rx.frequency}</span>
                          {rx.timing && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rx.timing}</span>}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 font-medium">{rx.indication}</div>

                        {rx.warnings && rx.warnings.length > 0 && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                            <div className="text-[10.5px] text-amber-700 font-medium">{rx.warnings.join(' · ')}</div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span>Prescrit par {rx.prescribedBy}</span>
                          <span className="text-slate-200">·</span>
                          <span>{formatDate(rx.prescribedAt)}</span>
                          {rx.lastModifiedAt && (
                            <>
                              <span className="text-slate-200">·</span>
                              <span className="text-amber-600 font-semibold">Modifié {formatRelative(rx.lastModifiedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {!readOnly && rx.status !== 'discontinued' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setModifying(rx)} title="Modifier" className="w-8 h-8 rounded-xl hover:bg-blue-100 flex items-center justify-center transition group">
                            <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                          </button>
                          {rx.status === 'active' ? (
                            <button onClick={() => setStatusChange({ rx, action: 'pause' })} title="Mettre en pause" className="w-8 h-8 rounded-xl hover:bg-amber-100 flex items-center justify-center transition group">
                              <Pause className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                            </button>
                          ) : (
                            <button onClick={() => setStatusChange({ rx, action: 'resume' })} title="Reprendre" className="w-8 h-8 rounded-xl hover:bg-brand-100 flex items-center justify-center transition group">
                              <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600" />
                            </button>
                          )}
                          <button onClick={() => setStatusChange({ rx, action: 'discontinue' })} title="Arrêter" className="w-8 h-8 rounded-xl hover:bg-coral-50 flex items-center justify-center transition group">
                            <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-coral-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          audit.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[13px] text-slate-500 font-semibold">Aucune action dans l'historique</div>
            </div>
          ) : (
            <div className="space-y-2">
              {audit.map(entry => {
                const isExpanded = expandedAudit === entry.id;
                const rx         = prescriptions.find(p => p.id === entry.prescriptionId);
                return (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedAudit(isExpanded ? null : entry.id)}
                      className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 ring-1 ring-blue-200 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12.5px] font-bold text-slate-900">{ACTION_LABELS[entry.action]}</span>
                          <span className="text-[11.5px] text-slate-400 font-medium">— {rx?.drugName || 'Prescription supprimée'}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                          {entry.performedBy} · {formatRelative(entry.performedAt)} · {formatDate(entry.performedAt)}
                        </div>
                      </div>
                      <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', isExpanded && 'rotate-90')} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 bg-slate-50 pt-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Justification</div>
                          <div className="text-[12.5px] text-slate-700 italic font-medium">"{entry.reason}"</div>
                        </div>
                        {entry.before && entry.after && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-xl bg-coral-50 border border-coral-200">
                              <div className="text-[9.5px] uppercase tracking-wider text-coral-600 font-bold mb-1">Avant</div>
                              <div className="text-[11px] text-slate-700 font-mono font-semibold">
                                {entry.before.dose} {entry.before.doseUnit} — {entry.before.frequency}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200">
                              <div className="text-[9.5px] uppercase tracking-wider text-brand-600 font-bold mb-1">Après</div>
                              <div className="text-[11px] text-slate-700 font-mono font-semibold">
                                {entry.after.dose} {entry.after.doseUnit} — {entry.after.frequency}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-medium">
                          <Shield className="w-2.5 h-2.5 text-brand-500" />
                          <span className="font-mono">SHA-256 : {entry.signature}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {showNew && (
        <NewPrescriptionModal
          patientId={patientId} patientName={patientName}
          clinicianName={clinicianName} clinicianId={clinicianId}
          onClose={() => setShowNew(false)} onCreated={refresh}
        />
      )}
      {modifying && (
        <ModifyPrescriptionModal
          prescription={modifying} clinicianName={clinicianName} clinicianId={clinicianId}
          onClose={() => setModifying(null)} onSaved={refresh}
        />
      )}
      {statusChange && (
        <StatusChangeModal
          prescription={statusChange.rx} action={statusChange.action}
          clinicianName={clinicianName} clinicianId={clinicianId}
          onClose={() => setStatusChange(null)} onSaved={refresh}
        />
      )}
    </div>
  );
}
