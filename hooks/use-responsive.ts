import { useWindowDimensions } from 'react-native';

/** Returns true when running on a tablet-sized screen (width >= 768) */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}

/** Returns responsive horizontal padding for the current screen width */
export function useResponsivePadding(): number {
  const { width } = useWindowDimensions();
  if (width >= 1024) return 80;
  if (width >= 768) return 48;
  return 24;
}

/** Returns a max content width suitable for the current screen (iPhone: full, iPad: capped) */
export function useContentMaxWidth(): number | undefined {
  const { width } = useWindowDimensions();
  if (width >= 768) return 600;
  return undefined;
}
