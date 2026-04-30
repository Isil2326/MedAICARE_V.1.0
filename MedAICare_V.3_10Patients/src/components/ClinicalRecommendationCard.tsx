import { Brain, CheckCircle2, XCircle, Edit3, Info } from 'lucide-react';
import { cn } from '../utils/cn';

interface SuggestionProps {
  rec: any;
  isClinic: boolean;
  onAction?: (id: string, newStatus: 'ACCEPTED' | 'MODIFIED' | 'REJECTED') => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  PENDING:  { label: '🟡 En attente', bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200'  },
  ACCEPTED: { label: '✅ Appliquée',  bg: 'bg-brand-50',  text: 'text-brand-700',  ring: 'ring-brand-200'  },
  MODIFIED: { label: '🔵 Modifiée',   bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200'   },
  REJECTED: { label: '❌ Rejetée',    bg: 'bg-coral-50',  text: 'text-coral-600',  ring: 'ring-coral-200'  },
};

export function ClinicalRecommendationCard({ rec, isClinic, onAction }: SuggestionProps) {
  const statusMeta = statusConfig[rec.status] ?? statusConfig['PENDING'];

  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-900 leading-snug">{rec.title}</div>
          </div>
        </div>
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 shrink-0', statusMeta.bg, statusMeta.text, statusMeta.ring)}>
          {statusMeta.label}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Message patient */}
        {!isClinic && rec.message_patient && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-blue-800 leading-relaxed">{rec.message_patient}</p>
          </div>
        )}

        {/* Action recommandée */}
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-400 font-medium">Action recommandée</span>
          <span className="font-bold text-slate-900 text-right max-w-[60%]">{rec.action}</span>
        </div>

        {/* Niveau de preuve */}
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-400 font-medium">Niveau de preuve (ADA)</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold ring-1 ring-blue-200">Classe {rec.evidence}</span>
        </div>

        {/* Actions clinicien */}
        {isClinic && rec.status === 'PENDING' && onAction && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => onAction(rec.id, 'ACCEPTED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[12.5px] font-bold transition shadow-[0_2px_8px_rgba(58,110,40,0.25)]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accepter
            </button>
            <button
              onClick={() => onAction(rec.id, 'MODIFIED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[12.5px] font-bold ring-1 ring-amber-200 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Modifier
            </button>
            <button
              onClick={() => onAction(rec.id, 'REJECTED')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-coral-50 hover:bg-coral-100 text-coral-600 text-[12.5px] font-bold ring-1 ring-coral-200 transition"
            >
              <XCircle className="w-3.5 h-3.5" /> Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
