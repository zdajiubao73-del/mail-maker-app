import { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Share,
  Alert,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useMailStore } from '@/store/use-mail-store';
import { Colors } from '@/constants/theme';
import { STATUS_CONFIG, formatFullDate } from '@/constants/mail-status';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const item = useMailStore((s) => s.history.find((h) => h.id === id));
  const removeHistory = useMailStore((s) => s.removeHistory);
  const updateHistory = useMailStore((s) => s.updateHistory);
  const setGeneratedMail = useMailStore((s) => s.setGeneratedMail);
  const resetCreation = useMailStore((s) => s.resetCreation);

  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(item?.subject ?? '');
  const [editedBody, setEditedBody] = useState(item?.body ?? '');

  const handleShare = useCallback(async () => {
    if (!item) return;
    await Share.share({
      message: `${item.subject}\n\n${item.body}`,
    });
  }, [item]);

  const handleCopy = useCallback(async () => {
    if (!item) return;
    await Clipboard.setStringAsync(`${item.subject}\n\n${item.body}`);
    Alert.alert('コピー完了', 'メールの内容をクリップボードにコピーしました。');
  }, [item]);

  const handleReuse = useCallback(() => {
    if (!item) return;
    resetCreation();
    setGeneratedMail({
      id: `mail-${Date.now()}`,
      subject: item.subject,
      body: item.body,
      createdAt: new Date(),
    });
    router.push('/preview');
  }, [item, resetCreation, setGeneratedMail, router]);

  const handleDelete = useCallback(() => {
    if (!item) return;
    Alert.alert(
      '削除確認',
      'この履歴を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            removeHistory(item.id);
            router.back();
          },
        },
      ],
    );
  }, [item, removeHistory, router]);

  const handleStartEdit = useCallback(() => {
    if (!item) return;
    setEditedSubject(item.subject);
    setEditedBody(item.body);
    setIsEditing(true);
  }, [item]);

  const handleCancelEdit = useCallback(() => {
    if (!item) return;
    setEditedSubject(item.subject);
    setEditedBody(item.body);
    setIsEditing(false);
  }, [item]);

  const handleSaveEdit = useCallback(() => {
    if (!item) return;
    updateHistory(item.id, { subject: editedSubject, body: editedBody });
    setIsEditing(false);
  }, [item, editedSubject, editedBody, updateHistory]);

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
            <IconSymbol name="doc.fill" size={32} color={colors.icon} />
          </View>
          <ThemedText style={styles.emptyTitle}>
            メールが見つかりませんでした
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>戻る</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const statusConfig = STATUS_CONFIG[item.status];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meta card */}
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.color + '15' },
              ]}
            >
              <IconSymbol name={statusConfig.icon} size={12} color={statusConfig.color} />
              <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </ThemedText>
            </View>
            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatFullDate(item.createdAt)}
            </ThemedText>
          </View>

          {item.recipientName ? (
            <View style={[styles.recipientRow, { borderTopColor: colors.border }]}>
              <IconSymbol name="person.fill" size={14} color={colors.icon} />
              <ThemedText style={[styles.recipientText, { color: colors.textSecondary }]}>
                {item.recipientName}
                {item.recipientEmail ? ` (${item.recipientEmail})` : ''}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* Subject */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            件名
          </ThemedText>
          <View
            style={[
              styles.fieldBox,
              {
                backgroundColor: colors.surface,
                borderColor: isEditing ? colors.tint : colors.border,
              },
            ]}
          >
            {isEditing ? (
              <TextInput
                style={[styles.subjectInput, { color: colors.text }]}
                value={editedSubject}
                onChangeText={setEditedSubject}
                placeholder="件名を入力"
                placeholderTextColor={colors.icon}
                maxLength={200}
              />
            ) : (
              <ThemedText style={styles.subjectText}>{item.subject}</ThemedText>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={styles.fieldGroup}>
          <ThemedText style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            本文
          </ThemedText>
          <View
            style={[
              styles.fieldBox,
              {
                backgroundColor: colors.surface,
                borderColor: isEditing ? colors.tint : colors.border,
              },
            ]}
          >
            {isEditing ? (
              <TextInput
                style={[styles.bodyInput, { color: colors.text }]}
                value={editedBody}
                onChangeText={setEditedBody}
                placeholder="本文を入力"
                placeholderTextColor={colors.icon}
                multiline
                textAlignVertical="top"
                maxLength={5000}
              />
            ) : (
              <ThemedText style={styles.bodyText}>{item.body}</ThemedText>
            )}
          </View>
        </View>

        {/* Sent date */}
        {item.sentAt ? (
          <View style={[styles.sentInfo, { backgroundColor: colors.success + '10' }]}>
            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
            <ThemedText style={[styles.sentText, { color: colors.success }]}>
              送信日時: {formatFullDate(item.sentAt)}
            </ThemedText>
          </View>
        ) : null}

        {/* Quick actions (hidden during edit) */}
        {!isEditing && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <IconSymbol name="doc.on.doc.fill" size={18} color={colors.tint} />
              <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>
                コピー
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color={colors.tint} />
              <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>
                共有
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleStartEdit}
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={18} color={colors.tint} />
              <ThemedText style={[styles.quickActionText, { color: colors.tint }]}>
                編集
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            shadowColor: colorScheme === 'dark' ? '#000' : '#94A3B8',
          },
        ]}
      >
        {isEditing ? (
          <View style={styles.editBottomRow}>
            <TouchableOpacity
              style={[styles.editCancelButton, { borderColor: colors.border }]}
              onPress={handleCancelEdit}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.editCancelText, { color: colors.textSecondary }]}>
                キャンセル
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editSaveButton, { backgroundColor: colors.tint }]}
              onPress={handleSaveEdit}
              activeOpacity={0.7}
            >
              <IconSymbol name="checkmark" size={18} color="#fff" />
              <ThemedText style={styles.editSaveText}>保存</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.6}
            >
              <ThemedText style={[styles.deleteButtonText, { color: colors.danger }]}>
                履歴を削除
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reuseButton, { backgroundColor: colors.tint }]}
              onPress={handleReuse}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.counterclockwise" size={18} color="#fff" />
              <ThemedText style={styles.reuseButtonText}>このメールを再利用</ThemedText>
            </TouchableOpacity>
          </>
        )}
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
    padding: 24,
    paddingBottom: 20,
  },

  // Meta card
  metaCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  recipientText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  subjectInput: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    padding: 0,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 200,
    padding: 0,
  },

  // Sent info
  sentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  sentText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reuseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  reuseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Edit mode bottom
  editBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  editSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
