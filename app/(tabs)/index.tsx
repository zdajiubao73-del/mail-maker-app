import { useRouter } from 'expo-router';
import {
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
import { useMailStore } from '@/store/use-mail-store';

type ActionCard = {
  title: string;
  subtitle: string;
  description: string;
  icon: 'paperplane.fill' | 'slider.horizontal.3' | 'doc.text.fill';
  route: '/create/simple' | '/create/detailed' | '/templates';
  accentColor: string;
  accentBg: string;
};

const TIPS = [
  { icon: 'lightbulb.fill' as const, text: '「かんたん作成」なら目的を選ぶだけで30秒でメール完成' },
  { icon: 'person.fill' as const, text: '連絡先に相手の関係性を登録すると敬語レベルを自動調整' },
  { icon: 'clock.arrow.circlepath' as const, text: '履歴からワンタップで過去のメールを再利用できます' },
  { icon: 'tray.full.fill' as const, text: 'よく使う設定はプリセットに保存して次回からワンタップで呼び出し' },
  { icon: 'brain.head.profile' as const, text: '学習データ管理であなたの文体をAIが学習し、より自然なメールに' },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const history = useMailStore((s) => s.history);
  const recentHistory = history.slice(0, 2);

  const ACTION_CARDS: ActionCard[] = [
    {
      title: 'かんたん作成',
      subtitle: '最短30秒',
      description: '目的を選ぶだけでAIが最適なメールを作成',
      icon: 'paperplane.fill',
      route: '/create/simple',
      accentColor: colors.accent1,
      accentBg: colors.accent1 + '15',
    },
    {
      title: 'こだわり作成',
      subtitle: '細かくカスタマイズ',
      description: '相手・トーン・長さを指定して理想のメールに',
      icon: 'slider.horizontal.3',
      route: '/create/detailed',
      accentColor: colors.accent2,
      accentBg: colors.accent2 + '15',
    },
    {
      title: 'テンプレートから作成',
      subtitle: 'すぐ使える定型文',
      description: 'シーン別テンプレートで効率的にメール作成',
      icon: 'doc.text.fill',
      route: '/templates',
      accentColor: colors.accent3,
      accentBg: colors.accent3 + '15',
    },
  ];

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'sent': return '送信済み';
      case 'draft': return '下書き';
      default: return '生成済み';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': return colors.success;
      case 'draft': return colors.warning;
      default: return colors.info;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Label */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            メールを作成する
          </ThemedText>
        </View>

        {/* Action Cards */}
        <View style={styles.cardsContainer}>
          {ACTION_CARDS.map((card) => (
            <TouchableOpacity
              key={card.route}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.65}
              onPress={() => router.push(card.route as never)}
              accessibilityRole="button"
              accessibilityLabel={`${card.title} - ${card.description}`}
            >
              {/* Accent strip */}
              <View style={[styles.cardAccentStrip, { backgroundColor: card.accentColor }]} />

              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: card.accentBg },
                  ]}
                >
                  <IconSymbol
                    name={card.icon}
                    size={24}
                    color={card.accentColor}
                  />
                </View>

                <View style={styles.cardTextContainer}>
                  <View style={styles.cardTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {card.title}
                    </ThemedText>
                    <View style={[styles.cardSubtitleBadge, { backgroundColor: card.accentBg }]}>
                      <ThemedText style={[styles.cardSubtitleText, { color: card.accentColor }]}>
                        {card.subtitle}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    {card.description}
                  </ThemedText>
                </View>

                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent History Section */}
        {recentHistory.length > 0 && (
          <>
            <View style={styles.sectionHeader2}>
              <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                最近のメール
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history' as never)}
                accessibilityRole="button"
                accessibilityLabel="すべての履歴を表示"
              >
                <ThemedText style={[styles.seeAllText, { color: colors.tint }]}>
                  すべて見る
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.historyContainer}>
              {recentHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.65}
                  onPress={() => router.push({ pathname: '/history/detail', params: { id: item.id } } as never)}
                >
                  <View style={styles.historyCardContent}>
                    <View style={styles.historyCardLeft}>
                      <View style={[styles.historyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                        <IconSymbol
                          name="envelope.fill"
                          size={16}
                          color={colors.icon}
                        />
                      </View>
                      <View style={styles.historyTextContainer}>
                        <ThemedText style={styles.historySubject} numberOfLines={1}>
                          {item.subject || '件名なし'}
                        </ThemedText>
                        <View style={styles.historyMeta}>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '18' }]}>
                            <ThemedText style={[styles.statusText, { color: statusColor(item.status) }]}>
                              {statusLabel(item.status)}
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.historyDate, { color: colors.textSecondary }]}>
                            {formatDate(item.createdAt)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color={colors.icon} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Tips Section */}
        <View style={styles.sectionHeader2}>
          <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            使いこなしヒント
          </ThemedText>
        </View>

        <View style={[styles.tipsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TIPS.map((tip, index) => (
            <View
              key={index}
              style={[
                styles.tipRow,
                index < TIPS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.tipIconContainer, { backgroundColor: colors.primaryMuted }]}>
                <IconSymbol name={tip.icon} size={14} color={colors.tint} />
              </View>
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                {tip.text}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader2: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardAccentStrip: {
    height: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardSubtitleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Recent History
  historyContainer: {
    paddingHorizontal: 24,
    gap: 8,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  historyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyTextContainer: {
    flex: 1,
  },
  historySubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
  },

  // Tips
  tipsContainer: {
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  tipIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
