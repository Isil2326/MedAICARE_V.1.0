import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

/**
 * Design System MediAI Care v4 — Thème Naturel (mySugr-inspired)
 * Palette : vert sauge · crème · corail · ambre
 * Ton : chaleureux, humain, empathique — pas clinique
 */

// ============= CARD =============
export function Card({
  children,
  className,
  hover = false,
  accent,
  glow,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'teal' | 'emerald';
  glow?: boolean;
}) {
  const accentBorder = {
    green:   'border-l-4 border-l-brand-400',
    amber:   'border-l-4 border-l-amber-400',
    coral:   'border-l-4 border-l-coral-400',
    blue:    'border-l-4 border-l-blue-400',
    violet:  'border-l-4 border-l-violet-400',
    teal:    'border-l-4 border-l-teal-400',
    emerald: 'border-l-4 border-l-emerald-400',
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl card-shadow',
        hover && 'transition-all duration-200 hover:shadow-[0_4px_20px_rgba(30,46,26,0.12)] hover:-translate-y-0.5 cursor-pointer',
        accent && accentBorder[accent],
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
  accent = 'green',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'sage' | 'teal' | 'emerald';
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
  };

  return (
    <div className="flex items-start justify-between p-5 pb-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', accentMap[accent])}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
        <div>
          <h3 className="text-[14px] font-semibold text-sage-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-sage-500 mt-0.5">{subtitle}</p>}
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
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; positive?: boolean };
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'green' | 'amber' | 'coral' | 'blue' | 'violet' | 'sage';
}) {
  const accentMap = {
    green:  'bg-brand-100 text-brand-600',
    amber:  'bg-amber-100 text-amber-600',
    coral:  'bg-coral-100 text-coral-500',
    blue:   'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    sage:   'bg-sage-100 text-sage-600',
  };

  const trendColor = trend?.positive
    ? 'text-brand-600 bg-brand-50'
    : trend?.direction === 'down'
    ? 'text-coral-500 bg-coral-50'
    : 'text-sage-500 bg-sage-50';

  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold text-sage-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', accentMap[accent])}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-[28px] font-bold text-sage-900 tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-[12px] text-sage-400 font-medium">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        {hint && <span className="text-[11px] text-sage-400">{hint}</span>}
        {trend && (
          <span className={cn('text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full', trendColor)}>
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
    success:  'bg-brand-50  text-brand-700  ring-1 ring-brand-200',
    warning:  'bg-amber-50  text-amber-700  ring-1 ring-amber-200',
    danger:   'bg-coral-50  text-coral-600  ring-1 ring-coral-200',
    info:     'bg-blue-50   text-blue-700   ring-1 ring-blue-200',
    neutral:  'bg-sage-50   text-sage-600   ring-1 ring-sage-200',
    critical: 'bg-red-50    text-red-700    ring-1 ring-red-300',
  };

  const dotColor = {
    success:  'bg-brand-500',
    warning:  'bg-amber-500',
    danger:   'bg-coral-500',
    info:     'bg-blue-500',
    neutral:  'bg-sage-400',
    critical: 'bg-red-500 animate-pulse',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        variants[variant]
      )}
    >
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
    primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-[0_2px_8px_rgba(58,110,40,0.3)] hover:shadow-[0_4px_14px_rgba(58,110,40,0.4)]',
    secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 ring-1 ring-brand-200',
    outline:   'bg-white hover:bg-sage-50 text-sage-700 ring-1 ring-sage-200',
    ghost:     'bg-transparent hover:bg-sage-50 text-sage-600 hover:text-sage-900',
    danger:    'bg-coral-50 hover:bg-coral-100 text-coral-600 ring-1 ring-coral-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-6 py-3 text-[14px]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
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
        <h2 className="text-[18px] font-bold text-sage-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-sage-500 mt-0.5">{subtitle}</p>}
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
      <div className="w-14 h-14 rounded-2xl bg-sage-50 ring-1 ring-sage-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-sage-400" />
      </div>
      <h4 className="text-[15px] font-semibold text-sage-700">{title}</h4>
      {description && <p className="text-[13px] text-sage-400 mt-1 max-w-sm">{description}</p>}
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
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-sage-100 border border-sage-200">
      {tabs.map(({ key, label, icon: Icon, count }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all',
            active === key
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-sage-500 hover:text-sage-800 hover:bg-white/50'
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {count !== undefined && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
              active === key ? 'bg-brand-100 text-brand-700' : 'bg-sage-200 text-sage-500'
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
  variant = 'green',
  showLabel = false,
  label,
}: {
  value: number;
  max?: number;
  variant?: 'green' | 'amber' | 'coral' | 'blue';
  showLabel?: boolean;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    green: 'bg-brand-500',
    amber: 'bg-amber-400',
    coral: 'bg-coral-400',
    blue:  'bg-blue-500',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-[11px] text-sage-500 mb-1.5">
          <span>{label ?? value}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-sage-100 overflow-hidden">
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
    success: 'bg-brand-50  border-brand-200 text-brand-800',
    warning: 'bg-amber-50  border-amber-200 text-amber-800',
    error:   'bg-coral-50  border-coral-200 text-coral-700',
    info:    'bg-blue-50   border-blue-200  text-blue-800',
  };

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3.5 rounded-2xl border', styles[type])}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{message}</div>
        {detail && <div className="text-[12px] opacity-80 mt-0.5">{detail}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-80 transition shrink-0 text-lg leading-none">×</button>
      )}
    </div>
  );
}
