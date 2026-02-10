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
import { usePlanStore } from '@/store/use-plan-store';

/* -------------------------------------------------------------------------- */
/*  Plan feature data                                                          */
/* -------------------------------------------------------------------------- */

type Feature = {
  label: string;
  free: string;
  premium: string;
};

const FEATURES: Feature[] = [
  { label: 'メール生成回数', free: '1日5回まで', premium: '無制限' },
  { label: 'トーン設定', free: '基本トーン', premium: '全トーン利用可能' },
  {
    label: 'テンプレート',
    free: '基本テンプレート',
    premium: '全テンプレート利用可能',
  },
  { label: '履歴保存', free: '直近10件', premium: '無制限' },
  { label: '広告', free: 'あり', premium: 'なし' },
  { label: 'メール直接送信', free: '—', premium: '対応' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isPremium = usePlanStore((s) => s.isPremium);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const subtleBg = colorScheme === 'dark' ? '#2C2F33' : '#F2F2F7';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  const handleUpgrade = () => {
    Alert.alert('準備中', 'App Store課金は準備中です');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Current Plan Badge ───────────────────────────── */}
          <View style={styles.currentPlanContainer}>
            <ThemedText style={[styles.currentPlanLabel, { color: colors.icon }]}>
              現在のプラン
            </ThemedText>
            <View
              style={[
                styles.largeBadge,
                {
                  backgroundColor: isPremium() ? '#FFD60A' : subtleBg,
                },
              ]}
            >
              {isPremium() && (
                <IconSymbol name="crown.fill" size={24} color="#B8860B" />
              )}
              <ThemedText
                style={[
                  styles.largeBadgeText,
                  { color: isPremium() ? '#1A1A1A' : colors.text },
                ]}
              >
                {isPremium() ? 'プレミアム' : '無料プラン'}
              </ThemedText>
            </View>
            {isPremium() && (
              <View style={styles.premiumCheck}>
                <IconSymbol name="checkmark.seal.fill" size={18} color="#34C759" />
                <ThemedText style={styles.premiumCheckText}>
                  すべての機能をご利用いただけます
                </ThemedText>
              </View>
            )}
          </View>

          {/* ── Comparison Table ─────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              プラン比較
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {/* Table header */}
            <View
              style={[
                styles.tableHeader,
                { borderBottomColor: dividerColor },
              ]}
            >
              <ThemedText style={[styles.tableHeaderCell, styles.featureCol]}>
                機能
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, styles.planCol]}>
                無料
              </ThemedText>
              <ThemedText
                style={[
                  styles.tableHeaderCell,
                  styles.planCol,
                  { color: '#FFD60A' },
                ]}
              >
                プレミアム
              </ThemedText>
            </View>

            {/* Table rows */}
            {FEATURES.map((feature, index) => (
              <View
                key={feature.label}
                style={[
                  styles.tableRow,
                  index < FEATURES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: dividerColor,
                  },
                ]}
              >
                <ThemedText style={[styles.tableCell, styles.featureCol]}>
                  {feature.label}
                </ThemedText>
                <ThemedText
                  style={[styles.tableCell, styles.planCol, { color: colors.icon }]}
                >
                  {feature.free}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.tableCell,
                    styles.planCol,
                    { color: colors.tint, fontWeight: '600' },
                  ]}
                >
                  {feature.premium}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* ── Pricing ──────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              料金プラン
            </ThemedText>
          </View>

          <View style={styles.pricingRow}>
            {/* Monthly */}
            <View
              style={[
                styles.priceCard,
                { backgroundColor: cardBg },
              ]}
            >
              <ThemedText style={[styles.priceLabel, { color: colors.icon }]}>
                月額プラン
              </ThemedText>
              <View style={styles.priceAmountRow}>
                <ThemedText type="title" style={styles.priceAmount}>
                  ¥980
                </ThemedText>
                <ThemedText style={[styles.pricePeriod, { color: colors.icon }]}>
                  /月
                </ThemedText>
              </View>
            </View>

            {/* Yearly */}
            <View
              style={[
                styles.priceCard,
                styles.priceCardHighlight,
                { backgroundColor: cardBg },
              ]}
            >
              <View style={styles.saveBadge}>
                <ThemedText style={styles.saveBadgeText}>お得!</ThemedText>
              </View>
              <ThemedText style={[styles.priceLabel, { color: colors.icon }]}>
                年額プラン
              </ThemedText>
              <View style={styles.priceAmountRow}>
                <ThemedText type="title" style={styles.priceAmount}>
                  ¥7,800
                </ThemedText>
                <ThemedText style={[styles.pricePeriod, { color: colors.icon }]}>
                  /年
                </ThemedText>
              </View>
              <ThemedText style={[styles.priceNote, { color: '#34C759' }]}>
                月あたり¥650（34%お得）
              </ThemedText>
            </View>
          </View>

          {/* ── CTA Button ───────────────────────────────────── */}
          {isPremium() ? (
            <View style={styles.premiumActiveContainer}>
              <IconSymbol name="checkmark.circle.fill" size={28} color="#34C759" />
              <ThemedText style={styles.premiumActiveText}>
                現在のプラン: プレミアム
              </ThemedText>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              activeOpacity={0.8}
              onPress={handleUpgrade}
            >
              <IconSymbol name="crown.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.upgradeButtonText}>
                プレミアムにアップグレード
              </ThemedText>
            </TouchableOpacity>
          )}
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

  /* Current plan */
  currentPlanContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  currentPlanLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  largeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
  },
  largeBadgeText: {
    fontSize: 22,
    fontWeight: '800',
  },
  premiumCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  premiumCheckText: {
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

  /* Table */
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tableCell: {
    fontSize: 13,
    lineHeight: 18,
  },
  featureCol: {
    flex: 2,
  },
  planCol: {
    flex: 2,
    textAlign: 'center',
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
  upgradeButton: {
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
  upgradeButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '700',
  },

  /* Premium active */
  premiumActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 8,
  },
  premiumActiveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#34C759',
  },
});
