import { useEffect, useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
import {
  getLoginAuthRequestConfig,
  discovery,
  exchangeCodeForTokens,
  fetchUserProfile,
  useAuthRequest,
} from '@/lib/google-auth';
import {
  isAppleAuthAvailable,
  signInWithApple,
} from '@/lib/apple-auth';
import type { User } from '@/types/user';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Apple Sign In の利用可否をチェック
  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const authConfig = getLoginAuthRequestConfig();
  const hasGoogleClientId = !!authConfig.clientId;
  const [request, response, promptAsync] = useAuthRequest(
    hasGoogleClientId ? authConfig : { ...authConfig, clientId: 'placeholder' },
    discovery,
  );

  // OAuth レスポンスを処理
  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error' || response?.type === 'dismiss') {
        setLoading(false);
      }
      return;
    }
    const { code } = response.params;
    if (!code) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const tokens = await exchangeCodeForTokens(
          code,
          request?.codeVerifier,
        );
        const profile = await fetchUserProfile(tokens.accessToken);

        const user: User = {
          id: `google-${tokens.email}`,
          displayName: profile.name || tokens.email,
          email: tokens.email,
          plan: 'free',
          mailAccounts: [],
        };
        setUser(user);
      } catch {
        Alert.alert('エラー', 'ログインに失敗しました。もう一度お試しください。');
      } finally {
        setLoading(false);
      }
    })();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch {
      setLoading(false);
    }
  }, [promptAsync]);

  const handleAppleLogin = useCallback(async () => {
    setLoading(true);
    try {
      const credential = await signInWithApple();
      const user: User = {
        id: `apple-${credential.userId}`,
        displayName: credential.fullName || credential.email || 'Apple User',
        email: credential.email,
        plan: 'free',
        mailAccounts: [],
      };
      setUser(user);
    } catch (error: unknown) {
      // ユーザーがキャンセルした場合はエラー表示しない
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        // キャンセル — 何もしない
      } else {
        Alert.alert('エラー', 'Appleログインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const handleDemoLogin = useCallback(() => {
    const user: User = {
      id: 'user-demo-001',
      displayName: 'デモユーザー',
      email: 'demo@example.com',
      plan: 'free',
      mailAccounts: [],
    };
    setUser(user);
  }, [setUser]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo / Title */}
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: colors.tint + '15' }]}>
          <IconSymbol name="envelope.fill" size={48} color={colors.tint} />
        </View>
        <ThemedText type="title" style={styles.title}>
          AI Mail Maker
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          AIがビジネスメールを自動作成
        </ThemedText>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              colorScheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleAppleLogin}
          />
        )}

        {hasGoogleClientId && (
          <TouchableOpacity
            style={[styles.googleButton, { opacity: loading ? 0.6 : 1 }]}
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
            disabled={loading || !request}
            accessibilityRole="button"
            accessibilityLabel="Googleアカウントでログイン"
            accessibilityState={{ disabled: loading || !request }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name="person.crop.circle.fill" size={22} color="#fff" />
                <ThemedText style={styles.googleButtonText}>
                  Googleでログイン
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {!hasGoogleClientId && (
          <TouchableOpacity
            style={[styles.demoButton, { borderColor: colors.tint }]}
            activeOpacity={0.8}
            onPress={handleDemoLogin}
            accessibilityRole="button"
            accessibilityLabel="デモモードでログイン"
          >
            <IconSymbol name="play.fill" size={18} color={colors.tint} />
            <ThemedText style={[styles.demoButtonText, { color: colors.tint }]}>
              デモでログイン
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDemoLogin}
          accessibilityRole="button"
          accessibilityLabel="ログインせずにアプリを使う"
        >
          <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
            ログインせずに使う
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Legal links */}
      <View style={styles.legalLinks}>
        <ThemedText style={[styles.legalText, { color: colors.textSecondary }]}>
          ログインすることで
        </ThemedText>
        <View style={styles.legalLinksRow}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => Linking.openURL('https://ai-mail-app.com/terms')}
          >
            <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
              利用規約
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.legalText, { color: colors.textSecondary }]}>
            および
          </ThemedText>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => Linking.openURL('https://ai-mail-app.com/privacy')}
          >
            <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
              プライバシーポリシー
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.legalText, { color: colors.textSecondary }]}>
            に同意したものとみなされます
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  demoButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  skipText: {
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  legalLinks: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
  },
  legalLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
