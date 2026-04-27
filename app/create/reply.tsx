import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PaywallModal } from '@/components/paywall-modal';
import { LearningPreferencesPanel } from '@/components/learning-preferences-panel';
import { useMailStore } from '@/store/use-mail-store';
import { useLearningStore } from '@/store/use-learning-store';
import { usePlanStore } from '@/store/use-plan-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateReply, extractTextFromImage, MailGenerationError } from '@/lib/mail-generator';
import { useResponsivePadding, useContentMaxWidth } from '@/hooks/use-responsive';
import type { HonorificsLevel } from '@/types';

const HONORIFICS: HonorificsLevel[] = ['最敬体', '丁寧', '普通', 'カジュアル'];

type InputMode = 'text' | 'screenshot';

export default function ReplyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const padding = useResponsivePadding();
  const contentMaxWidth = useContentMaxWidth();

  const {
    replyReceivedText,
    replyIntent,
    replyHonorifics,
    setReplyReceivedText,
    setReplyIntent,
    setReplyHonorifics,
    setGeneratedMail,
    setIsGenerating,
    setMode,
    isGenerating,
  } = useMailStore();

  const learningProfile = useLearningStore((s) => s.profile);

  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [receivedText, setReceivedText] = useState(replyReceivedText);
  const [intent, setIntent] = useState(replyIntent);
  const [honorifics, setHonorifics] = useState<HonorificsLevel>(replyHonorifics);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const handlePickScreenshot = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('権限が必要です', '写真ライブラリへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSelectedImageUri(asset.uri);
    setExtractedText('');
    setReceivedText('');

    if (!asset.base64) {
      Alert.alert('エラー', '画像の読み込みに失敗しました');
      return;
    }

    setIsExtracting(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const text = await extractTextFromImage(asset.base64, mimeType);
      setExtractedText(text);
      setReceivedText(text);
    } catch (err) {
      const message = err instanceof MailGenerationError
        ? err.message
        : 'テキストの読み取りに失敗しました。テキスト貼り付けをご利用ください。';
      Alert.alert('読み取りエラー', message);
      setSelectedImageUri(null);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmedReceived = receivedText.trim();
    const trimmedIntent = intent.trim();

    if (!trimmedReceived) {
      Alert.alert('入力エラー', '受け取ったメールの内容を入力してください');
      return;
    }
    if (!trimmedIntent) {
      Alert.alert('入力エラー', '返信の意図を入力してください');
      return;
    }

    if (!usePlanStore.getState().isSubscribed()) {
      setShowPaywallModal(true);
      return;
    }
    if (!usePlanStore.getState().canGenerate()) {
      const limit = usePlanStore.getState().getMonthlyLimit();
      Alert.alert('生成上限に達しました', `今月の生成上限（${limit}回）に達しました。来月になると再度ご利用いただけます。`);
      return;
    }

    setReplyReceivedText(trimmedReceived);
    setReplyIntent(trimmedIntent);
    setReplyHonorifics(honorifics);
    setMode('reply');

    try {
      setIsGenerating(true);
      // 学習データ画面の文体設定は各項目のON/OFFトグル状態を尊重して反映する
      const prefs = learningProfile?.preferences;
      const signature = prefs?.signatureEnabled !== false
        ? (prefs?.signature?.trim() || undefined)
        : undefined;
      const writingStyleNotes = prefs?.writingStyleEnabled !== false
        ? (prefs?.writingStyleNotes?.trim() || undefined)
        : undefined;
      const openingText = prefs?.openingTextEnabled !== false
        ? (prefs?.openingText?.trim() || undefined)
        : undefined;
      const mail = await generateReply({
        receivedMailText: trimmedReceived,
        replyIntent: trimmedIntent,
        honorificsLevel: honorifics,
        signature,
        writingStyleNotes,
        openingText,
      });
      setGeneratedMail(mail);
      usePlanStore.getState().incrementGenerationCount();
      router.push('/preview');
    } catch (err) {
      const message = err instanceof MailGenerationError
        ? err.message
        : '返信の生成に失敗しました。再度お試しください。';
      Alert.alert('エラー', message);
    } finally {
      setIsGenerating(false);
    }
  }, [receivedText, intent, honorifics, setReplyReceivedText, setReplyIntent, setReplyHonorifics, setMode, setIsGenerating, setGeneratedMail, router, learningProfile]);

  const containerStyle = contentMaxWidth
    ? { maxWidth: contentMaxWidth + 48, alignSelf: 'center' as const, width: '100%' as const }
    : undefined;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: padding }, containerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 受け取ったメール */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              受け取ったメール
            </ThemedText>

            {/* Input mode toggle */}
            <View style={[styles.toggleRow, { backgroundColor: colors.surfaceSecondary, borderRadius: 12 }]}>
              {(['text', 'screenshot'] as InputMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.toggleButton,
                    { backgroundColor: inputMode === m ? colors.surface : 'transparent' },
                    inputMode === m && { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
                  ]}
                  onPress={() => setInputMode(m)}
                >
                  <MaterialIcons
                    name={m === 'text' ? 'chat' : 'image'}
                    size={16}
                    color={inputMode === m ? colors.tint : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <ThemedText style={[styles.toggleText, { color: inputMode === m ? colors.tint : colors.textSecondary }]}>
                    {m === 'text' ? 'テキスト貼付' : 'スクショ'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Text input mode */}
            {inputMode === 'text' && (
              <View style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  multiline
                  placeholder={'受け取ったメールの文章を貼り付けてください\n\n例:\nお世話になっております。\n〇〇の件についてご確認させてください。\n...'}
                  placeholderTextColor={colors.textSecondary}
                  value={receivedText}
                  onChangeText={setReceivedText}
                  textAlignVertical="top"
                  scrollEnabled={false}
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Screenshot mode */}
            {inputMode === 'screenshot' && (
              <View>
                <TouchableOpacity
                  style={[styles.screenshotPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handlePickScreenshot}
                  disabled={isExtracting}
                  activeOpacity={0.7}
                >
                  {selectedImageUri ? (
                    <Image source={{ uri: selectedImageUri }} style={styles.thumbnail} resizeMode="cover" />
                  ) : (
                    <>
                      <MaterialIcons name="image" size={36} color={colors.textSecondary} />
                      <ThemedText style={[styles.screenshotPickerText, { color: colors.textSecondary }]}>
                        タップしてスクリーンショットを選択
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>

                {isExtracting && (
                  <View style={[styles.extractingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <ThemedText style={[styles.extractingText, { color: colors.textSecondary }]}>
                      テキストを読み取り中...
                    </ThemedText>
                  </View>
                )}

                {extractedText ? (
                  <View style={[styles.extractedContainer, { backgroundColor: colors.surface, borderColor: colors.tint + '40' }]}>
                    <View style={styles.extractedHeader}>
                      <MaterialIcons name="check-circle" size={14} color={colors.success} />
                      <ThemedText style={[styles.extractedLabel, { color: colors.success }]}>
                        読み取り完了
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.extractedText, { color: colors.text }]} numberOfLines={6}>
                      {extractedText}
                    </ThemedText>
                    <TouchableOpacity onPress={handlePickScreenshot} style={styles.rePickButton}>
                      <ThemedText style={[styles.rePickText, { color: colors.tint }]}>
                        別の画像を選ぶ
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* 返信の意図 */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              どう返信しますか？
            </ThemedText>
            <View style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border, minHeight: 100 }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text, minHeight: 80 }]}
                multiline
                placeholder={'例:\n・了承します\n・来週火曜の15時でお願いします\n・確認してから改めてご連絡します'}
                placeholderTextColor={colors.textSecondary}
                value={intent}
                onChangeText={setIntent}
                textAlignVertical="top"
                scrollEnabled={false}
              />
            </View>
          </View>

          {/* 敬語レベル */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              敬語レベル
            </ThemedText>
            <View style={styles.chipRow}>
              {HONORIFICS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: honorifics === h ? colors.tint : colors.surface,
                      borderColor: honorifics === h ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setHonorifics(h)}
                >
                  <ThemedText style={[styles.chipText, { color: honorifics === h ? '#fff' : colors.text }]}>
                    {h}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Learning preferences */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              学習データの反映
            </ThemedText>
            <LearningPreferencesPanel />
          </View>

          {/* Generate button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: isGenerating ? colors.border : colors.tint },
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.generateButtonText}>
                返信を生成
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingTop: 24, paddingBottom: 48 },
  section: { marginBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 160,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },
  screenshotPicker: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  screenshotPickerText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  extractingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  extractingText: {
    fontSize: 13,
  },
  extractedContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  extractedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  extractedText: {
    fontSize: 13,
    lineHeight: 20,
  },
  rePickButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  rePickText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  generateButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
