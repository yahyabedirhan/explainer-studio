# Shaders

Can the studio use GPU shader effects in its videos, with every frame a pure function of the Remotion frame? Spike of 2026-10-07. Yes, through `src/components/Shader.tsx`, with the conditions below. The step-by-step workflow is the [`shader-video` skill](../skills/shader-video/SKILL.md); this page holds the why.

## What was tried

- **The `shaders` package**: [shader-effects-inc/shaders](https://github.com/shader-effects-inc/shaders) at `935f71a7789f0e07811dfe6fd0d8f707e9848238`, installed from npm as `shaders@4.0.0`, whose `gitHead` is that same commit. It brings `typegpu@0.12.3`. Together they add 39 MB to `node_modules`.
- **Remotion** `4.0.532` with its Chrome Headless Shell 149, on an Apple M3 Pro.
- **A 32 s test video**, "what is a shader", told with ten of the package's effects: `FlowingGradient` under `Vignette`, `Plasma` under an animated `Pixelate`, `Aurora` (full frame and two frozen panels), `MeshGradient` under `Halftone` under `ChromaticAberration`, and `Godrays` under a closing `IrisWipe`. Kokoro narration, `npm run sound`, word-cued reveals and captions. It stays in the ignored `videos/shaders-spike/`.

## The package's model

- **WebGPU only.** The engine is written in TypeGPU and compiles each stack of effects to WGSL at runtime. There is no WebGL fallback: without a WebGPU adapter it stops and reports `no-adapter`.
- **Effects are layers.** About 200 effects, each with a role: a generator or shape draws by itself; a material, filter or warp changes the layers nested in its `children`; a simulation steps from its previous frame. The same tree is the preset JSON the shaders.com editor exports (`{ type, props, children }`).
- **Two clocks.** A global clock, read as `performance.now()` minus a time origin, and a per-layer clock for effects with a `speed` prop, which adds `deltaTime x speed` on each draw. Most animated effects (`FlowingGradient`, `Aurora`, `MeshGradient`) use the per-layer one.
- **Framework bindings** (`shaders/react`, `vue`, `svelte`, `solid`, `js`) wrap one core renderer, `shaderRendererGPU` in `shaders/core`, and drive it with a `requestAnimationFrame` loop on the wall clock. The core also has `renderSyntheticFrame(deltaSeconds)`, "the deterministic path behind frame-locked video export".
- **Effect definitions** are importable one by one as `shaders/core/<Effect>`. The `shaders/registry` export is serialised metadata for editors: its definitions have no shader code and fail to compose (`fragment is not a function`).

## Licence

The engine, every effect and the bindings in the repository and the npm package are MIT, Copyright (c) 2026 Shader Effects Inc. The design editor, presets, sections and Pro features at shaders.com have their own terms, and Pro presets need a partner API key. The studio uses only the npm package, so effect code can be imported into this public repository. `src/components/Shader.tsx` and `skills/shader-video/effects.md` carry the attribution, and nothing from shaders.com is used.

## How the component works

`<Shader layers={[{ effect, props, children }]} time? width? height? />` drives the core renderer directly, with its own frame loop never started:

1. It starts the renderer once with `observeElement: false`, so no resize or visibility observer can restart the wall-clock loop, and holds a `delayRender` until it is ready.
2. Each frame, it pushes changed props into the live layers, or registers the layers again when their structure (effects, ids, nesting) changed.
3. It draws once at `seconds = frame / fps` and calls `continueRender`:
   - **Global clock**: time origin 0, and `performance.now()` held at `seconds x 1000` for the synchronous part of `renderSyntheticFrame`.
   - **Per-layer clocks**: `deltaTime = seconds - (the time they last reached)`, so they land on `seconds x speed`, whatever order frames are drawn in. They restart at 0 when the layers are registered again, and the component's tracker restarts with them.
4. After a prop change the renderer would schedule its own draw on the next animation frame, on the wall clock. The component stubs `requestAnimationFrame` once, while it registers the root layer; the renderer allows one pending self-scheduled draw, so all of them stay off.
5. After a structure change the renderer keeps showing the old stack until the new one has drawn once ("swap when ready"). The component draws twice on such a frame.

Points 3 to 5 depend on renderer internals, not on a documented API. That is why `shaders` is pinned exactly in `package.json`.

## What worked

- **Look.** The effects look finished at 1080p with defaults or small prop changes. Nesting filters (halftone over a gradient, colour split over both) needs no glue code, and props such as `Pixelate.scale` or `IrisWipe.progress` animate on narration words like any other value.
- **Determinism.** Two stills of one frame are byte-identical. Full renders at concurrency 1 and 6 match: 365 of 953 frames byte-identical, the rest within a rounding step of the per-layer clocks (PSNR at least 95 dB on PNG frames). No blank or out-of-order frame was found when scanning every frame's brightness.
- **Speed.** The 953-frame 1920x1080 video renders in 19 to 25 s wall at the default concurrency (6), and 56 to 59 s at concurrency 1. A still takes 2 to 3 s.
- **Telemetry.** The bindings send 5 % sampled telemetry to shaders.com from non-localhost pages. The core renderer that the component uses never loads the telemetry module.

## What didn't

- **The package's own `<Shader>`** animates on the wall clock and exposes no time. In a render it would flicker, so it is not used.
- **Remotion's default OpenGL setting.** Without `--gl=angle` the WebGPU canvas is silently left out of the frame: the still shows only the CSS behind it. `remotion.config.ts` now sets ANGLE for every render.

  | `--gl` | Result |
  |---|---|
  | not set | Renders, but the shader is missing from the frame |
  | `angle` | Correct |
  | `swangle` | Correct, the same picture as `angle` (PSNR 67 dB) |
  | `swiftshader`, `vulkan` | Fails with `no-adapter` |

- **First attempt at time control** drew every frame with `deltaTime = 1/fps`. Stills then showed every per-layer clock near 0, and a sequential render drifted far from a still of the same frame (PSNR 16 dB). Measuring frames against stills found it; the per-layer delta above fixed it.
- **Hard cuts between stacks** first showed the old stack for one frame at each cut, and only at some concurrencies. Drawing twice fixed it.
- **Simulations and pointer effects** (`Fog`, `Smoke`, `Particles`, `Boids`, `ReactionDiffusion`, the `Cursor*` effects and every other effect with the `simulation` role) step from their previous frame or read the mouse. They cannot be a function of the frame and are marked `no` in the catalogue. Media effects (`ImageTexture`, `VideoTexture`, `HTMLInCanvas`) are untested.
- **Changing a `speed` prop inside a scene** makes the picture depend on the frames drawn before. Keep speeds constant per scene.

## Skill test

A fresh agent got only an idea ("why the sky is blue, in ten seconds") and the path to `skills/shader-video/SKILL.md`. It produced a 10.9 s, three-scene video from `Godrays`, `ChromaticAberration`, `SineWave`, `Vignette`, `IrisWipe` and `MeshGradient`, with narration, captions, sound and word cues. The frame count matched the summed scenes, and its two-still checks matched. It went wrong in two places, and the skill was changed for both:

- `MeshGradient` ignored its `colorA` and `colorB`: a default `stops` palette overrides them. The catalogue now flags the effects whose default stops do this.
- `IrisWipe` hid the picture from the centre when the agent wanted a circle to open: `progress` 1 means wiped away. `patterns.md` now gives the direction for opening and closing.

It also had to guess the words-per-second budget for a target length, the sound length at fps other than 30, and when to take stills after a cue; the skill now states each. The Remotion skill's `Interactive.withSchema` advice, which the studio does not follow, is now a row in the `AGENTS.md` overrides table.

## Troubleshooting

- **The still shows only the background colour.** The render ran without ANGLE (check `remotion.config.ts`, or pass `--gl=angle`), or the renderer stopped: `<Shader>` fails the render with `the WebGPU renderer stopped (<reason>)` when it reports one.
- **`fragment is not a function`** in a browser error: an effect definition came from `shaders/registry`. Import it from `shaders/core/<Effect>`.
- **Two renders of one frame differ visibly.** An effect in the stack keeps state. Swap it for one marked `tested` or `yes` in `skills/shader-video/effects.md`.

## Install log

```sh
git clone https://github.com/shader-effects-inc/shaders ~/Developer/open-source/shaders   # reading only
npm install shaders@4.0.0 --save-exact
```

No global tools were installed.

## Recommendation

Adopt shaders as an optional video style, the way this branch does:

1. Keep `src/components/Shader.tsx` as the only way videos use the package, ANGLE in `remotion.config.ts`, and `shaders` pinned exactly.
2. Make shader videos through `skills/shader-video/SKILL.md`, choosing effects from its catalogue, which `npm run shader-catalogue` regenerates.
3. On each `shaders` upgrade, regenerate the catalogue, then render this page's checks again: two stills of one frame byte-identical, and a still against the same frame of a full render.
4. Ask upstream for a public "draw at time t" call that sets both clocks. It would retire the `performance.now()` and `requestAnimationFrame` stubs, the only fragile part.

For effects on footage or screenshots (blur, duotone, glitch over a real UI capture), Remotion's own `@remotion/effects` and `createEffect()` fit better, since they filter a media element directly. The `shaders` package is the right tool for generated backgrounds, textures and transitions.
