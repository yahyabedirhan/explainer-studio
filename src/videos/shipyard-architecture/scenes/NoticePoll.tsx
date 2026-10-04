import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Banner, C, Chip, Node, Packet, Region, Scene, Terminal, Wire, useCues } from "../parts";

const ID = "notice-poll";

// Mac's Herdr down and across to the plugin, under the server's command.
const ASK: [number, number][] = [[610, 690], [610, 790], [1630, 790], [1630, 690]];
const BACK: [number, number][] = [...ASK].reverse();

export const NoticePoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const span = c[3] - c[2];
  const at = (k: number) => c[2] + Math.round(span * k);
  const queued = s(1, 0.6);
  // The waiting notice sits in the plugin until the Mac's poll takes it.
  const inQueue = frame >= queued + 20 && frame < at(0.18);
  const stale = interpolate(frame, [at(0.32), at(0.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="Road 2 · The poll, through Herdr">
      <Region x={100} y={460} w={740} h={420} label="Your Mac" color={C.green} at={s(0)} />
      <Region x={1060} y={460} w={760} h={420} label="Server one" color="#B9B6AA" at={s(0, 0.3)} />
      <Node x={140} y={560} w={300} h={130} label="Shipyard app" sub="rules, then the banner" color={C.green} at={s(0, 0.5)} silent />
      <Node x={480} y={560} w={320} h={130} label="Herdr" sub="asks every 30 s" color={C.amber} at={s(0, 0.6)} silent />
      <Node x={1100} y={560} w={330} h={130} label="shipyard notify" sub="no app-machine set" color="#B9B6AA" code at={s(1)} />
      <Node x={1460} y={560} w={330} h={130} label="herdr-shipyard" sub="holds notices" color={C.amber} code at={s(1, 0.3)} />
      <Wire points={[[1430, 625], [1456, 625]]} color={C.amber} at={queued} />
      <Wire points={ASK} color={C.amber} at={s(2)} dashed />
      <Wire points={[[480, 625], [444, 625]]} color={C.green} at={at(0.62)} />
      <Terminal
        x={1060}
        y={150}
        w={760}
        title="agent · server one"
        at={s(1)}
        lines={[
          { kind: "cmd", text: 'shipyard notify "Tests passed"', at: s(1, 0.2) },
          { kind: "out", text: "queued; shown within about 30 seconds", at: queued },
          { kind: "out", text: "if the Mac is awake", at: queued },
        ]}
      />
      {inQueue ? <Chip x={1490} y={720} text="1 waiting" color={C.amber} solid size={22} /> : null}
      <Packet points={ASK} from={at(0.02)} to={at(0.16)} color={C.amber} label="notices" />
      <Packet points={BACK} from={at(0.18)} to={at(0.32)} color={C.amber} label="2 notices" />
      <div style={{ opacity: stale }}>
        <Chip x={120} y={730} text="12 min old → dropped" color={C.red} size={22} />
      </div>
      <Packet points={ASK} from={at(0.44)} to={at(0.58)} color={C.amber} label="notices-read" />
      <Banner at={at(0.66)} x={100} y={170} title="shop · Tests passed" body="from server one" from="agent" />
      <Chip x={100} y={900} text="up to 30 s late" color={C.amber} at={s(3)} size={24} />
      <Chip x={380} y={900} text="no image" color={C.amber} at={s(3, 1)} size={24} />
      <Chip x={1060} y={900} text="the Mac always asks · the server never reaches in" color={C.ink} at={s(4)} size={24} />
    </Scene>
  );
};
