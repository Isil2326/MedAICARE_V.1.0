/**
 * Client API typé pour MediAI Care (backend FastAPI v1).
 *
 * Responsabilités :
 * - Construire les URLs à partir de EXPO_PUBLIC_API_BASE_URL (jamais de hardcode).
 * - Injecter le jeton Bearer (lu depuis le stockage sécurisé, jamais journalisé).
 * - Timeout (AbortController) + retry limité sur erreur réseau (GET idempotents).
 * - Rafraîchir automatiquement l'access token sur 401 (une seule fois), puis
 *   rejouer la requête ; en cas d'échec → effacement des secrets + handler global.
 * - Traduire CHAQUE statut HTTP en message utilisateur NON technique (français),
 *   sans masquer les erreurs critiques.
 *
 * Le backend renvoie les erreurs au format FastAPI `{"detail": ...}` (Phase 5).
 */
import {
  API_BASE_URL,
  API_PREFIX,
  MAX_NETWORK_RETRIES,
  REQUEST_TIMEOUT_MS,
} from '@/config/env';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/services/secureStore';
import type { TokenPair } from '@/types/api';

export type ApiErrorKind =
  | 'config' // API_BASE_URL manquante
  | 'network' // réseau indisponible / timeout
  | 'bad_request' // 400
  | 'unauthorized' // 401 (après échec de refresh)
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'validation' // 422
  | 'rate_limited' // 429
  | 'unavailable' // 503
  | 'server' // 5xx divers
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Message court et non technique, affichable tel quel à l'utilisateur. */
  readonly userMessage: string;
  /** Détail brut (jamais un secret) — utile en debug, pas affiché par défaut. */
  readonly detail?: string;

  constructor(
    kind: ApiErrorKind,
    userMessage: string,
    status: number | null = null,
    detail?: string,
  ) {
    super(userMessage);
    this.name = 'ApiError';
    this.kind = kind;
    this.userMessage = userMessage;
    this.status = status;
    this.detail = detail;
  }
}

const USER_MESSAGES: Record<ApiErrorKind, string> = {
  config:
    "L'adresse du serveur n'est pas configurée. Contactez l'administrateur de la démo.",
  network:
    'Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.',
  bad_request: 'La demande est invalide. Vérifiez les informations saisies.',
  unauthorized: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: "Vous n'avez pas les droits pour effectuer cette action.",
  not_found: 'Élément introuvable.',
  conflict: 'Action impossible : cet élément a déjà été traité.',
  validation: 'Certaines informations sont invalides. Vérifiez votre saisie.',
  rate_limited:
    'Trop de requêtes en peu de temps. Patientez un instant puis réessayez.',
  unavailable: 'Service momentanément indisponible. Réessayez dans un instant.',
  server: 'Une erreur serveur est survenue. Réessayez plus tard.',
  unknown: "Une erreur inattendue s'est produite. Réessayez.",
};

function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 429:
      return 'rate_limited';
    case 503:
      return 'unavailable';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

/** Extrait un détail lisible depuis `{"detail": ...}` sans exposer de secret. */
function extractDetail(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Erreurs de validation Pydantic : on agrège les messages sans données.
    const msgs = detail
      .map((d) => (d && typeof d === 'object' ? (d as any).msg : null))
      .filter((m): m is string => typeof m === 'string');
    if (msgs.length) return msgs.join(' · ');
  }
  return undefined;
}

// --- Gestion globale de l'expiration de session -----------------------------
type AuthExpiredHandler = () => void;
let authExpiredHandler: AuthExpiredHandler | null = null;

/** Le store d'auth enregistre ici sa réaction à une session expirée. */
export function registerAuthExpiredHandler(fn: AuthExpiredHandler | null): void {
  authExpiredHandler = fn;
}

function buildUrl(path: string): string {
  const base = API_BASE_URL as string;
  const prefixed = path.startsWith('/') ? path : `/${path}`;
  // Les chemins « meta » (/health, /ready, /) ne portent pas le préfixe v1.
  const isMeta = ['/health', '/ready', '/'].includes(prefixed);
  return `${base}${isMeta ? '' : API_PREFIX}${prefixed}`;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Requête authentifiée (Bearer). Par défaut true. */
  auth?: boolean;
  /** Autoriser une tentative de refresh sur 401. Par défaut true. */
  allowRefresh?: boolean;
  /** Signal d'annulation externe (optionnel). */
  signal?: AbortSignal;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Tente un refresh d'access token. Retourne true si réussi. Jamais de log de jeton. */
async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const tokens = (await res.json()) as TokenPair;
      await saveTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function rawRequest<T>(
  path: string,
  opts: RequestOptions,
  attempt: number,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('config', USER_MESSAGES.config);
  }

  const method = opts.method ?? 'GET';
  const useAuth = opts.auth ?? true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Compose le signal externe avec le timeout interne.
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', () => controller.abort());
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (useAuth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    // Erreur réseau ou timeout : retry limité pour les GET idempotents.
    const isGet = method === 'GET';
    if (isGet && attempt < MAX_NETWORK_RETRIES) {
      return rawRequest<T>(path, opts, attempt + 1);
    }
    throw new ApiError('network', USER_MESSAGES.network);
  }
  clearTimeout(timeout);

  // 401 → tentative de refresh unique puis rejeu.
  if (res.status === 401 && useAuth && (opts.allowRefresh ?? true)) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return rawRequest<T>(path, { ...opts, allowRefresh: false }, attempt);
    }
    await clearTokens();
    if (authExpiredHandler) authExpiredHandler();
    throw new ApiError('unauthorized', USER_MESSAGES.unauthorized, 401);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const kind = kindForStatus(res.status);
    const detail = extractDetail(parsed);
    // On garde le message standard, en y ajoutant le détail serveur s'il est
    // explicite et non technique (ex. « Fenêtre invalide… »).
    const base = USER_MESSAGES[kind];
    const userMessage =
      detail && detail.length < 160 ? `${base}\n${detail}` : base;
    throw new ApiError(kind, userMessage, res.status, detail);
  }

  return parsed as T;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  return rawRequest<T>(path, opts, 0);
}
