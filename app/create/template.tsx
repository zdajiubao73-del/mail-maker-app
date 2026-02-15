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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ContactPickerModal } from '@/components/contact-picker-modal';
import { useMailStore } from '@/store/use-mail-store';
import { usePlanStore } from '@/store/use-plan-store';
import { Colors } from '@/constants/theme';
import { RELATIONSHIP_TONE_MAP } from '@/constants/tone-mapping';
import { generateMail } from '@/lib/mail-generator';
import { useLearningStore } from '@/store/use-learning-store';
import { buildLearningContext } from '@/lib/learning-analyzer';
import { getTemplateById } from '@/lib/templates';
import type { Contact, Relationship } from '@/types';

const RELATIONSHIPS: Relationship[] = [
  '上司', '同僚', '部下', '取引先', '顧客', '教授', '先輩', '友人', '家族', '初対面',
];

export default function TemplateCreateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const template = id ? getTemplateById(id) : undefined;

  const {
    setMode,
    setTemplateId,
    setPurposeCategory,
    setSituation,
    setRecipient,
    setTone,
    setAdditionalInfo,
    setGeneratedMail,
    setIsGenerating,
    setRecipientInfo,
    isGenerating,
  } = useMailStore();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship>('同僚');
  const [keyPoints, setKeyPoints] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);

  const handleSelectFromContacts = useCallback(() => {
    setIsContactPickerVisible(true);
  }, []);

  const handleContactSelected = useCallback((contact: Contact) => {
    setRecipientName(contact.name);
    setRecipientEmail(contact.email);
    setSelectedRelationship(contact.relationship);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!template) return;

    const { canGenerate, isSubscribed } = usePlanStore.getState();
    if (!canGenerate()) {
      const message = isSubscribed()
        ? '今月の生成回数上限に達しました。来月まで少々お待ちください。'
        : '本日の生成回数上限に達しました。サブスクリプションに登録すると月500回まで生成できます。';
      Alert.alert('生成回数上限', message);
      return;
    }

    const recipient = {
      relationship: selectedRelationship,
      scope: '社内' as const,
      positionLevel: '一般社員' as const,
    };
    const tone = {
      honorificsLevel: RELATIONSHIP_TONE_MAP[selectedRelationship],
      mailLength: '標準' as const,
      atmosphere: '落ち着いた' as const,
      urgency: '通常' as const,
    };

    setMode('template');
    setTemplateId(template.id);
    setPurposeCategory(template.category);
    setSituation(template.situation);
    setRecipient(recipient);
    setTone(tone);
    setAdditionalInfo({ keyPoints });
    setRecipientInfo(recipientName, recipientEmail);

    try {
      setIsGenerating(true);
      const learningProfile = useLearningStore.getState().profile;
      const learningContext = learningProfile ? buildLearningContext(learningProfile) : undefined;
      const mail = await generateMail({
        recipient,
        purposeCategory: template.category,
        situation: template.situation,
        tone,
        additionalInfo: { keyPoints },
        templateId: template.id,
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
    template,
    selectedRelationship,
    keyPoints,
    recipientName,
    recipientEmail,
    setMode,
    setTemplateId,
    setPurposeCategory,
    setSituation,
    setRecipient,
    setTone,
    setAdditionalInfo,
    setRecipientInfo,
    setIsGenerating,
    setGeneratedMail,
    router,
  ]);

  if (!template) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.icon} />
          <ThemedText style={styles.emptyTitle}>
            テンプレートが見つかりませんでした
          </ThemedText>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backBtnText}>戻る</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Template info card */}
        <View
          style={[
            styles.templateCard,
            {
              backgroundColor: colors.tint + '08',
              borderColor: colors.tint + '30',
            },
          ]}
        >
          <View style={styles.templateHeader}>
            <MaterialIcons name="description" size={20} color={colors.tint} />
            <ThemedText style={[styles.templateLabel, { color: colors.tint }]}>
              テンプレート
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.templateName}>
            {template.name}
          </ThemedText>
          <ThemedText style={[styles.templateDesc, { color: colors.textSecondary }]}>
            {template.description}
          </ThemedText>
          <View style={styles.templateMeta}>
            <View style={[styles.templateBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <ThemedText style={[styles.templateBadgeText, { color: colors.textSecondary }]}>
                {template.category}
              </ThemedText>
            </View>
            <View style={[styles.templateBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <ThemedText style={[styles.templateBadgeText, { color: colors.textSecondary }]}>
                {template.situation}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recipient name */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>1</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              送信先（任意）
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
            placeholder="相手のお名前"
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
                marginTop: 8,
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

        {/* Relationship */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>2</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              相手との関係性
            </ThemedText>
          </View>
          <ThemedText style={[styles.sectionHint, { color: colors.textSecondary }]}>
            関係性に応じて敬語レベルが自動調整されます
          </ThemedText>
          <View style={styles.chipContainer}>
            {RELATIONSHIPS.map((rel) => {
              const isSelected = selectedRelationship === rel;
              return (
                <TouchableOpacity
                  key={rel}
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
                  onPress={() => setSelectedRelationship(rel)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      isSelected ? { color: '#FFFFFF' } : { color: colors.text },
                    ]}
                  >
                    {rel}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Key points */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.stepCircle, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.stepCircleText}>3</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              要点入力（任意）
            </ThemedText>
          </View>
          <ThemedText style={[styles.sectionHint, { color: colors.textSecondary }]}>
            伝えたいポイントがあれば入力してください
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
            placeholder="例: 来週の月曜日までに提出してほしい"
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
                android: { elevation: 6 },
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
              <ThemedText style={styles.generateButtonText}>生成中...</ThemedText>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />
              <ThemedText style={styles.generateButtonText}>
                テンプレートからメール生成
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // Template info card
  templateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  templateName: {
    fontSize: 20,
    marginBottom: 8,
  },
  templateDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  templateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  templateBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Cards
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

  // Inputs
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 4,
  },
  contactButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderStyle: 'dashed' as const,
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: 14,
  },

  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Generate
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
    gap: 10,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
