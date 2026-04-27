import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export type TutorialStep =
  | 'idle'
  | 'learning-signature'
  | 'learning-style'
  | 'learning-opening'
  | 'contacts-add'
  | 'rewrite-draft'
  | 'rewrite-generate'
  | 'preview-review'
  | 'preview-regenerate'
  | 'preview-save-preset'
  | 'presets-tap-card'
  | 'completed';

export const TUTORIAL_FIRST_STEP: TutorialStep = 'learning-signature';

type TutorialState = {
  currentStep: TutorialStep;
  hasCompletedTutorial: boolean;
  isPaused: boolean;
  hasShownCelebration: boolean;
  start: () => void;
  advance: (from: TutorialStep) => void;
  setStep: (step: TutorialStep) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  complete: () => void;
  markCelebrationShown: () => void;
};

const NEXT_STEP: Record<TutorialStep, TutorialStep> = {
  idle: 'learning-signature',
  'learning-signature': 'learning-style',
  'learning-style': 'learning-opening',
  'learning-opening': 'contacts-add',
  'contacts-add': 'rewrite-draft',
  'rewrite-draft': 'rewrite-generate',
  'rewrite-generate': 'preview-review',
  'preview-review': 'preview-regenerate',
  'preview-regenerate': 'preview-save-preset',
  'preview-save-preset': 'presets-tap-card',
  'presets-tap-card': 'completed',
  completed: 'completed',
};

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      currentStep: 'idle',
      hasCompletedTutorial: false,
      isPaused: false,
      hasShownCelebration: false,
      start: () =>
        set({
          currentStep: TUTORIAL_FIRST_STEP,
          isPaused: false,
          hasCompletedTutorial: false,
        }),
      advance: (from) => {
        if (get().currentStep !== from) return;
        const next = NEXT_STEP[from];
        if (next === 'completed') {
          set({ currentStep: 'completed', hasCompletedTutorial: true });
        } else {
          set({ currentStep: next });
        }
      },
      setStep: (step) => set({ currentStep: step }),
      pause: () => set({ isPaused: true }),
      resume: () => set({ isPaused: false }),
      reset: () =>
        set({
          currentStep: TUTORIAL_FIRST_STEP,
          isPaused: false,
          hasCompletedTutorial: false,
          hasShownCelebration: false,
        }),
      complete: () =>
        set({ currentStep: 'completed', hasCompletedTutorial: true }),
      markCelebrationShown: () => set({ hasShownCelebration: true }),
    }),
    {
      name: 'tutorial-storage',
      storage: zustandStorage,
      partialize: (state) => ({
        currentStep: state.currentStep,
        hasCompletedTutorial: state.hasCompletedTutorial,
        isPaused: state.isPaused,
        hasShownCelebration: state.hasShownCelebration,
      }),
    },
  ),
);
