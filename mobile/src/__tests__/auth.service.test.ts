/**
 * Service auth — login enregistre les jetons puis lit le profil ;
 * logout efface TOUJOURS les secrets, même si l'appel réseau échoue.
 */
jest.mock('@/services/api/client', () => ({ apiRequest: jest.fn() }));
jest.mock('@/services/secureStore', () => ({
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
  getRefreshToken: jest.fn(),
}));

import { apiRequest } from '@/services/api/client';
import { saveTokens, clearTokens, getRefreshToken } from '@/services/secureStore';
import { login, logout } from '@/services/api/auth';

const mockApiRequest = apiRequest as jest.Mock;
const mockSaveTokens = saveTokens as jest.Mock;
const mockClearTokens = clearTokens as jest.Mock;
const mockGetRefreshToken = getRefreshToken as jest.Mock;

beforeEach(() => {
  mockApiRequest.mockReset();
  mockSaveTokens.mockClear();
  mockClearTokens.mockClear();
  mockGetRefreshToken.mockReset().mockResolvedValue('refresh-token');
});

test('login → POST /auth/login, enregistre les jetons, puis GET /auth/me', async () => {
  mockApiRequest
    .mockResolvedValueOnce({ access_token: 'a', refresh_token: 'r' })
    .mockResolvedValueOnce({ id: '1', email: 'p@demo.fr', role: 'patient' });
  const user = await login('p@demo.fr', 'password1234');
  expect(mockApiRequest).toHaveBeenNthCalledWith(
    1,
    '/auth/login',
    expect.objectContaining({ method: 'POST', auth: false }),
  );
  expect(mockSaveTokens).toHaveBeenCalledWith('a', 'r');
  expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/auth/me');
  expect(user.role).toBe('patient');
});

test('logout efface les secrets même si l’appel réseau échoue', async () => {
  mockApiRequest.mockRejectedValueOnce(new Error('network'));
  // L'appel réseau échoue, mais le bloc finally efface TOUJOURS les secrets.
  await expect(logout()).rejects.toBeDefined();
  expect(mockClearTokens).toHaveBeenCalledTimes(1);
});
