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
  INFO:     { label: 'Info',     variant: 'info' as const,     icon: Info,           color: 'text-blue-300' },
  WARNING:  { label: 'Warning',  variant: 'warning' as const,  icon: AlertTriangle,  color: 'text-amber-300' },
  ERROR:    { label: 'Error',    variant: 'danger' as const,   icon: XCircle,        color: 'text-rose-300' },
  CRITICAL: { label: 'Critique', variant: 'critical' as const, icon: AlertCircle,    color: 'text-red-300' },
};

const MODULE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  'AI Engine':     { icon: Brain,      accent: 'from-violet-500/20 to-purple-500/10 text-violet-300 ring-violet-500/20' },
  'XAI Module':    { icon: FileCheck,  accent: 'from-amber-500/20 to-orange-500/10 text-amber-300 ring-amber-500/20' },
  'IoMT Gateway':  { icon: Wifi,       accent: 'from-blue-500/20 to-cyan-500/10 text-blue-300 ring-blue-500/20' },
  'Alert Engine':  { icon: Bell,       accent: 'from-rose-500/20 to-pink-500/10 text-rose-300 ring-rose-500/20' },
  'Auth':          { icon: KeyRound,   accent: 'from-emerald-500/20 to-green-500/10 text-emerald-300 ring-emerald-500/20' },
  'MLOps':         { icon: GitBranch,  accent: 'from-indigo-500/20 to-blue-500/10 text-indigo-300 ring-indigo-500/20' },
  'Reports':       { icon: FileText,   accent: 'from-teal-500/20 to-cyan-500/10 text-teal-300 ring-teal-500/20' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  const logs = useMemo(() => generateAuditLogs(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [tab, setTab] = useState<Tab>('logs');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.traceId.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || log.severity === filter;
      return matchSearch && matchFilter;
    });
  }, [logs, search, filter]);

  const stats = useMemo(() => ({
    total: logs.length,
    critical: logs.filter(l => l.severity === 'CRITICAL').length,
    errors: logs.filter(l => l.severity === 'ERROR').length,
    warnings: logs.filter(l => l.severity === 'WARNING').length,
  }), [logs]);

  return (
    <div className="space-y-6">
      {/* === KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Événements (24h)"
          value={stats.total}
          icon={Database}
          accent="blue"
          hint="Tracés et signés"
        />
        <StatTile
          label="Critiques"
          value={stats.critical}
          icon={AlertCircle}
          accent="rose"
          hint={stats.critical > 0 ? 'Investigation requise' : 'RAS'}
        />
        <StatTile
          label="Erreurs"
          value={stats.errors}
          icon={XCircle}
          accent="amber"
          hint="Échecs techniques"
        />
        <StatTile
          label="Conformité"
          value="100%"
          icon={ShieldCheck}
          accent="emerald"
          hint="IEC 62304 · ISO 13485"
        />
      </div>

      {/* === Tabs === */}
      <div className="flex items-center justify-between">
        <TabBar<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'logs', label: 'Journal d’événements', icon: FileText, count: logs.length },
            { key: 'compliance', label: 'Traçabilité & Conformité', icon: ShieldCheck },
          ]}
        />
        {tab === 'logs' && (
          <Button variant="secondary" size="sm" icon={Download}>Exporter (CSV)</Button>
        )}
      </div>

      {/* ============ TAB LOGS ============ */}
      {tab === 'logs' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* List */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Événements en temps réel"
              subtitle="Trace immuable signée · horodatage UTC"
              icon={Clock}
              accent="blue"
              action={
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher trace, user…"
                    className="pl-8 pr-3 py-1.5 w-52 rounded-lg bg-white/5 border border-white/10 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                  />
                </div>
              }
            />

            {/* Severity filter */}
            <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-white/40" />
              {(['all', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map(s => {
                const count = s === 'all' ? logs.length : logs.filter(l => l.severity === s).length;
                const label = s === 'all' ? 'Tous' : SEVERITY_META[s].label;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                      filter === s
                        ? 'bg-white/10 text-white ring-1 ring-white/15'
                        : 'text-white/55 hover:text-white/85 hover:bg-white/5'
                    )}
                  >
                    {label} <span className="text-white/40 ml-0.5 tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-2 pb-2 max-h-[560px] overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState icon={Search} title="Aucun événement" description="Modifiez les filtres ou la recherche" />
              ) : (
                <div className="space-y-1">
                  {filtered.map(log => {
                    const sev = SEVERITY_META[log.severity];
                    const SevIcon = sev.icon;
                    const mod = MODULE_META[log.module] ?? MODULE_META['AI Engine'];
                    const ModIcon = mod.icon;
                    const isSel = selected?.id === log.id;

                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelected(log)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                          isSel
                            ? 'bg-white/[0.06] ring-1 ring-white/15'
                            : 'hover:bg-white/[0.03]'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ring-1 shrink-0', mod.accent)}>
                          <ModIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-medium text-white truncate">{log.action}</span>
                            <Badge variant={sev.variant} size="xs">
                              <SevIcon className="w-2.5 h-2.5" />
                              {sev.label}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5 truncate">{log.details}</div>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40">
                            <span className="font-mono">{log.traceId}</span>
                            <span>·</span>
                            <span>{log.module}</span>
                            <span>·</span>
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

          {/* Detail */}
          <div>
            {selected ? (
              <Card glow>
                <CardHeader
                  title="Détail de l'événement"
                  subtitle={selected.id}
                  icon={MODULE_META[selected.module]?.icon ?? FileText}
                  accent="teal"
                  action={<Badge variant={SEVERITY_META[selected.severity].variant} dot>{SEVERITY_META[selected.severity].label}</Badge>}
                />
                <div className="px-5 pb-5 space-y-3">
                  <div>
                    <div className="text-[10px] text-white/45 uppercase tracking-wider mb-1">Action</div>
                    <div className="text-[13px] font-medium text-white">{selected.action}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/45 uppercase tracking-wider mb-1">Détails</div>
                    <div className="text-[12px] text-white/75 leading-relaxed bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 font-mono">
                      {selected.details}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                      <div className="text-[10px] text-white/45 uppercase tracking-wider">Module</div>
                      <div className="text-[12px] font-semibold text-white mt-0.5">{selected.module}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                      <div className="text-[10px] text-white/45 uppercase tracking-wider">Acteur</div>
                      <div className="text-[12px] font-semibold text-white mt-0.5">{selected.user}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                      <div className="text-[10px] text-white/45 uppercase tracking-wider">Trace ID</div>
                      <div className="text-[11px] font-mono text-teal-300 mt-0.5">{selected.traceId}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                      <div className="text-[10px] text-white/45 uppercase tracking-wider">Horodatage</div>
                      <div className="text-[11px] font-mono text-white mt-0.5">{formatTime(selected.timestamp)}</div>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-[10.5px] text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    Signature cryptographique vérifiée · SHA-256
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-5">
                  <EmptyState
                    icon={FileText}
                    title="Aucun événement sélectionné"
                    description="Cliquez sur une ligne pour afficher les métadonnées complètes."
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB COMPLIANCE ============ */}
      {tab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline traceability */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Chaîne de traçabilité décisionnelle"
              subtitle="Du capteur à la décision clinique — chaque étape est signée et auditable"
              icon={GitBranch}
              accent="violet"
            />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {[
                  { label: 'Capteur IoMT', sub: 'Donnée brute', icon: Wifi, accent: 'blue' as const },
                  { label: 'Gateway', sub: 'Validation + chiffrement', icon: ShieldCheck, accent: 'emerald' as const },
                  { label: 'Inférence IA', sub: 'Modèle versionné', icon: Brain, accent: 'violet' as const },
                  { label: 'XAI', sub: 'Explication SHAP', icon: FileCheck, accent: 'amber' as const },
                  { label: 'Décision', sub: 'Recommandation tracée', icon: FileText, accent: 'teal' as const },
                ].map((step, i, arr) => {
                  const Icon = step.icon;
                  const accentMap = {
                    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-300 ring-blue-500/20',
                    emerald: 'from-emerald-500/20 to-green-500/10 text-emerald-300 ring-emerald-500/20',
                    violet: 'from-violet-500/20 to-purple-500/10 text-violet-300 ring-violet-500/20',
                    amber: 'from-amber-500/20 to-orange-500/10 text-amber-300 ring-amber-500/20',
                    teal: 'from-teal-500/20 to-cyan-500/10 text-teal-300 ring-teal-500/20',
                  };
                  return (
                    <div key={step.label} className="relative">
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                        <div className={cn('w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ring-1', accentMap[step.accent])}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-[12px] font-semibold text-white">{step.label}</div>
                        <div className="text-[10px] text-white/45 mt-0.5">{step.sub}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-1 w-2 h-px bg-white/15" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15] flex items-center gap-2 text-[11.5px] text-emerald-200/90">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Chaque transition est horodatée, signée (SHA-256) et conserve un trace ID unique pour audit régulateur.
              </div>
            </div>
          </Card>

          {/* Compliance frameworks */}
          <Card>
            <CardHeader title="Référentiels appliqués" subtitle="Conformité réglementaire et sécurité" icon={ShieldCheck} accent="emerald" />
            <div className="px-5 pb-5 space-y-2">
              {[
                { code: 'IEC 62304', label: 'Cycle de vie logiciel — dispositifs médicaux', class: 'Classe B' },
                { code: 'ISO 13485', label: 'Système de management qualité', class: 'Compatible' },
                { code: 'ISO 14971', label: 'Gestion des risques', class: 'AMDEC à jour' },
                { code: 'RGPD', label: 'Protection des données personnelles', class: 'Pseudonymisation' },
                { code: 'HL7 FHIR', label: 'Interopérabilité des données de santé', class: 'R5' },
              ].map(r => (
                <div key={r.code} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">{r.code}</div>
                    <div className="text-[10.5px] text-white/50">{r.label}</div>
                  </div>
                  <Badge variant="success" size="xs" dot>{r.class}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Versioning */}
          <Card>
            <CardHeader title="Versioning & MLOps" subtitle="Contrôle des modèles en production" icon={GitBranch} accent="violet" />
            <div className="px-5 pb-5 space-y-2.5">
              {[
                { item: 'Modèle IA principal', value: 'risk-rf v2.3.1', status: 'success' as const, hint: 'Déployé · 14 mai' },
                { item: 'Dataset d’entraînement', value: 'cohorte-fr v4.1', status: 'success' as const, hint: '12 480 échantillons' },
                { item: 'Module XAI', value: 'tree-shap v1.8', status: 'success' as const, hint: 'Validé par 2 cliniciens' },
                { item: 'Schéma base de données', value: 'fhir-bridge v3.0', status: 'info' as const, hint: 'Migration prévue' },
              ].map(v => (
                <div key={v.item} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-[12px] font-medium text-white">{v.item}</div>
                    <div className="text-[10.5px] text-white/45 mt-0.5">{v.hint}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-teal-300">{v.value}</div>
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
