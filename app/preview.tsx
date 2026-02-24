import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ContactPickerModal } from '@/components/contact-picker-modal';
import { useMailStore } from '@/store/use-mail-store';
import { useAuthStore } from '@/store/use-auth-store';
import { usePresetStore } from '@/store/use-preset-store';
import { Colors } from '@/constants/theme';
import { generateMail } from '@/lib/mail-generator';
import { sendMail } from '@/lib/mail-sender';
import { useLearningStore } from '@/store/use-learning-store';
import { buildLearningContext } from '@/lib/learning-analyzer';
import { isValidEmail } from '@/lib/validation';
import type { MailHistoryItem, Attachment, GeneratedMail } from '@/types';

type GenerationSnapshot = {
  generatedMail: GeneratedMail;
  editedSubject: string;
  editedBody: string;
};

const MAX_REGENERATIONS = 3;
const MAX_ATTACHMENT_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

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
    recipientName: storeRecipientName,
    recipientEmail: storeRecipientEmail,
    cc,
    bcc,
    addCc,
    removeCc,
    addBcc,
    removeBcc,
    attachments,
    addAttachment,
    removeAttachment,
  } = useMailStore();

  const addPreset = usePresetStore((s) => s.addPreset);

  const [editedSubject, setEditedSubject] = useState(generatedMail?.subject ?? '');
  const [editedBody, setEditedBody] = useState(generatedMail?.body ?? '');

  // Version history
  const [generationHistory, setGenerationHistory] = useState<GenerationSnapshot[]>(() =>
    generatedMail
      ? [{ generatedMail, editedSubject: generatedMail.subject, editedBody: generatedMail.body }]
      : [],
  );
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  const [showCcBcc, setShowCcBcc] = useState(cc.length > 0 || bcc.length > 0);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCcContactPicker, setShowCcContactPicker] = useState(false);
  const [showBccContactPicker, setShowBccContactPicker] = useState(false);

  const handleAddCc = useCallback(() => {
    const email = ccInput.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      Alert.alert('入力エラー', 'メールアドレスの形式が正しくありません');
      return;
    }
    if (cc.includes(email)) {
      Alert.alert('重複', '既にCCに追加されています');
      return;
    }
    addCc(email);
    setCcInput('');
  }, [ccInput, cc, addCc]);

  const handleAddBcc = useCallback(() => {
    const email = bccInput.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      Alert.alert('入力エラー', 'メールアドレスの形式が正しくありません');
      return;
    }
    if (bcc.includes(email)) {
      Alert.alert('重複', '既にBCCに追加されています');
      return;
    }
    addBcc(email);
    setBccInput('');
  }, [bccInput, bcc, addBcc]);

  const handleCcContactSelected = useCallback((contact: { email: string }) => {
    if (!cc.includes(contact.email)) {
      addCc(contact.email);
    }
  }, [cc, addCc]);

  const handleBccContactSelected = useCallback((contact: { email: string }) => {
    if (!bcc.includes(contact.email)) {
      addBcc(contact.email);
    }
  }, [bcc, addBcc]);

  const isSubjectEdited = editedSubject !== (generatedMail?.subject ?? '');
  const isBodyEdited = editedBody !== (generatedMail?.body ?? '');

  const handleResetSubject = useCallback(() => {
    setEditedSubject(generatedMail?.subject ?? '');
  }, [generatedMail]);

  const handleResetBody = useCallback(() => {
    setEditedBody(generatedMail?.body ?? '');
  }, [generatedMail]);

  const totalAttachmentSize = attachments.reduce((sum, a) => sum + a.size, 0);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      const newSize = totalAttachmentSize + (asset.fileSize ?? 0);
      if (newSize > MAX_ATTACHMENT_TOTAL_SIZE) {
        Alert.alert('ファイルサイズ超過', '添付ファイルの合計サイズが25MBを超えています');
        return;
      }
      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      };
      addAttachment(attachment);
    }
  }, [addAttachment, totalAttachmentSize]);

  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      const newSize = totalAttachmentSize + (asset.size ?? 0);
      if (newSize > MAX_ATTACHMENT_TOTAL_SIZE) {
        Alert.alert('ファイルサイズ超過', '添付ファイルの合計サイズが25MBを超えています');
        return;
      }
      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? 0,
      };
      addAttachment(attachment);
    }
  }, [addAttachment, totalAttachmentSize]);

  const handleAddAttachment = useCallback(() => {
    Alert.alert('ファイルを添付', '添付方法を選択してください', [
      { text: '写真ライブラリ', onPress: handlePickImage },
      { text: 'ファイル', onPress: handlePickDocument },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  }, [handlePickImage, handlePickDocument]);

  // Regeneration count (initial generation is index 0, regenerations start from index 1)
  const regenerationCount = generationHistory.length - 1;
  const remainingRegenerations = MAX_REGENERATIONS - regenerationCount;
  const canRegenerate = remainingRegenerations > 0;

  // Regenerate mail
  const handleRegenerate = useCallback(async () => {
    if (!canRegenerate) {
      Alert.alert('再生成の上限', `再生成は最大${MAX_REGENERATIONS}回までです`);
      return;
    }

    if (!recipient || !purposeCategory || !situation) {
      Alert.alert('設定不足', 'メール生成に必要な設定が不足しています');
      return;
    }

    try {
      setIsGenerating(true);
      const { profile: learningProfile, learningEnabled } = useLearningStore.getState();
      const learningContext = learningEnabled && learningProfile ? buildLearningContext(learningProfile) : undefined;
      const mail = await generateMail({
        recipient,
        purposeCategory,
        situation,
        tone,
        additionalInfo,
        templateId: templateId ?? undefined,
        learningContext,
      });

      // Save current edits to snapshot and truncate forward history
      setGenerationHistory((prev) => {
        const updated = [...prev];
        updated[currentVersionIndex] = {
          ...updated[currentVersionIndex],
          editedSubject,
          editedBody,
        };
        const truncated = updated.slice(0, currentVersionIndex + 1);
        truncated.push({ generatedMail: mail, editedSubject: mail.subject, editedBody: mail.body });
        return truncated;
      });
      setCurrentVersionIndex((prev) => prev + 1);

      setGeneratedMail(mail);
      setEditedSubject(mail.subject);
      setEditedBody(mail.body);
    } catch {
      Alert.alert('再生成エラー', 'メールの再生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [
    canRegenerate,
    recipient,
    purposeCategory,
    situation,
    tone,
    additionalInfo,
    templateId,
    setIsGenerating,
    setGeneratedMail,
    currentVersionIndex,
    editedSubject,
    editedBody,
  ]);

  // Version navigation
  const handleGoToPreviousVersion = useCallback(() => {
    if (currentVersionIndex <= 0) return;
    // Save current edits
    setGenerationHistory((prev) => {
      const updated = [...prev];
      updated[currentVersionIndex] = {
        ...updated[currentVersionIndex],
        editedSubject,
        editedBody,
      };
      return updated;
    });
    const prevIndex = currentVersionIndex - 1;
    setCurrentVersionIndex(prevIndex);
    const snapshot = generationHistory[prevIndex];
    setGeneratedMail(snapshot.generatedMail);
    setEditedSubject(snapshot.editedSubject);
    setEditedBody(snapshot.editedBody);
  }, [currentVersionIndex, editedSubject, editedBody, generationHistory, setGeneratedMail]);

  const handleGoToNextVersion = useCallback(() => {
    if (currentVersionIndex >= generationHistory.length - 1) return;
    // Save current edits
    setGenerationHistory((prev) => {
      const updated = [...prev];
      updated[currentVersionIndex] = {
        ...updated[currentVersionIndex],
        editedSubject,
        editedBody,
      };
      return updated;
    });
    const nextIndex = currentVersionIndex + 1;
    setCurrentVersionIndex(nextIndex);
    const snapshot = generationHistory[nextIndex];
    setGeneratedMail(snapshot.generatedMail);
    setEditedSubject(snapshot.editedSubject);
    setEditedBody(snapshot.editedBody);
  }, [currentVersionIndex, editedSubject, editedBody, generationHistory, setGeneratedMail]);

  const mailAccounts = useAuthStore((s) => s.mailAccounts);

  // Send mail
  const handleSend = useCallback(() => {
    const authenticatedAccount = mailAccounts.find(
      (a) => a.authStatus === 'authenticated',
    );

    if (mailAccounts.length === 0) {
      Alert.alert(
        'メールアカウント未登録',
        '設定画面からメールアカウントを連携してください',
        [{ text: 'OK' }],
      );
      return;
    }

    const sendAccount = authenticatedAccount ?? mailAccounts[0];

    const recipientDisplay = storeRecipientEmail
      ? `\n宛先: ${storeRecipientName
            ? `${storeRecipientName} (${storeRecipientEmail})`
            : storeRecipientEmail}`
      : '';
    Alert.alert(
      '送信確認',
      `${sendAccount.email} から送信します。${recipientDisplay}\n\n※AIが生成した内容です。送信前に内容をご確認ください。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '送信',
          style: 'default',
          onPress: async () => {
            try {
              setIsGenerating(true);
              const result = await sendMail({
                account: sendAccount,
                to: storeRecipientEmail,
                subject: editedSubject,
                body: editedBody,
                cc: cc.length > 0 ? cc : undefined,
                bcc: bcc.length > 0 ? bcc : undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
              });

              if (!result.success) {
                Alert.alert('送信エラー', result.error ?? 'メールの送信に失敗しました');
                return;
              }

              const historyItem: MailHistoryItem = {
                id: generatedMail?.id ?? `mail-${Date.now()}`,
                subject: editedSubject,
                body: editedBody,
                recipientName: storeRecipientName || '宛先未設定',
                recipientEmail: storeRecipientEmail,
                ...(cc.length > 0 ? { cc } : {}),
                ...(bcc.length > 0 ? { bcc } : {}),
                sentAt: new Date(),
                createdAt: generatedMail?.createdAt ?? new Date(),
                status: 'sent',
                ...(attachments.length > 0 ? {
                  attachments: attachments.map((a) => ({
                    id: a.id, name: a.name, mimeType: a.mimeType, size: a.size,
                  })),
                } : {}),
                ...(recipient && purposeCategory && situation ? {
                  generationContext: { recipient, purposeCategory, situation, tone },
                } : {}),
              };
              addHistory(historyItem);
              resetCreation();
              Alert.alert('送信完了', 'メールを送信しました', [
                {
                  text: 'OK',
                  onPress: () => router.dismissAll(),
                },
              ]);
            } catch {
              Alert.alert('エラー', 'メールの送信に失敗しました');
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ],
    );
  }, [editedSubject, editedBody, generatedMail, addHistory, resetCreation, router, mailAccounts, setIsGenerating, storeRecipientName, storeRecipientEmail, cc, bcc, recipient, purposeCategory, situation, tone, attachments]);

  // Save as draft
  const handleSaveDraft = useCallback(() => {
    const historyItem: MailHistoryItem = {
      id: generatedMail?.id ?? `draft-${Date.now()}`,
      subject: editedSubject,
      body: editedBody,
      recipientName: storeRecipientName || '宛先未設定',
      recipientEmail: storeRecipientEmail,
      ...(cc.length > 0 ? { cc } : {}),
      ...(bcc.length > 0 ? { bcc } : {}),
      createdAt: generatedMail?.createdAt ?? new Date(),
      status: 'draft',
      ...(attachments.length > 0 ? {
        attachments: attachments.map((a) => ({
          id: a.id, name: a.name, mimeType: a.mimeType, size: a.size,
        })),
      } : {}),
      ...(recipient && purposeCategory && situation ? {
        generationContext: { recipient, purposeCategory, situation, tone },
      } : {}),
    };
    addHistory(historyItem);
    resetCreation();
    Alert.alert('下書き保存完了', '下書きを保存しました', [
      {
        text: 'OK',
        onPress: () => router.dismissAll(),
      },
    ]);
  }, [editedSubject, editedBody, generatedMail, addHistory, resetCreation, router, storeRecipientName, storeRecipientEmail, cc, bcc, recipient, purposeCategory, situation, tone, attachments]);

  // Copy body to clipboard
  const handleCopyBody = useCallback(async () => {
    await Clipboard.setStringAsync(editedBody);
    // 60秒後にクリップボードを自動クリア
    setTimeout(() => {
      Clipboard.setStringAsync('').catch(() => {});
    }, 60_000);
    Alert.alert('コピー完了', '本文をクリップボードにコピーしました');
  }, [editedBody]);

  // Save as preset
  const handleSavePreset = useCallback(() => {
    const savePreset = (name: string) => {
      addPreset({
        id: `preset-${Date.now()}`,
        name,
        recipientName: storeRecipientName || undefined,
        recipientEmail: storeRecipientEmail || undefined,
        relationship: recipient?.relationship,
        scope: recipient?.scope,
        positionLevel: recipient?.positionLevel,
        purposeCategory: purposeCategory ?? undefined,
        situation: situation || undefined,
        tone,
        subject: editedSubject || undefined,
        body: editedBody || undefined,
        createdAt: new Date(),
      });
      Alert.alert('保存完了', 'よく使う文章に保存しました');
    };

    if (Alert.prompt) {
      Alert.prompt(
        'プリセット名',
        'プリセット名を入力してください',
        (name) => {
          if (!name?.trim()) return;
          savePreset(name.trim());
        },
        'plain-text',
        '',
        'default',
      );
    } else {
      // Android fallback
      savePreset(`プリセット ${new Date().toLocaleDateString()}`);
    }
  }, [addPreset, storeRecipientName, storeRecipientEmail, recipient, purposeCategory, situation, tone, editedSubject, editedBody]);

  // No generated mail state
  if (!generatedMail && !isGenerating) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.tint + '12' },
            ]}
          >
            <MaterialIcons name="mail-outline" size={48} color={colors.tint} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            {'生成されたメールがありません'}
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            {'メール作成画面から生成してください'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={18} color="#fff" />
            <ThemedText style={styles.emptyButtonText}>
              {'戻る'}
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
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.loadingSpinnerRing,
                { borderColor: colors.tint + '20' },
              ]}
            >
              <ActivityIndicator size={36} color={colors.tint} style={{ margin: 0, padding: 0 }} />
            </View>
            <ThemedText style={[styles.loadingText, { color: colors.text }]}>
              {'再生成中...'}
            </ThemedText>
            <ThemedText style={[styles.loadingSubText, { color: colors.textSecondary }]}>
              {'しばらくお待ちください'}
            </ThemedText>
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
          <View style={[styles.aiBadge, { backgroundColor: colors.tint + '12' }]}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.tint} />
            <ThemedText style={[styles.aiBadgeText, { color: colors.tint }]}>
              {'AI生成'}
            </ThemedText>
          </View>
        </View>

        {/* AI Disclaimer */}
        <View style={[styles.disclaimerBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
          <MaterialIcons name="info-outline" size={16} color={colors.warning} />
          <ThemedText style={[styles.disclaimerText, { color: colors.warning }]}>
            {'AIが生成した内容です。送信前に必ず内容をご確認ください。'}
          </ThemedText>
        </View>

        {/* Recipient info */}
        {(storeRecipientName || storeRecipientEmail) && (
          <View style={[styles.recipientInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="person-outline" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.recipientInfoText, { color: colors.textSecondary }]}>
              {storeRecipientName}{storeRecipientEmail ? ` (${storeRecipientEmail})` : ''}
            </ThemedText>
          </View>
        )}

        {/* CC / BCC toggle */}
        {!showCcBcc ? (
          <TouchableOpacity
            style={[styles.ccBccToggle, { borderColor: colors.border }]}
            onPress={() => setShowCcBcc(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="group-add" size={18} color={colors.tint} />
            <ThemedText style={[styles.ccBccToggleText, { color: colors.tint }]}>
              {'CC/BCCを追加'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.fieldGroup}>
            {/* CC */}
            <View style={styles.ccBccSection}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary, marginLeft: 4, marginBottom: 8 }]}>
                {'CC'}
              </ThemedText>
              {cc.length > 0 && (
                <View style={styles.chipContainer}>
                  {cc.map((email) => (
                    <View key={email} style={[styles.chip, { backgroundColor: colors.tint + '12' }]}>
                      <ThemedText style={[styles.chipText, { color: colors.tint }]} numberOfLines={1}>
                        {email}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeCc(email)} hitSlop={6}>
                        <MaterialIcons name="close" size={14} color={colors.tint} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.ccInputActions}>
                <View style={[styles.ccInputRow, styles.ccInputRowFlex, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.ccInput, { color: colors.text }]}
                    value={ccInput}
                    onChangeText={setCcInput}
                    placeholder={'メールアドレスを入力'}
                    placeholderTextColor={colors.icon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleAddCc}
                  />
                  <TouchableOpacity onPress={handleAddCc} activeOpacity={0.6}>
                    <MaterialIcons name="add-circle" size={24} color={ccInput.trim() ? colors.tint : colors.icon} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.contactPickerButton, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}
                  onPress={() => setShowCcContactPicker(true)}
                  activeOpacity={0.6}
                >
                  <MaterialIcons name="contacts" size={20} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </View>

            {/* BCC */}
            <View style={styles.ccBccSection}>
              <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary, marginLeft: 4, marginBottom: 8 }]}>
                {'BCC'}
              </ThemedText>
              {bcc.length > 0 && (
                <View style={styles.chipContainer}>
                  {bcc.map((email) => (
                    <View key={email} style={[styles.chip, { backgroundColor: colors.warning + '12' }]}>
                      <ThemedText style={[styles.chipText, { color: colors.warning }]} numberOfLines={1}>
                        {email}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeBcc(email)} hitSlop={6}>
                        <MaterialIcons name="close" size={14} color={colors.warning} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.ccInputActions}>
                <View style={[styles.ccInputRow, styles.ccInputRowFlex, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.ccInput, { color: colors.text }]}
                    value={bccInput}
                    onChangeText={setBccInput}
                    placeholder={'メールアドレスを入力'}
                    placeholderTextColor={colors.icon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleAddBcc}
                  />
                  <TouchableOpacity onPress={handleAddBcc} activeOpacity={0.6}>
                    <MaterialIcons name="add-circle" size={24} color={bccInput.trim() ? colors.tint : colors.icon} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.contactPickerButton, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}
                  onPress={() => setShowBccContactPicker(true)}
                  activeOpacity={0.6}
                >
                  <MaterialIcons name="contacts" size={20} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Subject */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {'件名'}
            </ThemedText>
            {isSubjectEdited && (
              <View style={styles.editedRow}>
                <View style={[styles.editedBadge, { backgroundColor: colors.warning + '18' }]}>
                  <MaterialIcons name="edit" size={11} color={colors.warning} />
                  <ThemedText style={[styles.editedBadgeText, { color: colors.warning }]}>
                    {'編集済み'}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleResetSubject} activeOpacity={0.6}>
                  <ThemedText style={[styles.resetText, { color: colors.tint }]}>
                    {'元に戻す'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View
            style={[
              styles.fieldCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.subjectInput,
                { color: colors.text },
              ]}
              value={editedSubject}
              onChangeText={setEditedSubject}
              placeholder={'件名を入力'}
              placeholderTextColor={colors.icon}
              maxLength={200}
              accessibilityLabel={'件名入力欄'}
            />
          </View>
        </View>

        {/* Body */}
        <View style={[styles.fieldGroup, styles.bodyFieldGroup]}>
          <View style={styles.fieldLabelRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {'本文'}
            </ThemedText>
            {isBodyEdited && (
              <View style={styles.editedRow}>
                <View style={[styles.editedBadge, { backgroundColor: colors.warning + '18' }]}>
                  <MaterialIcons name="edit" size={11} color={colors.warning} />
                  <ThemedText style={[styles.editedBadgeText, { color: colors.warning }]}>
                    {'編集済み'}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleResetBody} activeOpacity={0.6}>
                  <ThemedText style={[styles.resetText, { color: colors.tint }]}>
                    {'元に戻す'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View
            style={[
              styles.fieldCard,
              styles.bodyFieldCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.bodyInput,
                { color: colors.text },
              ]}
              value={editedBody}
              onChangeText={setEditedBody}
              placeholder={'本文を入力'}
              placeholderTextColor={colors.icon}
              multiline
              textAlignVertical="top"
              maxLength={5000}
              accessibilityLabel={'本文入力欄'}
            />
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {'添付ファイル'}
            </ThemedText>
            {attachments.length > 0 && (
              <ThemedText style={[styles.attachmentSizeText, { color: colors.textSecondary }]}>
                {formatFileSize(totalAttachmentSize)} / 25 MB
              </ThemedText>
            )}
          </View>

          {attachments.length === 0 ? (
            <TouchableOpacity
              style={[
                styles.attachmentEmpty,
                { borderColor: colors.border },
              ]}
              onPress={handleAddAttachment}
              activeOpacity={0.7}
            >
              <MaterialIcons name="attach-file" size={24} color={colors.icon} />
              <ThemedText style={[styles.attachmentEmptyText, { color: colors.icon }]}>
                {'タップしてファイルを添付'}
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.attachmentList}>
              {attachments.map((att) => (
                <View
                  key={att.id}
                  style={[
                    styles.attachmentItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {isImageMimeType(att.mimeType) ? (
                    <Image source={{ uri: att.uri }} style={styles.attachmentThumbnail} />
                  ) : (
                    <View style={[styles.attachmentIconBox, { backgroundColor: colors.tint + '12' }]}>
                      <MaterialIcons name="insert-drive-file" size={20} color={colors.tint} />
                    </View>
                  )}
                  <View style={styles.attachmentInfo}>
                    <ThemedText
                      style={[styles.attachmentName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {att.name}
                    </ThemedText>
                    <ThemedText style={[styles.attachmentSize, { color: colors.textSecondary }]}>
                      {formatFileSize(att.size)}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(att.id)}
                    hitSlop={8}
                    activeOpacity={0.6}
                  >
                    <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addMoreButton, { borderColor: colors.border }]}
                onPress={handleAddAttachment}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={18} color={colors.tint} />
                <ThemedText style={[styles.addMoreText, { color: colors.tint }]}>
                  {'追加'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            shadowColor: colorScheme === 'dark' ? '#000' : '#94A3B8',
          },
        ]}
      >
        {/* Top row: draft save + copy + preset save */}
        <View style={styles.topButtonRow}>
          <TouchableOpacity
            onPress={handleSaveDraft}
            style={styles.draftButton}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={'下書き保存'}
          >
            <ThemedText style={[styles.draftButtonText, { color: colors.textSecondary }]}>
              {'下書き保存'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCopyBody}
            style={styles.draftButton}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={'本文をコピー'}
          >
            <View style={styles.copyButtonContent}>
              <MaterialIcons name="content-copy" size={15} color={colors.tint} />
              <ThemedText style={[styles.draftButtonText, { color: colors.tint }]}>
                {'コピー'}
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSavePreset}
            style={styles.draftButton}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={'よく使う文章に保存'}
          >
            <ThemedText style={[styles.draftButtonText, { color: colors.tint }]}>
              {'よく使う文章に保存'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Version navigation */}
        {generationHistory.length >= 2 && (
          <View style={styles.versionNav}>
            <TouchableOpacity
              onPress={handleGoToPreviousVersion}
              disabled={currentVersionIndex <= 0}
              activeOpacity={0.6}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={'前のバージョン'}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={currentVersionIndex <= 0 ? colors.icon : colors.tint}
              />
            </TouchableOpacity>
            <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>
              {`${currentVersionIndex + 1} / ${generationHistory.length}`}
            </ThemedText>
            <TouchableOpacity
              onPress={handleGoToNextVersion}
              disabled={currentVersionIndex >= generationHistory.length - 1}
              activeOpacity={0.6}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={'次のバージョン'}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={currentVersionIndex >= generationHistory.length - 1 ? colors.icon : colors.tint}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomButtonRow}>
          {/* Regenerate */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              {
                borderColor: canRegenerate ? colors.tint : colors.icon,
                backgroundColor: canRegenerate ? colors.tint + '08' : colors.surfaceSecondary,
              },
              (isGenerating || !canRegenerate) && styles.buttonDisabled,
            ]}
            onPress={handleRegenerate}
            disabled={isGenerating || !canRegenerate}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={'再生成'}
            accessibilityState={{ disabled: isGenerating || !canRegenerate }}
          >
            <MaterialIcons
              name="refresh"
              size={18}
              color={canRegenerate ? colors.tint : colors.icon}
              style={styles.buttonIcon}
            />
            <ThemedText style={[styles.secondaryButtonText, { color: canRegenerate ? colors.tint : colors.icon }]}>
              {'再生成'}{canRegenerate ? `（残り${remainingRegenerations}回）` : '（上限）'}
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
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={'送信'}
            accessibilityState={{ disabled: isGenerating }}
          >
            <MaterialIcons
              name="send"
              size={18}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.primaryButtonText}>{'送信'}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Picker Modals for CC / BCC */}
      <ContactPickerModal
        visible={showCcContactPicker}
        onClose={() => setShowCcContactPicker(false)}
        onSelect={handleCcContactSelected}
      />
      <ContactPickerModal
        visible={showBccContactPicker}
        onClose={() => setShowBccContactPicker(false)}
        onSelect={handleBccContactSelected}
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
    padding: 24,
    paddingBottom: 24,
  },

  // ── AI Badge ──
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── AI Disclaimer ──
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Recipient info ──
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  recipientInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ── CC / BCC ──
  ccBccToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  ccBccToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ccBccSection: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  ccInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ccInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  ccInputRowFlex: {
    flex: 1,
  },
  contactPickerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ccInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },

  // ── Field groups ──
  fieldGroup: {
    marginBottom: 20,
  },
  bodyFieldGroup: {
    flex: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: 4,
    marginRight: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  editedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bodyFieldCard: {
    minHeight: 320,
  },
  subjectInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 26,
    minHeight: 320,
  },

  // ── Attachments ──
  attachmentSizeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  attachmentEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  attachmentEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachmentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  attachmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Bottom bar ──
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 10,
  },
  draftButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  versionNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  buttonIcon: {
    marginRight: 2,
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

  // ── Loading overlay ──
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingBox: {
    paddingHorizontal: 40,
    paddingVertical: 36,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingSpinnerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    marginBottom: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubText: {
    fontSize: 13,
    fontWeight: '400',
  },

  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
