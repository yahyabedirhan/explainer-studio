import { loadFont } from "@remotion/google-fonts/Inter";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverScene } from "../lib/timing";

const { fontFamily } = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

type Props = {
  readonly scene: VoiceoverScene;
  readonly style?: React.CSSProperties;
};

const sentences = (text: string) => text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()) ?? [];
const wordCount = (sentence: string) => sentence.split(/\s+/).filter(Boolean).length;

// Start time, in seconds, of each shown sentence: the first spoken word of the
// matching sentence in `text`, or an even share of the scene when they don't line up.
const sentenceStarts = (scene: VoiceoverScene, shown: string[]) => {
  const spoken = sentences(scene.text);
  const words = scene.words ?? [];
  const total = spoken.reduce((n, s) => n + wordCount(s), 0);
  if (spoken.length !== shown.length || words.length !== total) {
    return shown.map((_, i) => (i * scene.durationSeconds) / shown.length);
  }
  let index = 0;
  return spoken.map((s) => {
    const start = words[index].start;
    index += wordCount(s);
    return start;
  });
};

// The scene's current caption sentence, small, bottom-left on a dark plate.
export const Captions: React.FC<Props> = ({ scene, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = sentences(scene.caption ?? scene.text);
  const starts = sentenceStarts(scene, shown);
  const current = Math.max(0, starts.filter((start) => frame >= start * fps).length - 1);

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 56,
        maxWidth: "60%",
        padding: "12px 20px",
        borderRadius: 10,
        backgroundColor: "rgba(10, 10, 12, 0.72)",
        color: "#FFFFFF",
        fontFamily,
        fontWeight: 500,
        fontSize: 30,
        lineHeight: 1.35,
        ...style,
      }}
    >
      {shown[current]}
    </div>
  );
};
