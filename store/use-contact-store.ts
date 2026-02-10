import { create } from 'zustand';
import type { Contact, ContactGroup } from '@/types/contact';

type ContactState = {
  contacts: Contact[];

  // Actions
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Omit<Contact, 'id'>>) => void;
  removeContact: (id: string) => void;
  getContactsByGroup: (group: ContactGroup) => Contact[];
};

const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    relationship: '上司',
    positionTitle: '部長',
    group: '仕事',
    scope: '社内',
    positionLevel: '管理職',
  },
  {
    id: 'contact-2',
    name: '鈴木花子',
    email: 'suzuki@example.com',
    relationship: '同僚',
    positionTitle: '主任',
    group: '仕事',
    scope: '社内',
    positionLevel: '一般社員',
  },
  {
    id: 'contact-3',
    name: '佐藤教授',
    email: 'sato@university.ac.jp',
    relationship: '教授',
    positionTitle: '教授',
    group: '学校',
    scope: '社外',
    positionLevel: '管理職',
  },
  {
    id: 'contact-4',
    name: '山田商事 営業部',
    email: 'yamada@trading.co.jp',
    relationship: '取引先',
    positionTitle: '課長',
    group: '仕事',
    scope: '社外',
    positionLevel: '管理職',
  },
  {
    id: 'contact-5',
    name: '高橋ゆき',
    email: 'takahashi@email.com',
    relationship: '友人',
    group: 'プライベート',
    scope: '個人間',
    positionLevel: 'その他',
  },
];

export const useContactStore = create<ContactState>()((set, get) => ({
  contacts: MOCK_CONTACTS,

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
}));
