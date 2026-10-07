# Studio style

The studio's baseline look, and the default style for a new video: Remotion scenes built from React and CSS, with real interfaces, bold type and clear diagrams. Use it for products, interfaces, screenshots, data and architecture. The Havooch launch video is its reference.

## The look

- **Canvas.** A dark background with a subtle film grain over everything (`Grain`, soft-light at 12 % by default).
- **Type.** One bold display font for headlines, left-aligned, plus a mono font for code and labels, from `@remotion/google-fonts`. Inter and JetBrains Mono are the usual pair.
- **Colour.** The source project's brand colours when it has them; otherwise one accent on a neutral dark palette, set in the brief.
- **Cuts.** Hard cuts between ideas. Within a run of related scenes, one evolving picture: each scene starts exactly where the one before ends.
- **Material.** Real UI captures (Playwright with Chromium is installed), flat redraws of the real layout, and diagrams drawn in code. A centred headline fading in over a gradient is the generic look to avoid.
- **Motion.** Every reveal cues on the narration word it shows. UI moves on springs with high damping and no bounce; a cursor glides on eased paths (`Cursor`, `Travel`).
- **Captions.** On, from the script, kept clear of the picture's controls.

## Building blocks

`src/components/` holds the shared pieces: `Captions`, `Cursor`, `Travel`, `Typewriter`, `KineticTitle` and `Grain`. The installed Remotion packages cover the rest:

- `@remotion/paths`: arrows and strokes that draw on, cued to a word.
- `@remotion/shapes`: diagram nodes, callouts and pie charts.
- `@remotion/layout-utils`: text measured to fit its box, so labels never overflow.
- `@remotion/motion-blur`: blur on fast cursor moves and travels.
- `@remotion/noise`: organic drift and jitter.

## Asset sheet and storyboard in this style

The asset sheet (`videos/<slug>/Sheet.tsx`, registered as the still `<Id>Sheet`) shows the palette, the type and every UI mock, icon and diagram element the scenes use. The storyboard is each scene built at its end pose before any motion: render a still of each scene's last frame, fix the layout, then add the motion on word cues.
