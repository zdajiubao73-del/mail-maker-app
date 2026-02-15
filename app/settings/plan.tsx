import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
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
import { MONTHLY_PRICE, YEARLY_PRICE, PREMIUM_MONTHLY_LIMIT } from '@/constants/plan';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePlanStore } from '@/store/use-plan-store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPurchasesConfigured,
} from '@/lib/purchases';

const FEATURES = [
  `AIメール自動生成（月${PREMIUM_MONTHLY_LIMIT}回まで）`,
  '全トーン設定',
  '全テンプレート利用可能',
  '履歴保存（無制限）',
  'メール直接送信',
  '広告なし',
];

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentPlan = usePlanStore((s) => s.currentPlan);
  const isSubscribed = usePlanStore((s) => s.isSubscribed);
  const syncWithRevenueCat = usePlanStore((s) => s.syncWithRevenueCat);
  const getTrialDaysRemaining = usePlanStore((s) => s.getTrialDaysRemaining);

  const [packages, setPackages] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';

  const configured = isPurchasesConfigured();

  const monthlyPkg = packages.find((p: any) => p.packageType === 'MONTHLY');
  const annualPkg = packages.find((p: any) => p.packageType === 'ANNUAL');
  const actualMonthlyPrice = monthlyPkg?.product?.price ?? MONTHLY_PRICE;
  const actualYearlyPrice = annualPkg?.product?.price ?? YEARLY_PRICE;

  const monthlyPerYear = Math.round(actualYearlyPrice / 12);
  const savingsPercent = Math.round((1 - actualYearlyPrice / (actualMonthlyPrice * 12)) * 100);

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Status */}
          <View style={styles.statusContainer}>
            <ThemedText style={[styles.statusLabel, { color: colors.textSecondary }]}>
              現在のステータス
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    currentPlan === 'subscribed'
                      ? '#FFD60A'
                      : currentPlan === 'trial'
                        ? '#34C75920'
                        : currentPlan === 'free'
                          ? '#8E8E9320'
                          : '#FF3B3020',
                },
              ]}
            >
              {currentPlan === 'subscribed' && (
                <IconSymbol name="checkmark.seal.fill" size={24} color="#B8860B" />
              )}
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      currentPlan === 'subscribed'
                        ? '#1A1A1A'
                        : currentPlan === 'trial'
                          ? '#34C759'
                          : currentPlan === 'free'
                            ? '#8E8E93'
                            : '#FF3B30',
                  },
                ]}
              >
                {currentPlan === 'subscribed'
                  ? 'サブスクリプション'
                  : currentPlan === 'trial'
                    ? `トライアル中（残り${getTrialDaysRemaining()}日）`
                    : currentPlan === 'free'
                      ? '未登録'
                      : '期限切れ'}
              </ThemedText>
            </View>
            {isSubscribed() && (
              <View style={styles.activeNote}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#34C759" />
                <ThemedText style={styles.activeNoteText}>
                  すべての機能をご利用いただけます
                </ThemedText>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              サブスクリプション機能
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {FEATURES.map((feature, index) => (
              <View
                key={feature}
                style={[
                  styles.featureRow,
                  index < FEATURES.length - 1 && styles.featureRowBorder,
                ]}
              >
                <IconSymbol name="checkmark.circle.fill" size={20} color="#34C759" />
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </View>
            ))}
          </View>

          {/* Pricing */}
          {!isSubscribed() && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  料金プラン
                </ThemedText>
              </View>

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
                    Alert.alert(
                      'サブスクリプション',
                      'App Store での課金準備が完了していません。アプリを再起動するか、しばらくしてからお試しください。',
                    );
                  }
                }}
                disabled={isPurchasing || isRestoring}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <ThemedText style={styles.subscribeButtonText}>
                    サブスクリプションに登録
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* Restore */}
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => {
                  if (configured) {
                    handleRestore();
                  } else {
                    Alert.alert(
                      'サブスクリプション',
                      'App Store での課金準備が完了していません。アプリを再起動するか、しばらくしてからお試しください。',
                    );
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
            </>
          )}

          {/* Manage subscription (for subscribed users) */}
          {isSubscribed() && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
              onPress={() => {
                const url = Platform.select({
                  ios: 'https://apps.apple.com/account/subscriptions',
                  android: 'https://play.google.com/store/account/subscriptions',
                  default: '',
                });
                if (url) Linking.openURL(url);
              }}
            >
              <IconSymbol name="gearshape.fill" size={18} color={colors.tint} />
              <ThemedText style={[styles.manageButtonText, { color: colors.tint }]}>
                サブスクリプションを管理
              </ThemedText>
              <IconSymbol name="chevron.right" size={14} color={colors.icon} />
            </TouchableOpacity>
          )}

          {/* Info */}
          {currentPlan === 'trial' && (
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.tint} />
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                無料トライアル中です（残り{getTrialDaysRemaining()}日）。トライアル終了後、自動的に有料サブスクリプションに移行します。キャンセルはApp Storeの設定から行えます。
              </ThemedText>
            </View>
          )}

          {/* Apple subscription notice */}
          {!isSubscribed() && (
            <ThemedText style={[styles.subscriptionNotice, { color: colors.icon }]}>
              サブスクリプションは確認後にApple IDアカウントに請求されます。現在の期間が終了する24時間前までにキャンセルしない限り、自動更新されます。サブスクリプション管理・キャンセルはApple IDの設定から行えます。
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

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

  /* Status */
  statusContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
  },
  statusBadgeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  activeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  activeNoteText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },

  /* Section header */
  sectionHeader: {
    marginTop: 28,
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

  /* Features */
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },

  /* Pricing */
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
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

  /* CTA */
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
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

  /* Restore */
  restoreButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Manage */
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  manageButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },

  /* Info card */
  infoCard: {
    flexDirection: 'row',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  /* Subscription notice */
  subscriptionNotice: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
  },
});
