import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Panel } from "../panel";
import { Banner, C, Chip, FONT, Scene, Sfx, appear, ease, useCues } from "../parts";

const ID = "ping-or-notice";

const Heading: React.FC<{ x: number; text: string; sub: string; color: string; at: number }> = ({ x, text, sub, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <>
      <Sfx at={at} name="tick" />
      <div style={{ position: "absolute", left: x, top: 150, opacity: p, translate: interpolate(p, [0, 1], ["0px 20px", "0px 0px"]) }}>
        <div style={{ fontSize: 96, fontWeight: 900, color, letterSpacing: -2 }}>{text}</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: C.muted }}>{sub}</div>
      </div>
    </>
  );
};

const Road: React.FC<{ x: number; n: string; text: string; color: string; at: number }> = ({ x, n, text, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  return (
    <>
      <Sfx at={at} name="tick" />
      <div
        style={{
          position: "absolute",
          left: x,
          top: 790,
          width: 540,
          padding: "22px 28px",
          borderRadius: 18,
          border: `3px solid ${color}`,
          backgroundColor: C.panel,
          opacity: p,
          translate: interpolate(p, [0, 1], ["0px 30px", "0px 0px"]),
          display: "flex",
          alignItems: "baseline",
          gap: 22,
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 60, color }}>{n}</span>
        <span style={{ fontSize: 38, fontWeight: 900 }}>{text}</span>
      </div>
    </>
  );
};

export const PingOrNotice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const roads = c[7];
  // Before the roads, both kinds side by side; then they make room for the three roads.
  const lift = interpolate(frame, [roads - 6, roads + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const gone = interpolate(frame, [c[6] + Math.round(0.8 * fps), c[6] + Math.round(1.4 * fps)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene id={ID} kicker="05 · Ping or notice">
      <div style={{ opacity: 1 - 0.75 * lift }}>
        <Heading x={100} text="Ping" sub="something you must act on" color={C.green} at={c[1]} />
        <Heading x={1000} text="Notice" sub="a status you glance at" color={C.ink} at={c[3]} />
        <Panel
          x={100}
          y={380}
          w={780}
          at={c[1] + 10}
          groups={[
            {
              name: "shop",
              count: 1,
              rows: [
                { kind: "ping", no: "3", title: "Waiting for your input", meta: "agent · 4m", unseen: true },
                { kind: "ping", no: "2", title: "PR #42 is ready for review", meta: "agent · 9m" },
              ],
            },
          ]}
        />
        <Chip x={100} y={700} text="listed · numbered · kept until seen" color={C.green} at={c[2]} size={24} />
        <div style={{ opacity: gone }}>
          <Banner at={c[4]} x={1000} y={400} title="shop · Tests running" body="12 of 40 passed" from="agent" />
          {frame >= c[5] ? <Banner at={c[5]} x={1000} y={400} title="shop · Done" body="40 of 40 passed" from="agent" /> : null}
        </div>
        <Chip x={1000} y={700} text="shown once · never listed · never kept" color={C.ink} at={c[6]} size={24} />
      </div>
      <Road x={100} n="1" text="on the Mac" color={C.green} at={roads} />
      <Road x={690} n="2" text="the poll" color={C.amber} at={roads + 8} />
      <Road x={1280} n="3" text="the tailnet" color={C.blue} at={roads + 16} />
    </Scene>
  );
};
