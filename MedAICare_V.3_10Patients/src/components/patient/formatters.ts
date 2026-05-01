import { Utensils, Syringe, Footprints, PenLine, Droplets } from 'lucide-react';

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export const EVENT_ICONS = {
  meal: Utensils,
  insulin: Syringe,
  activity: Footprints,
  note: PenLine,
  glucose: Droplets,
};

export type Tab = 'today' | 'journal' | 'trends' | 'treatment' | 'bilans';
