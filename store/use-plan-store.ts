import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanType } from '@/types/user';
import {
  getSubscriptionDetails,
  isPurchasesConfigured,
} from '@/lib/purchases';
import type { SubscriptionStatus } from '@/lib/purchases';
import { PREMIUM_MONTHLY_LIMIT } from '@/constants/plan';
import { zustandStorage } from '@/lib/storage';

type PlanState = {
  currentPlan: PlanType;
  subscriptionExpirationDate: string | null;
  willRenew: boolean;
  periodType: SubscriptionStatus['periodType'];
  isLoading: boolean;

  // Generation quota
  monthlyGenerationCount: number;
  monthlyGenerationResetMonth: string | null; // "YYYY-MM" format

  // Actions
  activateSubscription: () => void;
  isSubscribed: () => boolean;
  canUseApp: () => boolean;
  getTrialDaysRemaining: () => number;
  syncWithRevenueCat: () => Promise<void>;
  applySubscriptionStatus: (status: SubscriptionStatus) => void;
  canGenerate: () => boolean;
  getRemainingGenerations: () => number;
  incrementGenerationCount: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      currentPlan: 'free',
      subscriptionExpirationDate: null,
      willRenew: false,
      periodType: null,
      isLoading: false,
      monthlyGenerationCount: 0,
      monthlyGenerationResetMonth: null,

      activateSubscription: () => {
        set({ currentPlan: 'subscribed' });
      },

      isSubscribed: () => {
        const plan = get().currentPlan;
        return plan === 'subscribed' || plan === 'trial';
      },

      canUseApp: () => {
        // 開発環境でRevenueCatが未設定の場合はペイウォールをスキップ
        if (__DEV__ && !isPurchasesConfigured()) return true;
        const plan = get().currentPlan;
        return plan === 'subscribed' || plan === 'trial';
      },

      getTrialDaysRemaining: () => {
        const { subscriptionExpirationDate, currentPlan } = get();
        if (currentPlan !== 'trial' || !subscriptionExpirationDate) return 0;
        const diff = new Date(subscriptionExpirationDate).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
      },

      applySubscriptionStatus: (status: SubscriptionStatus) => {
        if (status.isActive) {
          const plan: PlanType = status.periodType === 'TRIAL' ? 'trial' : 'subscribed';
          set({
            currentPlan: plan,
            periodType: status.periodType,
            subscriptionExpirationDate: status.expirationDate,
            willRenew: status.willRenew,
          });
        } else {
          const currentPlan = get().currentPlan;
          // Only mark as expired if user previously had an active subscription/trial
          if (currentPlan === 'subscribed' || currentPlan === 'trial') {
            set({
              currentPlan: 'expired',
              periodType: null,
              subscriptionExpirationDate: null,
              willRenew: false,
            });
          }
        }
      },

      syncWithRevenueCat: async () => {
        if (!isPurchasesConfigured()) return;

        set({ isLoading: true });
        try {
          const status = await getSubscriptionDetails();
          get().applySubscriptionStatus(status);
        } catch {
          // 失敗時は現在の状態を維持
        } finally {
          set({ isLoading: false });
        }
      },

      canGenerate: () => {
        const state = get();

        // 未課金ユーザーは生成不可（ペイウォールでブロック）
        if (state.currentPlan !== 'subscribed' && state.currentPlan !== 'trial') {
          return false;
        }

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyCount = state.monthlyGenerationResetMonth === currentMonth
          ? state.monthlyGenerationCount
          : 0;
        return monthlyCount < PREMIUM_MONTHLY_LIMIT;
      },

      getRemainingGenerations: () => {
        const state = get();

        if (state.currentPlan !== 'subscribed' && state.currentPlan !== 'trial') {
          return 0;
        }

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyCount = state.monthlyGenerationResetMonth === currentMonth
          ? state.monthlyGenerationCount
          : 0;
        return PREMIUM_MONTHLY_LIMIT - monthlyCount;
      },

      incrementGenerationCount: () => {
        const state = get();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const newMonthlyCount = state.monthlyGenerationResetMonth === currentMonth
          ? state.monthlyGenerationCount + 1
          : 1;

        set({
          monthlyGenerationCount: newMonthlyCount,
          monthlyGenerationResetMonth: currentMonth,
        });
      },
    }),
    {
      name: 'plan-storage',
      version: 5,
      storage: zustandStorage,
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        subscriptionExpirationDate: state.subscriptionExpirationDate,
        willRenew: state.willRenew,
        periodType: state.periodType,
        monthlyGenerationCount: state.monthlyGenerationCount,
        monthlyGenerationResetMonth: state.monthlyGenerationResetMonth,
      }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version < 2) {
          if (state.currentPlan === 'premium') {
            state.currentPlan = 'subscribed';
          }
        }
        if (version < 3) {
          state.monthlyGenerationCount = 0;
          state.monthlyGenerationResetMonth = null;
        }
        if (version < 4) {
          delete state.trialStartDate;
          delete state.trialEndDate;
          state.subscriptionExpirationDate = null;
          state.willRenew = false;
          state.periodType = null;
          if (state.currentPlan === 'trial') {
            state.currentPlan = 'free';
          }
        }
        if (version < 5) {
          // v4 → v5: Remove free plan daily limits (subscription required)
          delete state.dailyGenerationCount;
          delete state.dailyGenerationResetDate;
        }
        return state;
      },
    },
  ),
);
