# Drawing: canvas

Needs `remotion`. A scene is one full-frame `<canvas>` that a `draw(ctx, { frame, fps, width, height })` function repaints from scratch on every frame: the code is the drawing. It fits hand-drawn and diagram-heavy shots where every line is drawn in code, and a still at any frame is exact. Mix it with `dom` scene by scene when a video needs both.

## The component

```tsx
import { useCallback } from "react";
import { CanvasScene, type DrawFn } from "@studio/components/CanvasScene";

const draw: DrawFn = useCallback((ctx, { frame, width, height }) => {
  // paint the whole frame from `frame` and the cue frames
}, [/* every cue frame */]);
return <CanvasScene draw={draw} fonts={FONTS} />;
```

- `draw` depends only on `frame` and the cue frames. List every cue in the `useCallback` dependencies.
- Pass `fonts`: the `waitUntilDone` of each `@remotion/google-fonts` `loadFont()` the drawing uses. Canvas text doesn't redraw when a font arrives, so the first frame waits for them.
- Draw back to front: background, guides, ground, props, moving things, characters, then the frame furniture (heading, dial).
- Measure anything that holds text with `ctx.measureText`; never a fixed width.
- Keep any rotation under about a quarter turn per frame; faster spins strobe and look frozen.

## Drawing helpers

`@studio/lib/sketch` holds pure, seeded helpers. Read the source when a signature matters.

| Helper | Does |
|---|---|
| `clamp`, `lerp`, `prog(frame, a, b)` | numbers, and a 0 to 1 ramp between two frames |
| `easeOut`, `easeInOut`, `backOut` | easing; `backOut` overshoots, for pops |
| `rng(seed)`, `noise2(x, y)` | seeded random numbers and value noise |
| `ellipse`, `rrect`, `quad`, `cubic` | shapes and curves as point lists |
| `along(pts, k)`, `partial(pts, p)`, `resample` | a point along a path, the drawn-on part of a path |
| `wobble`, `ink`, `fill`, `hatch`, `tracePath` | a boiling pen line, a wobbly fill, parallel-stroke shading |
| `typed(text, p)` | the typed-on part of a text |

## The storyboard switch

To draw each scene's end pose before any motion exists (step 9), time every reveal through a ramp that a switch can hold at 1:

```ts
// <root>/<slug>/draw/ramp.ts
import { makeRamp } from "@studio/looks/paper-blueprint";
import { STORYBOARD } from "../config";   // export const STORYBOARD = true; at the end of config.ts
export const ramp = makeRamp(STORYBOARD);
```

While `STORYBOARD` is true, `ramp(frame, a, b)` is always 1, so every frame shows the end pose. Design it so everything that moved is visible where it ends up, and a thrown or carried thing rests where it lands. Set `STORYBOARD = false` to animate: the end pose and the motion share one `draw`.
