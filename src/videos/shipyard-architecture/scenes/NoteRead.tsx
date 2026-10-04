import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Panel } from "../panel";
import { C, Chip, Node, Packet, Region, Scene, Wire, useCues } from "../parts";

const ID = "note-read";

const UP: [number, number][] = [[640, 330], [1316, 330]];

export const NoteRead: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const ask = s(3, 0.8);
  const back = ask + Math.round(1.3 * fps);
  const listed = back + Math.round(0.9 * fps);
  const pencil = interpolate(frame, [s(4, 0.6), s(4, 1.0)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const make = s(4, 1.6);
  return (
    <Scene id={ID} kicker="09 · The app reads notes">
      <Region x={100} y={200} w={720} h={700} label="Your Mac" color={C.green} at={s(0)} />
      <Node x={140} y={260} w={500} h={130} label="Shipyard app" sub="reads notes itself" color={C.green} at={s(0, 0.3)} />
      <Node x={140} y={440} w={500} h={120} label="Keychain" sub="the Notion token, given once" color={C.green} at={s(1, 0.5)} />
      <Wire points={[[390, 438], [390, 394]]} color={C.green} at={s(1, 1)} />
      <Chip x={140} y={590} text="agents never see it ✕" color={C.red} at={s(2)} size={24} />
      <Node x={1320} y={250} w={500} h={150} label="Notion" sub="query: shipyard, open notes" color={C.notion} at={s(0, 0.5)} />
      <Wire points={UP} color={C.notion} at={s(3)} dashed />
      <Chip x={760} y={250} text="every 60 s · when the menu opens" color={C.notion} at={s(3, 0.3)} size={22} />
      <Packet points={UP} from={ask} to={ask + Math.round(1 * fps)} color={C.notion} label="open notes?" />
      <Packet points={[...UP].reverse()} from={back} to={back + Math.round(1 * fps)} color={C.notion} label="SHIP-4…7" />
      <Packet points={UP} from={make} to={make + Math.round(1 * fps)} color={C.notion} label="new page" />
      <Panel
        x={880}
        y={460}
        w={940}
        at={s(3, 0.6)}
        groups={[
          {
            name: "shipyard",
            count: 1,
            pencilGlow: pencil,
            rows: [{ kind: "pr", no: "206", title: "feat: notes from notion, and agents' notices", meta: "1h" }],
            notesAt: listed,
            notes: [
              { kind: "note", no: "SHIP-7", title: "Group pings by agent", meta: "ideation", at: listed, highlight: 1 },
              { kind: "note", no: "SHIP-6", title: "Group runs by workflow", meta: "ideation", at: listed + 4 },
            ],
          },
        ]}
      />
      <Chip x={140} y={680} text="✎ new note → opens in Notion" color={C.notion} at={s(4, 1)} size={24} />
    </Scene>
  );
};
