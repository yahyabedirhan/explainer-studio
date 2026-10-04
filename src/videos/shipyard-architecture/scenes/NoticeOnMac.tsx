import { useVideoConfig } from "remotion";
import { Banner, C, Chip, Node, Packet, Region, Scene, Terminal, Wire, useCues } from "../parts";

const ID = "notice-on-mac";

export const NoticeOnMac: React.FC = () => {
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const hand = s(2, 0.3);
  const rules = s(3, 0.4);
  const shown = s(3, 3.2);
  return (
    <Scene id={ID} kicker="Road 1 · On the Mac">
      <Region x={100} y={460} w={1720} h={420} label="Your Mac" color={C.green} at={s(0)} />
      <Terminal
        x={100}
        y={150}
        w={1080}
        title="agent · shop"
        at={s(1)}
        lines={[
          { kind: "cmd", text: 'shipyard notify "Tests passed" --body "40 of 40"', at: s(1, 0.3) },
          { kind: "out", text: "shown", at: s(4, 0.2) },
        ]}
      />
      <Node x={160} y={560} w={360} h={130} label="shipyard notify" sub="the command" color={C.green} code at={s(1, 0.5)} />
      <Node x={720} y={560} w={420} h={130} label="Shipyard app" sub="files it under shop" color={C.green} at={hand} />
      <Node x={1340} y={560} w={420} h={130} label="shop's rules" sub="agent.notice? yes" color={C.green} at={rules} />
      <Wire points={[[520, 625], [716, 625]]} color={C.green} at={hand} label="control.sock" labelAt={[618, 600]} />
      <Wire points={[[1140, 625], [1336, 625]]} color={C.green} at={rules} />
      <Packet points={[[520, 625], [716, 625]]} from={hand} to={hand + Math.round(0.7 * fps)} color={C.green} label="notice" />
      <Packet points={[[1140, 625], [1336, 625]]} from={rules} to={rules + Math.round(0.7 * fps)} color={C.green} />
      <Chip x={1340} y={730} text="notices off → refused, exit 1" color={C.muted} at={s(3, 1.6)} size={22} />
      <Banner at={shown} x={1300} y={170} title="shop · Tests passed" body="40 of 40" from="agent" />
    </Scene>
  );
};
