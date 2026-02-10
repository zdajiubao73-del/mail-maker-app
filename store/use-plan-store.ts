import { create } from 'zustand';
import type { PlanType } from '@/types/user';

type PlanState = {
  currentPlan: PlanType;

  // Actions
  upgradeToPremium: () => void;
  downgradeToFree: () => void;
  isPremium: () => boolean;
};

export const usePlanStore = create<PlanState>()((set, get) => ({
  currentPlan: 'free',

  upgradeToPremium: () => set({ currentPlan: 'premium' }),

  downgradeToFree: () => set({ currentPlan: 'free' }),

  isPremium: () => get().currentPlan === 'premium',
}));
