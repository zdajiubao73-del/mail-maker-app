import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, ContactGroup } from '@/types/contact';
import { zustandStorage } from '@/lib/storage';

type ContactState = {
  contacts: Contact[];

  // Actions
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Omit<Contact, 'id'>>) => void;
  removeContact: (id: string) => void;
  getContactsByGroup: (group: ContactGroup) => Contact[];
};

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (contact) =>
        set((state) => ({
          contacts: [...state.contacts, contact],
        })),

      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),

      getContactsByGroup: (group) => {
        return get().contacts.filter((c) => c.group === group);
      },
    }),
    {
      name: 'contact-storage',
      storage: zustandStorage,
      partialize: (state) => ({ contacts: state.contacts }),
    },
  ),
);
