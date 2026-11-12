import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadApiKey, onApiKeyChange, pruneCache } from '../api/client';
import { FavoritesProvider } from '../state/favorites';
import { colors } from '../theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [keyVersion, setKeyVersion] = useState(0);

  useEffect(() => {
    pruneCache();
    loadApiKey().finally(() => setReady(true));
    return onApiKeyChange(() => setKeyVersion((v) => v + 1));
  }, []);

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <StatusBar style="light" />
        {ready ? (
          // Remount screens when the API key changes so everything refetches.
          <View key={keyVersion} style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.header }} />
        )}
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
