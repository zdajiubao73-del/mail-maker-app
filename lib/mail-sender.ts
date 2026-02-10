// モックメール送信サービス
// 将来的にはバックエンド経由で Gmail API / Microsoft Graph API を呼び出す

import type { MailAccount } from '@/types/user';

/** メール送信パラメータ */
export type SendMailParams = {
  account: MailAccount;
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
};

/** メール送信結果 */
export type SendMailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * メッセージIDを生成する
 */
function generateMessageId(accountType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `<${timestamp}.${random}@${accountType}.mock>`;
}

/**
 * メールアカウントの認証状態を検証する
 */
function validateAccount(account: MailAccount): string | null {
  if (account.authStatus === 'unauthenticated') {
    return `メールアカウント（${account.email}）が認証されていません。設定画面からアカウント連携を行ってください。`;
  }
  if (account.authStatus === 'expired') {
    return `メールアカウント（${account.email}）の認証が期限切れです。再認証を行ってください。`;
  }
  return null;
}

/**
 * メールアドレスの簡易バリデーション
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * メールを送信する（モック実装）
 *
 * 現時点では常に成功を返すモック実装。
 * 将来的にはバックエンドを経由して以下のAPIを呼び出す：
 * - Gmail: Gmail API (users.messages.send)
 * - Outlook: Microsoft Graph API (sendMail)
 * - Yahoo/iCloud: 各プロバイダのAPI
 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const { account, to, subject, body } = params;

  // アカウントの認証状態チェック
  const accountError = validateAccount(account);
  if (accountError) {
    return {
      success: false,
      error: accountError,
    };
  }

  // メールアドレスのバリデーション
  if (!isValidEmail(to)) {
    return {
      success: false,
      error: `無効なメールアドレスです: ${to}`,
    };
  }

  // 件名と本文の空チェック
  if (!subject.trim()) {
    return {
      success: false,
      error: '件名が入力されていません。',
    };
  }

  if (!body.trim()) {
    return {
      success: false,
      error: '本文が入力されていません。',
    };
  }

  // CC/BCCのバリデーション
  if (params.cc) {
    for (const ccAddr of params.cc) {
      if (!isValidEmail(ccAddr)) {
        return {
          success: false,
          error: `無効なCCメールアドレスです: ${ccAddr}`,
        };
      }
    }
  }

  if (params.bcc) {
    for (const bccAddr of params.bcc) {
      if (!isValidEmail(bccAddr)) {
        return {
          success: false,
          error: `無効なBCCメールアドレスです: ${bccAddr}`,
        };
      }
    }
  }

  // 送信のレイテンシをシミュレート（0.5〜1.5秒）
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 1000),
  );

  // モック: 常に成功を返す
  const messageId = generateMessageId(account.type);

  return {
    success: true,
    messageId,
  };
}

/**
 * 送信取り消しを試みる（モック実装）
 * 要件定義書の「送信後5秒取り消し」に対応
 */
export async function cancelSend(messageId: string): Promise<{ success: boolean; error?: string }> {
  // 取り消し処理のシミュレート
  await new Promise((resolve) => setTimeout(resolve, 300));

  // モック: 常に成功を返す
  return {
    success: true,
  };
}
