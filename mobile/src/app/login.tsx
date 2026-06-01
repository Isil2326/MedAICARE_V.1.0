/**
 * Écran de connexion.
 *
 * - Authentification via l'API (source de vérité). Aucun rôle déduit côté client.
 * - Identifiants de démonstration affichés (prototype, données simulées).
 * - L'inscription clinicien est volontairement désactivée (compte démo fourni).
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/store/auth';
import { ApiError } from '@/services/api/client';
import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { Card } from '@/components/Card';
import { AlertBanner, ComplianceBanner } from '@/components/Banners';
import { palette, radius, shadow, spacing } from '@/theme/theme';
import { COMPLIANCE, IS_API_CONFIGURED } from '@/config/env';

const DEMO = {
  patient: 'patient@demo.fr',
  clinician: 'clinicien@demo.fr',
  password: 'DemoMediAI2026!',
};

export default function Login() {
  const { status, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    return <Redirect href="/" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // La redirection est gérée par l'aiguillage racine.
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.userMessage
          : "Connexion impossible. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (kind: 'patient' | 'clinician') => {
    setEmail(DEMO[kind]);
    setPassword(DEMO.password);
    setError(null);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: palette.text,
    backgroundColor: palette.surface,
    minHeight: 48,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: spacing.lg,
          maxWidth: 520,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          {/* Logotype simple (initiales de marque). */}
          <View
            style={[
              {
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: palette.brandDark,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              },
              shadow.elevated,
            ]}
          >
            <Text variant="h2" tone="inverse">
              M
            </Text>
          </View>
          <Text variant="h1" tone="brand">
            MediAI Care
          </Text>
          <Text tone="secondary" center>
            Aide à la décision — diabète (prototype)
          </Text>
        </View>

        <ComplianceBanner
          title="Prototype académique"
          message={`${COMPLIANCE.synthetic} ${COMPLIANCE.notCertified} ${COMPLIANCE.noMedicalAdvice}`}
        />
        <Gap />

        {!IS_API_CONFIGURED ? (
          <>
            <AlertBanner
              level="danger"
              title="Configuration manquante"
              message="L'adresse du serveur (API) n'est pas configurée. La connexion est indisponible."
            />
            <Gap />
          </>
        ) : null}

        <Card>
          <Text variant="h3">Connexion</Text>
          <Gap size={spacing.md} />

          <Text variant="small" tone="secondary">
            E-mail
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.fr"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            accessibilityLabel="Adresse e-mail"
            style={inputStyle}
          />
          <Gap size={spacing.md} />

          <Text variant="small" tone="secondary">
            Mot de passe
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            textContentType="password"
            accessibilityLabel="Mot de passe"
            style={inputStyle}
          />
          <Gap size={spacing.md} />

          {error ? (
            <>
              <AlertBanner level="danger" message={error} />
              <Gap size={spacing.md} />
            </>
          ) : null}

          <Button
            label={submitting ? 'Connexion…' : 'Se connecter'}
            onPress={onSubmit}
            loading={submitting}
            disabled={!IS_API_CONFIGURED}
            fullWidth
          />
        </Card>

        <Gap />

        <Card>
          <Text variant="small" tone="secondary">
            Comptes de démonstration (données simulées)
          </Text>
          <Gap size={spacing.sm} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              label="Patient"
              variant="secondary"
              onPress={() => fillDemo('patient')}
            />
            <Button
              label="Clinicien"
              variant="secondary"
              onPress={() => fillDemo('clinician')}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
