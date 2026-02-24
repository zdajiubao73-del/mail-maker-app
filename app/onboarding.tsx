import { useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingPage } from '@/components/onboarding/onboarding-page';
import { PageIndicator } from '@/components/onboarding/page-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboardingStore } from '@/store/use-onboarding-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'envelope.fill' as const,
    title: 'AIがメールを自動作成',
    description: '送信相手やシーンに合わせて\nAIが敬語・マナーに配慮した\n日本語メールを自動生成します',
    accentColor: '', // will use colors.tint
  },
  {
    icon: 'slider.horizontal.3' as const,
    title: '3つの作成モード',
    description: '「かんたん」「こだわり」「テンプレート」\n目的に合わせて最適な\n作成方法を選べます',
    accentColor: '', // will use colors.accent2
  },
  {
    icon: 'person.fill' as const,
    title: '敬語レベルを自動調整',
    description: '送信相手の関係性を設定するだけで\n尊敬語・謙譲語・丁寧語を\n適切に使い分けます',
    accentColor: '', // will use colors.accent1
  },
  {
    icon: 'paperplane.fill' as const,
    title: 'Gmail・Outlookから\n直接送信',
    description: 'メールアカウントを連携すれば\nアプリからそのまま送信\nコピペ不要で手間いらず',
    accentColor: '', // will use colors.accent3
  },
  {
    icon: 'brain.head.profile' as const,
    title: '使うほどあなた好みに',
    description: '学習データ管理であなたの文体を\nAIが記憶し、使うほど\nより自然なメールに仕上がります',
    accentColor: '', // will use colors.info
  },
  {
    icon: 'arrow.triangle.2.circlepath' as const,
    title: '納得いくまで再生成',
    description: '生成結果がイメージと違っても\n再生成ボタンで何度でも\n作り直せるから安心です',
    accentColor: '', // will use colors.success
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = PAGES.length + 1; // +1 for CTA page
  const isLastPage = currentPage === totalPages - 1;

  const accentColors = [colors.tint, colors.accent2, colors.accent1, colors.accent3, colors.info, colors.success, colors.tint];

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentPage(page);
    },
    [],
  );

  const handleFinish = useCallback(() => {
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, router]);

  const handleNext = useCallback(() => {
    if (isLastPage) {
      handleFinish();
    } else {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [isLastPage, currentPage, handleFinish]);

  return (
    <ThemedView style={styles.container}>
      {/* Skip button */}
      {!isLastPage && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={handleFinish}
          activeOpacity={0.6}
        >
          <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
            スキップ
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={styles.scrollView}
      >
        {PAGES.map((page, index) => (
          <OnboardingPage
            key={index}
            icon={page.icon}
            title={page.title}
            description={page.description}
            accentColor={accentColors[index]}
          />
        ))}

        {/* CTA page */}
        <View style={[styles.ctaPage, { width: SCREEN_WIDTH }]}>
          <View style={styles.ctaContent}>
            <ThemedText style={styles.ctaEmoji}>{'✉️'}</ThemedText>
            <ThemedText style={styles.ctaTitle}>
              さっそく始めましょう
            </ThemedText>
            <ThemedText style={[styles.ctaDescription, { color: colors.textSecondary }]}>
              AIがあなたのメール作成を{'\n'}サポートします
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Bottom area */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
        <PageIndicator pageCount={totalPages} currentPage={currentPage} />

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: accentColors[currentPage] }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.nextButtonText}>
            {isLastPage ? '始める' : '次へ'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  ctaPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  ctaContent: {
    alignItems: 'center',
    marginBottom: 80,
  },
  ctaEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  ctaDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    gap: 24,
  },
  nextButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
