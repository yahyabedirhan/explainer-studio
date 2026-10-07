# The sketchbook look

Two looks, one per shot, alternating on every cut. The frame is 1920x1080; keep the action between y 250 and 950, clear of the heading (top left) and the dial (top right). Everything is drawn on a canvas by the functions below, imported from `src/styles/sketchbook` (style) and `src/lib/sketch` (geometry). Read the source when a signature matters.

## Paper: actors and actions

| Part | Value | Function |
|---|---|---|
| Paper | `PAPER` #EFE6D2, grain specks | `paperBg(ctx, w, h, stripe)` |
| Stripes | `STRIPE_BLUE` #BCCACF for talking and networks (default), `STRIPE_YELLOW` #EAD892 for making and building | the `stripe` argument |
| Line | `INK` #2B2622, a two-pass pen line that wobbles and boils | `ink(ctx, pts, { w, col, closed, boil, seed, passes, dash })`, `fill(ctx, pts, col, amp, seed, boil)` |
| Shading | parallel pen strokes clipped to a shape; hatched ellipses as ground shadows | `hatch(ctx, pts, { gap, angle, alpha })` |
| Accents | `RED` #D9533F, `GOLD` #E2B23C | |
| Ground | a pen line across the frame with tufts, usually at y 860 to 880 | `ground(ctx, w, y, boil)` |
| Guide | a faint drafting circle and crosshair behind the action | `guides(ctx, cx, cy, r)` |

**Cast**: `mascot(ctx, cx, footY, { boil, frame, mood, armUp, squash, scale })` draws the red tomato robot standing on `footY` and returns its right hand's position. Hang anything it holds on that point. Moods: `determined` (frowning brows), `happy`, `calm`. `armUp` 0 to 1 raises the right arm; `squash` 0 to 1 flattens it on landing.

**Props** (`props.ts`): `envelope`, `server` (sleeps with drifting Zs, wakes with `awake` 0 to 1), `certificate`, `key`, `padlock`, `bubble` (a word balloon in mono). A prop the style lacks goes in `<root>/<slug>/draw/props.ts`, built from `rrect`, `ellipse`, `quad`, `fill`, `ink` and `hatch` with the pen line. Give each prop its own `seed` range so their wobbles differ.

## Blueprint: structure and data

| Part | Value | Function |
|---|---|---|
| Background | navy radial #232B63 to #0E1232, grid, rulers, corner brackets, a slow dashed ring | `blueprintBg(ctx, w, h, frame)` |
| Line | `LINE` #C9D0F5, clean, with a soft glow | `line(ctx, pts, { w, col, alpha, dash, offset })`, `glow(ctx, col, blur, draw)` |
| Accents | `TEAL` #7FE0D2 for answers and data, `PINK` #D2457E for a relation or highlight, white sparkles | |
| Text in boxes | a glowing mono pill, sized to its full text so it never grows while typing | `pill(ctx, text, cx, cy, { size, p, bar, highlight })` |
| Nodes | a ticked ring that pops in, with an icon inside | `node(ctx, cx, cy, r, p, frame, inner)`, `hexes`, `book` |
| Travel | a four-point star at the head of a path being drawn | `sparkle(ctx, x, y, s, frame)` |
| Cast | the mascot as a glowing outline robot | `robotOutline(ctx, cx, cy, s, frame)` |

## Every shot

- `heading(ctx, text, p, theme)`: a lowercase name for the step ("git add", "dns lookup"), typing on over the first 10 to 14 frames, with a short underline.
- `dial(ctx, label, k, theme)`: the chapter at top right ("1 · fetch"); `k` fills from the shot's share of the video.
- `label(ctx, text, x, y, p, col, size)`: a centred Inter label that types on. Use `#DDE1FF` on blueprint.
- Type: Inter 600 for headings, Inter 500 for labels, IBM Plex Mono for anything typed into a pill or on a card. Pass `FONTS` to `CanvasScene` so the first frame waits for them.

## Asset sheet skeleton

`<root>/<slug>/Sheet.tsx`, rendered with `npm run still -- <slug> sheet-assets --sheet` to `<root>/<slug>/out/sheet-assets.png`. Paper on the left, blueprint on the right; `<root>/sketchbook-demo/Sheet.tsx` is a full example if it exists on this machine.

```tsx
import { useCallback } from "react";
import { CanvasScene, type DrawFn } from "@studio/components/CanvasScene";
import { blueprintBg, FONTS, heading, mascot, paperBg, pill } from "@studio/styles/sketchbook";

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
