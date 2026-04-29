// ============================================================================
// AUDIT LOG v4.0.0 — MediAI Care · Thème Naturel — Journal de traçabilité
// ============================================================================

import { useMemo, useState } from 'react';
import {
  FileText, Search, Download, ShieldCheck, Database,
  Brain, Wifi, Bell, KeyRound, FileCheck, GitBranch,
  AlertTriangle, AlertCircle, Info, XCircle, Filter, Clock,
} from 'lucide-react';
import type { AuditLogEntry } from '../types/medical';
import { generateAuditLogs } from '../engine/simulator';
import { Card, CardHeader, StatTile, Badge, Button, EmptyState, TabBar } from './ui/primitives';
import { cn } from '../utils/cn';

const SEVERITY_META = {
  INFO:     { label: 'Info',     variant: 'info' as const,    icon: Info,          bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200' },
  WARNING:  { label: 'Warning',  variant: 'warning' as const, icon: AlertTriangle, bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  ERROR:    { label: 'Error',    variant: 'danger' as const,  icon: XCircle,       bg: 'bg-coral-50',  text: 'text-coral-600',  ring: 'ring-coral-200' },
  CRITICAL: { label: 'Critique', variant: 'danger' as const,  icon: AlertCircle,   bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200' },
};

const MODULE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; ring: string }> = {
  'AI Engine':    { icon: Brain,      bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  'XAI Module':   { icon: FileCheck,  bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  'IoMT Gateway': { icon: Wifi,       bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-200' },
  'Alert Engine': { icon: Bell,       bg: 'bg-coral-50',   text: 'text-coral-600',  ring: 'ring-coral-200' },
  'Auth':         { icon: KeyRound,   bg: 'bg-brand-100',  text: 'text-brand-700',  ring: 'ring-brand-200' },
  'MLOps':        { icon: GitBranch,  bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
  'Reports':      { icon: FileText,   bg: 'bg-teal-100',   text: 'text-teal-700',   ring: 'ring-teal-200' },
};

const PIPELINE_STEPS = [
  { label: 'Capteur IoMT', sub: 'Donnée brute',             icon: Wifi,       bg: 'bg-blue-100',    text: 'text-blue-700' },
  { label: 'Gateway',      sub: 'Validation + chiffrement', icon: ShieldCheck,bg: 'bg-brand-100',   text: 'text-brand-700' },
  { label: 'Inférence IA', sub: 'Modèle versionné',         icon: Brain,      bg: 'bg-violet-100',  text: 'text-violet-700' },
  { label: 'XAI',          sub: 'Explication SHAP',         icon: FileCheck,  bg: 'bg-amber-100',   text: 'text-amber-700' },
  { label: 'Décision',     sub: 'Recommandation tracée',    icon: FileText,   bg: 'bg-teal-100',    text: 'text-teal-700' },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

type SeverityFilter = 'all' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type Tab = 'logs' | 'compliance';

export default function AuditLog() {
  const logs                        = useMemo(() => generateAuditLogs(), []);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<SeverityFilter>('all');
  const [tab, setTab]               = useState<Tab>('logs');
  const [selected, setSelected]     = useState<AuditLogEntry | null>(null);

  const filtered = useMemo(() => logs.filter(log => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.traceId.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'all' || log.severity === filter);
  }), [logs, search, filter]);

  const stats = useMemo(() => ({
    total:    logs.length,
    critical: logs.filter(l => l.severity === 'CRITICAL').length,
    errors:   logs.filter(l => l.severity === 'ERROR').length,
    warnings: logs.filter(l => l.severity === 'WARNING').length,
  }), [logs]);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">

      {/* === KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Événements (24h)" value={stats.total}    icon={Database}   accent="blue"   hint="Tracés et signés" />
        <StatTile label="Critiques"         value={stats.critical} icon={AlertCircle}accent="amber"  hint={stats.critical > 0 ? 'Investigation requise' : 'RAS'} />
        <StatTile label="Erreurs"           value={stats.errors}   icon={XCircle}    accent="coral"  hint="Échecs techniques" />
        <StatTile label="Conformité"        value="100%"           icon={ShieldCheck} accent="green" hint="IEC 62304 · ISO 13485" />
      </div>

      {/* === Tabs + Export === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TabBar<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'logs',       label: 'Journal d\'événements',     icon: FileText,   count: logs.length },
            { key: 'compliance', label: 'Traçabilité & Conformité',   icon: ShieldCheck },
          ]}
        />
        {tab === 'logs' && (
          <Button variant="secondary" size="sm" icon={Download}>Exporter (CSV)</Button>
        )}
      </div>

      {/* ========== TAB: LOGS ========== */}
      {tab === 'logs' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Liste événements */}
          <Card className="xl:col-span-2">
            <div className="p-4 border-b border-sage-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-[14px] font-bold text-sage-900">Événements en temps réel</h3>
                  <p className="text-[12px] text-sage-500 mt-0.5">Trace immuable signée · horodatage UTC</p>
                </div>
                <div className="relative shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sage-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher trace, user…"
                    className="pl-8 pr-3 py-1.5 w-52 rounded-xl bg-sage-50 border border-sage-200 text-[12px] text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 transition"
                  />
                </div>
              </div>
              {/* Severity filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-sage-400 shrink-0" />
                {(['all', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map(s => {
                  const count = s === 'all' ? logs.length : logs.filter(l => l.severity === s).length;
                  const label = s === 'all' ? 'Tous' : SEVERITY_META[s].label;
                  const meta  = s !== 'all' ? SEVERITY_META[s] : null;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                        filter === s
                          ? s === 'all' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : cn(meta?.bg, meta?.text, 'ring-1', meta?.ring)
                          : 'text-sage-500 hover:text-sage-800 hover:bg-sage-50'
                      )}
                    >
                      {label} <span className="opacity-60 ml-0.5 tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-2 pb-2 max-h-[560px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={Search} title="Aucun événement" description="Modifiez les filtres ou la recherche." />
                </div>
              ) : (
                <div className="space-y-0.5 pt-2">
                  {filtered.map(log => {
                    const sev     = SEVERITY_META[log.severity];
                    const SevIcon = sev.icon;
                    const mod     = MODULE_META[log.module] ?? MODULE_META['AI Engine'];
                    const ModIcon = mod.icon;
                    const isSel   = selected?.id === log.id;
                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                          isSel ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-sage-50'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center ring-1 shrink-0', mod.bg, mod.ring)}>
                          <ModIcon className={cn('w-3.5 h-3.5', mod.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-semibold text-sage-900 truncate">{log.action}</span>
                            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold ring-1 shrink-0', sev.bg, sev.text, sev.ring)}>
                              <SevIcon className="w-2.5 h-2.5" />
                              {sev.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-sage-500 mt-0.5 truncate">{log.details}</div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-sage-400 font-medium">
                            <span className="font-mono">{log.traceId}</span>
                            <span className="text-sage-200">·</span>
                            <span>{log.module}</span>
                            <span className="text-sage-200">·</span>
                            <span>{log.user}</span>
                            <span className="ml-auto tabular-nums">{formatRelative(log.timestamp)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Détail */}
          <div>
            {selected ? (
              <Card>
                <CardHeader
                  title="Détail de l'événement"
                  subtitle={selected.id}
                  icon={MODULE_META[selected.module]?.icon ?? FileText}
                  accent="teal"
                  action={<Badge variant={SEVERITY_META[selected.severity].variant} dot>{SEVERITY_META[selected.severity].label}</Badge>}
                />
                <div className="px-5 pb-5 space-y-3">
                  <div>
                    <div className="text-[10px] text-sage-400 uppercase tracking-wider font-bold mb-1">Action</div>
                    <div className="text-[13px] font-bold text-sage-900">{selected.action}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-sage-400 uppercase tracking-wider font-bold mb-1">Détails</div>
                    <div className="text-[12px] text-sage-600 leading-relaxed bg-sage-50 border border-sage-200 rounded-xl p-3 font-mono">
                      {selected.details}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Module',      value: selected.module },
                      { label: 'Acteur',      value: selected.user },
                      { label: 'Trace ID',    value: selected.traceId, mono: true },
                      { label: 'Horodatage', value: formatTime(selected.timestamp), mono: true },
                    ].map(spec => (
                      <div key={spec.label} className="rounded-xl bg-sage-50 border border-sage-100 p-2.5">
                        <div className="text-[10px] text-sage-400 uppercase tracking-wider font-bold">{spec.label}</div>
                        <div className={cn('text-[12px] font-semibold text-sage-900 mt-0.5 truncate', spec.mono && 'font-mono text-teal-700')}>{spec.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-[10.5px] text-brand-600 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Signature cryptographique vérifiée · SHA-256
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-5">
                  <EmptyState icon={FileText} title="Aucun événement sélectionné" description="Cliquez sur une ligne pour afficher les métadonnées complètes." />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========== TAB: COMPLIANCE ========== */}
      {tab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Chaîne de traçabilité décisionnelle"
              subtitle="Du capteur à la décision clinique — chaque étape est signée et auditable"
              icon={GitBranch}
              accent="violet"
            />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {PIPELINE_STEPS.map((step, i, arr) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="relative">
                      <div className="rounded-xl bg-sage-50 border border-sage-100 p-3 text-center">
                        <div className={cn('w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center ring-1', step.bg, step.text.replace('text-', 'ring-').replace('-700', '-200'))}>
                          <Icon className={cn('w-4 h-4', step.text)} />
                        </div>
                        <div className="text-[12px] font-bold text-sage-900">{step.label}</div>
                        <div className="text-[10px] text-sage-400 mt-0.5 font-medium">{step.sub}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-1.5 w-3 h-0.5 bg-sage-300 rounded" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-2 text-[11.5px] text-brand-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                Chaque transition est horodatée, signée (SHA-256) et conserve un trace ID unique pour audit régulateur.
              </div>
            </div>
          </Card>

          {/* Référentiels */}
          <Card>
            <CardHeader title="Référentiels appliqués" subtitle="Conformité réglementaire et sécurité" icon={ShieldCheck} accent="emerald" />
            <div className="px-5 pb-5 space-y-2">
              {[
                { code: 'IEC 62304', label: 'Cycle de vie logiciel — dispositifs médicaux', class: 'Classe B' },
                { code: 'ISO 13485', label: 'Système de management qualité',                class: 'Compatible' },
                { code: 'ISO 14971', label: 'Gestion des risques',                          class: 'AMDEC à jour' },
                { code: 'RGPD',      label: 'Protection des données personnelles',          class: 'Pseudonymisation' },
                { code: 'HL7 FHIR', label: 'Interopérabilité des données de santé',        class: 'R5' },
              ].map(r => (
                <div key={r.code} className="flex items-center justify-between p-3 rounded-xl bg-sage-50 border border-sage-100">
                  <div>
                    <div className="text-[12.5px] font-bold text-sage-900">{r.code}</div>
                    <div className="text-[10.5px] text-sage-400 font-medium">{r.label}</div>
                  </div>
                  <Badge variant="success" size="xs" dot>{r.class}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Versioning MLOps */}
          <Card>
            <CardHeader title="Versioning & MLOps" subtitle="Contrôle des modèles en production" icon={GitBranch} accent="violet" />
            <div className="px-5 pb-5 space-y-2">
              {[
                { item: 'Modèle IA principal',    value: 'risk-rf v2.3.1',   status: 'success' as const, hint: 'Déployé · 14 mai' },
                { item: 'Dataset d\'entraînement', value: 'cohorte-fr v4.1', status: 'success' as const, hint: '12 480 échantillons' },
                { item: 'Module XAI',              value: 'tree-shap v1.8',  status: 'success' as const, hint: 'Validé par 2 cliniciens' },
                { item: 'Schéma base de données', value: 'fhir-bridge v3.0', status: 'info' as const,    hint: 'Migration prévue' },
              ].map(v => (
                <div key={v.item} className="flex items-center justify-between p-3 rounded-xl bg-sage-50 border border-sage-100">
                  <div>
                    <div className="text-[12px] font-semibold text-sage-900">{v.item}</div>
                    <div className="text-[10.5px] text-sage-400 mt-0.5 font-medium">{v.hint}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-teal-700 font-bold">{v.value}</div>
                    <Badge variant={v.status} size="xs" dot>{v.status === 'success' ? 'Stable' : 'Planifié'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
