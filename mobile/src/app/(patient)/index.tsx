/** Accueil patient — disclaimer, profil, dernière glycémie, état du service. */
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { OpenLoopSyntheticBanner } from '@/components/Banners';
import { SyntheticBadge } from '@/components/Badge';
import { LoadingState, ErrorState } from '@/components/States';
import { getMyPatient } from '@/services/api/patients';
import { getCgm } from '@/services/api/timeseries';
import { useAuth } from '@/store/auth';
import { formatGlucose, formatDateTime, isoDaysAgo } from '@/utils/format';
import { spacing } from '@/theme/theme';

export default function PatientHome() {
  const { user } = useAuth();

  const profileQ = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: getMyPatient,
  });

  const cgmQ = useQuery({
    queryKey: ['patient', 'cgm', 'recent'],
    queryFn: () => getCgm({ start: isoDaysAgo(2), limit: 1 }),
  });

  const last = cgmQ.data && cgmQ.data.length ? cgmQ.data[cgmQ.data.length - 1] : null;

  return (
    <Screen
      refreshing={profileQ.isFetching || cgmQ.isFetching}
      onRefresh={() => {
        profileQ.refetch();
        cgmQ.refetch();
      }}
    >
      <Text variant="h1">Bonjour</Text>
      {user ? (
        <Text tone="secondary">{user.email}</Text>
      ) : null}

      <OpenLoopSyntheticBanner />

      <Card>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text variant="h3">Mon profil</Text>
          <SyntheticBadge />
        </View>
        {profileQ.isLoading ? (
          <LoadingState />
        ) : profileQ.error ? (
          <ErrorState error={profileQ.error} onRetry={profileQ.refetch} />
        ) : profileQ.data ? (
          <View style={{ marginTop: spacing.sm, gap: 2 }}>
            <Text>
              {profileQ.data.first_name} {profileQ.data.last_name}
            </Text>
            {profileQ.data.diabetes_type ? (
              <Text tone="secondary">Type : {profileQ.data.diabetes_type}</Text>
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <Text variant="h3">Dernière glycémie (CGM)</Text>
        {cgmQ.isLoading ? (
          <LoadingState />
        ) : cgmQ.error ? (
          <ErrorState error={cgmQ.error} onRetry={cgmQ.refetch} />
        ) : last ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text variant="h2">{formatGlucose(last.glucose_mgdl)}</Text>
            <Text tone="muted" variant="small">
              {formatDateTime(last.ts)}
              {last.trend ? ` · tendance : ${last.trend}` : ''}
            </Text>
          </View>
        ) : (
          <Text tone="muted" style={{ marginTop: spacing.sm }}>
            Aucune mesure récente disponible.
          </Text>
        )}
      </Card>
    </Screen>
  );
}
