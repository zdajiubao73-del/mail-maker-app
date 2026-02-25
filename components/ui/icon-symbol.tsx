// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { type OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation / Tabs
  'house.fill': 'home',
  'clock.fill': 'history',
  'person.2.fill': 'people',
  'gearshape.fill': 'settings',

  // Home screen action cards
  'paperplane.fill': 'send',
  'slider.horizontal.3': 'tune',
  'doc.text.fill': 'description',

  // General UI
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',

  // Settings icons
  'person.fill': 'person',
  'envelope.fill': 'email',
  'creditcard.fill': 'credit-card',
  'tray.full.fill': 'inbox',
  'brain.head.profile': 'psychology',
  'lock.shield.fill': 'shield',
  'info.circle.fill': 'info',

  // Account / Login icons
  'envelope.badge.fill': 'mail',
  'plus.circle.fill': 'add-circle',
  'rectangle.portrait.and.arrow.right': 'logout',
  'person.crop.circle.fill': 'account-circle',
  'play.fill': 'play-arrow',

  // Tips / misc
  'lightbulb.fill': 'lightbulb',
  'clock.arrow.circlepath': 'restore',

  // Paywall icons
  'star.fill': 'star',
  'checkmark.circle.fill': 'check-circle',

  // Misc
  'xmark': 'close',
  'arrow.triangle.2.circlepath': 'sync',

  // History detail
  'doc.fill': 'description',
  'doc.on.doc.fill': 'content-copy',
  'square.and.arrow.up': 'share',
  'pencil': 'edit',
  'checkmark': 'check',
  'arrow.counterclockwise': 'refresh',

  // Contacts
  'arrow.down.circle': 'download',
  'exclamationmark.triangle': 'warning',
  'magnifyingglass': 'search',

  // Settings / Plan
  'checkmark.seal.fill': 'verified',
  'gift.fill': 'card-giftcard',
  'trash.fill': 'delete',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name];
  return <MaterialIcons color={color} size={size} name={mappedName ?? 'help-outline'} style={style} />;
}
