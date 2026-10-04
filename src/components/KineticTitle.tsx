import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "900"],
  subsets: ["latin"],
});

type Props = {
  readonly kicker: string;
  readonly words: string[];
  readonly accent: string;
  readonly background?: string;
  readonly ink?: string;
};

// Left-aligned heavy type, each word rising out of a mask, with a hard accent bar.
export const KineticTitle: React.FC<Props> = ({
  kicker,
  words,
  accent,
  background = "#0B0B0C",
  ink = "#F4F1EA",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  return (
    <AbsoluteFill
      style={{ backgroundColor: background, color: ink, fontFamily, padding: 140 }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {kicker}
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", columnGap: 40 }}>
        {words.map((word, i) => (
          <div key={word + i} style={{ overflow: "hidden", paddingBottom: 12 }}>
            <div
              style={{
                fontSize: 190,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: -6,
                translate: interpolate(
                  frame,
                  [i * 4, i * 4 + 0.6 * fps],
                  ["0px 110%", "0px 0%"],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
                ),
              }}
            >
              {word}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 48,
          height: 18,
          backgroundColor: background === accent ? ink : accent,
          width: interpolate(frame, [0.2 * fps, 1.1 * fps], ["0%", "45%"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      />
    </AbsoluteFill>
  );
};
