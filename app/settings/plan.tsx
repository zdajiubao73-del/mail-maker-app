import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
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
import { useContentMaxWidth } from '@/hooks/use-responsive';

export default function PlanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentPlan = usePlanStore((s) => s.currentPlan);
  const isSubscribed = usePlanStore((s) => s.isSubscribed);
  const syncWithRevenueCat = usePlanStore((s) => s.syncWithRevenueCat);
  const getTrialDaysRemaining = usePlanStore((s) => s.getTrialDaysRemaining);

  const contentMaxWidth = useContentMaxWidth();
  const [packages, setPackages] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [trialPeriodText, setTrialPeriodText] = useState('14日間');
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';

  const configured = isPurchasesConfigured();

  const monthlyPkg = packages.find((p: any) => p.packageType === 'MONTHLY');
  const annualPkg = packages.find((p: any) => p.packageType === 'ANNUAL');
  const actualYearlyPrice = annualPkg?.product?.price ?? YEARLY_PRICE;
  const monthlyPerYear = Math.round(actualYearlyPrice / 12);

  const features = useMemo(() => [
    `月${PREMIUM_MONTHLY_LIMIT}回までメール生成`,
    '全テンプレート利用可能',
    '直接メール送信',
    '学習データ機能',
  ], []);

  useEffect(() => {
    if (!configured) {
      setIsLoadingPackages(false);
      return;
    }
    (async () => {
      setIsLoadingPackages(true);
      try {
        const pkgs = await getOfferings();
        setPackages(pkgs);

        // 実際のトライアル期間を製品情報から取得
        const monthlyProduct = pkgs.find((p: any) => p.packageType === 'MONTHLY') as any;
        const annualProduct = pkgs.find((p: any) => p.packageType === 'ANNUAL') as any;
        const introPrice = monthlyProduct?.product?.introPrice ?? annualProduct?.product?.introPrice;
        if (introPrice?.periodNumberOfUnits && introPrice?.periodUnit) {
          const units = introPrice.periodNumberOfUnits;
          const unit = introPrice.periodUnit as string;
          const unitLabel =
            unit === 'DAY' ? '日間' :
            unit === 'WEEK' ? '週間' :
            unit === 'MONTH' ? 'ヶ月間' :
            '年間';
          setTrialPeriodText(`${units}${unitLabel}`);
        }
      } finally {
        setIsLoadingPackages(false);
      }
    })();
  }, [configured]);

  const handlePurchase = useCallback(async (pkg: any) => {
    setIsPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        await syncWithRevenueCat();
        Alert.alert('購入完了', 'プレミアムプランへのアップグレードが完了しました');
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
        Alert.alert('復元完了', '購入を復元しました');
      } else if (result.success) {
        Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
      } else {
        Alert.alert('エラー', result.error ?? '復元に失敗しました');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [syncWithRevenueCat]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : undefined,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Status */}
          <View style={styles.statusContainer}>
            <ThemedText style={[styles.statusLabel, { color: colors.textSecondary }]}>
              現在のプラン
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
                          : '#FF3B30',
                  },
                ]}
              >
                {currentPlan === 'subscribed'
                  ? 'プレミアム'
                  : currentPlan === 'trial'
                    ? 'トライアル'
                    : '未登録'}
              </ThemedText>
            </View>
            {isSubscribed() && (
              <View style={styles.activeNote}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#34C759" />
                <ThemedText style={styles.activeNoteText}>
                  すべての機能が利用可能です
                </ThemedText>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              プレミアム機能
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {features.map((feature, index) => (
              <View
                key={feature}
                style={[
                  styles.featureRow,
                  index < features.length - 1 && styles.featureRowBorder,
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
                  <View style={styles.trialBadge}>
                    <ThemedText style={styles.trialBadgeText}>
                      {`${trialPeriodText}無料`}
                    </ThemedText>
                  </View>
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
                  <View style={styles.trialBadge}>
                    <ThemedText style={styles.trialBadgeText}>
                      {`${trialPeriodText}無料`}
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
                    {`月あたり ¥${monthlyPerYear.toLocaleString()}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Trial info */}
              <View style={[styles.trialInfoCard, { backgroundColor: '#34C75910' }]}>
                <IconSymbol name="gift.fill" size={20} color="#34C759" />
                <View style={styles.trialInfoContent}>
                  <ThemedText style={styles.trialInfoTitle}>
                    {`最初の${trialPeriodText}は無料!`}
                  </ThemedText>
                  <ThemedText style={[styles.trialInfoText, { color: colors.textSecondary }]}>
                    どちらのプランも{trialPeriodText}の無料トライアル付き。期間中はすべての機能をお試しいただけます。トライアル期間中にキャンセルした場合、料金は一切かかりません。トライアル終了後、選択したプランの料金で自動更新されます。
                  </ThemedText>
                </View>
              </View>

              {/* Loading state */}
              {isLoadingPackages && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    プラン情報を読み込み中...
                  </ThemedText>
                </View>
              )}

              {/* Error state: configured but no packages */}
              {!isLoadingPackages && configured && packages.length === 0 && (
                <View style={[styles.errorCard, { backgroundColor: '#FF3B3010' }]}>
                  <IconSymbol name="exclamationmark.triangle" size={20} color="#FF3B30" />
                  <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                    サブスクリプション商品を読み込めませんでした。ネットワーク接続を確認して、もう一度お試しください。
                  </ThemedText>
                </View>
              )}

              {/* CTA */}
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  (isPurchasing || isRestoring || isLoadingPackages) && styles.buttonDisabled,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (configured && packages.length > 0) {
                    const annual = packages.find((p: { packageType: string }) => p.packageType === 'ANNUAL');
                    handlePurchase(annual ?? packages[0]);
                  } else if (!configured) {
                    Alert.alert(
                      'サブスクリプション',
                      '課金システムの初期化に失敗しました。アプリを再起動してお試しください。',
                    );
                  } else {
                    Alert.alert(
                      'サブスクリプション',
                      '商品情報の読み込みに失敗しました。ネットワーク接続を確認して、もう一度お試しください。',
                    );
                  }
                }}
                disabled={isPurchasing || isRestoring || isLoadingPackages}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <ThemedText style={styles.subscribeButtonText}>
                    {`${trialPeriodText}無料で試す`}
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
                      '準備中です。しばらくお待ちください。',
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
                    購入を復元
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
                {`トライアル期間中です（残り${getTrialDaysRemaining()}日）。期間終了後はサブスクリプションが自動開始されます。`}
              </ThemedText>
            </View>
          )}

          {/* Apple subscription notice */}
          {!isSubscribed() && (
            <ThemedText style={[styles.subscriptionNotice, { color: colors.icon }]}>
              お支払いは購入確認時にApple IDアカウントに課金されます。最初の{trialPeriodText}は無料トライアル期間です。トライアル期間中にキャンセルすれば料金は発生しません。サブスクリプションは自動更新されます。現在の期間が終了する24時間前までに自動更新をオフにしない限り、アカウントに更新料金が課金されます。購入後、App Storeの「アカウント設定」からサブスクリプションの管理および自動更新のオフが可能です。ご利用にあたっては利用規約（EULA）およびプライバシーポリシーに同意いただく必要があります。
            </ThemedText>
          )}

          {/* Legal links */}
          <View style={styles.legalLinks}>
            <TouchableOpacity
              onPress={() => router.push('/settings/terms')}
              activeOpacity={0.6}
            >
              <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
                利用規約（EULA）
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.legalSeparator, { color: colors.textSecondary }]}>|</ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/settings/privacy')}
              activeOpacity={0.6}
            >
              <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
                プライバシーポリシー
              </ThemedText>
            </TouchableOpacity>
          </View>
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
  trialBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trialBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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

  /* Trial info */
  trialInfoCard: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  trialInfoContent: {
    flex: 1,
  },
  trialInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  trialInfoText: {
    fontSize: 13,
    lineHeight: 19,
  },

  /* Loading / Error */
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorCard: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
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

  /* Legal links */
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  legalLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  legalSeparator: {
    fontSize: 13,
  },
});
