import { Platform } from 'react-native';

// Brand colors — rich indigo as primary, warm accents for personality
const brand = {
  primary: '#4F46E5',       // Indigo-600 — main brand
  primaryLight: '#6366F1',  // Indigo-500 — lighter variant
  primaryDark: '#3730A3',   // Indigo-800 — darker variant
  primaryMuted: '#EEF2FF',  // Indigo-50  — subtle background
  accent1: '#0EA5E9',       // Sky-500    — かんたん作成
  accent2: '#8B5CF6',       // Violet-500 — こだわり作成
  accent3: '#F59E0B',       // Amber-500  — テンプレート
  success: '#10B981',       // Emerald-500
  warning: '#F59E0B',       // Amber-500
  danger: '#EF4444',        // Red-500
  info: '#3B82F6',          // Blue-500
};

export const Colors = {
  light: {
    text: '#0F172A',           // Slate-900
    textSecondary: '#64748B',  // Slate-500
    background: '#F8FAFC',     // Slate-50
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9', // Slate-100
    tint: brand.primary,
    tintLight: brand.primaryLight,
    icon: '#94A3B8',           // Slate-400
    tabIconDefault: '#94A3B8',
    tabIconSelected: brand.primary,
    border: '#E2E8F0',        // Slate-200
    borderLight: '#F1F5F9',   // Slate-100
    ...brand,
  },
  dark: {
    text: '#F1F5F9',           // Slate-100
    textSecondary: '#94A3B8',  // Slate-400
    background: '#0F172A',     // Slate-900
    surface: '#1E293B',        // Slate-800
    surfaceSecondary: '#334155', // Slate-700
    tint: '#818CF8',           // Indigo-400
    tintLight: '#A5B4FC',      // Indigo-300
    icon: '#64748B',           // Slate-500
    tabIconDefault: '#64748B',
    tabIconSelected: '#818CF8',
    border: '#334155',         // Slate-700
    borderLight: '#1E293B',    // Slate-800
    ...brand,
    primary: '#818CF8',        // Indigo-400 for dark mode
    primaryLight: '#A5B4FC',
    primaryMuted: '#1E1B4B',   // Indigo-950
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
