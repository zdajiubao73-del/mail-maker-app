// Microsoft OAuth 2.0 認証モジュール
// expo-auth-session を使用して Microsoft Graph API のアクセストークンを取得する

import {
  useAuthRequest,
  ResponseType,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

// WebBrowser の warm-up（iOS パフォーマンス最適化）
WebBrowser.maybeCompleteAuthSession();

// Microsoft OAuth の設定（マルチテナント: /common）
const MICROSOFT_AUTH_CONFIG = {
  authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  revocationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
};

// Microsoft Graph API に必要なスコープ
const SCOPES = [
  'Mail.Send',
  'User.Read',
  'offline_access',
];

// SecureStore のキー
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'microsoft_access_token',
  REFRESH_TOKEN: 'microsoft_refresh_token',
  EXPIRY: 'microsoft_token_expiry',
  EMAIL: 'microsoft_email',
} as const;

/**
 * Microsoft OAuth クライアントIDを取得
 * .env.local の EXPO_PUBLIC_MICROSOFT_CLIENT_ID から取得
 */
function getClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;
  if (!clientId) {
    if (__DEV__) console.warn('EXPO_PUBLIC_MICROSOFT_CLIENT_ID が設定されていません');
    return '';
  }
  return clientId;
}

/**
 * リダイレクトURIを生成
 * Microsoft のモバイルアプリ用リダイレクトURI
 */
export function getRedirectUri(): string {
  return 'msauth.com.mailmaker.app://auth';
}

/**
 * Microsoft OAuth の discovery document
 */
export const discovery = MICROSOFT_AUTH_CONFIG;

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
      prompt: 'select_account',
    },
  };
}

/** トークン情報 */
export type MicrosoftTokens = {
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
): Promise<MicrosoftTokens> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: SCOPES.join(' '),
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const response = await fetch(MICROSOFT_AUTH_CONFIG.tokenEndpoint, {
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

  const tokens: MicrosoftTokens = {
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
    'https://graph.microsoft.com/v1.0/me',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  const data = await response.json();
  return data.mail ?? data.userPrincipalName ?? '';
}

/**
 * ユーザープロフィール（名前 + メール）を取得
 */
export async function fetchUserProfile(
  accessToken: string,
): Promise<{ name: string; email: string }> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  const data = await response.json();
  return {
    name: data.displayName ?? '',
    email: data.mail ?? data.userPrincipalName ?? '',
  };
}

/**
 * トークンを SecureStore に保存
 */
async function saveTokens(tokens: MicrosoftTokens): Promise<void> {
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
export async function getSavedTokens(): Promise<MicrosoftTokens | null> {
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
export function isTokenValid(tokens: MicrosoftTokens): boolean {
  return tokens.expiresAt > Date.now() + 5 * 60 * 1000;
}

/**
 * リフレッシュトークンを使ってアクセストークンを更新
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<MicrosoftTokens> {
  const clientId = getClientId();

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' '),
  });

  const response = await fetch(MICROSOFT_AUTH_CONFIG.tokenEndpoint, {
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

  const tokens: MicrosoftTokens = {
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
