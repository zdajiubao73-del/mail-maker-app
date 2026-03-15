import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { GlassCard } from "../components/GlassCard";
import { COLORS } from "../styles/theme";

type PainCardProps = {
  emoji: string;
  text: string;
  accentColor: string;
};

const PainCard: React.FC<PainCardProps> = ({ emoji, text, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });
  const slideX = interpolate(enterSpring, [0, 1], [800, 0]);
  const cardOpacity = enterSpring;

  // Emoji bounce
  const emojiSpring = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 8, stiffness: 150 },
  });
  const emojiScale = interpolate(emojiSpring, [0, 1], [0, 1]);
  const emojiRotation = interpolate(emojiSpring, [0, 1], [-30, 0]);

  // Typewriter text
  const charFrames = 2;
  const typedChars = Math.min(
    text.length,
    Math.max(0, Math.floor((frame - 8) / charFrames)),
  );
  const displayText = text.slice(0, typedChars);

  // Trailing dots pulse
  const dotsOpacity = interpolate(
    frame % 20,
    [0, 10, 20],
    [0.4, 1, 0.4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Exit
  const exitOpacity = interpolate(frame, [38, 50], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitX = interpolate(frame, [38, 50], [0, -600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 50,
        opacity: exitOpacity,
      }}
    >
      <div style={{ transform: `translateX(${slideX + exitX}px)`, opacity: cardOpacity }}>
        <GlassCard
          style={{
            width: 900,
            borderLeft: `4px solid ${accentColor}`,
          }}
        >
          {/* Emoji */}
          <div
            style={{
              fontSize: 72,
              marginBottom: 24,
              transform: `scale(${emojiScale}) rotate(${emojiRotation}deg)`,
              display: "inline-block",
            }}
          >
            {emoji}
          </div>

          {/* Text */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              fontFamily: "'Noto Sans JP', sans-serif",
              color: COLORS.textPrimary,
              lineHeight: 1.6,
            }}
          >
            {displayText}
            {displayText.endsWith("...") && (
              <span style={{ opacity: dotsOpacity }}>
                {"　"}
              </span>
            )}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

const painPoints = [
  {
    emoji: "😰",
    text: "就活のお礼メール、\n何て書けば...",
    accent: "#0EA5E9",
    orbColor: "#38BDF8",
  },
  {
    emoji: "😓",
    text: "上司への報告メール、\n敬語が不安...",
    accent: "#8B5CF6",
    orbColor: "#A78BFA",
  },
  {
    emoji: "😥",
    text: "取引先へのお詫び、\n失礼ないかな...",
    accent: "#F59E0B",
    orbColor: "#FBBF24",
  },
];

export const Scene2PainPoints: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background orbColor1="#6366F1" orbColor2="#F472B6" />

      {painPoints.map((point, index) => (
        <Sequence
          key={index}
          from={index * 50}
          durationInFrames={50}
          premountFor={10}
        >
          <PainCard
            emoji={point.emoji}
            text={point.text}
            accentColor={point.accent}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
