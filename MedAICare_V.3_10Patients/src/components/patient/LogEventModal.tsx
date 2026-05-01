import { useState } from 'react';
import { Utensils, Syringe, Footprints, PenLine, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PatientEvent } from '../../types/medical';

type EventType = 'meal' | 'insulin' | 'activity' | 'note';

interface Props {
  type: EventType;
  onClose: () => void;
  onSubmit: (data: Partial<PatientEvent>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] text-slate-500 font-bold uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function LogEventModal({ type, onClose, onSubmit }: Props) {
  const [carbs, setCarbs] = useState(50);
  const [mealName, setMealName] = useState('Collation');
  const [insulinUnits, setInsulinUnits] = useState(5);
  const [insulinType, setInsulinType] = useState<'rapid' | 'basal'>('rapid');
  const [activityType, setActivityType] = useState('Marche');
  const [durationMin, setDurationMin] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [noteText, setNoteText] = useState('');

  const titles: Record<
    EventType,
    { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    meal: { label: 'Enregistrer un repas', Icon: Utensils, color: 'text-brand-600 bg-brand-100' },
    insulin: { label: "Dose d'insuline", Icon: Syringe, color: 'text-coral-600 bg-coral-50' },
    activity: { label: 'Activité physique', Icon: Footprints, color: 'text-amber-700 bg-amber-50' },
    note: { label: 'Ajouter une note', Icon: PenLine, color: 'text-blue-700 bg-blue-50' },
  };

  const handleSubmit = () => {
    if (type === 'meal') onSubmit({ mealName, carbs });
    else if (type === 'insulin') onSubmit({ insulinUnits, insulinType });
    else if (type === 'activity') onSubmit({ activityType, durationMin, intensity });
    else onSubmit({ noteText });
  };

  const inputCls =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:ring-2 focus:ring-brand-400/25 focus:border-brand-300 transition';
  const selectCls = inputCls;

  const { label: modalTitle, Icon: ModalIcon, color: modalColor } = titles[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl card-shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', modalColor)}>
            <ModalIcon className="w-5 h-5" />
          </div>
          <div className="text-[17px] font-bold text-slate-900 tracking-tight">{modalTitle}</div>
        </div>

        {type === 'meal' && (
          <div className="space-y-3">
            <Field label="Repas">
              <select value={mealName} onChange={(e) => setMealName(e.target.value)} className={selectCls}>
                <option>Petit-déjeuner</option>
                <option>Déjeuner</option>
                <option>Dîner</option>
                <option>Collation</option>
              </select>
            </Field>
            <Field label="Glucides (grammes)">
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {type === 'insulin' && (
          <div className="space-y-3">
            <Field label="Type d'insuline">
              <div className="flex gap-2">
                {(['rapid', 'basal'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setInsulinType(t)}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-[13px] font-bold transition',
                      insulinType === t
                        ? 'bg-coral-100 text-coral-700 ring-1 ring-coral-300'
                        : 'bg-slate-50 text-slate-500 border border-slate-200',
                    )}
                  >
                    {t === 'rapid' ? 'Rapide' : 'Basale'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Unités (UI)">
              <input
                type="number"
                value={insulinUnits}
                onChange={(e) => setInsulinUnits(Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {type === 'activity' && (
          <div className="space-y-3">
            <Field label="Type d'activité">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className={selectCls}
              >
                <option>Marche</option>
                <option>Vélo</option>
                <option>Course</option>
                <option>Natation</option>
                <option>Musculation</option>
                <option>Yoga</option>
              </select>
            </Field>
            <Field label="Durée (minutes)">
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Intensité">
              <div className="flex gap-2">
                {(['low', 'moderate', 'high'] as const).map((i) => (
                  <button
                    key={i}
                    onClick={() => setIntensity(i)}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-[13px] font-bold transition',
                      intensity === i
                        ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                        : 'bg-slate-50 text-slate-500 border border-slate-200',
                    )}
                  >
                    {i === 'low' ? 'Faible' : i === 'moderate' ? 'Modérée' : 'Intense'}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {type === 'note' && (
          <Field label="Votre note">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className={cn(inputCls, 'resize-none')}
              placeholder="Symptôme, sensation, contexte…"
            />
          </Field>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[14px] font-bold border border-slate-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-bold transition shadow-[0_2px_8px_rgba(5,150,105,0.3)] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
