import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { GradientText } from "../components/GradientText";
import { COLORS, GRADIENTS } from "../styles/theme";

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // App icon re-entrance
  const iconSpring = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 10, stiffness: 100 },
  });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);

  // App name
  const nameSpring = spring({
    frame,
    fps,
    delay: 20,
    config: { damping: 14, stiffness: 100 },
  });
  const nameOpacity = nameSpring;
  const nameY = interpolate(nameSpring, [0, 1], [30, 0]);

  // Divider
  const dividerSpring = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const dividerWidth = interpolate(dividerSpring, [0, 1], [0, 240]);

  // Tagline line 1
  const tag1Spring = spring({
    frame,
    fps,
    delay: 45,
    config: { damping: 14, stiffness: 100 },
  });
  const tag1Y = interpolate(tag1Spring, [0, 1], [30, 0]);

  // Tagline line 2
  const tag2Spring = spring({
    frame,
    fps,
    delay: 55,
    config: { damping: 14, stiffness: 100 },
  });
  const tag2Y = interpolate(tag2Spring, [0, 1], [30, 0]);

  // CTA text
  const ctaSpring = spring({
    frame,
    fps,
    delay: 70,
    config: { damping: 14, stiffness: 100 },
  });
  const ctaOpacity = ctaSpring;
  const ctaY = interpolate(ctaSpring, [0, 1], [30, 0]);

  // CTA glow pulse
  const glowPulse = interpolate(
    frame % 30,
    [0, 15, 30],
    [0.3, 0.7, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Download button
  const btnSpring = spring({
    frame,
    fps,
    delay: 85,
    config: { damping: 12, stiffness: 100 },
  });
  const btnY = interpolate(btnSpring, [0, 1], [80, 0]);
  const btnOpacity = btnSpring;

  // Arrow bounce
  const arrowBounce = interpolate(
    frame % 20,
    [0, 10, 20],
    [0, -12, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // "無料" emphasis at end
  const freeGlow = interpolate(
    frame,
    [200, 210, 220, 230, 239],
    [0.4, 0.8, 0.4, 0.8, 0.4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill>
      <Background orbColor1={COLORS.primary} orbColor2={COLORS.accentDetailed} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* App icon */}
        <div
          style={{
            transform: `scale(${iconScale})`,
            borderRadius: 38,
            overflow: "hidden",
            width: 160,
            height: 160,
            boxShadow: "0 16px 48px rgba(99,102,241,0.4)",
          }}
        >
          <Img
            src={staticFile("icon.png")}
            style={{ width: 160, height: 160 }}
          />
        </div>

        {/* App name */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            marginTop: 16,
          }}
        >
          <GradientText fontSize={64} fontWeight={900}>
            メールメーカー
          </GradientText>
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            marginTop: 16,
            marginBottom: 16,
          }}
        />

        {/* Tagline line 1 */}
        <div
          style={{
            opacity: tag1Spring,
            transform: `translateY(${tag1Y}px)`,
            fontSize: 40,
            fontWeight: 700,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textPrimary,
            textAlign: "center",
          }}
        >
          もう敬語メールで
        </div>

        {/* Tagline line 2 */}
        <div
          style={{
            opacity: tag2Spring,
            transform: `translateY(${tag2Y}px)`,
          }}
        >
          <GradientText fontSize={52} fontWeight={900}>
            悩まない。
          </GradientText>
        </div>

        {/* CTA text */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            fontSize: 36,
            fontWeight: 700,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textPrimary,
            textShadow: `0 0 30px rgba(99,102,241,${glowPulse})`,
            marginTop: 40,
          }}
        >
          今すぐ
          <span
            style={{
              textShadow: `0 0 20px rgba(99,102,241,${freeGlow})`,
            }}
          >
            無料
          </span>
          ダウンロード
        </div>

        {/* Arrow indicator */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `translateY(${arrowBounce}px)`,
            fontSize: 36,
            color: COLORS.primaryLight,
            marginTop: 16,
          }}
        >
          ↓
        </div>

        {/* Download button */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `translateY(${btnY}px)`,
            background: GRADIENTS.primary,
            borderRadius: 20,
            padding: "20px 56px",
            fontSize: 32,
            fontWeight: 800,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textPrimary,
            boxShadow: `0 8px 32px rgba(79,70,229,${0.3 + glowPulse * 0.3})`,
            marginTop: 8,
          }}
        >
          App Store で入手
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
