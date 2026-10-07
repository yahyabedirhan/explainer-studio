---
name: fframes-studio-video
description: Make a narrated video with FFrames (Rust, SVG, GPU shaders) inside this explainer studio, from a bare idea to a checked MP4 in the video's out/ folder. Use when asked for an FFrames video, a shader-heavy or effect-driven piece, or the pixel and thermal ad style.
---

# FFrames video in the studio

FFrames draws the picture. The studio supplies the rest: Kokoro voice with word timings, synthesized sound, private video folders and the final checks. [docs/styles/fframes.md](../../docs/styles/fframes.md) says why, and holds the install record and the gotchas.

First load the `fframes-video` skill (installed in `~/.agents/skills/fframes-video/`). It is the reference for the FFrames API, design, sound placement and the project CLI. Read its `references/design.md` before you design and its `references/api.md` while you write code. This file adds only what the studio changes. Where the two disagree, this file wins.

## Rules the studio adds

- **Private.** The video lives in `<root>/<slug>/` and its renders in `<root>/<slug>/out/`, in the videos root outside the repository (`AGENTS.md`, "The videos root"). Nothing from them goes into a commit, branch, issue or PR. The FFrames project is `<root>/<slug>/fframes/`, never a folder of its own elsewhere. Any checkout or worktree of the studio works on the same root.
- **Rust on PATH.** Homebrew's `rustup` is keg-only. Start every shell that runs `cargo` with:
  ```sh
  export PATH="/opt/homebrew/opt/rustup/bin:$HOME/.cargo/bin:$PATH"
  ```
  If `cargo fframes` is still missing, stop and report `cargo install --locked cargo-fframes`. Run no global install yourself. Every `cargo` command prints a harmless `ld: ... QTKit.tbd` linker warning; filter it with `2>&1 | grep -v -e QTKit -e linker`.
- **Timing comes from the voice.** Scene lengths and cues come from `voiceover.json` through the generated `src/timing.rs`, never from typed seconds. Cue each reveal on the word it illustrates.
- **One idea, one run.** Ask the user once, in one round, only what the idea cannot settle (what the viewer should take away, the length). Then work through to the MP4 without check-ins.

## Steps

1. **Scaffold.** From the studio root:
   ```sh
   npm run new-video -- <slug>
   ROOT=$(npm run --silent root)
   rm -r "$ROOT/<slug>/Video.tsx" "$ROOT/<slug>/scenes"
   ```
   Removing `Video.tsx` keeps Remotion from registering a placeholder composition. Pick the size and fps now (for example 1920x1080 at 30, or 1440x1080 at 24 for the 4:3 ad look), and set `config.ts` to match them. Write the brief and the script in `<root>/<slug>/brief.md`. Kokoro speaks about 2.5 words a second, so a 10 s video holds about 25 words in all.
   - Done when: `brief.md` has the takeaway, the scene list and one narration line per scene.
2. **Project.** Create it and start the first build in the background now. The build takes about 2 minutes and fills `target/` with about 1.8 GB, and it runs while you do the voice.
   ```sh
   cd "$ROOT/<slug>"
   cargo fframes new <crate-name> --template multi-scene --format landscape --fps <fps> --dir fframes --yes
   cd fframes && cargo build --release
   ```
   - The `multi-scene` template already has `Scene` structs and `define_scenes`. It takes only `landscape` and `uhd`. For other formats, use `single-scene` and add the scenes yourself.
   - Set `WIDTH` and `HEIGHT` in `src/lib.rs` when they differ from the format.
   - Put static TTF fonts in `media/` (see the font gotcha in `docs/styles/fframes.md`).
   - The template's `main.rs` takes a `--title` flag, and `tests/frames.rs` builds the video with `Video::new(&media, "Title")`. Keep both in step with your constructor, or delete the flag and the test.
3. **Voice.** Put one scene per narration line in `<root>/<slug>/voiceover.json` (`id`, `text`, `voice`, `speed`, `audioFile: ""`, `durationSeconds: 0`, `paddingSeconds`). Write the lines for the ear ([PRONUNCIATION.md](../../PRONUNCIATION.md)). Then run `npm run voice -- <slug>`. If the total runs long, shorten the lines or raise `speed` (up to about 1.1), and run it again.
   - Done when: every scene in `voiceover.json` has a `durationSeconds` and `words`.
4. **Feed the timing.** From the studio root, run `npm run fframes-sync -- <slug> --fps <fps>`. It writes `src/timing.rs` and prints the video's total length. Per scene, `timing.rs` holds:
   - `<SCENE>_FRAMES`: the scene's length in frames.
   - `<SCENE>_START`: its first frame in the whole video.
   - `<SCENE>_AUDIO`: its narration WAV.
   - `<SCENE>_TEXT`: its caption.
   - `<SCENE>_WORDS`: each spoken word, punctuation stripped, with its scene-relative start frame.
   - `<SCENE>_SHOWN`: the caption's words with punctuation kept, each with the same frame. Use it for on-screen text.

   It also writes `TOTAL_FRAMES`, and links every narration WAV and sound effect into `fframes/assets/`.
5. **Sound.** Run `npm run sound -- <slug> --seconds <total>`, with the total that `fframes-sync` printed. Then run `fframes-sync` again, so it links the new files. Run it again after every `npm run voice` or `npm run sound`.
6. **Wire media and timing.** Add `pub mod timing;` to `src/lib.rs`. Load `assets/` at runtime in `src/main.rs`, which keeps the WAVs in stereo, next to the embedded fonts:
   ```rust
   use fframes::{AudioMixOptions, CombinedMediaProvider, MediaDirectory, MediaProvider, StaticMediaProvider};
   let fonts = MyMedia::prepare().expect("media");
   let folder = MediaDirectory::read_folder("assets").expect("assets folder");
   let sounds = folder.process_media_source().expect("assets");
   let media = CombinedMediaProvider::from([&fonts as &dyn MediaProvider, &sounds]);
   // RenderOptions { media: Some(&media), audio_mix: AudioMixOptions { master_gain_db: 5.5, ..Default::default() }, .. }
   ```
   Give each scene `Duration::Frames(<SCENE>_FRAMES)` and an `audio()` that starts `AudioTrack::new(<SCENE>_AUDIO, Second(0.0)..Eof)` at the scene's start. Place each effect at a word's frame: `AudioTrack::new("pop.wav", Frame(cue)..Eof).gain_db(-4.)`. Put `bed.wav` on the video's own `audio()` at about -13 dB. Kokoro's level leaves the mix near -21 LUFS, so set `master_gain_db` to reach about -16 to -14 LUFS.
7. **Build the scenes** with the `fframes-video` skill's design rules.
   - Find a word's frame with `<SCENE>_WORDS.iter().find(|(w, _)| *w == "batch")`.
   - Convert frames to seconds (`frame / FPS`) for `animate_runtime`.
   - Show the narration on screen word by word from `<SCENE>_SHOWN`. In this studio, the script is the captions.
   - For something that keeps moving across cuts, draw it in the video's own `render_frame`. Time it with `frame.global_index` and `<SCENE>_START + cue`.
8. **Review** with the project CLI after every change. Run each command from `<root>/<slug>/fframes/` as `cargo run --release -- <command>`:
   - `timeline`: the scene frame ranges add up to `TOTAL_FRAMES`, and every track sits at its cue.
   - `inspect`: reports no problems.
   - `strip all -n 16 --columns 4 --width 480`: open `strip.png` and look at it. Check doubtful details in a full-size `frame` PNG.
   - `audio analyze`: no clipping, true peak at or below -1 dBTP, integrated loudness between -16 and -14 LUFS.
   - Done when: all four pass and you have looked at a strip of every scene.
9. **Render and check.**
   ```sh
   mkdir -p ../out
   cargo run --release -- render -o ../out/<slug>.mp4
   ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,nb_frames -of compact ../out/<slug>.mp4
   ```
   - Done when: ffprobe shows a video stream of `TOTAL_FRAMES` frames at your size, an audio stream, and a duration equal to `TOTAL_FRAMES / fps`.

10. **Clean up.** Once the user has the final render, free the build folder: `cargo clean` in `<root>/<slug>/fframes/`. Each project's `target/` holds about 1.8 GB, and the next edit rebuilds it in about 2 minutes.
   - Done when `<root>/<slug>/fframes/target/` is gone.

Report the MP4 path, its length, the strip path, the LUFS figure and the command to watch it with sound: `cargo run --release -- preview` in `<root>/<slug>/fframes/`, which rebuilds first after the cleanup.

## Style: pixel and thermal ad

When asked for "the FFrames ad look", or for pixel or thermal style, follow the style section of [docs/styles/fframes.md](../../docs/styles/fframes.md#style-the-pixel-and-thermal-ad). The studio has no image generator. Draw the pixel icons as character grids turned into SVG `rect`s with an extruded darker copy, and the thermal figures as SVG paths filled with a radial heat ramp, softened with `feTurbulence`, `feDisplacementMap` and `feGaussianBlur`. Draw the four-point star and the bokeh as SkSL shaders. A working example of every piece is the spike project in `<root>/fframes-spike/fframes/` on the machine that made it, if it is still there.
