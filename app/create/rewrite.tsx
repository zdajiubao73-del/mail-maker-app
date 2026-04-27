import React, { useRef, useState, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ContactPickerModal } from '@/components/contact-picker-modal';
import { LearningPreferencesPanel } from '@/components/learning-preferences-panel';
import { useMailStore } from '@/store/use-mail-store';
import { useLearningStore } from '@/store/use-learning-store';
import { usePlanStore } from '@/store/use-plan-store';
import { Colors } from '@/constants/theme';
import { PREMIUM_MONTHLY_LIMIT } from '@/constants/plan';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { rewriteMail, MailGenerationError } from '@/lib/mail-generator';
import { useResponsivePadding, useContentMaxWidth } from '@/hooks/use-responsive';
import { useRegisterTutorialTarget } from '@/hooks/use-tutorial-target';
import type { HonorificsLevel, MailLength, Contact } from '@/types';

const HONORIFICS: HonorificsLevel[] = ['最敬体', '丁寧', '普通', 'カジュアル'];
const LENGTHS: MailLength[] = ['短め', '標準', '長め'];

export default function RewriteScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const padding = useResponsivePadding();
  const contentMaxWidth = useContentMaxWidth();

  const {
    rewriteDraft,
    rewriteHonorifics,
    rewriteMailLength,
    setRewriteDraft,
    setRewriteHonorifics,
    setRewriteMailLength,
    setGeneratedMail,
    setIsGenerating,
    setMode,
    setRecipientInfo,
    isGenerating,
  } = useMailStore();

  const learningProfile = useLearningStore((s) => s.profile);
  const [draft, setDraft] = useState(rewriteDraft);
  const [honorifics, setHonorifics] = useState<HonorificsLevel>(rewriteHonorifics);
  const [mailLength, setMailLength] = useState<MailLength>(rewriteMailLength);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);

  const draftInputRef = useRef<View>(null);
  const generateButtonRef = useRef<View>(null);
  useRegisterTutorialTarget('rewrite-draft', draftInputRef, { borderRadius: 12 });
  useRegisterTutorialTarget('rewrite-generate', generateButtonRef, { borderRadius: 12 });

  const handleContactSelected = useCallback((contact: Contact) => {
    setRecipientName(contact.name);
    setRecipientEmail(contact.email);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('入力エラー', '下書きを入力してください');
      return;
    }
    if (trimmed.length < 10) {
      Alert.alert('入力エラー', 'もう少し詳しく書いてください（10文字以上）');
      return;
    }

    const planState = usePlanStore.getState();
    if (!planState.canGenerate()) {
      const limit = planState.getMonthlyLimit();
      if (planState.isSubscribed()) {
        Alert.alert('生成上限に達しました', `今月の生成上限（${limit}回）に達しました。来月になると再度ご利用いただけます。`);
      } else {
        Alert.alert(
          '生成上限に達しました',
          `無料プランの今月の生成上限（${limit}回）に達しました。プレミアムプランにアップグレードすると、月${PREMIUM_MONTHLY_LIMIT}回まで生成できます。`,
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'プランを見る', onPress: () => router.push('/settings/plan') },
          ],
        );
      }
      return;
    }

    setRewriteDraft(trimmed);
    setRewriteHonorifics(honorifics);
    setRewriteMailLength(mailLength);
    setRecipientInfo(recipientName.trim(), recipientEmail.trim());
    setMode('rewrite');

    try {
      setIsGenerating(true);
      // 学習データ画面の文体設定（署名/文体の指示/文頭定型文）は
      // 各項目のON/OFFトグル状態を尊重して反映する
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
      const mail = await rewriteMail({
        draftText: trimmed,
        honorificsLevel: honorifics,
        mailLength,
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
        : 'メールの整形に失敗しました。再度お試しください。';
      Alert.alert('エラー', message);
    } finally {
      setIsGenerating(false);
    }
  }, [draft, honorifics, mailLength, recipientName, recipientEmail, setRewriteDraft, setRewriteHonorifics, setRewriteMailLength, setRecipientInfo, setMode, setIsGenerating, setGeneratedMail, router, learningProfile]);

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
          {/* Recipient */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              送信先（任意）
            </ThemedText>
            <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputText, { color: colors.text }]}
                placeholder={'宛名（例: 田中さん）'}
                placeholderTextColor={colors.textSecondary}
                value={recipientName}
                onChangeText={setRecipientName}
                maxLength={50}
              />
            </View>
            <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
              <TextInput
                style={[styles.inputText, { color: colors.text }]}
                placeholder={'メールアドレス（例: tanaka@example.com）'}
                placeholderTextColor={colors.textSecondary}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={254}
              />
            </View>
            <TouchableOpacity
              style={[styles.contactButton, { borderColor: colors.tint }]}
              onPress={() => setIsContactPickerVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.contactButtonText, { color: colors.tint }]}>
                連絡先から選択
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Draft input */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              下書き
            </ThemedText>
            <View
              ref={draftInputRef}
              style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <TextInput
                testID="tut-rewrite-draft"
                style={[styles.textArea, { color: colors.text }]}
                multiline
                placeholder={'送りたいことをざっくり書いてください。箇条書きでもOK。\n\n例①（上司へ）\n有給を来週月曜に取りたい\n理由は私用\n\n例②（取引先へ）\n提案書を送ったので確認してほしい\n来週中に返事がほしい\n急ぎではないけど早めだと助かる\n\n例③（教授へ）\n卒論の締め切りに間に合わなそう\n1週間延ばしてもらえないか相談したい'}
                placeholderTextColor={colors.textSecondary}
                value={draft}
                onChangeText={setDraft}
                textAlignVertical="top"
                scrollEnabled={false}
                autoCorrect={false}
              />
            </View>
            <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
              {draft.length} / 3000文字
            </ThemedText>
          </View>

          {/* Honorifics */}
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

          {/* Mail length */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              文の長さ
            </ThemedText>
            <View style={styles.chipRow}>
              {LENGTHS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: mailLength === l ? colors.tint : colors.surface,
                      borderColor: mailLength === l ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setMailLength(l)}
                >
                  <ThemedText style={[styles.chipText, { color: mailLength === l ? '#fff' : colors.text }]}>
                    {l}
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
            ref={generateButtonRef}
            testID="tut-rewrite-generate"
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
                ✨ AIで整える
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <ContactPickerModal
        visible={isContactPickerVisible}
        onClose={() => setIsContactPickerVisible(false)}
        onSelect={handleContactSelected}
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
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 200,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
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
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputText: {
    fontSize: 15,
  },
  contactButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 14,
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
