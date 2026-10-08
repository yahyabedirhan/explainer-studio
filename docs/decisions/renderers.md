# Decisions: renderers

Is another code renderer better than Remotion for this studio's videos: every frame a pure function of time, word-timed reveals, a cursor that drags a box? Spike of 2026-10-07.

**Outcome.** Remotion is the default renderer and FFrames the alternative for effect-heavy pieces (section "FFrames vs Remotion"). HyperFrames was dropped: it showed no advantage the studio needs, so it has no skill, and this page keeps its benchmark as the record.

## What was tried

- **HyperFrames** (HTML + GSAP, seeks a paused timeline per frame): [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) at `5c7f6316d3646477a0f725176c00335cb8575560`, CLI `hyperframes@0.8.140` from npm.
- **Remotion** `4.0.532`, as already installed in the studio.
- **Cua Driver**, for cursor animation only: [trycua/cua](https://github.com/trycua/cua) `libs/cua-driver` at `ad563fef24973df11f9186f6bb8205cf91f69ebe`.

The same 4 s shot was built in both renderers, at 1920x1080 and 30 fps. It has a `#1B1F2A` canvas and a `#F37A1F` region box that grows while a pointer drags from (700,400) to (1100,620). Then a caption appears word by word at given start times. Both rendered correctly. Frames at 2.0 s and 3.9 s were extracted with ffmpeg and checked by eye: they match.

## Results

| | HyperFrames 0.8.140 | Remotion 4.0.532 |
|---|---|---|
| Install | 73 packages, 119 MB, plus 200 MB in `~/.cache/hyperframes` (headless Chrome, fonts) | Already installed, nothing added |
| Render 4 s (120 frames) | 8.2 s cold, 7.5 s warm (about 9 to 11 s wall) | 4.3 s wall; one still 1.2 s |
| Determinism | Two renders byte-identical | Two renders byte-identical |
| Frame-exact seek | Yes: `t = frame / fps`, GSAP seeked, never played | Yes: `useCurrentFrame()` |
| Audio | `<audio>` mixed by FFmpeg; built-in Kokoro (ONNX) voice and Whisper or Parakeet transcription | `<Audio>`; the studio's own Kokoro script |
| Word-timed reveals | GSAP position in seconds: `tl.to(word, {...}, 2.8)`. Natural fit for word timings | `interpolate(frame, [t*fps, ...])`. Same idea, frames instead of seconds |
| Stills for checks | `hyperframes snapshot --at 2.0,3.9` | `npx remotion still --frame=<n>` |
| Authoring rules | Paused timeline, `window.__timelines`, `class="clip"` and `data-*` timing on every slot; a strict linter enforces them | React components, typed props |
| Telemetry | On by default (anonymous); `DO_NOT_TRACK=1` or `HYPERFRAMES_NO_TELEMETRY=1` turns it off | None in render |
| Licence | Apache 2.0 | Remotion licence, free up to three people |

The HyperFrames scaffold loads GSAP from a CDN. That works but makes a render depend on the network unless GSAP is vendored.

## Cursor question

Cua Driver has no reusable cursor animation for rendered video. Its cursor is a live, click-through OS overlay (`rust/crates/cursor-overlay`, a dotLottie theme with trajectory styles such as `signature_arc`) that animates on the wall clock while an agent drives real apps, so it cannot be seeked per frame. At most, its MIT-licensed artwork or trajectory ideas could be copied into a studio component.

## Decision

Keep Remotion as the studio's renderer.

1. It is already wired in: `voiceover.json` lengths through `src/lib/timing.ts`, `src/Root.tsx` registration, shared components, and `npx remotion still` checks. A switch would rebuild all of it for no gain in output.
2. Output and determinism are equal for this kind of shot, and Remotion rendered the 4 s shot about twice as fast here.
3. No extra 320 MB install, no CDN dependency, no telemetry to switch off.

HyperFrames would be worth it if the studio wanted to drop existing HTML, CSS, GSAP or Lottie work into a video as it is, needed an Apache 2.0 licence (a team above three people), or wanted its built-in transcription and catalog blocks. Its word-timed GSAP timelines are slightly more pleasant to write than frame maths, but not enough to move.

## FFrames vs Remotion

A second spike, also on 2026-10-07: [FFrames](fframes-prototype.md) ([dmtrKovalenko/fframes](https://github.com/dmtrKovalenko/fframes) at `30b48f3da60040e0fd7c811fdcd5b159e70a5b02`, crate `fframes` 1.2.0, Skia on Metal) against Remotion `4.0.532`. Both renderers built the same 16 s, five-scene piece: 1440x1080 at 24 fps, in the pixel and thermal ad look that [fframes-prototype.md](fframes-prototype.md) describes. Both used the same Kokoro narration, word timings and sound files. Remotion drew it with React, SVG and a WebGL shader layer (`ShaderLayer`). FFrames drew it with `svgr!` SVG and SkSL shaders. Both renders have 387 frames and -22.6 LUFS integrated, and a side-by-side contact sheet shows them frame for frame alike.

| | FFrames 1.2.0 | Remotion 4.0.532 |
|---|---|---|
| Install | Rust toolchain plus `cargo-fframes`; first build 2 min 3 s; `target/` 1.8 GB per project | Already installed |
| Rebuild after an edit | 9 to 11 s (Rust compile and link) | None; the bundler rebuilds as part of each render |
| Render 16 s (387 frames) | 13.9 s render, 15.1 s wall | 16.3 s wall, bundling included |
| Lines of code | 830 (Rust 724 hand-written plus 41 generated timing, SkSL 65) | 1020 (scenes and parts 755, shared components 213, `Video.tsx` 36, shaders as strings) |
| Output size | 66 MB (CRF 18) | 28 MB (Remotion default) |
| Shaders | First class: `Shader::sksl` or `shadertoy`, placed as an SVG `<image>` | Through a WebGL canvas component; needs `--gl=angle` for stills and renders |
| Timing from Kokoro | `npm run fframes-sync` writes `src/timing.rs` (frames per scene, word start frames) | `voiceover.json` through `src/lib/timing.ts` and `useWord` |
| Review tools | `timeline`, `inspect`, `strip`, `frame`, `onion`, `audio analyze`, built in | `npx remotion still` per frame, ffmpeg for contact sheets and loudness |
| Agent friction | Borrow-checker errors around `&mut frame` for text measurement, a trait import for `prepare()`, y-down shader coordinates, hand-computed dash lengths, fonts as TTF files | `delayRender` around WebGL, the `--gl` flag, browser fonts load on their own |
| Licence | MIT | Remotion licence, free up to three people |

Notes on the numbers:

- Render time is close at this size because the thermal silhouette's SVG filters (turbulence, displacement, blur) dominate the FFrames frames. FFrames' advertised 10x lead is for plain vector work on the GPU.
- The FFrames line count includes per-scene audio maps and text layout (word positions measured with `text_width`). The browser does both of these for Remotion.
- Both renderers kept the audio identical: same tracks, same gains (Remotion `volume` converted to dB), same frame cues. FFrames' `timeline` lists every track with its time and gain, which made the check one command.

### Decision

Use both, for different jobs. Remotion stays the default renderer.

1. Remotion stays the default for explainers. They lean on the studio's components (`Captions`, `Cursor`, `Travel`, `Typewriter`), real UI captures and browser text layout. Nothing has to compile, and nothing new is installed.
2. FFrames is the pick for shader-heavy, effect-driven pieces, and when an agent works alone, because `inspect`, `strip` and `audio analyze` give it checks without watching. The `fframes` renderer option of `make-explainer-video` makes such a video inside this studio, with the same Kokoro voice and sounds.
3. Neither renderer made the pixel and thermal look easier to reach. The hard part of that look is the generated raster art, not the renderer.
