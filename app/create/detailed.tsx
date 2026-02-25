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
import { PaywallModal } from '@/components/paywall-modal';
import { useMailStore } from '@/store/use-mail-store';
import { usePlanStore } from '@/store/use-plan-store';
import { SITUATIONS, type SituationItem } from '@/constants/situations';
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import { useLearningStore } from '@/store/use-learning-store';
import { buildLearningContext } from '@/lib/learning-analyzer';
import { useResponsivePadding, useContentMaxWidth } from '@/hooks/use-responsive';
import type {
  Contact,
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
  'その他',
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
  const STEP_LABELS = [
    '送信相手',
    '目的',
    'トーン',
    '追加情報',
  ];

  const responsivePadding = useResponsivePadding();
  const contentMaxWidth = useContentMaxWidth();
  const {
    setMode,
    setRecipient,
    setPurposeCategory,
    setSituation,
    setTone,
    setAdditionalInfo,
    setGeneratedMail,
    setIsGenerating,
    setRecipientInfo,
    isGenerating,
    tone,
  } = useMailStore();
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);
  const [selectedPositionLevel, setSelectedPositionLevel] = useState<PositionLevel | null>(null);

  // Step 2: Purpose
  const [selectedCategory, setSelectedCategory] = useState<PurposeCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SituationItem | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [customPurpose, setCustomPurpose] = useState('');
  const [customSituation, setCustomSituation] = useState('');

  // Step 3: Tone
  const [honorificsLevel, setHonorificsLevel] = useState<HonorificsLevel>(tone.honorificsLevel);
  const [mailLength, setMailLength] = useState<MailLength>(tone.mailLength);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(tone.atmosphere);
  const [urgency, setUrgency] = useState<Urgency>(tone.urgency);
  const [writingStyleNotes, setWritingStyleNotes] = useState('');
  const [openingText, setOpeningText] = useState('');
  const [signature, setSignature] = useState('');

  // Step 4: Additional Info
  const [keyPoints, setKeyPoints] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [properNouns, setProperNouns] = useState('');
  const [notes, setNotes] = useState('');

  // Contact picker
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const handleContactSelected = useCallback((contact: Contact) => {
    setRecipientName(contact.name);
    setRecipientEmail(contact.email);
    setSelectedRelationship(contact.relationship);
    setSelectedScope(contact.scope);
    setSelectedPositionLevel(contact.positionLevel);
  }, []);

  const progress = currentStep / TOTAL_STEPS;

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return selectedRelationship && selectedScope && selectedPositionLevel;
      case 2:
        if (!selectedCategory) return false;
        if (selectedCategory === 'その他') return customPurpose.trim().length > 0;
        if (selectedSituation === 'その他') return customSituation.trim().length > 0;
        return !!selectedSituation;
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
    customPurpose,
    customSituation,
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
    setCustomPurpose('');
    setCustomSituation('');
  }, []);

  const handleSubcategorySelect = useCallback((subcategory: SituationItem) => {
    setSelectedSubcategory(subcategory);
    setSelectedSituation(null);
    setCustomSituation('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedRelationship || !selectedScope || !selectedPositionLevel) {
      Alert.alert('入力エラー', '送信相手の情報を入力してください');
      setCurrentStep(1);
      return;
    }
    const resolvedSituation = selectedCategory === 'その他'
      ? customPurpose.trim()
      : selectedSituation === 'その他'
        ? customSituation.trim()
        : selectedSituation;
    if (!selectedCategory || !resolvedSituation) {
      Alert.alert('入力エラー', 'メールの目的を選択してください');
      setCurrentStep(2);
      return;
    }

    const { canUseApp, canGenerate } = usePlanStore.getState();
    if (!canUseApp()) {
      setShowPaywallModal(true);
      return;
    }
    if (!canGenerate()) {
      Alert.alert('生成上限に達しました', '今月の生成上限に達しました。来月までお待ちください。');
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
    setSituation(resolvedSituation);
    setTone(toneSettings);
    setAdditionalInfo(additionalInfo);
    setRecipientInfo(recipientName, recipientEmail);

    try {
      setIsGenerating(true);
      const { profile: learningProfile, learningEnabled } = useLearningStore.getState();
      const built = learningProfile ? buildLearningContext(learningProfile, learningEnabled) : undefined;
      const learningContext = built && Object.keys(built).length > 0 ? built : undefined;
      const mail = await generateMail({
        recipient,
        purposeCategory: selectedCategory,
        situation: resolvedSituation,
        tone: toneSettings,
        additionalInfo,
        writingStyleNotes: writingStyleNotes.trim() || undefined,
        openingText: openingText.trim() || undefined,
        signature: signature.trim() || undefined,
        learningContext,
      });
      setGeneratedMail(mail);
      usePlanStore.getState().incrementGenerationCount();
      router.push('/preview');
    } catch {
      Alert.alert('生成エラー', 'メールの生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedRelationship,
    selectedScope,
    selectedPositionLevel,
    selectedCategory,
    selectedSituation,
    customPurpose,
    customSituation,
    honorificsLevel,
    mailLength,
    atmosphere,
    urgency,
    keyPoints,
    dateTime,
    properNouns,
    notes,
    writingStyleNotes,
    openingText,
    signature,
    recipientName,
    recipientEmail,
    setMode,
    setRecipient,
    setPurposeCategory,
    setSituation,
    setTone,
    setAdditionalInfo,
    setRecipientInfo,
    setIsGenerating,
    setGeneratedMail,
    router,
  ]);

  const subcategories = selectedCategory ? SITUATIONS[selectedCategory] ?? [] : [];

  // Render helpers
  function renderChipGroup<T extends string>(
    items: T[],
    selected: T | null,
    onSelect: (item: T) => void,
    labelFn?: (item: T) => string,
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
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
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
              {labelFn ? labelFn(item) : item}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderStepIndicator() {
    return (
      <View style={styles.stepIndicatorContainer}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <View key={stepNum} style={styles.stepIndicatorItem}>
              <View
                style={[
                  styles.stepDot,
                  isCompleted && { backgroundColor: colors.tint },
                  isCurrent && {
                    backgroundColor: colors.tint,
                    borderWidth: 3,
                    borderColor: colors.tint + '40',
                  },
                  !isCompleted &&
                    !isCurrent && {
                      backgroundColor: colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                ]}
              >
                {isCompleted ? (
                  <ThemedText style={styles.stepDotCheckText}>
                    {'✓'}
                  </ThemedText>
                ) : (
                  <ThemedText
                    style={[
                      styles.stepDotNumber,
                      isCurrent
                        ? { color: '#fff' }
                        : { color: colors.textSecondary },
                    ]}
                  >
                    {stepNum}
                  </ThemedText>
                )}
              </View>
              <ThemedText
                style={[
                  styles.stepLabel,
                  isCurrent
                    ? { color: colors.tint, fontWeight: '600' }
                    : isCompleted
                      ? { color: colors.text, fontWeight: '500' }
                      : { color: colors.textSecondary, fontWeight: '400' },
                ]}
              >
                {STEP_LABELS[i]}
              </ThemedText>
              {i < TOTAL_STEPS - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    {
                      backgroundColor: isCompleted
                        ? colors.tint
                        : colors.border,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  function renderStep1() {
    return (
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.stepTitleRow}>
          <View style={[styles.stepNumberBadge, { backgroundColor: colors.tint + '15' }]}>
            <ThemedText style={[styles.stepNumberBadgeText, { color: colors.tint }]}>1</ThemedText>
          </View>
          <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
            {'送信相手の設定'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {'送信先の情報を入力してください'}
        </ThemedText>

        {/* Recipient Name & Email */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'送信先'}
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="宛名（例: 田中太郎）"
            placeholderTextColor={colors.textSecondary}
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
                marginTop: 8,
              },
            ]}
            placeholder="メールアドレス（例: tanaka@example.com）"
            placeholderTextColor={colors.textSecondary}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
          />
          <TouchableOpacity
            style={[styles.contactButton, { borderColor: colors.tint }]}
            onPress={() => setIsContactPickerVisible(true)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.contactButtonText, { color: colors.tint }]}>
              {'連絡先から選択'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Relationship */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'関係性'}
          </ThemedText>
          {renderChipGroup(RELATIONSHIPS, selectedRelationship, setSelectedRelationship)}
        </View>

        {/* Scope */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'社内/社外'}
          </ThemedText>
          {renderChipGroup(SCOPES, selectedScope, setSelectedScope)}
        </View>

        {/* Position Level */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'役職レベル'}
          </ThemedText>
          {renderChipGroup(POSITION_LEVELS, selectedPositionLevel, setSelectedPositionLevel)}
        </View>
      </View>
    );
  }

  function renderStep2() {
    return (
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.stepTitleRow}>
          <View style={[styles.stepNumberBadge, { backgroundColor: colors.tint + '15' }]}>
            <ThemedText style={[styles.stepNumberBadgeText, { color: colors.tint }]}>2</ThemedText>
          </View>
          <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
            {'メールの目的'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {'送信するメールの目的を選択してください'}
        </ThemedText>

        {/* Category tabs */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'カテゴリ'}
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
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
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

        {/* Custom purpose input for その他 */}
        {selectedCategory === 'その他' && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
              {'メールの目的'}
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
              {'どんなメールを作成したいか自由に入力してください'}
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
              placeholder="例: 引越し業者への見積もり依頼、保険の解約手続き"
              placeholderTextColor={colors.textSecondary}
              value={customPurpose}
              onChangeText={setCustomPurpose}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>
        )}

        {/* Subcategory */}
        {selectedCategory && selectedCategory !== 'その他' && subcategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
              {'サブカテゴリ'}
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
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
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
        {selectedSubcategory && selectedCategory !== 'その他' && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
              {'シチュエーション'}
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
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => {
                    setSelectedSituation(situation);
                    if (situation !== 'その他') setCustomSituation('');
                  }}
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

        {/* Custom situation input */}
        {selectedSituation === 'その他' && selectedCategory !== 'その他' && (
          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
              {'シチュエーションの詳細'}
            </ThemedText>
            <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
              {'どのような内容のメールか具体的に入力してください'}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="例: 会場の予約依頼、プロジェクトの進捗共有"
              placeholderTextColor={colors.textSecondary}
              value={customSituation}
              onChangeText={setCustomSituation}
              maxLength={200}
            />
          </View>
        )}
      </View>
    );
  }

  function renderStep3() {
    return (
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.stepTitleRow}>
          <View style={[styles.stepNumberBadge, { backgroundColor: colors.tint + '15' }]}>
            <ThemedText style={[styles.stepNumberBadgeText, { color: colors.tint }]}>3</ThemedText>
          </View>
          <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
            {'トーン・文体'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {'メールのトーンと文体を調整できます'}
        </ThemedText>

        {/* Honorifics Level */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'敬語レベル'}
          </ThemedText>
          {renderChipGroup(HONORIFICS_LEVELS, honorificsLevel, setHonorificsLevel)}
        </View>

        {/* Mail Length */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'文章の長さ'}
          </ThemedText>
          {renderChipGroup(MAIL_LENGTHS, mailLength, setMailLength)}
        </View>

        {/* Atmosphere */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'雰囲気'}
          </ThemedText>
          {renderChipGroup(ATMOSPHERES, atmosphere, setAtmosphere)}
        </View>

        {/* Urgency */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'緊急度'}
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
        borderColor: colors.border,
        backgroundColor: colors.surface,
      },
    ];

    return (
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.stepTitleRow}>
          <View style={[styles.stepNumberBadge, { backgroundColor: colors.tint + '15' }]}>
            <ThemedText style={[styles.stepNumberBadgeText, { color: colors.tint }]}>4</ThemedText>
          </View>
          <ThemedText style={[styles.stepTitle, { color: colors.text }]}>
            {'追加情報'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {'メールに含めたい情報があれば入力してください'}
        </ThemedText>

        {/* Key Points */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'要点'}
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="伝えたいポイントを入力..."
            placeholderTextColor={colors.textSecondary}
            value={keyPoints}
            onChangeText={setKeyPoints}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Date Time */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'メールに記載する日時'}
          </ThemedText>
          <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {'会議・打ち合わせの候補日、締切、イベント日程など'}
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="例: 3月5日(水) 14:00〜15:00"
            placeholderTextColor={colors.textSecondary}
            value={dateTime}
            onChangeText={setDateTime}
            maxLength={100}
          />
        </View>

        {/* Proper Nouns */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'固有名詞'}
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="例: 〇〇株式会社、△△プロジェクト"
            placeholderTextColor={colors.textSecondary}
            value={properNouns}
            onChangeText={setProperNouns}
            maxLength={200}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'補足事項'}
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="その他の補足情報..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Opening Text */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'文頭に入れる文章'}
          </ThemedText>
          <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {'メール冒頭にそのまま挿入する文章を入力してください'}
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="例: いつもお世話になっております。株式会社〇〇の田中です。"
            placeholderTextColor={colors.textSecondary}
            value={openingText}
            onChangeText={setOpeningText}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* Writing Style Notes */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'文体の指示'}
          </ThemedText>
          <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {'文体について追加の指示があれば入力してください'}
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder="例: です/ます調で、箇条書きを使って簡潔に"
            placeholderTextColor={colors.textSecondary}
            value={writingStyleNotes}
            onChangeText={setWritingStyleNotes}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Signature */}
        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold" style={[styles.fieldLabel, { color: colors.text }]}>
            {'署名'}
          </ThemedText>
          <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {'メール末尾に追加する署名を入力してください'}
          </ThemedText>
          <TextInput
            style={[...inputStyle, styles.multilineInput]}
            placeholder={'例:\n山田太郎\n株式会社〇〇 営業部\nTEL: 03-1234-5678'}
            placeholderTextColor={colors.textSecondary}
            value={signature}
            onChangeText={setSignature}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Step Indicator + Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {renderStepIndicator()}
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colors.surfaceSecondary },
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: responsivePadding },
          contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const } : undefined,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <View
        style={[
          styles.navigationBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {currentStep > 1 ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={handleBack}
          >
            <ThemedText style={[styles.backButtonText, { color: colors.text }]}>
              {'戻る'}
            </ThemedText>
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
            <ThemedText style={styles.nextButtonText}>{'次へ'}</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.generateButton,
              { backgroundColor: colors.tint },
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText style={styles.generateButtonText}>{'生成中...'}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.generateButtonText}>{'メールを生成'}</ThemedText>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ContactPickerModal
        visible={isContactPickerVisible}
        onClose={() => setIsContactPickerVisible(false)}
        onSelect={handleContactSelected}
      />
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
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

  /* ---- Step Indicator ---- */
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIndicatorItem: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepDotCheckText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepDotNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 11,
  },
  stepConnector: {
    position: 'absolute',
    top: 15,
    left: '55%',
    width: '90%',
    height: 2,
    borderRadius: 1,
  },

  /* ---- Progress Bar ---- */
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* ---- Scroll / Content ---- */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },

  /* ---- Step Card ---- */
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  /* ---- Field Groups ---- */
  fieldGroup: {
    marginBottom: 22,
  },
  fieldLabel: {
    marginBottom: 10,
    fontSize: 15,
  },
  fieldHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    marginTop: -4,
  },

  /* ---- Chips ---- */
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalChipContainer: {
    gap: 8,
    paddingVertical: 2,
  },

  /* ---- Contact Button ---- */
  contactButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* ---- Text Inputs ---- */
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },

  /* ---- Navigation Bar ---- */
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    minWidth: 120,
  },
  backButton: {
    borderWidth: 1.5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  generateButton: {
    minWidth: 160,
    paddingHorizontal: 40,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
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
