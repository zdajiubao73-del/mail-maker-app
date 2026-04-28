import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { useMailStore } from '@/store/use-mail-store';
import { useTutorialStore, type TutorialStep } from '@/store/use-tutorial-store';

const PREVIEW_STEPS: ReadonlySet<TutorialStep> = new Set<TutorialStep>([
  'preview-review',
  'preview-regenerate',
  'preview-save-preset',
]);

const STEP_TO_PATH: Partial<Record<TutorialStep, string>> = {
  'learning-signature': '/settings/learning-data',
  'learning-style': '/settings/learning-data',
  'learning-opening': '/settings/learning-data',
  'contacts-add': '/contacts',
  'rewrite-draft': '/create/rewrite',
  'rewrite-generate': '/create/rewrite',
  'preview-review': '/preview',
  'preview-regenerate': '/preview',
  'preview-save-preset': '/preview',
  'presets-tap-card': '/settings/presets',
};

// チュートリアル中であってもユーザーが意図的に到達する補助画面では
// 自動遷移を抑制する（戻るボタンで自然にチュートリアルに復帰できる）
const SKIP_REDIRECT_PATHS: ReadonlySet<string> = new Set<string>([
  '/settings/plan',
  '/settings/account',
  '/settings/privacy',
  '/settings/terms',
]);

/**
 * currentStep に応じて期待画面へ自動遷移する。
 * 同じ画面ならスキップしてループ防止。
 */
export function useTutorialNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = useTutorialStore((s) => s.currentStep);
  const isPaused = useTutorialStore((s) => s.isPaused);

  useEffect(() => {
    if (isPaused) return;
    if (currentStep === 'idle' || currentStep === 'completed') return;

    // ユーザーが意図的に到達した補助画面では自動遷移しない
    // （戻るボタンでチュートリアル画面に戻ったときに自動で復帰する）
    if (SKIP_REDIRECT_PATHS.has(pathname)) return;

    // プレビュー系ステップで生成メールが無い場合（アプリ再起動など）はリライトに巻き戻し
    if (PREVIEW_STEPS.has(currentStep) && !useMailStore.getState().generatedMail) {
      useTutorialStore.getState().setStep('rewrite-draft');
      if (pathname !== '/create/rewrite') {
        router.replace('/create/rewrite');
      }
      return;
    }

    const target = STEP_TO_PATH[currentStep];
    if (!target) return;
    if (pathname === target) return;
    router.replace(target as never);
  }, [currentStep, pathname, isPaused, router]);

  // /preview に到達した時点で rewrite-generate を完了扱い
  useEffect(() => {
    if (isPaused) return;
    if (currentStep === 'rewrite-generate' && pathname === '/preview') {
      useTutorialStore.getState().advance('rewrite-generate');
    }
  }, [currentStep, pathname, isPaused]);
}
