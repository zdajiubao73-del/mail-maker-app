import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
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

/** Auth status badge config */
const STATUS_CONFIG: Record<
  AuthStatus,
  { label: string; color: string; bgColor: string }
> = {
  authenticated: { label: '認証済み', color: '#34C759', bgColor: '#34C75920' },
  unauthenticated: {
    label: '未認証',
    color: '#FF9500',
    bgColor: '#FF950020',
  },
  expired: { label: '期限切れ', color: '#FF3B30', bgColor: '#FF3B3020' },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const addMailAccount = useAuthStore((s) => s.addMailAccount);
  const removeMailAccount = useAuthStore((s) => s.removeMailAccount);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  /* ---- Handlers ---------------------------------------------------------- */

  const handleAddAccount = () => {
    Alert.alert('アカウントを追加', '連携するメールサービスを選択してください', [
      {
        text: 'Gmail',
        onPress: () => {
          Alert.alert('準備中', 'OAuth認証画面は準備中です');
          // Mock: add a demo account
          addMailAccount({
            id: `gmail-${Date.now()}`,
            type: 'gmail',
            email: `user${Math.floor(Math.random() * 1000)}@gmail.com`,
            authStatus: 'authenticated',
          });
        },
      },
      {
        text: 'Outlook',
        onPress: () => {
          Alert.alert('準備中', 'OAuth認証画面は準備中です');
          addMailAccount({
            id: `outlook-${Date.now()}`,
            type: 'outlook',
            email: `user${Math.floor(Math.random() * 1000)}@outlook.com`,
            authStatus: 'authenticated',
          });
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleRemoveAccount = (account: MailAccount) => {
    Alert.alert(
      'アカウントを削除',
      `${account.email} の連携を解除しますか？`,
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

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしてもよろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  /* ---- Render ------------------------------------------------------------ */

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>ログインしていません</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isPremium = user.plan === 'premium';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Section ──────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              プロフィール
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {/* Display name */}
            <View style={styles.row}>
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: colors.tint + '20' },
                ]}
              >
                <IconSymbol
                  name="person.fill"
                  size={28}
                  color={colors.tint}
                />
              </View>
              <View style={styles.rowText}>
                <ThemedText type="defaultSemiBold">
                  {user.displayName}
                </ThemedText>
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: isPremium ? '#FFD60A20' : '#8E8E9320',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.planBadgeText,
                      { color: isPremium ? '#FFD60A' : '#8E8E93' },
                    ]}
                  >
                    {isPremium ? 'プレミアム' : '無料プラン'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* ── Mail Accounts Section ────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              メール連携
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {user.mailAccounts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  name="envelope.badge.fill"
                  size={40}
                  color={colors.icon}
                />
                <ThemedText style={styles.emptyText}>
                  連携済みのアカウントはありません
                </ThemedText>
              </View>
            ) : (
              user.mailAccounts.map((account, index) => {
                const provider = PROVIDER_CONFIG[account.type];
                const status = STATUS_CONFIG[account.authStatus];
                return (
                  <TouchableOpacity
                    key={account.id}
                    activeOpacity={0.7}
                    onLongPress={() => handleRemoveAccount(account)}
                    style={[
                      styles.mailRow,
                      index < user.mailAccounts.length - 1 && {
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

          {/* ── Account Actions ──────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              アカウント操作
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color="#FF3B30" />
              <ThemedText style={styles.logoutText}>ログアウト</ThemedText>
            </TouchableOpacity>
          </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Profile row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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

  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
