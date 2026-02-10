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
    body: '当アプリ「AIメール作成」（以下「本アプリ」）は、ユーザーの個人情報の重要性を深く認識し、個人情報の保護に関する法律（個人情報保護法）およびその他関連法令を遵守し、適切な取り扱いと保護に努めます。本プライバシーポリシーは、本アプリにおける個人情報の収集、利用、管理について定めるものです。',
  },
  {
    title: '収集する情報',
    body: '本アプリでは、以下の情報を収集する場合があります。\n\n・アカウント情報：メールアドレス、表示名\n・メール連携情報：OAuth認証を通じたメールアカウントへのアクセス権（パスワードは保持しません）\n・利用データ：メール生成回数、利用機能、アプリ設定\n・生成コンテンツ：AIが生成したメール文面（履歴保存機能を利用する場合）\n・連絡先情報：ユーザーが登録した送信先の名前、メールアドレス、関係性情報\n・端末情報：端末識別子、OSバージョン、アプリバージョン\n・課金情報：サブスクリプションの状態（決済情報はApple Inc.が管理します）',
  },
  {
    title: '情報の利用目的',
    body: '収集した情報は、以下の目的で利用いたします。\n\n・AIによるメール文面の生成および最適化\n・ユーザーの文体学習による生成精度の向上\n・メールの送信機能の提供\n・サービスの改善およびユーザー体験の向上\n・アプリの不具合修正およびセキュリティの確保\n・カスタマーサポートの提供\n・利用状況の統計分析（個人を特定しない形式）',
  },
  {
    title: '第三者への提供',
    body: '当アプリは、以下の場合を除き、ユーザーの個人情報を第三者に提供いたしません。\n\n・ユーザーの同意がある場合\n・法令に基づく場合\n・人の生命、身体または財産の保護のために必要な場合\n・サービス提供に必要な業務委託先（AI API提供者、クラウドサービス提供者等）に対して、必要最小限の範囲で提供する場合\n\nなお、AI APIへの送信データについては、メール生成に必要な情報のみを送信し、送信先のAIサービス提供者のプライバシーポリシーに従って取り扱われます。',
  },
  {
    title: 'データの保管と削除',
    body: 'ユーザーの個人情報は、適切なセキュリティ対策を講じたサーバーに保管いたします。\n\n・通信はすべてHTTPS（TLS 1.2以上）で暗号化されます\n・保存データはAES-256で暗号化されます\n・OAuth認証トークンは安全に管理され、パスワードは一切保持しません\n・アカウント削除時には、関連するすべての個人情報を速やかに削除いたします\n・学習データは、ユーザーの操作により個別に削除することが可能です\n\nデータの保存期間は、サービス提供に必要な期間とし、利用目的が達成された後は速やかに削除いたします。',
  },
  {
    title: 'お問い合わせ',
    body: '本プライバシーポリシーに関するお問い合わせ、個人情報の開示・訂正・削除のご請求については、下記までご連絡ください。\n\nメールアドレス: support@ai-mail-app.example.com\n\n本プライバシーポリシーは、必要に応じて改定することがあります。改定した場合は、本アプリ内でお知らせいたします。\n\n最終更新日: 2025年1月1日',
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
