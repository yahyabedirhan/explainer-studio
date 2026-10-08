# Low-level design

How the studio's code is put together, written from the code as it stands after the videos root moved out of the repository (spec #22). It follows the low-level design delivery framework: requirements, entities and relationships, class design, implementation, extensibility. `AGENTS.md` says how to make a video; this page says which file does what while you make one.

**Start here.**

- **Two kinds of entry point.** Remotion starts at `remotion.config.ts` (the bundler set-up and the videos root) and `src/index.ts` (registers `src/Root.tsx`). Everything else is an `npm run` script in `package.json`, backed by one file in `scripts/`.
- **Two places.** The repository holds the toolkit: `src/`, `scripts/`, `templates/`, `skills/` and the docs. Every video lives in one folder, `<root>/<slug>/`, in the videos root outside the repository. `npm run --silent root` prints `<root>`.
- **The clock.** Narration sets every length. `npm run voice` measures each scene's WAV and its words, and `src/lib/timing.ts` and `src/lib/words.ts` turn those seconds into frames.
- **The main thread** of this page is one video's lifecycle, traced in [Implementation](#4-implementation): from `npm run new-video` to the checked MP4 in `<root>/<slug>/out/`.

**Marks.** A claim names the file behind it. **Inferred** marks a requirement read from behaviour or tests, with no document that states it. **Unknown** marks a fact the code cannot show; the list is in [Unknowns](#unknowns).

## 1. Requirements

### Capabilities

1. Scaffold a video from a slug, into `<root>/<slug>/`, from `templates/video/` (`scripts/new-video.mjs`).
2. Resolve one videos root for every checkout and worktree: `STUDIO_VIDEOS_DIR`, then `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json`, then `~/.local/share/explainer-studio/videos` (`scripts/lib/videos-root.mjs`, mirrored by `scripts/videos_root.py`).
3. Voice a video's script with Kokoro, locally: one WAV per scene, its measured length and the start and end of every word, written back into `voiceover.json` (`scripts/tts.py`).
4. Turn those seconds into frames: scene lengths, the whole video's length and the frame of any spoken phrase (`src/lib/timing.ts`, `src/lib/words.ts`).
5. List every video in the root as a Remotion composition, and its optional asset sheet as a still, with no tracked file changed (`src/Root.tsx`).
6. Draw a video's picture in one of three ways: React and CSS, a canvas repainted each frame (`src/components/CanvasScene.tsx`), or FFrames in Rust (`skills/fframes-studio-video/SKILL.md`). Add GPU shaders on top as an option (`src/components/Shader.tsx`).
7. Synthesize a music bed, an end sting and UI effects locally (`scripts/sound.py`).
8. Render a still or the MP4 into the video's `out/` folder from a slug alone (`scripts/render.mjs`, `scripts/lib/remotion-args.mjs`).
9. Check a render: a contact sheet (`scripts/sheet.mjs`), `ffprobe` for length and audio (`AGENTS.md`, step 10).
10. Study a reference video (`scripts/refs.mjs`) and build a making-of page (`scripts/process-page.mjs`).
11. Feed the same voice and timing to an FFrames project (`scripts/fframes_sync.py`).
12. Type-check video code that lives outside the repository (`scripts/lib/root-tsconfig.mjs` writes `<root>/tsconfig.json`).

### Rules and completion

1. No scene length is typed by hand. A scene lasts `ceil((durationSeconds + paddingSeconds) x fps)` frames (`src/lib/timing.ts`; the same formula in `scripts/fframes_sync.py`).
2. Every reveal waits for the word it shows (`useWord` in `src/lib/words.ts`; `AGENTS.md`, "Rules").
3. A frame is a pure function of its number, so a render is reproducible (`docs/pipeline.md`, "Where the agent works"; `CanvasScene`'s "`draw` must depend only on `info.frame`"; `Shader.tsx` drives the shader clocks from the frame).
4. A video's files never enter the repository. The root is outside it, and `npm run acceptance` fails when a command leaves a file in the checkout (`scripts/acceptance.sh`).
5. A render does not copy other videos into its bundle: the CLI symlinks the public folder, which is the root (`remotion.config.ts`; `docs/videos-root.md`, "Spike findings"). `npm run acceptance` checks the symlink.
6. A scene is voiced again only when its text, voice or speed changed, its WAV is missing, or it has no word timings (`scripts/tts.py`, `scene_hash`).
7. A video is done when its stills and contact sheet were looked at, and `ffprobe` shows the summed scene length and an audio track (`AGENTS.md`, steps 9 and 10, and "Rules").
8. **Inferred:** an unvoiced or broken video must not hide the others. `Root.tsx` catches the timing error, warns and skips that video; the template's `Hook.tsx` calls `getScene` inside the component for the same reason (its comment).
9. **Inferred:** a video becomes a composition only with `Video.tsx`, `config.ts` and `voiceover.json` all present and voiced; a `Sheet.tsx` alone gives a still (`src/Root.tsx`). FFrames videos delete `Video.tsx`, so Remotion leaves them out (`skills/fframes-studio-video/SKILL.md`, step 1).

### Error handling

1. `new-video` stops on a slug that is not kebab case, on a folder that exists, and on a non-positive `--fps` (`scripts/new-video.mjs`).
2. `render` and `still` stop on a missing or malformed slug or still name, and on an unknown mode (`scripts/lib/remotion-args.mjs`, tested in `remotion-args.test.mjs`).
3. A config file that is not JSON, or whose `videosDir` is not a string, stops the command with its path; a missing or unreadable one is skipped (`videos-root.mjs`, `videos_root.py`, both tested).
4. A scene with no duration throws "Run: npm run voice"; a phrase the scene never says throws with the words it does say (`timing.ts`, `words.ts`).
5. `voice` stops when a video has no `voiceover.json`, and when the espeak-ng data path is 160 characters or longer (`tts.py`).
6. `sheet` stops when the MP4 is missing and names the render command (`sheet.mjs`). `fframes-sync` stops when the project has no `Cargo.toml` or a scene has no voice (`fframes_sync.py`).
7. `Shader` fails the render when the WebGPU renderer stops (`docs/styles/shaders.md`, "Troubleshooting").

### Scope

- **In:** one person's local, private explainer videos, made by coding agents; free, local tools only (`AGENTS.md`, "Rules").
- **Out:** paid APIs and keys; a server or any shared storage; syncing the root between machines, and the playground app (spec #22, "Out of Scope"); HyperFrames (`docs/renderers.md`).

## 2. Entities and relationships

| Entity | What it is | State it owns | Where |
|---|---|---|---|
| **Videos root** | the folder of every video | its path, resolved per command | `scripts/lib/videos-root.mjs`, `scripts/videos_root.py` |
| **Video** | one explainer | `<root>/<slug>/`: brief, script, code, assets, audio, outputs | `templates/video/` is its seed |
| **Voiceover** | the script and its measured clock | `voiceover.json`: scenes, text, voice, speed, durations, words, hash | written by `scripts/tts.py`, read by `src/lib/` |
| **Scene** | one narration line and the picture under it | its entry in `voiceover.json` and one file in `scenes/` | the video's folder |
| **Composition** | a video as Remotion sees it | none: derived on each bundle | `src/Root.tsx` |
| **Style** | a look: Studio, Sketchbook or FFrames | drawing code and rules | `src/styles/`, `skills/`, `docs/styles/` |
| **Output** | a still, the MP4, a contact sheet, reference frames, a process page | files in `<root>/<slug>/out/` | `scripts/render.mjs`, `sheet.mjs`, `refs.mjs`, `process-page.mjs` |

Fields, not entities: the slug and composition id (a slug's PascalCase, `compositionId` in `videos-root.mjs` and `Root.tsx`), `config.ts`'s fps and size, the brief's sections, the sound files.

```text
Videos root ──contains──> Video ──has──> Voiceover ──lists──> Scene
                            │                │
                            │                └──read by──> timing.ts / words.ts ──> frames
                            ├──has──> Output (out/)
                            └──drawn in──> Style
Root.tsx ──finds every──> Video ──registers──> Composition (+ <Id>Sheet still)
render.mjs ──slug──> remotion-args.mjs ──> npx remotion render|still Composition ──> Output
```

The **orchestrator** is the agent following `AGENTS.md` or a style skill: no code runs the whole lifecycle except `scripts/acceptance.sh`, a test. **Durable state** lives only in the video's folder; the studio's code keeps no state between commands. **Rules live with their data:** lengths with the voiceover (`timing.ts`), the root's order with its resolver, slug and name validity with the command that takes them.

## 3. Class design

The studio has no classes. Its modules are plain functions and React components, and each npm script is a small command over one module.

### Modules and their API

- **`scripts/lib/videos-root.mjs`**: `videosRoot(env)`, `videoDir(slug)`, `outputDir(slug)` (`<root>/<slug>/out`), `configFile(env)`, `compositionId(slug)`. Reads the environment and the config file; never creates the root.
- **`scripts/videos_root.py`**: `videos_root(env)` and `config_file(env)`, the same order and edge cases, standard library only.
- **`scripts/lib/remotion-args.mjs`**: `remotionArgs(mode, argv, env)` returns the Remotion CLI arguments for `render` or `still`, with the output path in `out/`; rejects bad input with the usage line.
- **`scripts/lib/root-tsconfig.mjs`**: `writeRootTsconfig(root, checkout)` writes `<root>/tsconfig.json` when it is missing, older, points at a gone checkout or not at a usable main worktree; leaves a file without its `"//"` marker alone. `rootTsconfig`, `exportPaths`, `mainWorktree` are its parts, tested in `root-tsconfig.test.mjs`.
- **`scripts/lib/tailwind-source-loader.cjs`**: adds `@source "<root>"` after `@import "tailwindcss"`, so Tailwind scans video code.
- **`remotion.config.ts`**: resolves and creates the root, makes it the public folder, adds the `@studio` (to `src/`) and `@videos` (to the root) aliases and the studio's `node_modules` to `resolve.modules`, the Tailwind loader, JPEG frames, overwrite on, and the ANGLE OpenGL renderer for WebGPU.
- **`src/Root.tsx`**: `require.context("@videos", ...)` over `<slug>/(Video.tsx|Sheet.tsx|config.ts|voiceover.json)`, one `<Folder>` per slug with a `<Composition>` and an optional `<Still id="<Id>Sheet">`.
- **`src/lib/timing.ts`**: types `Voiceover`, `VoiceoverScene`, `Word`; `getScene`, `sceneFrames`, `totalFrames`. The only place lengths are computed.
- **`src/lib/words.ts`**: `wordFrame`, `wordEndFrame`, and the hook `useWord(voiceover, sceneId, phrase, occurrence?)`. Matches phrases with case and punctuation ignored.
- **`src/lib/sketch.ts`**: pure, seeded canvas helpers: easing (`prog`, `easeOut`, `backOut`), `rng`, `noise2`, point-list shapes, `partial`, `wobble`, `ink`, `fill`, `hatch`, `typed`.
- **`src/components/`**: building blocks videos import as `@studio/components/<Name>`: `Captions`, `Cursor` (and `cursorAt`), `Travel` (and `pointOnPath`), `Typewriter`, `KineticTitle`, `Grain`, `CanvasScene`, `Shader`, `ShaderLayer`, `PixelSprite`.
- **Scripts with no shared module**: `tts.py` (voice), `sound.py` (sound), `fframes_sync.py`, `sheet.mjs`, `refs.mjs`, `process-page.mjs`, `shader-catalogue.mjs`, `new-video.mjs`, `render.mjs`. Each is described where the trace calls it.

### Styles in the code

| | Studio (default) | Sketchbook | FFrames | Shaders (add-on) |
|---|---|---|---|---|
| Renderer | Remotion | Remotion | FFrames, Rust | Remotion, over Studio or Sketchbook |
| Drawing | React and CSS scenes | one `CanvasScene` `draw(ctx, { frame })` per shot | `svgr!` SVG and SkSL shaders in `<root>/<slug>/fframes/` | `<Shader layers={...}>` behind or over a scene |
| Studio code | `src/components/` | `src/styles/sketchbook/` (theme, paper, blueprint, hud, mascot, props, `makeRamp`) on `src/lib/sketch.ts` | `scripts/fframes_sync.py` writes `src/timing.rs` and links the WAVs | `src/components/Shader.tsx`, `skills/shader-video/effects.md` from `npm run shader-catalogue` |
| fps | 30 (template) | 24 (`new-video --fps 24`) | the project's own | the host style's |
| Captions | on (`Captions`) | off unless asked | from `<SCENE>_SHOWN` | the host style's |
| Steps | `AGENTS.md` | `skills/sketchbook-video/SKILL.md` | `skills/fframes-studio-video/SKILL.md` | `skills/shader-video/SKILL.md` |
| Why | `docs/styles/studio.md` | `docs/styles/sketchbook.md` | `docs/styles/fframes.md`, `docs/renderers.md` | `docs/styles/shaders.md` |

Each style changes only the picture and effects layers; voice, timing, sound, captions and checks are shared (`docs/pipeline.md`). Two things in the code carry a style's rules:

- **Sketchbook's storyboard switch.** `makeRamp(STORYBOARD)` in `src/styles/sketchbook/storyboard.ts` returns 1 for every ramp while the video's `config.ts` has `STORYBOARD = true`, so each frame shows the shot's end pose. One `draw` serves both the storyboard and the animation.
- **Shader determinism.** `Shader.tsx` never starts the `shaders` package's wall-clock loop. Per frame it pushes props, then draws once at `frame / fps` (twice after a stack change), holding `performance.now()` and stubbing `requestAnimationFrame` around the renderer. `shaders` is pinned exactly in `package.json` because this depends on its internals. `remotion.config.ts` sets ANGLE, without which the WebGPU canvas is missing from the frame. `ShaderLayer.tsx` is a separate, plain WebGL GLSL layer with Shadertoy-style uniforms, built for the FFrames comparison (`docs/renderers.md`).

### The repository

```text
explainer-studio/
├── AGENTS.md                 the process and rules agents follow (CLAUDE.md points here)
├── README.md                 what the studio is, set-up, the short command list
├── PRONUNCIATION.md          respelling words Kokoro says wrong
├── package.json              every npm run command, pinned Remotion 4.0.532 and shaders 4.0.0
├── remotion.config.ts        the videos root as public folder, @studio and @videos aliases, Tailwind, ANGLE
├── tsconfig.json             strict types for src/ (lint runs tsc)
├── eslint.config.mjs         Remotion's flat ESLint config
├── tts-requirements.txt      the Kokoro venv's pinned packages
├── skills-lock.json          the Remotion agent skills that setup:skills restores
├── src/
│   ├── index.ts              registerRoot(RemotionRoot)
│   ├── index.css             @import "tailwindcss"
│   ├── Root.tsx              finds every video in the root, registers compositions and sheets
│   ├── require-context.d.ts  the type of the bundler's require.context
│   ├── lib/
│   │   ├── timing.ts         voiceover types; the only scene-length maths
│   │   ├── words.ts          the frame of a spoken phrase; useWord
│   │   └── sketch.ts         seeded canvas drawing helpers
│   ├── components/           shared building blocks, imported as @studio/components/...
│   └── styles/sketchbook/    the Sketchbook style's palettes, cast, props and storyboard ramp
├── scripts/
│   ├── new-video.mjs         npm run new-video
│   ├── render.mjs            npm run render and npm run still
│   ├── tts.py                npm run voice
│   ├── sound.py              npm run sound
│   ├── sheet.mjs             npm run sheet
│   ├── refs.mjs              npm run refs
│   ├── process-page.mjs      npm run process
│   ├── fframes_sync.py       npm run fframes-sync
│   ├── shader-catalogue.mjs  npm run shader-catalogue
│   ├── acceptance.sh         npm run acceptance: the lifecycle in a scratch root
│   ├── videos_root.py        the root for the Python scripts
│   ├── videos_root_test.py   its tests (npm test)
│   └── lib/
│       ├── videos-root.mjs        the root resolver (npm run root)
│       ├── remotion-args.mjs      slug to Remotion CLI arguments and out/ path
│       ├── root-tsconfig.mjs      writes <root>/tsconfig.json
│       ├── tailwind-source-loader.cjs  lets Tailwind scan the root
│       └── *.test.mjs             node:test tests for the three modules above
├── templates/video/          what new-video copies: brief, voiceover, config, Video.tsx, scenes/Hook.tsx
├── skills/                   the studio's own skills: make-explainer, installed globally, and the style skills sketchbook-video, shader-video, fframes-studio-video
├── docs/
│   ├── low-level-design.md   this page
│   ├── pipeline.md           the twelve layers from idea to MP4
│   ├── videos-root.md        the root's resolver, outputs, aliases and limits
│   ├── renderers.md          Remotion against HyperFrames and FFrames
│   ├── styles/               one page per style, and shaders
│   └── agents/               issue tracker, triage labels, domain docs
└── .handoff/                 hand-off notes from past sessions
```

Ignored and local: `node_modules/`, the `tts/` venv, `.claude/skills/` and `.agents/` (installed skills), `.scratch/` (`.gitignore`).

### One video under the root

```text
<root>/
├── tsconfig.json             written by new-video: type-checks every video against a studio checkout
└── <slug>/                   one video, for example shipyard-architecture
    ├── brief.md              goal, audience, style, look, scene list, asset list
    ├── voiceover.json        the scenes; npm run voice adds audioFile, durationSeconds, words, hash
    ├── config.ts             FPS, WIDTH, HEIGHT, accent; STORYBOARD in a sketchbook video
    ├── Video.tsx             default export: a <Series> of the scenes, lengths from sceneFrames
    ├── Sheet.tsx             optional asset sheet, registered as the still <Id>Sheet
    ├── scenes/               one file per scene
    ├── draw/                 sketchbook only: ramp.ts and the video's own props
    ├── assets/               images; sound/ from npm run sound, with SOURCES.md
    ├── audio/                one Kokoro WAV per scene, from npm run voice
    ├── refs/                 reference videos downloaded by npm run refs
    ├── fframes/              FFrames only: the Rust project; src/timing.rs and assets/ from fframes-sync
    └── out/                  every output, excluded from type-checking
        ├── <slug>.mp4        npm run render
        ├── <name>.png        npm run still, including sheet-assets.png and storyboard boards
        ├── sheet.png         npm run sheet
        ├── refs/<name>/      npm run refs: probe, cuts, key poses, shots.png, contact.png
        └── process/          sketchbook stage snapshots, and process.html from npm run process
```

Videos also hold their own helper files beside `scenes/` (shared parts, UI mocks, themes); nothing in the studio constrains their names.

## 4. Implementation

### The lifecycle of one video

One Studio-style video, `shipyard-architecture`, traced from the scaffold to the checked MP4. Each line names the owning file; `<root>` is `npm run --silent root`. `npm run acceptance` runs the scaffold, voice, listing, still, render and sheet steps of this trace in a scratch root.

```text
npm run new-video -- shipyard-architecture [--fps 24]            scripts/new-video.mjs
├── check the slug is kebab case, and <root>/<slug>/ is new
├── videosRoot()                                                 scripts/lib/videos-root.mjs
├── mkdir <root>; writeRootTsconfig(root, checkout)              scripts/lib/root-tsconfig.mjs
├── copy templates/video/ → <root>/<slug>/; fill __COMPONENT__ (ShipyardArchitecture) and __TITLE__
└── set FPS in config.ts when --fps is given
    state: brief.md, voiceover.json (durationSeconds 0), config.ts, Video.tsx, scenes/Hook.tsx

brief                                                             the agent; AGENTS.md steps 3-4
├── fill <root>/<slug>/brief.md from templates/video/brief.md's sections
└── npm run refs -- <slug> <url> [--name n]  (when imitating a video)   scripts/refs.mjs
    └── yt-dlp → <slug>/refs/n.mp4; ffprobe, ffmpeg → out/refs/n/ (cuts, key poses, shots.png)

asset sheet                                                       AGENTS.md step 5
├── write <root>/<slug>/Sheet.tsx
├── Root.tsx registers it as ShipyardArchitectureSheet, even unvoiced    src/Root.tsx
└── npm run still -- <slug> sheet-assets --sheet                 scripts/render.mjs
    ├── remotionArgs("still", …) → still ShipyardArchitectureSheet <root>/<slug>/out/sheet-assets.png
    │                                                             scripts/lib/remotion-args.mjs
    └── npx remotion still …                                      remotion.config.ts: root, aliases
        → out/sheet-assets.png; the agent reads it

voice and word timings                                            AGENTS.md step 6
├── write the scenes into voiceover.json (id, text, voice, speed, paddingSeconds)
└── npm run voice -- <slug>                                       scripts/tts.py
    ├── videos_root()                                             scripts/videos_root.py
    ├── per scene: set audioFile "<slug>/audio/<id>.wav"; hash text, voice, speed
    ├── hash changed, WAV missing or no words → synthesize()      Kokoro KPipeline
    │   └── write audio/<id>.wav at 24 kHz; collect words {text, start, end}
    └── write durationSeconds (measured), words, hash back into voiceover.json
    state: every scene has durationSeconds > 0 and words

storyboard                                                        AGENTS.md step 7
├── scenes/*.tsx at their end pose; Video.tsx <Series.Sequence durationInFrames=sceneFrames(…)>
│                                                                 src/lib/timing.ts
├── Root.tsx: totalFrames(voiceover, FPS) → <Composition id="ShipyardArchitecture">
└── npm run still -- <slug> board-<n> --frame=<last frame of scene n>   scripts/render.mjs
    → out/board-<n>.png; the agent reads each

scene timing and animation                                        AGENTS.md step 8
├── sceneFrames = ceil((durationSeconds + paddingSeconds) × fps)  src/lib/timing.ts
├── useWord(voiceover, "hook", "pipeline") → frame of that word   src/lib/words.ts
└── components: Captions, Cursor, Travel, KineticTitle, Grain …   src/components/

sound                                                             AGENTS.md step 8
└── npm run sound -- <slug> --seconds <N> [--bpm 96] [--seed 1]  scripts/sound.py
    └── <slug>/assets/sound/: bed, sting, click, tick, whoosh, pop .wav, SOURCES.md
        (placed with <Audio src={staticFile("<slug>/assets/sound/pop.wav")}> on cue frames)

stills                                                            AGENTS.md step 9, "Rules"
└── npm run still -- <slug> <name> --frame=<n>  → out/<name>.png  scripts/render.mjs

render                                                            AGENTS.md step 9
└── npm run render -- <slug>                                      scripts/render.mjs
    ├── remotionArgs("render", …) → render ShipyardArchitecture <root>/<slug>/out/<slug>.mp4
    └── npx remotion render …                                     remotion.config.ts
        ├── bundle src/index.ts; @videos → <root>; public folder symlinked, not copied
        └── Remotion's FFmpeg encodes video and audio → out/shipyard-architecture.mp4

final checks                                                      AGENTS.md step 10
├── npm run sheet -- <slug> [--every 0.5]                         scripts/sheet.mjs
│   └── ffprobe duration; ffmpeg fps=1/every, tile 7 across → out/sheet.png; the agent reads it
├── ffprobe <root>/<slug>/out/<slug>.mp4: duration = totalFrames / fps, one audio stream
└── npm run process -- <slug>  (only when asked)                  scripts/process-page.mjs
    └── out/process/NN-stage/NOTES.md and files → out/process/process.html
```

The other styles branch off this trace and rejoin it:

- **Sketchbook** (`skills/sketchbook-video/SKILL.md`): `new-video --fps 24`, `refs` before the brief, `STORYBOARD = true` in `config.ts` for the boards and `false` to animate, a render and `sheet` loop per review round, and a snapshot of every stage into `out/process/`, which `npm run process` turns into a page.
- **FFrames** (`skills/fframes-studio-video/SKILL.md`): `new-video`, then delete `Video.tsx` and `scenes/`, `cargo fframes new … --dir fframes`, `npm run voice`, `npm run fframes-sync -- <slug> --fps <N>` (writes `fframes/src/timing.rs`, links `audio/` and `assets/sound/` WAVs into `fframes/assets/`), `npm run sound`, `fframes-sync` again, review with the project's `timeline`, `inspect`, `strip`, `audio analyze`, and `cargo run --release -- render -o ../out/<slug>.mp4`.
- **Shaders** (`skills/shader-video/SKILL.md`): candidate stacks on `Sheet.tsx`, `npm run still -- <slug> shader-sheet --sheet`, the user picks, scenes use `<Shader>`; one frame rendered twice must give identical files.

### Traced scenario: a scene's length and a cue

A 30 fps video whose scene `hook` says "Shipyard builds every branch."

1. Before `npm run voice`: `durationSeconds` is 0. `sceneFrames` → `getScene` throws "has no duration. Run: npm run voice". `Root.tsx` catches it, warns `shipyard-architecture: …` and leaves the composition out; other videos still list.
2. `npm run voice -- shipyard-architecture`: the WAV measures, say, 2.130 s. `voiceover.json` now holds `durationSeconds: 2.13`, `paddingSeconds: 0.4`, `words: [{ "text": "Shipyard", "start": 0.1, … }, …]`, `hash`.
3. `sceneFrames(voiceover, "hook", 30)` = `ceil(((2.13 + 0.4) × 30).toFixed(3))` = `ceil(75.9)` = 76. `totalFrames` sums every scene; `Root.tsx` registers `ShipyardArchitecture` with that length.
4. `useWord(voiceover, "hook", "branch")` normalizes both sides (`branch.` → `branch`), finds the word and returns `round(start × 30)`, the frame the reveal waits for.
5. Edit the line to "Shipyard builds each branch." and run `voice` again: the hash changes, so only `hook` is regenerated, and its length and words update. No frame number in the code changes by hand.

**Rejection:** `useWord(voiceover, "hook", "pipeline")` throws `Scene "hook" never says "pipeline". It says: Shipyard builds each branch`, which fails the still or render at that scene rather than placing the reveal at a guessed frame.

## 5. Extensibility

| Change | What you touch |
|---|---|
| A new video | nothing tracked: `npm run new-video` and files under `<root>/<slug>/`; `Root.tsx` finds it |
| A new shared building block | one file in `src/components/`, and a line in `AGENTS.md`, "Layout" |
| A new Remotion style | `src/styles/<style>/` (drawing code), `docs/styles/<style>.md`, a skill in `skills/`, a row in the styles table in `AGENTS.md`; `templates/video/brief.md`'s Style line |
| A new output kind | a script that writes under `outputDir(slug)` from `scripts/lib/videos-root.mjs`, an `npm run` line in `package.json`, a row in `docs/videos-root.md`'s outputs table |
| Moving the root | `STUDIO_VIDEOS_DIR` or `videosDir` in the config file; no code |
| Another voice engine | `scripts/tts.py` only, as long as it writes the same `voiceover.json` fields (`durationSeconds`, `words`, `audioFile`) |
| Another renderer | the pattern of `scripts/fframes_sync.py`: read `voiceover.json`, write that renderer's timing file, link the WAVs |
| A `shaders` upgrade | `package.json` (exact pin), `npm run shader-catalogue`, and the checks in `docs/styles/shaders.md`, "Recommendation" |
| A change to the timing formula | `src/lib/timing.ts` and `scripts/fframes_sync.py`, which repeats it |
| A change to the root's resolution order | `scripts/lib/videos-root.mjs` and `scripts/videos_root.py` together, with both test files |

### Observations

Weaknesses seen while reading, recorded without a proposed change:

- `compositionId` exists twice, in `src/Root.tsx` and `scripts/lib/videos-root.mjs`. The two agree today.
- The slug rule differs: `new-video.mjs` and `remotion-args.mjs` take `^[a-z0-9]+(-[a-z0-9]+)*$`, while `Root.tsx` lists any `[a-z0-9-]+` folder.
- The resolver (Node and Python) and the timing formula (TypeScript and Python) are each written twice by design; the resolver's two copies have tests, the timing formula's do not share one.
- `npm run sound --seconds` takes a length the agent computes by hand from `voiceover.json` and `config.ts`; `fframes-sync` prints it, the Remotion path does not.
- `npm run build` (`remotion bundle`) copies the whole root, every video's outputs included (`docs/videos-root.md`).
- `npx remotion compositions` fails on a root with no voiced video (`docs/videos-root.md`, "Known limits").
- `package.json` says `"license": "UNLICENSED"` while `LICENSE` and the README say MIT.
- `out/` folders also hold files no script writes (logs, metrics, extra stills), written by agents during checks.
- A video folder can hold only `out/`, with no sources; `Root.tsx` and every script skip it.

## Unknowns

Facts the code cannot show:

1. Why `remotion.config.ts` sets JPEG frames (`setVideoImageFormat("jpeg")`) and overwrite on.
2. Whether `npm run build` (`remotion bundle`) still has a use, given that it copies the whole root.
3. Whether a video folder with only `out/` (renders kept, sources gone) is an intended state, and whether the studio should list or clean such folders.
4. Whether files agents write by hand into `out/` (logs, metrics) should follow a convention.
5. Whether `ShaderLayer.tsx` is meant for new videos or kept only from the FFrames comparison, now that `Shader.tsx` is the documented way to use shaders.
6. Which license `package.json` should state: `UNLICENSED` or MIT.
7. Whether shaders will join the studio's defaults, and when: `docs/styles/shaders.md` says more trial is needed.
8. When and how the playground app for building blocks and pipeline layers (spec #22, "Out of Scope") will arrive, and what it changes here.
9. Whether `.handoff/` notes are meant to stay tracked in the repository.
