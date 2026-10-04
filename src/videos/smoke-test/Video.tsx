import { Series, useVideoConfig } from "remotion";
import { sceneFrames } from "../../lib/timing";
import { HowItWorks } from "./scenes/HowItWorks";
import { Intro } from "./scenes/Intro";
import voiceover from "./voiceover.json";

export const SmokeTest: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence
        name="Intro"
        durationInFrames={sceneFrames(voiceover, "intro", fps)}
        premountFor={fps}
      >
        <Intro />
      </Series.Sequence>
      <Series.Sequence
        name="How it works"
        durationInFrames={sceneFrames(voiceover, "how-it-works", fps)}
        premountFor={fps}
      >
        <HowItWorks />
      </Series.Sequence>
    </Series>
  );
};
