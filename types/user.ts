// ユーザーに関する型定義

/** プランタイプ */
export type PlanType = 'free' | 'premium';

/** メールアカウントの種類 */
export type MailAccountType = 'gmail' | 'outlook' | 'yahoo' | 'icloud';

/** 認証ステータス */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'expired';

/** メールアカウント */
export type MailAccount = {
  id: string;
  type: MailAccountType;
  email: string;
  authStatus: AuthStatus;
};

/** ユーザー */
export type User = {
  id: string;
  displayName: string;
  plan: PlanType;
  dailyGenerationCount: number;
  mailAccounts: MailAccount[];
};
