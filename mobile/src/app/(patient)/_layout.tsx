/** Onglets de l'espace patient (accès réservé au rôle patient). */
import React from 'react';
import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/store/auth';
import { LoadingState } from '@/components/States';
import { TabDot } from '@/components/TabIcon';
import { palette } from '@/theme/theme';

export default function PatientLayout() {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.bg }}>
        <LoadingState />
      </View>
    );
  }
  if (status === 'unauthenticated') return <Redirect href="/login" />;
  if (role !== 'patient') return <Redirect href="/" />;

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
        options={{
          title: "Aujourd'hui",
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: 'Données',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="risk"
        options={{
          title: 'Risque',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Conseils',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
        }}
      />
      {/* Écran XAI accessible depuis l'onglet Risque, masqué de la barre. */}
      <Tabs.Screen name="xai" options={{ href: null, title: 'Explication' }} />
    </Tabs>
  );
}
