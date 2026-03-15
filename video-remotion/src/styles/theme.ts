export const COLORS = {
  bgDeep: "#06060F",
  bgDark: "#0F172A",
  surface: "#1E293B",

  primary: "#4F46E5",
  primaryLight: "#6366F1",
  primaryDark: "#3730A3",

  accentEasy: "#0EA5E9",
  accentDetailed: "#8B5CF6",
  accentTemplate: "#F59E0B",

  success: "#10B981",
  danger: "#EF4444",

  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textMuted: "rgba(255, 255, 255, 0.4)",

  glassBg: "rgba(30, 28, 60, 0.65)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
} as const;

export const GRADIENTS = {
  purple:
    "linear-gradient(135deg, #a78bfa 0%, #c084fc 40%, #f472b6 100%)",
  blue: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
  green:
    "linear-gradient(135deg, #34d399 0%, #2dd4bf 50%, #38bdf8 100%)",
  primary:
    "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)",
} as const;

export const DIMENSIONS = {
  width: 1080,
  height: 1920,
  fps: 30,
  totalFrames: 900,
} as const;
