import { useEffect, useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLearningStore } from '@/store/use-learning-store';
import { useMailStore } from '@/store/use-mail-store';
import { getTopDistributionLabel } from '@/lib/learning-analyzer';

export default function LearningDataScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const profile = useLearningStore((s) => s.profile);
  const analyzeHistory = useLearningStore((s) => s.analyzeHistory);
  const updatePreferences = useLearningStore((s) => s.updatePreferences);
  const clearLearningData = useLearningStore((s) => s.clearLearningData);
  const history = useMailStore((s) => s.history);

  const [signature, setSignature] = useState(profile?.preferences.signature ?? '');
  const [writingStyleNotes, setWritingStyleNotes] = useState(
    profile?.preferences.writingStyleNotes ?? '',
  );

  // 画面表示時に履歴件数変化を検知して自動再分析
  useEffect(() => {
    if (history.length >= 3 && history.length !== profile?.lastAnalyzedMailCount) {
      analyzeHistory(history);
    }
  }, [history.length, profile?.lastAnalyzedMailCount, analyzeHistory, history]);

  // profile が変わったら入力値を同期
  useEffect(() => {
    if (profile) {
      setSignature(profile.preferences.signature);
      setWritingStyleNotes(profile.preferences.writingStyleNotes);
    }
  }, [profile]);

  const handleReanalyze = useCallback(() => {
    if (history.length < 3) {
      Alert.alert(
        '分析できません',
        'メール履歴が3通以上必要です。メールを生成して下書き保存してください。',
      );
      return;
    }
    analyzeHistory(history);
    Alert.alert('完了', '履歴を再分析しました。');
  }, [history, analyzeHistory]);

  const handleSignatureBlur = useCallback(() => {
    updatePreferences({ signature });
  }, [signature, updatePreferences]);

  const handleWritingStyleNotesBlur = useCallback(() => {
    updatePreferences({ writingStyleNotes });
  }, [writingStyleNotes, updatePreferences]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'すべてのデータを削除',
      '統計データ・署名・文体メモを含むすべての学習データを削除します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて削除',
          style: 'destructive',
          onPress: () => {
            clearLearningData();
            setSignature('');
            setWritingStyleNotes('');
          },
        },
      ],
    );
  }, [clearLearningData]);

  const stats = profile?.statistics;
  const hasStats = stats && stats.totalMailsAnalyzed > 0;

  const topHonorifics = hasStats
    ? getTopDistributionLabel(stats.honorificsDistribution)
    : null;
  const topAtmosphere = hasStats
    ? getTopDistributionLabel(stats.atmosphereDistribution)
    : null;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: 学習統計 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={20} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              学習統計
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {hasStats ? (
              <>
                <View style={styles.statsRow}>
                  <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    分析件数
                  </ThemedText>
                  <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                    {stats.totalMailsAnalyzed}通
                  </ThemedText>
                </View>
                <View style={[styles.statsSeparator, { backgroundColor: colors.border }]} />
                <View style={styles.statsRow}>
                  <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    平均本文長
                  </ThemedText>
                  <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                    {stats.averageBodyLength}文字
                  </ThemedText>
                </View>
                {topHonorifics && (
                  <>
                    <View style={[styles.statsSeparator, { backgroundColor: colors.border }]} />
                    <View style={styles.statsRow}>
                      <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                        よく使う敬語レベル
                      </ThemedText>
                      <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                        {topHonorifics}
                      </ThemedText>
                    </View>
                  </>
                )}
                {topAtmosphere && (
                  <>
                    <View style={[styles.statsSeparator, { backgroundColor: colors.border }]} />
                    <View style={styles.statsRow}>
                      <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                        よく使う雰囲気
                      </ThemedText>
                      <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                        {topAtmosphere}
                      </ThemedText>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={styles.emptyStats}>
                <MaterialIcons name="info-outline" size={20} color={colors.icon} />
                <ThemedText style={[styles.emptyStatsText, { color: colors.textSecondary }]}>
                  メール履歴が3通以上になると、文体傾向を自動分析します
                </ThemedText>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              { borderColor: colors.tint, backgroundColor: colors.tint + '08' },
            ]}
            onPress={handleReanalyze}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={18} color={colors.tint} />
            <ThemedText style={[styles.analyzeButtonText, { color: colors.tint }]}>
              履歴を再分析
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Section 2: よく使うフレーズ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="format-quote" size={20} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              よく使うフレーズ
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {hasStats && stats.phrasePatterns.openings.length > 0 ? (
              <>
                <ThemedText style={[styles.phraseGroupLabel, { color: colors.textSecondary }]}>
                  書き出し
                </ThemedText>
                {stats.phrasePatterns.openings.map((phrase, i) => (
                  <View
                    key={`opening-${i}`}
                    style={[
                      styles.phraseItem,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <ThemedText style={[styles.phraseText, { color: colors.text }]} numberOfLines={2}>
                      {phrase}
                    </ThemedText>
                  </View>
                ))}

                {stats.phrasePatterns.closings.length > 0 && (
                  <>
                    <ThemedText
                      style={[
                        styles.phraseGroupLabel,
                        styles.phraseGroupLabelMarginTop,
                        { color: colors.textSecondary },
                      ]}
                    >
                      締め
                    </ThemedText>
                    {stats.phrasePatterns.closings.map((phrase, i) => (
                      <View
                        key={`closing-${i}`}
                        style={[
                          styles.phraseItem,
                          { backgroundColor: colors.surfaceSecondary },
                        ]}
                      >
                        <ThemedText style={[styles.phraseText, { color: colors.text }]} numberOfLines={2}>
                          {phrase}
                        </ThemedText>
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.emptyStats}>
                <MaterialIcons name="info-outline" size={20} color={colors.icon} />
                <ThemedText style={[styles.emptyStatsText, { color: colors.textSecondary }]}>
                  分析データがありません。履歴を再分析してください。
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Section 3: 文体設定 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="edit" size={20} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              文体設定
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
              署名
            </ThemedText>
            <ThemedText style={[styles.inputHint, { color: colors.icon }]}>
              メールの末尾に自動追加されます
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder={'例:\n山田太郎\n株式会社ABC 営業部\nTEL: 03-xxxx-xxxx'}
              placeholderTextColor={colors.icon}
              value={signature}
              onChangeText={setSignature}
              onBlur={handleSignatureBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={[styles.inputSeparator, { backgroundColor: colors.border }]} />

            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
              文体メモ
            </ThemedText>
            <ThemedText style={[styles.inputHint, { color: colors.icon }]}>
              AIがメール生成時に参考にします
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder={'例:\n・「させていただく」は使わない\n・簡潔な文体を好む\n・結論を先に書く'}
              placeholderTextColor={colors.icon}
              value={writingStyleNotes}
              onChangeText={setWritingStyleNotes}
              onBlur={handleWritingStyleNotesBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        {/* Section 4: データ管理 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="delete-outline" size={20} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              データ管理
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                borderColor: colors.danger,
                backgroundColor: colors.danger + '08',
              },
            ]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-forever" size={18} color={colors.danger} />
            <ThemedText style={[styles.deleteButtonText, { color: colors.danger }]}>
              すべてのデータを削除
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Section
  section: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsSeparator: {
    height: StyleSheet.hairlineWidth,
  },
  emptyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emptyStatsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // Analyze button
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Phrases
  phraseGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  phraseGroupLabelMarginTop: {
    marginTop: 16,
  },
  phraseItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  phraseText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Input
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
  },
  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },

  // Delete buttons
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
  },
deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
