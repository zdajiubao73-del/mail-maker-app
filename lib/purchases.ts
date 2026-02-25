// RevenueCat 課金管理モジュール
// API キーが設定されていない場合やネイティブモジュール未対応時はモック動作

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go で実行中かどうか */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  default: '',
});

const PREMIUM_ENTITLEMENT_ID = 'premium';

/** RevenueCat の設定済みかどうか */
let isConfigured = false;

/** ネイティブモジュールが利用可能かどうか */
let nativeAvailable = false;

/** 動的にロードした Purchases モジュール */
let PurchasesModule: typeof import('react-native-purchases').default | null = null;

/** サブスクリプション状態の詳細 */
export type SubscriptionStatus = {
  isActive: boolean;
  periodType: 'TRIAL' | 'NORMAL' | 'INTRO' | 'PREPAID' | null;
  expirationDate: string | null;
  willRenew: boolean;
};

/**
 * ネイティブモジュールを安全に読み込む
 */
async function loadNativeModule(): Promise<boolean> {
  if (PurchasesModule) return true;
  try {
    const mod = await import('react-native-purchases');
    PurchasesModule = mod.default;
    nativeAvailable = true;
    return true;
  } catch {
    if (__DEV__) console.log('[Purchases] Native module not available — running in mock mode');
    nativeAvailable = false;
    return false;
  }
}

/**
 * RevenueCat を初期化する
 * アプリ起動時に1回だけ呼ぶ
 */
export async function initializePurchases(): Promise<void> {
  if (isExpoGo) {
    if (__DEV__) console.log('[Purchases] Expo Go detected — running in mock mode');
    return;
  }

  if (!REVENUECAT_API_KEY) {
    if (__DEV__) console.log('[Purchases] API key not set — running in mock mode');
    return;
  }

  if (isConfigured) return;

  const loaded = await loadNativeModule();
  if (!loaded || !PurchasesModule) return;

  try {
    if (__DEV__) {
      const { LOG_LEVEL } = await import('react-native-purchases');
      PurchasesModule.setLogLevel(LOG_LEVEL.WARN);
    }

    PurchasesModule.configure({ apiKey: REVENUECAT_API_KEY });
    isConfigured = true;
  } catch (error) {
    if (__DEV__) console.warn('[Purchases] Failed to initialize:', error);
  }
}

/**
 * 利用可能なパッケージ（月額/年額）を取得する
 * 初回失敗時は1回だけリトライする
 */
export async function getOfferings(): Promise<unknown[]> {
  if (!isConfigured || !PurchasesModule) return [];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const offerings = await PurchasesModule.getOfferings();
      if (!offerings.current) {
        if (__DEV__) console.log(`[Purchases] No current offering (attempt ${attempt + 1})`);
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        return [];
      }
      return offerings.current.availablePackages;
    } catch (error) {
      if (__DEV__) console.error(`[Purchases] Failed to get offerings (attempt ${attempt + 1}):`, error);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return [];
    }
  }
  return [];
}

/**
 * パッケージを購入する
 */
export async function purchasePackage(
  pkg: unknown,
): Promise<{ success: boolean; error?: string }> {
  if (!PurchasesModule) return { success: false, error: '課金システム未対応' };

  try {
    const { customerInfo } = await PurchasesModule.purchasePackage(pkg as never);
    const isPremium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    return { success: isPremium };
  } catch (error: unknown) {
    const err = error as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    return {
      success: false,
      error: err.message ?? '購入処理に失敗しました。',
    };
  }
}

/**
 * 購入を復元する
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!isConfigured || !PurchasesModule) {
    return { success: false, isPremium: false, error: '課金システム未設定' };
  }

  try {
    const customerInfo = await PurchasesModule.restorePurchases();
    const isPremium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    return { success: true, isPremium };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      isPremium: false,
      error: err.message ?? '購入の復元に失敗しました。',
    };
  }
}

/**
 * 現在のユーザーがプレミアムかチェック
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!isConfigured || !PurchasesModule) return false;

  try {
    const customerInfo = await PurchasesModule.getCustomerInfo();
    return (
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * サブスクリプションの詳細情報を取得する
 * periodType で TRIAL / NORMAL を判別可能
 */
export async function getSubscriptionDetails(): Promise<SubscriptionStatus> {
  if (!isConfigured || !PurchasesModule) {
    return { isActive: false, periodType: null, expirationDate: null, willRenew: false };
  }

  try {
    const customerInfo = await PurchasesModule.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (!entitlement) {
      return { isActive: false, periodType: null, expirationDate: null, willRenew: false };
    }

    return {
      isActive: true,
      periodType: (entitlement.periodType as SubscriptionStatus['periodType']) ?? 'NORMAL',
      expirationDate: entitlement.expirationDate ?? null,
      willRenew: entitlement.willRenew ?? false,
    };
  } catch {
    return { isActive: false, periodType: null, expirationDate: null, willRenew: false };
  }
}

/**
 * トライアル適格性をチェックする
 * ユーザーが Apple 無料トライアルの対象かどうかを判定
 * RevenueCat 未設定時は全プロダクトを適格として返す（開発時のモック動作）
 */
let trialEligibilityCache: Record<string, boolean> | null = null;

export async function checkTrialEligibility(
  productIds: string[],
): Promise<Record<string, boolean>> {
  if (trialEligibilityCache) return trialEligibilityCache;

  if (!isConfigured || !PurchasesModule) {
    // 未設定時は全て適格（開発環境用）
    const result: Record<string, boolean> = {};
    for (const id of productIds) {
      result[id] = true;
    }
    trialEligibilityCache = result;
    return result;
  }

  try {
    const eligibilityMap =
      await PurchasesModule.checkTrialOrIntroductoryPriceEligibility(productIds);
    const result: Record<string, boolean> = {};
    for (const id of productIds) {
      // INTRO_ELIGIBILITY_STATUS_ELIGIBLE = 2
      result[id] = (eligibilityMap[id] as any)?.status === 2;
    }
    trialEligibilityCache = result;
    return result;
  } catch (error) {
    if (__DEV__) console.warn('[Purchases] Failed to check trial eligibility:', error);
    // エラー時は適格として扱う（ペイウォールでブロックしないため）
    const result: Record<string, boolean> = {};
    for (const id of productIds) {
      result[id] = true;
    }
    return result;
  }
}

/**
 * RevenueCat が設定済みかどうか
 */
export function isPurchasesConfigured(): boolean {
  return isConfigured;
}

/**
 * 課金システムの診断情報を取得する（デバッグ用）
 */
export function getPurchasesDiagnostics(): {
  isExpoGo: boolean;
  hasApiKey: boolean;
  isConfigured: boolean;
  nativeAvailable: boolean;
} {
  return {
    isExpoGo,
    hasApiKey: !!REVENUECAT_API_KEY,
    isConfigured,
    nativeAvailable,
  };
}

/**
 * 顧客情報の変更を監視するリスナーを登録する
 * サブスクリプション状態が変わったときにコールバックが呼ばれる
 */
export function addCustomerInfoListener(
  callback: (status: SubscriptionStatus) => void,
): () => void {
  if (!isConfigured || !PurchasesModule) return () => {};

  const listener = (customerInfo: { entitlements: { active: Record<string, any> } }) => {
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (!entitlement) {
      callback({ isActive: false, periodType: null, expirationDate: null, willRenew: false });
      return;
    }

    callback({
      isActive: true,
      periodType: (entitlement.periodType as SubscriptionStatus['periodType']) ?? 'NORMAL',
      expirationDate: entitlement.expirationDate ?? null,
      willRenew: entitlement.willRenew ?? false,
    });
  };

  PurchasesModule.addCustomerInfoUpdateListener(listener);

  return () => {
    PurchasesModule?.removeCustomerInfoUpdateListener(listener);
  };
}
