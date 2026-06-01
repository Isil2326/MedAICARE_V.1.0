/**
 * SecureStore — comportement NATIF (iOS/Android).
 * Les jetons passent par expo-secure-store (Keychain/Keystore chiffré),
 * jamais par AsyncStorage ni localStorage.
 */
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    deleteItemAsync: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

import * as SecureStore from 'expo-secure-store';
import {
  saveTokens,
  getAccessToken,
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

test('saveTokens écrit dans le coffre sécurisé natif', async () => {
  await saveTokens('access-1', 'refresh-1');
  expect(mockSetItemAsync).toHaveBeenCalledTimes(2);
  expect(await getAccessToken()).toBe('access-1');
  expect(mockGetItemAsync).toHaveBeenCalled();
});

test('clearTokens supprime les deux jetons du coffre', async () => {
  await saveTokens('a', 'b');
  await clearTokens();
  expect(mockDeleteItemAsync).toHaveBeenCalledTimes(2);
  expect(await getAccessToken()).toBeNull();
});

test('le stockage natif est marqué persistant', () => {
  expect(SECURE_STORAGE_IS_PERSISTENT).toBe(true);
});
