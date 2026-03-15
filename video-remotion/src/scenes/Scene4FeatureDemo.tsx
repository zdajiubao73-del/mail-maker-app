import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { GradientText } from "../components/GradientText";
import { PhoneMockup } from "../components/PhoneMockup";
import { COLORS } from "../styles/theme";

type FeatureSlideProps = {
  screenshotPath: string;
  headline: string;
  badge: string;
  accentColor: string;
};

const FeatureSlide: React.FC<FeatureSlideProps> = ({
  screenshotPath,
  headline,
  badge,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance
  const phoneSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const phoneX = interpolate(phoneSpring, [0, 1], [600, 0]);
  const phoneOpacity = phoneSpring;

  // Badge entrance
  const badgeSpring = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 14, stiffness: 120 },
  });
  const badgeY = interpolate(badgeSpring, [0, 1], [-80, 0]);

  // Headline entrance
  const headlineSpring = spring({
    frame,
    fps,
    delay: 10,
    config: { damping: 14, stiffness: 100 },
  });
  const headlineX = interpolate(headlineSpring, [0, 1], [-200, 0]);
  const headlineOpacity = headlineSpring;

  // Screenshot scroll
  const scrollOffset = interpolate(frame, [20, 90], [0, -80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [85, 100], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Badge */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: "50%",
          transform: `translateX(-50%) translateY(${badgeY}px)`,
          opacity: badgeSpring,
          background: `${accentColor}33`,
          border: `1px solid ${accentColor}66`,
          borderRadius: 24,
          padding: "10px 28px",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Noto Sans JP', sans-serif",
          color: accentColor,
        }}
      >
        {badge}
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: 260,
          width: "100%",
          textAlign: "center",
          transform: `translateX(${headlineX}px)`,
          opacity: headlineOpacity,
        }}
      >
        <GradientText
          fontSize={56}
          fontWeight={900}
          gradient={`linear-gradient(135deg, ${accentColor}, ${COLORS.textPrimary})`}
        >
          {headline}
        </GradientText>
      </div>

      {/* Phone mockup */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: `translateX(calc(-50% + ${phoneX}px))`,
          opacity: phoneOpacity,
        }}
      >
        <PhoneMockup
          screenshotPath={screenshotPath}
          scrollOffset={scrollOffset}
          scale={1.15}
        />
      </div>
    </AbsoluteFill>
  );
};

const features = [
  {
    screenshot: "screenshots/02_kantan_create.png",
    headline: "たった30秒で完成",
    badge: "かんたん作成",
    accent: COLORS.accentEasy,
    orbColor: "#38BDF8",
  },
  {
    screenshot: "screenshots/01_hero_keigo.png",
    headline: "敬語もAIにおまかせ",
    badge: "敬語自動調整",
    accent: COLORS.accentDetailed,
    orbColor: "#A78BFA",
  },
  {
    screenshot: "screenshots/03_templates_gmail.png",
    headline: "Gmailで直接送信",
    badge: "Gmail連携",
    accent: COLORS.accentTemplate,
    orbColor: "#FBBF24",
  },
];

export const Scene4FeatureDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background orbColor1={COLORS.primary} orbColor2={COLORS.accentDetailed} />

      {features.map((feat, index) => (
        <Sequence
          key={index}
          from={index * 100}
          durationInFrames={100}
          premountFor={10}
        >
          <FeatureSlide
            screenshotPath={feat.screenshot}
            headline={feat.headline}
            badge={feat.badge}
            accentColor={feat.accent}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
