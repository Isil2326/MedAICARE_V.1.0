// ============================================================================
// V3-Dark Theme · Salle de Contrôle clinicien · MediAI Care
// Palette + helpers partagés entre tous les composants clinician/*
// ============================================================================

export const BG        = '#07090F';
export const SURFACE   = '#0E1118';
export const SURFACE_2 = '#141823';
export const BORDER    = 'rgba(255,255,255,0.07)';
export const BORDER_2  = 'rgba(255,255,255,0.12)';
export const AMBER     = '#FFAB00';
export const AMBER_DIM = 'rgba(255,171,0,0.12)';
export const CYAN      = '#00E5FF';
export const VIOLET    = '#BF5AF2';
export const GREEN     = '#30D158';
export const RED       = '#EF4444';
export const ORANGE    = '#F59E0B';
export const MUTED     = 'rgba(255,255,255,0.40)';
export const MUTED_2   = 'rgba(255,255,255,0.55)';
export const BRIGHT    = '#FFFFFF';

export const RISK_COLOR: Record<string, string> = {
  CRITICAL: RED,
  HIGH:     AMBER,
  MODERATE: ORANGE,
  LOW:      GREEN,
};

export const RISK_LABEL: Record<string, string> = {
  CRITICAL: 'Critique',
  HIGH:     'Élevé',
  MODERATE: 'Modéré',
  LOW:      'Faible',
};

export const RISK_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3,
};

export function initials(name: string): string {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2);
}

export function formatCountdown(ms: number): { mm: string; ss: string } {
  if (ms <= 0) return { mm: '00', ss: '00' };
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return { mm, ss };
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1)  return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return `il y a ${h}h${min % 60 ? min % 60 + 'm' : ''}`;
}
