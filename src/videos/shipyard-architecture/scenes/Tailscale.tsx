import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Lane } from "../lane";
import { MapStage } from "../map";
import { C, Chip, Scene, Sfx, Statement, useCues } from "../parts";

const ID = "tailscale";

export const Tailscale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const zoom = c[3];
  const slow = interpolate(frame, [c[1] - 8, c[1]], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="06 · The exception: your tailnet">
      {frame < zoom ? (
        <>
          <div style={{ opacity: frame < c[1] ? 0.25 : 1 }}>
            <MapStage
              at={{
                mac: 0,
                app: 0,
                cmd: 0,
                socket: 0,
                macHerdr: 0,
                servers: 0,
                herdrs: 0,
                plugins: 0,
                linuxCmds: 0,
                herdrLink: 0,
                tailnet: c[1] + Math.round(0.6 * fps),
              }}
              dim={["app", "cmd", "socket", "macHerdr", "herdrs", "plugins", "linuxCmds", "herdrLink"]}
              glow={{}}
            />
          </div>
          <div style={{ opacity: slow }}>
            <Statement x={200} y={380} lines={["30 seconds is", "too slow."]} at={s(0)} color={C.amber} size={120} />
          </div>
          <Chip x={700} y={120} text="Tailscale links your machines, as you" color={C.blue} at={s(2)} size={26} />
        </>
      ) : (
        <>
          <Sfx at={zoom} name="tick" />
          <Lane
            at={{
              mac: zoom,
              listener: zoom + Math.round(0.8 * fps),
              config: zoom + Math.round(2.2 * fps),
              app: zoom + Math.round(1.4 * fps),
              band: s(4),
              serve: s(4, 0.6),
              server: s(4, 0.3),
              serverCmd: s(4, 0.9),
            }}
          />
          <Chip x={1060} y={522} text="stamps: Tailscale-User-Login = you" color={C.blue} at={s(4, 2.4)} size={24} />
          <Chip x={1440} y={740} text="login is yours ✓" color={C.green} at={s(5)} solid size={24} />
          <Chip x={1440} y={250} text="browser request ✕" color={C.red} at={s(5, 1.4)} size={24} />
        </>
      )}
    </Scene>
  );
};
