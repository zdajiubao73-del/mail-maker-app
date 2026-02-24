import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MailAccount } from '@/types/user';
import { zustandStorage } from '@/lib/storage';

type AuthState = {
  mailAccounts: MailAccount[];

  // Actions
  addMailAccount: (account: MailAccount) => void;
  removeMailAccount: (accountId: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      mailAccounts: [],

      addMailAccount: (account) =>
        set((state) => ({
          mailAccounts: [...state.mailAccounts, account],
        })),

      removeMailAccount: (accountId) =>
        set((state) => ({
          mailAccounts: state.mailAccounts.filter((a) => a.id !== accountId),
        })),
    }),
    {
      name: 'auth-storage',
      version: 3,
      storage: zustandStorage,
      partialize: (state) => ({ mailAccounts: state.mailAccounts }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version < 3) {
          // v2 → v3: ログイン廃止。user.mailAccounts をトップレベルに移行
          state.mailAccounts = state.user?.mailAccounts ?? [];
          delete state.user;
          delete state.isLoggedIn;
        }
        return state;
      },
    },
  ),
);
