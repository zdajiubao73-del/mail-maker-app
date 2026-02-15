// 学習データに関する型定義

import type { HonorificsLevel, MailLength, Atmosphere, Urgency, PurposeCategory } from './mail';

/** 分布型: 各値の出現回数 */
export type Distribution<T extends string> = Partial<Record<T, number>>;

/** フレーズパターン */
export type PhrasePatterns = {
  openings: string[];
  closings: string[];
  commonPhrases: string[];
};

/** メール統計情報 */
export type MailStatistics = {
  totalMailsAnalyzed: number;
  averageBodyLength: number;
  averageSubjectLength: number;
  honorificsDistribution: Distribution<HonorificsLevel>;
  mailLengthDistribution: Distribution<MailLength>;
  atmosphereDistribution: Distribution<Atmosphere>;
  urgencyDistribution: Distribution<Urgency>;
  purposeCategoryDistribution: Distribution<PurposeCategory>;
  phrasePatterns: PhrasePatterns;
};

/** ユーザーの文体設定 */
export type UserStylePreferences = {
  signature: string;
  writingStyleNotes: string;
};

/** 学習プロファイル */
export type LearningProfile = {
  statistics: MailStatistics;
  preferences: UserStylePreferences;
  lastAnalyzedAt: string;
  lastAnalyzedMailCount: number;
};

/** メール生成に渡す学習コンテキスト */
export type LearningContext = {
  preferredOpenings?: string[];
  preferredClosings?: string[];
  averageBodyLength?: number;
  signature?: string;
  writingStyleNotes?: string;
};
