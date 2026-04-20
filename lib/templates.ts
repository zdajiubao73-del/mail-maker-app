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
    isPremium: false,
  },
  {
    id: 'tpl-024',
    name: 'OB・OG訪問依頼メール',
    category: '就職・転職',
    situation: 'OB・OG訪問依頼',
    description: 'OB・OGにキャリア相談・訪問をお願いするメールのテンプレートです。失礼のない丁寧な文面で依頼します。',
    isPremium: false,
  },
  {
    id: 'tpl-025',
    name: '会社説明会の参加申し込みメール',
    category: '就職・転職',
    situation: '説明会申し込み',
    description: '企業の会社説明会やインターンシップへの参加を申し込むメールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-026',
    name: 'エントリーシート提出メール',
    category: '就職・転職',
    situation: 'エントリーシート提出',
    description: 'エントリーシートや応募書類をメール添付で提出する際のテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-027',
    name: '面接日程変更のお願いメール',
    category: '就職・転職',
    situation: '面接日程変更',
    description: 'やむを得ない事情で面接日程の変更をお願いするメールのテンプレートです。誠意ある文面で対応します。',
    isPremium: false,
  },
  {
    id: 'tpl-028',
    name: '選考辞退メール',
    category: '就職・転職',
    situation: '選考辞退',
    description: '応募先企業の選考を辞退する際に送るメールのテンプレートです。失礼のない言葉で辞退の意向を伝えます。',
    isPremium: false,
  },
  {
    id: 'tpl-029',
    name: '転職エージェントへの連絡メール',
    category: '就職・転職',
    situation: '転職エージェント連絡',
    description: '転職エージェント・キャリアアドバイザーに状況報告や相談をするメールのテンプレートです。',
    isPremium: false,
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
    isPremium: false,
  },
  {
    id: 'tpl-016',
    name: '卒論・修論の相談メール',
    category: '学校・学術',
    situation: '卒論相談',
    description: '卒業論文・修士論文のテーマや進捗について指導教員に相談するメールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-017',
    name: 'レポート提出メール',
    category: '学校・学術',
    situation: 'レポート提出',
    description: 'レポートや課題を教員に提出する際のメールのテンプレートです。件名・添付ファイルの案内を含む丁寧な文面です。',
    isPremium: false,
  },
  {
    id: 'tpl-018',
    name: '研究室訪問のお願いメール',
    category: '学校・学術',
    situation: '研究室訪問',
    description: '他大学・他研究室の教員に訪問をお願いするメールのテンプレートです。研究への興味を丁寧に伝えます。',
    isPremium: false,
  },
  {
    id: 'tpl-019',
    name: 'レポート提出遅延のお詫びメール',
    category: '学校・学術',
    situation: 'レポート遅延',
    description: 'レポートや課題の提出が遅れる際に教員へ送るお詫びメールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-020',
    name: '成績・単位の問い合わせメール',
    category: '学校・学術',
    situation: '成績問い合わせ',
    description: '成績や単位について教員・事務局に確認するメールのテンプレートです。失礼のない文面で問い合わせます。',
    isPremium: false,
  },
  {
    id: 'tpl-021',
    name: 'インターンシップ推薦依頼メール',
    category: '学校・学術',
    situation: 'インターンシップ推薦依頼',
    description: 'インターンシップ参加にあたり教授に推薦・紹介をお願いするメールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-022',
    name: '学会発表後のお礼メール',
    category: '学校・学術',
    situation: '学会発表お礼',
    description: '学会発表の機会をいただいた教員・先生方へのお礼メールのテンプレートです。',
    isPremium: false,
  },
  {
    id: 'tpl-023',
    name: '奨学金・研究費の問い合わせメール',
    category: '学校・学術',
    situation: '奨学金問い合わせ',
    description: '奨学金や研究助成金について事務局・担当者に問い合わせるメールのテンプレートです。',
    isPremium: false,
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
