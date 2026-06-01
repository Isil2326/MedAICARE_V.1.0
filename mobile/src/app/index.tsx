/** Aiguillage racine selon l'état d'authentification et le rôle. */
import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';
import { LoadingState } from '@/components/States';
import { palette } from '@/theme/theme';

export default function Index() {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: palette.bg,
        }}
      >
        <LoadingState label="Initialisation…" />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  if (role === 'patient') {
    return <Redirect href="/(patient)" />;
  }

  // clinician / admin
  return <Redirect href="/(clinician)" />;
}
