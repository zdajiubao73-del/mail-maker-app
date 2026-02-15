import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Preset } from '@/types/preset';
import { zustandStorage } from '@/lib/storage';

type PresetState = {
  presets: Preset[];

  addPreset: (preset: Preset) => void;
  removePreset: (id: string) => void;
  updatePreset: (id: string, updates: Partial<Omit<Preset, 'id'>>) => void;
};

export const usePresetStore = create<PresetState>()(
  persist(
    (set) => ({
      presets: [],

      addPreset: (preset) =>
        set((state) => ({
          presets: [preset, ...state.presets],
        })),

      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
    }),
    {
      name: 'preset-storage',
      storage: zustandStorage,
      partialize: (state) => ({ presets: state.presets }),
      onRehydrateStorage: () => (state) => {
        if (state?.presets) {
          state.presets = state.presets.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
          }));
        }
      },
    },
  ),
);
