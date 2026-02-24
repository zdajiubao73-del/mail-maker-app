import { useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
import {
  getAuthRequestConfig,
  discovery,
  exchangeCodeForTokens,
  useAuthRequest,
} from '@/lib/google-auth';
import {
  getAuthRequestConfig as getMicrosoftAuthRequestConfig,
  discovery as microsoftDiscovery,
  exchangeCodeForTokens as exchangeMicrosoftCodeForTokens,
  useAuthRequest as useMicrosoftAuthRequest,
} from '@/lib/microsoft-auth';
import { deleteAccountLocally } from '@/lib/data-cleaner';
import type { AuthStatus, MailAccount, MailAccountType } from '@/types/user';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Mail provider display config */
const PROVIDER_CONFIG: Record<
  MailAccountType,
  { label: string; color: string }
> = {
  gmail: { label: 'Gmail', color: '#EA4335' },
  outlook: { label: 'Outlook', color: '#0078D4' },
  yahoo: { label: 'Yahoo!', color: '#720E9E' },
  icloud: { label: 'iCloud', color: '#3693F5' },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const router = useRouter();

  const mailAccounts = useAuthStore((s) => s.mailAccounts);
  const addMailAccount = useAuthStore((s) => s.addMailAccount);
  const removeMailAccount = useAuthStore((s) => s.removeMailAccount);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  /** Auth status badge config */
  const statusConfig: Record<
    AuthStatus,
    { label: string; color: string; bgColor: string }
  > = useMemo(() => ({
    authenticated: { label: '認証済み', color: '#34C759', bgColor: '#34C75920' },
    unauthenticated: {
      label: '未認証',
      color: '#FF9500',
      bgColor: '#FF950020',
    },
    expired: { label: '期限切れ', color: '#FF3B30', bgColor: '#FF3B3020' },
  }), []);

  // Google OAuth のセットアップ
  const authConfig = getAuthRequestConfig();
  const hasGoogleClientId = !!authConfig.clientId;
  const [request, response, promptAsync] = useAuthRequest(
    hasGoogleClientId ? authConfig : { ...authConfig, clientId: 'placeholder' },
    discovery,
  );

  // Microsoft OAuth のセットアップ
  const msAuthConfig = getMicrosoftAuthRequestConfig();
  const hasMicrosoftClientId = !!msAuthConfig.clientId;
  const [msRequest, msResponse, msPromptAsync] = useMicrosoftAuthRequest(
    hasMicrosoftClientId ? msAuthConfig : { ...msAuthConfig, clientId: 'placeholder' },
    microsoftDiscovery,
  );

  // Google OAuth レスポンスを処理
  useEffect(() => {
    if (response?.type !== 'success') return;
    const { code } = response.params;
    if (!code) return;

    (async () => {
      try {
        const tokens = await exchangeCodeForTokens(
          code,
          request?.codeVerifier,
        );
        addMailAccount({
          id: `gmail-${Date.now()}`,
          type: 'gmail',
          email: tokens.email,
          authStatus: 'authenticated',
        });
        Alert.alert('連携完了', `Gmailアカウント (${tokens.email}) を連携しました`);
      } catch {
        Alert.alert('エラー', 'Gmail連携に失敗しました');
      }
    })();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  // Microsoft OAuth レスポンスを処理
  useEffect(() => {
    if (msResponse?.type !== 'success') return;
    const { code } = msResponse.params;
    if (!code) return;

    (async () => {
      try {
        const tokens = await exchangeMicrosoftCodeForTokens(
          code,
          msRequest?.codeVerifier,
        );
        addMailAccount({
          id: `outlook-${Date.now()}`,
          type: 'outlook',
          email: tokens.email,
          authStatus: 'authenticated',
        });
        Alert.alert('連携完了', `Outlookアカウント (${tokens.email}) を連携しました`);
      } catch {
        Alert.alert('エラー', 'Outlook連携に失敗しました');
      }
    })();
  }, [msResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Handlers ---------------------------------------------------------- */

  const handleAddGmail = useCallback(async () => {
    if (hasGoogleClientId) {
      await promptAsync();
    } else {
      addMailAccount({
        id: `gmail-${Date.now()}`,
        type: 'gmail',
        email: `user${Math.floor(Math.random() * 1000)}@gmail.com`,
        authStatus: 'authenticated',
      });
      Alert.alert('デモモード', 'デモ用Gmailアカウントを追加しました');
    }
  }, [hasGoogleClientId, promptAsync, addMailAccount]);

  const handleAddOutlook = useCallback(async () => {
    if (hasMicrosoftClientId) {
      await msPromptAsync();
    } else {
      addMailAccount({
        id: `outlook-${Date.now()}`,
        type: 'outlook',
        email: `user${Math.floor(Math.random() * 1000)}@outlook.com`,
        authStatus: 'authenticated',
      });
      Alert.alert('デモモード', 'デモ用Outlookアカウントを追加しました');
    }
  }, [hasMicrosoftClientId, msPromptAsync, addMailAccount]);

  const handleAddAccount = () => {
    Alert.alert('メールアカウントを追加', '連携するメールサービスを選択してください', [
      {
        text: 'Gmail',
        onPress: handleAddGmail,
      },
      {
        text: 'Outlook',
        onPress: handleAddOutlook,
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleRemoveAccount = (account: MailAccount) => {
    Alert.alert(
      'メールアカウントを削除',
      `${account.email}を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeMailAccount(account.id),
        },
      ],
    );
  };

  const handleDeleteData = useCallback(() => {
    Alert.alert(
      'データをリセット',
      'すべてのデータが削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              '本当にすべてのデータを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '完全に削除する',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccountLocally();

                      const subject = encodeURIComponent('データ削除リクエスト');
                      const body = encodeURIComponent('サーバー上のデータの削除をリクエストします。');
                      const mailtoUrl = `mailto:apuriyong500@gmail.com?subject=${subject}&body=${body}`;

                      Alert.alert(
                        '端末データ削除完了',
                        '端末内のデータを削除しました。サーバー上のデータの削除をご希望の場合は、メールでリクエストしてください。',
                        [
                          {
                            text: 'あとで',
                            onPress: () => router.replace('/'),
                          },
                          {
                            text: 'メールで依頼',
                            onPress: async () => {
                              await Linking.openURL(mailtoUrl);
                              router.replace('/');
                            },
                          },
                        ],
                      );
                    } catch {
                      Alert.alert('エラー', 'データ削除に失敗しました');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [router]);

  /* ---- Render ------------------------------------------------------------ */

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Mail Accounts Section ────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              メールアカウント
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {mailAccounts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  name="envelope.badge.fill"
                  size={40}
                  color={colors.icon}
                />
                <ThemedText style={styles.emptyText}>
                  メールアカウントが未登録です
                </ThemedText>
              </View>
            ) : (
              mailAccounts.map((account, index) => {
                const provider = PROVIDER_CONFIG[account.type];
                const status = statusConfig[account.authStatus];
                return (
                  <TouchableOpacity
                    key={account.id}
                    activeOpacity={0.7}
                    onLongPress={() => handleRemoveAccount(account)}
                    style={[
                      styles.mailRow,
                      index < mailAccounts.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: dividerColor,
                      },
                    ]}
                  >
                    {/* Provider icon */}
                    <View
                      style={[
                        styles.providerIcon,
                        { backgroundColor: provider.color + '20' },
                      ]}
                    >
                      <IconSymbol
                        name="envelope.fill"
                        size={20}
                        color={provider.color}
                      />
                    </View>

                    {/* Info */}
                    <View style={styles.mailInfo}>
                      <ThemedText style={styles.mailEmail}>
                        {account.email}
                      </ThemedText>
                      <ThemedText
                        style={[styles.mailProvider, { color: colors.icon }]}
                      >
                        {provider.label}
                      </ThemedText>
                    </View>

                    {/* Status badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.bgColor },
                      ]}
                    >
                      <ThemedText
                        style={[styles.statusText, { color: status.color }]}
                      >
                        {status.label}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Add account button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                { borderColor: colors.tint, borderTopColor: dividerColor },
              ]}
              activeOpacity={0.7}
              onPress={handleAddAccount}
            >
              <IconSymbol name="plus.circle.fill" size={22} color={colors.tint} />
              <ThemedText style={[styles.addButtonText, { color: colors.tint }]}>
                アカウントを追加
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.hintText, { color: colors.icon }]}>
            長押しでアカウントを削除できます
          </ThemedText>

          {/* ── Data Reset ────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.deleteAccountButton}
            activeOpacity={0.7}
            onPress={handleDeleteData}
          >
            <IconSymbol name="trash.fill" size={16} color="#FF3B30" />
            <ThemedText style={styles.deleteAccountText}>
              データをリセット
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.deleteAccountHint, { color: colors.icon }]}>
            すべてのローカルデータが完全に削除されます
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Section header */
  sectionHeader: {
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },

  /* Card */
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  /* Mail rows */
  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mailInfo: {
    flex: 1,
  },
  mailEmail: {
    fontSize: 15,
    fontWeight: '500',
  },
  mailProvider: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
  },

  /* Add button */
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* Hint */
  hintText: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  /* Delete data */
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 6,
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 14,
    opacity: 0.8,
  },
  deleteAccountHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
});
