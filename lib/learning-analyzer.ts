// 履歴分析ロジック + learningContext構築ヘルパー

import type { MailHistoryItem } from '@/types/mail';
import type {
  MailStatistics,
  PhrasePatterns,
  LearningProfile,
  LearningContext,
  Distribution,
} from '@/types/learning';
import type {
  HonorificsLevel,
  MailLength,
  Atmosphere,
  Urgency,
  PurposeCategory,
} from '@/types/mail';

/** 最低分析件数 */
const MIN_MAILS_FOR_ANALYSIS = 3;

/** フレーズの最大保持数 */
const MAX_PHRASES = 5;

/**
 * 本文から最初の段落（書き出し）を抽出する
 */
function extractOpening(body: string): string {
  const lines = body.split('\n').filter((l) => l.trim().length > 0);
  return lines[0]?.trim() ?? '';
}

/**
 * 本文から最後の段落（締め）を抽出する
 */
function extractClosing(body: string): string {
  const lines = body.split('\n').filter((l) => l.trim().length > 0);
  return lines[lines.length - 1]?.trim() ?? '';
}

/**
 * 本文から文（。で区切り）を抽出する
 */
function extractSentences(body: string): string[] {
  return body
    .split(/[。\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && s.length < 100);
}

/**
 * 分布のトップ値を取得する
 */
function getTopValue<T extends string>(
  distribution: Distribution<T>,
): T | undefined {
  let maxCount = 0;
  let topKey: T | undefined;
  for (const [key, count] of Object.entries(distribution)) {
    if ((count as number) > maxCount) {
      maxCount = count as number;
      topKey = key as T;
    }
  }
  return topKey;
}

/**
 * 分布にカウントを追加する
 */
function incrementDistribution<T extends string>(
  dist: Distribution<T>,
  key: T,
): void {
  dist[key] = ((dist[key] ?? 0) + 1) as Distribution<T>[T];
}

/**
 * 履歴からメール統計を分析する
 * 3通未満の場合は null を返す
 */
export function analyzeMailHistory(
  history: MailHistoryItem[],
): MailStatistics | null {
  if (history.length < MIN_MAILS_FOR_ANALYSIS) {
    return null;
  }

  let totalBodyLength = 0;
  let totalSubjectLength = 0;

  const honorificsDistribution: Distribution<HonorificsLevel> = {};
  const mailLengthDistribution: Distribution<MailLength> = {};
  const atmosphereDistribution: Distribution<Atmosphere> = {};
  const urgencyDistribution: Distribution<Urgency> = {};
  const purposeCategoryDistribution: Distribution<PurposeCategory> = {};

  const openingsMap = new Map<string, number>();
  const closingsMap = new Map<string, number>();
  const sentenceCountMap = new Map<string, number>();

  for (const item of history) {
    totalBodyLength += item.body.length;
    totalSubjectLength += item.subject.length;

    // generationContext がある場合のみトーン分布を計算
    if (item.generationContext) {
      const ctx = item.generationContext;
      incrementDistribution(honorificsDistribution, ctx.tone.honorificsLevel);
      incrementDistribution(mailLengthDistribution, ctx.tone.mailLength);
      incrementDistribution(atmosphereDistribution, ctx.tone.atmosphere);
      incrementDistribution(urgencyDistribution, ctx.tone.urgency);
      incrementDistribution(purposeCategoryDistribution, ctx.purposeCategory);
    }

    // フレーズ抽出（全アイテムから）
    const opening = extractOpening(item.body);
    if (opening) {
      openingsMap.set(opening, (openingsMap.get(opening) ?? 0) + 1);
    }

    const closing = extractClosing(item.body);
    if (closing) {
      closingsMap.set(closing, (closingsMap.get(closing) ?? 0) + 1);
    }

    // 共通フレーズ抽出
    for (const sentence of extractSentences(item.body)) {
      sentenceCountMap.set(
        sentence,
        (sentenceCountMap.get(sentence) ?? 0) + 1,
      );
    }
  }

  // 2通以上に出現するフレーズを共通フレーズとする
  const commonPhrases = [...sentenceCountMap.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PHRASES)
    .map(([phrase]) => phrase);

  // 頻出順にソートしてトップN件を取得
  const sortedOpenings = [...openingsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PHRASES)
    .map(([phrase]) => phrase);

  const sortedClosings = [...closingsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PHRASES)
    .map(([phrase]) => phrase);

  const phrasePatterns: PhrasePatterns = {
    openings: sortedOpenings,
    closings: sortedClosings,
    commonPhrases,
  };

  return {
    totalMailsAnalyzed: history.length,
    averageBodyLength: Math.round(totalBodyLength / history.length),
    averageSubjectLength: Math.round(totalSubjectLength / history.length),
    honorificsDistribution,
    mailLengthDistribution,
    atmosphereDistribution,
    urgencyDistribution,
    purposeCategoryDistribution,
    phrasePatterns,
  };
}

/**
 * LearningProfile から learningContext を構築する
 */
export function buildLearningContext(
  profile: LearningProfile,
): LearningContext {
  const { statistics, preferences } = profile;

  const context: LearningContext = {};

  // フレーズパターン
  if (statistics.phrasePatterns.openings.length > 0) {
    context.preferredOpenings = statistics.phrasePatterns.openings;
  }
  if (statistics.phrasePatterns.closings.length > 0) {
    context.preferredClosings = statistics.phrasePatterns.closings;
  }

  // 平均文字数
  if (statistics.averageBodyLength > 0) {
    context.averageBodyLength = statistics.averageBodyLength;
  }

  // ユーザー設定
  if (preferences.signature.trim()) {
    context.signature = preferences.signature.trim();
  }
  if (preferences.writingStyleNotes.trim()) {
    context.writingStyleNotes = preferences.writingStyleNotes.trim();
  }

  return context;
}

/**
 * 分布からよく使うトーンの表示文字列を生成する
 */
export function getTopDistributionLabel<T extends string>(
  distribution: Distribution<T>,
): string | null {
  const top = getTopValue(distribution);
  return top ?? null;
}
