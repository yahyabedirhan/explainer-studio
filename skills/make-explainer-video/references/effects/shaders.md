# Effect: shaders

GPU shader effects behind or over a video's own scenes: gradients, noise, halftone, light rays, wipes. Use one when the effect carries the idea the narration explains, never as decoration added for its own sake. Shaders are experimental: which effect looks right is a matter of taste, so the user picks every effect from a prototype sheet before any scene is built.

## Options in each renderer

- **remotion, `Shader`:** effects from the `shaders` package (WebGPU), through `@studio/components/Shader`, drawn one frame at a time. The catalogue of about 200 effects, with their props and whether each is safe to draw per frame, is [shaders-catalogue.md](shaders-catalogue.md).
- **remotion, `ShaderLayer`:** your own GLSL fragment shader on a WebGL canvas, with Shadertoy-style uniforms, through `@studio/components/ShaderLayer`.
- **fframes:** `Shader::sksl(src)` or `Shader::shadertoy(glsl)`, placed as an SVG `<image>`: see the `fframes-video` skill.

## Prototype sheet: the user picks

Before building any scene with shaders:

1. Shortlist six to ten candidate stacks from the catalogue for the brief's scenes. Use effects marked `tested` or `yes`; an effect marked `check` only after two stills of one frame come out byte-identical. Leave out `no`.
   - One generator per stack, plus at most two filters nested over it. Each candidate carries an idea: `Pixelate` for "pixels", `IrisWipe` to close, `Halftone` for print. Read each effect's props in `node_modules/shaders/dist/core/shaders/<Effect>/index.d.ts`.
2. Draw the shortlist on the asset sheet, `Sheet.tsx`: one labelled row per candidate in the brief's palette, each row showing the stack at three times through `<Shader time={...}>` (start, middle, end). Render it with `npm run still -- <slug> shader-sheet --sheet` and look at `out/shader-sheet.png`.
3. Show the sheet to the user and ask which candidates to use, for which scenes. Write their picks and the reason into the brief's look notes. A scene the user leaves without a pick gets no shader.
   - **When nobody can answer:** pick at most two, and write why into the brief.

## A scene with `Shader`

```tsx
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { componentDefinition as Pixelate } from "shaders/core/Pixelate";
import { componentDefinition as Plasma } from "shaders/core/Plasma";
import { Captions } from "@studio/components/Captions";
import { Shader, type ShaderLayer } from "@studio/components/Shader";
import { getScene } from "@studio/lib/timing";
import { useWord } from "@studio/lib/words";
import voiceover from "../voiceover.json";

export const Pixels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = getScene(voiceover, "pixels");
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
- Import effects only from `shaders/core/<Effect>`. One from `shaders/registry` fails with `fragment is not a function`.

## A layer with `ShaderLayer`

Your own GLSL ES 1.0 fragment shader: write `void main()` and set `gl_FragColor`, with premultiplied alpha. It gets `iResolution` (pixels), `iTime` and `iFrame` (since the layer's `Sequence` started), and each entry of `uniforms` as a float, vec2, vec3 or vec4 by array length.

```tsx
import { ShaderLayer } from "@studio/components/ShaderLayer";

const GLOW = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 tint;
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  float a = 0.5 + 0.5 * sin(iTime + uv.x * 6.0);
  gl_FragColor = vec4(tint * a, a);
}`;

<ShaderLayer fragment={GLOW} width={1920} height={1080} uniforms={{ tint: [1, 0.4, 0.1] }} />
```

`@studio/components/Shader` also exports a type named `ShaderLayer`. In a scene that uses both, alias one: `import { Shader, type ShaderLayer as ShaderStack } from "@studio/components/Shader"`.

## Rules the component depends on

- **Keep `speed` props constant within a scene.** A layer's clock adds time × speed, so a changing speed makes the picture depend on the frames drawn before.
- **Hard cuts between stacks are fine.** Changing which effects are in `layers` rebuilds the stack; the component draws twice so the frame shows the new stack.
- **Ids stay stable on their own.** Give `id` yourself only when the same layer moves to a different place, as when a filter starts wrapping it.
- **Layer props**: any effect prop from its `index.d.ts`, plus `opacity`, `blendMode`, `visible`, `transform`, `maskSource` and `maskType`. Colours are hex strings. Positions are `{ x, y }` in 0 to 1, y down.

## Effect gotchas

- **`stops` wins over `colorA` and `colorB`.** Gradients with a `stops` prop (`MeshGradient` and others) default to a warm palette. Pass `stops: null` to use `colorA` and `colorB`, or your own `stops`, for example `[{ color: "#0b3d91", position: 0 }, { color: "#4f8ef7", position: 1 }]`.
- **Wipes hide as `progress` rises.** On `IrisWipe` and the other wipes, `progress` 0 shows the child and 1 has wiped it away from the centre. To open a circle from the centre, set `invert: true` and animate `progress` from 1 to 0; to close one, `invert: true` from 0 to 1.

## Checks

- Render a still at each shader scene's first frame and about ten frames after each cue. Render one frame twice and compare with `md5`: the two files match.
- **The still shows only the background colour:** the render ran without ANGLE (`remotion.config.ts` sets `--gl=angle`), or the renderer stopped: `<Shader>` fails the render with `the WebGPU renderer stopped (<reason>)`.
- **Two renders of one frame differ visibly:** an effect in the stack keeps state. Swap it for one marked `tested` or `yes`.
