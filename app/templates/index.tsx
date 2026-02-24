import React, { useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTemplates, getTemplatesByCategory } from '@/lib/templates';
import { Colors } from '@/constants/theme';
import type { PurposeCategory, PromptTemplate } from '@/types';

const FILTER_OPTIONS: (PurposeCategory | 'すべて')[] = [
  'すべて',
  'ビジネス',
  '就職・転職',
  '学校・学術',
  'プライベート',
];

const CATEGORY_COLORS: Record<PurposeCategory, string> = {
  'ビジネス': '#2196F3',
  '就職・転職': '#4CAF50',
  '学校・学術': '#FF9800',
  'プライベート': '#E91E63',
  'その他': '#9E9E9E',
};

export default function TemplatesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedFilter, setSelectedFilter] = useState<PurposeCategory | 'すべて'>('すべて');

  const templates = useMemo(() => {
    if (selectedFilter === 'すべて') {
      return getTemplates();
    }
    return getTemplatesByCategory(selectedFilter);
  }, [selectedFilter]);

  const handleTemplatePress = useCallback(
    (template: PromptTemplate) => {
      router.push({ pathname: '/create/template', params: { id: template.id } });
    },
    [router],
  );

  const getFilterLabel = useCallback(
    (option: PurposeCategory | 'すべて') => {
      if (option === 'すべて') {
        return 'すべて';
      }
      return option;
    },
    [],
  );

  const renderTemplateCard = useCallback(
    ({ item }: { item: PromptTemplate }) => {
      const categoryColor = CATEGORY_COLORS[item.category];

      return (
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colorScheme === 'dark' ? '#1e2022' : '#fff',
              borderColor: colorScheme === 'dark' ? '#333' : '#e8e8e8',
            },
          ]}
          onPress={() => handleTemplatePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </ThemedText>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <ThemedText style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {item.category}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.cardSituation, { color: colors.icon }]}>
            {item.situation}
          </ThemedText>
          <ThemedText style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        </TouchableOpacity>
      );
    },
    [colorScheme, colors.icon, handleTemplatePress],
  );

  const keyExtractor = useCallback((item: PromptTemplate) => item.id, []);

  return (
    <ThemedView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterTab,
                selectedFilter === option
                  ? { backgroundColor: colors.tint }
                  : {
                      backgroundColor: colorScheme === 'dark' ? '#2a2d2f' : '#f0f0f0',
                      borderColor: colors.icon + '40',
                      borderWidth: 1,
                    },
              ]}
              onPress={() => setSelectedFilter(option)}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  selectedFilter === option
                    ? { color: '#fff' }
                    : { color: colors.text },
                ]}
              >
                {getFilterLabel(option)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Template List */}
      <FlatList
        data={templates}
        renderItem={renderTemplateCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              テンプレートがありません
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSituation: {
    fontSize: 13,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
  },
});
