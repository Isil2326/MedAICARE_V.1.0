/** Profil clinicien — informations, conformité, déconnexion (efface les secrets). */
import React, { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { AlertBanner } from '@/components/Banners';
import { useAuth } from '@/store/auth';
import { COMPLIANCE } from '@/config/env';
import { spacing } from '@/theme/theme';

export default function ClinicianProfile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <Screen>
      <Text variant="h1">Profil</Text>

      <Card>
        <Text variant="h3">Compte</Text>
        {user ? (
          <View style={{ marginTop: spacing.sm, gap: 2 }}>
            <Text>{user.email}</Text>
            <Text tone="secondary">Rôle : {user.role}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text variant="h3">Rappels de conformité</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <Text variant="small" tone="secondary">• {COMPLIANCE.prototype}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.synthetic}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.notCertified}</Text>
          <Text variant="small" tone="secondary">• {COMPLIANCE.openLoop}</Text>
          <Text variant="small" tone="secondary">
            • La XAI est un support d'affichage/audit, jamais une justification clinique.
          </Text>
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
