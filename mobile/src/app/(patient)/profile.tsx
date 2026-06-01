/** Profil patient — informations, conformité, déconnexion (efface les secrets). */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { Button, Gap } from '@/components/Button';
import { SyntheticBadge } from '@/components/Badge';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState } from '@/components/States';
import { getMyPatient } from '@/services/api/patients';
import { useAuth } from '@/store/auth';
import { COMPLIANCE } from '@/config/env';
import { formatDate, ageFromBirth } from '@/utils/format';
import { palette, radius, spacing } from '@/theme/theme';

export default function PatientProfile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const q = useQuery({ queryKey: ['patient', 'me'], queryFn: getMyPatient });

  return (
    <Screen>
      <Header title="Profil" />

      <Card>
        <SectionTitle title="Identité" action={<SyntheticBadge />} />
        {q.isLoading ? (
          <View style={{ marginTop: spacing.sm }}>
            <LoadingState skeleton />
          </View>
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} />
        ) : q.data ? (
          <View style={{ marginTop: spacing.md, gap: 2 }}>
            <Text variant="bodyStrong">
              {q.data.first_name} {q.data.last_name}
            </Text>
            {q.data.diabetes_type ? (
              <Text tone="secondary">Type de diabète : {q.data.diabetes_type}</Text>
            ) : null}
            {q.data.birth_date ? (
              <Text tone="secondary">
                Naissance : {formatDate(q.data.birth_date)} ({ageFromBirth(q.data.birth_date)})
              </Text>
            ) : null}
          </View>
        ) : null}
        {user ? (
          <Text variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
            Connecté : {user.email} · rôle {user.role}
          </Text>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="Conformité" />
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {[
            COMPLIANCE.prototype,
            COMPLIANCE.synthetic,
            COMPLIANCE.notCertified,
            COMPLIANCE.openLoop,
            COMPLIANCE.noMedicalAdvice,
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: palette.brand,
                  marginTop: 6,
                }}
              />
              <Text variant="small" tone="secondary" style={{ flexShrink: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <AlertBanner
        level="info"
        message="La déconnexion efface les jetons d'authentification du stockage sécurisé de l'appareil."
      />
      <Button
        label={loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        variant="danger"
        loading={loggingOut}
        onPress={async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        }}
        fullWidth
      />
      <Text
        variant="caption"
        tone="muted"
        style={{ textAlign: 'center', marginTop: spacing.md }}
      >
        MediAI Care Mobile · UI Phase 8.5
      </Text>
      <Gap />
    </Screen>
  );
}
