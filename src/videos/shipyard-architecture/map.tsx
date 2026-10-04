// The one map the video builds up: the Mac on the left, two servers on the
// right, Notion on top. Each scene says which parts show, from which frame,
// and which are dimmed or glowing.
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, Node, Region, Wire, appear, FONT } from "./parts";

export type Part =
  | "mac"
  | "app"
  | "cmd"
  | "socket"
  | "config"
  | "macHerdr"
  | "listener"
  | "servers"
  | "herdrs"
  | "plugins"
  | "linuxCmds"
  | "clis"
  | "herdrLink"
  | "tailnet"
  | "tailnetWire"
  | "notion"
  | "notesRead"
  | "notesWrite";

type Props = {
  at: Partial<Record<Part, number>>;
  dim?: Part[];
  glow?: Partial<Record<Part, number>>;
};

const SERVER = "#B9B6AA";
const SX = 1160;
const SERVER_Y = [230, 590];

export const MAC_HERDR_OUT: [number, number] = [810, 815];

const Tailnet: React.FC<{ at: number; dim: boolean }> = ({ at, dim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 196,
        width: 1800,
        height: 750,
        borderRadius: 40,
        border: `4px dashed ${C.blue}`,
        backgroundColor: "rgba(94,158,255,0.05)",
        opacity: p * (dim ? 0.3 : 1),
        scale: interpolate(p, [0, 1], [1.04, 1]),
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: -22,
          padding: "2px 14px",
          backgroundColor: C.bg,
          color: C.blue,
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 28,
        }}
      >
        your tailnet · Tailscale
      </div>
    </div>
  );
};

export const MapStage: React.FC<Props> = ({ at, dim = [], glow = {} }) => {
  const has = (p: Part) => at[p] !== undefined;
  const a = (p: Part, offset = 0) => {
    const v = at[p] ?? 0;
    return v <= 0 ? 0 : v + offset;
  };
  const d = (p: Part) => dim.includes(p);
  const g = (p: Part) => glow[p] ?? 0;

  return (
    <>
      {has("tailnet") ? <Tailnet at={a("tailnet")} dim={d("tailnet")} /> : null}

      {has("mac") ? <Region x={100} y={230} w={760} h={680} label="Your Mac" color={C.green} at={a("mac")} dim={d("mac")} /> : null}
      {has("app") ? (
        <Node x={150} y={290} w={660} h={130} label="Shipyard app" sub="the menu bar: pull requests, issues, runs, pings" color={C.green} at={a("app")} dim={d("app")} glow={g("app")} />
      ) : null}
      {has("cmd") ? (
        <Node x={150} y={540} w={300} h={120} label="shipyard" sub="the command, inside the app" color={C.green} code at={a("cmd")} dim={d("cmd")} glow={g("cmd")} />
      ) : null}
      {has("socket") ? (
        <Wire points={[[300, 538], [300, 426]]} color={C.green} at={a("socket")} dim={d("socket")} label="control.sock" labelAt={[392, 490]} />
      ) : null}
      {has("config") ? (
        <Node x={510} y={540} w={300} h={120} label="config.toml" sub="the app's settings" color={C.green} code at={a("config")} dim={d("config")} glow={g("config")} />
      ) : null}
      {has("listener") ? (
        <Node x={150} y={760} w={300} h={110} label="listener" sub="127.0.0.1 only, when on" color={C.blue} at={a("listener")} dim={d("listener")} glow={g("listener")} />
      ) : null}
      {has("macHerdr") ? (
        <Node x={510} y={760} w={300} h={110} label="Herdr" sub="saved machines" color={C.amber} at={a("macHerdr")} dim={d("macHerdr")} glow={g("macHerdr")} />
      ) : null}

      {SERVER_Y.map((y, i) => (
        <ServerParts key={y} y={y} index={i} has={has} a={a} d={d} g={g} />
      ))}

      {has("herdrLink")
        ? SERVER_Y.map((y, i) => (
            <Wire
              key={y}
              points={[MAC_HERDR_OUT, [1000, 815], [1000, y + 105], [1186, y + 105]]}
              color={C.amber}
              at={a("herdrLink", i * 8)}
              dim={d("herdrLink")}
              width={6}
            />
          ))
        : null}

      {has("tailnetWire") ? (
        <Wire
          points={[[1186, SERVER_Y[0] + 235], [1080, SERVER_Y[0] + 235], [1080, 892], [300, 892], [300, 874]]}
          color={C.blue}
          at={a("tailnetWire")}
          dim={d("tailnetWire")}
          dur={30}
          width={6}
        />
      ) : null}

      {has("notion") ? (
        <Node x={780} y={58} w={380} h={120} label="Notion" sub="Shipyard Notes" color={C.notion} at={a("notion")} dim={d("notion")} glow={g("notion")} />
      ) : null}
      {has("notesRead") ? (
        <Wire points={[[760, 288], [760, 230], [760, 118], [778, 118]]} color={C.notion} at={a("notesRead")} dim={d("notesRead")} dashed />
      ) : null}
      {has("notesWrite") ? (
        <Wire points={[[1490, 226], [1490, 118], [1164, 118]]} color={C.notion} at={a("notesWrite")} dim={d("notesWrite")} dashed />
      ) : null}
    </>
  );
};

const ServerParts: React.FC<{
  y: number;
  index: number;
  has: (p: Part) => boolean;
  a: (p: Part, offset?: number) => number;
  d: (p: Part) => boolean;
  g: (p: Part) => number;
}> = ({ y, index, has, a, d, g }) => {
  const o = index * 8;
  return (
    <>
      {has("servers") ? (
        <Region x={SX} y={y} w={660} h={320} label={index === 0 ? "Server one" : "Server two"} color={SERVER} at={a("servers", o)} dim={d("servers")} />
      ) : null}
      {has("herdrs") ? (
        <Node x={SX + 30} y={y + 50} w={290} h={110} label="Herdr" sub="agents run here" color={C.amber} at={a("herdrs", o)} dim={d("herdrs")} glow={g("herdrs")} silent={index > 0} />
      ) : null}
      {has("plugins") ? (
        <Node x={SX + 340} y={y + 50} w={290} h={110} label="herdr-shipyard" sub="the plugin" color={C.amber} code at={a("plugins", o)} dim={d("plugins")} glow={g("plugins")} silent={index > 0} />
      ) : null}
      {has("linuxCmds") ? (
        <Node x={SX + 30} y={y + 180} w={290} h={110} label="shipyard" sub="the Linux build" color={SERVER} code at={a("linuxCmds", o)} dim={d("linuxCmds")} glow={g("linuxCmds")} silent={index > 0} />
      ) : null}
      {has("clis") ? (
        <Node x={SX + 340} y={y + 180} w={290} h={110} label="cli.toml" sub="the command's settings" color={SERVER} code at={a("clis", o)} dim={d("clis")} glow={g("clis")} silent={index > 0} />
      ) : null}
    </>
  );
};

