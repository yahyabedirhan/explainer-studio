import "./index.css";
import { Composition, Folder } from "remotion";
import { totalFrames } from "./lib/timing";
import * as smokeTest from "./videos/smoke-test/config";
import smokeTestVoiceover from "./videos/smoke-test/voiceover.json";
import { SmokeTest } from "./videos/smoke-test/Video";
import * as ShipyardArchitectureConfig from "./videos/shipyard-architecture/config";
import ShipyardArchitectureVoiceover from "./videos/shipyard-architecture/voiceover.json";
import { ShipyardArchitecture } from "./videos/shipyard-architecture/Video";

// One <Composition> per video in src/videos. Lengths always come from voiceover.json.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="smoke-test">
        <Composition
          id="SmokeTest"
          component={SmokeTest}
          durationInFrames={totalFrames(smokeTestVoiceover, smokeTest.FPS)}
          fps={smokeTest.FPS}
          width={smokeTest.WIDTH}
          height={smokeTest.HEIGHT}
        />
      </Folder>
      <Folder name="shipyard-architecture">
        <Composition
          id="ShipyardArchitecture"
          component={ShipyardArchitecture}
          durationInFrames={totalFrames(ShipyardArchitectureVoiceover, ShipyardArchitectureConfig.FPS)}
          fps={ShipyardArchitectureConfig.FPS}
          width={ShipyardArchitectureConfig.WIDTH}
          height={ShipyardArchitectureConfig.HEIGHT}
        />
      </Folder>
    </>
  );
};
