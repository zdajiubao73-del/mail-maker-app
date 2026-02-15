import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, MailAccount } from '@/types/user';
import { zustandStorage } from '@/lib/storage';
import { clearTokens as clearGoogleTokens } from '@/lib/google-auth';
import { clearTokens as clearMicrosoftTokens } from '@/lib/microsoft-auth';
import { clearTokens as clearAppleTokens } from '@/lib/apple-auth';

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;

  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  addMailAccount: (account: MailAccount) => void;
  removeMailAccount: (accountId: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      setUser: (user) => set({ user, isLoggedIn: true }),

      logout: () => {
        clearGoogleTokens().catch(() => {});
        clearMicrosoftTokens().catch(() => {});
        clearAppleTokens().catch(() => {});
        set({ user: null, isLoggedIn: false });
      },

      addMailAccount: (account) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              mailAccounts: [...state.user.mailAccounts, account],
            },
          };
        }),

      removeMailAccount: (accountId) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              mailAccounts: state.user.mailAccounts.filter(
                (a) => a.id !== accountId,
              ),
            },
          };
        }),
    }),
    {
      name: 'auth-storage',
      version: 2,
      storage: zustandStorage,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoggedIn = state.user !== null;
        }
      },
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version < 2 && state.user) {
          // v1 → v2: Remove quota fields, map plan values
          delete state.user.monthlyGenerationCount;
          delete state.user.monthlyGenerationResetMonth;
          if (state.user.plan === 'premium') {
            state.user.plan = 'subscribed';
          } else if (state.user.plan === 'free' || state.user.plan === 'trial') {
            state.user.plan = 'free';
          }
          delete state.user.trialStartDate;
          delete state.user.trialEndDate;
        }
        return state;
      },
    },
  ),
);
