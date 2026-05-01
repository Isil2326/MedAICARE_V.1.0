import { Plus, BookOpen } from 'lucide-react';
import type { PatientEvent } from '../../types/medical';
import { EventRow } from './EventRow';

interface Props {
  events: PatientEvent[];
  onAdd: () => void;
}

export function JournalTab({ events, onAdd }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[17px] font-bold text-slate-900 tracking-tight">Mon journal</div>
          <div className="text-[12.5px] text-slate-400 font-medium">
            {events.length} évènements · 2 derniers jours
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold transition shadow-[0_2px_8px_rgba(5,150,105,0.3)]"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="bg-white rounded-2xl card-shadow divide-y divide-slate-100">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-[13px] font-medium">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            Aucun évènement enregistré. Commencez à loguer !
          </div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="p-4">
              <EventRow event={e} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
