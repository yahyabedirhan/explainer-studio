import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MapStage } from "../map";
import { C, Chip, Scene, useCues } from "../parts";

const ID = "the-machines";

export const TheMachines: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const same = interpolate(frame, [c[4], c[4] + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="02 · The servers">
      <MapStage
        at={{ mac: 0, app: 0, cmd: 0, socket: 0, servers: Math.max(1, c[0]), herdrs: c[1], plugins: c[2], linuxCmds: c[3] + Math.round(1.6 * fps) }}
        dim={["mac", "app", "socket"]}
        glow={{ cmd: same, linuxCmds: same }}
      />
      <Chip x={1160} y={118} text="GitHub release → shipyard-linux · checksum ✓" color={C.amber} at={c[3]} size={24} />
      <Chip x={510} y={580} text="shipyard ping …" color={C.ink} at={c[4]} size={24} />
      <Chip x={1510} y={440} text="shipyard ping …" color={C.ink} at={c[4] + 6} size={24} />
      <Chip x={1510} y={800} text="shipyard ping …" color={C.ink} at={c[4] + 10} size={24} />
    </Scene>
  );
};
