import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningProfile, UserStylePreferences } from '@/types/learning';
import type { MailHistoryItem } from '@/types/mail';
import { analyzeMailHistory } from '@/lib/learning-analyzer';
import { zustandStorage } from '@/lib/storage';

type LearningState = {
  profile: LearningProfile | null;
  learningEnabled: boolean;

  analyzeHistory: (history: MailHistoryItem[]) => void;
  updatePreferences: (partial: Partial<UserStylePreferences>) => void;
  setLearningEnabled: (enabled: boolean) => void;
  clearLearningData: () => void;
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      profile: null,
      learningEnabled: false,

      analyzeHistory: (history) => {
        const statistics = analyzeMailHistory(history);
        if (!statistics) {
          return;
        }

        const existing = get().profile;
        set({
          profile: {
            statistics,
            preferences: existing?.preferences ?? {
              signature: '',
              writingStyleNotes: '',
              openingText: '',
              signatureEnabled: true,
              writingStyleEnabled: true,
              openingTextEnabled: true,
            },
            lastAnalyzedAt: new Date().toISOString(),
            lastAnalyzedMailCount: history.length,
          },
        });
      },

      updatePreferences: (partial) => {
        const existing = get().profile;
        if (!existing) {
          // プロファイルが無い場合は preferences のみで作成
          set({
            profile: {
              statistics: {
                totalMailsAnalyzed: 0,
                averageBodyLength: 0,
                averageSubjectLength: 0,
                honorificsDistribution: {},
                mailLengthDistribution: {},
                atmosphereDistribution: {},
                urgencyDistribution: {},
                purposeCategoryDistribution: {},
                phrasePatterns: { openings: [], closings: [], commonPhrases: [] },
              },
              preferences: {
                signature: '',
                writingStyleNotes: '',
                openingText: '',
                signatureEnabled: true,
                writingStyleEnabled: true,
                openingTextEnabled: true,
                ...partial,
              },
              lastAnalyzedAt: new Date().toISOString(),
              lastAnalyzedMailCount: 0,
            },
          });
          return;
        }

        set({
          profile: {
            ...existing,
            preferences: {
              ...existing.preferences,
              ...partial,
            },
          },
        });
      },

      setLearningEnabled: (enabled) => {
        set({ learningEnabled: enabled });
      },

      clearLearningData: () => {
        set({ profile: null });
      },
    }),
    {
      name: 'learning-storage',
      storage: zustandStorage,
      version: 2,
      partialize: (state) => ({
        profile: state.profile,
        learningEnabled: state.learningEnabled,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted, version) => {
        const state = persisted as any;
        if (version < 2 && state?.profile?.preferences) {
          // v1 → v2: ON/OFFトグルのデフォルト値（既存ユーザーは全てON）
          state.profile.preferences.signatureEnabled =
            state.profile.preferences.signatureEnabled ?? true;
          state.profile.preferences.writingStyleEnabled =
            state.profile.preferences.writingStyleEnabled ?? true;
          state.profile.preferences.openingTextEnabled =
            state.profile.preferences.openingTextEnabled ?? true;
        }
        return state;
      },
    },
  ),
);
