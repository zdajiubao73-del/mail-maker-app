import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ContactPickerModal } from '@/components/contact-picker-modal';
import { useMailStore } from '@/store/use-mail-store';
import { usePlanStore } from '@/store/use-plan-store';
import { SITUATIONS, type SituationItem } from '@/constants/situations';
import { RELATIONSHIP_TONE_MAP } from '@/constants/tone-mapping';
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import { useLearningStore } from '@/store/use-learning-store';
import { buildLearningContext } from '@/lib/learning-analyzer';
import type { Contact, PurposeCategory, Relationship } from '@/types';

const PURPOSE_CATEGORIES: PurposeCategory[] = [
  'ビジネス',
  '就職・転職',
  '学校・学術',
  'プライベート',
];

export default function SimpleCreateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    setPurposeCategory,
    setSituation,
    setAdditionalInfo,
    setGeneratedMail,
    setIsGenerating,
    setMode,
    setRecipient,
    setTone,
    setRecipientInfo,
    isGenerating,
  } = useMailStore();
  // Local state
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PurposeCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SituationItem | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState('');
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);

  const handleSelectFromContacts = useCallback(() => {
    setIsContactPickerVisible(true);
  }, []);

  const handleContactSelected = useCallback((contact: Contact) => {
    setRecipientName(contact.name);
    setRecipientEmail(contact.email);
  }, []);

  const handleCategorySelect = useCallback((category: PurposeCategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedSituation(null);
  }, []);

  const handleSubcategorySelect = useCallback((subcategory: SituationItem) => {
    setSelectedSubcategory(subcategory);
    setSelectedSituation(null);
  }, []);

  const handleSituationSelect = useCallback((situation: string) => {
    setSelectedSituation(situation);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedCategory || !selectedSituation) {
      Alert.alert('入力エラー', 'メールの目的を選択してください。');
      return;
    }

    const { canGenerate, isSubscribed } = usePlanStore.getState();
    if (!canGenerate()) {
      const message = isSubscribed()
        ? '今月の生成回数上限に達しました。来月まで少々お待ちください。'
        : '本日の生成回数上限に達しました。サブスクリプションに登録すると月500回まで生成できます。';
      Alert.alert('生成回数上限', message);
      return;
    }

    // Set store values
    setMode('simple');
    setPurposeCategory(selectedCategory);
    setSituation(selectedSituation);
    setAdditionalInfo({ keyPoints });
    setRecipientInfo(recipientName, recipientEmail);

    // Auto-set recipient and tone for simple mode
    const defaultRecipient = {
      relationship: '同僚' as Relationship,
      scope: '社内' as const,
      positionLevel: '一般社員' as const,
    };
    setRecipient(defaultRecipient);
    setTone({ honorificsLevel: RELATIONSHIP_TONE_MAP['同僚'] });

    try {
      setIsGenerating(true);
      const learningProfile = useLearningStore.getState().profile;
      const learningContext = learningProfile ? buildLearningContext(learningProfile) : undefined;
      const mail = await generateMail({
        recipient: defaultRecipient,
        purposeCategory: selectedCategory,
        situation: selectedSituation,
        tone: {
          honorificsLevel: RELATIONSHIP_TONE_MAP['同僚'],
          mailLength: '標準',
          atmosphere: '落ち着いた',
          urgency: '通常',
        },
        additionalInfo: { keyPoints },
        learningContext,
      });
      setGeneratedMail(mail);
      usePlanStore.getState().incrementGenerationCount();
      router.push('/preview');
    } catch {
      Alert.alert('エラー', 'メールの生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedCategory,
    selectedSituation,
    keyPoints,
    recipientName,
    recipientEmail,
    setMode,
    setPurposeCategory,
    setSituation,
    setAdditionalInfo,
    setRecipient,
    setTone,
    setRecipientInfo,
    setIsGenerating,
    setGeneratedMail,
    router,
  ]);

  const subcategories = selectedCategory ? SITUATIONS[selectedCategory] ?? [] : [];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <ThemedText type="subtitle" style={styles.stepTitle}>
            かんたん作成
          </ThemedText>
          <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
            目的を選ぶだけでAIがメールを作成します
          </ThemedText>
        </View>

        {/* Section 1: 送信先 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>1</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              送信先
            </ThemedText>
          </View>

          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="お名前"
            placeholderTextColor={colors.icon}
            value={recipientName}
            onChangeText={setRecipientName}
            maxLength={50}
          />
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="メールアドレス"
            placeholderTextColor={colors.icon}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
          />
          <TouchableOpacity
            style={[styles.contactButton, { borderColor: colors.tint }]}
            onPress={handleSelectFromContacts}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.contactButtonText, { color: colors.tint }]}>
              連絡先から選択
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Section 2: メールの目的 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>2</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              メールの目的
            </ThemedText>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScrollView}
            contentContainerStyle={styles.chipContainer}
          >
            {PURPOSE_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: colors.tint }
                      : {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => handleCategorySelect(category)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      isSelected
                        ? { color: '#FFFFFF' }
                        : { color: colors.text },
                    ]}
                  >
                    {isSelected ? '  ' : ''}{category}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Subcategory list */}
          {selectedCategory && subcategories.length > 0 && (
            <View style={styles.subcategoryContainer}>
              <ThemedText
                style={[styles.subcategoryLabel, { color: colors.textSecondary }]}
              >
                カテゴリを選択
              </ThemedText>
              <View style={styles.subcategoryList}>
                {subcategories.map((sub) => {
                  const isSelected = selectedSubcategory?.label === sub.label;
                  return (
                    <TouchableOpacity
                      key={sub.label}
                      style={[
                        styles.subcategoryItem,
                        isSelected
                          ? {
                              backgroundColor: colors.tint + '18',
                              borderColor: colors.tint,
                            }
                          : {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                      ]}
                      onPress={() => handleSubcategorySelect(sub)}
                      activeOpacity={0.7}
                    >
                      <ThemedText
                        style={[
                          styles.subcategoryItemText,
                          isSelected
                            ? { color: colors.tint, fontWeight: '600' }
                            : { color: colors.text },
                        ]}
                      >
                        {isSelected ? '  ' : ''}{sub.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Situation list */}
          {selectedSubcategory && (
            <View style={styles.situationContainer}>
              <ThemedText
                style={[styles.subcategoryLabel, { color: colors.textSecondary }]}
              >
                具体的なシチュエーションを選択
              </ThemedText>
              <View style={styles.situationList}>
                {selectedSubcategory.situations.map((situation) => {
                  const isSelected = selectedSituation === situation;
                  return (
                    <TouchableOpacity
                      key={situation}
                      style={[
                        styles.situationItem,
                        isSelected
                          ? { backgroundColor: colors.tint, borderColor: colors.tint }
                          : {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                      ]}
                      onPress={() => handleSituationSelect(situation)}
                      activeOpacity={0.7}
                    >
                      <ThemedText
                        style={[
                          styles.situationItemText,
                          isSelected
                            ? { color: '#FFFFFF', fontWeight: '600' }
                            : { color: colors.text },
                        ]}
                      >
                        {isSelected ? '  ' : ''}{situation}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Section 3: 要点入力 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>3</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              要点入力
            </ThemedText>
          </View>

          <ThemedText style={[styles.sectionHint, { color: colors.textSecondary }]}>
            伝えたいポイントがあれば入力してください（任意）
          </ThemedText>

          <TextInput
            style={[
              styles.textInput,
              styles.multilineInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="メールの要点を入力してください"
            placeholderTextColor={colors.icon}
            value={keyPoints}
            onChangeText={setKeyPoints}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            {
              backgroundColor: colors.tint,
              ...Platform.select({
                ios: {
                  shadowColor: colors.tint,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 6,
                },
              }),
            },
            isGenerating && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <ThemedText style={styles.generateButtonText}>
                生成中...
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.generateButtonText}>
              メール生成
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
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepTitle: {
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: 14,
  },
  contactButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderStyle: 'dashed',
    marginTop: 2,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chipScrollView: {
    marginBottom: 16,
  },
  chipContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subcategoryContainer: {
    marginBottom: 16,
  },
  subcategoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  subcategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subcategoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  situationContainer: {
    marginTop: 4,
  },
  situationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  situationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  situationItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  generateButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
