import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import React from 'react';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color as string} size={size} />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#8A93A3',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Alla matcher', tabBarIcon: icon('football-outline') }} />
      <Tabs.Screen name="live" options={{ title: 'LIVE', tabBarIcon: icon('radio-outline') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoriter', tabBarIcon: icon('star-outline') }} />
      <Tabs.Screen name="news" options={{ title: 'Nyheter', tabBarIcon: icon('newspaper-outline') }} />
      <Tabs.Screen name="leagues" options={{ title: 'Ligor', tabBarIcon: icon('trophy-outline') }} />
    </Tabs>
  );
}
