// メール送信サービス
// Gmail OAuth連携済みの場合はSupabase Edge Function経由でGmail APIを呼び出す
// 未連携の場合はモック送信

import { File as ExpoFile } from 'expo-file-system';
import type { MailAccount } from '@/types/user';
import type { Attachment } from '@/types/mail';
import { supabase } from '@/lib/supabase';
import { getValidAccessToken } from '@/lib/google-auth';
import { getValidAccessToken as getMicrosoftAccessToken } from '@/lib/microsoft-auth';
import { isValidEmail, validateRecipientCounts } from '@/lib/validation';

const MAX_ATTACHMENT_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

/** メール送信パラメータ */
export type SendMailParams = {
  account: MailAccount;
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
};

/** メール送信結果 */
export type SendMailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

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
 * 入力値をバリデーションする
 */
function validateInput(params: SendMailParams): string | null {
  const accountError = validateAccount(params.account);
  if (accountError) return accountError;

  if (!isValidEmail(params.to)) {
    return `無効なメールアドレスです: ${params.to}`;
  }
  if (!params.subject.trim()) {
    return '件名が入力されていません。';
  }
  if (!params.body.trim()) {
    return '本文が入力されていません。';
  }
  if (params.cc) {
    for (const ccAddr of params.cc) {
      if (!isValidEmail(ccAddr)) return `無効なCCメールアドレスです: ${ccAddr}`;
    }
  }
  if (params.bcc) {
    for (const bccAddr of params.bcc) {
      if (!isValidEmail(bccAddr)) return `無効なBCCメールアドレスです: ${bccAddr}`;
    }
  }

  // CC/BCC件数制限（多層防御）
  const recipientError = validateRecipientCounts({
    cc: params.cc,
    bcc: params.bcc,
  });
  if (recipientError) return recipientError;

  // 添付ファイルサイズ制限
  if (params.attachments && params.attachments.length > 0) {
    const totalSize = params.attachments.reduce((sum, a) => sum + a.size, 0);
    if (totalSize > MAX_ATTACHMENT_TOTAL_SIZE) {
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
      return `添付ファイルの合計サイズが上限（25MB）を超えています（現在: ${sizeMB}MB）。`;
    }
  }

  return null;
}

/**
 * ArrayBuffer を base64 文字列に変換する
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 添付ファイルをbase64に変換する
 */
async function readAttachmentsAsBase64(
  attachments: Attachment[],
): Promise<{ name: string; mimeType: string; base64: string }[]> {
  const results = await Promise.all(
    attachments.map(async (att) => {
      const file = new ExpoFile(att.uri);
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      return { name: att.name, mimeType: att.mimeType, base64 };
    }),
  );
  return results;
}

/**
 * Gmail API 経由でメールを送信する
 */
async function sendViaGmail(params: SendMailParams): Promise<SendMailResult> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: 'Gmailの認証が切れています。設定画面から再認証してください。',
    };
  }

  let attachmentData: { name: string; mimeType: string; base64: string }[] | undefined;
  if (params.attachments && params.attachments.length > 0) {
    attachmentData = await readAttachmentsAsBase64(params.attachments);
  }

  const { data, error } = await supabase.functions.invoke('send-mail', {
    body: {
      accessToken,
      to: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc,
      bcc: params.bcc,
      attachments: attachmentData,
    },
  });

  if (error) {
    return {
      success: false,
      error: data?.error ?? 'メールの送信に失敗しました。',
    };
  }

  return {
    success: true,
    messageId: data?.messageId,
  };
}

/**
 * Microsoft Graph API 経由でメールを送信する
 */
async function sendViaOutlook(params: SendMailParams): Promise<SendMailResult> {
  const accessToken = await getMicrosoftAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: 'Outlookの認証が切れています。設定画面から再認証してください。',
    };
  }

  let attachmentData: { name: string; mimeType: string; base64: string }[] | undefined;
  if (params.attachments && params.attachments.length > 0) {
    attachmentData = await readAttachmentsAsBase64(params.attachments);
  }

  const { data, error } = await supabase.functions.invoke('send-mail-outlook', {
    body: {
      accessToken,
      to: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc,
      bcc: params.bcc,
      attachments: attachmentData,
    },
  });

  if (error) {
    return {
      success: false,
      error: data?.error ?? 'メールの送信に失敗しました。',
    };
  }

  return {
    success: true,
    messageId: data?.messageId,
  };
}

/**
 * モックメール送信
 */
async function sendMock(params: SendMailParams): Promise<SendMailResult> {
  // 送信のレイテンシをシミュレート
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 1000),
  );

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return {
    success: true,
    messageId: `<${timestamp}.${random}@${params.account.type}.mock>`,
  };
}

/**
 * メールを送信する
 *
 * Gmail アカウントの場合は実際の Gmail API を経由して送信。
 * それ以外のアカウントタイプや、Google OAuth 未設定時はモック送信。
 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  // バリデーション
  const validationError = validateInput(params);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // Gmail かつ Google Client ID が設定されている場合は実際に送信
  const hasGoogleClientId = !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (params.account.type === 'gmail' && hasGoogleClientId) {
    return sendViaGmail(params);
  }

  // Outlook かつ Microsoft Client ID が設定されている場合は実際に送信
  const hasMicrosoftClientId = !!process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
  if (params.account.type === 'outlook' && hasMicrosoftClientId) {
    return sendViaOutlook(params);
  }

  // 本番ビルドではモック送信を無効化
  if (!__DEV__) {
    return {
      success: false,
      error: 'メール送信にはメールアカウントの連携が必要です。設定画面からアカウント連携を行ってください。',
    };
  }

  // 開発環境のみモック送信
  return sendMock(params);
}

/**
 * 送信取り消しを試みる（モック実装）
 * 要件定義書の「送信後5秒取り消し」に対応
 */
export async function cancelSend(
  _messageId: string,
): Promise<{ success: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true };
}
