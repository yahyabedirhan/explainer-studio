import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Chip, FONT, Scene, Sfx, appear, useCues } from "../parts";

const ID = "two-files";

const FileCard: React.FC<{
  x: number;
  name: string;
  where: string;
  reader: string;
  color: string;
  lines: [string, string][];
  at: number;
  strike: number;
}> = ({ x, name, where, reader, color, lines, at, strike }) => {
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
          top: 200,
          width: 760,
          opacity: p,
          translate: interpolate(p, [0, 1], ["0px 30px", "0px 0px"]),
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 64, color }}>{name}</div>
        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 700 }}>{where}</div>
        <div style={{ fontSize: 26, color: C.muted }}>{reader}</div>
        <div
          style={{
            marginTop: 30,
            padding: "26px 30px",
            borderRadius: 18,
            border: `2px solid ${color}`,
            borderLeft: `12px solid ${color}`,
            backgroundColor: C.panel,
            fontFamily: FONT.mono,
            fontSize: 32,
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: C.blue }}>[notify]</div>
          {lines.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span style={{ color: C.muted }}> = </span>
              <span style={{ color: C.green }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, height: 6, width: `${strike * 100}%`, backgroundColor: color }} />
      </div>
    </>
  );
};

export const TwoFiles: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(ID);
  const rule = interpolate(frame, [c[3], c[3] + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene id={ID} kicker="04 · Two settings files">
      <FileCard
        x={100}
        name="config.toml"
        where="Mac only"
        reader="read by the app"
        color={C.green}
        at={c[1]}
        strike={rule}
        lines={[
          ["listen", "true"],
          ["port", "47420"],
        ]}
      />
      <FileCard
        x={1020}
        name="cli.toml"
        where="every machine"
        reader="read by the shipyard command"
        color="#B9B6AA"
        at={c[2]}
        strike={rule}
        lines={[
          ["app-machine", '"my-mac"'],
          ["app-port", "47420"],
        ]}
      />
      <Chip x={620} y={800} text="no setting appears in both" color={C.ink} at={c[3]} size={34} solid />
    </Scene>
  );
};
