import React from "react";
import { GRADIENTS } from "../styles/theme";

type GradientTextProps = {
  children: React.ReactNode;
  gradient?: string;
  fontSize?: number;
  fontWeight?: number;
  style?: React.CSSProperties;
};

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  gradient = GRADIENTS.purple,
  fontSize = 72,
  fontWeight = 900,
  style,
}) => {
  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily: "'Noto Sans JP', sans-serif",
        background: gradient,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
