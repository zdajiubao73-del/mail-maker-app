import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 24;
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

type PageIndicatorProps = {
  pageCount: number;
  currentPage: number;
};

function Dot({ isActive, accentColor }: { isActive: boolean; accentColor: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? ACTIVE_WIDTH : DOT_SIZE, SPRING_CONFIG),
    backgroundColor: isActive ? accentColor : colors.border,
    opacity: withSpring(isActive ? 1 : 0.5, SPRING_CONFIG),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function PageIndicator({ pageCount, currentPage }: PageIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {Array.from({ length: pageCount }).map((_, i) => (
        <Dot key={i} isActive={i === currentPage} accentColor={colors.tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
