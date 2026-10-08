# Look: pixel-thermal

The look of the FFrames launch ad: chunky pixel icons, thermal-camera silhouettes and shader light on grey paper and black, cut fast on the beat. It fits short, effect-driven pieces and promos.

## Intent

- **Format.** 1440x1080 (4:3) at 24 fps suits it; 16:9 works too.
- **Grounds.** Two, cut hard between: warm grey paper (about `#e4e2dd`) with a heavy dark vignette and film grain, and near-black (about `#0e0e0e`) with grain.
- **Shader shapes.** A four-point star with a cyan rim and a deep blue core sweeping in from the left. Soft out-of-focus warm lights on black.
- **Thermal silhouettes.** A head in profile and a raised hand on black, filled with a heat ramp: white-hot, yellow, orange, red edges, soft and slightly smeared.
- **Pixel icons.** Chunky, black-outlined pixel art with an extruded depth: a monitor with a green prompt, a page with a red `</>`, a heart, a record, a chip, a clapperboard, a lightning bolt. They pop in on springs, orbit in a ring, then scatter.
- **Motion marks.** Grey blurred smear arcs behind fast-moving icons. A red hairline wave across the frame. Hand-drawn doodles such as `{}` and `[]`.
- **Type.** Small bold grotesk lines typed word by word, centred. Big title cards in a bold grotesk with a blinking red bar cursor and a small lime monospace subtitle. Widely spaced words such as `M O V E`. Serif-italic letters that drift and converge into the closing wordmark.
- **Accent colour.** One red (about `#e8432e`) for cursors, sparks and hairlines. Cyan and blue only in the star, lime only in monospace subtitles.
- **Cut rhythm.** A few soft transitions to open, then hard cuts every 0.5 to 0.9 seconds on the beat, a burst of cuts, then the outro.
- **Drawn, not generated.** Draw the pixel icons as character grids, the thermal figures as SVG paths filled with a radial heat ramp, softened with `feTurbulence`, `feDisplacementMap` and `feGaussianBlur`.

## In each renderer

- **fframes:** no shared code. Build from the intent above: pixel icons as grids turned into SVG `rect`s with an extruded darker copy; thermal figures as SVG paths with a radial gradient and filters; the star and the bokeh as SkSL shaders. When `<root>/fframes-spike/fframes/` exists, copy from it.
- **remotion, dom:** no look module. `PixelSprite` draws the icons; `ShaderLayer` draws the star and the bokeh as GLSL. When `<root>/fframes-spike/` exists, it holds the same 16 second piece.
- **remotion, canvas:** not built yet.
