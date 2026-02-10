import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create/simple" options={{ title: 'かんたん作成' }} />
        <Stack.Screen name="create/detailed" options={{ title: 'こだわり作成' }} />
        <Stack.Screen name="templates/index" options={{ title: 'テンプレート一覧' }} />
        <Stack.Screen name="preview" options={{ title: 'プレビュー' }} />
        <Stack.Screen name="settings/account" options={{ title: 'マイアカウント' }} />
        <Stack.Screen name="settings/plan" options={{ title: 'プラン・課金' }} />
        <Stack.Screen name="settings/privacy" options={{ title: 'プライバシーポリシー' }} />
        <Stack.Screen name="settings/presets" options={{ title: 'プリセット管理' }} />
        <Stack.Screen name="settings/learning-data" options={{ title: '学習データ管理' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
