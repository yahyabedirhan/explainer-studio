# FFrames

What FFrames is, how the video that made it popular was built, what that video's look is made of, and how to set FFrames up on this Mac. Spike of 2026-10-07. The comparison with Remotion is in [renderers.md](renderers.md). The steps to make a video with it are in [the `fframes-studio-video` skill](../skills/fframes-studio-video/SKILL.md).

Sources: [dmtrKovalenko/fframes](https://github.com/dmtrKovalenko/fframes) at `30b48f3da60040e0fd7c811fdcd5b159e70a5b02` (2026-10-06), the crate `fframes` 1.2.0 that `cargo fframes new` pins, [fframes.studio](https://fframes.studio), and the post [x.com/neogoose_btw/status/2107645063895699515](https://x.com/neogoose_btw/status/2107645063895699515).

## What it is

FFrames is a Rust library that renders video from code, by Dmitriy Kovalenko, MIT licence. He started it in 2021 and released it publicly in September 2026, pitched as a faster alternative to Remotion and written to be driven by coding agents.

- **Authoring.** A video is a struct that implements `Video` (`FPS`, `WIDTH`, `HEIGHT`, `duration`, `audio`, `define_scenes`, `render_frame`). For each frame, `render_frame(frame, ctx)` returns an SVG tree built with the `svgr!` macro: SVG markup with `{rust expressions}`. Scenes implement `Scene` and split the timeline. `timeline!`, eases, cubic Béziers and springs animate values. Markup without expressions is hashed at compile time and cached across frames.
- **Rendering.** Skia on the GPU (Metal on macOS, Vulkan elsewhere), or a CPU backend built on resvg. The CPU backend draws no shaders. Encoding links ffmpeg's libav directly instead of starting an ffmpeg process.
- **Shaders.** `Shader::sksl(src)` or `Shader::shadertoy(glsl)` draws a layer that an SVG `<image href={layer.href()}>` places. The built-in uniforms are `iResolution`, `iTime`, `iTimeDelta` and `iFrame`, which is an int. Coordinates are y-down. Your own uniforms go in through `ShaderUniforms::float`, `float2` and `color`.
- **Audio.** `AudioMap` of `AudioTrack`s, with sample-accurate `Second(..)` or `Frame(..)` times, `gain_db`, fades, pan, `voice()` and `duck_under_voice()`. A scene can return its own `audio()` with scene-relative times. The master bus limits at -1 dBFS. Files in `media/` are embedded and decoded to mono. `MediaDirectory::read_folder` loads a folder at runtime and keeps stereo.
- **Agent tooling.** The `fframes-video` skill (`npx skills add https://fframes.studio`), plus a command line in every project. It has `timeline`, `inspect` (finds missing fonts, text off the canvas, invalid SVG and panics without drawing pixels), `strip` (a labelled contact sheet), `frame`, `onion`, `svg`, `audio analyze` (LUFS, true peak, per scene), `preview` (a GPU window with sound) and `render [--draft]`.
- **Written by agents.** The README calls it "video vibe coding". The author kept the API explicit and verbose because an agent with the skill writes it, not a person.

## How the post's video was made

The post reads "Recreated with codex as fframes project. Just rust, svg, and shaders." The author later replied that it is "all codex with gpt images", and the @fframes_rust account said "Codex + GPT Images". So:

- Codex wrote the Rust and SVG code. Shaders draw the star spike and the glows.
- GPT Images made the raster art: the thermal-camera person and hand, and probably the pixel icons. They are images composited into the SVG.
- **Guesses:** it recreates an earlier ad made with other tools; the original was not found. Its soundtrack is probably taken from that original: the spectrum is cut at 15.8 kHz, as lossy audio is, and shows vocal-like formant curves. The post's source code is not in the repository.

## Style: the pixel and thermal ad

What the post's video is made of, from a frame-by-frame pass with ffmpeg (scene-change detection plus a frame every 0.5 s).

- **Format.** 1440x1080 (4:3), 24 fps, H.264, 20.4 s, AAC stereo at 44.1 kHz, -10.7 LUFS integrated.
- **Cut rhythm.** Soft transitions at 2.0, 3.7 and 6.3 s. Then hard cuts at 8.33, 9.17, 9.88, 10.54, 11.04, 11.92 and 13.79 s, every 0.5 to 0.9 s, on the music's beat. A burst of cuts follows at 15.9 to 17.25 s, then the outro.
- **Grounds.** Two of them, cut hard between: warm grey paper (about `#e4e2dd`) with a heavy dark vignette and film grain, and near-black (about `#0e0e0e`) with grain.
- **Shader shapes.** A four-point star with a cyan rim and a deep blue core sweeps in from the left. Soft out-of-focus warm lights sit on black.
- **Thermal silhouettes.** A head in profile and a raised hand on black, filled with a heat-map ramp: white-hot, yellow, orange, red edges, soft and slightly smeared.
- **Pixel icons.** Chunky, black-outlined pixel art with an extruded depth: a monitor with a green prompt, a page with a red `</>`, a heart, a vinyl record, a chip, a clapperboard, a lightning bolt. They pop in on springs, orbit in a ring, then scatter.
- **Motion marks.** Grey blurred smear arcs behind fast-moving icons. A red hairline wave across the frame. Hand-drawn doodles: `{}`, `[]`, `svgr!`.
- **Type.** Small bold grotesk lines typed word by word, centred. Big title cards ("code.", "motion.", "feeling.") in a bold grotesk with a blinking red bar cursor and a small monospace subtitle in lime ("Rust + SVG"). A widely spaced `M O V E`. Scattered serif-italic letters that drift and then converge into the closing wordmark, with a tiny monospace line under it.
- **Accent colour.** One red (about `#e8432e`) for cursors, sparks and hairlines. Cyan and blue only in the star, lime only in monospace subtitles.

A 16 s rebuild of this look on a neutral topic ("a batch of notes travels from a person to an agent") exists in both renderers. In it, a code-drawn SVG profile with a gradient stands in for the generated thermal images, and grid-drawn pixel sprites stand in for the generated icons.

## Install on this Mac

Rust from Homebrew's `rustup`, which is keg-only: Homebrew does not link it into `PATH`. Every shell that builds an FFrames project needs this first:

```sh
export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"
```

Then, once per machine:

```sh
brew install rustup pkgconf nasm ninja      # x264, x265, opus, libvpx and ffmpeg were already installed
rustup default stable                       # rustc and cargo 1.99.0 at the time of the spike
cargo install --locked cargo-fframes        # gives `cargo fframes new`
npx skills add https://fframes.studio       # the fframes-video agent skill, in ~/.agents/skills/
```

- The first `cargo build --release` of a project downloads prebuilt Skia and ffmpeg and compiles about 440 crates. On this Mac (arm64) it took 2 min 3 s, and the project's `target/` grew to 1.8 GB. Later builds after an edit take about 9 to 11 s, linking included.
- Linking prints a harmless `ld: ignoring file ... QTKit.tbd` warning on the macOS 26 SDK.

## Gotchas met while building

- `NotesHandoffMedia::prepare()` (from `include_media_dir!`) needs `use fframes::StaticMediaProvider;` in scope.
- The template ships DM Sans only. Put static TTFs in `media/` and use their family names. Google Fonts serves a static TTF when asked with an old user agent: `curl -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700"` prints the `.ttf` URL.
- SkSL works in y-down pixel coordinates, while WebGL's `gl_FragCoord` is y-up. Flip `y` when porting a shader between the two renderers.
- A `strip` contact sheet is downscaled. With grain on top, a smooth vignette can look like a hard, noisy ring. Check a full-size `frame` before you change the gradient.
- `stroke-dasharray` with `pathLength="1"` is a browser convenience. In FFrames, compute the real path length (sample Béziers, Ramanujan for ellipses) and dash with it.
- A borrow-checker error comes up when a closure that reads `&frame` is still alive while `frame.text_width` needs `&mut frame`. Evaluate the closure into a value before measuring text.
- The project sits in `videos/<slug>/fframes/`, inside Remotion's public folder. Remotion still rendered normally next to its 1.8 GB `target/`.
