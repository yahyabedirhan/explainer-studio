import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Chip, Node, Packet, Scene, Wire, appear, useCues } from "../parts";

const ID = "note-written";

const NOTION_IN: [number, number] = [1316, 470];

export const NoteWritten: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const bubble = appear(frame, s(0), fps);
  const write = s(2, 0.2);
  const cross = interpolate(frame, [s(3, 0.6), s(3, 1.0)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="08 · Writing a note">
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 150,
          maxWidth: 1100,
          padding: "26px 34px",
          borderRadius: "28px 28px 28px 6px",
          backgroundColor: C.notion,
          color: C.bg,
          fontSize: 40,
          fontWeight: 700,
          opacity: bubble,
          translate: interpolate(bubble, [0, 1], ["0px 20px", "0px 0px"]),
        }}
      >
        “What if pings were grouped by the agent that sent them?”
      </div>
      <Node x={100} y={360} w={460} h={110} label="Claude on your phone" sub="the Notion connector" color={C.notion} at={s(1)} />
      <Node x={100} y={500} w={460} h={110} label="an agent on the Mac" sub="Notion's MCP server" color={C.green} at={s(1, 0.8)} />
      <Node x={100} y={640} w={460} h={110} label="an agent on a server" sub="the ntn command" color="#B9B6AA" at={s(1, 1.6)} />
      <Node x={1320} y={400} w={500} h={150} label="Notion" sub="shipyard database · SHIP-7 added" color={C.notion} at={s(2)} glow={frame >= write + 30 ? 0.6 : 0} />
      <Wire points={[[560, 415], [900, 415], [900, 470], NOTION_IN]} color={C.notion} at={s(2)} dashed />
      <Wire points={[[560, 555], [900, 555], [900, 470], NOTION_IN]} color={C.notion} at={s(2, 0.2)} dashed arrow={false} />
      <Wire points={[[560, 695], [900, 695], [900, 470], NOTION_IN]} color={C.notion} at={s(2, 0.4)} dashed arrow={false} />
      <Packet points={[[560, 415], [900, 415], [900, 470], NOTION_IN]} from={write} to={write + Math.round(1.1 * fps)} color={C.notion} label="SHIP-7" />
      <div style={{ opacity: cross }}>
        <Node x={1320} y={660} w={500} h={110} label="Shipyard" sub="not in this path · no notes command" color={C.red} silent />
      </div>
      <Chip x={100} y={800} text="agents write notes with their own Notion tools" color={C.notion} at={s(2, 1.6)} size={24} />
    </Scene>
  );
};
