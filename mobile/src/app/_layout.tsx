/**
 * Layout racine — fournit les contextes globaux et la pile de navigation.
 *
 * Providers : SafeArea · React Query (cache mémoire) · Auth (rôle).
 */
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/store/auth';
import { queryClient } from '@/services/queryClient';
import { palette } from '@/theme/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(patient)" />
              <Stack.Screen name="(clinician)" />
              <Stack.Screen
                name="patient-detail"
                options={{
                  headerShown: true,
                  title: 'Dossier patient',
                  headerTintColor: palette.text,
                }}
              />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
