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
      learningEnabled: true,

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
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        learningEnabled: state.learningEnabled,
      }),
      migrate: (persisted) => {
        return persisted as any;
      },
    },
  ),
);
