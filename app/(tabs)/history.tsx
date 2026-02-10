import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMailStore } from '@/store/use-mail-store';
import type { MailHistoryItem } from '@/types';

const STATUS_CONFIG = {
  draft: { label: '下書き', color: '#8E8E93' },
  generated: { label: '生成済み', color: '#007AFF' },
  sent: { label: '送信済み', color: '#34C759' },
} as const;

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function HistoryItem({
  item,
  cardBackground,
}: {
  item: MailHistoryItem;
  cardBackground: string;
}) {
  const statusConfig = STATUS_CONFIG[item.status];

  return (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: cardBackground }]}
      activeOpacity={0.7}
    >
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
            { backgroundColor: statusConfig.color + '20' },
          ]}
        >
          <ThemedText
            style={[styles.statusText, { color: statusConfig.color }]}
          >
            {statusConfig.label}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.recipientName} numberOfLines={1}>
        宛先: {item.recipientName}
      </ThemedText>
      <ThemedText style={styles.dateText}>
        {formatDate(item.createdAt)}
      </ThemedText>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyIcon}>📭</ThemedText>
      <ThemedText style={styles.emptyText}>
        まだメール履歴がありません
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        メールを作成すると、ここに履歴が表示されます
      </ThemedText>
    </View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const history = useMailStore((s) => s.history);

  const cardBackground = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">履歴</ThemedText>
        </View>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem item={item} cardBackground={cardBackground} />
          )}
          contentContainerStyle={[
            styles.listContent,
            history.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipientName: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
