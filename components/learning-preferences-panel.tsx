import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLearningStore } from '@/store/use-learning-store';

type FieldKey = 'openingText' | 'writingStyleNotes' | 'signature';

type FieldConfig = {
  key: FieldKey;
  enabledKey: 'openingTextEnabled' | 'writingStyleEnabled' | 'signatureEnabled';
  icon: 'play-arrow' | 'edit' | 'badge';
  label: string;
  hint: string;
  placeholder: string;
  maxLength: number;
  numberOfLines: number;
};

const FIELDS: FieldConfig[] = [
  {
    key: 'openingText',
    enabledKey: 'openingTextEnabled',
    icon: 'play-arrow',
    label: '文頭に入れる文章',
    hint: 'メール本文の最初に必ず入れたい文章',
    placeholder: '例: お世話になっております。○○部の田中です。',
    maxLength: 300,
    numberOfLines: 3,
  },
  {
    key: 'writingStyleNotes',
    enabledKey: 'writingStyleEnabled',
    icon: 'edit',
    label: '文体の指示',
    hint: 'AIに対する文体・口調の指示',
    placeholder: '例: 丁寧だが簡潔に。箇条書きを多用してほしい。',
    maxLength: 500,
    numberOfLines: 3,
  },
  {
    key: 'signature',
    enabledKey: 'signatureEnabled',
    icon: 'badge',
    label: '署名',
    hint: 'メール末尾に挿入される署名',
    placeholder: '例:\n山田太郎\n〇〇株式会社',
    maxLength: 500,
    numberOfLines: 3,
  },
];

type LearningPreferencesPanelProps = {
  /** 折りたたみの初期状態（デフォルト: true = 折りたたみ） */
  initiallyCollapsed?: boolean;
};

export function LearningPreferencesPanel({
  initiallyCollapsed = true,
}: LearningPreferencesPanelProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const profile = useLearningStore((s) => s.profile);
  const updatePreferences = useLearningStore((s) => s.updatePreferences);

  const prefs = profile?.preferences;

  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [drafts, setDrafts] = useState({
    openingText: prefs?.openingText ?? '',
    writingStyleNotes: prefs?.writingStyleNotes ?? '',
    signature: prefs?.signature ?? '',
  });

  useEffect(() => {
    setDrafts({
      openingText: prefs?.openingText ?? '',
      writingStyleNotes: prefs?.writingStyleNotes ?? '',
      signature: prefs?.signature ?? '',
    });
  }, [prefs?.openingText, prefs?.writingStyleNotes, prefs?.signature]);

  const handleToggle = useCallback(
    (enabledKey: FieldConfig['enabledKey'], value: boolean) => {
      updatePreferences({ [enabledKey]: value });
    },
    [updatePreferences],
  );

  const handleChange = useCallback((key: FieldKey, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBlur = useCallback(
    (key: FieldKey) => {
      updatePreferences({ [key]: drafts[key] });
    },
    [drafts, updatePreferences],
  );

  const enabledCount = [
    prefs?.openingTextEnabled !== false && (drafts.openingText.trim().length > 0),
    prefs?.writingStyleEnabled !== false && (drafts.writingStyleNotes.trim().length > 0),
    prefs?.signatureEnabled !== false && (drafts.signature.trim().length > 0),
  ].filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => setCollapsed((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? '学習データの設定を開く' : '学習データの設定を閉じる'}
      >
        <View style={[styles.headerIcon, { backgroundColor: colors.tint + '15' }]}>
          <MaterialIcons name="psychology" size={18} color={colors.tint} />
        </View>
        <View style={styles.headerTextWrap}>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            学習データを反映
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {enabledCount > 0
              ? `${enabledCount}件の設定を生成に反映`
              : '反映する設定はありません'}
          </ThemedText>
        </View>
        <MaterialIcons
          name={collapsed ? 'expand-more' : 'expand-less'}
          size={22}
          color={colors.icon}
        />
      </Pressable>

      {!collapsed && (
        <View style={styles.body}>
          {FIELDS.map((field) => {
            const enabled = prefs?.[field.enabledKey] !== false;
            const value = drafts[field.key];

            return (
              <View key={field.key} style={[styles.fieldBlock, { borderColor: colors.border }]}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldHeaderLeft}>
                    <MaterialIcons name={field.icon} size={16} color={colors.tint} />
                    <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
                      {field.label}
                    </ThemedText>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={(v) => handleToggle(field.enabledKey, v)}
                    trackColor={{ false: colors.border, true: colors.tint + '70' }}
                    thumbColor={enabled ? colors.tint : colors.icon}
                  />
                </View>
                <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
                  {field.hint}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceSecondary,
                    },
                    !enabled && styles.inputDisabled,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.icon}
                  value={value}
                  onChangeText={(t) => handleChange(field.key, t)}
                  onBlur={() => handleBlur(field.key)}
                  multiline
                  numberOfLines={field.numberOfLines}
                  textAlignVertical="top"
                  maxLength={field.maxLength}
                  editable={enabled}
                />
              </View>
            );
          })}

          <Pressable
            onPress={() => router.push('/settings/learning-data' as never)}
            style={({ pressed }) => [
              styles.openSettingsRow,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
          >
            <MaterialIcons name="open-in-new" size={14} color={colors.tint} />
            <ThemedText style={[styles.openSettingsText, { color: colors.tint }]}>
              学習データ管理を開く
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 14,
  },
  fieldBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 70,
  },
  inputDisabled: {
    opacity: 0.4,
  },
  openSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    marginTop: 2,
  },
  openSettingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
