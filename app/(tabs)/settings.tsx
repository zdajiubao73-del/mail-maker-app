import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SettingsItem = {
  label: string;
  icon: string;
  route?: string;
  disabled?: boolean;
  badge?: string;
  value?: string;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'アカウント',
    items: [
      {
        label: 'マイアカウント',
        icon: 'person.fill',
        route: '/settings/account',
      },
      {
        label: 'メール連携',
        icon: 'envelope.fill',
        route: '/settings/account',
      },
    ],
  },
  {
    title: 'サブスクリプション',
    items: [
      {
        label: 'プラン・課金',
        icon: 'creditcard.fill',
        route: '/settings/plan',
      },
    ],
  },
  {
    title: 'データ管理',
    items: [
      {
        label: 'プリセット管理',
        icon: 'tray.full.fill',
        disabled: true,
        badge: '準備中',
      },
      {
        label: '学習データ管理',
        icon: 'brain.head.profile',
        disabled: true,
        badge: '準備中',
      },
    ],
  },
  {
    title: 'その他',
    items: [
      {
        label: 'プライバシーポリシー',
        icon: 'lock.shield.fill',
        route: '/settings/privacy',
      },
      {
        label: 'バージョン',
        icon: 'info.circle.fill',
        value: '1.0.0',
      },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardBackground = colorScheme === 'dark' ? '#1E2022' : '#FFFFFF';
  const separatorColor = colorScheme === 'dark' ? '#38383A' : '#E5E5EA';

  const handlePress = (item: SettingsItem) => {
    if (item.disabled || !item.route) return;
    router.push(item.route as never);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title">設定</ThemedText>
          </View>

          {SETTINGS_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.icon }]}>
                {section.title}
              </ThemedText>
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: cardBackground },
                ]}
              >
                {section.items.map((item, index) => (
                  <View key={item.label}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: separatorColor },
                        ]}
                      />
                    )}
                    <TouchableOpacity
                      style={[
                        styles.settingsRow,
                        item.disabled && styles.settingsRowDisabled,
                      ]}
                      activeOpacity={item.disabled ? 1 : 0.6}
                      onPress={() => handlePress(item)}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: item.disabled
                              ? colors.icon + '20'
                              : colors.tint + '15',
                          },
                        ]}
                      >
                        <IconSymbol
                          name={item.icon as never}
                          size={18}
                          color={item.disabled ? colors.icon : colors.tint}
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.settingsLabel,
                          item.disabled && { opacity: 0.5 },
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                      <View style={styles.settingsRowRight}>
                        {item.badge && (
                          <View style={styles.comingSoonBadge}>
                            <ThemedText style={styles.comingSoonText}>
                              {item.badge}
                            </ThemedText>
                          </View>
                        )}
                        {item.value && (
                          <ThemedText
                            style={[
                              styles.valueText,
                              { color: colors.icon },
                            ]}
                          >
                            {item.value}
                          </ThemedText>
                        )}
                        {item.route && !item.disabled && (
                          <IconSymbol
                            name="chevron.right"
                            size={14}
                            color={colors.icon}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowDisabled: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  comingSoonBadge: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  valueText: {
    fontSize: 15,
  },
});
