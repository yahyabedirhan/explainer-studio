// The tailnet route, zoomed in: a server on the left, the Mac on the right,
// the tailnet between them. Scenes 9 and 10 share it.
import { C, Chip, Node, Region, Wire, FONT, appear } from "./parts";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type LanePart = "server" | "serverCmd" | "cli" | "mac" | "serve" | "listener" | "app" | "config" | "band" | "wires";

export const LANE = {
  cmdOut: [580, 445] as [number, number],
  serveIn: [1060, 445] as [number, number],
  serveOut: [1400, 445] as [number, number],
  listenerIn: [1440, 445] as [number, number],
  listenerDown: [1610, 500] as [number, number],
  appIn: [1610, 600] as [number, number],
};

const CliCard: React.FC<{ at: number; dim: boolean }> = ({ at, dim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 560,
        width: 440,
        borderRadius: 16,
        border: `2px solid #B9B6AA`,
        backgroundColor: C.panel,
        padding: "16px 22px",
        fontFamily: FONT.mono,
        fontSize: 24,
        lineHeight: 1.5,
        opacity: p * (dim ? 0.3 : 1),
        translate: interpolate(p, [0, 1], ["0px 20px", "0px 0px"]),
      }}
    >
      <div style={{ color: C.muted, fontSize: 20 }}># ~/.config/shipyard/cli.toml</div>
      <div style={{ color: C.blue }}>[notify]</div>
      <div>
        app-machine = <span style={{ color: C.green }}>"my-mac"</span>
      </div>
      <div style={{ color: C.muted }}>app-port = 47420</div>
    </div>
  );
};

export const Lane: React.FC<{ at: Partial<Record<LanePart, number>>; dim?: LanePart[]; glow?: Partial<Record<LanePart, number>> }> = ({
  at,
  dim = [],
  glow = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const has = (p: LanePart) => at[p] !== undefined;
  const a = (p: LanePart, o = 0) => ((at[p] ?? 0) <= 0 ? 0 : (at[p] ?? 0) + o);
  const d = (p: LanePart) => dim.includes(p);
  const g = (p: LanePart) => glow[p] ?? 0;
  const band = appear(frame, a("band"), fps);
  return (
    <>
      {has("band") ? (
        <div
          style={{
            position: "absolute",
            left: 620,
            top: 360,
            width: 420,
            height: 170,
            borderTop: `4px dashed ${C.blue}`,
            borderBottom: `4px dashed ${C.blue}`,
            backgroundColor: "rgba(94,158,255,0.07)",
            opacity: band * (d("band") ? 0.3 : 1),
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 112, textAlign: "center", color: C.blue, fontWeight: 900, fontSize: 28 }}>
            your tailnet
          </div>
        </div>
      ) : null}
      {has("server") ? <Region x={100} y={330} w={520} h={500} label="Server one" color="#B9B6AA" at={a("server")} dim={d("server")} /> : null}
      {has("serverCmd") ? (
        <Node x={140} y={390} w={440} h={110} label="shipyard notify" sub="the Linux build" color="#B9B6AA" code at={a("serverCmd")} dim={d("serverCmd")} glow={g("serverCmd")} />
      ) : null}
      {has("cli") ? <CliCard at={a("cli")} dim={d("cli")} /> : null}
      {has("mac") ? <Region x={1020} y={330} w={800} h={500} label="Your Mac" color={C.green} at={a("mac")} dim={d("mac")} /> : null}
      {has("serve") ? (
        <Node x={1060} y={390} w={340} h={110} label="tailscale serve" sub="stamps who sent it" color={C.blue} at={a("serve")} dim={d("serve")} glow={g("serve")} />
      ) : null}
      {has("listener") ? (
        <Node x={1440} y={390} w={340} h={110} label="listener" sub="127.0.0.1:47420 only" color={C.blue} at={a("listener")} dim={d("listener")} glow={g("listener")} />
      ) : null}
      {has("app") ? (
        <Node x={1060} y={600} w={720} h={110} label="Shipyard app" sub="your login? project rules? then the banner" color={C.green} at={a("app")} dim={d("app")} glow={g("app")} />
      ) : null}
      {has("config") ? <Chip x={1060} y={740} text="[notify] listen = true" color={C.green} at={a("config")} size={23} /> : null}
      {has("wires") ? (
        <>
          <Wire points={[LANE.cmdOut, LANE.serveIn]} color={C.blue} at={a("wires")} dur={20} width={6} />
          <Wire points={[LANE.serveOut, LANE.listenerIn]} color={C.blue} at={a("wires", 10)} arrow />
          <Wire points={[LANE.listenerDown, LANE.appIn]} color={C.blue} at={a("wires", 16)} arrow />
        </>
      ) : null}
    </>
  );
};
