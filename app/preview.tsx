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
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import type { MailHistoryItem } from '@/types';

export default function PreviewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    generatedMail,
    setGeneratedMail,
    setIsGenerating,
    isGenerating,
    recipient,
    purposeCategory,
    situation,
    tone,
    additionalInfo,
    addHistory,
    resetCreation,
    templateId,
  } = useMailStore();

  const canGenerate = useAuthStore((s) => s.canGenerate);
  const incrementDailyCount = useAuthStore((s) => s.incrementDailyCount);

  const [editedSubject, setEditedSubject] = useState(generatedMail?.subject ?? '');
  const [editedBody, setEditedBody] = useState(generatedMail?.body ?? '');

  // Regenerate mail
  const handleRegenerate = useCallback(async () => {
    if (!recipient || !purposeCategory || !situation) {
      Alert.alert('エラー', 'メールの設定情報が不足しています。作成画面に戻ってください。');
      return;
    }

    if (!canGenerate()) {
      Alert.alert(
        '生成制限',
        '本日の無料生成回数の上限に達しました。プレミアムプランにアップグレードすると無制限に生成できます。',
      );
      return;
    }

    try {
      setIsGenerating(true);
      const mail = await generateMail({
        recipient,
        purposeCategory,
        situation,
        tone,
        additionalInfo,
        templateId: templateId ?? undefined,
      });
      setGeneratedMail(mail);
      setEditedSubject(mail.subject);
      setEditedBody(mail.body);
      incrementDailyCount();
    } catch {
      Alert.alert('エラー', '再生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [
    recipient,
    purposeCategory,
    situation,
    tone,
    additionalInfo,
    templateId,
    canGenerate,
    setIsGenerating,
    setGeneratedMail,
    incrementDailyCount,
  ]);

  // Send mail (mock)
  const handleSend = useCallback(() => {
    Alert.alert('送信確認', '本当に送信しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '送信',
        style: 'default',
        onPress: () => {
          const historyItem: MailHistoryItem = {
            id: generatedMail?.id ?? `mail-${Date.now()}`,
            subject: editedSubject,
            body: editedBody,
            recipientName: '送信先', // Simplified for mock
            recipientEmail: '',
            sentAt: new Date(),
            createdAt: generatedMail?.createdAt ?? new Date(),
            status: 'sent',
          };
          addHistory(historyItem);
          resetCreation();
          Alert.alert('送信完了', 'メールを送信しました。', [
            {
              text: 'OK',
              onPress: () => router.dismissAll(),
            },
          ]);
        },
      },
    ]);
  }, [editedSubject, editedBody, generatedMail, addHistory, resetCreation, router]);

  // Save as draft
  const handleSaveDraft = useCallback(() => {
    const historyItem: MailHistoryItem = {
      id: generatedMail?.id ?? `draft-${Date.now()}`,
      subject: editedSubject,
      body: editedBody,
      recipientName: '送信先',
      recipientEmail: '',
      createdAt: generatedMail?.createdAt ?? new Date(),
      status: 'draft',
    };
    addHistory(historyItem);
    resetCreation();
    Alert.alert('保存完了', '下書きとして保存しました。', [
      {
        text: 'OK',
        onPress: () => router.dismissAll(),
      },
    ]);
  }, [editedSubject, editedBody, generatedMail, addHistory, resetCreation, router]);

  // No generated mail state
  if (!generatedMail && !isGenerating) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
            メールが生成されていません
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyButton, { borderColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.emptyButtonText, { color: colors.tint }]}>
              作成画面に戻る
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Loading overlay */}
      {isGenerating && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingBox,
              { backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#fff' },
            ]}
          >
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>メールを再生成中...</ThemedText>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Generated Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.aiBadge, { backgroundColor: colors.tint + '20' }]}>
            <ThemedText style={[styles.aiBadgeText, { color: colors.tint }]}>
              AI生成
            </ThemedText>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>
            件名
          </ThemedText>
          <TextInput
            style={[
              styles.subjectInput,
              {
                color: colors.text,
                borderColor: colors.icon + '40',
                backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
              },
            ]}
            value={editedSubject}
            onChangeText={setEditedSubject}
            placeholder="件名を入力"
            placeholderTextColor={colors.icon}
          />
        </View>

        {/* Body */}
        <View style={[styles.fieldGroup, styles.bodyFieldGroup]}>
          <ThemedText style={[styles.fieldLabel, { color: colors.icon }]}>
            本文
          </ThemedText>
          <TextInput
            style={[
              styles.bodyInput,
              {
                color: colors.text,
                borderColor: colors.icon + '40',
                backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#f8f9fa',
              },
            ]}
            value={editedBody}
            onChangeText={setEditedBody}
            placeholder="本文を入力"
            placeholderTextColor={colors.icon}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.bottomBar,
          {
            borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Draft save */}
        <TouchableOpacity onPress={handleSaveDraft} style={styles.draftButton}>
          <ThemedText style={[styles.draftButtonText, { color: colors.tint }]}>
            下書き保存
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomButtonRow}>
          {/* Regenerate */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              {
                borderColor: colors.tint,
              },
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleRegenerate}
            disabled={isGenerating}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
              再生成
            </ThemedText>
          </TouchableOpacity>

          {/* Send */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              { backgroundColor: colors.tint },
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleSend}
            disabled={isGenerating}
          >
            <ThemedText style={styles.primaryButtonText}>送信</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  bodyFieldGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  subjectInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  draftButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {},
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
