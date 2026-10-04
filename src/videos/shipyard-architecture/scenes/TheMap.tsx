import { useCurrentFrame, useVideoConfig } from "remotion";
import { MAC_HERDR_OUT, MapStage, Part } from "../map";
import { C, Chip, Packet, Scene, useCues } from "../parts";

const ID = "the-map";

const AMBER: Part[] = ["macHerdr", "herdrLink", "herdrs", "plugins"];
const BLUE: Part[] = ["tailnet", "tailnetWire", "listener", "linuxCmds", "clis"];
const NOTES: Part[] = ["notion", "notesRead", "notesWrite", "app"];
const ALL: Part[] = [...AMBER, ...BLUE, ...NOTES, "mac", "cmd", "socket", "config", "servers"];

export const TheMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const lane = frame >= c[3] ? NOTES : frame >= c[2] ? BLUE : frame >= c[1] ? AMBER : ALL;
  const dim = ALL.filter((p) => !lane.includes(p) && p !== "mac" && p !== "servers");
  const at = Object.fromEntries(ALL.map((p) => [p, 0])) as Partial<Record<Part, number>>;
  const glow = Object.fromEntries(lane.map((p) => [p, lane === ALL ? 0 : 1]));
  const poll = c[1] + Math.round(0.8 * fps);
  const fast = c[2] + Math.round(0.6 * fps);
  const read = c[3] + Math.round(1.0 * fps);
  return (
    <Scene id={ID} kicker="The whole map">
      <MapStage at={at} dim={dim} glow={glow} />
      <Packet points={[MAC_HERDR_OUT, [1000, 815], [1000, 335], [1186, 335]]} from={poll} to={poll + Math.round(1.2 * fps)} color={C.amber} label="pings, slow notices" />
      <Packet points={[[1186, 465], [1080, 465], [1080, 892], [300, 892], [300, 874]]} from={fast} to={fast + Math.round(1.2 * fps)} color={C.blue} label="fast notices" />
      <Packet points={[[1164, 118], [778, 118], [760, 118], [760, 288]]} from={read} to={read + Math.round(1.2 * fps)} color={C.notion} label="your notes" />
      {frame >= c[1] && frame < c[2] ? <Chip x={1200} y={128} text="Herdr · the Mac asks" color={C.amber} at={c[1]} size={22} /> : null}
      {frame >= c[2] && frame < c[3] ? <Chip x={1200} y={128} text="Tailscale · straight in, you to you" color={C.blue} at={c[2]} size={22} /> : null}
    </Scene>
  );
};
