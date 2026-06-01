/**
 * SecureStore — comportement WEB (preview Expo).
 * NON-NÉGOCIABLE : sur le web on n'écrit JAMAIS de jeton dans localStorage ;
 * on utilise un stockage mémoire volatil. expo-secure-store ne doit pas être
 * appelé sur le web (il se rabattrait sur localStorage).
 */
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  SECURE_STORAGE_IS_PERSISTENT,
} from '@/services/secureStore';

const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  mockSetItemAsync.mockClear();
  mockGetItemAsync.mockClear();
  mockDeleteItemAsync.mockClear();
});

test('stocke et relit les jetons en mémoire sur le web', async () => {
  await saveTokens('access-abc', 'refresh-xyz');
  expect(await getAccessToken()).toBe('access-abc');
  expect(await getRefreshToken()).toBe('refresh-xyz');
});

test('clearTokens efface les jetons', async () => {
  await saveTokens('a', 'b');
  await clearTokens();
  expect(await getAccessToken()).toBeNull();
  expect(await getRefreshToken()).toBeNull();
});

test('expo-secure-store n’est JAMAIS appelé sur le web', async () => {
  await saveTokens('a', 'b');
  await getAccessToken();
  await clearTokens();
  expect(mockSetItemAsync).not.toHaveBeenCalled();
  expect(mockGetItemAsync).not.toHaveBeenCalled();
  expect(mockDeleteItemAsync).not.toHaveBeenCalled();
});

test('le stockage web est marqué non persistant', () => {
  expect(SECURE_STORAGE_IS_PERSISTENT).toBe(false);
});
