import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../styles/theme";

type TypewriterTextProps = {
  text: string;
  charFrames?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  showCursor?: boolean;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  charFrames = 2,
  fontSize = 44,
  fontWeight = 700,
  color = COLORS.textPrimary,
  showCursor = true,
}) => {
  const frame = useCurrentFrame();

  const typedChars = Math.min(text.length, Math.floor(frame / charFrames));
  const displayText = text.slice(0, typedChars);

  const cursorOpacity = interpolate(
    frame % 16,
    [0, 8, 16],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily: "'Noto Sans JP', sans-serif",
        color,
        lineHeight: 1.5,
      }}
    >
      {displayText}
      {showCursor && (
        <span style={{ opacity: cursorOpacity, color: COLORS.primaryLight }}>
          {"\u258C"}
        </span>
      )}
    </span>
  );
};
