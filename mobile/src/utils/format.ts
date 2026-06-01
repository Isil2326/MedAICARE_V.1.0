/** Utilitaires de formatage (affichage uniquement, aucune logique métier). */

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatGlucose(mgdl: number | null | undefined): string {
  if (mgdl == null || Number.isNaN(mgdl)) return '—';
  return `${Math.round(mgdl)} mg/dL`;
}

/** Probabilité [0,1] → pourcentage, ou « non calculable » si null. */
export function formatProbability(p: number | null | undefined): string {
  if (p == null || Number.isNaN(p)) return 'non calculable';
  return `${(p * 100).toFixed(1)} %`;
}

export function ageFromBirth(birth: string | null | undefined): string {
  if (!birth) return '—';
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${years} ans`;
}

/** ISO du début de fenêtre (jours en arrière), pour les requêtes timeseries. */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}
