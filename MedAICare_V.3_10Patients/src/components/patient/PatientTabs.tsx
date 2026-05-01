import { Activity, BookOpen, BarChart3, FlaskConical, Stethoscope } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Tab } from './formatters';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

export function PatientTabs({ active, onChange }: Props) {
  const tabs: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'today', label: "Aujourd'hui", Icon: Activity },
    { key: 'journal', label: 'Journal', Icon: BookOpen },
    { key: 'trends', label: 'Tendances', Icon: BarChart3 },
    { key: 'bilans', label: 'Mes bilans', Icon: FlaskConical },
    { key: 'treatment', label: 'Traitement', Icon: Stethoscope },
  ];
  return (
    <div className="flex items-center gap-0 border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all whitespace-nowrap border-b-2 -mb-px relative',
              isActive
                ? 'text-brand-700 border-brand-600'
                : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300',
            )}
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
