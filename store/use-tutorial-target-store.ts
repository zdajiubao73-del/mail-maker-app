import { create } from 'zustand';
import type { TutorialStep } from '@/store/use-tutorial-store';

export type TutorialTargetRect = {
  step: TutorialStep;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  padding: number;
};

type TutorialTargetState = {
  rect: TutorialTargetRect | null;
  setRect: (rect: TutorialTargetRect) => void;
  clearRect: (step?: TutorialStep) => void;
};

export const useTutorialTargetStore = create<TutorialTargetState>((set, get) => ({
  rect: null,
  setRect: (rect) => set({ rect }),
  clearRect: (step) => {
    const current = get().rect;
    if (step && current && current.step !== step) return;
    set({ rect: null });
  },
}));
