// Apple Sign In 認証モジュール
// expo-apple-authentication を使用して Apple ID でログインする

import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore のキー
const STORE_KEYS = {
  USER_ID: 'apple_user_id',
  EMAIL: 'apple_email',
  FULL_NAME: 'apple_full_name',
  IDENTITY_TOKEN: 'apple_identity_token',
  AUTHORIZATION_CODE: 'apple_authorization_code',
} as const;

/** Apple認証の結果 */
export type AppleCredentials = {
  userId: string;
  email: string;
  fullName: string;
  identityToken: string | null;
};

/**
 * Apple Sign In が利用可能かチェック（iOS 13+ のみ）
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Apple Sign In を実行
 * Apple は初回サインイン時のみ名前・メールを提供するため、SecureStore にキャッシュする
 */
export async function signInWithApple(): Promise<AppleCredentials> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  // 保存済みのクレデンシャルを取得（2回目以降のフォールバック用）
  const saved = await getSavedCredentials();

  // Apple は初回のみ名前・メールを返す。2回目以降は null になる
  const fullName = credential.fullName
    ? [credential.fullName.familyName, credential.fullName.givenName]
        .filter(Boolean)
        .join(' ')
    : saved?.fullName ?? '';

  const email = credential.email ?? saved?.email ?? '';

  const result: AppleCredentials = {
    userId: credential.user,
    email,
    fullName,
    identityToken: credential.identityToken ?? null,
  };

  // SecureStore にキャッシュ保存
  await SecureStore.setItemAsync(STORE_KEYS.USER_ID, result.userId);
  if (email) {
    await SecureStore.setItemAsync(STORE_KEYS.EMAIL, email);
  }
  if (fullName) {
    await SecureStore.setItemAsync(STORE_KEYS.FULL_NAME, fullName);
  }
  if (credential.identityToken) {
    await SecureStore.setItemAsync(
      STORE_KEYS.IDENTITY_TOKEN,
      credential.identityToken,
    );
  }
  if (credential.authorizationCode) {
    await SecureStore.setItemAsync(
      STORE_KEYS.AUTHORIZATION_CODE,
      credential.authorizationCode,
    );
  }

  return result;
}

/**
 * 保存済みのクレデンシャルを取得
 */
export async function getSavedCredentials(): Promise<AppleCredentials | null> {
  const userId = await SecureStore.getItemAsync(STORE_KEYS.USER_ID);
  if (!userId) return null;

  const email = (await SecureStore.getItemAsync(STORE_KEYS.EMAIL)) ?? '';
  const fullName = (await SecureStore.getItemAsync(STORE_KEYS.FULL_NAME)) ?? '';
  const identityToken =
    (await SecureStore.getItemAsync(STORE_KEYS.IDENTITY_TOKEN)) ?? null;

  return { userId, email, fullName, identityToken };
}

/**
 * 保存されたApple認証データを全削除（ログアウト時）
 */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEYS.USER_ID);
  await SecureStore.deleteItemAsync(STORE_KEYS.EMAIL);
  await SecureStore.deleteItemAsync(STORE_KEYS.FULL_NAME);
  await SecureStore.deleteItemAsync(STORE_KEYS.IDENTITY_TOKEN);
  await SecureStore.deleteItemAsync(STORE_KEYS.AUTHORIZATION_CODE);
}
