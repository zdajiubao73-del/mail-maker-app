import { useRouter } from 'expo-router';
import {
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

type ActionCard = {
  title: string;
  subtitle: string;
  icon: 'paperplane.fill' | 'slider.horizontal.3' | 'doc.text.fill';
  route: '/create/simple' | '/create/detailed' | '/templates';
};

const ACTION_CARDS: ActionCard[] = [
  {
    title: 'かんたん作成',
    subtitle: '目的を選んですぐ生成',
    icon: 'paperplane.fill',
    route: '/create/simple',
  },
  {
    title: 'こだわり作成',
    subtitle: '細かく設定して生成',
    icon: 'slider.horizontal.3',
    route: '/create/detailed',
  },
  {
    title: 'テンプレートから作成',
    subtitle: 'テンプレート一覧から選択',
    icon: 'doc.text.fill',
    route: '/templates',
  },
];

const FREE_DAILY_LIMIT = 5;

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useAuthStore((s) => s.user);
  const canGenerate = useAuthStore((s) => s.canGenerate);

  const remainingCount = user
    ? FREE_DAILY_LIMIT - user.dailyGenerationCount
    : 0;
  const isFreeUser = user?.plan === 'free';

  const cardBackground = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const cardShadowColor = colorScheme === 'dark' ? '#000' : '#000';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.appTitle}>
              AIメール作成
            </ThemedText>
            {isFreeUser && (
              <View
                style={[
                  styles.remainingBadge,
                  {
                    backgroundColor: canGenerate()
                      ? colors.tint + '20'
                      : '#FF3B3020',
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.remainingText,
                    {
                      color: canGenerate() ? colors.tint : '#FF3B30',
                    },
                  ]}
                >
                  本日の残り回数: {Math.max(0, remainingCount)}/{FREE_DAILY_LIMIT}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Action Cards */}
          <View style={styles.cardsContainer}>
            {ACTION_CARDS.map((card) => (
              <TouchableOpacity
                key={card.route}
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBackground,
                    shadowColor: cardShadowColor,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(card.route as never)}
              >
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: colors.tint + '15' },
                  ]}
                >
                  <IconSymbol
                    name={card.icon}
                    size={32}
                    color={colors.tint}
                  />
                </View>
                <View style={styles.cardTextContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {card.title}
                  </ThemedText>
                  <ThemedText style={styles.cardSubtitle}>
                    {card.subtitle}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            ))}
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
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 34,
    marginBottom: 12,
  },
  remainingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
