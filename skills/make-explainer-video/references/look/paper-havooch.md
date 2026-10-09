# Look: paper-havooch

Paper-blueprint's shapes and motion in the colours of Havooch's logo, with Havuç, Havooch's orange tabby, as the mascot. Warm **paper** storybook shots and dark brown **cocoa print** diagram shots alternate with hard cuts. It is made for videos about Havooch ([yahyabedirhan/havooch](https://github.com/yahyabedirhan/havooch)); the `havooch` preset picks it.

## Intent

Everything in [paper-blueprint](paper-blueprint.md)'s intent holds: two grounds that switch on every cut, one metaphor per concept, a two-pass pen line that boils about 8 times a second on paper and a clean glowing line on the dark ground, the heading and dial on every shot, the action between y 250 and 950, the motion vocabulary, hard cuts and 24 fps. What changes:

- **Colours.** Navy and teal become the logo's brown, carrot and nose pink. Blue stripes become peach.
- **The cast.** Havuç replaces the tomato robot: on paper, a hand-drawn cat; on the cocoa print, a glowing cream outline.
- **The dark ground is the cocoa print,** and its theme name is `"cocoa"` where paper-blueprint says `"blueprint"`.
- **Headings stay lowercase,** like "meet havooch". Write the name as "Havooch" when it stands alone on screen.

### Havuç

Drawn by hand from the logo (`assets/images/logo/v2-havuc/` in the Havooch repository), not traced from it. Keep its marks when you draw it again or pose it:

- big upright ears with peach insides;
- three short tabby stripes on the forehead;
- big dark eyes with one white catchlight each;
- a small pink nose and a "w" mouth;
- a white muzzle that runs up between the eyes.

The sketchbook adds a sitting body with a white bib, white paws and a curled tail, and a right paw it can raise to point or hold. It bobs and blinks by itself.

### Paper: actors and actions

| Part | Value |
|---|---|
| Paper | `#EFE6D2`, grain specks |
| Stripes | `#F4C9AE` peach for talking and networks (default), `#FFE9A8` butter for making and building |
| Line | ink `#2E1D14`, the logo's ink, wobbling and boiling |
| Shading | parallel pen strokes clipped to a shape; hatched ellipses as ground shadows |
| Accents | carrot `#F37A1F` (headings' underline, marks, the cat), tabby `#D9601A`, nose pink `#EE8E92`, butter `#FFE9A8` for notes |
| Ground | a pen line across the frame with tufts, at y 860 to 920 |
| Guide | a faint drafting circle and crosshair behind the action |

### Cocoa print: structure and data

| Part | Value |
|---|---|
| Background | brown radial `#4A2C1C` to `#1F130C`, grid, rulers, corner brackets, a slow dashed ring |
| Line | `#F6DCC8` warm cream, clean, with a soft carrot glow |
| Accents | carrot `#F37A1F` for answers and data, nose pink `#EE8E92` for a relation or highlight, white sparkles |
| Text | `#FFF4EA` cream headings; glowing mono pills, sized to their full text |
| Nodes | a ticked ring that pops in, with an icon inside |

Type: Inter 600 for headings and the name, Inter 500 for labels, IBM Plex Mono for timecodes and anything typed into a pill.

### Brief, motion and sound

As in [paper-blueprint](paper-blueprint.md): the brief's metaphor list (one line per shot), the motion vocabulary and the sound at 120 BPM.

## In each renderer

### remotion, canvas: built

`@studio/looks/paper-havooch`, drawn on `CanvasScene` with `@studio/lib/sketch`: [../drawing/canvas.md](../drawing/canvas.md). Its functions match paper-blueprint's, with these differences:

| Piece | Function |
|---|---|
| Paper | `paperBg(ctx, w, h, stripe)`, `ground(ctx, w, y, boil)`, `guides(ctx, cx, cy, r)`; stripes `STRIPE_PEACH`, `STRIPE_BUTTER` |
| Cocoa print | `cocoaBg(ctx, w, h, frame)`, `line(ctx, pts, { w, col, alpha, dash, offset })`, `glow(ctx, col, blur, draw)` |
| Text | `pill(ctx, text, cx, cy, { size, p, bar, highlight })`, `label(ctx, text, x, y, p, col, size)` |
| Nodes and travel | `node(ctx, cx, cy, r, p, frame, inner)`, `hexes`, `book`, `sparkle(ctx, x, y, s, frame)` |
| Frame furniture | `heading(ctx, text, p, theme)`, `dial(ctx, label, k, theme)`; `theme` is `"paper"` or `"cocoa"` |
| Cast | `havuc(ctx, cx, footY, { boil, frame, scale, mood, pawUp, squash, tilt, look })` returns its raised right paw's position: hang held props on it. Moods `happy`, `calm`, `wow`. `havucOutline(ctx, cx, cy, s, frame)` on the cocoa print |
| Props | paper-blueprint's `envelope`, `server`, `certificate`, `key`, `padlock` and `bubble`. A new prop goes in `<root>/<slug>/draw/props.ts`, with its own `seed` range |
| Colours and type | `PAPER`, `INK`, `CARROT`, `TABBY`, `PEACH`, `NOSE`, `WHITE`, `BUTTER`, `COCOA`, `COCOA_DEEP`, `LINE`, `CREAM`, `ANSWER`, `HIGHLIGHT`; `FONTS` for `CanvasScene`; `boilOf(frame)`; `makeRamp` for the storyboard switch |

Copy paper-blueprint's scene and asset sheet examples, and swap the import to `@studio/looks/paper-havooch`, `blueprintBg` to `cocoaBg`, `mascot` to `havuc` and the theme `"blueprint"` to `"cocoa"`. `<root>/havooch-intro/` is a full example when it exists.

### remotion, dom: not built yet

### fframes: not built yet
