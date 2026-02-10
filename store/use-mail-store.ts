import { create } from 'zustand';
import type {
  RecipientSettings,
  ToneSettings,
  AdditionalInfo,
  PurposeCategory,
  GeneratedMail,
  MailHistoryItem,
  GenerationMode,
} from '@/types/mail';

type MailState = {
  // Current creation state
  mode: GenerationMode;
  recipient: RecipientSettings | null;
  purposeCategory: PurposeCategory | null;
  situation: string;
  tone: ToneSettings;
  additionalInfo: AdditionalInfo;
  templateId: string | null;

  // Generated result
  generatedMail: GeneratedMail | null;
  isGenerating: boolean;

  // History
  history: MailHistoryItem[];

  // Actions
  setMode: (mode: GenerationMode) => void;
  setRecipient: (recipient: RecipientSettings) => void;
  setPurposeCategory: (category: PurposeCategory) => void;
  setSituation: (situation: string) => void;
  setTone: (tone: Partial<ToneSettings>) => void;
  setAdditionalInfo: (info: Partial<AdditionalInfo>) => void;
  setTemplateId: (id: string | null) => void;
  setGeneratedMail: (mail: GeneratedMail | null) => void;
  setIsGenerating: (v: boolean) => void;
  addHistory: (item: MailHistoryItem) => void;
  resetCreation: () => void;
};

const DEFAULT_TONE: ToneSettings = {
  honorificsLevel: '丁寧',
  mailLength: '標準',
  atmosphere: '落ち着いた',
  urgency: '通常',
};

const DEFAULT_ADDITIONAL_INFO: AdditionalInfo = {
  keyPoints: '',
  dateTime: undefined,
  properNouns: undefined,
  notes: undefined,
};

const INITIAL_CREATION_STATE = {
  mode: 'simple' as GenerationMode,
  recipient: null,
  purposeCategory: null,
  situation: '',
  tone: DEFAULT_TONE,
  additionalInfo: DEFAULT_ADDITIONAL_INFO,
  templateId: null,
  generatedMail: null,
  isGenerating: false,
};

export const useMailStore = create<MailState>()((set) => ({
  ...INITIAL_CREATION_STATE,
  history: [],

  setMode: (mode) => set({ mode }),

  setRecipient: (recipient) => set({ recipient }),

  setPurposeCategory: (category) => set({ purposeCategory: category }),

  setSituation: (situation) => set({ situation }),

  setTone: (tone) =>
    set((state) => ({
      tone: { ...state.tone, ...tone },
    })),

  setAdditionalInfo: (info) =>
    set((state) => ({
      additionalInfo: { ...state.additionalInfo, ...info },
    })),

  setTemplateId: (id) => set({ templateId: id }),

  setGeneratedMail: (mail) => set({ generatedMail: mail }),

  setIsGenerating: (v) => set({ isGenerating: v }),

  addHistory: (item) =>
    set((state) => ({
      history: [item, ...state.history],
    })),

  resetCreation: () => set(INITIAL_CREATION_STATE),
}));
