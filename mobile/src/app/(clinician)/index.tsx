/** Cohorte clinicien — liste des patients + recherche. Navigation → dossier. */
import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { SyntheticBadge } from '@/components/Badge';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { listPatients } from '@/services/api/patients';
import { ageFromBirth } from '@/utils/format';
import { COMPLIANCE } from '@/config/env';
import { palette, radius, spacing } from '@/theme/theme';

export default function ClinicianPatients() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['clinician', 'patients'], queryFn: listPatients });

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) =>
      `${p.first_name} ${p.last_name} ${p.diabetes_type ?? ''}`.toLowerCase().includes(s),
    );
  }, [q.data, search]);

  return (
    <Screen refreshing={q.isFetching} onRefresh={q.refetch}>
      <Text variant="h1">Cohorte</Text>
      <AlertBanner
        level="synthetic"
        title="Données simulées"
        message={`${COMPLIANCE.synthetic} ${COMPLIANCE.openLoop}`}
      />

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un patient…"
        placeholderTextColor={palette.textMuted}
        accessibilityLabel="Rechercher un patient"
        style={{
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
          padding: spacing.md,
          color: palette.text,
          backgroundColor: palette.surface,
          fontSize: 16,
          minHeight: 48,
        }}
      />

      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : filtered.length ? (
        filtered.map((p) => (
          <Card key={p.id}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <Text
                  variant="h3"
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/patient-detail', params: { id: p.id } })
                  }
                >
                  {p.first_name} {p.last_name}
                </Text>
                <Text variant="caption" tone="muted">
                  {p.diabetes_type ?? 'Type non précisé'}
                  {p.birth_date ? ` · ${ageFromBirth(p.birth_date)}` : ''}
                </Text>
              </View>
              <SyntheticBadge />
            </View>
            <View style={{ marginTop: spacing.sm }}>
              <Text
                variant="small"
                tone="brand"
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/patient-detail', params: { id: p.id } })
                }
              >
                Ouvrir le dossier →
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState message="Aucun patient trouvé." />
      )}
    </Screen>
  );
}
