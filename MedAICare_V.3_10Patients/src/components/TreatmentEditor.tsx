// ============================================================================
// TREATMENT EDITOR v3.4.0
// Clinicien : créer / modifier / arrêter les prescriptions d'un patient
// • Audit trail visible (chaque action tracée)
// • Bibliothèque de médicaments fréquents
// • Justification clinique obligatoire
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

const STATUS_STYLES: Record<Prescription['status'], { label: string; bg: string; text: string; ring: string; dot: string }> = {
  active:        { label: 'Active',      bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/25', dot: 'bg-emerald-400' },
  paused:        { label: 'En pause',    bg: 'bg-amber-500/10',   text: 'text-amber-300',   ring: 'ring-amber-500/25',   dot: 'bg-amber-400' },
  discontinued:  { label: 'Arrêtée',     bg: 'bg-rose-500/10',    text: 'text-rose-300',    ring: 'ring-rose-500/25',    dot: 'bg-rose-400' },
  completed:     { label: 'Terminée',    bg: 'bg-white/[0.05]',   text: 'text-white/60',    ring: 'ring-white/10',       dot: 'bg-white/40' },
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

// ─── Modal : Nouvelle prescription ───────────────────────────────────────────

function NewPrescriptionModal({
  patientId, patientName, clinicianName, clinicianId, onClose, onCreated,
}: {
  patientId: string;
  patientName: string;
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DrugTemplate | null>(null);
  const [dose, setDose] = useState<number>(0);
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timing, setTiming] = useState('');
  const [indication, setIndication] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const canSubmit = selected && dose > 0 && unit && frequency && indication;

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    try {
      await createPrescription({
        patientId,
        drugName: selected.drugName,
        genericName: selected.genericName,
        drugClass: selected.drugClass,
        dose, doseUnit: unit, frequency, timing,
        route: selected.route,
        indication,
        warnings: selected.warnings,
        patientNotes,
        prescribedBy: clinicianName,
        prescribedById: clinicianId,
      });
      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0E1424] border border-white/[0.08] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <div className="text-[16px] font-semibold text-white flex items-center gap-2">
              <Pill className="w-4.5 h-4.5 text-blue-300" />
              Nouvelle prescription
            </div>
            <div className="text-[11.5px] text-white/45 mt-0.5">Patient : {patientName}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Drug library */}
          <div className="w-[280px] border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="p-3 border-b border-white/[0.06]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un médicament…"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 text-[12.5px] text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-[12px] text-white/40 text-center">Aucun résultat</div>
              ) : filtered.map((d, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(d)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-white/[0.04] transition',
                    selected?.drugName === d.drugName ? 'bg-blue-500/[0.10]' : 'hover:bg-white/[0.03]'
                  )}
                >
                  <div className="text-[12.5px] font-semibold text-white">{d.drugName}</div>
                  <div className="text-[10.5px] text-white/45 mt-0.5">{d.genericName}</div>
                  <div className="text-[10px] text-blue-300/80 mt-1">{DRUG_CLASS_LABELS[d.drugClass]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/40">
                <Pill className="w-10 h-10 mb-3 text-white/20" strokeWidth={1.5} />
                <div className="text-[13px]">Sélectionnez un médicament dans la liste</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20">
                  <div className="text-[14px] font-semibold text-white">{selected.drugName}</div>
                  <div className="text-[11.5px] text-white/55 mt-0.5">{selected.genericName} · {DRUG_CLASS_LABELS[selected.drugClass]}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Dose *</label>
                    <input
                      type="number" min={0} step={0.1}
                      value={dose} onChange={e => setDose(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Unité *</label>
                    <input
                      type="text" value={unit} onChange={e => setUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Voie</label>
                    <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[13px] text-white/70 capitalize">
                      {selected.route}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Posologie *</label>
                  <input
                    type="text" value={frequency} onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Timing (optionnel)</label>
                  <input
                    type="text" value={timing} onChange={e => setTiming(e.target.value)}
                    placeholder="ex: Au coucher, Avant repas…"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Indication clinique *</label>
                  <textarea
                    rows={2} value={indication} onChange={e => setIndication(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Conseils au patient</label>
                  <textarea
                    rows={2} value={patientNotes} onChange={e => setPatientNotes(e.target.value)}
                    placeholder="Conditions de conservation, prise, contre-indications…"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40 resize-none"
                  />
                </div>

                {selected.warnings && selected.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/25">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Avertissements</span>
                    </div>
                    <ul className="space-y-1">
                      {selected.warnings.map((w, i) => (
                        <li key={i} className="text-[11.5px] text-amber-200/90 flex gap-1.5">
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

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.06] bg-white/[0.015] shrink-0">
          <div className="flex items-center gap-1.5 text-[10.5px] text-white/45">
            <Shield className="w-3 h-3 text-emerald-400" />
            Prescription tracée · Signature SHA-256 · Conforme IEC 62304
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12.5px] text-white/70 hover:bg-white/[0.05] transition">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'px-4 py-2 rounded-lg text-[12.5px] font-semibold flex items-center gap-1.5 transition',
                canSubmit && !submitting
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              )}
            >
              <FileSignature className="w-3.5 h-3.5" />
              {submitting ? 'Signature…' : 'Prescrire & Signer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal : Modification d'une prescription ─────────────────────────────────

function ModifyPrescriptionModal({
  prescription, clinicianName, clinicianId, onClose, onSaved,
}: {
  prescription: Prescription;
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dose, setDose] = useState(prescription.dose);
  const [frequency, setFrequency] = useState(prescription.frequency);
  const [timing, setTiming] = useState(prescription.timing || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasChanges = dose !== prescription.dose
    || frequency !== prescription.frequency
    || timing !== (prescription.timing || '');

  const canSubmit = hasChanges && reason.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await modifyPrescription({
        prescriptionId: prescription.id,
        changes: { dose, frequency, timing },
        reason: reason.trim(),
        performedBy: clinicianName,
        performedById: clinicianId,
      });
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0E1424] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-300" />
            Modifier — {prescription.drugName}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">
                Dose ({prescription.doseUnit})
                {dose !== prescription.dose && (
                  <span className="ml-2 text-amber-300 normal-case">→ modifiée</span>
                )}
              </label>
              <input
                type="number" min={0} step={0.1} value={dose} onChange={e => setDose(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
              />
              <div className="text-[10px] text-white/35 mt-1">Avant : {prescription.dose}</div>
            </div>
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">Timing</label>
              <input
                type="text" value={timing} onChange={e => setTiming(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">
              Posologie
              {frequency !== prescription.frequency && (
                <span className="ml-2 text-amber-300 normal-case">→ modifiée</span>
              )}
            </label>
            <input
              type="text" value={frequency} onChange={e => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40"
            />
            <div className="text-[10px] text-white/35 mt-1">Avant : {prescription.frequency}</div>
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">
              Justification clinique * <span className="text-rose-300 normal-case">(min. 10 caractères)</span>
            </label>
            <textarea
              rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ex : HbA1c à 8.2% malgré observance, augmentation dose basale pour mieux couvrir glycémies au réveil…"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40 resize-none"
            />
            <div className="text-[10px] text-white/35 mt-1">{reason.length}/10 minimum · Tracé dans l'audit</div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.015]">
          <div className="text-[10.5px] text-white/45">Version actuelle : v{prescription.version}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] text-white/70 hover:bg-white/[0.05] transition">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition',
                canSubmit && !submitting
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              )}
            >
              <Check className="w-3.5 h-3.5" />
              {submitting ? '…' : 'Valider modification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal : Arrêt / Pause ───────────────────────────────────────────────────

function StatusChangeModal({
  prescription, action, clinicianName, clinicianId, onClose, onSaved,
}: {
  prescription: Prescription;
  action: 'pause' | 'resume' | 'discontinue';
  clinicianName: string;
  clinicianId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = {
    pause:        { title: 'Mettre en pause',  newStatus: 'paused' as const,       color: 'amber',   verb: 'mise en pause' },
    resume:       { title: 'Reprendre',        newStatus: 'active' as const,       color: 'emerald', verb: 'reprise' },
    discontinue:  { title: 'Arrêter',          newStatus: 'discontinued' as const, color: 'rose',    verb: 'arrêtée' },
  }[action];

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return;
    setSubmitting(true);
    try {
      await changePrescriptionStatus(
        prescription.id, config.newStatus, reason.trim(), clinicianName, clinicianId
      );
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0E1424] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="text-[15px] font-semibold text-white">{config.title} — {prescription.drugName}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className={cn(
            'p-3 rounded-xl border',
            config.color === 'rose' ? 'bg-rose-500/[0.08] border-rose-500/25' :
            config.color === 'amber' ? 'bg-amber-500/[0.08] border-amber-500/25' :
            'bg-emerald-500/[0.08] border-emerald-500/25'
          )}>
            <div className="text-[12px] text-white/80">
              Cette prescription sera <strong>{config.verb}</strong>. Le patient sera notifié et l'action est tracée dans l'audit.
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-white/45 mb-1.5">
              Justification clinique * <span className="text-rose-300 normal-case">(min. 10 caractères)</span>
            </label>
            <textarea
              rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Raison médicale détaillée…"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-blue-500/40 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.015] gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] text-white/70 hover:bg-white/[0.05] transition">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length < 10 || submitting}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition',
              reason.trim().length >= 10 && !submitting
                ? config.color === 'rose'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                  : config.color === 'amber'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
            )}
          >
            {submitting ? '…' : `Confirmer ${config.title.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface TreatmentEditorProps {
  patientId: string;
  patientName: string;
  readOnly?: boolean; // si true, on n'affiche pas les boutons d'édition (vue patient)
}

export default function TreatmentEditor({ patientId, patientName, readOnly = false }: TreatmentEditorProps) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [audit, setAudit] = useState<PrescriptionAudit[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [modifying, setModifying] = useState<Prescription | null>(null);
  const [statusChange, setStatusChange] = useState<{ rx: Prescription; action: 'pause' | 'resume' | 'discontinue' } | null>(null);
  const [tab, setTab] = useState<'active' | 'all' | 'audit'>('active');
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  const clinicianName = user?.name || 'Clinicien';
  const clinicianId = user?.id || 'unknown';

  const refresh = () => {
    setPrescriptions(getPrescriptionsForPatient(patientId));
    setAudit(getAuditForPatient(patientId));
  };

  useEffect(() => {
    (async () => {
      // Seed démo si pas de prescriptions
      await seedDemoPrescriptions(patientId, clinicianName, clinicianId);
      refresh();
    })();
    const handler = () => refresh();
    window.addEventListener('mediai:prescriptions:updated', handler);
    return () => window.removeEventListener('mediai:prescriptions:updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const visiblePrescriptions = tab === 'active'
    ? prescriptions.filter(p => p.status === 'active')
    : prescriptions;

  const activeCount = prescriptions.filter(p => p.status === 'active').length;
  const totalCount = prescriptions.length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-300" />
            <span className="text-[14px] font-semibold text-white">Plan thérapeutique</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 text-[10px] font-bold text-emerald-300">
              {activeCount} active{activeCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-[10.5px] text-white/40 mt-0.5">
            {readOnly ? 'Vu par le patient' : 'Édition réservée au clinicien'} · Audit automatique
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Prescrire
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-white/[0.06]">
        {([
          { k: 'active', l: `Actives (${activeCount})` },
          { k: 'all', l: `Tout l'historique (${totalCount})` },
          { k: 'audit', l: `Audit (${audit.length})` },
        ] as const).map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition',
              tab === t.k
                ? 'bg-white/[0.07] text-white'
                : 'text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
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
              <Pill className="w-10 h-10 text-white/20 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[13px] text-white/50">Aucune prescription</div>
              <div className="text-[11px] text-white/30 mt-1">
                {!readOnly && 'Cliquez sur "Prescrire" pour ajouter un traitement.'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePrescriptions.map(rx => {
                const style = STATUS_STYLES[rx.status];
                return (
                  <div
                    key={rx.id}
                    className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-white">{rx.drugName}</span>
                          {rx.genericName && rx.genericName !== rx.drugName && (
                            <span className="text-[11px] text-white/50">({rx.genericName})</span>
                          )}
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ring-1',
                            style.bg, style.text, style.ring
                          )}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                            {style.label}
                          </span>
                          {rx.version > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/[0.1] ring-1 ring-blue-500/20 text-[9.5px] text-blue-300 font-mono">
                              v{rx.version}
                            </span>
                          )}
                        </div>

                        <div className="text-[12px] text-white/65 mt-1.5 flex items-center gap-3 flex-wrap">
                          <span><strong className="text-white">{rx.dose} {rx.doseUnit}</strong> — {rx.frequency}</span>
                          {rx.timing && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rx.timing}</span>}
                        </div>

                        <div className="text-[11px] text-white/40 mt-1">{rx.indication}</div>

                        {rx.warnings && rx.warnings.length > 0 && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                            <div className="text-[10.5px] text-amber-200/80">{rx.warnings.join(' · ')}</div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/35">
                          <span>Prescrit par {rx.prescribedBy}</span>
                          <span>·</span>
                          <span>{formatDate(rx.prescribedAt)}</span>
                          {rx.lastModifiedAt && (
                            <>
                              <span>·</span>
                              <span className="text-amber-300/70">Modifié {formatRelative(rx.lastModifiedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {!readOnly && rx.status !== 'discontinued' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setModifying(rx)}
                            title="Modifier la dose / posologie"
                            className="w-8 h-8 rounded-lg hover:bg-blue-500/15 flex items-center justify-center transition group"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white/50 group-hover:text-blue-300" />
                          </button>
                          {rx.status === 'active' ? (
                            <button
                              onClick={() => setStatusChange({ rx, action: 'pause' })}
                              title="Mettre en pause"
                              className="w-8 h-8 rounded-lg hover:bg-amber-500/15 flex items-center justify-center transition group"
                            >
                              <Pause className="w-3.5 h-3.5 text-white/50 group-hover:text-amber-300" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatusChange({ rx, action: 'resume' })}
                              title="Reprendre"
                              className="w-8 h-8 rounded-lg hover:bg-emerald-500/15 flex items-center justify-center transition group"
                            >
                              <Play className="w-3.5 h-3.5 text-white/50 group-hover:text-emerald-300" />
                            </button>
                          )}
                          <button
                            onClick={() => setStatusChange({ rx, action: 'discontinue' })}
                            title="Arrêter définitivement"
                            className="w-8 h-8 rounded-lg hover:bg-rose-500/15 flex items-center justify-center transition group"
                          >
                            <X className="w-3.5 h-3.5 text-white/50 group-hover:text-rose-300" />
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
          // Audit trail
          audit.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-white/20 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[13px] text-white/50">Aucune action dans l'historique</div>
            </div>
          ) : (
            <div className="space-y-2">
              {audit.map(entry => {
                const isExpanded = expandedAudit === entry.id;
                const rx = prescriptions.find(p => p.id === entry.prescriptionId);
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedAudit(isExpanded ? null : entry.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 ring-1 ring-blue-500/25 flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12.5px] font-semibold text-white">{ACTION_LABELS[entry.action]}</span>
                          <span className="text-[11.5px] text-white/55">— {rx?.drugName || 'Prescription supprimée'}</span>
                        </div>
                        <div className="text-[10.5px] text-white/40 mt-0.5">
                          {entry.performedBy} · {formatRelative(entry.performedAt)} · {formatDate(entry.performedAt)}
                        </div>
                      </div>
                      <ChevronRight className={cn('w-4 h-4 text-white/40 transition-transform', isExpanded && 'rotate-90')} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-white/[0.05] bg-white/[0.01]">
                        <div className="pt-3">
                          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Justification</div>
                          <div className="text-[12px] text-white/85 italic">"{entry.reason}"</div>
                        </div>
                        {entry.before && entry.after && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="p-2 rounded-lg bg-rose-500/[0.06] border border-rose-500/15">
                              <div className="text-[9.5px] uppercase tracking-wider text-rose-300/70 mb-1">Avant</div>
                              <div className="text-[11px] text-white/70 font-mono">
                                {entry.before.dose} {entry.before.doseUnit} — {entry.before.frequency}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                              <div className="text-[9.5px] uppercase tracking-wider text-emerald-300/70 mb-1">Après</div>
                              <div className="text-[11px] text-white/70 font-mono">
                                {entry.after.dose} {entry.after.doseUnit} — {entry.after.frequency}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 text-[9.5px] text-white/35">
                          <Shield className="w-2.5 h-2.5 text-emerald-400/70" />
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
          patientId={patientId}
          patientName={patientName}
          clinicianName={clinicianName}
          clinicianId={clinicianId}
          onClose={() => setShowNew(false)}
          onCreated={refresh}
        />
      )}
      {modifying && (
        <ModifyPrescriptionModal
          prescription={modifying}
          clinicianName={clinicianName}
          clinicianId={clinicianId}
          onClose={() => setModifying(null)}
          onSaved={refresh}
        />
      )}
      {statusChange && (
        <StatusChangeModal
          prescription={statusChange.rx}
          action={statusChange.action}
          clinicianName={clinicianName}
          clinicianId={clinicianId}
          onClose={() => setStatusChange(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
