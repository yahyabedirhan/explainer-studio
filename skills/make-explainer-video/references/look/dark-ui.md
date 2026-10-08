# Look: dark-ui

Real interfaces, bold type and clear diagrams on a dark ground. It fits products, interfaces, screenshots, data and architecture.

## Intent

- **Ground.** A dark background with a subtle film grain over everything (`grain`).
- **Type.** One bold display font for headlines, left-aligned, and a mono font for code and labels. Inter and JetBrains Mono are the usual pair.
- **Colour.** The source project's brand colours when it has them; otherwise one accent on a neutral dark palette. The brief sets the accent.
- **Cuts.** Hard cuts between ideas. Within a run of related scenes, one evolving picture: each scene starts exactly where the one before ends.
- **Material.** Real UI, as the dom drawing says, and diagrams drawn in code.
- **Avoid.** The generic AI look: a centred headline fading in over a gradient. And a one-sided border, such as a coloured stripe down a card's left edge, an overused pattern. Prefer bold type, hard cuts, real material and full outlines.

## Asset sheet

The sheet shows the palette, the type, and every UI mock, icon and diagram element the scenes use.

## In each renderer

- **remotion, dom:** built. The template's scene, the components in `src/components/` (`KineticTitle`, `Cursor`, `Travel`, `Typewriter`, `Captions`, `Grain`), and fonts from `@remotion/google-fonts`.
- **remotion, canvas:** not built yet.
- **fframes:** not built yet.
