import { Composition } from "remotion";
import { TikTokAd } from "./compositions/TikTokAd";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2PainPoints } from "./scenes/Scene2PainPoints";
import { Scene3SolutionReveal } from "./scenes/Scene3SolutionReveal";
import { Scene4FeatureDemo } from "./scenes/Scene4FeatureDemo";
import { Scene5CTA } from "./scenes/Scene5CTA";
import { DIMENSIONS } from "./styles/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main composition - full 30s TikTok ad */}
      <Composition
        id="TikTokAd"
        component={TikTokAd}
        durationInFrames={DIMENSIONS.totalFrames}
        fps={DIMENSIONS.fps}
        width={DIMENSIONS.width}
        height={DIMENSIONS.height}
      />

      {/* Individual scenes for development preview */}
      <Composition
        id="Scene1-Hook"
        component={Scene1Hook}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene2-PainPoints"
        component={Scene2PainPoints}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene3-SolutionReveal"
        component={Scene3SolutionReveal}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene4-FeatureDemo"
        component={Scene4FeatureDemo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene5-CTA"
        component={Scene5CTA}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
