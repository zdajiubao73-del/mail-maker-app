import { useEffect } from 'react';
import { Dimensions, Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { TutorialTooltip } from '@/components/tutorial/tutorial-tooltip';
import { TUTORIAL_COPY, TUTORIAL_PAUSE_LABEL } from '@/constants/tutorial-copy';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTutorialTargetStore } from '@/store/use-tutorial-target-store';
import { useTutorialStore, type TutorialStep } from '@/store/use-tutorial-store';

// 自動進行に頼れないステップ（テキスト入力・読み物など）には「次へ」ボタンを出す
const STEPS_WITH_NEXT_BUTTON: ReadonlySet<TutorialStep> = new Set<TutorialStep>([
  'learning-signature',
  'learning-style',
  'learning-opening',
  'rewrite-draft',
  'preview-review',
]);

// dim でブロックせず、ハイライトリング+ツールチップのみ表示するステップ
// （ターゲット押下前にユーザーが他フィールドへの入力・閲覧を必要とするステップ）
const NON_BLOCKING_STEPS: ReadonlySet<TutorialStep> = new Set<TutorialStep>([
  'rewrite-generate',
  'preview-review',
]);

const DIM_COLOR = 'rgba(15, 23, 42, 0.55)';

export function TutorialOverlay() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentStep = useTutorialStore((s) => s.currentStep);
  const isPaused = useTutorialStore((s) => s.isPaused);
  const pause = useTutorialStore((s) => s.pause);
  const advance = useTutorialStore((s) => s.advance);
  const rect = useTutorialTargetStore((s) => s.rect);

  const screen = Dimensions.get('window');

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const isInactive =
    isPaused ||
    currentStep === 'idle' ||
    currentStep === 'completed' ||
    !TUTORIAL_COPY[currentStep as keyof typeof TUTORIAL_COPY];

  if (isInactive) return null;

  const copy = TUTORIAL_COPY[currentStep as keyof typeof TUTORIAL_COPY];

  // ターゲット未計測時：全画面 dim のみ表示（タップでキーボード閉じる）
  if (!rect || rect.step !== currentStep) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: DIM_COLOR }]} />
      </TouchableWithoutFeedback>
    );
  }

  const padding = rect.padding;
  const radius = rect.borderRadius;
  const targetX = rect.x - padding;
  const targetY = rect.y - padding;
  const targetW = rect.width + padding * 2;
  const targetH = rect.height + padding * 2;

  // dim 領域タップでキーボードを閉じる → TextInput が blur → 学習ストア更新 → 自動進行
  const onDimPress = () => Keyboard.dismiss();
  const isBlocking = !NON_BLOCKING_STEPS.has(currentStep);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      {isBlocking && (
        <>
          {/* 上の dim */}
          <TouchableWithoutFeedback onPress={onDimPress}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: screen.width,
                height: Math.max(0, targetY),
                backgroundColor: DIM_COLOR,
              }}
            />
          </TouchableWithoutFeedback>
          {/* 下の dim */}
          <TouchableWithoutFeedback onPress={onDimPress}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: targetY + targetH,
                width: screen.width,
                height: Math.max(0, screen.height - (targetY + targetH)),
                backgroundColor: DIM_COLOR,
              }}
            />
          </TouchableWithoutFeedback>
          {/* 左の dim */}
          <TouchableWithoutFeedback onPress={onDimPress}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: Math.max(0, targetY),
                width: Math.max(0, targetX),
                height: targetH,
                backgroundColor: DIM_COLOR,
              }}
            />
          </TouchableWithoutFeedback>
          {/* 右の dim */}
          <TouchableWithoutFeedback onPress={onDimPress}>
            <View
              style={{
                position: 'absolute',
                left: targetX + targetW,
                top: Math.max(0, targetY),
                width: Math.max(0, screen.width - (targetX + targetW)),
                height: targetH,
                backgroundColor: DIM_COLOR,
              }}
            />
          </TouchableWithoutFeedback>
        </>
      )}

      {/* ハイライトリング */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: targetX,
            top: targetY,
            width: targetW,
            height: targetH,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: colors.tint,
            backgroundColor: 'transparent',
          },
          ringStyle,
        ]}
      />

      {/* ツールチップ */}
      <TutorialTooltip
        title={copy.title}
        body={copy.body}
        targetRect={{ x: targetX, y: targetY, width: targetW, height: targetH, padding: 0 }}
        skipLabel={TUTORIAL_PAUSE_LABEL}
        onSkip={pause}
        onNext={
          STEPS_WITH_NEXT_BUTTON.has(currentStep)
            ? () => {
                Keyboard.dismiss();
                advance(currentStep);
              }
            : undefined
        }
      />
    </View>
  );
}
