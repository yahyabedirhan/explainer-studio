# Look: paper-blueprint

Warm **paper** storybook shots and navy **blueprint** diagram shots, alternating with hard cuts. A red tomato robot carries the story on paper and turns into a glowing outline robot on blueprint. It fits a concept or process explained in 10 to 60 seconds; it is a poor fit for a walkthrough of a real product, which wants real screens.

## Intent

- **Two grounds, alternating.** Paper for actors and actions, blueprint for structure and data. Switch on every cut, so each cut reads as a new idea. Two shots: paper then blueprint, or the reverse.
- **One metaphor per concept.** Each shot acts its concept out as a picture (a padlocked tunnel, a sleepy server woken by "hello"), never a label naming it.
- **A drawn line.** On paper, a two-pass pen line that wobbles and boils about 8 times a second. On blueprint, a clean line with a soft glow.
- **Frame furniture.** Every shot has a lowercase heading that types on at top left, and a stage dial at top right. Keep the action between y 250 and 950 of a 1920x1080 frame.
- **Motion.** Paths drawing on with a sparkle at the head, objects thrown on arcs, back-out pops, type-on labels, a slow push. Hard cuts, no transitions.
- **Film cadence.** 24 fps gives the boiling line its feel.
- **Avoid.** Text that grows or overflows while typing, props floating unattached, trails left after a flight, a stretch where the voice talks and nothing moves.

### Paper: actors and actions

| Part | Value |
|---|---|
| Paper | `#EFE6D2`, grain specks |
| Stripes | `#BCCACF` for talking and networks (default), `#EAD892` for making and building |
| Line | ink `#2B2622`, wobbling and boiling |
| Shading | parallel pen strokes clipped to a shape; hatched ellipses as ground shadows |
| Accents | red `#D9533F`, gold `#E2B23C` |
| Ground | a pen line across the frame with tufts, at y 860 to 880 |
| Guide | a faint drafting circle and crosshair behind the action |

### Blueprint: structure and data

| Part | Value |
|---|---|
| Background | navy radial `#232B63` to `#0E1232`, grid, rulers, corner brackets, a slow dashed ring |
| Line | `#C9D0F5`, clean, with a soft glow |
| Accents | teal `#7FE0D2` for answers and data, pink `#D2457E` for a relation or highlight, white sparkles |
| Text in boxes | a glowing mono pill, sized to its full text so it never grows while typing |
| Nodes | a ticked ring that pops in, with an icon inside |

Type: Inter 600 for headings, Inter 500 for labels, IBM Plex Mono for anything typed into a pill or on a card.

### Brief: the metaphor list

The brief's look notes are one line per shot:

```text
<n>. <concept> | <paper or blueprint> | <metaphor> | <cue word> (<what it reveals>), ...
```

List each shot's cues in the order the narration says them. One or two short sentences per shot, 4 to 10 seconds each.

### Motion vocabulary

Every move is one of these, timed with `ramp(frame, cue, cue + n)` on a narration word; `n` is 6 to 16 frames at 24 fps.

| Move | How | Use for |
|---|---|---|
| Pop | scale by `backOut(ramp(...))` over 6 to 10 frames | anything appearing |
| Draw-on | `partial(pts, easeInOut(ramp(...)))`; on blueprint, a `sparkle` at `along(pts, k)` while `k < 1` | edges, paths, arrows |
| Arc | `along(quad(from, [midX, high], to), easeInOut(ramp(...)))`, a faint trail faded once it lands | anything sent, thrown or carried |
| Type-on | `typed(text, p)`, or `pill(..., { p })` | headings, labels, pills |
| Line boil | `boilOf(frame)` passed to every paper `ink` and `fill` | always, on paper |
| Slow push | scale 1 to about 1.04 over the shot, eased, around the action's centre | every shot |
| Hop | `footY - Math.sin(ramp(...) * Math.PI) * height`, `squash` on landing | the mascot celebrating or carrying |
| Flash ring | an ellipse growing and fading from a node | a snapshot, a commit, a "now" |

Small life on top: the mascot bobs and blinks by itself, `armUp` raises to throw or cheer.

### Sound

At 120 BPM, `whoosh` on throws and flights, `pop` on things appearing, `click` on things locking into place, `tick` on the first typed pill or label, `sting` (volume 0.5) on the final landing. The bed at volume 0.22.

## In each renderer

### remotion, canvas: built

`@studio/looks/paper-blueprint`, drawn on `CanvasScene` with `@studio/lib/sketch`: [../drawing/canvas.md](../drawing/canvas.md).

| Piece | Function |
|---|---|
| Paper | `paperBg(ctx, w, h, stripe)`, `ground(ctx, w, y, boil)`, `guides(ctx, cx, cy, r)`; stripes `STRIPE_BLUE`, `STRIPE_YELLOW` |
| Blueprint | `blueprintBg(ctx, w, h, frame)`, `line(ctx, pts, { w, col, alpha, dash, offset })`, `glow(ctx, col, blur, draw)` |
| Text | `pill(ctx, text, cx, cy, { size, p, bar, highlight })`, `label(ctx, text, x, y, p, col, size)` |
| Nodes and travel | `node(ctx, cx, cy, r, p, frame, inner)`, `hexes`, `book`, `sparkle(ctx, x, y, s, frame)` |
| Frame furniture | `heading(ctx, text, p, theme)`, `dial(ctx, label, k, theme)` |
| Cast | `mascot(ctx, cx, footY, { boil, frame, mood, armUp, squash, scale })` returns its right hand's position: hang held props on it. Moods `determined`, `happy`, `calm`. `robotOutline(ctx, cx, cy, s, frame)` on blueprint |
| Props | `envelope`, `server` (sleeps with Zs, wakes with `awake`), `certificate`, `key`, `padlock`, `bubble`. A new prop goes in `<root>/<slug>/draw/props.ts`, from `rrect`, `ellipse`, `quad`, `fill`, `ink` and `hatch`, with its own `seed` range |
| Colours and type | `INK`, `PAPER`, `RED`, `GOLD`, `NAVY`, `LINE`, `TEAL`, `PINK`; `FONTS` for `CanvasScene`; `boilOf(frame)`; `makeRamp` for the storyboard switch |

A scene, to copy:

```tsx
import { Audio } from "@remotion/media";
import { useCallback } from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { CanvasScene, type DrawFn } from "@studio/components/CanvasScene";
import { getScene } from "@studio/lib/timing";
import { useWord } from "@studio/lib/words";
import { backOut, easeInOut, lerp } from "@studio/lib/sketch";
import { boilOf, dial, FONTS, ground, heading, mascot, paperBg } from "@studio/looks/paper-blueprint";
import { ramp } from "../draw/ramp";
import voiceover from "../voiceover.json";

const ID = "<scene id>";
const sfx = (name: string) => staticFile(`<slug>/assets/sound/${name}.wav`);

export const Shot: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const scene = getScene(voiceover, ID);
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
      {/* Effects: add them in step 10, once assets/sound/ exists. */}
      <Sequence from={Math.max(0, first)} durationInFrames={fps} premountFor={fps}>
        <Audio src={sfx("pop")} volume={0.5} />
      </Sequence>
    </>
  );
};
```

Draw the heading and dial after `ctx.restore()`, so the push leaves them still.

The asset sheet, `<root>/<slug>/Sheet.tsx`: paper on the left, blueprint on the right. `<root>/sketchbook-demo/Sheet.tsx` is a full example, on the machine that made it.

```tsx
import { useCallback } from "react";
import { CanvasScene, type DrawFn } from "@studio/components/CanvasScene";
import { blueprintBg, FONTS, heading, mascot, paperBg, pill } from "@studio/looks/paper-blueprint";

const Sheet: React.FC = () => {
  const draw: DrawFn = useCallback((ctx, { width, height }) => {
    const half = width * 0.56;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, half, height);
    ctx.clip();
    paperBg(ctx, width, height);
    heading(ctx, "asset sheet", 1, "paper");
    // palette swatches, the mascot in every pose the video uses, every paper prop
    mascot(ctx, 200, 560, { boil: 0, frame: 10, mood: "happy", scale: 0.8 });
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(half, 0, width - half, height);
    ctx.clip();
    blueprintBg(ctx, width, height, 0);
    // every blueprint pill, node and line the video uses
    pill(ctx, "example", half + 300, 360, { size: 30 });
    ctx.restore();
  }, []);
  return <CanvasScene draw={draw} fonts={FONTS} />;
};

export default Sheet;
```

### remotion, dom: not built yet

### fframes: not built yet
