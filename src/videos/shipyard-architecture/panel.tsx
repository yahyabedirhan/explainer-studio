// A stylised Shipyard panel with made-up projects, close to the real menu's look.
// No real accounts, repositories or people.
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { appear, C, FONT } from "./parts";

export type Row = {
  kind: "pr" | "ping" | "note";
  no: string;
  title: string;
  meta?: string;
  unseen?: boolean;
  at?: number;
  highlight?: number;
};

export type Group = { name: string; count?: number; rows: Row[]; pencilGlow?: number; notes?: Row[]; notesAt?: number };

const icon = (kind: Row["kind"]) => (kind === "pr" ? "⑂" : kind === "ping" ? "◉" : "✎");
const iconColor = (kind: Row["kind"]) => (kind === "pr" ? "#A784F2" : kind === "ping" ? C.green : C.notion);

const RowView: React.FC<{ row: Row }> = ({ row }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = appear(frame, row.at ?? 0, fps);
  if (p === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "9px 22px",
        fontSize: 23,
        opacity: p,
        backgroundColor: row.highlight ? `rgba(155,179,92,${0.22 * row.highlight})` : "transparent",
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: row.unseen ? C.blue : "transparent" }} />
      <span style={{ width: 26, color: iconColor(row.kind), fontSize: 24, textAlign: "center" }}>{icon(row.kind)}</span>
      <span style={{ width: 90, color: C.muted, fontFamily: FONT.mono, fontSize: 21, textAlign: "right" }}>{row.no}</span>
      <span
        style={{
          flex: 1,
          fontWeight: row.unseen ? 700 : 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {row.title}
      </span>
      {row.meta ? <span style={{ color: C.muted, fontSize: 20 }}>{row.meta}</span> : null}
    </div>
  );
};

export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  groups: Group[];
  at?: number;
  scale?: number;
}> = ({ x, y, w, groups, at = 0, scale = 1 }) => {
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
        borderRadius: 22,
        backgroundColor: "#1C1D1A",
        border: "1px solid rgba(255,255,255,0.13)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden",
        opacity: p,
        scale: interpolate(p, [0, 1], [0.96 * scale, scale]),
        transformOrigin: "top left",
        translate: interpolate(p, [0, 1], ["0px -20px", "0px 0px"]),
        color: C.ink,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "18px 22px", gap: 14 }}>
        <span style={{ fontSize: 28, fontWeight: 900 }}>Shipyard</span>
        <span style={{ fontSize: 21, color: C.muted }}>2 need attention</span>
        <span style={{ marginLeft: "auto", fontSize: 26, color: C.muted }}>↻ ⚙</span>
      </div>
      {groups.map((g) => (
        <div key={g.name}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 22px",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            <span style={{ color: C.muted }}>⌄</span>
            <span>{g.name}</span>
            {g.count ? (
              <span style={{ fontSize: 18, padding: "1px 10px", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)" }}>
                {g.count}
              </span>
            ) : null}
            {g.pencilGlow !== undefined ? (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 24,
                  padding: "0 8px",
                  borderRadius: 8,
                  color: g.pencilGlow > 0 ? C.bg : C.muted,
                  backgroundColor: g.pencilGlow > 0 ? `rgba(237,235,227,${g.pencilGlow})` : "transparent",
                }}
              >
                ✎
              </span>
            ) : null}
          </div>
          {g.rows.map((r, i) => (
            <RowView key={i} row={r} />
          ))}
          {g.notes && frame >= (g.notesAt ?? 0) ? (
            <>
              <div style={{ padding: "6px 22px 2px 74px", fontSize: 18, fontWeight: 700, letterSpacing: 2, color: C.muted, textTransform: "uppercase" }}>
                Notes
              </div>
              {g.notes.map((r, i) => (
                <RowView key={`n${i}`} row={r} />
              ))}
            </>
          ) : null}
        </div>
      ))}
      <div style={{ padding: "14px 22px", fontSize: 19, color: C.muted, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        Last updated just now
      </div>
    </div>
  );
};
