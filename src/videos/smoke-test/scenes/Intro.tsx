import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { KineticTitle } from "../../../components/KineticTitle";
import { getScene } from "../../../lib/timing";
import { ACCENT } from "../config";
import voiceover from "../voiceover.json";

const scene = getScene(voiceover, "intro");

export const Intro: React.FC = () => (
  <>
    <KineticTitle kicker="01 / Smoke test" words={["Explainer", "Studio."]} accent={ACCENT} />
    <Audio src={staticFile(scene.audioFile)} />
  </>
);
