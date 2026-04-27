import { useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  title: string;
  body: string;
  targetRect: { x: number; y: number; width: number; height: number; padding: number };
  onSkip: () => void;
  onNext?: () => void;
  skipLabel?: string;
  nextLabel?: string;
};

const TOOLTIP_WIDTH = 300;
const TOOLTIP_GAP = 16;
const SCREEN_PADDING = 16;

export function TutorialTooltip({
  title,
  body,
  targetRect,
  onSkip,
  onNext,
  skipLabel = 'あとで見る',
  nextLabel = '次へ',
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screen = Dimensions.get('window');

  const position = useMemo(() => {
    const targetTop = targetRect.y - targetRect.padding;
    const targetBottom = targetRect.y + targetRect.height + targetRect.padding;
    const tooltipHeightEstimate = 180;

    // 下に十分なスペースがあれば下、なければ上
    const placeBelow = targetBottom + TOOLTIP_GAP + tooltipHeightEstimate < screen.height - 60;

    const top = placeBelow ? targetBottom + TOOLTIP_GAP : targetTop - TOOLTIP_GAP - tooltipHeightEstimate;

    // 横位置：ターゲット中央寄せ＋画面端でクランプ
    const targetCenterX = targetRect.x + targetRect.width / 2;
    let left = targetCenterX - TOOLTIP_WIDTH / 2;
    left = Math.max(SCREEN_PADDING, Math.min(left, screen.width - TOOLTIP_WIDTH - SCREEN_PADDING));

    return { top: Math.max(SCREEN_PADDING + 40, top), left };
  }, [targetRect, screen.height, screen.width]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: position.top,
          left: position.left,
          width: TOOLTIP_WIDTH,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
      <ThemedText style={[styles.body, { color: colors.textSecondary }]}>{body}</ThemedText>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSkip} activeOpacity={0.6} hitSlop={8} style={styles.skipButton}>
          <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>{skipLabel}</ThemedText>
        </TouchableOpacity>
        {onNext && (
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.8}
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.nextText}>{nextLabel}</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
