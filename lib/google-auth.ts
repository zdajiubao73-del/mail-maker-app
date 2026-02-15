// Google OAuth 2.0 認証モジュール
// expo-auth-session を使用して Gmail API のアクセストークンを取得する

import {
  useAuthRequest,
  ResponseType,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

// WebBrowser の warm-up（iOS パフォーマンス最適化）
WebBrowser.maybeCompleteAuthSession();

// Google OAuth の設定
const GOOGLE_AUTH_CONFIG = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Gmail API に必要なスコープ（Gmail送信含む）
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ログイン用スコープ（プロフィール情報のみ、Gmail送信なし）
const LOGIN_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// SecureStore のキー
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'google_access_token',
  REFRESH_TOKEN: 'google_refresh_token',
  EXPIRY: 'google_token_expiry',
  EMAIL: 'google_email',
} as const;

/**
 * Google OAuth クライアントIDを取得
 * .env.local の EXPO_PUBLIC_GOOGLE_CLIENT_ID から取得
 */
function getClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    if (__DEV__) console.warn('EXPO_PUBLIC_GOOGLE_CLIENT_ID が設定されていません');
    return '';
  }
  return clientId;
}

/**
 * リダイレクトURIを生成
 * Google iOS OAuth の標準方式: 逆引きClient ID + /oauthredirect
 * 例: com.googleusercontent.apps.123456789-xxx:/oauthredirect
 */
export function getRedirectUri(): string {
  const clientId = getClientId();
  if (!clientId) return 'https://localhost/placeholder';
  const reversedId = clientId.split('.').reverse().join('.');
  return `${reversedId}:/oauthredirect`;
}

/**
 * Google OAuth の discovery document
 */
export const discovery = GOOGLE_AUTH_CONFIG;

/**
 * useAuthRequest フック用の設定を返す
 */
export function getAuthRequestConfig() {
  return {
    clientId: getClientId(),
    scopes: SCOPES,
    redirectUri: getRedirectUri(),
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  };
}

/**
 * ログイン用の useAuthRequest 設定を返す（gmail.send スコープなし）
 */
export function getLoginAuthRequestConfig() {
  return {
    clientId: getClientId(),
    scopes: LOGIN_SCOPES,
    redirectUri: getRedirectUri(),
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  };
}

/** トークン情報 */
export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  email: string;
};

/**
 * 認可コードをアクセストークンに交換する
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier?: string,
): Promise<GoogleTokens> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const response = await fetch(GOOGLE_AUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`トークン取得に失敗しました: ${errorData}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  // ユーザー情報を取得
  const email = await fetchUserEmail(data.access_token);

  const tokens: GoogleTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    email,
  };

  // SecureStore に保存
  await saveTokens(tokens);

  return tokens;
}

/**
 * ユーザーのメールアドレスを取得
 */
async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  const data = await response.json();
  return data.email ?? '';
}

/**
 * ユーザープロフィール（名前 + メール）を取得
 */
export async function fetchUserProfile(
  accessToken: string,
): Promise<{ name: string; email: string }> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  const data = await response.json();
  return {
    name: data.name ?? '',
    email: data.email ?? '',
  };
}

/**
 * トークンを SecureStore に保存
 */
async function saveTokens(tokens: GoogleTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }
  await SecureStore.setItemAsync(TOKEN_KEYS.EXPIRY, String(tokens.expiresAt));
  await SecureStore.setItemAsync(TOKEN_KEYS.EMAIL, tokens.email);
}

/**
 * 保存されたトークンを取得
 */
export async function getSavedTokens(): Promise<GoogleTokens | null> {
  const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  if (!accessToken) return null;

  const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  const expiryStr = await SecureStore.getItemAsync(TOKEN_KEYS.EXPIRY);
  const email = await SecureStore.getItemAsync(TOKEN_KEYS.EMAIL);

  return {
    accessToken,
    refreshToken: refreshToken ?? undefined,
    expiresAt: expiryStr ? Number(expiryStr) : 0,
    email: email ?? '',
  };
}

/**
 * トークンが有効期限内かチェック（5分のバッファ）
 */
export function isTokenValid(tokens: GoogleTokens): boolean {
  return tokens.expiresAt > Date.now() + 5 * 60 * 1000;
}

/**
 * リフレッシュトークンを使ってアクセストークンを更新
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokens> {
  const clientId = getClientId();

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_AUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('トークンの更新に失敗しました。再認証が必要です。');
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  const email = await SecureStore.getItemAsync(TOKEN_KEYS.EMAIL);

  const tokens: GoogleTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt,
    email: email ?? '',
  };

  await saveTokens(tokens);
  return tokens;
}

/**
 * 有効なアクセストークンを取得する（必要に応じてリフレッシュ）
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getSavedTokens();
  if (!tokens) return null;

  if (isTokenValid(tokens)) {
    return tokens.accessToken;
  }

  // リフレッシュトークンがあれば更新を試みる
  if (tokens.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * 保存されたトークンを削除（ログアウト時）
 */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.EXPIRY);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.EMAIL);
}

// useAuthRequest のフック型を re-export
export { useAuthRequest } from 'expo-auth-session';
