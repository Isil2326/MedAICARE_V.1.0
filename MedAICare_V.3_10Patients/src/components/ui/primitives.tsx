import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

/**
 * Design System MediAI Care v5 — Premium Healthtech
 * Direction: minimaliste · lumineux · sobre · rassurant · précis
 * Couleurs: brand-green (accent) · slate (structure) · white (surfaces)
 */

// ============= CARD =============
export function Card({
  children,
  className,
  hover = false,
  accent,
  noPad = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'teal' | 'emerald' | 'slate';
  noPad?: boolean;
  glow?: boolean;
}) {
  const accentBorder = {
    green:   'border-l-[3px] border-l-brand-500',
    amber:   'border-l-[3px] border-l-amber-400',
    coral:   'border-l-[3px] border-l-coral-400',
    blue:    'border-l-[3px] border-l-blue-500',
    violet:  'border-l-[3px] border-l-violet-500',
    teal:    'border-l-[3px] border-l-teal-400',
    emerald: 'border-l-[3px] border-l-emerald-500',
    slate:   'border-l-[3px] border-l-slate-400',
  };

  return (
    <div className={cn(
      'relative bg-white rounded-2xl card-shadow border border-slate-100/80',
      !noPad && 'p-5',
      hover && 'transition-all duration-200 hover:shadow-[0_8px_32px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 cursor-pointer',
      accent && accentBorder[accent],
      className
    )}>
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
  accent = 'green',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'sage' | 'teal' | 'emerald' | 'slate';
}) {
  const accentMap = {
    green:   'bg-brand-100 text-brand-700',
    amber:   'bg-amber-100 text-amber-700',
    coral:   'bg-coral-100 text-coral-600',
    blue:    'bg-blue-100 text-blue-700',
    violet:  'bg-violet-100 text-violet-700',
    sage:    'bg-sage-100 text-sage-700',
    teal:    'bg-teal-100 text-teal-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate:   'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex items-start justify-between pb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', accentMap[accent])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
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
  accent = 'green',
  onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; positive?: boolean };
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'sage' | 'slate';
  onClick?: () => void;
}) {
  const accentMap = {
    green:  'bg-brand-50 text-brand-600',
    amber:  'bg-amber-50 text-amber-600',
    coral:  'bg-coral-50 text-coral-500',
    blue:   'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    sage:   'bg-sage-50 text-sage-600',
    slate:  'bg-slate-100 text-slate-500',
  };

  const trendColor = trend
    ? trend.positive
      ? 'text-brand-600 bg-brand-50'
      : trend.direction === 'flat'
      ? 'text-slate-500 bg-slate-100'
      : 'text-coral-500 bg-coral-50'
    : '';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl card-shadow border border-slate-100/80 p-5',
        onClick && 'cursor-pointer transition-all hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', accentMap[accent])}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-bold text-slate-900 tracking-tight tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[12px] text-slate-400 font-medium">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        {hint && <span className="text-[11px] text-slate-400 font-medium">{hint}</span>}
        {trend && (
          <span className={cn('text-[10.5px] font-bold px-1.5 py-0.5 rounded-full', trendColor)}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
          </span>
        )}
      </div>
    </div>
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
    success:  'bg-brand-50  text-brand-700  border border-brand-200/60',
    warning:  'bg-amber-50  text-amber-700  border border-amber-200/60',
    danger:   'bg-coral-50  text-coral-600  border border-coral-200/60',
    info:     'bg-blue-50   text-blue-700   border border-blue-200/60',
    neutral:  'bg-slate-100 text-slate-600  border border-slate-200/60',
    critical: 'bg-red-50    text-red-700    border border-red-200/60',
  };

  const dotColor = {
    success:  'bg-brand-500',
    warning:  'bg-amber-500',
    danger:   'bg-coral-500',
    info:     'bg-blue-500',
    neutral:  'bg-slate-400',
    critical: 'bg-red-500 animate-pulse',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold',
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
      variants[variant]
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[variant])} />}
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const variants = {
    primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)]',
    secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200',
    outline:   'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
    ghost:     'bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900',
    danger:    'bg-coral-50 hover:bg-coral-100 text-coral-600 border border-coral-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px] rounded-lg',
    md: 'px-4 py-2 text-[13px] rounded-xl',
    lg: 'px-5 py-2.5 text-[14px] rounded-xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 font-semibold transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
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
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
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
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h4 className="text-[14px] font-semibold text-slate-700">{title}</h4>
      {description && <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm font-medium">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
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
    <div className="flex items-center gap-0 border-b border-slate-200">
      {tabs.map(({ key, label, icon: Icon, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all relative border-b-2 -mb-px',
              isActive
                ? 'text-brand-700 border-brand-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
            {count !== undefined && (
              <span className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============= PROGRESS BAR =============
export function ProgressBar({
  value,
  max = 100,
  variant = 'green',
  showLabel = false,
  label,
}: {
  value: number;
  max?: number;
  variant?: 'green' | 'amber' | 'coral' | 'blue' | 'slate';
  showLabel?: boolean;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    green: 'bg-brand-500',
    amber: 'bg-amber-400',
    coral: 'bg-coral-400',
    blue:  'bg-blue-500',
    slate: 'bg-slate-400',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
          <span>{label ?? value}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', colors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============= ALERT BANNER =============
export function AlertBanner({
  type,
  message,
  detail,
  onDismiss,
}: {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  detail?: string;
  onDismiss?: () => void;
}) {
  const styles = {
    success: 'bg-brand-50  border-brand-200  text-brand-800',
    warning: 'bg-amber-50  border-amber-200  text-amber-800',
    error:   'bg-coral-50  border-coral-200  text-coral-700',
    info:    'bg-blue-50   border-blue-200   text-blue-800',
  };

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3.5 rounded-xl border', styles[type])}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{message}</div>
        {detail && <div className="text-[12px] opacity-75 mt-0.5 font-medium">{detail}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-40 hover:opacity-70 transition shrink-0 text-lg leading-none">×</button>
      )}
    </div>
  );
}

// ============= DIVIDER =============
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-slate-100 my-4" />;
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}
