/**
 * メールアドレスのバリデーション（RFC 5321 概ね準拠）
 * - 254文字以内
 * - ローカル部: 英数字と一部記号、連続ドット禁止
 * - ドメイン部: 英数字とハイフン、TLD 2文字以上
 */
export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  // ローカル部の連続ドット禁止
  const localPart = email.split('@')[0];
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }
  return true;
}

// --- 受信者数制限 ---

const MAX_CC_RECIPIENTS = 10;
const MAX_BCC_RECIPIENTS = 10;
const MAX_TOTAL_RECIPIENTS = 20;

/**
 * CC/BCC受信者数のバリデーション
 * - CC: 最大10件
 * - BCC: 最大10件
 * - 合計（to含む）: 最大20件
 */
export function validateRecipientCounts(params: {
  cc?: string[];
  bcc?: string[];
}): string | null {
  const ccCount = params.cc?.length ?? 0;
  const bccCount = params.bcc?.length ?? 0;
  const totalCount = 1 + ccCount + bccCount; // to + cc + bcc

  if (ccCount > MAX_CC_RECIPIENTS) {
    return `CCは${MAX_CC_RECIPIENTS}件以内にしてください。（現在${ccCount}件）`;
  }
  if (bccCount > MAX_BCC_RECIPIENTS) {
    return `BCCは${MAX_BCC_RECIPIENTS}件以内にしてください。（現在${bccCount}件）`;
  }
  if (totalCount > MAX_TOTAL_RECIPIENTS) {
    return `送信先の合計は${MAX_TOTAL_RECIPIENTS}件以内にしてください。（現在${totalCount}件）`;
  }
  return null;
}

// --- テキストサニタイズ ---

/**
 * Unicode正規化（NFKC）+ 制御文字・ゼロ幅文字の除去
 */
export function sanitizeText(input: string): string {
  return (
    input
      // NFKC正規化
      .normalize('NFKC')
      // ゼロ幅文字の除去
      .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, '')
      // 制御文字の除去（改行・タブ以外）
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  );
}
