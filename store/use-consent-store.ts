import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

type ConsentState = {
  /** ユーザーがAIデータ利用に同意したかどうか */
  hasAgreedToAIDataUsage: boolean;
  /** 同意した日時 */
  agreedAt: string | null;

  agreeToAIDataUsage: () => void;
  revokeAIDataUsageConsent: () => void;
};

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasAgreedToAIDataUsage: false,
      agreedAt: null,

      agreeToAIDataUsage: () =>
        set({
          hasAgreedToAIDataUsage: true,
          agreedAt: new Date().toISOString(),
        }),

      revokeAIDataUsageConsent: () =>
        set({
          hasAgreedToAIDataUsage: false,
          agreedAt: null,
        }),
    }),
    {
      name: 'consent-storage',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        hasAgreedToAIDataUsage: state.hasAgreedToAIDataUsage,
        agreedAt: state.agreedAt,
      }),
    },
  ),
);
