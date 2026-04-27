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
  { title: 'Googleユーザーデータの取り扱い', body: '本アプリはGmail連携機能においてGoogle APIを利用します。本セクションでは、Google API Services User Data Policy（Limited Use要件を含む）に基づき、Googleユーザーデータの取り扱いを明示します。\n\n【取得するGoogleユーザーデータと用途】\n・Googleアカウントのメールアドレス：送信元アドレスの表示\n・Googleアカウントの表示名・プロフィール情報：アカウント識別表示\n・Gmail送信権限（gmail.send）：ユーザーが作成・確認したメールの送信\n・連絡先情報（contacts.readonly）：ユーザーが「連絡先インポート」を明示的に実行した場合のみ、宛先候補として読み取り\n・OAuth 2.0 アクセストークン・リフレッシュトークン：上記APIの認可情報\n\n【Googleユーザーデータの共有・転送・開示先】\n本アプリは、以下に列挙する事業者・目的・範囲を超えて、Googleユーザーデータをいかなる第三者にも販売・共有・転送・開示しません。\n\n(a) Google LLC（米国）\n・用途：Gmail API（メール送信）、OAuth 2.0（認証）、People API（連絡先取得）、userinfo API（プロフィール取得）\n・送信される情報：認可コード、アクセストークン、メール本文・件名・宛先（送信時のみ）\n\n(b) Supabase Inc.（米国）\n・役割：バックエンドインフラ提供者（サブプロセッサ）\n・用途：OAuthトークンのAES-256暗号化保管（端末紛失時の再認証回避）／Edge Function経由でのGmail API呼び出し中継\n・送信される情報：暗号化されたトークン、メール送信時の本文・宛先・アクセストークン\n・補足：Supabaseはユーザーデータを独自目的で利用しません。すべてのデータは暗号化通信（TLS）と暗号化保管（AES-256）で保護されます。\n\n【Googleユーザーデータを送信しない先】\n・OpenAI等の生成AIサービス：メール本文・宛先・OAuthトークンを送信することは一切ありません（メール生成AIには「目的・トーン・要点等の入力情報」のみが渡され、Googleアカウント情報は含まれません）\n・広告ネットワーク・広告主・データブローカー\n・上記(a)(b)以外のあらゆる第三者\n\n【Googleユーザーデータの保護】\n・通信はすべてHTTPS（TLS 1.2以上）で暗号化\n・端末上のトークンはexpo-secure-store（iOS Keychain / Android Keystore）に保管\n・サーバー上のトークンはAES-256で暗号化して保管し、SupabaseのRow Level Securityによりユーザー本人のみがアクセス可能\n・トークンへの人によるアクセスは、セキュリティ調査・法令遵守・ユーザーから明示的同意を得た場合のみに限定\n\n【Googleユーザーデータの利用制限（Limited Use）】\n本アプリのGoogle APIの利用は、Google API Services User Data Policy（https://developers.google.com/terms/api-services-user-data-policy）のLimited Use要件に準拠します。\n・ユーザーが明示的に要求した機能（メール送信・連絡先取得）の提供にのみ使用します\n・広告目的での利用は行いません\n・AI/MLモデルの学習・改善のための利用は行いません\n・他のサービスや機能への流用は行いません\n・人による閲覧は、セキュリティ・法令遵守・ユーザー同意・匿名集計目的に限定します\n\n【ユーザーの権利】\n・アプリ設定画面からのGoogleアカウント連携解除（連携解除時にサーバー上のトークンも削除し、Googleのrevocationエンドポイントでトークンを失効化します）\n・https://myaccount.google.com/permissions からの権限取り消し\n・データ削除リクエスト：apuriyong500@gmail.com' },
  { title: 'その他の第三者提供', body: '前項に定める場合を除き、以下の場合にのみユーザーの個人情報を第三者に提供します。\n\n・ユーザーの同意がある場合\n・法令に基づく場合' },
  { title: 'データの保管と削除', body: '・端末内のデータはアプリのアンインストールにより削除されます\n・サーバー上のデータはアカウント削除リクエストから30日以内に削除されます\n・OAuth認証トークンは、端末内のセキュアストレージ（expo-secure-store）に加え、Supabase上にAES-256で暗号化された状態で保管されます\n・Googleアカウント連携解除時には、サーバー上の暗号化トークンを即時削除し、Googleのrevocationエンドポイントでトークンを失効化します\n・AIデータ利用の同意はいつでも撤回できます（設定画面より）' },
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
              最終更新日: 2026年4月27日
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
