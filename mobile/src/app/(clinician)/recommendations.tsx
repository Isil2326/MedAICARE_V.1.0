/**
 * Recommandations (clinicien) — liste filtrable + validation humaine.
 *
 * Toutes les suggestions naissent `pending` côté serveur. Le clinicien approuve,
 * rejette ou modifie (la sécurité est revalidée côté serveur). La génération est
 * réalisée depuis le dossier d'un patient (écran « Dossier patient »).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { RecommendationCard } from '@/components/RecommendationCard';
import { RecommendationActions } from '@/components/RecommendationActions';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { listRecommendations } from '@/services/api/recommendations';
import { COMPLIANCE } from '@/config/env';
import { palette, radius, spacing } from '@/theme/theme';

const FILTERS: { key: string; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Approuvées' },
  { key: 'rejected', label: 'Rejetées' },
  { key: 'modified', label: 'Modifiées' },
  { key: '', label: 'Toutes' },
];

export default function ClinicianRecommendations() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const q = useQuery({
    queryKey: ['clinician', 'recommendations', statusFilter],
    queryFn: () =>
      listRecommendations(statusFilter ? { status: statusFilter } : {}),
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ['clinician', 'recommendations'] });

  return (
    <Screen refreshing={q.isFetching} onRefresh={q.refetch}>
      <Text variant="h1">Recommandations</Text>
      <AlertBanner
        level="info"
        title="Validation humaine obligatoire"
        message={`${COMPLIANCE.openLoop} Chaque suggestion doit être approuvée, rejetée ou modifiée par un clinicien.`}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const selected = statusFilter === f.key;
          return (
            <View
              key={f.key || 'all'}
              style={{
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? palette.brand : palette.borderStrong,
                backgroundColor: selected ? palette.brandSurface : palette.surface,
                borderRadius: radius.pill,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text
                variant="small"
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStatusFilter(f.key)}
                style={{ color: selected ? palette.brandDark : palette.text }}
              >
                {f.label}
              </Text>
            </View>
          );
        })}
      </View>

      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : q.data && q.data.length ? (
        q.data.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec}>
            <RecommendationActions rec={rec} onChanged={refresh} />
          </RecommendationCard>
        ))
      ) : (
        <EmptyState message="Aucune recommandation pour ce filtre." />
      )}
    </Screen>
  );
}
