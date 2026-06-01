/**
 * Recommandations du patient — APPROUVÉES uniquement (jamais pending/rejetées).
 *
 * Le filtrage est garanti côté serveur (GET /recommendations/mine). L'app
 * n'invente aucun conseil et n'affiche aucune suggestion non validée par un
 * clinicien (open-loop, validation humaine obligatoire).
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { RecommendationCard } from '@/components/RecommendationCard';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { listMyRecommendations } from '@/services/api/recommendations';
import { COMPLIANCE } from '@/config/env';

export default function PatientRecommendations() {
  const q = useQuery({
    queryKey: ['p', 'recommendations', 'mine'],
    queryFn: () => listMyRecommendations(),
  });

  return (
    <Screen refreshing={q.isFetching} onRefresh={q.refetch}>
      <Text variant="h1">Mes conseils</Text>
      <AlertBanner
        level="info"
        title="Validés par un clinicien"
        message={`Seules les recommandations approuvées par un clinicien apparaissent ici. ${COMPLIANCE.doNotChangeTreatment}`}
      />

      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : q.data && q.data.length ? (
        q.data.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
      ) : (
        <EmptyState
          title="Aucun conseil pour le moment"
          message="Vous n'avez pas de recommandation approuvée à afficher."
        />
      )}
    </Screen>
  );
}
