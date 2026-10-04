import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Chip, Scene, Sfx, Statement, ease, useCues } from "../parts";

const ID = "hook";

// Scattered, unconnected pieces, then a hard cut to the question.
const Piece: React.FC<{ x: number; y: number; text: string; color: string; at: number; rot: number }> = ({
  x,
  y,
  text,
  color,
  at,
  rot,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [at, at + 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <>
      <Sfx at={at} name="tick" volume={0.6} />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          padding: "26px 36px",
          borderRadius: 18,
          border: `3px solid ${color}`,
          borderLeft: `14px solid ${color}`,
          backgroundColor: C.panel,
          fontSize: 46,
          fontWeight: 900,
          opacity: p,
          rotate: `${rot}deg`,
          scale: interpolate(p, [0, 1], [0.85, 1]),
        }}
      >
        {text}
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const cut = c[3];
  return (
    <Scene id={ID}>
      {frame < cut ? (
        <>
          <Piece x={150} y={260} text="Your Mac" color={C.green} at={1} rot={-3} />
          <Piece x={1180} y={200} text="Server one" color="#B9B6AA" at={Math.round(0.9 * fps)} rot={2} />
          <Piece x={1320} y={560} text="Server two" color="#B9B6AA" at={Math.round(1.4 * fps)} rot={-2} />
          <Piece x={700} y={120} text="Notion" color={C.notion} at={c[1]} rot={1.5} />
          <Piece x={640} y={640} text="Tailscale" color={C.blue} at={c[1] + 10} rot={-1.5} />
          <Piece x={260} y={600} text="Herdr" color={C.amber} at={c[1] + 18} rot={2.5} />
          <div style={{ position: "absolute", left: 760, top: 380 }}>
            <Img
              src={staticFile("shipyard-architecture/logo.png")}
              style={{
                width: 150,
                opacity: interpolate(frame, [c[2], c[2] + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            />
          </div>
          <Chip x={940} y={430} text="Shipyard" color={C.green} at={c[2] + 6} size={34} />
        </>
      ) : (
        <>
          <Sfx at={cut} name="tick" />
          <Statement x={140} y={330} lines={["So how does it", "actually connect?"]} at={cut} color={C.green} size={130} />
        </>
      )}
    </Scene>
  );
};
