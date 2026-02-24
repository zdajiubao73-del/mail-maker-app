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
    body: 'この利用規約（以下「本規約」）は、AIメール作成アプリ「メールメーカー」（以下「本アプリ」）の利用条件を定めるものです。本アプリの運営者（以下「運営者」）は、本規約に基づきサービスを提供します。\n\nユーザーは本アプリをダウンロードまたは利用することにより、本規約のすべての条項に同意したものとみなされます。本規約に同意いただけない場合は、本アプリの利用をお控えください。\n\n個人情報の取り扱いについては、別途定める「プライバシーポリシー」に従います。本規約とプライバシーポリシーは一体として適用されます。',
  },
  {
    title: 'サービスの内容',
    body: '本アプリは、AIを活用してメールの文面を自動生成し、ユーザーが確認・編集した上でメール送信を行うサービスです。\n\n・メール文面はAI（人工知能）により自動生成されます\n・生成された文面はあくまで提案であり、最終的な内容の確認・編集・送信はユーザー自身の責任において行うものとします\n・本アプリはGmailなどの外部メールサービスと連携しますが、これらのサービスの利用にはそれぞれの利用規約が適用されます',
  },
  {
    title: '利用資格',
    body: '本アプリの利用にあたり、以下の条件を満たす必要があります。\n\n・13歳以上であること（13歳未満の方は利用できません）\n・18歳未満の場合は、保護者の同意を得た上でご利用ください\n・本規約のすべての条項に同意していること\n・過去に運営者によりアカウントを停止または削除されていないこと',
  },
  {
    title: 'アカウントと認証',
    body: '本アプリでは、Apple ID、Googleアカウントなどの外部サービスを利用した認証を採用しています。\n\n・ユーザーは正確かつ最新の情報を用いてログインするものとします\n・アカウントの管理はユーザー自身の責任で行ってください\n・第三者によるアカウントの不正利用が判明した場合は、速やかにご連絡ください\n・ユーザーのアカウントを通じて行われた一切の行為は、当該ユーザーの行為とみなします',
  },
  {
    title: '禁止事項',
    body: 'ユーザーは、本アプリを利用するにあたり、以下の行為を行ってはなりません。\n\n・スパムメール、迷惑メール、フィッシングメールの送信\n・詐欺、脅迫、嫌がらせ、その他違法な目的での利用\n・他人の個人情報を不正に収集・利用する行為\n・本アプリの機能を悪用し、大量のAPIリクエストを発生させる行為\n・本アプリのセキュリティを侵害、または侵害を試みる行為\n・リバースエンジニアリング、逆コンパイル、逆アセンブルなどの行為\n・本アプリの運営を妨害する行為\n・法令または公序良俗に反する行為\n・その他、運営者が不適切と判断する行為\n\n上記に違反した場合、運営者は事前の通知なくアカウントの利用停止、削除その他必要な措置を講じることができます。これにより生じた損害について、運営者は一切の責任を負いません。',
  },
  {
    title: 'AI生成コンテンツについて',
    body: '本アプリが生成するメール文面は、AIにより自動的に作成されたものです。\n\n・AI生成コンテンツの正確性、適切性、完全性について保証するものではありません\n・生成されたメールの内容について、運営者は一切の責任を負いません\n・ユーザーは送信前に必ず内容を確認し、必要に応じて編集を行ってください\n・AI生成コンテンツを法的効力を持つ文書として使用することは推奨しません\n・生成されたメールの送信により生じた結果について、運営者は責任を負いません',
  },
  {
    title: '料金とサブスクリプション',
    body: '本アプリはサブスクリプション制を採用しており、ご利用には有料プランへの加入が必要です。初回登録時に14日間の無料トライアルをご利用いただけます。\n\n【プレミアムプラン】\n・月500回までのメール生成\n・全機能の利用\n・広告非表示\n・直接メール送信機能\n\n【料金プラン】\n・月額プラン：¥500/月\n・年額プラン：¥5,000/年\n\n・サブスクリプション料金はApple App Storeの決済を通じてお支払いいただきます\n・無料トライアル終了後、自動的にサブスクリプションが開始されます\n・サブスクリプションは自動更新されます。更新日の24時間前までにキャンセルしない限り、自動的に更新されます\n・キャンセルはApple IDの設定画面から行うことができます\n・サブスクリプション期間中の途中解約による返金は、Appleの返金ポリシーに従います',
  },
  {
    title: '知的財産権',
    body: '本アプリに関する知的財産権は、運営者または正当な権利者に帰属します。\n\n・本アプリのデザイン、ロゴ、コードなどの著作権は運営者に帰属します\n・AIにより生成されたメール文面の著作権の帰属については、適用される法律に従います\n・ユーザーが生成したメールを自由に利用・編集・送信する権利をユーザーに付与します',
  },
  {
    title: '個人情報・機密情報の取り扱い',
    body: 'ユーザーは、本アプリの利用にあたり、以下の事項を十分にご理解の上でご利用ください。\n\n・本アプリでは、メール生成のためにユーザーが入力した情報（送信相手の関係性・役職レベル、メールの目的・トーン設定、要点・補足情報等）をAI処理のために外部サーバーに送信します\n・送信先の氏名・メールアドレスはAI生成処理には送信されませんが、メール送信機能を利用する際にメールサービス（Gmail等）に送信されます\n・入力された情報は、AI（OpenAI等）のAPIを経由して処理されるため、第三者のサーバーを通過します\n・運営者は情報の保護に合理的な措置を講じますが、インターネット上のデータ通信において完全なセキュリティを保証することはできません\n・ユーザーは、機密性の高い情報（マイナンバー、クレジットカード番号、パスワード、医療情報、企業秘密等）を本アプリに入力しないよう十分にご注意ください\n・OAuth認証に用いるトークン情報は端末内に安全に保存されますが、端末の紛失・盗難等による情報漏洩について運営者は責任を負いません\n\n個人情報の収集・利用・管理の詳細については、プライバシーポリシーをご確認ください。',
  },
  {
    title: '免責事項',
    body: '運営者は、本アプリの利用に関して以下の事項について、法令で認められる最大限の範囲において一切の責任を負いません。\n\n・AI生成コンテンツの内容に起因する損害\n・メール送信の失敗、遅延、誤送信に起因する損害\n・外部サービス（Gmail、Google、Apple等）の障害に起因する損害\n・ユーザーの操作ミスに起因する損害\n・本アプリの一時的な停止または機能制限に起因する損害\n・不可抗力（天災、戦争、テロ等）に起因する損害\n・ユーザーが本アプリに入力した個人情報、機密情報、その他一切の情報の漏洩、流出、不正アクセス、改ざんまたは消失に起因する損害\n・第三者サービス（AI API提供元、メールサービス提供元、認証サービス提供元等）における情報の漏洩、流出または不正利用に起因する損害\n・ユーザーの端末の紛失、盗難、不正アクセス等に起因する情報漏洩による損害\n・本アプリを通じて送信されたメールの内容が第三者に知られたことに起因する損害\n・サイバー攻撃、ハッキング、マルウェア等による情報漏洩に起因する損害\n\n本アプリは「現状有姿（AS IS）」で提供され、特定の目的への適合性、正確性、信頼性、セキュリティの完全性について明示的または黙示的な保証を行いません。ユーザーは自己の責任において本アプリを利用するものとし、本アプリの利用により生じた一切の損害について、運営者は故意または重大な過失がある場合を除き責任を負いません。',
  },
  {
    title: '損害賠償の制限',
    body: '運営者がユーザーに対して損害賠償責任を負う場合であっても、その賠償額は以下のいずれか低い方の金額を上限とします。\n\n・当該損害の直接の原因となった事由が生じた時点から遡って過去1か月間にユーザーが本アプリに対して支払った利用料金の総額\n・1,000円\n\nただし、運営者の故意または重大な過失に起因する場合はこの限りではありません。\n\nなお、運営者は、逸失利益、間接損害、特別損害、偶発的損害、懲罰的損害またはデータの喪失に起因する損害について、その予見可能性の有無にかかわらず、一切の責任を負いません。',
  },
  {
    title: '退会・アカウント削除',
    body: 'ユーザーは、いつでも本アプリの利用を終了し、アカウントの削除を申請することができます。\n\n・アカウント削除は、プライバシーポリシーに記載の手順に従い、アプリ内の設定画面またはお問い合わせ先へのご連絡により行えます\n・アカウント削除後、サーバー上のデータは30日以内に削除されます\n・端末内に保存されたデータは、アプリのアンインストールにより削除されます\n・有料プランをご利用中の場合、アカウント削除前にApple IDの設定画面からサブスクリプションのキャンセルを行ってください。アカウント削除後もサブスクリプションは自動キャンセルされません\n・アカウント削除後のデータ復旧は一切できません',
  },
  {
    title: 'サービスの変更・停止',
    body: '運営者は、以下の場合にユーザーへの事前通知なく、本アプリの全部または一部を変更、中断、停止することができます。\n\n・システムの保守・点検を行う場合\n・天災、停電等の不可抗力によりサービスの提供が困難な場合\n・セキュリティ上の問題が発生し、緊急の対応が必要な場合\n・その他、運営者がサービスの提供が困難と判断した場合\n\n重要な変更がある場合は、合理的な期間内にアプリ内通知またはメールでお知らせします。サービスの終了にあたっては、可能な限り30日前までに通知いたします。',
  },
  {
    title: '準拠法と管轄',
    body: '本規約の解釈および適用は、日本法に準拠するものとします。\n\n本アプリに関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
  {
    title: '分離可能性',
    body: '本規約のいずれかの条項またはその一部が、消費者契約法その他の法令により無効または執行不能と判断された場合であっても、当該条項の残りの部分および本規約のその他の条項は、引き続き完全に効力を有するものとします。\n\n無効または執行不能と判断された条項については、当該条項の趣旨に最も近い有効な内容に読み替えて適用するものとします。',
  },
  {
    title: '規約の変更',
    body: '運営者は、必要に応じて本規約を変更することがあります。\n\n・重要な変更がある場合は、変更の効力発生日の14日前までにアプリ内通知またはメールでお知らせいたします\n・変更後も本アプリを継続して利用する場合は、変更後の規約に同意したものとみなします\n・変更に同意いただけない場合は、効力発生日までに本アプリの利用を中止してください',
  },
  {
    title: 'お問い合わせ',
    body: '本規約に関するお問い合わせは、下記までご連絡ください。\n\nメールアドレス: apuriyong500@gmail.com\n\n制定日: 2026年2月15日\n最終更新日: 2026年2月18日',
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
              最終更新日: 2026年2月18日
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
