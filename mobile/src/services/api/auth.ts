/** Service d'authentification (login / refresh / logout / me / register). */
import { apiRequest } from '@/services/api/client';
import {
  clearTokens,
  getRefreshToken,
  saveTokens,
} from '@/services/secureStore';
import type { TokenPair, UserPublic } from '@/types/api';

export async function login(
  email: string,
  password: string,
): Promise<UserPublic> {
  const tokens = await apiRequest<TokenPair>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  await saveTokens(tokens.access_token, tokens.refresh_token);
  // Le profil est récupéré séparément pour connaître le rôle.
  return me();
}

export async function me(): Promise<UserPublic> {
  return apiRequest<UserPublic>('/auth/me');
}

export async function logout(): Promise<void> {
  const refresh = await getRefreshToken();
  try {
    if (refresh) {
      await apiRequest<void>('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refresh },
      });
    }
  } finally {
    // Le logout efface TOUJOURS les secrets, même si l'appel réseau échoue.
    await clearTokens();
  }
}

export interface PatientRegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  diabetes_type?: string;
}

export async function registerPatient(
  input: PatientRegisterInput,
): Promise<UserPublic> {
  return apiRequest<UserPublic>('/auth/register/patient', {
    method: 'POST',
    body: input,
    auth: false,
  });
}
