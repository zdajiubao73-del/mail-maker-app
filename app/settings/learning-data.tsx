import { SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LearningDataScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Illustration */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.tint + '12' },
            ]}
          >
            <IconSymbol
              name="brain"
              size={56}
              color={colors.tint}
            />
          </View>

          {/* Title */}
          <ThemedText type="subtitle" style={styles.title}>
            学習データ管理
          </ThemedText>

          {/* Description */}
          <ThemedText style={[styles.description, { color: colors.icon }]}>
            この機能は今後のアップデートで提供予定です
          </ThemedText>

          {/* Sub-description */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colorScheme === 'dark' ? '#1E2022' : '#F2F2F7',
              },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={18} color={colors.icon} />
            <ThemedText style={[styles.infoText, { color: colors.icon }]}>
              AIがあなたの文体（言い回し・文の長さ・署名スタイル）を学習し、よりパーソナライズされたメールを生成できるようになります。学習データの確認・削除もこの画面から行えます。
            </ThemedText>
          </View>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
