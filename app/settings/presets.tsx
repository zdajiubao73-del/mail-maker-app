import { useCallback } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePresetStore } from '@/store/use-preset-store';
import { useMailStore } from '@/store/use-mail-store';
import type { Preset } from '@/types/preset';

const PRESET_STEPS = [
  { icon: 'paperplane.fill' as const, text: 'メールを作成する' },
  { icon: 'eye.fill' as const, text: 'プレビュー画面で内容を確認' },
  { icon: 'tray.full.fill' as const, text: '「保存」で文章を保存' },
  { icon: 'bolt.fill' as const, text: '次回からワンタップで呼び出し' },
];

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
    preset.relationship ?? null,
    preset.purposeCategory ?? null,
    preset.situation,
  ].filter(Boolean) as string[];

  const hasContent = !!(preset.subject || preset.body);

  return (
    <TouchableOpacity
      style={[styles.presetItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.6}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.presetItemContent}>
        <View style={styles.presetNameRow}>
          <ThemedText type="defaultSemiBold" style={styles.presetName}>
            {preset.name}
          </ThemedText>
          {hasContent && (
            <View style={[styles.contentBadge, { backgroundColor: colors.success + '15' }]}>
              <ThemedText style={[styles.contentBadgeText, { color: colors.success }]}>
                文章あり
              </ThemedText>
            </View>
          )}
        </View>
        {preset.subject && (
          <ThemedText style={[styles.presetSubject, { color: colors.text }]} numberOfLines={1}>
            {preset.subject}
          </ThemedText>
        )}
        {preset.body && (
          <ThemedText style={[styles.presetBody, { color: colors.textSecondary }]} numberOfLines={2}>
            {preset.body}
          </ThemedText>
        )}
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
  const removePreset = usePresetStore((s) => s.removePreset);

  const { setMode, setRecipient, setPurposeCategory, setSituation, setTone, setRecipientInfo, setGeneratedMail } = useMailStore();

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

    // 保存された文章がある場合はプレビュー画面へ直接遷移
    if (preset.subject || preset.body) {
      setGeneratedMail({
        id: `preset-mail-${Date.now()}`,
        subject: preset.subject ?? '',
        body: preset.body ?? '',
        createdAt: new Date(),
      });
      router.push('/preview');
    } else {
      router.push('/create/detailed');
    }
  }, [setMode, setRecipient, setPurposeCategory, setSituation, setTone, setRecipientInfo, setGeneratedMail, router]);

  const handleDeletePreset = useCallback((preset: Preset) => {
    Alert.alert(
      'プリセットを削除',
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

  return (
    <ThemedView style={styles.container}>
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
              <IconSymbol name="tray.full.fill" size={40} color={colors.tint} />
            </View>
            <ThemedText style={styles.emptyText}>
              保存した文章がありません
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              よく使うメールを保存して、次回からワンタップで再利用できます
            </ThemedText>

            {/* How to save steps */}
            <View style={[styles.stepsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={[styles.stepsTitle, { color: colors.text }]}>
                保存する方法
              </ThemedText>
              {PRESET_STEPS.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.tint + '15' }]}>
                    <ThemedText style={[styles.stepNumberText, { color: colors.tint }]}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <IconSymbol name={step.icon} size={15} color={colors.icon} />
                  <ThemedText style={[styles.stepText, { color: colors.textSecondary }]}>
                    {step.text}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.tint }]}
              activeOpacity={0.8}
              onPress={() => router.push('/create/simple')}
            >
              <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
              <ThemedText style={styles.ctaButtonText}>メールを作成する</ThemedText>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  presetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  presetName: {
    fontSize: 16,
    flexShrink: 1,
  },
  contentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  contentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  presetSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetBody: {
    fontSize: 13,
    lineHeight: 19,
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
    paddingHorizontal: 32,
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
  stepsContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
    padding: 16,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
