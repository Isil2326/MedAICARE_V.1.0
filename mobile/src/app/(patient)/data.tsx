/** Données patient — séries CGM / repas / insuline / activité (lecture seule). */
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { SyntheticBadge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { CgmChart } from '@/components/CgmChart';
import { getCgm, getInsulin, getMeals, getActivity } from '@/services/api/timeseries';
import { formatGlucose, formatDateTime, isoDaysAgo } from '@/utils/format';
import { palette, spacing } from '@/theme/theme';

const RANGE = { start: isoDaysAgo(2), limit: 12 };

function Row({ left, right }: { left: string; right: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        gap: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 }}>
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.brandLight }}
        />
        <Text variant="small" tone="secondary" style={{ flexShrink: 1 }}>
          {left}
        </Text>
      </View>
      <Text variant="small" tone="default" style={{ fontWeight: '600' }}>
        {right}
      </Text>
    </View>
  );
}

function Section<T>({
  title,
  q,
  render,
}: {
  title: string;
  q: { isLoading: boolean; error: unknown; data?: T[]; refetch: () => void };
  render: (item: T) => { left: string; right: string };
}) {
  return (
    <Card>
      <SectionTitle title={title} action={<SyntheticBadge />} />
      {q.isLoading ? (
        <View style={{ marginTop: spacing.sm }}>
          <LoadingState skeleton />
        </View>
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : q.data && q.data.length ? (
        <View style={{ marginTop: spacing.sm }}>
          {q.data
            .slice()
            .reverse()
            .map((item, i) => {
              const r = render(item);
              return <Row key={i} left={r.left} right={r.right} />;
            })}
        </View>
      ) : (
        <EmptyState message="Aucune donnée récente." />
      )}
    </Card>
  );
}

export default function PatientData() {
  const cgmQ = useQuery({ queryKey: ['p', 'cgm'], queryFn: () => getCgm(RANGE) });
  const insulinQ = useQuery({ queryKey: ['p', 'insulin'], queryFn: () => getInsulin(RANGE) });
  const mealsQ = useQuery({ queryKey: ['p', 'meals'], queryFn: () => getMeals(RANGE) });
  const actQ = useQuery({ queryKey: ['p', 'activity'], queryFn: () => getActivity(RANGE) });

  const refetchAll = () => {
    cgmQ.refetch();
    insulinQ.refetch();
    mealsQ.refetch();
    actQ.refetch();
  };

  const fetching =
    cgmQ.isFetching || insulinQ.isFetching || mealsQ.isFetching || actQ.isFetching;

  return (
    <Screen refreshing={fetching} onRefresh={refetchAll}>
      <Header title="Mes données" subtitle="Mesures récentes (données simulées)." />

      <Card>
        <SectionTitle title="Glycémie récente (graphique)" action={<SyntheticBadge />} />
        {cgmQ.isLoading ? (
          <View style={{ marginTop: spacing.sm }}>
            <LoadingState skeleton />
          </View>
        ) : cgmQ.error ? (
          <ErrorState error={cgmQ.error} onRetry={cgmQ.refetch} />
        ) : cgmQ.data && cgmQ.data.length ? (
          <CgmChart data={cgmQ.data} />
        ) : (
          <EmptyState message="Aucune donnée récente." />
        )}
      </Card>

      <Section
        title="Glycémie (CGM)"
        q={cgmQ}
        render={(c) => ({ left: formatDateTime(c.ts), right: formatGlucose(c.glucose_mgdl) })}
      />
      <Section
        title="Repas"
        q={mealsQ}
        render={(m) => ({
          left: formatDateTime(m.ts),
          right: `${m.carbs_g} g glucides`,
        })}
      />
      <Section
        title="Insuline"
        q={insulinQ}
        render={(i) => ({
          left: formatDateTime(i.ts),
          right: `${i.units} U${i.insulin_type ? ` · ${i.insulin_type}` : ''}`,
        })}
      />
      <Section
        title="Activité"
        q={actQ}
        render={(a) => ({
          left: formatDateTime(a.ts),
          right: `${a.duration_min ?? '—'} min${a.intensity ? ` · ${a.intensity}` : ''}`,
        })}
      />
    </Screen>
  );
}
