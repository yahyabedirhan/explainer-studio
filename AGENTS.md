# AGENTS.md

A local explainer-video studio: Remotion for picture, Kokoro for voice. No paid APIs or keys. Other projects use it as an external tool. They only hold ideas, and every video lives here.

## Videos are private

This repository is public, and a video can show the user's private projects. So every video lives in `videos/<slug>/` and its renders in `out/<slug>/`, and git ignores both: a video's files never reach a commit, a branch or a pull request. Commits carry only the studio itself: `src/`, `scripts/`, `templates/`, the docs and the config.

Make and keep videos in the studio's main checkout, on `main`. A worktree's ignored files go when the worktree is returned, so a video made in one moves to the main checkout before it's released.

## Making a video about another project

1. Treat the source project as read-only. Read its code, README, docs and PRs for understanding, and never write into it.
2. Scaffold: `npm run new-video -- <project>-<topic>`, for example `shipyard-architecture`. It creates `videos/<slug>/`, and `src/Root.tsx` finds it by itself.
3. Ask the user once, in a single round, what they want to learn from the video and anything else the brief can't settle from the project. Fill `videos/<slug>/brief.md` around that question. Keep the rest of the run free of check-ins: the user wants a video, not a discussion.
4. Draft the script and scene plan in `brief.md`, aimed at what the user wants to learn.
5. Put the narration in `voiceover.json`, run `npm run voice -- <slug>`, then build the scenes. For music and sound effects, run `npm run sound -- <slug> --seconds <N>` with the final length.
6. Check stills, then render to `out/<slug>/<slug>.mp4`.

## Video styles

- Shader effects as the picture: `skills/shader-video/SKILL.md`.

## Layout

- `videos/<slug>/`: everything one video needs, ignored by git. `brief.md` holds the brief and script, `voiceover.json` its scenes, `config.ts` its fps and size, `Video.tsx` the sequence (its default export), `scenes/` one file per scene, `assets/` its images and sound effects, and `audio/` the generated voice. `videos/` is Remotion's public folder, so `staticFile("<slug>/assets/logo.png")` reaches a video's own file.
- `src/lib/timing.ts`: the only place scene lengths are computed, as `ceil((durationSeconds + paddingSeconds) x fps)`.
- `src/lib/words.ts`: `useWord(voiceover, sceneId, phrase, occurrence?)`, plus `wordFrame` and `wordEndFrame`, give the frame where a narration word starts or ends. A phrase the scene never says throws.
- `src/Root.tsx`: registers each folder in `videos/` that has a `Video.tsx`, `config.ts` and `voiceover.json`, as a composition named after its slug (`shipyard-architecture` is `ShipyardArchitecture`).
- `src/components/`: building blocks shared by videos.
  - `Captions.tsx`: word-timed captions from a scene's `caption ?? text`.
  - `Cursor.tsx`: a pointer on an eased path; `cursorAt` gives its position and press state, for drags.
  - `Travel.tsx`: moves a child along a Bézier path.
  - `Typewriter.tsx`: types text out over frames.
  - `Shader.tsx`: effects from the `shaders` package, drawn at the frame's time. See `docs/shaders.md`.
  - `Grain.tsx`: film-grain overlay.
- `scripts/tts.py`: Kokoro voice generation (`npm run voice`). It also writes each scene's `words` (`text`, `start`, `end`, seconds from the scene WAV's start) into `voiceover.json`. The venv is `./tts`, Python 3.12, pinned in `tts-requirements.txt`.
- `scripts/sound.py`: `npm run sound -- <slug> --seconds <N> [--bpm 96] [--seed 1]` synthesizes a music bed, an end sting and click, tick, whoosh and pop effects into `videos/<slug>/assets/sound/`, with a `SOURCES.md`.
- `scripts/shader-catalogue.mjs`: `npm run shader-catalogue` regenerates `skills/shader-video/effects.md` after a `shaders` upgrade.
- `docs/shaders.md`: how the studio draws WebGPU shaders deterministically, and what doesn't work.
- `docs/renderers.md`: why the studio keeps Remotion over HyperFrames.
- `templates/video/`: what `npm run new-video` copies.
- `out/<slug>/`: renders and stills, ignored by git.

## Rules

- Never hardcode a scene length. All timing comes from `voiceover.json`, after `npm run voice`.
- Cue each reveal on the narration word it illustrates with `useWord`, not a guessed frame number.
- Write narration for the ear: short sentences, no symbols or unexplained abbreviations, numbers written as spoken. See [PRONUNCIATION.md](PRONUNCIATION.md).
- One scene per file.
- After every meaningful change, render stills at key frames (`npx remotion still <Id> out/<slug>/<name>.png --frame=<n>`) and look at them. A successful render command alone does not finish a task.
- Check final renders with `ffprobe`: length matches the summed scenes and there is an audio track.
- Avoid the generic AI look of a centred headline fading in over a gradient. Prefer bold typography, hard cuts, real UI captures (Playwright with Chromium is installed) and clear diagrams.
- Make small, targeted edits for feedback instead of rewriting.

## The Remotion skill

Read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to before writing Remotion code. It's written for any Remotion project, so some of its defaults don't fit this studio. Where the skill and this file disagree, this file wins. When you find a disagreement the table doesn't list, follow this file and add a row in the same change.

| Where the skill says | Do this instead |
|---|---|
| `SKILL.md`, "Open the preview" and "Render the video": start Studio before building, and render only when the user explicitly asks | Finish with step 6: stills you've looked at, then the MP4, checked with `ffprobe`. Start Studio (`npm run dev`) when the user asks to watch. |
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
