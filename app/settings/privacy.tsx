import { useCallback } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearAllLocalData } from '@/lib/data-cleaner';
import { useConsentStore } from '@/store/use-consent-store';

/* -------------------------------------------------------------------------- */
/*  Privacy sections                                                           */
/* -------------------------------------------------------------------------- */

const PRIVACY_SECTIONS = [
  { title: '収集する情報', body: '本アプリでは、以下の情報を収集・利用します。\n\n・認証情報（Apple ID、Googleアカウントのメールアドレス・表示名）\n・メール作成に必要な入力情報（送信相手の関係性、メールの目的、トーン設定、要点等）\n・メール送信先のメールアドレス\n・アプリ利用履歴（生成履歴、設定情報）\n・端末情報（OSバージョン、アプリバージョン）' },
  { title: '情報の利用目的', body: '収集した情報は、以下の目的で利用します。\n\n・AIによるメール文面の生成\n・メールの送信処理\n・アプリの機能改善\n・ユーザーサポート\n・利用状況の分析' },
  { title: '第三者AIサービスとのデータ共有', body: '本アプリは、メール文面を生成するためにOpenAI, Inc.（米国）が提供するAI API（GPT）を利用しています。\n\n【送信されるデータ】\n・送信相手の関係性（上司・同僚・取引先等）\n・メールの目的・シチュエーション\n・トーン設定（敬語レベル・文章の長さ等）\n・追加情報（要点・日時・固有名詞等）\n・署名・文体の設定\n\n【送信されないデータ】\n・メール送信先のメールアドレス\n・認証情報（Apple ID、Googleアカウント）\n\n【データの取り扱い】\n・送信されたデータはメール生成のみに使用されます\n・OpenAI, Inc.（米国）はAPI経由で送信されたデータをAIモデルの学習に使用しません（API Data Usage Policy）\n・通信はすべてHTTPS（SSL/TLS）で暗号化されます\n・初回のメール生成時にユーザーの同意を取得します' },
  { title: 'その他の第三者提供', body: '前項に定める場合を除き、以下の場合にのみユーザーの個人情報を第三者に提供します。\n\n・ユーザーの同意がある場合\n・法令に基づく場合\n・メール送信サービス提供元（Gmail API、Microsoft Graph API）への送信処理に必要な情報の提供' },
  { title: 'データの保管と削除', body: '・端末内のデータはアプリのアンインストールにより削除されます\n・サーバー上のデータはアカウント削除リクエストから30日以内に削除されます\n・OAuth認証トークンは端末内のセキュアストレージに保存されます\n・AIデータ利用の同意はいつでも撤回できます（設定画面より）' },
  { title: 'お問い合わせ', body: 'プライバシーに関するお問い合わせは下記までご連絡ください。\n\nメールアドレス: apuriyong500@gmail.com' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const hasAgreedToAIDataUsage = useConsentStore((s) => s.hasAgreedToAIDataUsage);
  const agreedAt = useConsentStore((s) => s.agreedAt);
  const revokeAIDataUsageConsent = useConsentStore((s) => s.revokeAIDataUsageConsent);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  const handleRevokeConsent = useCallback(() => {
    Alert.alert(
      'AIデータ利用の同意を撤回',
      '同意を撤回すると、次回メール生成時に再度同意が必要になります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '撤回する',
          style: 'destructive',
          onPress: () => {
            revokeAIDataUsageConsent();
            Alert.alert('完了', 'AIデータ利用の同意を撤回しました。');
          },
        },
      ],
    );
  }, [revokeAIDataUsageConsent]);

  const handleDataDeletionRequest = useCallback(() => {
    Alert.alert(
      'データ削除リクエスト',
      '端末内のすべてのデータを削除し、サーバー上のデータの削除をリクエストしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllLocalData();

              // サーバー側削除リクエストメールを作成
              const subject = encodeURIComponent('データ削除リクエスト');
              const body = encodeURIComponent('サーバー上のデータの削除をリクエストします。');
              const mailtoUrl = `mailto:apuriyong500@gmail.com?subject=${subject}&body=${body}`;

              Alert.alert(
                '端末データ削除完了',
                '端末内のデータを削除しました。サーバー上のデータの削除をご希望の場合は、メールでリクエストしてください。',
                [
                  { text: 'あとで', style: 'cancel' },
                  {
                    text: 'メールで依頼',
                    onPress: () => Linking.openURL(mailtoUrl),
                  },
                ],
              );
            } catch {
              Alert.alert('エラー', 'データ削除に失敗しました');
            }
          },
        },
      ],
    );
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header icon */}
          <View style={styles.headerIcon}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.tint + '15' },
              ]}
            >
              <IconSymbol name="lock.shield.fill" size={36} color={colors.tint} />
            </View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              プライバシーポリシー
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
              最終更新日: 2026年2月26日
            </ThemedText>
          </View>

          {/* Policy sections */}
          {PRIVACY_SECTIONS.map((section, index) => (
            <View key={section.title}>
              <View
                style={[
                  styles.policyCard,
                  { backgroundColor: cardBg },
                ]}
              >
                <View style={styles.policySectionHeader}>
                  <View
                    style={[
                      styles.sectionNumber,
                      { backgroundColor: colors.tint + '20' },
                    ]}
                  >
                    <ThemedText
                      style={[styles.sectionNumberText, { color: colors.tint }]}
                    >
                      {index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.policySectionTitle}>
                    {section.title}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.policyDivider,
                    { backgroundColor: dividerColor },
                  ]}
                />
                <ThemedText style={styles.policyBody}>{section.body}</ThemedText>
              </View>
            </View>
          ))}

          {/* AI consent status & revocation */}
          <View style={[styles.consentSection, { backgroundColor: cardBg }]}>
            <View style={styles.consentHeader}>
              <IconSymbol name="brain.head.profile" size={20} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.consentTitle}>
                AIデータ利用の同意状況
              </ThemedText>
            </View>
            <View style={[styles.policyDivider, { backgroundColor: dividerColor }]} />
            <ThemedText style={styles.consentStatus}>
              {hasAgreedToAIDataUsage
                ? `AIデータ利用に同意済みです。${agreedAt ? `\n同意日時: ${new Date(agreedAt).toLocaleString('ja-JP')}` : ''}`
                : 'AIデータ利用に未同意です。メール生成時に同意が求められます。'}
            </ThemedText>
            {hasAgreedToAIDataUsage && (
              <TouchableOpacity
                style={[styles.revokeButton, { borderColor: '#FF3B3040' }]}
                activeOpacity={0.7}
                onPress={handleRevokeConsent}
              >
                <ThemedText style={styles.revokeButtonText}>同意を撤回する</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Data deletion button */}
          <View style={styles.deletionSection}>
            <TouchableOpacity
              style={[styles.deletionButton, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
              onPress={handleDataDeletionRequest}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
              <ThemedText style={styles.deletionButtonText}>
                データ削除をリクエスト
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.deletionHint, { color: colors.icon }]}>
              端末内データの削除とサーバーへの削除リクエストを行います
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  /* Header */
  headerIcon: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },

  /* Policy card */
  policyCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  policySectionTitle: {
    fontSize: 16,
    flex: 1,
  },
  policyDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  policyBody: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
  },

  /* AI consent */
  consentSection: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  consentTitle: {
    fontSize: 16,
  },
  consentStatus: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
    marginBottom: 12,
  },
  revokeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  revokeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Data deletion */
  deletionSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  deletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FF3B3040',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  deletionButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  deletionHint: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
