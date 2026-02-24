import { Dimensions, StyleSheet, View } from 'react-native';
import { SymbolViewProps } from 'expo-symbols';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingPageProps = {
  icon: SymbolViewProps['name'];
  title: string;
  description: string;
  accentColor: string;
};

export function OnboardingPage({
  icon,
  title,
  description,
  accentColor,
}: OnboardingPageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
          <IconSymbol name={icon} size={48} color={accentColor} />
        </View>

        <ThemedText style={styles.title}>{title}</ThemedText>

        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
