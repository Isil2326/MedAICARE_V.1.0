import { cn } from '../../utils/cn';
import type { PatientEvent } from '../../types/medical';
import { EVENT_ICONS, formatDateRelative, formatTime } from './formatters';

interface Props {
  event: PatientEvent;
  compact?: boolean;
}

export function EventRow({ event, compact = false }: Props) {
  const config = {
    meal: { bg: 'bg-brand-50', text: 'text-brand-700' },
    insulin: { bg: 'bg-coral-50', text: 'text-coral-600' },
    activity: { bg: 'bg-amber-50', text: 'text-amber-700' },
    note: { bg: 'bg-blue-50', text: 'text-blue-700' },
    glucose: { bg: 'bg-slate-100', text: 'text-slate-600' },
  };
  const c = config[event.type];
  const EventIcon = EVENT_ICONS[event.type];

  let title = '';
  let subtitle = '';
  if (event.type === 'meal') {
    title = event.mealName || 'Repas';
    subtitle = `${event.carbs}g de glucides`;
  } else if (event.type === 'insulin') {
    title = `Insuline ${event.insulinType === 'basal' ? 'basale' : 'rapide'}`;
    subtitle = `${event.insulinUnits} UI`;
  } else if (event.type === 'activity') {
    title = event.activityType || 'Activité';
    const intensityLabel =
      event.intensity === 'low' ? 'Faible' : event.intensity === 'high' ? 'Intense' : 'Modérée';
    subtitle = `${event.durationMin} min · ${intensityLabel}`;
  } else if (event.type === 'note') {
    title = 'Note personnelle';
    subtitle = event.noteText || '';
  } else if (event.type === 'glucose') {
    title = 'Glycémie manuelle';
    subtitle = `${event.glucoseValue} mg/dL`;
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
        <EventIcon className={cn('w-4.5 h-4.5', c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-800 truncate">{title}</div>
        <div className="text-[11.5px] text-slate-400 truncate font-medium">{subtitle}</div>
      </div>
      <div className="text-[11px] text-slate-300 font-medium shrink-0">
        {compact ? formatTime(event.timestamp) : formatDateRelative(event.timestamp)}
      </div>
    </div>
  );
}
