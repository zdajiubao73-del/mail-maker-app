import { create } from 'zustand';
import type { User, MailAccount } from '@/types/user';

/** Free plan daily generation limit */
const FREE_DAILY_LIMIT = 5;

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;

  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  addMailAccount: (account: MailAccount) => void;
  removeMailAccount: (accountId: string) => void;
  incrementDailyCount: () => void;
  resetDailyCount: () => void;
  canGenerate: () => boolean;
};

const MOCK_USER: User = {
  id: 'user-mock-001',
  displayName: 'テストユーザー',
  plan: 'free',
  dailyGenerationCount: 0,
  mailAccounts: [],
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: MOCK_USER,
  isLoggedIn: true,

  setUser: (user) => set({ user, isLoggedIn: true }),

  logout: () => set({ user: null, isLoggedIn: false }),

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

  incrementDailyCount: () =>
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          dailyGenerationCount: state.user.dailyGenerationCount + 1,
        },
      };
    }),

  resetDailyCount: () =>
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          dailyGenerationCount: 0,
        },
      };
    }),

  canGenerate: () => {
    const { user } = get();
    if (!user) return false;
    if (user.plan === 'premium') return true;
    return user.dailyGenerationCount < FREE_DAILY_LIMIT;
  },
}));
