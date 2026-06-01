/** Profil patient — informations, conformité, déconnexion (efface les secrets). */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { SyntheticBadge } from '@/components/Badge';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState } from '@/components/States';
import { getMyPatient } from '@/services/api/patients';
import { useAuth } from '@/store/auth';
import { COMPLIANCE } from '@/config/env';
import { formatDate, ageFromBirth } from '@/utils/format';
import { spacing } from '@/theme/theme';

export default function PatientProfile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const q = useQuery({ queryKey: ['patient', 'me'], queryFn: getMyPatient });

  return (
    <Screen>
      <Text variant="h1">Profil</Text>

      <Card>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text variant="h3">Identité</Text>
          <SyntheticBadge />
        </View>
        {q.isLoading ? (
          <LoadingState />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} />
        ) : q.data ? (
          <View style={{ marginTop: spacing.sm, gap: 2 }}>
            <Text>
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
          <Text variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
            Connecté : {user.email} · rôle {user.role}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="h3">Conformité</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <Text variant="small" tone="secondary">• {COMPLIANCE.prototype}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.synthetic}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.notCertified}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.openLoop}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.noMedicalAdvice}</Text>
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
      <Gap />
    </Screen>
  );
}
