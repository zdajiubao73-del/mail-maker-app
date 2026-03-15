import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

import { Scene1Hook } from "../scenes/Scene1Hook";
import { Scene2PainPoints } from "../scenes/Scene2PainPoints";
import { Scene3SolutionReveal } from "../scenes/Scene3SolutionReveal";
import { Scene4FeatureDemo } from "../scenes/Scene4FeatureDemo";
import { Scene5CTA } from "../scenes/Scene5CTA";

// Load Noto Sans JP at top level (no subset filter - NotoSansJP uses unicode ranges)
loadFont();

export const TikTokAd: React.FC = () => {
  // Scene durations (accounting for 15-frame transitions)
  // Scene 1: 90f (3s) - Hook
  // Scene 2: 150f (5s) - Pain Points
  // Scene 3: 120f (4s) - Solution Reveal
  // Scene 4: 300f (10s) - Feature Demo
  // Scene 5: 300f (10s) - CTA (expanded to fill remaining)
  // Total with transitions: 90 + 150 + 120 + 300 + 300 - 4*15 = 900 frames

  const transitionDuration = 15;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06060F" }}>
      <TransitionSeries>
        {/* Scene 1: Hook (0-3s) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 2: Pain Points (3-8s) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2PainPoints />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 3: Solution Reveal (8-12s) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene3SolutionReveal />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 4: Feature Demo (12-22s) */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene4FeatureDemo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 5: CTA (22-30s) */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
