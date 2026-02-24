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

/* -------------------------------------------------------------------------- */
/*  Privacy sections                                                           */
/* -------------------------------------------------------------------------- */

const PRIVACY_SECTIONS = [
  { title: '収集する情報', body: '本アプリでは、以下の情報を収集・利用します。\n\n・認証情報（Apple ID、Googleアカウントのメールアドレス・表示名）\n・メール作成に必要な入力情報（送信相手の関係性、メールの目的、トーン設定、要点等）\n・メール送信先のメールアドレス\n・アプリ利用履歴（生成履歴、設定情報）\n・端末情報（OSバージョン、アプリバージョン）' },
  { title: '情報の利用目的', body: '収集した情報は、以下の目的で利用します。\n\n・AIによるメール文面の生成\n・メールの送信処理\n・アプリの機能改善\n・ユーザーサポート\n・利用状況の分析' },
  { title: '情報の第三者提供', body: '以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。\n\n・ユーザーの同意がある場合\n・法令に基づく場合\n・サービス提供に必要な業務委託先（AI API提供元、メールサービス提供元）への提供' },
  { title: 'データの保管と削除', body: '・端末内のデータはアプリのアンインストールにより削除されます\n・サーバー上のデータはアカウント削除リクエストから30日以内に削除されます\n・OAuth認証トークンは端末内のセキュアストレージに保存されます' },
  { title: 'お問い合わせ', body: 'プライバシーに関するお問い合わせは下記までご連絡ください。\n\nメールアドレス: apuriyong500@gmail.com' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

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
              最終更新日: 2026年2月18日
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
