import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../styles/theme";

type BackgroundProps = {
  orbColor1?: string;
  orbColor2?: string;
};

export const Background: React.FC<BackgroundProps> = ({
  orbColor1 = COLORS.primaryLight,
  orbColor2 = "#F472B6",
}) => {
  const frame = useCurrentFrame();

  const orb1X = interpolate(frame, [0, 900], [65, 35], {
    extrapolateRight: "clamp",
  });
  const orb1Y = interpolate(frame, [0, 900], [20, 40], {
    extrapolateRight: "clamp",
  });
  const orb2X = interpolate(frame, [0, 900], [30, 60], {
    extrapolateRight: "clamp",
  });
  const orb2Y = interpolate(frame, [0, 900], [70, 55], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgDeep,
        overflow: "hidden",
      }}
    >
      {/* Orb 1 */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: orbColor1,
          filter: "blur(120px)",
          opacity: 0.25,
          left: `${orb1X}%`,
          top: `${orb1Y}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Orb 2 */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: orbColor2,
          filter: "blur(100px)",
          opacity: 0.2,
          left: `${orb2X}%`,
          top: `${orb2Y}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
