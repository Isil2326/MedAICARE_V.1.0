/**
 * Stockage sécurisé des jetons d'authentification.
 *
 * NON-NÉGOCIABLE PHASE 6 :
 * - Aucun jeton dans AsyncStorage (ce module n'importe JAMAIS AsyncStorage).
 * - Aucun jeton dans localStorage.
 * - Native (iOS/Android) : expo-secure-store → Keychain / Keystore chiffré.
 * - Web (preview Expo) : `expo-secure-store` se rabattrait sur localStorage, ce
 *   qui est INTERDIT ici. On utilise donc un stockage MÉMOIRE volatil sur le web
 *   (perdu au rafraîchissement) afin de NE JAMAIS écrire un jeton dans
 *   localStorage. C'est une limitation documentée du preview web.
 * - Aucun jeton n'est jamais journalisé (pas de console.log de token).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'mediai_access_token';
const REFRESH_KEY = 'mediai_refresh_token';

// Stockage mémoire volatil — utilisé UNIQUEMENT sur le web pour éviter localStorage.
const memoryStore = new Map<string, string>();
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    memoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return memoryStore.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    memoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await setItem(ACCESS_KEY, accessToken);
}

/** Efface TOUS les secrets — appelé au logout et sur refresh échoué. */
export async function clearTokens(): Promise<void> {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
}

/** Indique si le stockage des jetons est persistant (false sur le web). */
export const SECURE_STORAGE_IS_PERSISTENT = !isWeb;
