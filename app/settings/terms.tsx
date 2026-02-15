import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/* -------------------------------------------------------------------------- */
/*  Terms sections                                                             */
/* -------------------------------------------------------------------------- */

type TermsSection = {
  title: string;
  body: string;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    title: '本利用規約について',
    body: 'この利用規約（以下「本規約」）は、AIメール作成アプリ「メールメーカー」（以下「本アプリ」）の利用条件を定めるものです。ユーザーは本アプリをダウンロードまたは利用することにより、本規約のすべての条項に同意したものとみなされます。本規約に同意いただけない場合は、本アプリの利用をお控えください。',
  },
  {
    title: 'サービスの内容',
    body: '本アプリは、AIを活用してメールの文面を自動生成し、ユーザーが確認・編集した上でメール送信を行うサービスです。\n\n・メール文面はAI（人工知能）により自動生成されます\n・生成された文面はあくまで提案であり、最終的な内容の確認・編集・送信はユーザー自身の責任において行うものとします\n・本アプリはGmailなどの外部メールサービスと連携しますが、これらのサービスの利用にはそれぞれの利用規約が適用されます',
  },
  {
    title: 'アカウントと認証',
    body: '本アプリでは、Apple ID、Googleアカウントなどの外部サービスを利用した認証を採用しています。\n\n・ユーザーは正確かつ最新の情報を用いてログインするものとします\n・アカウントの管理はユーザー自身の責任で行ってください\n・第三者によるアカウントの不正利用が判明した場合は、速やかにご連絡ください',
  },
  {
    title: '禁止事項',
    body: 'ユーザーは、本アプリを利用するにあたり、以下の行為を行ってはなりません。\n\n・スパムメール、迷惑メール、フィッシングメールの送信\n・詐欺、脅迫、嫌がらせ、その他違法な目的での利用\n・他人の個人情報を不正に収集・利用する行為\n・本アプリの機能を悪用し、大量のAPIリクエストを発生させる行為\n・本アプリのセキュリティを侵害、または侵害を試みる行為\n・リバースエンジニアリング、逆コンパイル、逆アセンブルなどの行為\n・本アプリの運営を妨害する行為\n・法令または公序良俗に反する行為\n・その他、運営者が不適切と判断する行為',
  },
  {
    title: 'AI生成コンテンツについて',
    body: '本アプリが生成するメール文面は、AIにより自動的に作成されたものです。\n\n・AI生成コンテンツの正確性、適切性、完全性について保証するものではありません\n・生成されたメールの内容について、運営者は一切の責任を負いません\n・ユーザーは送信前に必ず内容を確認し、必要に応じて編集を行ってください\n・AI生成コンテンツを法的効力を持つ文書として使用することは推奨しません\n・生成されたメールの送信により生じた結果について、運営者は責任を負いません',
  },
  {
    title: '料金とサブスクリプション',
    body: '本アプリは基本機能を無料で提供し、追加機能を有料サブスクリプションとして提供するフリーミアムモデルを採用しています。\n\n【無料プラン】\n・1日あたり5回までのメール生成\n・基本的な生成機能\n\n【有料プラン（プレミアム）】\n・メール生成回数無制限\n・全機能の利用\n・広告非表示\n・直接メール送信機能\n\n・サブスクリプション料金はApple App Storeの決済を通じてお支払いいただきます\n・サブスクリプションは自動更新されます。更新日の24時間前までにキャンセルしない限り、自動的に更新されます\n・キャンセルはApple IDの設定画面から行うことができます\n・サブスクリプション期間中の途中解約による返金は、Appleの返金ポリシーに従います',
  },
  {
    title: '知的財産権',
    body: '本アプリに関する知的財産権は、運営者または正当な権利者に帰属します。\n\n・本アプリのデザイン、ロゴ、コードなどの著作権は運営者に帰属します\n・AIにより生成されたメール文面の著作権の帰属については、適用される法律に従います\n・ユーザーが生成したメールを自由に利用・編集・送信する権利をユーザーに付与します',
  },
  {
    title: '免責事項',
    body: '運営者は、本アプリの利用に関して以下の事項について一切の責任を負いません。\n\n・AI生成コンテンツの内容に起因する損害\n・メール送信の失敗、遅延、誤送信に起因する損害\n・外部サービス（Gmail、Google、Apple等）の障害に起因する損害\n・ユーザーの操作ミスに起因する損害\n・本アプリの一時的な停止または機能制限に起因する損害\n・不可抗力（天災、戦争、テロ等）に起因する損害\n\n本アプリは「現状有姿」で提供され、特定の目的への適合性、正確性、信頼性について明示的または黙示的な保証を行いません。',
  },
  {
    title: 'サービスの変更・停止',
    body: '運営者は、以下の場合にユーザーへの事前通知なく、本アプリの全部または一部を変更、中断、停止することができます。\n\n・システムの保守・点検を行う場合\n・天災、停電等の不可抗力によりサービスの提供が困難な場合\n・その他、運営者がサービスの提供が困難と判断した場合\n\n重要な変更がある場合は、合理的な期間内にアプリ内通知またはメールでお知らせします。',
  },
  {
    title: '準拠法と管轄',
    body: '本規約の解釈および適用は、日本法に準拠するものとします。\n\n本アプリに関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
  {
    title: '規約の変更',
    body: '運営者は、必要に応じて本規約を変更することがあります。\n\n・重要な変更がある場合は、アプリ内通知またはメールでお知らせいたします\n・変更後も本アプリを継続して利用する場合は、変更後の規約に同意したものとみなします\n・変更に同意いただけない場合は、本アプリの利用を中止してください',
  },
  {
    title: 'お問い合わせ',
    body: '本規約に関するお問い合わせは、下記までご連絡ください。\n\nメールアドレス: support@ai-mail-app.com\n\n制定日: 2026年2月15日\n最終更新日: 2026年2月15日',
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

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
              <IconSymbol name="doc.text.fill" size={36} color={colors.tint} />
            </View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              利用規約
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>
              AIメール作成アプリ
            </ThemedText>
          </View>

          {/* Terms sections */}
          {TERMS_SECTIONS.map((section, index) => (
            <View key={section.title}>
              <View
                style={[
                  styles.termsCard,
                  { backgroundColor: cardBg },
                ]}
              >
                <View style={styles.termsSectionHeader}>
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
                  <ThemedText type="defaultSemiBold" style={styles.termsSectionTitle}>
                    {section.title}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.termsDivider,
                    { backgroundColor: dividerColor },
                  ]}
                />
                <ThemedText style={styles.termsBody}>{section.body}</ThemedText>
              </View>
            </View>
          ))}
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

  /* Terms card */
  termsCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  termsSectionHeader: {
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
  termsSectionTitle: {
    fontSize: 16,
    flex: 1,
  },
  termsDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  termsBody: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
  },
});
