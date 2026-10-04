import { Series, useVideoConfig } from "remotion";
import { sceneFrames } from "../../lib/timing";
import { Hook } from "./scenes/Hook";
import voiceover from "./voiceover.json";

export const __COMPONENT__: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence
        name="Hook"
        durationInFrames={sceneFrames(voiceover, "hook", fps)}
        premountFor={fps}
      >
        <Hook />
      </Series.Sequence>
    </Series>
  );
};
