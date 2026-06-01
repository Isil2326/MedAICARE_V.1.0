/** Cohorte clinicien — liste des patients + recherche. Navigation → dossier. */
import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Text } from '@/components/Text';
import { PatientCard } from '@/components/PatientCard';
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
      <Header
        variant="hero"
        title="Cohorte"
        subtitle={
          q.data ? `${q.data.length} patient(s) · données simulées` : 'Données simulées'
        }
      />
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
        <LoadingState skeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : filtered.length ? (
        filtered.map((p) => (
          <PatientCard
            key={p.id}
            name={`${p.first_name} ${p.last_name}`}
            meta={`${p.diabetes_type ?? 'Type non précisé'}${
              p.birth_date ? ` · ${ageFromBirth(p.birth_date)}` : ''
            }`}
            right={<SyntheticBadge />}
            accessibilityHint="Affiche le profil, le risque et les recommandations"
            onPress={() => router.push({ pathname: '/patient-detail', params: { id: p.id } })}
          />
        ))
      ) : (
        <EmptyState
          title="Aucun patient trouvé"
          message={search ? 'Essayez un autre terme de recherche.' : undefined}
        />
      )}
    </Screen>
  );
}
