/**
 * Service ML — /ml/predict.
 *
 * OPEN-LOOP STRICT : renvoie une PROBABILITÉ uniquement. L'application n'effectue
 * AUCUN calcul de risque local ; la probabilité, le modèle et l'avertissement
 * open-loop proviennent intégralement du backend.
 */
import { apiRequest } from '@/services/api/client';
import type { PredictRequest, PredictResponse } from '@/types/api';

export async function predict(
  req: PredictRequest,
): Promise<PredictResponse> {
  return apiRequest<PredictResponse>('/ml/predict', {
    method: 'POST',
    body: req,
  });
}
