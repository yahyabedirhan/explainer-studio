# Shader scene patterns

Code shapes for a scene that uses `src/components/Shader.tsx`. Paths are from `videos/<slug>/scenes/`.

## A scene

```tsx
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { componentDefinition as Pixelate } from "shaders/core/Pixelate";
import { componentDefinition as Plasma } from "shaders/core/Plasma";
import { Captions } from "../../../src/components/Captions";
import { Shader, type ShaderLayer } from "../../../src/components/Shader";
import { getScene } from "../../../src/lib/timing";
import { useWord } from "../../../src/lib/words";
import voiceover from "../voiceover.json";

const scene = getScene(voiceover, "pixels");

export const Pixels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const every = useWord(voiceover, "pixels", "every pixel");

  // A filter wraps the layers it changes in `children`. Props may change on every frame.
  const cells = interpolate(frame, [every, every + fps], [12, 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const layers: ShaderLayer[] = [
    { effect: Pixelate, props: { scale: Math.round(cells) }, children: [{ effect: Plasma, props: { speed: 1.2 } }] },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#14002b" }}>
      <Shader layers={layers} />
      {/* Typography and diagrams over the shader. */}
      <Captions scene={scene} />
      <Audio src={staticFile(scene.audioFile)} />
      <Sequence from={every} durationInFrames={fps} premountFor={fps}>
        <Audio src={staticFile("<slug>/assets/sound/click.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- Give the scene's `AbsoluteFill` a background colour close to the shader's darkest colour, so a frame before the first draw does not flash.
- `<Shader>` fills the composition. For a panel, pass `width` and `height` and put it in a positioned box with `overflow: hidden`.
- `time={2.5}` freezes the shader's clock; by default it is the scene's frame / fps, so each scene starts at time 0.

## Rules the component depends on

- **Keep `speed` props constant within a scene.** A layer's clock adds time x speed, so a changing speed makes the picture depend on the frames drawn before.
- **Hard cuts between stacks are fine.** Changing which effects are in `layers` (adding a filter on a word) rebuilds the stack; the component draws twice so the frame shows the new stack.
- **Ids stay stable on their own.** A layer's id comes from its place in the tree. Give `id` yourself only when the same layer moves to a different place, as when a filter starts wrapping it.
- **Layer props**: any effect prop from its `index.d.ts`, plus `opacity`, `blendMode`, `visible`, `transform`, `maskSource` and `maskType`.
- **Colours** are hex strings. Positions are `{ x, y }` in 0 to 1, y down.

## Sound on cues

```tsx
// Video.tsx: the bed under the whole video, faded at both ends, and the sting at the end.
<Audio
  src={staticFile("<slug>/assets/sound/bed.wav")}
  volume={(f) => interpolate(f, [0, fps, total - 2 * fps, total], [0, 0.14, 0.14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
/>
<Sequence from={total - Math.round(3.2 * fps)} premountFor={fps}>
  <Audio src={staticFile("<slug>/assets/sound/sting.wav")} volume={0.35} />
</Sequence>
```

`total` is `totalFrames(voiceover, fps)` from `src/lib/timing.ts`. Use `whoosh.wav` on a scene's first frame, `pop.wav` on a word that reveals something, and `click.wav` or `tick.wav` on small changes.
