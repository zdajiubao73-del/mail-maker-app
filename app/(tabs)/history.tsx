import {
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
import { STATUS_CONFIG } from '@/constants/mail-status';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMailStore } from '@/store/use-mail-store';
import { useContentMaxWidth } from '@/hooks/use-responsive';
import type { MailHistoryItem } from '@/types';

const EMPTY_STEPS = [
  { icon: 'paperplane.fill' as const, text: 'ホーム画面からメールを作成' },
  { icon: 'doc.text.fill' as const, text: 'AIが自動で文章を生成' },
  { icon: 'clock.fill' as const, text: '作成・送信した履歴がここに表示' },
];

function formatRelativeDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'sent': return '送信済み';
    case 'draft': return '下書き';
    default: return '生成済み';
  }
}

function HistoryItem({
  item,
  colors,
  onPress,
  formatRelativeDate,
  statusLabel,
}: {
  item: MailHistoryItem;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  formatRelativeDate: (date: Date) => string;
  statusLabel: string;
}) {
  const statusConfig = STATUS_CONFIG[item.status];

  return (
    <TouchableOpacity
      style={[
        styles.historyItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      {/* Left accent */}
      <View style={[styles.accentBar, { backgroundColor: statusConfig.color }]} />

      <View style={styles.itemContent}>
        {/* Header row */}
        <View style={styles.historyItemHeader}>
          <ThemedText
            type="defaultSemiBold"
            style={styles.subject}
            numberOfLines={1}
          >
            {item.subject}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + '15' },
            ]}
          >
            <IconSymbol
              name={statusConfig.icon}
              size={11}
              color={statusConfig.color}
            />
            <ThemedText
              style={[styles.statusText, { color: statusConfig.color }]}
            >
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        {/* Body preview */}
        <ThemedText
          style={[styles.bodyPreview, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.body}
        </ThemedText>

        {/* Footer */}
        <View style={styles.itemFooter}>
          <ThemedText style={[styles.recipientName, { color: colors.icon }]}>
            {item.recipientName}
          </ThemedText>
          <ThemedText style={[styles.dateText, { color: colors.icon }]}>
            {formatRelativeDate(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ colors, onCreatePress }: { colors: (typeof Colors)['light']; onCreatePress: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <IconSymbol name="clock.fill" size={40} color={colors.icon} />
      </View>
      <ThemedText style={styles.emptyText}>
        {'履歴がありません'}
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        {'作成・送信したメールの履歴がここに表示されます'}
      </ThemedText>

      {/* Steps */}
      <View style={[styles.stepsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {EMPTY_STEPS.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.tint + '15' }]}>
              <ThemedText style={[styles.stepNumberText, { color: colors.tint }]}>
                {index + 1}
              </ThemedText>
            </View>
            <IconSymbol name={step.icon} size={16} color={colors.icon} />
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
        onPress={onCreatePress}
      >
        <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
        <ThemedText style={styles.ctaButtonText}>メールを作成する</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const history = useMailStore((s) => s.history);
  const router = useRouter();
  const contentMaxWidth = useContentMaxWidth();

  return (
    <ThemedView style={styles.container}>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem
              item={item}
              colors={colors}
              onPress={() => router.push({ pathname: '/history/detail', params: { id: item.id } })}
              formatRelativeDate={formatRelativeDate}
              statusLabel={getStatusLabel(item.status)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.listContentEmpty,
            contentMaxWidth ? { maxWidth: contentMaxWidth + 48, alignSelf: 'center' as const, width: '100%' as const } : undefined,
          ]}
          ListEmptyComponent={<EmptyState colors={colors} onCreatePress={() => router.push('/create/simple')} />}
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
  historyItem: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  itemContent: {
    flex: 1,
    padding: 16,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bodyPreview: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientName: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
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
    lineHeight: 20,
  },
  stepsContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
    padding: 16,
    gap: 14,
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
