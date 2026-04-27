import { useEffect, useRef } from 'react';

import { useContactStore } from '@/store/use-contact-store';
import { useLearningStore } from '@/store/use-learning-store';
import { usePresetStore } from '@/store/use-preset-store';
import { useTutorialStore } from '@/store/use-tutorial-store';

/**
 * チュートリアル進行ウォッチャー。
 * 関連 store を購読して進行条件成立時に advance(from) を呼ぶ。
 */
export function useTutorialWatchers() {
  const currentStep = useTutorialStore((s) => s.currentStep);
  const isPaused = useTutorialStore((s) => s.isPaused);

  // ステップ進入時のベースライン（contacts.length, presets.length）
  const baselinesRef = useRef({ contacts: 0, presets: 0 });

  useEffect(() => {
    if (isPaused) return;
    if (currentStep === 'contacts-add') {
      baselinesRef.current.contacts = useContactStore.getState().contacts.length;
    }
    if (currentStep === 'preview-save-preset') {
      baselinesRef.current.presets = usePresetStore.getState().presets.length;
    }
  }, [currentStep, isPaused]);

  useEffect(() => {
    const unsubLearning = useLearningStore.subscribe((state) => {
      const t = useTutorialStore.getState();
      if (t.isPaused) return;
      const prefs = state.profile?.preferences;
      if (!prefs) return;
      if (t.currentStep === 'learning-signature' && prefs.signature?.trim()) {
        t.advance('learning-signature');
        return;
      }
      if (t.currentStep === 'learning-style' && prefs.writingStyleNotes?.trim()) {
        t.advance('learning-style');
        return;
      }
      if (t.currentStep === 'learning-opening' && prefs.openingText?.trim()) {
        t.advance('learning-opening');
        return;
      }
    });

    const unsubContacts = useContactStore.subscribe((state) => {
      const t = useTutorialStore.getState();
      if (t.isPaused) return;
      if (t.currentStep !== 'contacts-add') return;
      if (state.contacts.length > baselinesRef.current.contacts) {
        t.advance('contacts-add');
      }
    });

    const unsubPresets = usePresetStore.subscribe((state) => {
      const t = useTutorialStore.getState();
      if (t.isPaused) return;
      if (t.currentStep !== 'preview-save-preset') return;
      if (state.presets.length > baselinesRef.current.presets) {
        t.advance('preview-save-preset');
      }
    });

    return () => {
      unsubLearning();
      unsubContacts();
      unsubPresets();
    };
  }, []);
}
