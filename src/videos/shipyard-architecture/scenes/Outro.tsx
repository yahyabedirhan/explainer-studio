import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Scene, Sfx, Statement, ease } from "../parts";

const ID = "outro";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <Scene id={ID}>
      <Sfx at={1} name="chime" volume={0.6} />
      <Img
        src={staticFile("shipyard-architecture/logo.png")}
        style={{ position: "absolute", left: 140, top: 230, width: 180, opacity: logo, scale: interpolate(logo, [0, 1], [0.8, 1]) }}
      />
      <Statement x={140} y={460} lines={["Three roads,", "one menu."]} at={4} color={C.green} size={140} />
    </Scene>
  );
};
