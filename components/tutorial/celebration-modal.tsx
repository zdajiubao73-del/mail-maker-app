import { useEffect } from 'react';
import { Modal, Platform, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TUTORIAL_CELEBRATION } from '@/constants/tutorial-copy';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTutorialStore } from '@/store/use-tutorial-store';

export function CelebrationModal() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const hasCompleted = useTutorialStore((s) => s.hasCompletedTutorial);
  const hasShown = useTutorialStore((s) => s.hasShownCelebration);
  const markShown = useTutorialStore((s) => s.markCelebrationShown);

  const visible = hasCompleted && !hasShown;

  useEffect(() => {
    if (visible && Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={markShown}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeWrapper}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '18' }]}>
              <IconSymbol name="checkmark.seal.fill" size={48} color={colors.tint} />
            </View>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {TUTORIAL_CELEBRATION.title}
            </ThemedText>
            <ThemedText style={[styles.body, { color: colors.textSecondary }]}>
              {TUTORIAL_CELEBRATION.body}
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={markShown}
              style={[styles.cta, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.ctaText}>{TUTORIAL_CELEBRATION.cta}</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  safeWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  cta: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
