import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  readonly text: string;
  readonly from: number;
  // The frame the last character lands on. Leave it out to type at `charsPerSecond`.
  readonly to?: number;
  readonly charsPerSecond?: number;
  readonly caret?: boolean;
  readonly caretColor?: string;
  readonly style?: React.CSSProperties;
};

// Types `text` out character by character, with a caret that blinks only while idle.
export const Typewriter: React.FC<Props> = ({
  text,
  from,
  to,
  charsPerSecond = 24,
  caret = true,
  caretColor = "currentColor",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Array.from(text);
  const end = to ?? from + (chars.length / charsPerSecond) * fps;
  const shown = Math.floor(
    interpolate(frame, [from, end], [0, chars.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typing = frame >= from && frame < end;
  // Idle caret: on for half a second, off for half a second.
  const caretOn = typing || Math.floor((frame - from) / (fps / 2)) % 2 === 0;

  return (
    <span style={{ whiteSpace: "pre-wrap", ...style }}>
      {chars.slice(0, shown).join("")}
      {caret ? (
        <span
          style={{
            display: "inline-block",
            width: "0.08em",
            height: "1.1em",
            marginLeft: "0.06em",
            verticalAlign: "-0.15em",
            backgroundColor: caretColor,
            opacity: caretOn ? 1 : 0,
          }}
        />
      ) : null}
    </span>
  );
};
