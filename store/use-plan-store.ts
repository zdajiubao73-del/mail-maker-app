import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanType } from '@/types/user';
import {
  getSubscriptionDetails,
  isPurchasesConfigured,
} from '@/lib/purchases';
import type { SubscriptionStatus } from '@/lib/purchases';
import { PREMIUM_MONTHLY_LIMIT, FREE_DAILY_LIMIT } from '@/constants/plan';
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
  dailyGenerationCount: number;
  dailyGenerationResetDate: string | null; // "YYYY-MM-DD" format

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
      dailyGenerationCount: 0,
      dailyGenerationResetDate: null,

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
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentDate = now.toISOString().slice(0, 10);

        if (state.currentPlan === 'subscribed') {
          const monthlyCount = state.monthlyGenerationResetMonth === currentMonth
            ? state.monthlyGenerationCount
            : 0;
          return monthlyCount < PREMIUM_MONTHLY_LIMIT;
        }

        // Free / trial users: daily limit
        const dailyCount = state.dailyGenerationResetDate === currentDate
          ? state.dailyGenerationCount
          : 0;
        return dailyCount < FREE_DAILY_LIMIT;
      },

      getRemainingGenerations: () => {
        const state = get();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentDate = now.toISOString().slice(0, 10);

        if (state.currentPlan === 'subscribed') {
          const monthlyCount = state.monthlyGenerationResetMonth === currentMonth
            ? state.monthlyGenerationCount
            : 0;
          return PREMIUM_MONTHLY_LIMIT - monthlyCount;
        }

        const dailyCount = state.dailyGenerationResetDate === currentDate
          ? state.dailyGenerationCount
          : 0;
        return FREE_DAILY_LIMIT - dailyCount;
      },

      incrementGenerationCount: () => {
        const state = get();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentDate = now.toISOString().slice(0, 10);

        // Monthly count (for subscribed users)
        const newMonthlyCount = state.monthlyGenerationResetMonth === currentMonth
          ? state.monthlyGenerationCount + 1
          : 1;

        // Daily count (for free/trial users)
        const newDailyCount = state.dailyGenerationResetDate === currentDate
          ? state.dailyGenerationCount + 1
          : 1;

        set({
          monthlyGenerationCount: newMonthlyCount,
          monthlyGenerationResetMonth: currentMonth,
          dailyGenerationCount: newDailyCount,
          dailyGenerationResetDate: currentDate,
        });
      },
    }),
    {
      name: 'plan-storage',
      version: 4,
      storage: zustandStorage,
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        subscriptionExpirationDate: state.subscriptionExpirationDate,
        willRenew: state.willRenew,
        periodType: state.periodType,
        monthlyGenerationCount: state.monthlyGenerationCount,
        monthlyGenerationResetMonth: state.monthlyGenerationResetMonth,
        dailyGenerationCount: state.dailyGenerationCount,
        dailyGenerationResetDate: state.dailyGenerationResetDate,
      }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version < 2) {
          // v1 → v2: premium→subscribed, free→trial
          if (state.currentPlan === 'premium') {
            state.currentPlan = 'subscribed';
          } else if (state.currentPlan === 'free') {
            state.currentPlan = 'free';
          }
        }
        if (version < 3) {
          // v2 → v3: Add generation quota tracking
          state.monthlyGenerationCount = 0;
          state.monthlyGenerationResetMonth = null;
          state.dailyGenerationCount = 0;
          state.dailyGenerationResetDate = null;
        }
        if (version < 4) {
          // v3 → v4: Remove client-side trial, add RevenueCat fields
          delete state.trialStartDate;
          delete state.trialEndDate;
          state.subscriptionExpirationDate = null;
          state.willRenew = false;
          state.periodType = null;
          // Migrate client-side trial users to 'free' (RevenueCat sync will set correct state)
          if (state.currentPlan === 'trial') {
            state.currentPlan = 'free';
          }
        }
        return state;
      },
    },
  ),
);
