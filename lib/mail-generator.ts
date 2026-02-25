// AIメール生成サービス
// Supabase Edge Function 経由で OpenAI GPT API を呼び出す
// EXPO_PUBLIC_USE_MOCK_AI=true 時はモック実装にフォールバック

import type { MailGenerationRequest, GeneratedMail } from '@/types/mail';
import { supabase } from '@/lib/supabase';

/**
 * メール生成エラークラス
 */
export class MailGenerationError extends Error {
  public readonly code: 'VALIDATION' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';

  constructor(message: string, code: MailGenerationError['code']) {
    super(message);
    this.name = 'MailGenerationError';
    this.code = code;
  }
}

/**
 * ユニークIDを生成する
 */
function generateId(): string {
  return `mail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * モックフォールバックかどうかを判定する
 * 本番ビルドではモックを無効化
 */
function useMock(): boolean {
  if (!__DEV__) return false;
  return process.env.EXPO_PUBLIC_USE_MOCK_AI === 'true';
}

/**
 * Supabase Edge Function 経由でAIメールを生成する
 */
async function generateMailViaAPI(
  request: MailGenerationRequest,
): Promise<GeneratedMail> {
  const { data, error } = await supabase.functions.invoke('generate-mail', {
    body: request,
  });

  if (error) {
    // FunctionsHttpError: Edge Function が非 2xx を返した場合
    // FunctionsRelayError: Edge Function への接続エラー
    // FunctionsFetchError: fetch 自体のネットワークエラー
    const errorName = error.name ?? '';

    if (errorName === 'FunctionsFetchError') {
      throw new MailGenerationError(
        'ネットワークエラーが発生しました。接続を確認してください。',
        'NETWORK',
      );
    }

    // Edge Function からのエラーレスポンス解析を試みる
    let errorMessage = 'メールの生成に失敗しました。';
    let errorCode: MailGenerationError['code'] = 'API_ERROR';

    try {
      const errorBody = typeof error.message === 'string' ? JSON.parse(error.message) : null;
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // JSON解析失敗時はデフォルトメッセージを使用
    }

    // data にエラー情報が含まれる場合
    if (data?.error) {
      errorMessage = data.error;
    }

    // HTTP ステータスに基づくエラーコード推定
    const context = error.context as { status?: number } | undefined;
    const status = context?.status;
    if (status === 400) {
      errorCode = 'VALIDATION';
    } else if (status === 503) {
      errorCode = 'RATE_LIMIT';
    }

    throw new MailGenerationError(errorMessage, errorCode);
  }

  if (!data?.subject || !data?.body) {
    throw new MailGenerationError(
      'AIからの応答が不完全です。再度お試しください。',
      'API_ERROR',
    );
  }

  // 署名を末尾に追加（top-level を優先、なければ learningContext）
  let body: string = data.body;
  const signature = request.signature ?? request.learningContext?.signature;
  if (signature) {
    body += `\n\n${signature}`;
  }

  return {
    id: generateId(),
    subject: data.subject,
    body,
    createdAt: new Date(),
  };
}

/**
 * メールを生成する
 *
 * 環境変数 EXPO_PUBLIC_USE_MOCK_AI=true の場合はモック実装にフォールバック。
 * それ以外の場合は Supabase Edge Function 経由で OpenAI GPT API を呼び出す。
 */
export async function generateMail(
  request: MailGenerationRequest,
): Promise<GeneratedMail> {
  if (useMock()) {
    const { generateMail: generateMailMock } = await import(
      '@/lib/mail-generator.mock'
    );
    return generateMailMock(request);
  }

  return generateMailViaAPI(request);
}
