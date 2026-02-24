// Microsoft OAuth 2.0 認証モジュール
// expo-auth-session を使用して Microsoft Graph API のアクセストークンを取得する

import {
  useAuthRequest,
  ResponseType,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';

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

// 連絡先インポート用スコープ（Contacts 読み取り専用）
const CONTACTS_SCOPES = [
  'Contacts.Read',
  'User.Read',
  'offline_access',
];

// SecureStore のキー
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'microsoft_access_token',
  REFRESH_TOKEN: 'microsoft_refresh_token',
  EXPIRY: 'microsoft_token_expiry',
  EMAIL: 'microsoft_email',
  TOKEN_REF: 'microsoft_token_ref',
} as const;

// 連絡先トークン用の SecureStore キー
const CONTACTS_TOKEN_KEYS = {
  ACCESS_TOKEN: 'microsoft_contacts_access_token',
  REFRESH_TOKEN: 'microsoft_contacts_refresh_token',
  EXPIRY: 'microsoft_contacts_token_expiry',
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
    if (__DEV__) {
      const errorData = await response.text();
      console.warn('Microsoft token exchange failed:', errorData);
    }
    throw new Error('トークン取得に失敗しました');
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

  // サーバーにトークンを暗号化保存し、tokenRef を取得
  await storeTokenOnServer(tokens);

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
 * トークンをサーバー側に暗号化保存し、tokenRef を SecureStore に保存する
 */
async function storeTokenOnServer(tokens: MicrosoftTokens): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('manage-tokens', {
      body: {
        action: 'store',
        provider: 'microsoft',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        email: tokens.email,
      },
    });

    if (error || !data?.tokenRef) {
      if (__DEV__) console.warn('Failed to store token on server:', error);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_REF, data.tokenRef);
  } catch (err) {
    if (__DEV__) console.warn('storeTokenOnServer error:', err);
  }
}

/**
 * サーバー側のトークン参照IDを取得する
 * tokenRef がない場合は null を返す（フォールバックで accessToken を使用）
 */
export async function getTokenRef(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_REF);
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
 * Microsoft のログアウトエンドポイントを呼び出してセッションを終了する
 */
export async function clearTokens(): Promise<void> {
  // Microsoft ログアウトエンドポイントを呼び出す（fire-and-forget）
  fetch(MICROSOFT_AUTH_CONFIG.revocationEndpoint, {
    method: 'GET',
  }).catch(() => {});

  // サーバー側のトークンも削除（fire-and-forget）
  const tokenRef = await SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_REF);
  if (tokenRef) {
    supabase.functions.invoke('manage-tokens', {
      body: { action: 'delete', tokenRef },
    }).catch(() => {});
  }

  // メインアカウントトークン削除
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.EXPIRY);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.EMAIL);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.TOKEN_REF);

  // 連絡先トークンも同時に削除
  await SecureStore.deleteItemAsync(CONTACTS_TOKEN_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(CONTACTS_TOKEN_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(CONTACTS_TOKEN_KEYS.EXPIRY);
}

/**
 * 連絡先インポート用の useAuthRequest 設定を返す
 */
export function getContactsAuthRequestConfig() {
  return {
    clientId: getClientId(),
    scopes: CONTACTS_SCOPES,
    redirectUri: getRedirectUri(),
    responseType: ResponseType.Code,
    usePKCE: true,
    extraParams: {
      prompt: 'select_account',
    },
  };
}

/**
 * 連絡先用の認可コードをトークンに交換する
 */
export async function exchangeContactsCodeForTokens(
  code: string,
  codeVerifier?: string,
): Promise<{ accessToken: string }> {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: CONTACTS_SCOPES.join(' '),
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const response = await fetch(MICROSOFT_AUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    if (__DEV__) {
      const errorData = await response.text();
      console.warn('Microsoft contacts token exchange failed:', errorData);
    }
    throw new Error('連絡先トークン取得に失敗しました');
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  await saveContactsTokens(data.access_token, data.refresh_token, expiresAt);

  return { accessToken: data.access_token };
}

/**
 * 連絡先用トークンを SecureStore に保存
 */
async function saveContactsTokens(
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number,
): Promise<void> {
  await SecureStore.setItemAsync(CONTACTS_TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(CONTACTS_TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  }
  if (expiresAt) {
    await SecureStore.setItemAsync(CONTACTS_TOKEN_KEYS.EXPIRY, String(expiresAt));
  }
}

/**
 * 連絡先用の有効なアクセストークンを取得する（必要に応じてリフレッシュ）
 */
export async function getContactsAccessToken(): Promise<string | null> {
  const accessToken = await SecureStore.getItemAsync(CONTACTS_TOKEN_KEYS.ACCESS_TOKEN);
  if (!accessToken) return null;

  const expiryStr = await SecureStore.getItemAsync(CONTACTS_TOKEN_KEYS.EXPIRY);
  const expiresAt = expiryStr ? Number(expiryStr) : 0;

  if (expiresAt > Date.now() + 5 * 60 * 1000) {
    return accessToken;
  }

  // リフレッシュトークンで更新を試みる
  const refreshToken = await SecureStore.getItemAsync(CONTACTS_TOKEN_KEYS.REFRESH_TOKEN);
  if (refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      await saveContactsTokens(refreshed.accessToken, refreshed.refreshToken, refreshed.expiresAt);
      return refreshed.accessToken;
    } catch {
      return null;
    }
  }

  return null;
}

// useAuthRequest のフック型を re-export
export { useAuthRequest } from 'expo-auth-session';
