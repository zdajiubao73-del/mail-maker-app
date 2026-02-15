import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, LogBox, View } from 'react-native';
import 'react-native-reanimated';

import { initSentry } from '@/lib/sentry';

initSentry();

LogBox.ignoreLogs(['[RevenueCat]']);

import { useColorScheme } from '@/hooks/use-color-scheme';
import { HeaderBackButton } from '@/components/ui/header-back-button';
import LoginScreen from '@/components/login-screen';
import PaywallScreen from '@/components/paywall-screen';
import { initializePurchases, addCustomerInfoListener } from '@/lib/purchases';
import { usePlanStore } from '@/store/use-plan-store';
import { useMailStore } from '@/store/use-mail-store';
import { useContactStore } from '@/store/use-contact-store';
import { useAuthStore } from '@/store/use-auth-store';
import { usePresetStore } from '@/store/use-preset-store';
import { useLearningStore } from '@/store/use-learning-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

function waitForHydration(store: { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } }) {
  return new Promise<void>((resolve) => {
    if (store.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([
      waitForHydration(useMailStore),
      waitForHydration(useContactStore),
      waitForHydration(useAuthStore),
      waitForHydration(usePlanStore),
      waitForHydration(usePresetStore),
      waitForHydration(useLearningStore),
    ]).then(() => setHydrated(true));
  }, []);

  return hydrated;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const syncWithRevenueCat = usePlanStore((s) => s.syncWithRevenueCat);
  const applySubscriptionStatus = usePlanStore((s) => s.applySubscriptionStatus);
  const canUseApp = usePlanStore((s) => s.canUseApp);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated = useHydration();

  useEffect(() => {
    (async () => {
      await initializePurchases();
      await syncWithRevenueCat();
    })();
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // サブスクリプション状態のリアルタイム監視
  useEffect(() => {
    const unsubscribe = addCustomerInfoListener((status) => {
      applySubscriptionStatus(status);
    });
    return unsubscribe;
  }, [applySubscriptionStatus]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LoginScreen />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  if (!canUseApp()) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PaywallScreen />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerBackVisible: false,
        headerLeft: () => <HeaderBackButton />,
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="create/simple" options={{ title: 'かんたん作成' }} />
        <Stack.Screen name="create/detailed" options={{ title: 'こだわり作成' }} />
        <Stack.Screen name="templates/index" options={{ title: 'テンプレート一覧' }} />
        <Stack.Screen name="create/template" options={{ title: 'テンプレートから作成' }} />
        <Stack.Screen name="preview" options={{ title: 'プレビュー' }} />
        <Stack.Screen name="history/detail" options={{ title: 'メール詳細' }} />
        <Stack.Screen name="settings/account" options={{ title: 'マイアカウント' }} />
        <Stack.Screen name="settings/plan" options={{ title: 'プラン・課金' }} />
        <Stack.Screen name="settings/terms" options={{ title: '利用規約' }} />
        <Stack.Screen name="settings/privacy" options={{ title: 'プライバシーポリシー' }} />
        <Stack.Screen name="settings/presets" options={{ title: 'プリセット管理' }} />
        <Stack.Screen name="settings/learning-data" options={{ title: '学習データ管理' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
