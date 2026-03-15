import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { GradientText } from "../components/GradientText";
import { COLORS } from "../styles/theme";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // White flash attention grab
  const flashOpacity = interpolate(frame, [0, 12], [0.7, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Line 1: "ビジネスメール、"
  const line1Spring = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 14, stiffness: 120 },
  });
  const line1Y = interpolate(line1Spring, [0, 1], [50, 0]);
  const line1Opacity = line1Spring;

  // Line 2: "書けなくて"
  const line2Spring = spring({
    frame,
    fps,
    delay: 15,
    config: { damping: 14, stiffness: 120 },
  });
  const line2Y = interpolate(line2Spring, [0, 1], [50, 0]);
  const line2Opacity = line2Spring;

  // Line 3: "困ってない？"
  const line3Spring = spring({
    frame,
    fps,
    delay: 25,
    config: { damping: 14, stiffness: 120 },
  });
  const line3Y = interpolate(line3Spring, [0, 1], [50, 0]);
  const line3Opacity = line3Spring;

  // Emphasis pulse on "困ってない？"
  const pulseScale = interpolate(
    frame,
    [45, 55, 65],
    [1, 1.06, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Glow effect
  const glowOpacity = interpolate(frame, [50, 70], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit fade
  const exitOpacity = interpolate(frame, [70, 89], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background orbColor1="#6366F1" orbColor2="#F472B6" />

      {/* White flash */}
      <AbsoluteFill
        style={{
          backgroundColor: "white",
          opacity: flashOpacity,
        }}
      />

      {/* Text content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: exitOpacity,
          padding: 60,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: 68,
            fontWeight: 900,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textPrimary,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          ビジネスメール、
        </div>

        {/* Line 2 */}
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            fontSize: 68,
            fontWeight: 900,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textPrimary,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          書けなくて
        </div>

        {/* Line 3 - gradient + emphasis */}
        <div
          style={{
            opacity: line3Opacity,
            transform: `translateY(${line3Y}px) scale(${pulseScale})`,
            textAlign: "center",
            textShadow: `0 0 30px rgba(167,139,250,${glowOpacity})`,
          }}
        >
          <GradientText fontSize={78} fontWeight={900}>
            困ってない？
          </GradientText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
