import { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresetStore } from '@/store/use-preset-store';
import { useMailStore } from '@/store/use-mail-store';
import type { Preset } from '@/types/preset';
import type { PurposeCategory, Relationship, Scope, PositionLevel } from '@/types';

const PURPOSE_CATEGORIES: PurposeCategory[] = [
  'ビジネス',
  '就職・転職',
  '学校・学術',
  'プライベート',
];

const RELATIONSHIPS: Relationship[] = [
  '上司', '同僚', '部下', '取引先', '顧客', '教授', '先輩', '友人', '家族', '初対面',
];

const SCOPES: Scope[] = ['社内', '社外', '個人間'];

const POSITION_LEVELS: PositionLevel[] = ['経営層', '管理職', '一般社員', '学生', 'その他'];

function PresetItem({
  preset,
  colors,
  onPress,
  onLongPress,
}: {
  preset: Preset;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  onLongPress: () => void;
}) {
  const tags = [
    preset.relationship,
    preset.purposeCategory,
    preset.situation,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      style={[styles.presetItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.6}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.presetItemContent}>
        <ThemedText type="defaultSemiBold" style={styles.presetName}>
          {preset.name}
        </ThemedText>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((tag, i) => (
              <View
                key={i}
                style={[styles.tag, { backgroundColor: colors.tint + '12' }]}
              >
                <ThemedText style={[styles.tagText, { color: colors.tint }]}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
        {(preset.recipientName || preset.recipientEmail) && (
          <ThemedText style={[styles.presetSubtext, { color: colors.textSecondary }]} numberOfLines={1}>
            {preset.recipientName}{preset.recipientEmail ? ` (${preset.recipientEmail})` : ''}
          </ThemedText>
        )}
      </View>
      <IconSymbol name="chevron.right" size={14} color={colors.icon} />
    </TouchableOpacity>
  );
}

export default function PresetsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const presets = usePresetStore((s) => s.presets);
  const addPreset = usePresetStore((s) => s.addPreset);
  const removePreset = usePresetStore((s) => s.removePreset);

  const { setMode, setRecipient, setPurposeCategory, setSituation, setTone, setRecipientInfo } = useMailStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState<Relationship>('同僚');
  const [newScope, setNewScope] = useState<Scope>('社内');
  const [newPositionLevel, setNewPositionLevel] = useState<PositionLevel>('一般社員');
  const [newCategory, setNewCategory] = useState<PurposeCategory>('ビジネス');

  const handleApplyPreset = useCallback((preset: Preset) => {
    setMode('detailed');
    if (preset.relationship && preset.scope && preset.positionLevel) {
      setRecipient({
        relationship: preset.relationship,
        scope: preset.scope,
        positionLevel: preset.positionLevel,
      });
    }
    if (preset.purposeCategory) {
      setPurposeCategory(preset.purposeCategory);
    }
    if (preset.situation) {
      setSituation(preset.situation);
    }
    if (preset.tone) {
      setTone(preset.tone);
    }
    setRecipientInfo(preset.recipientName ?? '', preset.recipientEmail ?? '');
    router.push('/create/detailed');
  }, [setMode, setRecipient, setPurposeCategory, setSituation, setTone, setRecipientInfo, router]);

  const handleDeletePreset = useCallback((preset: Preset) => {
    Alert.alert(
      'プリセットの削除',
      `「${preset.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removePreset(preset.id),
        },
      ],
    );
  }, [removePreset]);

  const handleAddPreset = useCallback(() => {
    if (!newName.trim()) {
      Alert.alert('入力エラー', 'プリセット名を入力してください');
      return;
    }

    addPreset({
      id: `preset-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      scope: newScope,
      positionLevel: newPositionLevel,
      purposeCategory: newCategory,
      createdAt: new Date(),
    });

    setNewName('');
    setNewRelationship('同僚');
    setNewScope('社内');
    setNewPositionLevel('一般社員');
    setNewCategory('ビジネス');
    setIsModalVisible(false);
  }, [newName, newRelationship, newScope, newPositionLevel, newCategory, addPreset]);

  function renderChipGroup<T extends string>(
    items: T[],
    selected: T,
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
                : { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 },
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

  return (
    <ThemedView style={styles.container}>
      {/* Header action */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
          <ThemedText style={styles.addButtonText}>新規作成</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={presets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PresetItem
            preset={item}
            colors={colors}
            onPress={() => handleApplyPreset(item)}
            onLongPress={() => handleDeletePreset(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          presets.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '12' }]}>
              <IconSymbol name="slider.horizontal.3" size={40} color={colors.tint} />
            </View>
            <ThemedText style={styles.emptyText}>
              プリセットがありません
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              よく使うメール設定をプリセットとして保存すると{'\n'}ワンタップでメール作成を開始できます
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Preset Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <ThemedText style={[styles.modalCancel, { color: colors.tint }]}>
                  キャンセル
                </ThemedText>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                プリセット作成
              </ThemedText>
              <TouchableOpacity onPress={handleAddPreset}>
                <ThemedText style={[styles.modalSave, { color: colors.tint }]}>
                  保存
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>プリセット名</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      color: colors.text,
                    },
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="例: 上司への報告メール"
                  placeholderTextColor={colors.icon}
                  maxLength={50}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>関係性</ThemedText>
                {renderChipGroup(RELATIONSHIPS, newRelationship, setNewRelationship)}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>範囲</ThemedText>
                {renderChipGroup(SCOPES, newScope, setNewScope)}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>役職レベル</ThemedText>
                {renderChipGroup(POSITION_LEVELS, newPositionLevel, setNewPositionLevel)}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>カテゴリ</ThemedText>
                {renderChipGroup(PURPOSE_CATEGORIES, newCategory, setNewCategory)}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 10,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetItemContent: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    gap: 22,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
