import React from "react";
import { COLORS } from "../styles/theme";

type GlassCardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        background: COLORS.glassBg,
        borderRadius: 28,
        border: `1px solid ${COLORS.glassBorder}`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        padding: 48,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
