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

const TYPE_META: Record<IoMTDevice['type'], { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  CGM:            { label: 'Capteur glycémique continu', icon: Droplet,       accent: 'from-blue-500/20 to-cyan-500/10 text-blue-300 ring-blue-500/20' },
  INSULIN_PUMP:   { label: 'Pompe à insuline',           icon: Syringe,       accent: 'from-violet-500/20 to-purple-500/10 text-violet-300 ring-violet-500/20' },
  SMARTWATCH:     { label: 'Montre connectée',           icon: Watch,         accent: 'from-teal-500/20 to-cyan-500/10 text-teal-300 ring-teal-500/20' },
  BLOODPRESSURE:  { label: 'Tensiomètre',                icon: HeartPulse,    accent: 'from-rose-500/20 to-pink-500/10 text-rose-300 ring-rose-500/20' },
  GLUCOMETER:     { label: 'Glucomètre',                 icon: FlaskConical,  accent: 'from-amber-500/20 to-orange-500/10 text-amber-300 ring-amber-500/20' },
  BPM:            { label: 'Cardiofréquencemètre',       icon: Activity,      accent: 'from-emerald-500/20 to-green-500/10 text-emerald-300 ring-emerald-500/20' },
  ACTIVITY:       { label: 'Tracker d’activité',         icon: Activity,      accent: 'from-indigo-500/20 to-blue-500/10 text-indigo-300 ring-indigo-500/20' },
};

const STATUS_META = {
  connected:    { label: 'Connecté',     variant: 'success' as const, icon: CheckCircle2 },
  syncing:      { label: 'Synchro...',   variant: 'info' as const,    icon: RefreshCw },
  disconnected: { label: 'Hors ligne',   variant: 'neutral' as const, icon: WifiOff },
  error:        { label: 'Erreur',       variant: 'danger' as const,  icon: AlertCircle },
};

function formatRelative(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function DevicesView() {
  const [devices, setDevices] = useState<IoMTDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | IoMTDevice['status']>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loaded = getIoMTDevices();
    setDevices(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return devices;
    return devices.filter(d => d.status === filter);
  }, [devices, filter]);

  const selected = useMemo(() => devices.find(d => d.id === selectedId) ?? null, [devices, selectedId]);

  const stats = useMemo(() => ({
    total: devices.length,
    connected: devices.filter(d => d.status === 'connected').length,
    syncing: devices.filter(d => d.status === 'syncing').length,
    offline: devices.filter(d => d.status === 'disconnected' || d.status === 'error').length,
    totalDataPoints: devices.reduce((s, d) => s + d.dataPoints, 0),
    lowBattery: devices.filter(d => d.battery < 30).length,
  }), [devices]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setDevices(getIoMTDevices());
      setRefreshing(false);
    }, 800);
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
    <div className="space-y-6">
      {/* === KPIs === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Dispositifs appairés"
          value={stats.total}
          icon={Cpu}
          accent="blue"
          hint={`${stats.connected} actifs`}
        />
        <StatTile
          label="Connexions actives"
          value={stats.connected}
          unit={`/ ${stats.total}`}
          icon={Wifi}
          accent="emerald"
          hint="Streaming en temps réel"
        />
        <StatTile
          label="Données ingérées"
          value={(stats.totalDataPoints / 1000).toFixed(1) + 'k'}
          icon={Server}
          accent="violet"
          hint="Échantillons aujourd'hui"
        />
        <StatTile
          label="Batteries faibles"
          value={stats.lowBattery}
          unit={`/ ${stats.total}`}
          icon={BatteryWarning}
          accent="amber"
          hint="Seuil < 30%"
          trend={stats.lowBattery > 0 ? { value: 'Action requise', direction: 'flat' } : undefined}
        />
      </div>

      {/* === Toolbar === */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'connected', 'syncing', 'disconnected'] as const).map(f => {
            const count = f === 'all' ? devices.length : devices.filter(d => d.status === f).length;
            const labels = { all: 'Tous', connected: 'Connectés', syncing: 'Synchro', disconnected: 'Hors ligne' };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                  filter === f
                    ? 'bg-white/[0.08] text-white ring-1 ring-white/15'
                    : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
                )}
              >
                {labels[f]} <span className="text-white/35 ml-1 tabular-nums">{count}</span>
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
            const typeMeta = TYPE_META[device.type];
            const statusMeta = STATUS_META[device.status];
            const TypeIcon = typeMeta.icon;
            const StatusIcon = statusMeta.icon;
            const isSel = selectedId === device.id;
            const batteryColor = device.battery > 50 ? 'text-emerald-400' : device.battery > 20 ? 'text-amber-400' : 'text-rose-400';

            return (
              <button
                key={device.id}
                onClick={() => setSelectedId(device.id)}
                className={cn(
                  'group text-left rounded-2xl border transition-all p-4',
                  'bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl',
                  isSel
                    ? 'border-teal-400/40 shadow-[0_0_0_1px_rgba(45,212,191,0.2),0_8px_32px_-8px_rgba(45,212,191,0.3)]'
                    : 'border-white/[0.08] hover:border-white/[0.16]'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ring-1', typeMeta.accent)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <Badge variant={statusMeta.variant} dot>
                    {statusMeta.label}
                  </Badge>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white tracking-tight">{device.name}</div>
                  <div className="text-[11px] text-white/45 mt-0.5">{device.manufacturer} · {typeMeta.label}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-white/55">
                    <Battery className={cn('w-3.5 h-3.5', batteryColor)} />
                    <span className={cn('font-medium tabular-nums', batteryColor)}>{device.battery}%</span>
                  </span>
                  <span className="text-white/45 flex items-center gap-1">
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
              <Card glow>
                <CardHeader
                  title={selected.name}
                  subtitle={`${selected.manufacturer} · ${selected.id}`}
                  icon={TYPE_META[selected.type].icon}
                  accent="teal"
                  action={<Badge variant={STATUS_META[selected.status].variant} dot>{STATUS_META[selected.status].label}</Badge>}
                />
                <div className="px-5 pb-5 space-y-4">
                  {/* Battery visualization */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-white/55 mb-1.5">
                      <span>Niveau de batterie</span>
                      <span className="text-white font-semibold tabular-nums">{selected.battery}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${selected.battery}%`,
                          background: selected.battery > 50
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : selected.battery > 20
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Specs grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Firmware', value: selected.firmware, icon: Cpu },
                      { label: 'Échantillons', value: selected.dataPoints.toLocaleString(), icon: Server },
                      { label: 'Type', value: TYPE_META[selected.type].label.split(' ')[0], icon: Radio },
                      { label: 'Dernière sync', value: formatRelative(selected.lastSync), icon: RefreshCw },
                    ].map(spec => {
                      const SpecIcon = spec.icon;
                      return (
                        <div key={spec.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-white/45 uppercase tracking-wider">
                            <SpecIcon className="w-3 h-3" />
                            {spec.label}
                          </div>
                          <div className="text-[13px] font-semibold text-white mt-1 truncate">{spec.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={RefreshCw} className="flex-1 justify-center">
                      Resynchroniser
                    </Button>
                    <Button variant="ghost" size="sm" icon={Stethoscope}>
                      Diagnostic
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Compliance card */}
              <Card>
                <div className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-white">Transmission sécurisée</div>
                    <div className="text-[11px] text-white/55 mt-0.5 leading-relaxed">
                      Données chiffrées AES-256 en transit, MQTT/TLS 1.3, signature device·gateway, pseudonymisation conforme RGPD.
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="p-5">
                <EmptyState
                  icon={Radio}
                  title="Sélectionnez un dispositif"
                  description="Cliquez sur une carte pour afficher le détail technique."
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
