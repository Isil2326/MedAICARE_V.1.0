/**
 * Service XAI — explication locale et globale.
 *
 * XAI = pondération du modèle, JAMAIS une causalité clinique. L'app affiche
 * fidèlement `xai_reliability_status`, `xai_warnings` et `semantic_limitations`.
 */
import { apiRequest } from '@/services/api/client';
import type {
  GlobalExplanation,
  LocalExplainRequest,
  LocalExplanation,
  TargetName,
} from '@/types/api';

export async function explainLocal(
  req: LocalExplainRequest,
): Promise<LocalExplanation> {
  return apiRequest<LocalExplanation>('/xai/explain', {
    method: 'POST',
    body: req,
  });
}

export async function getGlobal(
  target: TargetName,
  horizonMin: number,
  regenerate = false,
): Promise<GlobalExplanation> {
  const params = new URLSearchParams({
    target,
    horizon_min: String(horizonMin),
  });
  if (regenerate) params.set('regenerate', 'true');
  return apiRequest<GlobalExplanation>(`/xai/global?${params.toString()}`);
}
