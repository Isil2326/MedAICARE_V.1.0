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
import { Header } from '@/components/Header';
import { RecommendationCard } from '@/components/RecommendationCard';
import { RecommendationActions } from '@/components/RecommendationActions';
import { ClinicianActionBar } from '@/components/ClinicianActionBar';
import { SelectChip } from '@/components/SelectChip';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { listRecommendations } from '@/services/api/recommendations';
import { COMPLIANCE } from '@/config/env';
import { spacing } from '@/theme/theme';

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
      <Header title="Recommandations" subtitle="File de validation clinicien" />
      <AlertBanner
        level="info"
        title="Validation humaine obligatoire"
        message={`${COMPLIANCE.openLoop} Chaque suggestion doit être approuvée, rejetée ou modifiée par un clinicien.`}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <SelectChip
            key={f.key || 'all'}
            pill
            label={f.label}
            selected={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
          />
        ))}
      </View>

      {q.isLoading ? (
        <LoadingState skeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : q.data && q.data.length ? (
        q.data.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec}>
            <ClinicianActionBar>
              <RecommendationActions rec={rec} onChanged={refresh} />
            </ClinicianActionBar>
          </RecommendationCard>
        ))
      ) : (
        <EmptyState
          title="Aucune recommandation"
          message="Aucune recommandation pour ce filtre."
        />
      )}
    </Screen>
  );
}
