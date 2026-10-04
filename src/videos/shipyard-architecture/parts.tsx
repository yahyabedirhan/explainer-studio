// Building blocks shared by this video's scenes: theme, cues, captions, nodes,
// wires, packets, a terminal and a notification banner.
import { Audio } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getScene } from "../../lib/timing";
import voiceover from "./voiceover.json";

const { fontFamily: sans } = loadInter("normal", {
  weights: ["500", "700", "900"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const FONT = { sans, mono };

export const C = {
  bg: "#0D0E0B",
  panel: "#16170F",
  ink: "#F1EEE4",
  muted: "#8C8D80",
  line: "#2E3027",
  green: "#9BB35C",
  amber: "#F2A93B",
  blue: "#5E9EFF",
  notion: "#EDEBE3",
  red: "#F0574B",
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- cues

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

// The frame each narrated sentence starts at, estimated from its share of the
// scene's characters. Visual beats and captions both follow these.
export const useCues = (id: string) => {
  const { fps } = useVideoConfig();
  const scene = getScene(voiceover, id);
  const spoken = splitSentences(scene.text);
  const lengths = spoken.map((s) => s.length + 12);
  const total = lengths.reduce((a, b) => a + b, 0);
  const frames: number[] = [];
  let acc = 0;
  for (const len of lengths) {
    frames.push(Math.round((acc / total) * scene.durationSeconds * fps));
    acc += len;
  }
  frames.push(Math.round(scene.durationSeconds * fps));
  return frames;
};

// ---------------------------------------------------------------- sound

export const Sfx: React.FC<{ at: number; name: "tick" | "chime" | "whoosh"; volume?: number }> = ({
  at,
  name,
  volume = 1,
}) => {
  const { fps } = useVideoConfig();
  if (at <= 0) return null;
  return (
    <Sequence from={at} durationInFrames={2 * fps} premountFor={fps}>
      <Audio src={staticFile(`shipyard-architecture/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};

// ---------------------------------------------------------------- scene shell

const Captions: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const scene = getScene(voiceover, id) as ReturnType<typeof getScene> & { caption?: string };
  const cues = useCues(id);
  const shown = splitSentences(scene.caption ?? scene.text);
  const index = cues.findIndex((start, i) => frame >= start && frame < cues[i + 1]);
  const line = shown[index] ?? (index >= 0 ? "" : "");
  if (!line) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 42,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "12px 26px",
          backgroundColor: "rgba(0,0,0,0.72)",
          borderRadius: 10,
          color: C.ink,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 34,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {line}
      </div>
    </div>
  );
};

export const Scene: React.FC<{
  id: string;
  kicker?: string;
  children: React.ReactNode;
}> = ({ id, kicker, children }) => {
  const scene = getScene(voiceover, id);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, color: C.ink, fontFamily: sans }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line} 1.5px, transparent 1.5px)`,
          backgroundSize: "48px 48px",
          opacity: 0.55,
        }}
      />
      {kicker ? (
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 58,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          {kicker}
        </div>
      ) : null}
      {children}
      <Captions id={id} />
      <Audio src={staticFile(scene.audioFile)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- shapes

export const appear = (frame: number, at: number, fps: number) =>
  at <= 0 ? 1 : interpolate(frame, [at, at + 0.45 * fps], [0, 1], { ...clamp, easing: ease });

export type Box = { x: number; y: number; w: number; h: number };

export const Region: React.FC<
  Box & { label: string; color: string; at?: number; dim?: boolean }
> = ({ x, y, w, h, label, color, at = 0, dim = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        border: `3px solid ${color}`,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.015)",
        opacity: p * (dim ? 0.3 : 1),
        scale: interpolate(p, [0, 1], [0.97, 1]),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 28,
          top: -22,
          padding: "4px 14px",
          backgroundColor: C.bg,
          color,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Node: React.FC<
  Box & {
    label: string;
    sub?: string;
    color: string;
    at?: number;
    dim?: boolean;
    glow?: number;
    code?: boolean;
    silent?: boolean;
  }
> = ({ x, y, w, h, label, sub, color, at = 0, dim = false, glow = 0, code = false, silent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <>
      {silent ? null : <Sfx at={at} name="tick" volume={0.6} />}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 16,
          backgroundColor: C.panel,
          border: `2px solid ${color}`,
          borderLeft: `12px solid ${color}`,
          boxShadow: glow > 0 ? `0 0 ${48 * glow}px ${color}` : "none",
          opacity: p * (dim ? 0.3 : 1),
          translate: interpolate(p, [0, 1], ["0px 24px", "0px 0px"]),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: code ? mono : sans,
            fontWeight: code ? 700 : 900,
            fontSize: code ? (label.length > 12 ? 26 : 30) : 34,
            lineHeight: 1.1,
            color: C.ink,
          }}
        >
          {label}
        </div>
        {sub ? (
          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 500, color: C.muted, lineHeight: 1.25 }}>
            {sub}
          </div>
        ) : null}
      </div>
    </>
  );
};

// A straight or bent line, drawn on from `at`. Points are in frame pixels.
export const Wire: React.FC<{
  points: [number, number][];
  color: string;
  at?: number;
  dur?: number;
  dashed?: boolean;
  arrow?: boolean;
  width?: number;
  dim?: boolean;
  label?: string;
  labelAt?: [number, number];
}> = ({ points, color, at = 0, dur = 18, dashed = false, arrow = true, width = 5, dim = false, label, labelAt }) => {
  const frame = useCurrentFrame();
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const length = points.slice(1).reduce((sum, [x, y], i) => {
    const [px, py] = points[i];
    return sum + Math.hypot(x - px, y - py);
  }, 0);
  const drawn = at <= 0 ? 1 : interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  if (drawn === 0) return null;
  const [ax, ay] = points[points.length - 1];
  const [bx, by] = points[points.length - 2];
  const angle = (Math.atan2(ay - by, ax - bx) * 180) / Math.PI;
  const id = `m${Math.abs(Math.round(points[0][0] * 7 + points[0][1] * 13 + ax + ay))}`;
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, opacity: dim ? 0.3 : 1, overflow: "visible" }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-50} y={-50} width={2020} height={1180}>
          <path
            d={d}
            stroke="white"
            strokeWidth={width + 30}
            fill="none"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - drawn)}
          />
        </mask>
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "14 14" : undefined}
        mask={`url(#${id})`}
      />
      {arrow && drawn > 0.98 ? (
        <polygon
          points="0,-13 24,0 0,13"
          fill={color}
          transform={`translate(${ax} ${ay}) rotate(${angle}) translate(-20 0)`}
        />
      ) : null}
      {label && labelAt ? (
        <text
          x={labelAt[0]}
          y={labelAt[1]}
          fill={color}
          fontFamily={mono}
          fontWeight={700}
          fontSize={24}
          textAnchor="middle"
          opacity={drawn}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
};

// A labelled dot travelling along a polyline between two frames.
export const Packet: React.FC<{
  points: [number, number][];
  from: number;
  to: number;
  color: string;
  label?: string;
  hideAfter?: boolean;
  sound?: boolean;
}> = ({ points, from, to, color, label, hideAfter = true, sound = true }) => {
  const frame = useCurrentFrame();
  if (frame < from || (hideAfter && frame > to + 4)) return sound ? <Sfx at={from} name="whoosh" volume={0.5} /> : null;
  const t = interpolate(frame, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const segs = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = t * total;
  let px = points[0][0];
  let py = points[0][1];
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : Math.min(1, left / segs[i]);
      px = points[i][0] + (points[i + 1][0] - points[i][0]) * k;
      py = points[i][1] + (points[i + 1][1] - points[i][1]) * k;
      break;
    }
    left -= segs[i];
  }
  return (
    <>
      {sound ? <Sfx at={from} name="whoosh" volume={0.5} /> : null}
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          translate: "-50% -50%",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: color,
            boxShadow: `0 0 30px ${color}`,
          }}
        />
        {label ? (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: -44,
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: 8,
              backgroundColor: color,
              color: C.bg,
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </>
  );
};

export const Chip: React.FC<{
  x: number;
  y: number;
  text: string;
  color: string;
  at?: number;
  solid?: boolean;
  size?: number;
}> = ({ x, y, text, color, at = 0, solid = false, size = 26 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "8px 16px",
        borderRadius: 999,
        border: `2px solid ${color}`,
        backgroundColor: solid ? color : C.bg,
        color: solid ? C.bg : color,
        fontFamily: mono,
        fontWeight: 700,
        fontSize: size,
        whiteSpace: "nowrap",
        opacity: p,
        scale: interpolate(p, [0, 1], [0.8, 1]),
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- terminal

export type TermLine = { text: string; at: number; kind: "cmd" | "out" | "err" };

export const Terminal: React.FC<
  { x: number; y: number; w: number; title: string; lines: TermLine[]; at?: number; fontSize?: number }
> = ({ x, y, w, title, lines, at = 0, fontSize = 25 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        borderRadius: 14,
        backgroundColor: "#060705",
        border: `2px solid ${C.line}`,
        opacity: p,
        translate: interpolate(p, [0, 1], ["0px 20px", "0px 0px"]),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: `1px solid ${C.line}`,
          color: C.muted,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        <span style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: "#ED6A5E" }} />
        <span style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: "#F4BF4F" }} />
        <span style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: "#61C554" }} />
        <span style={{ marginLeft: 12 }}>{title}</span>
      </div>
      <div style={{ padding: "16px 20px", fontFamily: mono, fontSize, lineHeight: 1.45, minHeight: 70 }}>
        {lines.map((line, i) => {
          if (frame < line.at) return null;
          const typed =
            line.kind === "cmd"
              ? Math.floor(interpolate(frame, [line.at, line.at + 0.9 * fps], [0, line.text.length], clamp))
              : line.text.length;
          return (
            <div
              key={i}
              style={{
                color: line.kind === "cmd" ? C.ink : line.kind === "err" ? C.red : C.green,
                whiteSpace: "pre",
              }}
            >
              {line.kind === "cmd" ? <span style={{ color: C.muted }}>$ </span> : null}
              {line.text.slice(0, typed)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- banner

export const Banner: React.FC<{
  at: number;
  title: string;
  body: string;
  from?: string;
  x?: number;
  y?: number;
}> = ({ at, title, body, from, x = 1340, y = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 0.5 * fps], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <Sfx at={at} name="chime" volume={0.8} />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 520,
          padding: "18px 20px",
          borderRadius: 22,
          backgroundColor: "rgba(48,49,44,0.96)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          display: "flex",
          gap: 16,
          translate: interpolate(p, [0, 1], ["80px 0px", "0px 0px"]),
          opacity: p,
        }}
      >
        <Img src={staticFile("shipyard-architecture/logo.png")} style={{ width: 58, height: 58 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700 }}>
            <span>{title}</span>
            <span style={{ color: C.muted, fontWeight: 500 }}>now</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 22, color: "#D9D6CC" }}>{body}</div>
          {from ? <div style={{ marginTop: 2, fontSize: 20, color: C.muted }}>from {from}</div> : null}
        </div>
      </div>
    </>
  );
};

// Big statement text, used for rules and hard-cut moments.
export const Statement: React.FC<{
  x: number;
  y: number;
  lines: string[];
  at: number;
  color?: string;
  size?: number;
}> = ({ x, y, lines, at, color = C.ink, size = 64 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {lines.map((line, i) => (
        <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
          <div
            style={{
              fontSize: size,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              color: i === lines.length - 1 ? color : C.ink,
              translate: interpolate(frame, [at + i * 6, at + i * 6 + 0.5 * fps], ["0px 110%", "0px 0%"], {
                ...clamp,
                easing: ease,
              }),
            }}
          >
            {line}
          </div>
        </div>
      ))}
    </div>
  );
};
