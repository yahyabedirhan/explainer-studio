# Pipeline

Between an idea and an MP4, a studio video passes through twelve layers. Each layer has one owner: a file, a script or a tool. A style changes only the picture and effects layers; every other layer is shared by every style. `AGENTS.md` gives the steps that walk through these layers; this page says what each layer is and where it lives.

| # | Layer | Owner | Produces |
|---|---|---|---|
| 1 | Idea | another project, read-only | what the user wants to learn |
| 2 | Brief | `videos/<slug>/brief.md`, from `templates/video/brief.md` | goal, audience, length, style, look, scene list |
| 3 | Script | `videos/<slug>/voiceover.json` | one scene per narration line, written for the ear |
| 4 | Voice | Kokoro, `scripts/tts.py` (`npm run voice`) | a WAV per scene in `videos/<slug>/audio/` |
| 5 | Word timings | `scripts/tts.py`, into each scene's `words` | the start and end of every spoken word |
| 6 | Scene timing | `src/lib/timing.ts`, `src/lib/words.ts` | scene lengths in frames, and the frame of each cue word |
| 7 | Picture | the renderer and the style | every frame |
| 8 | Effects | `Grain`, and shaders as an optional add-on | texture and light over the picture |
| 9 | Sound | `scripts/sound.py` (`npm run sound`) | music bed, sting and effects in `assets/sound/` |
| 10 | Captions | `src/components/Captions.tsx` | word-timed captions from the script |
| 11 | Encode | the renderer's FFmpeg | the MP4 with its audio |
| 12 | Checks | stills, contact sheet, `ffprobe` | proof the video is right before anyone watches it |

## The layers

**1 Idea.** The idea comes from another project. The agent reads that project's code, docs and pull requests and never writes into it.

**2 Brief.** The agent asks the user once, in a single round, what they want to learn and which style they want, and builds the brief around the answers. The brief also holds the asset list for the asset sheet.

**3 Script.** Short sentences, numbers written as spoken, no symbols: see `PRONUNCIATION.md`. A scene's `caption` overrides its `text` on screen when the two should differ.

**4 Voice and 5 Word timings.** Kokoro runs locally and needs no key. `npm run voice` writes each scene's WAV and its `words`, so no transcription step is needed.

**6 Scene timing.** The word timings are the clock. `timing.ts` is the only place a scene's length is computed: `ceil((durationSeconds + paddingSeconds) x fps)`. `useWord` turns a narration word into the frame a reveal waits for. FFrames reads the same timings through `npm run fframes-sync`, which writes its `src/timing.rs`.

**7 Picture.** Remotion draws every frame as a function of the frame number; FFrames does the same in Rust. Within Remotion, a scene draws with React and CSS, or repaints a canvas each frame with `CanvasScene`. The style decides the look: see `AGENTS.md`, "Styles".

**8 Effects.** `Grain` lays film grain over a whole video. Shaders are an optional, experimental add-on that the user picks from a prototype sheet: `docs/styles/shaders.md`. FFrames draws its own shaders in SkSL.

**9 Sound.** A Python script synthesizes the music and effects, so there is no licence to track. A freely licensed file is allowed when it keeps its source and licence beside it.

**10 Captions.** Captions come straight from the script, timed by the word timings. Sketchbook videos leave them off unless the user asks.

**11 Encode.** The studio never calls FFmpeg itself for a render. `npx remotion render` encodes with the FFmpeg that Remotion bundles; FFrames links FFmpeg's libraries and encodes directly.

**12 Checks.** Before handing over, the agent looks at stills at key frames, at a contact sheet of the render (`npm run sheet`), and runs `ffprobe` for the length and the audio track. FFrames adds `inspect`, `strip` and `audio analyze`: see `docs/styles/fframes.md`.

## Where the agent works

The agent writes only code and text at every layer, so a render is reproducible: render twice and the frames match.
