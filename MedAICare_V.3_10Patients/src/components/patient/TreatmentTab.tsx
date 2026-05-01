import { Target, Pill, Calendar, Clock, Stethoscope } from 'lucide-react';
import { formatDateRelative } from './formatters';

interface CarePlan {
  glucoseTargetMin: number;
  glucoseTargetMax: number;
  hba1cTarget: number;
  insulinBasal: number;
  insulinRatioCarbs: number;
  insulinSensitivity: number;
  updatedAt: number;
  updatedBy: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  active: boolean;
  prescribedBy: string;
}

interface Props {
  carePlan: CarePlan;
  medications: Medication[];
}

function ObjectiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-slate-500 font-medium">{label}</span>
      <span className="text-[13px] text-slate-900 font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function TreatmentTab({ carePlan, medications }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
            <Target className="w-4.5 h-4.5 text-brand-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Mes objectifs</div>
            <div className="text-[12px] text-slate-400">Définis avec votre médecin</div>
          </div>
        </div>
        <div className="space-y-1.5 divide-y divide-slate-100">
          <ObjectiveRow
            label="Glycémie cible"
            value={`${carePlan.glucoseTargetMin}–${carePlan.glucoseTargetMax} mg/dL`}
          />
          <ObjectiveRow label="HbA1c cible" value={`< ${carePlan.hba1cTarget}%`} />
          <ObjectiveRow label="Insuline basale" value={`${carePlan.insulinBasal} UI/jour`} />
          <ObjectiveRow label="Ratio glucides" value={`1 UI / ${carePlan.insulinRatioCarbs} g`} />
          <ObjectiveRow
            label="Sensibilité insuline"
            value={`1 UI ↓ ${carePlan.insulinSensitivity} mg/dL`}
          />
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          Mis à jour {formatDateRelative(carePlan.updatedAt)} · {carePlan.updatedBy}
        </div>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Pill className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Mes médicaments</div>
            <div className="text-[12px] text-slate-400">
              {medications.filter((m) => m.active).length} traitements actifs
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {medications.map((m) => (
            <div key={m.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-slate-900">{m.name}</div>
                  <div className="text-[12px] text-slate-400 mt-0.5">
                    {m.dosage} · {m.frequency}
                  </div>
                </div>
                {m.active && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold shrink-0">
                    Actif
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3 h-3" />
                {m.prescribedBy}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <div className="text-[12px] font-bold text-brand-600 uppercase tracking-wide mb-2 flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5" /> Note de votre médecin
        </div>
        <div className="text-[14px] text-slate-700 leading-relaxed italic">
          &quot;{carePlan.notes}&quot;
        </div>
      </div>
    </div>
  );
}
