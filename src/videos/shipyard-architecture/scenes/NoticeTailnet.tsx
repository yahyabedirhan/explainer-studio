import { useVideoConfig } from "remotion";
import { LANE, Lane } from "../lane";
import { Banner, C, Chip, Packet, Scene, Terminal, useCues } from "../parts";

const ID = "notice-tailnet";

export const NoticeTailnet: React.FC = () => {
  const { fps } = useVideoConfig();
  const c = useCues(ID);
  const s = (i: number, sec = 0) => Math.max(1, c[i] + Math.round(sec * fps));
  const send = s(1, 2.6);
  const span = c[3] - c[2];
  const step = (k: number) => c[2] + Math.round(span * k);
  const reply = s(3, 0.2);
  return (
    <Scene id={ID} kicker="Road 3 · Over the tailnet">
      <Lane
        at={{ mac: 0, listener: 0, app: 0, config: 0, band: 0, serve: 0, server: 0, serverCmd: 0, cli: s(1, 0.4), wires: s(1, 1.6) }}
      />
      <Terminal
        x={100}
        y={96}
        w={900}
        fontSize={22}
        title="agent · server one"
        at={s(0)}
        lines={[
          { kind: "cmd", text: 'shipyard notify "Tests passed"', at: s(1) },
          { kind: "out", text: "shown", at: reply + Math.round(0.8 * fps) },
          { kind: "cmd", text: 'shipyard notify "Done" --button "Pane=herdr"', at: s(4, 0.5) },
          { kind: "err", text: "exit 2: no Herdr action on the tailnet route", at: s(4, 2.2) },
        ]}
      />
      <Packet points={[LANE.cmdOut, LANE.serveIn]} from={send} to={c[2]} color={C.blue} label="notice" />
      <Packet points={[LANE.serveOut, LANE.listenerIn]} from={step(0.05)} to={step(0.2)} color={C.blue} label="+ login" />
      <Packet points={[LANE.listenerDown, LANE.appIn]} from={step(0.25)} to={step(0.4)} color={C.blue} />
      <Chip x={1440} y={740} text="login ✓ · rules ✓" color={C.green} at={step(0.45)} solid size={24} />
      <Banner at={step(0.6)} x={1300} y={150} title="shop · Tests passed" body="from server one" from="agent" />
      <Chip x={700} y={560} text="≈ 1 second" color={C.blue} at={step(0.62)} size={26} />
      <Packet points={[LANE.serveIn, LANE.cmdOut]} from={reply} to={reply + Math.round(0.8 * fps)} color={C.green} label="shown" />
    </Scene>
  );
};
