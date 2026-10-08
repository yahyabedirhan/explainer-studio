# Renderer: fframes

FFrames is a Rust library that renders video from code: each frame is an SVG tree from `render_frame`, drawn by Skia on the GPU, with SkSL or Shadertoy shaders as first-class layers, and encoded through FFmpeg's libraries. Its project command line checks a video without watching it: `timeline`, `inspect`, `strip` and `audio analyze`. It fits shader-heavy, effect-driven pieces. The studio's React components don't exist here: captions, cursor and look code are built in the video's own project.

Load the official `fframes-video` skill first. It is the reference for the FFrames API, design, sound placement and the project command line: read its `references/design.md` before you design and its `references/api.md` while you write code. This file adds only what the studio changes, with the "Where the official skills differ" table in `SKILL.md`.

## Before you start

- **Rust on PATH.** Homebrew's `rustup` is keg-only. Start every shell that runs `cargo` with `export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"`.
- **`cargo fframes` missing:** stop and report `cargo install --locked cargo-fframes`. Run no global install yourself.
- Every `cargo` command prints a harmless `ld: ... QTKit.tbd` linker warning. Filter it with `2>&1 | grep -v -e QTKit -e linker`.

## Steps the renderer changes

1. **Scaffold.** After `npm run new-video -- <slug>`, delete `Video.tsx` and `scenes/`, so Remotion registers no placeholder composition. Set `config.ts` to the size and fps you pick, for example 1920x1080 at 30, or 1440x1080 at 24.
2. **Project.** Create it and start the first build in the background. It takes about 2 minutes and fills `target/` with about 1.8 GB, so run it while you do the voice.
   ```sh
   cd "$(npm run --silent root)/<slug>"
   cargo fframes new <crate-name> --template multi-scene --format landscape --fps <fps> --dir fframes --yes
   cd fframes && cargo build --release
   ```
   - The `multi-scene` template takes only `landscape` and `uhd`. For other formats, use `single-scene` and add the scenes yourself. Set `WIDTH` and `HEIGHT` in `src/lib.rs` when they differ from the format.
   - The template's `main.rs` takes a `--title` flag, and `tests/frames.rs` builds the video with `Video::new(&media, "Title")`. Keep both in step with your constructor, or delete the flag and the test.
3. **Feed the timing.** After `npm run voice`, run `npm run fframes-sync -- <slug> --fps <fps>` from the studio. It prints the video's total length and writes `src/timing.rs`, with per scene:
   - `<SCENE>_FRAMES`: the scene's length in frames; `<SCENE>_START`: its first frame in the whole video.
   - `<SCENE>_AUDIO`: its narration WAV; `<SCENE>_TEXT`: its caption.
   - `<SCENE>_WORDS`: each spoken word, punctuation stripped, with its scene-relative start frame.
   - `<SCENE>_SHOWN`: the caption's words with punctuation kept, each with the same frame. Use it for text on screen.
   - `TOTAL_FRAMES`. It also links every narration WAV and sound effect into `fframes/assets/`. Run it again after every `npm run voice` or `npm run sound`.
4. **Wire media and timing.** Add `pub mod timing;` to `src/lib.rs`. Load `assets/` at runtime in `src/main.rs`, which keeps the WAVs in stereo, next to the embedded fonts:
   ```rust
   use fframes::{AudioMixOptions, CombinedMediaProvider, MediaDirectory, MediaProvider, StaticMediaProvider};
   let fonts = MyMedia::prepare().expect("media");
   let folder = MediaDirectory::read_folder("assets").expect("assets folder");
   let sounds = folder.process_media_source().expect("assets");
   let media = CombinedMediaProvider::from([&fonts as &dyn MediaProvider, &sounds]);
   // RenderOptions { media: Some(&media), audio_mix: AudioMixOptions { master_gain_db: 5.5, ..Default::default() }, .. }
   ```
   Give each scene `Duration::Frames(<SCENE>_FRAMES)` and an `audio()` that starts `AudioTrack::new(<SCENE>_AUDIO, Second(0.0)..Eof)`. Place each effect at a word's frame: `AudioTrack::new("pop.wav", Frame(cue)..Eof).gain_db(-4.)`. Put `bed.wav` on the video's own `audio()` at about -13 dB. Kokoro's level leaves the mix near -21 LUFS, so set `master_gain_db` to reach about -16 to -14 LUFS.
5. **Scenes.** Find a word's frame with `<SCENE>_WORDS.iter().find(|(w, _)| *w == "batch")`. Convert frames to seconds (`frame / FPS`) for `animate_runtime`. For something that keeps moving across cuts, draw it in the video's own `render_frame`, timed with `frame.global_index` and `<SCENE>_START + cue`.
6. **Asset sheet and stills.** Draw the asset sheet as a scene or a `frame` export, and check frames with `cargo run --release -- frame`.
7. **Review** after every change, from `<root>/<slug>/fframes/` as `cargo run --release -- <command>`:
   - `timeline`: the scene frame ranges add up to `TOTAL_FRAMES`, and every track sits at its cue.
   - `inspect`: reports no problems.
   - `strip all -n 16 --columns 4 --width 480`: look at `strip.png`. A strip is downscaled; check doubtful details in a full-size `frame`.
   - `audio analyze`: no clipping, true peak at or below -1 dBTP, integrated loudness between -16 and -14 LUFS.
8. **Render and check.**
   ```sh
   mkdir -p ../out
   cargo run --release -- render -o ../out/<slug>.mp4
   ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,nb_frames -of compact ../out/<slug>.mp4
   ```
   Done when the video stream has `TOTAL_FRAMES` frames at your size, there is an audio stream, and the duration equals `TOTAL_FRAMES / fps`.
9. **Clean up.** Once the user has the final render, run `cargo clean` in `<root>/<slug>/fframes/`. The next edit rebuilds `target/` in about 2 minutes.

Hand over the MP4 path, its length, the strip path, the LUFS figure, and `cargo run --release -- preview` in `<root>/<slug>/fframes/` to watch it with sound.

## Gotchas

- `<Media>::prepare()` from `include_media_dir!` needs `use fframes::StaticMediaProvider;` in scope.
- The template ships DM Sans only. Put static TTFs in `media/` and use their family names. Google Fonts serves a static TTF to an old user agent: `curl -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700"` prints the `.ttf` URL.
- SkSL works in y-down pixel coordinates, while WebGL's `gl_FragCoord` is y-up. Flip `y` when porting a shader from Remotion's `ShaderLayer`.
- `stroke-dasharray` with `pathLength="1"` is a browser convenience. Compute the real path length (sample Béziers, Ramanujan for ellipses) and dash with it.
- A closure that reads `&frame` while `frame.text_width` needs `&mut frame` fails the borrow checker. Evaluate the closure into a value before measuring text.
- With grain on top, a smooth vignette can look like a hard, noisy ring in a downscaled `strip`. Check a full-size `frame` before you change the gradient.
