import { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { MONTHLY_PRICE, YEARLY_PRICE } from '@/constants/plan';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/use-auth-store';
import { usePlanStore } from '@/store/use-plan-store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPurchasesConfigured,
} from '@/lib/purchases';
import { clearTokens } from '@/lib/google-auth';

const FEATURES = [
  'AIメール自動生成（無制限）',
  '全トーン設定',
  '全テンプレート利用可能',
  '履歴保存（無制限）',
  'メール直接送信',
  '広告なし',
];

export default function PaywallScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentPlan = usePlanStore((s) => s.currentPlan);
  const syncWithRevenueCat = usePlanStore((s) => s.syncWithRevenueCat);
  const logout = useAuthStore((s) => s.logout);

  // 新規ユーザー: まだサブスクリプション/トライアルを開始していない
  const isNewUser = currentPlan === 'free';

  const [packages, setPackages] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const configured = isPurchasesConfigured();

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';

  useEffect(() => {
    if (!configured) return;
    (async () => {
      const pkgs = await getOfferings();
      setPackages(pkgs);
    })();
  }, [configured]);

  const handlePurchase = useCallback(async (pkg: any) => {
    setIsPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        await syncWithRevenueCat();
        Alert.alert('購入完了', 'サブスクリプションが有効になりました。');
      } else if (result.error && result.error !== 'cancelled') {
        Alert.alert('エラー', result.error);
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [syncWithRevenueCat]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.isPremium) {
        await syncWithRevenueCat();
        Alert.alert('復元完了', 'サブスクリプションを復元しました。');
      } else if (result.success) {
        Alert.alert('復元結果', '復元可能な購入が見つかりませんでした。');
      } else {
        Alert.alert('エラー', result.error ?? '購入の復元に失敗しました。');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [syncWithRevenueCat]);

  const handleLogout = useCallback(() => {
    Alert.alert('ログアウト', 'ログアウトしてもよろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          logout();
        },
      },
    ]);
  }, [logout]);

  const monthlyPkg = packages.find((p: any) => p.packageType === 'MONTHLY');
  const annualPkg = packages.find((p: any) => p.packageType === 'ANNUAL');
  const actualMonthlyPrice = monthlyPkg?.product?.price ?? MONTHLY_PRICE;
  const actualYearlyPrice = annualPkg?.product?.price ?? YEARLY_PRICE;

  const monthlyPerYear = Math.round(actualYearlyPrice / 12);
  const savingsPercent = Math.round((1 - actualYearlyPrice / (actualMonthlyPrice * 12)) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {isNewUser ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.tint + '15' }]}>
                <IconSymbol name="star.fill" size={48} color={colors.tint} />
              </View>
              <ThemedText type="title" style={styles.title}>
                14日間無料でプレミアムを体験
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                すべての機能を無料でお試しください{'\n'}期間中はいつでもキャンセル可能です
              </ThemedText>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.danger + '15' }]}>
                <IconSymbol name="clock.fill" size={48} color={colors.danger} />
              </View>
              <ThemedText type="title" style={styles.title}>
                無料トライアルが終了しました
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                サブスクリプションに登録して{'\n'}すべての機能をご利用ください
              </ThemedText>
            </>
          )}
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: cardBg }]}>
          <ThemedText type="defaultSemiBold" style={styles.featuresTitle}>
            全機能が利用可能
          </ThemedText>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#34C759" />
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingRow}>
          <TouchableOpacity
            style={[styles.priceCard, { backgroundColor: cardBg }]}
            onPress={() => {
              if (configured && packages.length > 0) {
                const monthly = packages.find((p: { packageType: string }) => p.packageType === 'MONTHLY');
                if (monthly) handlePurchase(monthly);
              }
            }}
            disabled={isPurchasing || !(configured && packages.length > 0)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.priceLabel, { color: colors.textSecondary }]}>
              月額プラン
            </ThemedText>
            <View style={styles.priceAmountRow}>
              <ThemedText type="title" style={styles.priceAmount}>
                {monthlyPkg?.product?.priceString ?? `¥${MONTHLY_PRICE.toLocaleString()}`}
              </ThemedText>
              <ThemedText style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                /月
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceCard,
              styles.priceCardHighlight,
              { backgroundColor: cardBg },
            ]}
            onPress={() => {
              if (configured && packages.length > 0) {
                const annual = packages.find((p: { packageType: string }) => p.packageType === 'ANNUAL');
                if (annual) handlePurchase(annual);
              }
            }}
            disabled={isPurchasing || !(configured && packages.length > 0)}
            activeOpacity={0.7}
          >
            <View style={styles.saveBadge}>
              <ThemedText style={styles.saveBadgeText}>
                {savingsPercent}%お得
              </ThemedText>
            </View>
            <ThemedText style={[styles.priceLabel, { color: colors.textSecondary }]}>
              年額プラン
            </ThemedText>
            <View style={styles.priceAmountRow}>
              <ThemedText type="title" style={styles.priceAmount}>
                {annualPkg?.product?.priceString ?? `¥${YEARLY_PRICE.toLocaleString()}`}
              </ThemedText>
              <ThemedText style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                /年
              </ThemedText>
            </View>
            <ThemedText style={[styles.priceNote, { color: '#34C759' }]}>
              月あたり¥{monthlyPerYear.toLocaleString()}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (isPurchasing || isRestoring) && styles.buttonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={() => {
            if (configured && packages.length > 0) {
              const annual = packages.find((p: { packageType: string }) => p.packageType === 'ANNUAL');
              handlePurchase(annual ?? packages[0]);
            } else {
              Alert.alert('準備中', '課金システムの準備中です。しばらくお待ちください。');
            }
          }}
          disabled={isPurchasing || isRestoring}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <ThemedText style={styles.subscribeButtonText}>
              {isNewUser ? '14日間無料で始める' : 'サブスクリプションに登録'}
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Auto-renewal note */}
        {isNewUser && (
          <ThemedText style={[styles.autoRenewNote, { color: colors.textSecondary }]}>
            無料トライアル終了後、自動的に課金されます。{'\n'}
            いつでもApp Storeの設定からキャンセルできます。
          </ThemedText>
        )}

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => {
            if (configured) {
              handleRestore();
            } else {
              Alert.alert('準備中', '課金システムの準備中です。しばらくお待ちください。');
            }
          }}
          disabled={isRestoring}
          activeOpacity={0.6}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <ThemedText style={[styles.restoreButtonText, { color: colors.textSecondary }]}>
              購入を復元する
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <ThemedText style={styles.logoutButtonText}>
            ログアウト
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 15,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  priceCardHighlight: {
    borderWidth: 2,
    borderColor: '#FFD60A',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  priceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  pricePeriod: {
    fontSize: 14,
    marginLeft: 2,
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD60A',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  autoRenewNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
  },
  restoreButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
});
