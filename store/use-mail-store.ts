import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RecipientSettings,
  ToneSettings,
  AdditionalInfo,
  PurposeCategory,
  GeneratedMail,
  MailHistoryItem,
  Attachment,
  GenerationMode,
} from '@/types/mail';
import { zustandStorage } from '@/lib/storage';

type MailState = {
  // Current creation state
  mode: GenerationMode;
  recipient: RecipientSettings | null;
  purposeCategory: PurposeCategory | null;
  situation: string;
  tone: ToneSettings;
  additionalInfo: AdditionalInfo;
  writingStyleNotes: string;
  templateId: string | null;

  // Recipient info for sending
  recipientName: string;
  recipientEmail: string;

  // CC / BCC
  cc: string[];
  bcc: string[];

  // Attachments
  attachments: Attachment[];

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
  setWritingStyleNotes: (notes: string) => void;
  setTemplateId: (id: string | null) => void;
  setRecipientInfo: (name: string, email: string) => void;
  addCc: (email: string) => void;
  removeCc: (email: string) => void;
  addBcc: (email: string) => void;
  removeBcc: (email: string) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  setGeneratedMail: (mail: GeneratedMail | null) => void;
  setIsGenerating: (v: boolean) => void;
  addHistory: (item: MailHistoryItem) => void;
  removeHistory: (id: string) => void;
  updateHistoryStatus: (id: string, status: MailHistoryItem['status']) => void;
  updateHistory: (id: string, updates: Partial<Omit<MailHistoryItem, 'id'>>) => void;
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
  writingStyleNotes: '',
  templateId: null,
  recipientName: '',
  recipientEmail: '',
  cc: [],
  bcc: [],
  attachments: [],
  generatedMail: null,
  isGenerating: false,
};

export const useMailStore = create<MailState>()(
  persist(
    (set) => ({
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

      setWritingStyleNotes: (notes) => set({ writingStyleNotes: notes }),

      setTemplateId: (id) => set({ templateId: id }),

      setRecipientInfo: (name, email) =>
        set({ recipientName: name, recipientEmail: email }),

      addCc: (email) =>
        set((state) => ({
          cc: state.cc.includes(email) ? state.cc : [...state.cc, email],
        })),

      removeCc: (email) =>
        set((state) => ({
          cc: state.cc.filter((e) => e !== email),
        })),

      addBcc: (email) =>
        set((state) => ({
          bcc: state.bcc.includes(email) ? state.bcc : [...state.bcc, email],
        })),

      removeBcc: (email) =>
        set((state) => ({
          bcc: state.bcc.filter((e) => e !== email),
        })),

      addAttachment: (attachment) =>
        set((state) => ({
          attachments: [...state.attachments, attachment],
        })),

      removeAttachment: (id) =>
        set((state) => ({
          attachments: state.attachments.filter((a) => a.id !== id),
        })),

      clearAttachments: () => set({ attachments: [] }),

      setGeneratedMail: (mail) => set({ generatedMail: mail }),

      setIsGenerating: (v) => set({ isGenerating: v }),

      addHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history],
        })),

      removeHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      updateHistoryStatus: (id, status) =>
        set((state) => ({
          history: state.history.map((h) =>
            h.id === id ? { ...h, status } : h,
          ),
        })),

      updateHistory: (id, updates) =>
        set((state) => ({
          history: state.history.map((h) =>
            h.id === id ? { ...h, ...updates } : h,
          ),
        })),

      resetCreation: () => set(INITIAL_CREATION_STATE),
    }),
    {
      name: 'mail-storage',
      storage: zustandStorage,
      partialize: (state) => ({ history: state.history }),
      onRehydrateStorage: () => (state) => {
        if (state?.history) {
          state.history = state.history.map((h) => ({
            ...h,
            createdAt: new Date(h.createdAt),
            sentAt: h.sentAt ? new Date(h.sentAt) : undefined,
          }));
        }
      },
    },
  ),
);
