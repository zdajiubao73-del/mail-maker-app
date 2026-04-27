// AIメール生成サービス
// Supabase Edge Function 経由で OpenAI GPT API を呼び出す
// EXPO_PUBLIC_USE_MOCK_AI=true 時はモック実装にフォールバック

import type { MailGenerationRequest, GeneratedMail, RewriteRequest, ReplyRequest } from '@/types/mail';
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
    const trimmedSignature = signature.trim();
    // すでに末尾に署名が含まれている場合は追加しない（再生成時の二重追加を防ぐ）
    if (!body.trimEnd().endsWith(trimmedSignature)) {
      body += `\n\n${signature}`;
    }
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

/**
 * 下書きメールをAIでリライト（整える）する
 */
export async function rewriteMail(request: RewriteRequest): Promise<GeneratedMail> {
  if (useMock()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const opening = request.openingText?.trim() || 'お世話になっております。';
    const styleNote = request.writingStyleNotes?.trim()
      ? `\n[文体指示反映: ${request.writingStyleNotes.trim()}]`
      : '';
    let body = `${opening}\n\n${request.draftText}${styleNote}\n\n何卒よろしくお願いいたします。`;
    if (request.signature?.trim()) {
      body += `\n\n${request.signature.trim()}`;
    }
    return {
      id: generateId(),
      subject: '【整形済み】ご確認のお願い',
      body,
      createdAt: new Date(),
    };
  }

  const { data, error } = await supabase.functions.invoke('generate-mail', {
    body: { mode: 'rewrite', ...request },
  });

  if (error) {
    throw new MailGenerationError(
      error.name === 'FunctionsFetchError'
        ? 'ネットワークエラーが発生しました。接続を確認してください。'
        : 'メールの整形に失敗しました。',
      error.name === 'FunctionsFetchError' ? 'NETWORK' : 'API_ERROR',
    );
  }

  if (!data?.subject || !data?.body) {
    throw new MailGenerationError('AIからの応答が不完全です。再度お試しください。', 'API_ERROR');
  }

  return { id: generateId(), subject: data.subject, body: data.body, createdAt: new Date() };
}

/**
 * 受け取ったメールに対する返信を生成する
 */
export async function generateReply(request: ReplyRequest): Promise<GeneratedMail> {
  if (useMock()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const opening = request.openingText?.trim() || 'お世話になっております。';
    const styleNote = request.writingStyleNotes?.trim()
      ? `\n[文体指示反映: ${request.writingStyleNotes.trim()}]`
      : '';
    let body = `${opening}\n\nご連絡いただきありがとうございます。\n${request.replyIntent}${styleNote}\n\n何卒よろしくお願いいたします。`;
    if (request.signature?.trim()) {
      body += `\n\n${request.signature.trim()}`;
    }
    return {
      id: generateId(),
      subject: 'Re: ご連絡ありがとうございます',
      body,
      createdAt: new Date(),
    };
  }

  const { data, error } = await supabase.functions.invoke('generate-mail', {
    body: { mode: 'reply', ...request },
  });

  if (error) {
    throw new MailGenerationError(
      error.name === 'FunctionsFetchError'
        ? 'ネットワークエラーが発生しました。接続を確認してください。'
        : '返信の生成に失敗しました。',
      error.name === 'FunctionsFetchError' ? 'NETWORK' : 'API_ERROR',
    );
  }

  if (!data?.subject || !data?.body) {
    throw new MailGenerationError('AIからの応答が不完全です。再度お試しください。', 'API_ERROR');
  }

  return { id: generateId(), subject: data.subject, body: data.body, createdAt: new Date() };
}

/**
 * スクリーンショットからメールテキストを抽出する（OCR）
 */
export async function extractTextFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  if (useMock()) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return '（モック）お世話になっております。\n\n先日のご提案について確認させてください。\n\nよろしくお願いいたします。';
  }

  const { data, error } = await supabase.functions.invoke('generate-mail', {
    body: { mode: 'extract_text', imageBase64, mimeType },
  });

  if (error) {
    throw new MailGenerationError(
      error.name === 'FunctionsFetchError'
        ? 'ネットワークエラーが発生しました。接続を確認してください。'
        : 'テキストの抽出に失敗しました。',
      error.name === 'FunctionsFetchError' ? 'NETWORK' : 'API_ERROR',
    );
  }

  if (!data?.text) {
    throw new MailGenerationError('テキストを抽出できませんでした。', 'API_ERROR');
  }

  return data.text;
}
