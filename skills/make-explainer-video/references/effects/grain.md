# Effect: grain

Film grain over the whole frame, with a new seed every 2 frames, so a flat ground feels like film.

- **remotion:** put `<Grain />` from `@studio/components/Grain` last in `Video.tsx` or a scene, over the picture. Props: `opacity` (default 0.12), `blend` (`soft-light` by default, or `overlay`), `frequency` (higher is finer, default 0.85).
- **remotion, canvas:** draw grain into the canvas instead, as the paper-blueprint look's paper specks do, or lay `<Grain />` over the `CanvasScene`.
- **fframes:** draw grain in the scene, for example with an `feTurbulence` filter or an SkSL noise shader.
