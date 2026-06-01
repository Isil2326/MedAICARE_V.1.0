/** Profil clinicien — informations, conformité, déconnexion (efface les secrets). */
import React, { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { Button, Gap } from '@/components/Button';
import { AlertBanner } from '@/components/Banners';
import { useAuth } from '@/store/auth';
import { COMPLIANCE } from '@/config/env';
import { palette, spacing } from '@/theme/theme';

export default function ClinicianProfile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const reminders = [
    COMPLIANCE.prototype,
    COMPLIANCE.synthetic,
    COMPLIANCE.notCertified,
    COMPLIANCE.openLoop,
    "La XAI est un support d'affichage/audit, jamais une justification clinique.",
  ];

  return (
    <Screen>
      <Header title="Profil" />

      <Card>
        <SectionTitle title="Compte" />
        {user ? (
          <View style={{ marginTop: spacing.md, gap: 2 }}>
            <Text variant="bodyStrong">{user.email}</Text>
            <Text tone="secondary">Rôle : {user.role}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="Rappels de conformité" />
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {reminders.map((item, i) => (
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
