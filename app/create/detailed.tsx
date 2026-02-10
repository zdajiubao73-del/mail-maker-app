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
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import type {
  Relationship,
  Scope,
  PositionLevel,
  PurposeCategory,
  HonorificsLevel,
  MailLength,
  Atmosphere,
  Urgency,
} from '@/types';

const TOTAL_STEPS = 4;

const RELATIONSHIPS: Relationship[] = [
  '上司',
  '同僚',
  '部下',
  '取引先',
  '顧客',
  '教授',
  '先輩',
  '友人',
  '家族',
  '初対面',
];

const SCOPES: Scope[] = ['社内', '社外', '個人間'];

const POSITION_LEVELS: PositionLevel[] = [
  '経営層',
  '管理職',
  '一般社員',
  '学生',
  'その他',
];

const PURPOSE_CATEGORIES: PurposeCategory[] = [
  'ビジネス',
  '就職・転職',
  '学校・学術',
  'プライベート',
];

const HONORIFICS_LEVELS: HonorificsLevel[] = [
  '最敬体',
  '丁寧',
  '普通',
  'カジュアル',
];

const MAIL_LENGTHS: MailLength[] = ['短め', '標準', '長め'];

const ATMOSPHERES: Atmosphere[] = [
  '堅い',
  '落ち着いた',
  '親しみやすい',
  '明るい',
];

const URGENCIES: Urgency[] = ['通常', 'やや急ぎ', '至急'];

export default function DetailedCreateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    setMode,
    setRecipient,
    setPurposeCategory,
    setSituation,
    setTone,
    setAdditionalInfo,
    setGeneratedMail,
    setIsGenerating,
    isGenerating,
    tone,
  } = useMailStore();
  const canGenerate = useAuthStore((s) => s.canGenerate);
  const incrementDailyCount = useAuthStore((s) => s.incrementDailyCount);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Recipient
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);
  const [selectedPositionLevel, setSelectedPositionLevel] = useState<PositionLevel | null>(null);

  // Step 2: Purpose
  const [selectedCategory, setSelectedCategory] = useState<PurposeCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SituationItem | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  // Step 3: Tone
  const [honorificsLevel, setHonorificsLevel] = useState<HonorificsLevel>(tone.honorificsLevel);
  const [mailLength, setMailLength] = useState<MailLength>(tone.mailLength);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(tone.atmosphere);
  const [urgency, setUrgency] = useState<Urgency>(tone.urgency);

  // Step 4: Additional Info
  const [keyPoints, setKeyPoints] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [properNouns, setProperNouns] = useState('');
  const [notes, setNotes] = useState('');

  const progress = currentStep / TOTAL_STEPS;

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return selectedRelationship && selectedScope && selectedPositionLevel;
      case 2:
        return selectedCategory && selectedSituation;
      case 3:
        return true; // All have defaults
      case 4:
        return true; // Optional fields
      default:
        return false;
    }
  }, [
    currentStep,
    selectedRelationship,
    selectedScope,
    selectedPositionLevel,
    selectedCategory,
    selectedSituation,
  ]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleCategorySelect = useCallback((category: PurposeCategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedSituation(null);
  }, []);

  const handleSubcategorySelect = useCallback((subcategory: SituationItem) => {
    setSelectedSubcategory(subcategory);
    setSelectedSituation(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedRelationship || !selectedScope || !selectedPositionLevel) {
      Alert.alert('入力エラー', '送信相手の設定を完了してください。');
      setCurrentStep(1);
      return;
    }
    if (!selectedCategory || !selectedSituation) {
      Alert.alert('入力エラー', 'メールの目的を選択してください。');
      setCurrentStep(2);
      return;
    }
    if (!canGenerate()) {
      Alert.alert(
        '生成制限',
        '本日の無料生成回数の上限に達しました。プレミアムプランにアップグレードすると無制限に生成できます。',
      );
      return;
    }

    const recipient = {
      relationship: selectedRelationship,
      scope: selectedScope,
      positionLevel: selectedPositionLevel,
    };

    const toneSettings = {
      honorificsLevel,
      mailLength,
      atmosphere,
      urgency,
    };

    const additionalInfo = {
      keyPoints,
      dateTime: dateTime || undefined,
      properNouns: properNouns || undefined,
      notes: notes || undefined,
    };

    // Set store values
    setMode('detailed');
    setRecipient(recipient);
    setPurposeCategory(selectedCategory);
    setSituation(selectedSituation);
    setTone(toneSettings);
    setAdditionalInfo(additionalInfo);

    try {
      setIsGenerating(true);
      const mail = await generateMail({
        recipient,
        purposeCategory: selectedCategory,
        situation: selectedSituation,
        tone: toneSettings,
        additionalInfo,
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
    selectedRelationship,
    selectedScope,
    selectedPositionLevel,
    selectedCategory,
    selectedSituation,
    honorificsLevel,
    mailLength,
    atmosphere,
    urgency,
    keyPoints,
    dateTime,
    properNouns,
    notes,
    canGenerate,
    setMode,
    setRecipient,
    setPurposeCategory,
    setSituation,
    setTone,
    setAdditionalInfo,
    setIsGenerating,
    setGeneratedMail,
    incrementDailyCount,
    router,
  ]);

  const subcategories = selectedCategory ? SITUATIONS[selectedCategory] ?? [] : [];

  // Render helpers
  function renderChipGroup<T extends string>(
    items: T[],
    selected: T | null,
    onSelect: (item: T) => void,
  ) {
    return (
      <View style={styles.chipGroup}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.chip,
              selected === item
                ? { backgroundColor: colors.tint }
                : {
                    backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f0f0f0',
                    borderColor: colors.icon + '60',
                    borderWidth: 1,
                  },
            ]}
            onPress={() => onSelect(item)}
          >
            <ThemedText
              style={[
                styles.chipText,
                selected === item ? { color: '#fff' } : { color: colors.text },
              ]}
            >
              {item}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderStep1() {
    return (
      <View>
        <ThemedText type="subtitle" style={styles.stepTitle}>
          送信相手の設定
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
          メールを送る相手との関係性を設定してください
        </ThemedText>

        {/* Relationship */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            関係性
          </ThemedText>
          {renderChipGroup(RELATIONSHIPS, selectedRelationship, setSelectedRelationship)}
        </View>

        {/* Scope */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            範囲
          </ThemedText>
          {renderChipGroup(SCOPES, selectedScope, setSelectedScope)}
        </View>

        {/* Position Level */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            役職レベル
          </ThemedText>
          {renderChipGroup(POSITION_LEVELS, selectedPositionLevel, setSelectedPositionLevel)}
        </View>
      </View>
    );
  }

  function renderStep2() {
    return (
      <View>
        <ThemedText type="subtitle" style={styles.stepTitle}>
          メールの目的
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
          メールの目的を選択してください
        </ThemedText>

        {/* Category tabs */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            カテゴリ
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChipContainer}
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
                        borderColor: colors.icon + '60',
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
        </View>

        {/* Subcategory */}
        {selectedCategory && subcategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              サブカテゴリ
            </ThemedText>
            <View style={styles.chipGroup}>
              {subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.label}
                  style={[
                    styles.chip,
                    selectedSubcategory?.label === sub.label
                      ? {
                          backgroundColor: colors.tint + '20',
                          borderColor: colors.tint,
                          borderWidth: 1,
                        }
                      : {
                          backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f8f9fa',
                          borderColor: colors.icon + '40',
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => handleSubcategorySelect(sub)}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      selectedSubcategory?.label === sub.label
                        ? { color: colors.tint, fontWeight: '600' }
                        : { color: colors.text },
                    ]}
                  >
                    {sub.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Situation */}
        {selectedSubcategory && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
              シチュエーション
            </ThemedText>
            <View style={styles.chipGroup}>
              {selectedSubcategory.situations.map((situation) => (
                <TouchableOpacity
                  key={situation}
                  style={[
                    styles.chip,
                    selectedSituation === situation
                      ? { backgroundColor: colors.tint }
                      : {
                          backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f8f9fa',
                          borderColor: colors.icon + '40',
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => setSelectedSituation(situation)}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      selectedSituation === situation
                        ? { color: '#fff', fontWeight: '600' }
                        : { color: colors.text },
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
    );
  }

  function renderStep3() {
    return (
      <View>
        <ThemedText type="subtitle" style={styles.stepTitle}>
          トーン・文体
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
          メールのトーンや文体を設定してください
        </ThemedText>

        {/* Honorifics Level */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            敬語レベル
          </ThemedText>
          {renderChipGroup(HONORIFICS_LEVELS, honorificsLevel, setHonorificsLevel)}
        </View>

        {/* Mail Length */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            文章の長さ
          </ThemedText>
          {renderChipGroup(MAIL_LENGTHS, mailLength, setMailLength)}
        </View>

        {/* Atmosphere */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            雰囲気
          </ThemedText>
          {renderChipGroup(ATMOSPHERES, atmosphere, setAtmosphere)}
        </View>

        {/* Urgency */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            緊急度
          </ThemedText>
          {renderChipGroup(URGENCIES, urgency, setUrgency)}
        </View>
      </View>
    );
  }

  function renderStep4() {
    const inputStyle = [
      styles.textInput,
      {
        color: colors.text,
        borderColor: colors.icon,
        backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
      },
    ];

    return (
      <View>
        <ThemedText type="subtitle" style={styles.stepTitle}>
          追加情報
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
          メールに含める情報を入力してください（任意）
        </ThemedText>

        {/* Key Points */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            要点
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="メールの要点を入力してください"
            placeholderTextColor={colors.icon}
            value={keyPoints}
            onChangeText={setKeyPoints}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Date Time */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            日時
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="例: 2月15日 14:00"
            placeholderTextColor={colors.icon}
            value={dateTime}
            onChangeText={setDateTime}
          />
        </View>

        {/* Proper Nouns */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            固有名詞
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="例: 株式会社ABC、プロジェクトX"
            placeholderTextColor={colors.icon}
            value={properNouns}
            onChangeText={setProperNouns}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
            補足事項
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="その他、メールに含めたい情報があれば入力してください"
            placeholderTextColor={colors.icon}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <ThemedText style={[styles.progressText, { color: colors.icon }]}>
            ステップ {currentStep}/{TOTAL_STEPS}
          </ThemedText>
        </View>
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#e0e0e0' },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.tint, width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        style={[
          styles.navigationBar,
          {
            borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
            backgroundColor: colors.background,
          },
        ]}
      >
        {currentStep > 1 ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              {
                borderColor: colors.icon,
              },
            ]}
            onPress={handleBack}
          >
            <ThemedText style={styles.backButtonText}>戻る</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {currentStep < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: colors.tint },
              !canGoNext() && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canGoNext()}
          >
            <ThemedText style={styles.nextButtonText}>次へ</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: colors.tint },
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText style={styles.nextButtonText}>生成中...</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.nextButtonText}>メール生成</ThemedText>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    marginBottom: 10,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalChipContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    minWidth: 120,
  },
  backButton: {
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {},
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
