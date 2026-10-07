# Renderers

Is another code renderer better than Remotion for this studio's videos: every frame a pure function of time, word-timed reveals, a cursor that drags a box? Spike of 2026-10-07.

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
