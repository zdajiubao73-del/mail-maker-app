import { useEffect, useRef } from 'react';
import { Dimensions, Keyboard } from 'react-native';
import type { View, TextInput } from 'react-native';
import { useTutorialStore, type TutorialStep } from '@/store/use-tutorial-store';
import { useTutorialTargetStore } from '@/store/use-tutorial-target-store';

type TargetRef = React.RefObject<View | TextInput | null>;

type Options = {
  borderRadius?: number;
  padding?: number;
};

/**
 * 対象 step がアクティブな間、ref のビューを measureInWindow で計測し続け
 * useTutorialTargetStore に矩形を反映する。
 */
export function useRegisterTutorialTarget(
  step: TutorialStep,
  ref: TargetRef,
  opts?: Options,
) {
  const currentStep = useTutorialStore((s) => s.currentStep);
  const isPaused = useTutorialStore((s) => s.isPaused);
  const isActive = currentStep === step && !isPaused;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const measure = () => {
      const node = ref.current;
      if (!node || cancelled) return;
      // measureInWindow exists on both View and TextInput host instances at runtime.
      node.measureInWindow?.((x: number, y: number, width: number, height: number) => {
        if (cancelled) return;
        if (width === 0 && height === 0) return;
        useTutorialTargetStore.getState().setRect({
          step,
          x,
          y,
          width,
          height,
          borderRadius: optsRef.current?.borderRadius ?? 12,
          padding: optsRef.current?.padding ?? 8,
        });
      });
    };

    const schedule = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(measure);
      });
    };

    schedule();

    const dimSub = Dimensions.addEventListener('change', schedule);
    const kbShow = Keyboard.addListener('keyboardDidShow', schedule);
    const kbHide = Keyboard.addListener('keyboardDidHide', schedule);

    // 周期的に再計測（ScrollView などのレイアウト変動対策）
    const interval = setInterval(measure, 400);

    return () => {
      cancelled = true;
      dimSub.remove();
      kbShow.remove();
      kbHide.remove();
      clearInterval(interval);
      useTutorialTargetStore.getState().clearRect(step);
    };
  }, [isActive, ref, step]);
}
