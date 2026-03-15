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

export const Scene3SolutionReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Light burst
  const burstOpacity = interpolate(frame, [0, 10, 25], [0, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const burstScale = interpolate(frame, [0, 25], [0.8, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // App icon
  const iconSpring = spring({
    frame,
    fps,
    delay: 10,
    config: { damping: 12, stiffness: 100 },
  });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);

  // Shine sweep across icon
  const shineX = interpolate(frame, [40, 60], [-200, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // App name
  const nameSpring = spring({
    frame,
    fps,
    delay: 25,
    config: { damping: 14, stiffness: 100 },
  });
  const nameY = interpolate(nameSpring, [0, 1], [40, 0]);
  const nameOpacity = nameSpring;

  // Tagline
  const tagSpring = spring({
    frame,
    fps,
    delay: 40,
    config: { damping: 14, stiffness: 100 },
  });
  const tagY = interpolate(tagSpring, [0, 1], [30, 0]);
  const tagOpacity = tagSpring;

  // Sparkle ring rotation
  const sparkleRotation = interpolate(frame, [35, 120], [0, 360], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const sparkleOpacity = interpolate(frame, [35, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [100, 119], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(frame, [100, 119], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background orbColor1={COLORS.primary} orbColor2={COLORS.accentDetailed} />

      {/* Light burst */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 60%)",
          opacity: burstOpacity,
          transform: `scale(${burstScale})`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Sparkle ring */}
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            transform: `rotate(${sparkleRotation}deg)`,
            opacity: sparkleOpacity,
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <div
              key={angle}
              style={{
                position: "absolute",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: GRADIENTS.purple,
                left: `${50 + 50 * Math.cos((angle * Math.PI) / 180)}%`,
                top: `${50 + 50 * Math.sin((angle * Math.PI) / 180)}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 12px rgba(167,139,250,0.6)",
              }}
            />
          ))}
        </div>

        {/* App icon */}
        <div
          style={{
            position: "relative",
            transform: `scale(${iconScale})`,
            overflow: "hidden",
            borderRadius: 44,
            width: 200,
            height: 200,
            boxShadow: "0 20px 60px rgba(99,102,241,0.4)",
          }}
        >
          <Img
            src={staticFile("icon.png")}
            style={{ width: 200, height: 200 }}
          />
          {/* Shine sweep */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 200,
              height: 200,
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
              transform: `translateX(${shineX}px)`,
            }}
          />
        </div>

        {/* App name */}
        <div
          style={{
            transform: `translateY(${nameY}px)`,
            opacity: nameOpacity,
            marginTop: 20,
          }}
        >
          <GradientText fontSize={80} fontWeight={900} gradient={GRADIENTS.purple}>
            メールメーカー
          </GradientText>
        </div>

        {/* Tagline */}
        <div
          style={{
            transform: `translateY(${tagY}px)`,
            opacity: tagOpacity,
            fontSize: 36,
            fontWeight: 600,
            fontFamily: "'Noto Sans JP', sans-serif",
            color: COLORS.textSecondary,
          }}
        >
          AIがメールを自動作成
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
