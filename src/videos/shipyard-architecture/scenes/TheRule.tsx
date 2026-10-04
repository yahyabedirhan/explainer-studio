import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MAC_HERDR_OUT, MapStage } from "../map";
import { C, Chip, Packet, Scene, Sfx, Statement, useCues } from "../parts";

const ID = "the-rule";

const ASK: [number, number][] = [MAC_HERDR_OUT, [1000, 815], [1000, 335], [1186, 335]];

export const TheRule: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  // The map steps back while the rule is said, then comes back for the poll.
  const rule = interpolate(frame, [c[4] - 6, c[4] + 6, c[6] - 6, c[6] + 6], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ask = c[6] + Math.round(0.4 * fps);
  return (
    <Scene id={ID} kicker="03 · The one rule">
      <div style={{ opacity: 1 - 0.85 * rule }}>
        <MapStage
          at={{
            mac: 0,
            app: 0,
            cmd: 0,
            socket: 0,
            servers: 0,
            herdrs: 0,
            plugins: 0,
            linuxCmds: 0,
            macHerdr: c[1],
            herdrLink: c[2] + Math.round(0.8 * fps),
          }}
          dim={["app", "cmd", "socket", "linuxCmds"]}
          glow={{ macHerdr: frame >= c[2] ? 1 : 0 }}
        />
        <Packet points={ASK} from={ask} to={ask + Math.round(1.2 * fps)} color={C.amber} label="anything for me?" />
        <Packet
          points={[...ASK].reverse()}
          from={ask + Math.round(1.6 * fps)}
          to={ask + Math.round(2.8 * fps)}
          color={C.amber}
          label="pings"
        />
        <Chip x={520} y={690} text="every 30 s" color={C.amber} at={c[6]} size={24} />
      </div>
      {rule > 0 ? (
        <div style={{ opacity: rule }}>
          <Sfx at={c[4]} name="tick" />
          <Statement x={180} y={360} lines={["The Mac reaches out."]} at={c[4]} color={C.ink} size={110} />
          <Statement x={180} y={520} lines={["A server never reaches in."]} at={c[5]} color={C.amber} size={110} />
        </div>
      ) : null}
    </Scene>
  );
};
