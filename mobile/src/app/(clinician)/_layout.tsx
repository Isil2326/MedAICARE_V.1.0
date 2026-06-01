/** Onglets de l'espace clinicien (accès réservé aux rôles clinician / admin). */
import React from 'react';
import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/store/auth';
import { LoadingState } from '@/components/States';
import { TabDot } from '@/components/TabIcon';
import { palette } from '@/theme/theme';

export default function ClinicianLayout() {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.bg }}>
        <LoadingState />
      </View>
    );
  }
  if (status === 'unauthenticated') return <Redirect href="/login" />;
  if (role !== 'clinician' && role !== 'admin') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        tabBarActiveTintColor: palette.brandDark,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Patients', tabBarIcon: ({ focused }) => <TabDot focused={focused} /> }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{ title: 'Recos', tabBarIcon: ({ focused }) => <TabDot focused={focused} /> }}
      />
      <Tabs.Screen
        name="xai"
        options={{ title: 'XAI global', tabBarIcon: ({ focused }) => <TabDot focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabDot focused={focused} /> }}
      />
    </Tabs>
  );
}
