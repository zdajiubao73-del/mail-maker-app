import { useEffect, useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
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
  const learningEnabled = useLearningStore((s) => s.learningEnabled);
  const setLearningEnabled = useLearningStore((s) => s.setLearningEnabled);
  const analyzeHistory = useLearningStore((s) => s.analyzeHistory);
  const updatePreferences = useLearningStore((s) => s.updatePreferences);
  const clearLearningData = useLearningStore((s) => s.clearLearningData);
  const history = useMailStore((s) => s.history);

  const [signature, setSignature] = useState(profile?.preferences.signature ?? '');
  const [writingStyleNotes, setWritingStyleNotes] = useState(
    profile?.preferences.writingStyleNotes ?? '',
  );
  const [openingText, setOpeningText] = useState(
    profile?.preferences.openingText ?? '',
  );

  // 画面表示時に履歴件数変化を検知して自動再分析（学習統計オン時のみ）
  useEffect(() => {
    if (learningEnabled && history.length >= 3 && history.length !== profile?.lastAnalyzedMailCount) {
      analyzeHistory(history);
    }
  }, [learningEnabled, history.length, profile?.lastAnalyzedMailCount, analyzeHistory, history]);

  // profile が変わったら入力値を同期
  useEffect(() => {
    if (profile) {
      setSignature(profile.preferences.signature);
      setWritingStyleNotes(profile.preferences.writingStyleNotes);
      setOpeningText(profile.preferences.openingText ?? '');
    }
  }, [profile]);

  const handleReanalyze = useCallback(() => {
    if (history.length < 3) {
      Alert.alert(
        '分析エラー',
        '分析には3件以上のメール履歴が必要です',
      );
      return;
    }
    analyzeHistory(history);
    Alert.alert('分析完了', '履歴を再分析しました');
  }, [history, analyzeHistory]);

  const handleSignatureBlur = useCallback(() => {
    updatePreferences({ signature });
  }, [signature, updatePreferences]);

  const handleWritingStyleNotesBlur = useCallback(() => {
    updatePreferences({ writingStyleNotes });
  }, [writingStyleNotes, updatePreferences]);

  const handleOpeningTextBlur = useCallback(() => {
    updatePreferences({ openingText });
  }, [openingText, updatePreferences]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      '学習データを削除',
      'すべての学習データを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            clearLearningData();
            setSignature('');
            setWritingStyleNotes('');
            setOpeningText('');
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
        {/* Section 1: 文体設定 */}
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
              メール末尾に自動挿入される署名を設定できます
            </ThemedText>
            <View style={[styles.aiWarning, { backgroundColor: '#FF950010', borderColor: '#FF950040' }]}>
              <MaterialIcons name="info-outline" size={14} color="#FF9500" />
              <ThemedText style={styles.aiWarningText}>
                署名に個人情報（電話番号・住所等）を含める場合はご注意ください。AI処理時にサーバーに送信されます。
              </ThemedText>
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              placeholder={'例:\n山田太郎\n〇〇株式会社\nメール: yamada@example.com'}
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
              文体の指示
            </ThemedText>
            <ThemedText style={[styles.inputHint, { color: colors.icon }]}>
              AIに文体について指示を出せます（例: 「です・ます調で」「簡潔に」）
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
              placeholder="例: 丁寧だが簡潔に。箇条書きを多用してほしい。"
              placeholderTextColor={colors.icon}
              value={writingStyleNotes}
              onChangeText={setWritingStyleNotes}
              onBlur={handleWritingStyleNotesBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={[styles.inputSeparator, { backgroundColor: colors.border }]} />

            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
              文頭に入れる文章
            </ThemedText>
            <ThemedText style={[styles.inputHint, { color: colors.icon }]}>
              メール本文の最初に必ず入れたい文章を設定できます
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
              placeholder="例: お世話になっております。○○部の田中です。"
              placeholderTextColor={colors.icon}
              value={openingText}
              onChangeText={setOpeningText}
              onBlur={handleOpeningTextBlur}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>
        </View>

        {/* Section 2: 学習統計 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={20} color={colors.tint} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              学習統計
            </ThemedText>
            <View style={styles.sectionHeaderSpacer} />
            <Switch
              value={learningEnabled}
              onValueChange={setLearningEnabled}
              trackColor={{ false: colors.border, true: colors.tint + '60' }}
              thumbColor={learningEnabled ? colors.tint : colors.icon}
            />
          </View>

          {!learningEnabled && (
            <View style={[styles.disabledHint, { backgroundColor: colors.surfaceSecondary }]}>
              <MaterialIcons name="info-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={[styles.disabledHintText, { color: colors.textSecondary }]}>
                オフにすると、メール生成時に学習データが使われなくなります
              </ThemedText>
            </View>
          )}

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !learningEnabled && styles.disabledSection,
            ]}
          >
            {hasStats ? (
              <>
                <View style={styles.statsRow}>
                  <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    分析済みメール数
                  </ThemedText>
                  <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                    {`${stats.totalMailsAnalyzed}件`}
                  </ThemedText>
                </View>
                <View style={[styles.statsSeparator, { backgroundColor: colors.border }]} />
                <View style={styles.statsRow}>
                  <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    平均本文長
                  </ThemedText>
                  <ThemedText style={[styles.statsValue, { color: colors.text }]}>
                    {`${stats.averageBodyLength}文字`}
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
              <View style={styles.emptyStatsEnhanced}>
                <MaterialIcons name="analytics" size={32} color={colors.icon} />
                <ThemedText style={[styles.emptyStatsTitle, { color: colors.text }]}>
                  学習データなし
                </ThemedText>
                <ThemedText style={[styles.emptyStatsText, { color: colors.textSecondary }]}>
                  メールを3件以上作成すると、あなたの文体をAIが自動分析します
                </ThemedText>
                <View style={styles.emptyStatsProgress}>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.tint, width: `${Math.min((history.length / 3) * 100, 100)}%` }]} />
                  </View>
                  <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                    {`${history.length} / 3件`}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              { borderColor: colors.tint, backgroundColor: colors.tint + '08' },
              !learningEnabled && styles.disabledSection,
            ]}
            onPress={handleReanalyze}
            activeOpacity={0.7}
            disabled={!learningEnabled}
          >
            <MaterialIcons name="refresh" size={18} color={colors.tint} />
            <ThemedText style={[styles.analyzeButtonText, { color: colors.tint }]}>
              再分析する
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Section 3: よく使うフレーズ */}
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
              !learningEnabled && styles.disabledSection,
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
                      締めくくり
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
              <View style={styles.emptyPhrasesContainer}>
                <MaterialIcons name="format-quote" size={28} color={colors.icon} />
                <ThemedText style={[styles.emptyPhrasesTitle, { color: colors.text }]}>
                  フレーズ未検出
                </ThemedText>
                <ThemedText style={[styles.emptyStatsText, { color: colors.textSecondary }]}>
                  メール作成を重ねると、よく使う書き出しや締めくくりのパターンを検出します
                </ThemedText>
                <View style={[styles.phraseExampleContainer, { backgroundColor: colors.surfaceSecondary }]}>
                  <ThemedText style={[styles.phraseExampleLabel, { color: colors.icon }]}>
                    検出例
                  </ThemedText>
                  <ThemedText style={[styles.phraseExampleText, { color: colors.textSecondary }]}>
                    「お世話になっております」「ご確認のほどよろしくお願いいたします」
                  </ThemedText>
                </View>
              </View>
            )}
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
              学習データをすべて削除
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
  sectionHeaderSpacer: {
    flex: 1,
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
  emptyStatsEnhanced: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyStatsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyStatsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyStatsProgress: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyPhrasesContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyPhrasesTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  phraseExampleContainer: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  phraseExampleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  phraseExampleText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
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
  aiWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  aiWarningText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#FF9500',
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

  // Disabled state
  disabledSection: {
    opacity: 0.5,
  },
  disabledHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
