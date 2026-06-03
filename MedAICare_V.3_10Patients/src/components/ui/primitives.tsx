import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

/**
 * Design System MediAI Care v3
 * Tokens unifiés pour cohérence visuelle premium dark
 */

// ============= CARD =============
export function Card({
  children,
  className,
  hover = false,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/[0.08]',
        'bg-gradient-to-b from-white/[0.04] to-white/[0.01]',
        'backdrop-blur-xl',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-8px_rgba(0,0,0,0.6)]',
        hover && 'transition-all duration-300 hover:border-white/[0.14] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_12px_40px_-8px_rgba(0,0,0,0.7)]',
        glow && 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-teal-500/[0.04] before:to-transparent before:pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============= CARD HEADER =============
export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  accent = 'teal',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  accent?: 'teal' | 'blue' | 'amber' | 'rose' | 'violet' | 'emerald';
}) {
  const accentMap = {
    teal: 'from-teal-500/20 to-cyan-500/10 text-teal-300 ring-teal-500/20',
    blue: 'from-blue-500/20 to-indigo-500/10 text-blue-300 ring-blue-500/20',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-300 ring-amber-500/20',
    rose: 'from-rose-500/20 to-pink-500/10 text-rose-300 ring-rose-500/20',
    violet: 'from-violet-500/20 to-purple-500/10 text-violet-300 ring-violet-500/20',
    emerald: 'from-emerald-500/20 to-green-500/10 text-emerald-300 ring-emerald-500/20',
  };

  return (
    <div className="flex items-start justify-between p-5 pb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br ring-1',
              accentMap[accent]
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h3 className="text-[14px] font-semibold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11.5px] text-white/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============= STAT TILE =============
export function StatTile({
  label,
  value,
  unit,
  trend,
  hint,
  icon: Icon,
  accent = 'teal',
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; positive?: boolean };
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'teal' | 'blue' | 'amber' | 'rose' | 'violet' | 'emerald';
}) {
  const accentMap = {
    teal: 'from-teal-500/15 to-cyan-500/5 text-teal-300',
    blue: 'from-blue-500/15 to-indigo-500/5 text-blue-300',
    amber: 'from-amber-500/15 to-orange-500/5 text-amber-300',
    rose: 'from-rose-500/15 to-pink-500/5 text-rose-300',
    violet: 'from-violet-500/15 to-purple-500/5 text-violet-300',
    emerald: 'from-emerald-500/15 to-green-500/5 text-emerald-300',
  };

  const trendColor = trend?.positive
    ? 'text-emerald-400 bg-emerald-500/10'
    : trend?.direction === 'down'
    ? 'text-rose-400 bg-rose-500/10'
    : 'text-white/60 bg-white/5';

  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-white/55 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br', accentMap[accent])}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold text-white tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-[12px] text-white/45 font-medium">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-2.5">
        {hint && <span className="text-[11px] text-white/45">{hint}</span>}
        {trend && (
          <span className={cn('text-[10.5px] font-semibold px-1.5 py-0.5 rounded', trendColor)}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

// ============= BADGE =============
export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
}: {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'critical';
  size?: 'xs' | 'sm';
  dot?: boolean;
}) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-300 ring-rose-500/20',
    info: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
    neutral: 'bg-white/5 text-white/70 ring-white/10',
    critical: 'bg-red-500/15 text-red-300 ring-red-500/30',
  };

  const dotColor = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    neutral: 'bg-white/40',
    critical: 'bg-red-400 animate-pulse',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full ring-1 font-medium',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        variants[variant]
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor[variant])} />}
      {children}
    </span>
  );
}

// ============= BUTTON =============
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  className,
  disabled = false,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_24px_-8px_rgba(20,184,166,0.5)] hover:from-teal-400 hover:to-teal-500',
    secondary: 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]',
    ghost: 'text-white/70 hover:bg-white/5 hover:text-white',
    danger: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/25',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-lg transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

// ============= SECTION TITLE =============
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[18px] font-semibold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-white/55 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============= EMPTY STATE =============
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white/40" />
      </div>
      <h4 className="text-[14px] font-semibold text-white/80">{title}</h4>
      {description && <p className="text-[12px] text-white/45 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============= TAB BAR =============
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; icon?: React.ComponentType<{ className?: string }>; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      {tabs.map(({ key, label, icon: Icon, count }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all',
            active === key
              ? 'bg-white/[0.08] text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]'
              : 'text-white/55 hover:text-white/85'
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {count !== undefined && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
              active === key ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50'
            )}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============= PROGRESS BAR =============
export function ProgressBar({
  value,
  max = 100,
  variant = 'teal',
  showLabel = false,
}: {
  value: number;
  max?: number;
  variant?: 'teal' | 'amber' | 'rose' | 'emerald' | 'blue';
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    teal: 'from-teal-400 to-cyan-500',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-400 to-pink-500',
    emerald: 'from-emerald-400 to-green-500',
    blue: 'from-blue-400 to-indigo-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-[10.5px] text-white/55 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', colors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
