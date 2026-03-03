import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useConsentStore } from '@/store/use-consent-store';

type Props = {
  visible: boolean;
  onAgree: () => void;
  onDecline: () => void;
};

const DATA_ITEMS = [
  '送信相手の関係性（上司・同僚・取引先等）',
  'メールの目的・シチュエーション',
  'トーン設定（敬語レベル・文章の長さ等）',
  '追加情報（要点・日時・固有名詞等）',
  '署名・文体の設定',
];

export function AIConsentModal({ visible, onAgree, onDecline }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const agreeToAIDataUsage = useConsentStore((s) => s.agreeToAIDataUsage);

  const cardBg = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const dividerColor = colorScheme === 'dark' ? '#2C2F33' : '#E5E5EA';

  const handleAgree = () => {
    agreeToAIDataUsage();
    onAgree();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDecline}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '15' }]}>
              <IconSymbol name="lock.shield.fill" size={36} color={colors.tint} />
            </View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              AIデータ利用について
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              メール生成にはAIサービスを利用します。{'\n'}
              以下の内容をご確認のうえ、同意をお願いします。
            </ThemedText>
          </View>

          {/* データ送信先の説明 */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="server.rack" size={20} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                データの送信先
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <ThemedText style={styles.cardBody}>
              メール生成のため、入力された情報はOpenAI, Inc.（米国）のAPIに送信されます。
              OpenAI, Inc.はAPI経由で送信されたデータをAIモデルの学習に使用しません（API Data Usage Policy）。
            </ThemedText>
          </View>

          {/* 送信されるデータ */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="doc.text.fill" size={20} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                送信されるデータ
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <ThemedText style={styles.cardBody}>
              メール生成時に以下の情報がAIサービスに送信されます:
            </ThemedText>
            {DATA_ITEMS.map((item) => (
              <View key={item} style={styles.dataItem}>
                <View style={[styles.bullet, { backgroundColor: colors.tint }]} />
                <ThemedText style={styles.dataItemText}>{item}</ThemedText>
              </View>
            ))}
          </View>

          {/* データの取り扱い */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="hand.raised.fill" size={20} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                データの取り扱い
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <ThemedText style={styles.cardBody}>
              {'・メールアドレスや個人を特定する情報はAIサービスに送信されません\n' +
                '・送信されたデータはメール生成のみに利用されます\n' +
                '・通信はすべてHTTPS（SSL/TLS）で暗号化されます\n' +
                '・同意はいつでも設定画面から撤回できます'}
            </ThemedText>
          </View>

          {/* 注意事項 */}
          <ThemedText style={[styles.note, { color: colors.textSecondary }]}>
            同意しない場合、AIによるメール生成機能はご利用いただけません。
          </ThemedText>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onDecline();
              router.push('/settings/privacy');
            }}
          >
            <ThemedText style={[styles.privacyLink, { color: colors.tint }]}>
              プライバシーポリシーを確認する
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>

        {/* ボタンエリア */}
        <View style={[styles.buttonArea, { borderTopColor: dividerColor }]}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: dividerColor }]}
            onPress={onDecline}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.declineButtonText, { color: colors.textSecondary }]}>
              同意しない
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.agreeButton, { backgroundColor: colors.tint }]}
            onPress={handleAgree}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.agreeButtonText}>同意する</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  /* Card */
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
  },

  /* Data items */
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  dataItemText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  /* Note */
  note: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  privacyLink: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 8,
    paddingVertical: 4,
  },

  /* Buttons */
  buttonArea: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  declineButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  agreeButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
