import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { MONTHLY_PRICE, YEARLY_PRICE } from '@/constants/plan';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePlanStore } from '@/store/use-plan-store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPurchasesConfigured,
} from '@/lib/purchases';

type Props = {
  onClose?: () => void;
};

export default function PaywallScreen({ onClose }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const currentPlan = usePlanStore((s) => s.currentPlan);
  const syncWithRevenueCat = usePlanStore((s) => s.syncWithRevenueCat);

  const [packages, setPackages] = useState<any[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [trialPeriodText, setTrialPeriodText] = useState('14日間');

  const FEATURES = useMemo(() => [
    'メール生成が無制限',
    'すべてのテンプレートが使える',
    '直接メール送信',
    '優先サポート',
    '今後の新機能も使い放題',
  ], []);

  // トライアル情報は常に表示（両プランに無料トライアル付き）
  const showTrialOffer = true;

  const configured = isPurchasesConfigured();

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        const pkgs = await getOfferings();
        if (cancelled) return;
        setPackages(pkgs);

        // 実際のトライアル期間を製品情報から取得
        const monthlyProduct = pkgs.find((p: any) => p.packageType === 'MONTHLY') as any;
        const annualProduct = pkgs.find((p: any) => p.packageType === 'ANNUAL') as any;
        const introPrice = monthlyProduct?.product?.introPrice ?? annualProduct?.product?.introPrice;
        if (introPrice?.periodNumberOfUnits && introPrice?.periodUnit) {
          const units = introPrice.periodNumberOfUnits;
          const unit = introPrice.periodUnit as string;
          const unitLabel = unit === 'DAY' ? '日間' : unit === 'WEEK' ? '週間' : unit === 'MONTH' ? 'ヶ月' : '年';
          setTrialPeriodText(`${units}${unitLabel}`);
        }
      } catch {
        // Error already handled inside getOfferings
      }
    })();
    return () => { cancelled = true; };
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
        Alert.alert('復元完了', 'プレミアムプランが復元されました');
      } else if (result.success) {
        Alert.alert('復元結果', '復元可能な購入が見つかりませんでした');
      } else {
        Alert.alert('エラー', result.error ?? '復元に失敗しました');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [syncWithRevenueCat]);

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
          {showTrialOffer ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.tint + '15' }]}>
                <IconSymbol name="star.fill" size={48} color={colors.tint} />
              </View>
              <ThemedText type="title" style={styles.title}>
                {`${trialPeriodText}無料トライアル`}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                すべての機能を無料でお試しいただけます
              </ThemedText>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.danger + '15' }]}>
                <IconSymbol name="clock.fill" size={48} color={colors.danger} />
              </View>
              <ThemedText type="title" style={styles.title}>
                {currentPlan === 'expired' ? 'サブスクリプション期限切れ' : 'プレミアムに登録'}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                アプリを利用するにはプレミアムプランへの登録が必要です
              </ThemedText>
            </>
          )}
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: cardBg }]}>
          <ThemedText type="defaultSemiBold" style={styles.featuresTitle}>
            すべての機能が使い放題
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
            {showTrialOffer && (
              <View style={styles.trialBadge}>
                <ThemedText style={styles.trialBadgeText}>
                  {`${trialPeriodText}無料`}
                </ThemedText>
              </View>
            )}
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
            {showTrialOffer ? (
              <View style={styles.trialBadge}>
                <ThemedText style={styles.trialBadgeText}>
                  {`${trialPeriodText}無料`}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.saveBadge}>
                <ThemedText style={styles.saveBadgeText}>
                  {`${savingsPercent}%OFF`}
                </ThemedText>
              </View>
            )}
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
              {`月あたり¥${monthlyPerYear.toLocaleString()}`}
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
              Alert.alert('エラー', '決済の準備中です。しばらくお待ちください。');
            }
          }}
          disabled={isPurchasing || isRestoring}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <ThemedText style={styles.subscribeButtonText}>
              {showTrialOffer ? `${trialPeriodText}無料で始める` : '登録する'}
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Auto-renewal note */}
        {showTrialOffer && (
          <ThemedText style={[styles.autoRenewNote, { color: colors.textSecondary }]}>
            どちらのプランも最初の{trialPeriodText}は無料です。トライアル期間中にキャンセルした場合、料金は一切かかりません。トライアル終了後、選択したプランの料金で自動的にサブスクリプションが開始されます。いつでもキャンセル可能です。
          </ThemedText>
        )}

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => {
            if (configured) {
              handleRestore();
            } else {
              Alert.alert('エラー', '決済の準備中です。しばらくお待ちください。');
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

        {/* Subscription details (required by Apple) */}
        <View style={styles.subscriptionDetails}>
          <ThemedText style={[styles.subscriptionDetailText, { color: colors.textSecondary }]}>
            {'メールメーカー プレミアム（自動更新サブスクリプション）'}
          </ThemedText>
          <ThemedText style={[styles.subscriptionDetailText, { color: colors.textSecondary }]}>
            {`月額プラン: ${monthlyPkg?.product?.priceString ?? '¥500'}/月`}
          </ThemedText>
          <ThemedText style={[styles.subscriptionDetailText, { color: colors.textSecondary }]}>
            {`年額プラン: ${annualPkg?.product?.priceString ?? '¥5,000'}/年`}
          </ThemedText>
          <ThemedText style={[styles.subscriptionDetailText, { color: colors.textSecondary }]}>
            {'お支払いはApple IDに請求されます。サブスクリプションは現在の期間終了の24時間前までにキャンセルしない限り自動更新されます。'}
          </ThemedText>
        </View>

        {/* Legal links (required by Apple) */}
        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => {
              if (onClose) onClose();
              router.push('/settings/terms');
            }}
            activeOpacity={0.6}
          >
            <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
              利用規約
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.legalSeparator, { color: colors.textSecondary }]}>|</ThemedText>
          <TouchableOpacity
            onPress={() => {
              if (onClose) onClose();
              router.push('/settings/privacy');
            }}
            activeOpacity={0.6}
          >
            <ThemedText style={[styles.legalLinkText, { color: colors.tint }]}>
              プライバシーポリシー
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Close */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <ThemedText style={[styles.restoreButtonText, { color: colors.textSecondary }]}>
              閉じる
            </ThemedText>
          </TouchableOpacity>
        )}
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
  subscriptionDetails: {
    marginTop: 20,
    paddingHorizontal: 8,
    gap: 4,
  },
  subscriptionDetailText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  legalLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  legalSeparator: {
    fontSize: 13,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
});
