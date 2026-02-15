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
import { STATUS_CONFIG, formatRelativeDate } from '@/constants/mail-status';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMailStore } from '@/store/use-mail-store';
import type { MailHistoryItem } from '@/types';

function HistoryItem({
  item,
  colors,
  onPress,
}: {
  item: MailHistoryItem;
  colors: (typeof Colors)['light'];
  onPress: () => void;
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
              {statusConfig.label}
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

function EmptyState({ colors }: { colors: (typeof Colors)['light'] }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <IconSymbol name="clock.fill" size={40} color={colors.icon} />
      </View>
      <ThemedText style={styles.emptyText}>
        まだメール履歴がありません
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        メールを作成すると、ここに履歴が表示されます
      </ThemedText>
    </View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const history = useMailStore((s) => s.history);
  const router = useRouter();

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
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={<EmptyState colors={colors} />}
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
    lineHeight: 20,
  },
});
