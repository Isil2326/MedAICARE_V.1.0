/**
 * Client React Query — cache EN MÉMOIRE uniquement.
 *
 * Aucune persistance disque/AsyncStorage : les données patient (synthétiques)
 * ne sont jamais stockées durablement sur l'appareil. Le cache mémoire sert
 * uniquement de tampon « offline minimal » pendant la session.
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // On ne réessaie pas les erreurs d'autorisation/validation.
        if (error instanceof ApiError) {
          if (
            ['unauthorized', 'forbidden', 'not_found', 'validation', 'config']
              .includes(error.kind)
          ) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
