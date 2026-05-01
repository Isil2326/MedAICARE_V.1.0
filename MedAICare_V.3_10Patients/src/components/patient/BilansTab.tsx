import { ScanLine, FileText } from 'lucide-react';
import type { LabReport } from '../../types/medical';
import LabReportTimeline from '../LabReportTimeline';

interface Props {
  labReports: LabReport[];
  onScan: () => void;
  onChanged: () => void;
}

export function BilansTab({ labReports, onScan, onChanged }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Vos bilans biologiques</div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              Scannez le QR code de vos rapports pour enrichir votre dossier et améliorer la
              précision de l&apos;IA.
            </div>
          </div>
        </div>
        <button
          onClick={onScan}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold shadow-[0_2px_10px_rgba(5,150,105,0.3)] transition whitespace-nowrap"
        >
          <ScanLine className="w-4 h-4" /> Scanner un bilan
        </button>
      </div>

      {labReports.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl card-shadow p-3 text-center">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Total</div>
            <div className="text-[24px] font-black text-slate-900 tabular-nums mt-0.5">
              {labReports.length}
            </div>
          </div>
          <div className="bg-white rounded-xl card-shadow p-3 text-center">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Dernier</div>
            <div className="text-[13px] font-bold text-brand-600 mt-1">
              {new Date(labReports[0].payload.reportDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
          </div>
          <div className="bg-white rounded-xl card-shadow p-3 text-center">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
              Anomalies
            </div>
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
          onChanged={onChanged}
          showDelete={true}
          emptyMessage="Aucun bilan enregistré. Scannez le QR code de votre prochain rapport pour commencer."
        />
      </div>
    </div>
  );
}
