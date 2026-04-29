// ============================================================================
// LAB REPORT TIMELINE v4.0.0 — MediAI Care · Thème Naturel
// ============================================================================

import { useState } from 'react';
import {
  FileText, TrendingDown, TrendingUp, Minus, AlertTriangle,
  ChevronRight, Calendar, Trash2, CheckCircle2,
} from 'lucide-react';
import type { LabReport, LabResult } from '../types/medical';
import { extractDiabetesPanel, deleteLabReport } from '../engine/labReportService';
import { cn } from '../utils/cn';

interface LabReportTimelineProps {
  reports: LabReport[];
  onChanged?: () => void;
  showDelete?: boolean;
  emptyMessage?: string;
}

export default function LabReportTimeline({
  reports,
  onChanged,
  showDelete = false,
  emptyMessage = 'Aucun bilan biologique enregistré pour le moment.',
}: LabReportTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(reports[0]?.id ?? null);

  if (reports.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-sage-200 bg-sage-50">
        <FileText className="w-8 h-8 text-sage-300 mx-auto mb-2" />
        <p className="text-[13px] text-sage-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce bilan définitivement ? Cette action est irréversible.')) {
      deleteLabReport(id);
      if (expandedId === id) setExpandedId(null);
      onChanged?.();
    }
  };

  return (
    <div className="space-y-3">
      {reports.map((report, idx) => {
        const previous         = reports[idx + 1];
        const isExpanded       = expandedId === report.id;
        const summary          = extractDiabetesPanel(report.payload);
        const previousSummary  = previous ? extractDiabetesPanel(previous.payload) : undefined;
        const anomaliesCount   = report.validation.anomaliesDetected.length;

        return (
          <div
            key={report.id}
            className={cn(
              'rounded-2xl border overflow-hidden transition-all',
              isExpanded ? 'border-brand-200 ring-1 ring-brand-100' : 'border-sage-200 hover:border-sage-300'
            )}
          >
            {/* Header cliquable */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : report.id)}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-sage-50 transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1',
                  anomaliesCount > 0
                    ? 'bg-amber-100 ring-amber-200 text-amber-700'
                    : 'bg-brand-100 ring-brand-200 text-brand-700'
                )}>
                  {anomaliesCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13.5px] text-sage-900 font-bold">{report.payload.laboratory.name}</p>
                    {idx === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 ring-1 ring-brand-200 text-brand-700 font-bold">
                        DERNIER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-sage-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(report.payload.reportDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-sage-200">·</span>
                    <span>{report.payload.results.length} analyses</span>
                    {anomaliesCount > 0 && (
                      <>
                        <span className="text-sage-200">·</span>
                        <span className="text-amber-700 flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          {anomaliesCount} anomalie{anomaliesCount > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className={cn('w-4 h-4 text-sage-400 transition-transform shrink-0 ml-2', isExpanded && 'rotate-90')} />
            </button>

            {/* Contenu déplié */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-sage-100 pt-3 space-y-3">
                {/* Indicateurs clés */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <KeyMetric label="HbA1c"        value={summary.hba1c}          unit="%"      previous={previousSummary?.hba1c}          targetMax={7}   inverse={false} />
                  <KeyMetric label="Glyc. à jeun" value={summary.fastingGlucose} unit="mg/dL"  previous={previousSummary?.fastingGlucose} targetMax={130} inverse={false} />
                  <KeyMetric label="LDL"           value={summary.ldl}            unit="mg/dL"  previous={previousSummary?.ldl}            targetMax={130} inverse={false} />
                  <KeyMetric label="eGFR"          value={summary.egfr}           unit=""       previous={previousSummary?.egfr}           targetMin={90}  inverse={true} />
                </div>

                {/* Tableau résultats */}
                <div className="rounded-xl border border-sage-200 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-sage-100">
                    {report.payload.results.map(r => <ResultRow key={r.code} result={r} />)}
                  </div>
                </div>

                {/* Métadonnées + actions */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-sage-400 font-medium">
                  <div className="flex items-center gap-3">
                    <span>Trace : <code className="text-sage-600 font-mono">{report.traceId}</code></span>
                    {report.appliedToPredictions && (
                      <span className="flex items-center gap-1 text-brand-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Intégré aux prédictions
                      </span>
                    )}
                  </div>
                  {showDelete && (
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-coral-50 hover:bg-coral-100 text-coral-600 transition ring-1 ring-coral-200 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KeyMetric({ label, value, unit, previous, targetMax, targetMin, inverse }: {
  label: string;
  value?: number;
  unit: string;
  previous?: number;
  targetMax?: number;
  targetMin?: number;
  inverse?: boolean;
}) {
  if (value === undefined) {
    return (
      <div className="p-2.5 rounded-xl bg-sage-50 border border-sage-100">
        <p className="text-[10px] text-sage-400 uppercase tracking-wider font-bold">{label}</p>
        <p className="text-[13px] text-sage-300 mt-1 font-bold">—</p>
      </div>
    );
  }

  const inTarget =
    (targetMax !== undefined && value <= targetMax) ||
    (targetMin !== undefined && value >= targetMin);

  let trend: 'up' | 'down' | 'same' | null = null;
  let trendGood = false;
  if (previous !== undefined) {
    const delta = value - previous;
    if (Math.abs(delta) < value * 0.02) {
      trend = 'same';
    } else if (delta > 0) {
      trend = 'up';
      trendGood = inverse === true;
    } else {
      trend = 'down';
      trendGood = inverse !== true;
    }
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn(
      'p-2.5 rounded-xl border ring-1',
      inTarget ? 'bg-brand-50 border-brand-200 ring-brand-100' : 'bg-amber-50 border-amber-200 ring-amber-100'
    )}>
      <p className={cn('text-[10px] uppercase tracking-wider font-bold', inTarget ? 'text-brand-600' : 'text-amber-600')}>{label}</p>
      <div className="flex items-baseline justify-between mt-1">
        <p className={cn('text-[13px] font-black', inTarget ? 'text-brand-800' : 'text-amber-800')}>
          {value}
          {unit && <span className="text-[10px] font-normal ml-0.5 opacity-70">{unit}</span>}
        </p>
        {trend && previous !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-bold',
            trend === 'same' ? 'text-sage-400' : trendGood ? 'text-brand-600' : 'text-coral-600'
          )}>
            <TrendIcon className="w-2.5 h-2.5" />
            <span className="tabular-nums">
              {trend !== 'same' && (value > previous ? '+' : '')}
              {trend !== 'same' && (value - previous).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: LabResult }) {
  const flag = result.flag ?? 'normal';
  const flagConfig: Record<string, { text: string; bg: string }> = {
    'normal':        { text: 'text-brand-700',  bg: '' },
    'low':           { text: 'text-amber-700',  bg: '' },
    'high':          { text: 'text-amber-700',  bg: '' },
    'critical-low':  { text: 'text-coral-600',  bg: 'bg-coral-50' },
    'critical-high': { text: 'text-coral-600',  bg: 'bg-coral-50' },
  };
  const fc = flagConfig[flag] ?? flagConfig['normal'];

  return (
    <div className={cn('px-3 py-2 flex items-center justify-between text-[12px] hover:bg-sage-50 transition', fc.bg)}>
      <div className="min-w-0 flex-1">
        <p className="text-sage-800 font-medium truncate">{result.label}</p>
        <p className="text-sage-400 text-[10px] font-medium">
          {result.refRange.text ?? `${result.refRange.low ?? '—'} – ${result.refRange.high ?? '—'} ${result.unit}`}
        </p>
      </div>
      <p className={cn('tabular-nums ml-2 font-bold', fc.text)}>
        {result.value} <span className="text-sage-400 font-normal">{result.unit}</span>
      </p>
    </div>
  );
}
