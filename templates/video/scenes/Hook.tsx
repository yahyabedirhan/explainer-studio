import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { KineticTitle } from "@studio/components/KineticTitle";
import { getScene } from "@studio/lib/timing";
import { ACCENT } from "../config";
import voiceover from "../voiceover.json";

// getScene runs inside the component: at module level it throws before `npm run voice`,
// and the throw breaks Root's listing of every other video.
export const Hook: React.FC = () => (
  <>
    <KineticTitle kicker="01 / __TITLE__" words={["Replace", "me."]} accent={ACCENT} />
    <Audio src={staticFile(getScene(voiceover, "hook").audioFile)} />
  </>
);
