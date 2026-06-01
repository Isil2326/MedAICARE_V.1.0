/** Accueil patient — disclaimer, profil, dernière glycémie, état du service. */
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { MetricCard } from '@/components/MetricCard';
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
      <Header
        variant="hero"
        title="Bonjour"
        subtitle={user ? user.email : 'Espace patient'}
      />

      <OpenLoopSyntheticBanner />

      {/* Dernière glycémie — métrique mise en avant. */}
      {cgmQ.isLoading ? (
        <Card>
          <SectionTitle title="Dernière glycémie (CGM)" />
          <View style={{ marginTop: spacing.sm }}>
            <LoadingState skeleton />
          </View>
        </Card>
      ) : cgmQ.error ? (
        <Card>
          <SectionTitle title="Dernière glycémie (CGM)" />
          <View style={{ marginTop: spacing.sm }}>
            <ErrorState error={cgmQ.error} onRetry={cgmQ.refetch} />
          </View>
        </Card>
      ) : last ? (
        <MetricCard
          tone="brand"
          label="Dernière glycémie (CGM)"
          value={formatGlucose(last.glucose_mgdl)}
          hint={`${formatDateTime(last.ts)}${last.trend ? ` · tendance : ${last.trend}` : ''}`}
          badge={<SyntheticBadge />}
        />
      ) : (
        <Card>
          <SectionTitle title="Dernière glycémie (CGM)" />
          <Text tone="muted" style={{ marginTop: spacing.sm }}>
            Aucune mesure récente disponible.
          </Text>
        </Card>
      )}

      {/* Profil. */}
      <Card>
        <SectionTitle title="Mon profil" action={<SyntheticBadge />} />
        {profileQ.isLoading ? (
          <View style={{ marginTop: spacing.sm }}>
            <LoadingState skeleton />
          </View>
        ) : profileQ.error ? (
          <ErrorState error={profileQ.error} onRetry={profileQ.refetch} />
        ) : profileQ.data ? (
          <View style={{ marginTop: spacing.md, gap: 2 }}>
            <Text variant="bodyStrong">
              {profileQ.data.first_name} {profileQ.data.last_name}
            </Text>
            {profileQ.data.diabetes_type ? (
              <Text tone="secondary">Type : {profileQ.data.diabetes_type}</Text>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
