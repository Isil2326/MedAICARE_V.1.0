/**
 * Service recommandations — open-loop, validation clinicien obligatoire.
 *
 * - Patient : `mine()` → suggestions APPROUVÉES uniquement (jamais pending).
 * - Clinicien/admin : list / generate / approve / reject / modify.
 * Toute suggestion naît `pending` côté serveur ; aucune application automatique.
 */
import { apiRequest } from '@/services/api/client';
import type {
  GenerateRequest,
  GenerateResponse,
  RecommendationPublic,
} from '@/types/api';

export interface RecommendationFilters {
  status?: string;
  patient_id?: string;
  category?: string;
  priority?: number;
  target?: string;
  horizon_min?: number;
  limit?: number;
  offset?: number;
}

function toQuery(f: RecommendationFilters): string {
  const p = new URLSearchParams();
  if (f.status) p.set('status', f.status);
  if (f.patient_id) p.set('patient_id', f.patient_id);
  if (f.category) p.set('category', f.category);
  if (f.priority != null) p.set('priority', String(f.priority));
  if (f.target) p.set('target', f.target);
  if (f.horizon_min != null) p.set('horizon_min', String(f.horizon_min));
  if (f.limit != null) p.set('limit', String(f.limit));
  if (f.offset != null) p.set('offset', String(f.offset));
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Clinicien/admin : liste filtrable. */
export async function listRecommendations(
  filters: RecommendationFilters = {},
): Promise<RecommendationPublic[]> {
  return apiRequest<RecommendationPublic[]>(
    `/recommendations${toQuery(filters)}`,
  );
}

/** Patient : ses recommandations APPROUVÉES uniquement. */
export async function listMyRecommendations(
  limit = 100,
  offset = 0,
): Promise<RecommendationPublic[]> {
  return apiRequest<RecommendationPublic[]>(
    `/recommendations/mine?limit=${limit}&offset=${offset}`,
  );
}

export async function getRecommendation(
  id: string,
): Promise<RecommendationPublic> {
  return apiRequest<RecommendationPublic>(`/recommendations/${id}`);
}

/** Clinicien/admin : génère des suggestions (toujours pending). */
export async function generateRecommendations(
  req: GenerateRequest,
): Promise<GenerateResponse> {
  return apiRequest<GenerateResponse>('/recommendations/generate', {
    method: 'POST',
    body: req,
  });
}

export async function approveRecommendation(
  id: string,
  note?: string,
): Promise<RecommendationPublic> {
  return apiRequest<RecommendationPublic>(`/recommendations/${id}/approve`, {
    method: 'POST',
    body: { note: note ?? null },
  });
}

export async function rejectRecommendation(
  id: string,
  note?: string,
): Promise<RecommendationPublic> {
  return apiRequest<RecommendationPublic>(`/recommendations/${id}/reject`, {
    method: 'POST',
    body: { note: note ?? null },
  });
}

export async function modifyRecommendation(
  id: string,
  message?: string,
  note?: string,
): Promise<RecommendationPublic> {
  return apiRequest<RecommendationPublic>(`/recommendations/${id}/modify`, {
    method: 'POST',
    body: { message: message ?? null, note: note ?? null },
  });
}
