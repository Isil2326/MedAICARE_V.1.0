/** Conteneur d'écran : SafeArea + défilement + bannière hors-ligne. */
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme/theme';
import { OfflineBanner } from '@/components/Banners';
import { useOnline } from '@/hooks/useOnline';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const online = useOnline();

  const inner = (
    <View
      style={[
        {
          padding: spacing.lg,
          gap: spacing.md,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        },
        contentStyle,
      ]}
    >
      {!online ? <OfflineBanner /> : null}
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          paddingTop: insets.top,
        }}
      >
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing.xxl }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );
}
