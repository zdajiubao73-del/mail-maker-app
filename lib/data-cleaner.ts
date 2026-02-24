/**
 * 全ローカルデータの削除ユーティリティ
 *
 * プライバシーポリシーの「データ削除リクエスト」および
 * 利用規約の「退会・アカウント削除」で使用する。
 */

import { clearTokens as clearGoogleTokens } from '@/lib/google-auth';
import { clearTokens as clearMicrosoftTokens } from '@/lib/microsoft-auth';
import { clearTokens as clearAppleTokens } from '@/lib/apple-auth';
import { useMailStore } from '@/store/use-mail-store';
import { useContactStore } from '@/store/use-contact-store';
import { useLearningStore } from '@/store/use-learning-store';
import { usePresetStore } from '@/store/use-preset-store';
import { usePlanStore } from '@/store/use-plan-store';
import { useAuthStore } from '@/store/use-auth-store';

/**
 * 全ストアのデータをリセットする（ローカル永続化データも消去される）
 */
function clearAllStores() {
  // メール履歴・作成中データをリセット
  useMailStore.setState({ history: [] });
  useMailStore.getState().resetCreation();

  // 連絡先をリセット
  useContactStore.setState({ contacts: [] });

  // 学習データをリセット
  useLearningStore.getState().clearLearningData();

  // プリセットをリセット
  usePresetStore.setState({ presets: [] });

  // プラン情報をリセット
  usePlanStore.setState({
    currentPlan: 'free',
    subscriptionExpirationDate: null,
    willRenew: false,
    periodType: null,
    monthlyGenerationCount: 0,
    monthlyGenerationResetMonth: null,
  });

  // メールアカウント連携をリセット
  useAuthStore.setState({ mailAccounts: [] });
}

/**
 * 全 OAuth トークンを削除する
 */
async function clearAllTokens() {
  await Promise.all([
    clearGoogleTokens().catch(() => {}),
    clearMicrosoftTokens().catch(() => {}),
    clearAppleTokens().catch(() => {}),
  ]);
}

/**
 * 全ローカルデータを削除する（トークン + ストアデータ）
 * データ削除リクエストで使用
 */
export async function clearAllLocalData() {
  await clearAllTokens();
  clearAllStores();
}

/**
 * 全ローカルデータを削除する
 * アカウント削除（データリセット）で使用
 */
export async function deleteAccountLocally() {
  await clearAllTokens();
  clearAllStores();
}
