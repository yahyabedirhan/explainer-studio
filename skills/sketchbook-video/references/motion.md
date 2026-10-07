# Sketchbook motion

## Vocabulary

Every move is one of these. Time each with `ramp(frame, cue, cue + n)` on a narration word (`useWord`); `n` is 6 to 16 frames at 24 fps.

| Move | How | Use for |
|---|---|---|
| **Pop** | scale by `backOut(ramp(...))` over 6 to 10 frames around the point | anything appearing: a prop, a node, a pill, a post |
| **Draw-on** | `partial(pts, easeInOut(ramp(...)))`; on blueprint, a `sparkle` at `along(pts, k)` while `k < 1` | edges, paths, arrows, tubes |
| **Arc** | `along(quad(from, [midX, high], to), easeInOut(ramp(...)))`, with a faint `partial` trail faded out once it lands | anything sent, thrown or carried |
| **Type-on** | `typed(text, p)`, or `pill(..., { p })` | headings, labels, pills; type a hash after its name with a second cue |
| **Line boil** | `boilOf(frame)` passed to every paper `ink` and `fill` | always on paper: the line re-seeds 8 times a second |
| **Slow push** | scale 1 to about 1.04 over the shot, eased, around the action's centre | every shot |
| **Hop** | `footY - Math.sin(ramp(...) * Math.PI) * height`, `squash` on landing | the mascot celebrating or carrying |
| **Flash ring** | an ellipse growing and fading from a node | a snapshot, a commit, a "now" |
| **Hard cut** | consecutive `<Series.Sequence>`s with no transition | between shots, always with a change of look |

Keep any rotation under about a quarter turn per frame (6 turns a second at 24 fps); faster spins strobe and look frozen.

Small life on top: the mascot bobs and blinks by itself, `armUp` raises to throw or cheer, a sleeping thing has Zs.

## Scene skeleton

One file per shot in `<root>/<slug>/scenes/`. Copy this and fill in the shot:

```tsx
import { Audio } from "@remotion/media";
import { useCallback } from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { CanvasScene, type DrawFn } from "@studio/components/CanvasScene";
import { getScene } from "@studio/lib/timing";
import { useWord } from "@studio/lib/words";
import { backOut, easeInOut, lerp } from "@studio/lib/sketch";
import { boilOf, dial, FONTS, ground, heading, mascot, paperBg } from "@studio/styles/sketchbook";
import { ramp } from "../draw/ramp";
import voiceover from "../voiceover.json";

const ID = "<scene id>";
const scene = getScene(voiceover, ID);
const sfx = (name: string) => staticFile(`<slug>/assets/sound/${name}.wav`);

export const Shot: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const first = useWord(voiceover, ID, "<cue word>");

  const draw: DrawFn = useCallback(
    (ctx, { frame, width, height }) => {
      const boil = boilOf(frame);
      paperBg(ctx, width, height);
      const push = lerp(1, 1.04, easeInOut(frame / durationInFrames));
      ctx.save();
      ctx.translate(width / 2, height * 0.6);
      ctx.scale(push, push);
      ctx.translate(-width / 2, -height * 0.6);

      ground(ctx, width, 870, boil);
      const k = backOut(ramp(frame, first - 2, first + 6));
      // ... draw the shot; each reveal scales or draws on by its own ramp
      mascot(ctx, 500, 870, { boil, frame, mood: "happy" });

      ctx.restore();
      heading(ctx, "<step name>", ramp(frame, 2, 12), "paper");
      dial(ctx, "1 · <chapter>", frame / durationInFrames, "paper");
    },
    [durationInFrames, first],
  );

  return (
    <>
      <CanvasScene draw={draw} fonts={FONTS} />
      <Audio src={staticFile(scene.audioFile)} />
      {/* Effects: add in the sound step, once assets/sound/ exists. */}
      <Sequence from={first} durationInFrames={fps} premountFor={fps}>
        <Audio src={sfx("pop")} volume={0.5} />
      </Sequence>
    </>
  );
};
```

Rules the skeleton relies on:

- `draw` depends only on `frame` and the cue frames; list every cue in the `useCallback` dependencies.
- Draw the heading and dial after `ctx.restore()`, so the push leaves them still.
- Draw back to front: background, guides, ground, props, flying things, the mascot, then the heading and dial.
- Find positions with `ctx.measureText` for anything holding text; never a fixed width.
- A `Sequence` cue frame below 0 fails; start effects at `Math.max(0, cue - n)`.
