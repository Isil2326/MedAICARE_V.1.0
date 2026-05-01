import { cn } from '../../utils/cn';

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color: 'emerald' | 'coral' | 'amber' | 'sky';
}

export function QuickAction({ icon: Icon, label, onClick, color }: Props) {
  const iconClass = {
    emerald: 'icon-vivid-emerald',
    coral: 'icon-vivid-coral',
    amber: 'icon-vivid-amber',
    sky: 'icon-vivid-sky',
  }[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl transition-all hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-100 hover:border-transparent"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconClass)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
    </button>
  );
}
