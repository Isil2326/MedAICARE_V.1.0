/**
 * RBAC côté recommandations (source-of-truth API).
 * - Patient : `mine()` interroge /recommendations/mine (approuvées uniquement).
 * - Clinicien : list/generate/approve/reject/modify interrogent /recommendations.
 * Le serveur reste l'autorité ; ce test verrouille les chemins appelés.
 */
jest.mock('@/services/api/client', () => ({ apiRequest: jest.fn() }));

import { apiRequest } from '@/services/api/client';
import {
  listMyRecommendations,
  listRecommendations,
  generateRecommendations,
  approveRecommendation,
  rejectRecommendation,
  modifyRecommendation,
} from '@/services/api/recommendations';

const mockApiRequest = apiRequest as jest.Mock;

beforeEach(() => mockApiRequest.mockReset().mockResolvedValue([]));

test('patient → /recommendations/mine (approuvées uniquement)', async () => {
  await listMyRecommendations();
  const path = mockApiRequest.mock.calls[0][0] as string;
  expect(path.startsWith('/recommendations/mine')).toBe(true);
});

test('clinicien → /recommendations (liste filtrable, pas /mine)', async () => {
  await listRecommendations({ status: 'pending' });
  const path = mockApiRequest.mock.calls[0][0] as string;
  expect(path).toContain('/recommendations');
  expect(path).not.toContain('/mine');
  expect(path).toContain('status=pending');
});

test('les actions clinicien ciblent les bons endpoints POST', async () => {
  await generateRecommendations({ patient_id: 'p1', target: 'hypo', horizon_min: 30 } as any);
  await approveRecommendation('r1', 'ok');
  await rejectRecommendation('r2');
  await modifyRecommendation('r3', 'texte', 'note');
  const calls = mockApiRequest.mock.calls.map((c) => [c[0], (c[1] as any)?.method]);
  expect(calls).toEqual([
    ['/recommendations/generate', 'POST'],
    ['/recommendations/r1/approve', 'POST'],
    ['/recommendations/r2/reject', 'POST'],
    ['/recommendations/r3/modify', 'POST'],
  ]);
});
