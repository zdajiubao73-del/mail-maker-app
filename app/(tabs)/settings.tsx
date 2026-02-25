import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Linking,
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
import { useContentMaxWidth } from '@/hooks/use-responsive';

type SettingsItem = {
  label: string;
  icon: string;
  iconBg: string;
  route?: string;
  externalUrl?: string;
  disabled?: boolean;
  badge?: string;
  value?: string;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const contentMaxWidth = useContentMaxWidth();

  const settingsSections: SettingsSection[] = useMemo(() => [
    {
      title: 'アカウント',
      items: [
        {
          label: 'メール連携',
          icon: 'envelope.fill',
          iconBg: '#0EA5E9',
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
          iconBg: '#F59E0B',
          route: '/settings/plan',
        },
      ],
    },
    {
      title: 'データ管理',
      items: [
        {
          label: 'よく使う文章',
          icon: 'tray.full.fill',
          iconBg: '#8B5CF6',
          route: '/settings/presets',
        },
        {
          label: '学習データ管理',
          icon: 'brain.head.profile',
          iconBg: '#EC4899',
          route: '/settings/learning-data',
        },
      ],
    },
    {
      title: 'その他',
      items: [
        {
          label: 'お問い合わせ',
          icon: 'envelope.fill',
          iconBg: '#3B82F6',
          externalUrl: 'mailto:apuriyong500@gmail.com',
        },
        {
          label: '利用規約',
          icon: 'doc.text.fill',
          iconBg: '#6366F1',
          route: '/settings/terms',
        },
        {
          label: 'プライバシーポリシー',
          icon: 'lock.shield.fill',
          iconBg: '#10B981',
          route: '/settings/privacy',
        },
        {
          label: 'バージョン',
          icon: 'info.circle.fill',
          iconBg: '#94A3B8',
          value: '1.0.0',
        },
      ],
    },
  ], []);

  const handlePress = (item: SettingsItem) => {
    if (item.disabled) return;
    if (item.externalUrl) {
      Linking.openURL(item.externalUrl);
      return;
    }
    if (!item.route) return;
    router.push(item.route as never);
  };

  return (
    <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentMaxWidth ? { maxWidth: contentMaxWidth + 48, alignSelf: 'center' as const, width: '100%' as const } : undefined,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {settingsSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </ThemedText>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {section.items.map((item, index) => (
                  <View key={item.label}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                    <TouchableOpacity
                      style={[
                        styles.settingsRow,
                        item.disabled && styles.settingsRowDisabled,
                      ]}
                      activeOpacity={item.disabled ? 1 : 0.5}
                      onPress={() => handlePress(item)}
                      accessibilityRole="button"
                      accessibilityLabel={item.value ? `${item.label}: ${item.value}` : item.label}
                      accessibilityState={{ disabled: item.disabled }}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: item.disabled
                              ? colors.surfaceSecondary
                              : item.iconBg,
                          },
                        ]}
                      >
                        <IconSymbol
                          name={item.icon as never}
                          size={16}
                          color={item.disabled ? colors.icon : '#FFFFFF'}
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
                          <View style={[styles.comingSoonBadge, { backgroundColor: colors.warning + '18' }]}>
                            <ThemedText style={[styles.comingSoonText, { color: colors.warning }]}>
                              {item.badge}
                            </ThemedText>
                          </View>
                        )}
                        {item.value && (
                          <ThemedText
                            style={[
                              styles.valueText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {item.value}
                          </ThemedText>
                        )}
                        {(item.route || item.externalUrl) && !item.disabled && (
                          <IconSymbol
                            name="chevron.right"
                            size={13}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
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
    marginRight: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
