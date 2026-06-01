/**
 * Client API — mapping des erreurs, retry réseau, refresh sur 401, Bearer.
 * fetch et le stockage sécurisé sont mockés ; aucun vrai jeton n'est utilisé.
 */
jest.mock('@/config/env', () => ({
  API_BASE_URL: 'https://api.test',
  API_PREFIX: '/api/v1',
  REQUEST_TIMEOUT_MS: 5000,
  MAX_NETWORK_RETRIES: 1,
}));

jest.mock('@/services/secureStore', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from '@/services/secureStore';
import {
  apiRequest,
  ApiError,
  registerAuthExpiredHandler,
} from '@/services/api/client';

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetRefreshToken = getRefreshToken as jest.Mock;
const mockSaveTokens = saveTokens as jest.Mock;
const mockClearTokens = clearTokens as jest.Mock;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body == null ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

beforeEach(() => {
  mockGetAccessToken.mockClear().mockResolvedValue('access-token');
  mockGetRefreshToken.mockClear().mockResolvedValue('refresh-token');
  mockSaveTokens.mockClear();
  mockClearTokens.mockClear();
  registerAuthExpiredHandler(null);
});

describe('mapping des statuts HTTP → erreurs non techniques', () => {
  const cases: Array<[number, string]> = [
    [400, 'bad_request'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rate_limited'],
    [503, 'unavailable'],
    [500, 'server'],
  ];
  test.each(cases)('statut %s → kind %s', async (status, kind) => {
    global.fetch = jest.fn(async () => jsonResponse(status, { detail: 'x' })) as any;
    await expect(apiRequest('/patients')).rejects.toMatchObject({
      kind,
      status,
    });
  });
});

test('erreur réseau → kind "network" avec un retry sur GET', async () => {
  const fetchMock = jest.fn(async () => {
    throw new TypeError('Network down');
  });
  global.fetch = fetchMock as any;
  await expect(apiRequest('/patients')).rejects.toMatchObject({
    kind: 'network',
  });
  // 1 tentative initiale + 1 retry (MAX_NETWORK_RETRIES = 1).
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('le jeton Bearer est injecté dans l’en-tête Authorization', async () => {
  const fetchMock = jest.fn(async () => jsonResponse(200, { ok: true }));
  global.fetch = fetchMock as any;
  await apiRequest('/patients');
  const init = (fetchMock.mock.calls[0] as any[])?.[1] as RequestInit | undefined;
  const headers = (init?.headers ?? {}) as Record<string, string>;
  expect(headers.Authorization).toBe('Bearer access-token');
});

test('401 → refresh réussi → la requête est rejouée et réussit', async () => {
  let call = 0;
  const fetchMock = jest.fn(async (url: string) => {
    if (url.includes('/auth/refresh')) {
      return jsonResponse(200, {
        access_token: 'new-a',
        refresh_token: 'new-r',
      });
    }
    call += 1;
    return call === 1 ? jsonResponse(401, { detail: 'expired' }) : jsonResponse(200, { data: 1 });
  });
  global.fetch = fetchMock as any;
  const out = await apiRequest<{ data: number }>('/patients');
  expect(out).toEqual({ data: 1 });
  expect(mockSaveTokens).toHaveBeenCalledWith('new-a', 'new-r');
  expect(mockClearTokens).not.toHaveBeenCalled();
});

test('401 → refresh échoué → secrets effacés + handler appelé + erreur 401', async () => {
  const expired = jest.fn();
  registerAuthExpiredHandler(expired);
  const fetchMock = jest.fn(async (url: string) => {
    if (url.includes('/auth/refresh')) return jsonResponse(401, { detail: 'no' });
    return jsonResponse(401, { detail: 'expired' });
  });
  global.fetch = fetchMock as any;
  await expect(apiRequest('/patients')).rejects.toBeInstanceOf(ApiError);
  expect(mockClearTokens).toHaveBeenCalledTimes(1);
  expect(expired).toHaveBeenCalledTimes(1);
});
