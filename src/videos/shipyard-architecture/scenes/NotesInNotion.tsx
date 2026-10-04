import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, Scene, Sfx, Statement, appear, useCues } from "../parts";

const ID = "notes-in-notion";

const NOTES: [number, string, string][] = [
  [4, "Retry flaky runs once", "ci"],
  [5, "A dark icon for the menu bar", "design"],
  [6, "Group runs by workflow", "ideation"],
  [7, "Group pings by agent", "ideation"],
];

const Tree: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = (i: number) => appear(frame, at + i * 8, fps);
  const items: [string, string, number][] = [
    ["▤", "Shipyard Notes", 0],
    ["▦", "shipyard", 1],
    ["▦", "shop", 1],
    ["▦", "blog", 1],
  ];
  return (
    <div style={{ position: "absolute", left: 100, top: 330, width: 560 }}>
      <Sfx at={at} name="tick" />
      {items.map(([icon, name, depth], i) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 20px",
            marginLeft: depth * 48,
            borderRadius: 12,
            backgroundColor: i === 1 ? "rgba(237,235,227,0.10)" : "transparent",
            fontSize: depth ? 36 : 42,
            fontWeight: depth ? 700 : 900,
            opacity: row(i),
            translate: interpolate(row(i), [0, 1], ["-20px 0px", "0px 0px"]),
          }}
        >
          <span style={{ color: C.muted }}>{icon}</span>
          <span>{name}</span>
        </div>
      ))}
      <div style={{ marginTop: 18, marginLeft: 48, fontSize: 24, color: C.muted, opacity: row(5) }}>
        one database per project, titled like the project
      </div>
    </div>
  );
};

const Table: React.FC<{ at: number; mark: number }> = ({ at, mark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, at, fps);
  const cell = { padding: "14px 18px", borderBottom: `1px solid ${C.line}` } as const;
  return (
    <div
      style={{
        position: "absolute",
        left: 760,
        top: 300,
        width: 1060,
        borderRadius: 18,
        border: `2px solid ${C.notion}`,
        backgroundColor: C.panel,
        opacity: p,
        overflow: "hidden",
        fontSize: 28,
      }}
    >
      <div style={{ padding: "18px 22px", fontSize: 34, fontWeight: 900 }}>shipyard</div>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 170px 130px", color: C.muted, fontSize: 22, fontWeight: 700 }}>
        {["No.", "Name", "Labels", "Status"].map((h) => (
          <div key={h} style={cell}>
            {h}
          </div>
        ))}
      </div>
      {NOTES.map(([n, name, label], i) => {
        const rp = appear(frame, at + 10 + i * 6, fps);
        const hot = n === 7 ? mark : 0;
        return (
          <div
            key={n}
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr 170px 130px",
              opacity: rp,
              backgroundColor: `rgba(155,179,92,${0.25 * hot})`,
            }}
          >
            <div style={{ ...cell, fontFamily: FONT.mono, fontWeight: 700, color: hot ? C.green : C.ink }}>SHIP-{n}</div>
            <div style={cell}>{name}</div>
            <div style={{ ...cell, color: C.amber, fontSize: 22 }}>{label}</div>
            <div style={{ ...cell, color: C.green, fontSize: 22 }}>Open</div>
          </div>
        );
      })}
    </div>
  );
};

export const NotesInNotion: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(ID);
  const mark = interpolate(frame, [c[4], c[4] + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const intro = interpolate(frame, [c[3] - 8, c[3]], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="07 · Notes live in Notion">
      <div style={{ opacity: intro }}>
        <Statement x={140} y={330} lines={["Your notes,", "not your agents'."]} at={c[1]} color={C.notion} size={120} />
      </div>
      {frame >= c[3] - 4 ? (
        <>
          <Tree at={c[3]} />
          <Table at={c[3] + 30} mark={mark} />
          <div
            style={{
              position: "absolute",
              left: 760,
              top: 780,
              fontFamily: FONT.mono,
              fontSize: 30,
              color: C.green,
              opacity: mark,
            }}
          >
            numbers only grow, never reused
          </div>
        </>
      ) : null}
    </Scene>
  );
};
