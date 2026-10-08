# Look: dark-ui

Real interfaces, bold type and clear diagrams on a dark ground. It fits products, interfaces, screenshots, data and architecture. The Havooch launch video is its reference.

## Intent

- **Ground.** A dark background with a subtle film grain over everything (`grain`).
- **Type.** One bold display font for headlines, left-aligned, and a mono font for code and labels. Inter and JetBrains Mono are the usual pair.
- **Colour.** The source project's brand colours when it has them; otherwise one accent on a neutral dark palette. The brief sets the accent.
- **Cuts.** Hard cuts between ideas. Within a run of related scenes, one evolving picture: each scene starts exactly where the one before ends.
- **Material.** Real UI captures, flat redraws of the real layout, and diagrams drawn in code.
- **Motion.** Every reveal cues on the narration word it shows. UI moves on springs with high damping and no bounce; a cursor glides on eased paths.
- **Avoid.** The generic AI look: a centred headline fading in over a gradient. Prefer bold type, hard cuts and real material.

## Asset sheet

The sheet shows the palette, the type, and every UI mock, icon and diagram element the scenes use.

## In each renderer

- **remotion, dom:** built. The template's scene, the components in `src/components/` (`KineticTitle`, `Cursor`, `Travel`, `Typewriter`, `Captions`, `Grain`), fonts from `@remotion/google-fonts`, and `@remotion/paths`, `@remotion/shapes` and `@remotion/layout-utils` for diagrams.
- **remotion, canvas:** not built yet.
- **fframes:** not built yet.
