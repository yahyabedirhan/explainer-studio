import { useVideoConfig } from "remotion";
import { MapStage } from "../map";
import { Panel } from "../panel";
import { C, Chip, Scene, useCues } from "../parts";

const ID = "the-mac";

export const TheMac: React.FC = () => {
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  return (
    <Scene id={ID} kicker="01 · The Mac">
      <MapStage at={{ mac: 1, app: c[1], cmd: c[2], socket: c[3] + Math.round(1.2 * fps) }} />
      <Panel
        x={1060}
        y={200}
        w={760}
        at={c[1] + 10}
        groups={[
          {
            name: "shop",
            count: 2,
            rows: [
              { kind: "pr", no: "42", title: "feat: checkout with saved cards", meta: "2h" },
              { kind: "ping", no: "3", title: "Waiting for your input", meta: "agent · 4m", unseen: true },
              { kind: "ping", no: "2", title: "PR #42 is ready for review", meta: "agent · 9m", unseen: true },
            ],
          },
          {
            name: "blog",
            rows: [{ kind: "pr", no: "17", title: "docs: a post about release notes", meta: "1d" }],
          },
        ]}
      />
      <Chip x={160} y={690} text="an agent runs  shipyard …" color={C.ink} at={c[3]} size={24} />
    </Scene>
  );
};
