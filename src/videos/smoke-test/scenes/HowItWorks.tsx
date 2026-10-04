import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { KineticTitle } from "../../../components/KineticTitle";
import { getScene } from "../../../lib/timing";
import { ACCENT } from "../config";
import voiceover from "../voiceover.json";

const scene = getScene(voiceover, "how-it-works");

export const HowItWorks: React.FC = () => (
  <>
    <KineticTitle
      kicker="02 / How it works"
      words={["Voice", "sets", "the", "clock."]}
      accent={ACCENT}
      background={ACCENT}
      ink="#0B0B0C"
    />
    <Audio src={staticFile(scene.audioFile)} />
  </>
);
