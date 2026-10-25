import '../src/i18n'; // Must be first import
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useLanguageStore } from '../src/stores/languageStore';
import { useRealtimeSync } from '../src/lib/realtime';
import { RealtimeToastBanner } from '../src/components/common/RealtimeToastBanner';

SplashScreen.preventAutoHideAsync();

function RealtimeWatcher() {
  useRealtimeSync();
  return null;
}

export default function RootLayout() {
  const initLanguage = useLanguageStore((s) => s.initLanguage);

  useEffect(() => {
    initLanguage().finally(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  }, [initLanguage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <RealtimeWatcher />
        <RealtimeToastBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(household)" />
          <Stack.Screen name="(collector)" />
          <Stack.Screen name="(picker)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(recycler)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
