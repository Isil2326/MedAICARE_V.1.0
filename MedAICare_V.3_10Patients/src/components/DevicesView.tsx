// ============================================================================
// DEVICES VIEW v4.0.0 — MediAI Care · Thème Naturel — Gateway IoMT
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Wifi, WifiOff, Activity, Battery, BatteryWarning,
  RefreshCw, AlertCircle, CheckCircle2, Cpu,
  Droplet, HeartPulse, Watch, Stethoscope, FlaskConical, Syringe,
  Radio, Server, ShieldCheck,
} from 'lucide-react';
import { getIoMTDevices } from '../engine/simulator';
import type { IoMTDevice } from '../types/medical';
import { Card, CardHeader, StatTile, Badge, Button, EmptyState } from './ui/primitives';
import { cn } from '../utils/cn';

const TYPE_META: Record<IoMTDevice['type'], { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; ring: string }> = {
  CGM:           { label: 'Capteur glycémique continu', icon: Droplet,      bg: 'bg-blue-100',    text: 'text-blue-700',   ring: 'ring-blue-200' },
  INSULIN_PUMP:  { label: 'Pompe à insuline',           icon: Syringe,      bg: 'bg-violet-100',  text: 'text-violet-700', ring: 'ring-violet-200' },
  SMARTWATCH:    { label: 'Montre connectée',           icon: Watch,        bg: 'bg-teal-100',    text: 'text-teal-700',   ring: 'ring-teal-200' },
  BLOODPRESSURE: { label: 'Tensiomètre',                icon: HeartPulse,   bg: 'bg-coral-50',    text: 'text-coral-600',  ring: 'ring-coral-200' },
  GLUCOMETER:    { label: 'Glucomètre',                 icon: FlaskConical, bg: 'bg-amber-100',   text: 'text-amber-700',  ring: 'ring-amber-200' },
  BPM:           { label: 'Cardiofréquencemètre',       icon: Activity,     bg: 'bg-brand-100',   text: 'text-brand-700',  ring: 'ring-brand-200' },
  ACTIVITY:      { label: 'Tracker d\'activité',        icon: Activity,     bg: 'bg-indigo-100',  text: 'text-indigo-700', ring: 'ring-indigo-200' },
};

const STATUS_META = {
  connected:    { label: 'Connecté',   variant: 'success' as const, icon: CheckCircle2 },
  syncing:      { label: 'Synchro...', variant: 'info' as const,    icon: RefreshCw },
  disconnected: { label: 'Hors ligne', variant: 'neutral' as const, icon: WifiOff },
  error:        { label: 'Erreur',     variant: 'danger' as const,  icon: AlertCircle },
};

function formatRelative(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function DevicesView() {
  const [devices, setDevices]   = useState<IoMTDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | IoMTDevice['status']>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loaded = getIoMTDevices();
    setDevices(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  const filtered = useMemo(() => filter === 'all' ? devices : devices.filter(d => d.status === filter), [devices, filter]);
  const selected = useMemo(() => devices.find(d => d.id === selectedId) ?? null, [devices, selectedId]);

  const stats = useMemo(() => ({
    total:            devices.length,
    connected:        devices.filter(d => d.status === 'connected').length,
    syncing:          devices.filter(d => d.status === 'syncing').length,
    offline:          devices.filter(d => d.status === 'disconnected' || d.status === 'error').length,
    totalDataPoints:  devices.reduce((s, d) => s + d.dataPoints, 0),
    lowBattery:       devices.filter(d => d.battery < 30).length,
  }), [devices]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setDevices(getIoMTDevices()); setRefreshing(false); }, 800);
  };

  if (devices.length === 0) {
    return (
      <Card>
        <div className="p-8">
          <EmptyState
            icon={WifiOff}
            title="Aucun dispositif détecté"
            description="Le gateway IoMT n'a pas trouvé de capteurs. Vérifiez l'appairage Bluetooth ou la connexion réseau."
            action={<Button variant="primary" size="sm" icon={RefreshCw} onClick={handleRefresh}>Relancer la découverte</Button>}
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0">

      {/* === KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Dispositifs appairés" value={stats.total}                              icon={Cpu}          accent="blue"   hint={`${stats.connected} actifs`} />
        <StatTile label="Connexions actives"    value={stats.connected} unit={`/ ${stats.total}`} icon={Wifi}         accent="green"  hint="Streaming en temps réel" />
        <StatTile label="Données ingérées"      value={(stats.totalDataPoints / 1000).toFixed(1) + 'k'} icon={Server} accent="violet" hint="Échantillons aujourd'hui" />
        <StatTile label="Batteries faibles"     value={stats.lowBattery} unit={`/ ${stats.total}`} icon={BatteryWarning} accent="amber" hint="Seuil < 30%" trend={stats.lowBattery > 0 ? { value: 'Action requise', direction: 'flat' } : undefined} />
      </div>

      {/* === Toolbar === */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          {(['all', 'connected', 'syncing', 'disconnected'] as const).map(f => {
            const count  = f === 'all' ? devices.length : devices.filter(d => d.status === f).length;
            const labels = { all: 'Tous', connected: 'Connectés', syncing: 'Synchro', disconnected: 'Hors ligne' };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                )}
              >
                {labels[f]} <span className="text-slate-400 ml-1 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Synchronisation…' : 'Synchroniser'}
        </Button>
      </div>

      {/* === Main grid === */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Device list */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(device => {
            const typeMeta   = TYPE_META[device.type];
            const statusMeta = STATUS_META[device.status];
            const TypeIcon   = typeMeta.icon;
            const StatusIcon = statusMeta.icon;
            const isSel      = selectedId === device.id;
            const batteryColor = device.battery > 50 ? 'text-brand-600' : device.battery > 20 ? 'text-amber-600' : 'text-coral-500';

            return (
              <button
                key={device.id}
                onClick={() => setSelectedId(device.id)}
                className={cn(
                  'group text-left rounded-2xl border transition-all p-4',
                  'bg-white hover:shadow-md',
                  isSel ? 'border-brand-300 ring-1 ring-brand-200 shadow-md' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1', typeMeta.bg, typeMeta.ring)}>
                    <TypeIcon className={cn('w-5 h-5', typeMeta.text)} />
                  </div>
                  <Badge variant={statusMeta.variant} dot>{statusMeta.label}</Badge>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-slate-900 tracking-tight">{device.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{device.manufacturer} · {typeMeta.label}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Battery className={cn('w-3.5 h-3.5', batteryColor)} />
                    <span className={cn('font-bold tabular-nums', batteryColor)}>{device.battery}%</span>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <StatusIcon className={cn('w-3 h-3', device.status === 'syncing' && 'animate-spin')} />
                    {formatRelative(device.lastSync)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <CardHeader
                  title={selected.name}
                  subtitle={`${selected.manufacturer} · ${selected.id}`}
                  icon={TYPE_META[selected.type].icon}
                  accent="teal"
                  action={<Badge variant={STATUS_META[selected.status].variant} dot>{STATUS_META[selected.status].label}</Badge>}
                />
                <div className="px-5 pb-5 space-y-4">
                  {/* Battery */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500 font-medium">Niveau de batterie</span>
                      <span className="text-slate-900 font-bold tabular-nums">{selected.battery}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${selected.battery}%`,
                          background: selected.battery > 50
                            ? 'linear-gradient(90deg, #4a8a35, #6ab041)'
                            : selected.battery > 20
                            ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                            : 'linear-gradient(90deg, #dc2626, #ef4444)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Firmware',      value: selected.firmware,                       icon: Cpu },
                      { label: 'Échantillons',  value: selected.dataPoints.toLocaleString(),    icon: Server },
                      { label: 'Type',          value: TYPE_META[selected.type].label.split(' ')[0], icon: Radio },
                      { label: 'Dernière sync', value: formatRelative(selected.lastSync),       icon: RefreshCw },
                    ].map(spec => {
                      const SpecIcon = spec.icon;
                      return (
                        <div key={spec.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <SpecIcon className="w-3 h-3" />
                            {spec.label}
                          </div>
                          <div className="text-[13px] font-bold text-slate-900 mt-1 truncate">{spec.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={RefreshCw} className="flex-1 justify-center">Resynchroniser</Button>
                    <Button variant="ghost" size="sm" icon={Stethoscope}>Diagnostic</Button>
                  </div>
                </div>
              </Card>

              {/* Compliance */}
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 ring-1 ring-brand-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-slate-900">Transmission sécurisée</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                    Données chiffrées AES-256 en transit, MQTT/TLS 1.3, signature device·gateway, pseudonymisation conforme RGPD.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <div className="p-5">
                <EmptyState icon={Radio} title="Sélectionnez un dispositif" description="Cliquez sur une carte pour afficher le détail technique." />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
