// ============================================================================
// LAB REPORT TIMELINE — v3.2.0
// Affichage chronologique des bilans biologiques + comparaison avec précédent
// ============================================================================

import { useState } from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Trash2,
} from 'lucide-react';
import type { LabReport, LabResult } from '../types/medical';
import { extractDiabetesPanel, deleteLabReport } from '../engine/labReportService';

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
      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
        <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{emptyMessage}</p>
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
        const previous = reports[idx + 1];
        const isExpanded = expandedId === report.id;
        const summary = extractDiabetesPanel(report.payload);
        const previousSummary = previous ? extractDiabetesPanel(previous.payload) : undefined;
        const anomaliesCount = report.validation.anomaliesDetected.length;

        return (
          <div
            key={report.id}
            className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition"
          >
            {/* Header cliquable */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : report.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    anomaliesCount > 0
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-white/90 font-medium">
                      {report.payload.laboratory.name}
                    </p>
                    {idx === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/30">
                        DERNIER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(report.payload.reportDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span>·</span>
                    <span>{report.payload.results.length} analyses</span>
                    {anomaliesCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {anomaliesCount} anomalie{anomaliesCount > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-white/40 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Contenu déplié */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {/* Indicateurs clés diabète avec comparaison */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <KeyMetric
                    label="HbA1c"
                    value={summary.hba1c}
                    unit="%"
                    previous={previousSummary?.hba1c}
                    targetMax={7}
                    inverse={false}
                  />
                  <KeyMetric
                    label="Glyc. à jeun"
                    value={summary.fastingGlucose}
                    unit="mg/dL"
                    previous={previousSummary?.fastingGlucose}
                    targetMax={130}
                    inverse={false}
                  />
                  <KeyMetric
                    label="LDL"
                    value={summary.ldl}
                    unit="mg/dL"
                    previous={previousSummary?.ldl}
                    targetMax={130}
                    inverse={false}
                  />
                  <KeyMetric
                    label="eGFR"
                    value={summary.egfr}
                    unit=""
                    previous={previousSummary?.egfr}
                    targetMin={90}
                    inverse={true}
                  />
                </div>

                {/* Tableau résultats compact */}
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                    {report.payload.results.map((r) => (
                      <ResultRow key={r.code} result={r} />
                    ))}
                  </div>
                </div>

                {/* Métadonnées + actions */}
                <div className="flex items-center justify-between pt-2 text-xs text-white/40">
                  <div className="flex items-center gap-3">
                    <span>Trace : <code className="text-white/60">{report.traceId}</code></span>
                    {report.appliedToPredictions && (
                      <span className="text-teal-300">✓ Intégré aux prédictions</span>
                    )}
                  </div>
                  {showDelete && (
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 transition"
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

// ----------------------------------------------------------------------------
// Sous-composants
// ----------------------------------------------------------------------------

function KeyMetric({
  label,
  value,
  unit,
  previous,
  targetMax,
  targetMin,
  inverse,
}: {
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
      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white/30 mt-1">—</p>
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
    if (Math.abs(delta) < (value * 0.02)) {
      trend = 'same';
    } else if (delta > 0) {
      trend = 'up';
      trendGood = inverse === true; // ex: eGFR qui monte = bon
    } else {
      trend = 'down';
      trendGood = inverse !== true; // ex: HbA1c qui baisse = bon
    }
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`p-2.5 rounded-lg border ${
        inTarget
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}
    >
      <p className="text-[10px] text-white/50 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline justify-between mt-1">
        <p className={`text-sm font-semibold ${inTarget ? 'text-emerald-200' : 'text-amber-200'}`}>
          {value}
          {unit && <span className="text-xs text-white/50 ml-0.5">{unit}</span>}
        </p>
        {trend && previous !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-[10px] ${
              trend === 'same'
                ? 'text-white/40'
                : trendGood
                ? 'text-emerald-300'
                : 'text-red-300'
            }`}
          >
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
  const flagStyles: Record<string, string> = {
    'normal': 'text-emerald-300',
    'low': 'text-amber-300',
    'high': 'text-amber-300',
    'critical-low': 'text-red-300 font-semibold',
    'critical-high': 'text-red-300 font-semibold',
  };
  const flag = result.flag ?? 'normal';

  return (
    <div className="px-3 py-2 flex items-center justify-between text-xs hover:bg-white/[0.02]">
      <div className="min-w-0 flex-1">
        <p className="text-white/85 truncate">{result.label}</p>
        <p className="text-white/40 text-[10px]">
          {result.refRange.text ??
            `${result.refRange.low ?? '—'} – ${result.refRange.high ?? '—'} ${result.unit}`}
        </p>
      </div>
      <p className={`tabular-nums ml-2 ${flagStyles[flag]}`}>
        {result.value} <span className="text-white/40">{result.unit}</span>
      </p>
    </div>
  );
}
