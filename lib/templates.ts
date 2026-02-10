// テンプレート管理モジュール

import type { PromptTemplate, PurposeCategory } from '@/types';

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'tpl-001',
    name: '依頼メール（基本）',
    category: 'ビジネス',
    situation: '資料作成依頼',
    description: '社内外問わず使える基本的な依頼メールのテンプレートです。丁寧な表現で依頼内容を明確に伝えます。',
    isPremium: false,
  },
  {
    id: 'tpl-002',
    name: '会議日程調整',
    category: 'ビジネス',
    situation: '会議日程調整',
    description: '複数の候補日を提示して会議の日程調整を行うテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-003',
    name: 'お詫びメール',
    category: 'ビジネス',
    situation: '納期遅延',
    description: '納期遅延やミスに対するお詫びメールのテンプレートです。誠意ある文面で信頼回復を図ります。',
    isPremium: false,
  },
  {
    id: 'tpl-004',
    name: 'お礼メール（面談後）',
    category: 'ビジネス',
    situation: '面談後のお礼',
    description: '面談・打ち合わせ後に送るお礼メールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-005',
    name: '新規営業メール',
    category: 'ビジネス',
    situation: '新規営業',
    description: '新規顧客へのファーストコンタクト用テンプレートです。簡潔にサービスの価値を伝えます。',
    isPremium: true,
  },
  {
    id: 'tpl-006',
    name: '退職挨拶メール',
    category: 'ビジネス',
    situation: '退職挨拶',
    description: '退職時に社内外へ送る挨拶メールのテンプレートです。感謝の気持ちを込めた文面です。',
    isPremium: true,
  },
  {
    id: 'tpl-007',
    name: '面接お礼メール',
    category: '就職・転職',
    situation: '面接後のお礼',
    description: '面接後に採用担当者へ送るお礼メールのテンプレートです。好印象を与える文面です。',
    isPremium: false,
  },
  {
    id: 'tpl-008',
    name: '内定承諾メール',
    category: '就職・転職',
    situation: '内定承諾',
    description: '内定を承諾する際に送るメールのテンプレートです。入社への意欲を示します。',
    isPremium: false,
  },
  {
    id: 'tpl-009',
    name: '内定辞退メール',
    category: '就職・転職',
    situation: '内定辞退',
    description: '内定を辞退する際に送る丁寧なメールのテンプレートです。',
    isPremium: true,
  },
  {
    id: 'tpl-010',
    name: '教授への質問メール',
    category: '学校・学術',
    situation: '質問',
    description: '大学の教授に授業内容について質問するメールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-011',
    name: '欠席連絡メール',
    category: '学校・学術',
    situation: '欠席連絡',
    description: '授業やゼミを欠席する際に教授へ送る連絡メールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-012',
    name: '推薦状依頼メール',
    category: '学校・学術',
    situation: '推薦状依頼',
    description: '教授に推薦状の作成を依頼するメールのテンプレートです。',
    isPremium: true,
  },
  {
    id: 'tpl-013',
    name: 'お祝いメール',
    category: 'プライベート',
    situation: '結婚',
    description: '結婚や出産などのお祝いメールのテンプレートです。心のこもった文面です。',
    isPremium: false,
  },
  {
    id: 'tpl-014',
    name: 'お悔やみメール',
    category: 'プライベート',
    situation: 'お悔やみ',
    description: 'お悔やみの気持ちを伝えるメールのテンプレートです。適切な言葉遣いで心情を表現します。',
    isPremium: true,
  },
  {
    id: 'tpl-015',
    name: '解約依頼メール',
    category: 'プライベート',
    situation: '解約',
    description: 'サービスの解約を依頼するメールのテンプレートです。必要事項を漏れなく伝えます。',
    isPremium: false,
  },
];

/**
 * 全テンプレートを取得
 */
export function getTemplates(): PromptTemplate[] {
  return TEMPLATES;
}

/**
 * カテゴリ別にテンプレートを取得
 */
export function getTemplatesByCategory(
  category: PurposeCategory,
): PromptTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/**
 * IDでテンプレートを取得
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
