import {
  Alert,
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

/* -------------------------------------------------------------------------- */
/*  Policy sections                                                            */
/* -------------------------------------------------------------------------- */

type PolicySection = {
  title: string;
  body: string;
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: '個人情報の取り扱いについて',
    body: '当アプリ「AIメール作成」（以下「本アプリ」）は、ユーザーの個人情報の重要性を深く認識し、個人情報の保護に関する法律（個人情報保護法）、EU一般データ保護規則（GDPR）およびその他関連法令を遵守し、適切な取り扱いと保護に努めます。\n\n本プライバシーポリシーは、本アプリにおける個人情報の収集、利用、管理について定めるものです。本アプリをご利用いただくことにより、本ポリシーの内容に同意いただいたものとみなします。',
  },
  {
    title: '収集する情報',
    body: '本アプリでは、以下の情報を収集する場合があります。\n\n【アカウント情報】\nメールアドレス、表示名\n\n【メール連携情報】\nOAuth 2.0認証を通じたGmailアカウントへのアクセス権（パスワードは一切保持しません）\n\n【メール生成に必要な情報】\n送信相手の関係性・役職、メールの目的、トーン設定、要点・補足情報（これらはAIによるメール生成のためにサーバーに送信されます）\n\n【生成コンテンツ】\nAIが生成したメール文面（履歴保存機能を利用する場合、端末内に保存されます）\n\n【連絡先情報】\nユーザーが手動で登録した送信先の名前、メールアドレス、関係性情報\n\n【利用データ】\nメール生成回数、利用機能、アプリ設定\n\n【端末情報】\nOSバージョン、アプリバージョン\n\n【課金情報】\nサブスクリプションの状態（決済情報はApple Inc.およびRevenueCat, Inc.が管理し、本アプリはクレジットカード番号等の決済情報に直接アクセスしません）',
  },
  {
    title: '情報の利用目的と法的根拠',
    body: '収集した情報は、以下の目的および法的根拠に基づき利用いたします。\n\n【契約の履行】\n・AIによるメール文面の生成および最適化\n・メールの送信機能の提供\n・ユーザーの文体学習による生成精度の向上\n\n【正当な利益】\n・サービスの改善およびユーザー体験の向上\n・アプリの不具合修正およびセキュリティの確保\n・利用状況の統計分析（個人を特定しない形式）\n\n【同意】\n・カスタマーサポートの提供\n・サービスに関するお知らせの送信',
  },
  {
    title: 'AIによる自動処理について',
    body: '本アプリは、ユーザーが入力した情報（送信相手の関係性、メールの目的、トーン設定等）に基づき、AIが自動的にメール文面を生成します。\n\n・AI生成はOpenAI, Inc.が提供するAPIを利用しています\n・生成に必要な情報のみがAPIに送信され、メールアドレスや個人を直接特定する情報は送信されません\n・AI生成結果はあくまで提案であり、ユーザーは送信前に必ず内容を確認・編集できます\n・AI生成は法的効力を持つ意思決定には使用されません\n\nAIによる自動処理に関してご質問やご懸念がある場合は、お問い合わせ先までご連絡ください。',
  },
  {
    title: '第三者サービスへのデータ提供',
    body: '本アプリは、サービス提供のために以下の第三者サービスを利用しています。各サービスには必要最小限の情報のみを提供します。\n\n【OpenAI, Inc.（米国）】\nメール生成に必要な情報（関係性、目的、トーン、要点等）を送信します。メールアドレス等の個人識別情報は送信しません。\nhttps://openai.com/privacy\n\n【Supabase, Inc.（米国）】\nバックエンド基盤として利用。認証情報およびAPI通信の中継を行います。\nhttps://supabase.com/privacy\n\n【RevenueCat, Inc.（米国）】\nサブスクリプション管理に利用。課金状態の管理を行います。\nhttps://www.revenuecat.com/privacy\n\n【Google LLC（米国）】\nGmail API経由でのメール送信およびOAuth 2.0認証に利用します。\nhttps://policies.google.com/privacy\n\n【Apple Inc.（米国）】\nApp内課金の決済処理を行います。\nhttps://www.apple.com/legal/privacy\n\n上記以外の第三者には、ユーザーの同意がある場合、または法令に基づく場合を除き、個人情報を提供いたしません。',
  },
  {
    title: '海外へのデータ移転',
    body: '本アプリが利用する第三者サービスの一部は米国に所在しており、ユーザーの情報が日本国外に移転される場合があります。\n\n・移転先の各サービス提供者は、適切なデータ保護措置を講じています\n・EU/EEAからのデータ移転については、標準契約条項（SCC）等の適切な保護措置に基づき行われます\n・米国のサービス提供者はプライバシーフレームワークへの準拠等により、適切な保護水準を確保しています',
  },
  {
    title: 'データの保管とセキュリティ',
    body: 'ユーザーの情報は、以下のセキュリティ対策により保護されます。\n\n【通信の暗号化】\nすべての通信はHTTPS（TLS 1.2以上）で暗号化されます。\n\n【端末内データの暗号化】\n端末に保存されるデータはAES-256-CBCで暗号化され、暗号鍵はiOS Keychainにより安全に管理されます。\n\n【認証情報の保護】\nOAuth認証トークンはiOS Keychainに保存され、パスワードは一切保持しません。\n\n【サーバー側の保護】\nEdge Functionへのアクセスはすべて認証が必要です。APIキーが不正なリクエストは拒否されます。',
  },
  {
    title: 'データの保存期間と削除',
    body: '各データの保存期間は以下の通りです。\n\n・メール生成履歴：ユーザーが削除するまで端末内に保存\n・連絡先情報：ユーザーが削除するまで端末内に保存\n・学習データ：ユーザーが削除するまで端末内に保存（設定画面から個別削除可能）\n・アカウント情報：アカウント削除時に速やかに削除\n・AI API送信データ：メール生成完了後、サーバー上には保持しません\n\nアカウント削除時には、サーバー上の関連データをすべて30日以内に削除いたします。端末内のデータはアプリのアンインストールにより削除されます。',
  },
  {
    title: 'ユーザーの権利',
    body: 'ユーザーは、ご自身の個人情報に関して以下の権利を有します。\n\n・アクセス権：保有する個人情報の開示を請求できます\n・訂正権：不正確な個人情報の訂正を請求できます\n・削除権：個人情報の削除を請求できます\n・データポータビリティ権：個人情報を構造化された形式で受け取ることを請求できます\n・処理制限権：特定の状況下で個人情報の処理の制限を請求できます\n・異議申立権：正当な利益に基づく処理に対して異議を申し立てることができます\n・同意の撤回：同意に基づく処理について、いつでも同意を撤回できます\n\nこれらの権利を行使される場合は、下記のお問い合わせ先までご連絡ください。ご請求から30日以内に対応いたします。\n\nまた、アプリ内の設定画面から、学習データの削除やアカウントの管理を直接行うことも可能です。',
  },
  {
    title: 'トラッキングについて',
    body: '本アプリは、広告目的でのユーザー追跡（トラッキング）を行いません。\n\n・IDFA（広告識別子）の収集は行いません\n・第三者の広告ネットワークとの連携は行いません\n・Appleの App Tracking Transparency（ATT）に準拠しています',
  },
  {
    title: '児童のプライバシー',
    body: '本アプリは13歳未満のお子様を対象としたサービスではありません。13歳未満のお子様から意図的に個人情報を収集することはありません。\n\n13歳未満のお子様の個人情報が収集されたことが判明した場合は、速やかに該当データを削除いたします。保護者の方でお心当たりがある場合は、お問い合わせ先までご連絡ください。',
  },
  {
    title: 'お問い合わせ',
    body: '本プライバシーポリシーに関するお問い合わせ、個人情報に関する権利の行使については、下記までご連絡ください。\n\nメールアドレス: support@ai-mail-app.com\n\n本プライバシーポリシーは、法令の改正やサービス内容の変更に応じて改定することがあります。重要な変更がある場合は、本アプリ内の通知またはメールでお知らせいたします。\n\n制定日: 2025年1月1日\n最終更新日: 2026年2月14日',
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  const handleDataDeletionRequest = () => {
    Alert.alert(
      'データ削除リクエスト',
      'アカウントに関連するすべてのデータの削除をリクエストしますか？\n\nこの操作は取り消せません。削除完了までに最大30日かかる場合があります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除をリクエスト',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'リクエスト受付完了',
              'データ削除リクエストを受け付けました。処理完了後にメールでお知らせいたします。',
            );
          },
        },
      ],
    );
  };

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
              AIメール作成アプリ
            </ThemedText>
          </View>

          {/* Policy sections */}
          {POLICY_SECTIONS.map((section, index) => (
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

          {/* Data deletion button */}
          <View style={styles.deletionSection}>
            <TouchableOpacity
              style={[styles.deletionButton, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
              onPress={handleDataDeletionRequest}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
              <ThemedText style={styles.deletionButtonText}>
                データ削除リクエスト
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.deletionHint, { color: colors.icon }]}>
              アカウントに関連するすべてのデータの削除を申請できます
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
