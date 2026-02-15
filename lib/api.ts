// 共通APIクライアントモジュール

const API_BASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1`
    : 'https://api.example.com';
const TIMEOUT_MS = 30000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * 認証トークンを取得する
 * Supabase Auth のセッションからアクセストークンを取得する。
 * 未認証の場合は anon key をフォールバックとして使用。
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    // Supabase 未初期化時はフォールバック
  }
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null;
}

/**
 * 共通APIクライアント関数
 * - Authorization ヘッダーの自動付与
 * - Content-Type: application/json の自動設定
 * - AbortController によるタイムアウト制御
 * - エラーハンドリングと型付きレスポンス
 */
export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers: customHeaders } = options;

  // タイムアウト制御用の AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // ヘッダーの構築
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // 認証トークンがあれば Authorization ヘッダーを追加
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${path}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // レスポンスのエラーチェック
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    // 204 No Content の場合は空オブジェクトを返す
    if (response.status === 204) {
      return {} as T;
    }

    const data: T = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${TIMEOUT_MS}ms`,
        408,
        'Request Timeout',
      );
    }

    if (error instanceof TypeError) {
      // fetch の TypeError はネットワークエラーを示す
      throw new ApiError(
        'Network error: Unable to reach the server',
        0,
        error.message,
      );
    }

    throw new ApiError(
      'An unexpected error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * API固有のエラークラス
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export default apiClient;
