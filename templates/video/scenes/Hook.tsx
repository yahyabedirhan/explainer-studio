import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { KineticTitle } from "../../../components/KineticTitle";
import { getScene } from "../../../lib/timing";
import { ACCENT } from "../config";
import voiceover from "../voiceover.json";

const scene = getScene(voiceover, "hook");

export const Hook: React.FC = () => (
  <>
    <KineticTitle kicker="01 / __TITLE__" words={["Replace", "me."]} accent={ACCENT} />
    <Audio src={staticFile(scene.audioFile)} />
  </>
);
