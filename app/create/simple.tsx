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
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMailStore } from '@/store/use-mail-store';
import { useAuthStore } from '@/store/use-auth-store';
import { SITUATIONS, type SituationItem } from '@/constants/situations';
import { RELATIONSHIP_TONE_MAP } from '@/constants/tone-mapping';
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import type { PurposeCategory, Relationship } from '@/types';

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
    isGenerating,
  } = useMailStore();
  const canGenerate = useAuthStore((s) => s.canGenerate);
  const incrementDailyCount = useAuthStore((s) => s.incrementDailyCount);

  // Local state
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PurposeCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SituationItem | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState('');

  const handleSelectFromContacts = useCallback(() => {
    Alert.alert(
      '連絡先から選択',
      'この機能は今後のアップデートで実装予定です。',
      [{ text: 'OK' }],
    );
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

    if (!canGenerate()) {
      Alert.alert(
        '生成制限',
        '本日の無料生成回数の上限に達しました。プレミアムプランにアップグレードすると無制限に生成できます。',
      );
      return;
    }

    // Set store values
    setMode('simple');
    setPurposeCategory(selectedCategory);
    setSituation(selectedSituation);
    setAdditionalInfo({ keyPoints });

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
      });
      setGeneratedMail(mail);
      incrementDailyCount();
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
    canGenerate,
    setMode,
    setPurposeCategory,
    setSituation,
    setAdditionalInfo,
    setRecipient,
    setTone,
    setIsGenerating,
    setGeneratedMail,
    incrementDailyCount,
    router,
  ]);

  const subcategories = selectedCategory ? SITUATIONS[selectedCategory] ?? [] : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <ThemedText type="subtitle" style={styles.stepTitle}>
            かんたん作成
          </ThemedText>
          <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
            目的を選ぶだけでAIがメールを作成します
          </ThemedText>
        </View>

        {/* Section 1: 送信先 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            送信先
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.icon,
                backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
              },
            ]}
            placeholder="お名前"
            placeholderTextColor={colors.icon}
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.icon,
                backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
              },
            ]}
            placeholder="メールアドレス"
            placeholderTextColor={colors.icon}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.contactButton, { borderColor: colors.tint }]}
            onPress={handleSelectFromContacts}
          >
            <ThemedText style={[styles.contactButtonText, { color: colors.tint }]}>
              連絡先から選択
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Section 2: メールの目的 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            メールの目的
          </ThemedText>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScrollView}
            contentContainerStyle={styles.chipContainer}
          >
            {PURPOSE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  selectedCategory === category
                    ? { backgroundColor: colors.tint }
                    : {
                        backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f0f0f0',
                        borderColor: colors.icon,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    selectedCategory === category
                      ? { color: '#fff' }
                      : { color: colors.text },
                  ]}
                >
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategory list */}
          {selectedCategory && subcategories.length > 0 && (
            <View style={styles.subcategoryContainer}>
              <ThemedText
                style={[styles.subcategoryLabel, { color: colors.icon }]}
              >
                カテゴリを選択
              </ThemedText>
              <View style={styles.subcategoryList}>
                {subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.label}
                    style={[
                      styles.subcategoryItem,
                      selectedSubcategory?.label === sub.label
                        ? {
                            backgroundColor: colors.tint + '20',
                            borderColor: colors.tint,
                          }
                        : {
                            backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f8f9fa',
                            borderColor: colors.icon + '40',
                          },
                    ]}
                    onPress={() => handleSubcategorySelect(sub)}
                  >
                    <ThemedText
                      style={[
                        styles.subcategoryItemText,
                        selectedSubcategory?.label === sub.label
                          ? { color: colors.tint, fontWeight: '600' }
                          : {},
                      ]}
                    >
                      {sub.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Situation list */}
          {selectedSubcategory && (
            <View style={styles.situationContainer}>
              <ThemedText
                style={[styles.subcategoryLabel, { color: colors.icon }]}
              >
                具体的なシチュエーションを選択
              </ThemedText>
              <View style={styles.situationList}>
                {selectedSubcategory.situations.map((situation) => (
                  <TouchableOpacity
                    key={situation}
                    style={[
                      styles.situationItem,
                      selectedSituation === situation
                        ? { backgroundColor: colors.tint, borderColor: colors.tint }
                        : {
                            backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f8f9fa',
                            borderColor: colors.icon + '40',
                          },
                    ]}
                    onPress={() => handleSituationSelect(situation)}
                  >
                    <ThemedText
                      style={[
                        styles.situationItemText,
                        selectedSituation === situation
                          ? { color: '#fff', fontWeight: '600' }
                          : {},
                      ]}
                    >
                      {situation}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Section 3: 要点入力 */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            要点入力
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
              styles.multilineInput,
              {
                color: colors.text,
                borderColor: colors.icon,
                backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
              },
            ]}
            placeholder="メールの要点を入力してください"
            placeholderTextColor={colors.icon}
            value={keyPoints}
            onChangeText={setKeyPoints}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            { backgroundColor: colors.tint },
            isGenerating && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepTitle: {
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  contactButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  chipScrollView: {
    marginBottom: 16,
  },
  chipContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subcategoryContainer: {
    marginBottom: 16,
  },
  subcategoryLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  subcategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subcategoryItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  subcategoryItemText: {
    fontSize: 14,
  },
  situationContainer: {
    marginTop: 4,
  },
  situationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  situationItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  situationItemText: {
    fontSize: 14,
  },
  generateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
