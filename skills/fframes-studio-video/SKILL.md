---
name: fframes-studio-video
description: Make a narrated video with FFrames (Rust, SVG, GPU shaders) inside this explainer studio, from a bare idea to a checked MP4 in out/<slug>/. Use when asked for an FFrames video, a shader-heavy or effect-driven piece, or the pixel and thermal ad style.
---

# FFrames video in the studio

FFrames draws the picture. The studio supplies the rest: Kokoro voice with word timings, synthesized sound, private video folders and the final checks. [docs/fframes.md](../../docs/fframes.md) says why, and holds the install record and the gotchas.

First load the `fframes-video` skill (installed in `~/.agents/skills/fframes-video/`). It is the reference for the FFrames API, design, sound placement and the project CLI. Read its `references/design.md` before you design and its `references/api.md` while you write code. This file adds only what the studio changes. Where the two disagree, this file wins.

## Rules the studio adds

- **Private.** The video lives in `videos/<slug>/` and its renders in `out/<slug>/`. Git ignores both, and nothing from them goes into a commit, branch, issue or PR. The FFrames project is `videos/<slug>/fframes/`, never a folder of its own elsewhere.
- **Rust on PATH.** Homebrew's `rustup` is keg-only. Start every shell that runs `cargo` with:
  ```sh
  export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"
  ```
  If `cargo fframes` is still missing, stop and report `cargo install --locked cargo-fframes`. Run no global install yourself.
- **Timing comes from the voice.** Scene lengths and cues come from `voiceover.json` through the generated `src/timing.rs`, never from typed seconds. Cue each reveal on the word it illustrates.
- **One idea, one run.** Ask the user once, in one round, only what the idea cannot settle (what the viewer should take away, the length). Then work through to the MP4 without check-ins.

## Steps

1. **Scaffold.** From the studio root:
   ```sh
   npm run new-video -- <slug>
   rm -r videos/<slug>/Video.tsx videos/<slug>/scenes
   ```
   Removing `Video.tsx` keeps Remotion from registering a placeholder composition. Write the brief and the script in `videos/<slug>/brief.md`. Pick the size and fps now (for example 1920x1080 at 30, or 1440x1080 at 24 for the 4:3 ad look) and keep `config.ts` matching them.
   - Done when: `brief.md` has the takeaway, the scene list and one narration line per scene.
2. **Voice.** Put one scene per narration line in `videos/<slug>/voiceover.json` (`id`, `text`, `voice`, `speed`, `audioFile: ""`, `durationSeconds: 0`, `paddingSeconds`), and write the lines for the ear ([PRONUNCIATION.md](../../PRONUNCIATION.md)). Then run `npm run voice -- <slug>`.
   - Done when: every scene in `voiceover.json` has a `durationSeconds` and `words`.
3. **Sound.** Sum the scene lengths (each one's duration plus padding) and run `npm run sound -- <slug> --seconds <total>`. It writes `bed.wav`, `sting.wav`, `click.wav`, `whoosh.wav`, `pop.wav` and `tick.wav` into `videos/<slug>/assets/sound/`.
4. **Project.** Create it and start the first build in the background. The first build takes about 2 minutes and fills `target/` with about 1.8 GB.
   ```sh
   cd videos/<slug>
   cargo fframes new <crate-name> --template single-scene --format landscape --fps <fps> --dir fframes --yes
   cd fframes && cargo build --release
   ```
   Set `WIDTH` and `HEIGHT` in `src/lib.rs` if they differ from the format. Put static TTF fonts in `media/` (see the font gotcha in `docs/fframes.md`) and delete the template's font if unused.
5. **Feed the timing.** From the studio root, run `npm run fframes-sync -- <slug> --fps <fps>`. It writes `src/timing.rs` with `<SCENE>_FRAMES`, `<SCENE>_AUDIO`, `<SCENE>_TEXT`, `<SCENE>_WORDS` (each word and its scene-relative start frame) and `TOTAL_FRAMES`. It also links every narration WAV and sound effect into `fframes/assets/`. Run it again after every `npm run voice` or `npm run sound`.
6. **Wire media and timing.** Add `pub mod timing;` to `src/lib.rs`. Load `assets/` at runtime in `src/main.rs`, which keeps the WAVs in stereo, next to the embedded fonts:
   ```rust
   use fframes::{CombinedMediaProvider, MediaDirectory, MediaProvider, StaticMediaProvider};
   let fonts = MyMedia::prepare().expect("media");
   let folder = MediaDirectory::read_folder("assets").expect("assets folder");
   let sounds = folder.process_media_source().expect("assets");
   let media = CombinedMediaProvider::from([&fonts as &dyn MediaProvider, &sounds]);
   // RenderOptions { media: Some(&media), .. }
   ```
   Give each scene `Duration::Frames(<SCENE>_FRAMES)` and an `audio()` that starts `AudioTrack::new(<SCENE>_AUDIO, Second(0.0)..Eof)` at the scene's start. Place each effect at a word's frame: `AudioTrack::new("pop.wav", Frame(cue)..Eof).gain_db(-4.)`. Put `bed.wav` on the video's own `audio()` at about -13 dB.
7. **Build the scenes** with the `fframes-video` skill's design rules. Find a word's frame with `<SCENE>_WORDS.iter().find(|(w, _)| *w == "batch")`, and convert it to seconds (`frame / FPS`) for `animate_runtime`. Show narration on screen word by word from those frames. The studio's captions are the script itself.
8. **Review** with the project CLI after every change. Run each command from `videos/<slug>/fframes/` as `cargo run --release -- <command>`:
   - `timeline`: the scene frame ranges add up to `TOTAL_FRAMES`, and every track sits at its cue.
   - `inspect`: reports no problems.
   - `strip all -n 16 --columns 4 --width 480`: open `strip.png` and look at it. Check doubtful details in a full-size `frame` PNG.
   - `audio analyze`: no clipping, true peak at or below -1 dBTP. Note the integrated LUFS in your report.
   - Done when: all four pass and you have looked at a strip of every scene.
9. **Render and check.**
   ```sh
   cargo run --release -- render -o ../../../out/<slug>/<slug>.mp4
   ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,nb_frames -of compact ../../../out/<slug>/<slug>.mp4
   ```
   - Done when: ffprobe shows a video stream of `TOTAL_FRAMES` frames at your size, an audio stream, and a duration equal to `TOTAL_FRAMES / fps`.

Report the MP4 path, its length, the strip path, the LUFS figure and the command to watch it with sound: `cargo run --release -- preview` in `videos/<slug>/fframes/`.

## Style: pixel and thermal ad

When asked for "the FFrames ad look", or for pixel or thermal style, follow the style section of [docs/fframes.md](../../docs/fframes.md#style-the-pixel-and-thermal-ad). The studio has no image generator. Draw the pixel icons as character grids turned into SVG `rect`s with an extruded darker copy, and the thermal figures as SVG paths filled with a radial heat ramp, softened with `feTurbulence`, `feDisplacementMap` and `feGaussianBlur`. Draw the four-point star and the bokeh as SkSL shaders. A working example of every piece is the spike project in `videos/fframes-spike/fframes/` on the machine that made it, if it is still there.
