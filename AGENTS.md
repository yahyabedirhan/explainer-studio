# AGENTS.md

A local explainer-video studio: Remotion for picture, Kokoro for voice. No paid APIs or keys. Other projects use it as an external tool. They only hold ideas, and every video lives in the videos root.

## The videos root

Every video lives in one **videos root** outside the repository, shared by every checkout and worktree. This repository is public and a video can show the user's private projects, so a video's files never reach a commit, a branch or a pull request. Commits carry only the studio itself: `src/`, `scripts/`, `templates/`, the docs and the config.

The root resolves in this order:

1. `STUDIO_VIDEOS_DIR`, when set.
2. `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json` (`~/.config/explainer-studio/config.json` by default), for example `{ "videosDir": "~/Movies/explainers" }`.
3. `~/.local/share/explainer-studio/videos`.

`npm run --silent root` prints it. Every command takes a slug and finds the root itself, so in these docs `<root>` stands for the printed path.

Each video is one folder, `<root>/<slug>/`:

- `brief.md` holds the brief and script, `voiceover.json` its scenes, `config.ts` its fps and size, `Video.tsx` the sequence (its default export), `scenes/` one file per scene, `assets/` its images and sound effects, `audio/` the generated voice.
- `out/`: every render and check of the video: stills, the MP4, the contact sheet, reference frames and the process page.

The root is Remotion's public folder, so `staticFile("<slug>/assets/logo.png")` reaches a video's own file. Video code imports the studio's shared code as `@studio/...`, for example `@studio/lib/words`.

## How a video is made

A video is four choices, made in this order:

1. **Renderer**: Remotion, the default, or FFrames (Rust). HyperFrames was tried and dropped: `docs/renderers.md` holds the benchmark and why.
2. **Drawing method**, in Remotion only: React and CSS elements, or a canvas the scene repaints each frame (`CanvasScene`). One video can mix both, scene by scene.
3. **Look**: the style below, plus effects such as grain and, optionally, shaders.
4. **Process**: the steps below, the same for every style.

The video passes through twelve layers from idea to MP4, and a style changes only the picture and effects layers: `docs/pipeline.md`.

## Styles

| Style | Fits | Captions | How |
|---|---|---|---|
| **Studio** (default) | products, interfaces, screenshots, data, architecture | on | the steps below, `docs/styles/studio.md` |
| **Sketchbook** | a concept or process explained in under a minute, drawn on paper and blueprint | off unless asked | `skills/sketchbook-video/SKILL.md`, `docs/styles/sketchbook.md` |
| **FFrames** | effect-heavy pieces, the pixel and thermal ad look | on | `skills/fframes-studio-video/SKILL.md`, `docs/styles/fframes.md` |

**Shaders** are an optional, experimental add-on to Studio or Sketchbook, not a style. Offer them only when one or a few effects clearly carry what the video explains, or when the user asks. The user picks every effect from a prototype sheet before any scene is built: `skills/shader-video/SKILL.md`, `docs/styles/shaders.md`.

When the chosen style has a skill, read it first and follow it in place of steps 4 to 10 below.

## Making a video about another project

1. Treat the source project as read-only. Read its code, README, docs and PRs for understanding, and never write into it.
2. Scaffold: `npm run new-video -- <project>-<topic>`, for example `shipyard-architecture`. It creates `<root>/<slug>/` and prints its path, and `src/Root.tsx` finds it by itself.
3. Ask the user once, in a single round, what they want to learn from the video, which style they want, and anything else the brief can't settle from the project. Offer the styles table with one recommended style for this subject; mention shaders only when an effect clearly fits. Keep the rest of the run free of check-ins: the user wants a video, not a discussion.
4. Fill `<root>/<slug>/brief.md` around the answers: the script, the scene plan and the list of every asset the scenes show. When the user names a video to imitate, study it first with `npm run refs -- <slug> <url>`.
5. **Asset sheet.** Draw every character, prop, UI mock and diagram element on one still, `<root>/<slug>/Sheet.tsx`, registered as `<Id>Sheet`. Render it with `npm run still -- <slug> sheet-assets --sheet`, read `<root>/<slug>/out/sheet-assets.png`, and fix anything that collides, reads badly or overflows. Done when every asset in the brief is on the sheet and reads at a glance.
6. Put the narration in `voiceover.json` and run `npm run voice -- <slug>`.
7. **Storyboard.** Build each scene at its end pose, with no motion yet. Render a still of each scene's last frame and fix the composition. Done when every scene's end pose reads as the brief says.
8. Animate: add the motion, every reveal cued on its narration word. For music and sound effects, run `npm run sound -- <slug> --seconds <N>` with the final length.
9. Check stills at key frames, then render with `npm run render -- <slug>`, to `<root>/<slug>/out/<slug>.mp4`.
10. Final checks: a contact sheet of the render (`npm run sheet -- <slug>`) that you look at, and `ffprobe` for the length and the audio track. Build a making-of page with `npm run process -- <slug>` only when the user asks for one.

## Layout

- `<root>/<slug>/`: one video, as "The videos root" says. `docs/videos-root.md` holds the technical detail: the resolver, the bundler aliases, Tailwind and the known limits.
- `src/lib/timing.ts`: the only place scene lengths are computed, as `ceil((durationSeconds + paddingSeconds) x fps)`.
- `src/lib/words.ts`: `useWord(voiceover, sceneId, phrase, occurrence?)`, plus `wordFrame` and `wordEndFrame`, give the frame where a narration word starts or ends. A phrase the scene never says throws.
- `src/lib/sketch.ts`: pure, seeded drawing helpers for canvas scenes: easing, value noise, point-list shapes, `partial` for draw-on strokes, `wobble` and `ink` for a boiling pen line, `hatch` for shading.
- `src/Root.tsx`: registers each folder in the videos root that has a `Video.tsx`, `config.ts` and `voiceover.json`, as a composition named after its slug (`shipyard-architecture` is `ShipyardArchitecture`).
- `src/styles/<style>/`: drawing code for a named video style (see Styles).
- `docs/styles/<style>.md`: what a style looks like, where it comes from and what was learned making it.
- `docs/pipeline.md`: the twelve layers from idea to MP4 and the owner of each.
- `src/components/`: building blocks shared by videos.
  - `Captions.tsx`: word-timed captions from a scene's `caption ?? text`.
  - `Cursor.tsx`: a pointer on an eased path; `cursorAt` gives its position and press state, for drags.
  - `Travel.tsx`: moves a child along a Bézier path.
  - `Typewriter.tsx`: types text out over frames.
  - `KineticTitle.tsx`: a full-frame kinetic headline, a kicker line over big words that build in.
  - `Shader.tsx`: effects from the `shaders` package, drawn at the frame's time. See `docs/styles/shaders.md`.
  - `Grain.tsx`: film-grain overlay.
  - `CanvasScene.tsx`: a full-frame `<canvas>` that a scene repaints from scratch each frame with `draw(ctx, { frame, ... })`, after its fonts load. Use it for hand-drawn or diagram-heavy shots where the code draws every frame.
  - `ShaderLayer.tsx`: a GLSL fragment shader on a WebGL canvas, drawn each frame with Shadertoy-style uniforms. Render and take stills with `--gl=angle`.
  - `PixelSprite.tsx`: pixel art from a character grid, as crisp SVG, with an optional extruded depth.
- `scripts/tts.py`: Kokoro voice generation (`npm run voice`). It also writes each scene's `words` (`text`, `start`, `end`, seconds from the scene WAV's start) into `voiceover.json`. The venv is `./tts`, Python 3.12, pinned in `tts-requirements.txt`.
- `scripts/sound.py`: `npm run sound -- <slug> --seconds <N> [--bpm 96] [--seed 1]` synthesizes a music bed, an end sting and click, tick, whoosh and pop effects into `<root>/<slug>/assets/sound/`, with a `SOURCES.md`.
- `scripts/refs.mjs`, `scripts/sheet.mjs`, `scripts/process-page.mjs`: `npm run refs -- <slug> <url>` pulls a reference's cuts and key poses, `npm run sheet -- <slug>` makes a contact sheet of a render, `npm run process -- <slug>` builds a making-of page from `<root>/<slug>/out/process/`. All three write into `<root>/<slug>/out/`.
- `scripts/render.mjs`: `npm run render -- <slug>` renders `<root>/<slug>/out/<slug>.mp4`, and `npm run still -- <slug> <name> [--sheet] [--frame=<n>]` a still to `<root>/<slug>/out/<name>.png`. Other flags go on to Remotion.
- `scripts/lib/videos-root.mjs`: resolves the videos root (`npm run root` prints it); `scripts/videos_root.py` mirrors it for the Python scripts.
- `scripts/lib/root-tsconfig.mjs`: writes `<root>/tsconfig.json`, so `npx tsc -p <root>` and editors type-check video code.
- `scripts/migrate.mjs`, `scripts/lib/migrate.mjs`: `npm run migrate` moves a checkout's `videos/` and `out/` into the root.
- `scripts/shader-catalogue.mjs`: `npm run shader-catalogue` regenerates `skills/shader-video/effects.md` after a `shaders` upgrade.
- `scripts/fframes_sync.py`: `npm run fframes-sync -- <slug> --fps <N>` writes an FFrames project's `src/timing.rs` from `voiceover.json` and links the video's WAVs into its `assets/`.
- `skills/`: the studio's own skills, tracked (`.claude/skills/` holds installed ones and is ignored).
- `docs/renderers.md`: the renderer benchmarks, why Remotion is the default, when FFrames fits, and why HyperFrames was dropped.
- Remotion packages beyond the core: `@remotion/paths` (strokes that draw on), `@remotion/shapes` (diagram shapes), `@remotion/layout-utils` (text that fits its box), `@remotion/motion-blur`, `@remotion/noise`, `@remotion/google-fonts` and `@remotion/media`.
- `templates/video/`: what `npm run new-video` copies.
- `npm test`: the Node tests (`scripts/**/*.test.mjs`) and the Python tests (`scripts/*_test.py`), on scratch folders only.
- `scripts/acceptance.sh`: `npm run acceptance` makes two videos end to end in a scratch root and checks nothing lands in the checkout.

## Rules

- Never hardcode a scene length. All timing comes from `voiceover.json`, after `npm run voice`.
- Cue each reveal on the narration word it illustrates with `useWord`, not a guessed frame number.
- Write narration for the ear: short sentences, no symbols or unexplained abbreviations, numbers written as spoken. See [PRONUNCIATION.md](PRONUNCIATION.md).
- One scene per file.
- After every meaningful change, render stills at key frames (`npm run still -- <slug> <name> --frame=<n>`, into `<root>/<slug>/out/<name>.png`) and look at them. A successful render command alone does not finish a task.
- Check final renders with `ffprobe`: length matches the summed scenes and there is an audio track.
- Avoid the generic AI look of a centred headline fading in over a gradient. Prefer bold typography, hard cuts, real UI captures (Playwright with Chromium is installed) and clear diagrams.
- Make small, targeted edits for feedback instead of rewriting.
- Everything stays free and local: no paid APIs or keys. Draw art in code first. When code can't draw it, use a freely licensed file with its source and licence noted beside it, as for sound.

## The Remotion skill

Read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to before writing Remotion code. It's written for any Remotion project, so some of its defaults don't fit this studio. Where the skill and this file disagree, this file wins. When you find a disagreement the table doesn't list, follow this file and add a row in the same change.

| Where the skill says | Do this instead |
|---|---|
| `SKILL.md`, "Open the preview" and "Render the video": start Studio before building, and render only when the user explicitly asks | Finish with steps 9 and 10: stills you've looked at, then the MP4, checked with `ffprobe`. Start Studio (`npm run dev`) when the user asks to watch. |
| Render or take a still with `npx remotion render` or `npx remotion still` | `npm run render -- <slug>` and `npm run still -- <slug> <name>`, which write into `<root>/<slug>/out/`. |
| Write scene lengths inline as literal numbers | Lengths come from `voiceover.json` through `src/lib/timing.ts`. |
| `remotion-markup/voiceover.md`: ElevenLabs, ask the user for an API key, size the composition with `calculateMetadata` | Kokoro through `npm run voice`, which needs no key. Lengths as above. |
| `remotion-markup/sfx.md`: `remotion.media` URLs, search the internet | Sound effects are local files in the video's `assets/`: made locally (`npm run sound`, or your own script in the `./tts` venv, which has numpy and soundfile), or a freely licensed file with its source and licence noted beside it. |
| `remotion-markup/REFERENCE.md`: make components editable with `Interactive.withSchema` and `Interactive.Div` | Plain JSX components and `<div>`s, as the studio's components and `skills/shader-video/patterns.md` do. |
| `remotion-captions/`: transcribe the voiceover with Whisper, then show a copied Basic Captions element fed an inline caption array | Captions are the script: use `<Captions>`, which shows each scene's `caption ?? text` from `voiceover.json`, timed by its word timings. |

## Setting up again

```sh
npm install
npm run setup:voice
npm run setup:skills
```

Needs `espeak-ng` and `ffmpeg` from Homebrew. If uv resolves an old `transformers` that tries to build `tokenizers` with Rust, pin `"transformers>=4.40"`.

## Agent skills

### Issue tracker

GitHub issues in `yahyabedirhan/explainer-studio`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, each named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
