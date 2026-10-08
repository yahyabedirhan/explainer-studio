# AGENTS.md

To make a video with Explainer Studio, use the `make-explainer-video` skill (`skills/make-explainer-video/SKILL.md`). This file is for maintainers who change the studio.

Explainer Studio renders narrated explainer videos on the local machine. Remotion or FFrames renders the frames, and Kokoro generates the voice. It uses no paid APIs or keys. Other projects call it as an external tool and keep no video files: every video lives in the videos root, outside this repository.

## Two readers

| Reader | Starts at | Reads |
|---|---|---|
| An agent making a video | `skills/make-explainer-video/SKILL.md` | its `references/` (one file per layer option) and `presets/` |
| An agent changing the studio | this file | `docs/low-level-design.md`, `docs/decisions/`, `docs/videos-root.md`, the code |

Write each fact once, on the side of the reader who acts on it. What a video maker must do or know goes in the skill: a new rule, a component's use, a gotcha met while making a video. Why the studio is as it is goes in `docs/decisions/<topic>.md`, as a dated entry: what was tried, benchmarks, what was dropped and why.

## Layers, options and presets

A video picks one option per layer: renderer, drawing, look, effects, captions, voice, sound and optional steps. A preset is a saved set of choices. The skill's `SKILL.md` lists every layer, option and preset, and is the only place they are listed. `docs/low-level-design.md`, "Layers in the code", maps each option to its code, and "Extensibility" says what a new option, look, preset or layer touches. Change the skill and the code in the same commit: new code for an option updates that option's reference file.

## The videos root

Every video lives in one **videos root** outside the repository, shared by every checkout and worktree. This repository is public and a video can show the user's private projects, so a video's files never reach a commit, a branch or a pull request. Commits carry only the studio: `src/`, `scripts/`, `templates/`, `skills/`, the docs and the config.

The root resolves from `STUDIO_VIDEOS_DIR`, then `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json`, then `~/.local/share/explainer-studio/videos`. `npm run --silent root` prints it. `docs/videos-root.md` holds the detail: the resolver, the bundler aliases, the root's `tsconfig.json`, Tailwind and the known limits.

Every video shares one bundle and one type check. A change that renames or removes shared code (`src/lib/`, `src/components/`, `src/looks/`) breaks every video in the root that imports it: search the root for its imports, and rewrite them in the same session as the merge, with no migration code kept in the repository.

## Layout

Read `docs/low-level-design.md` before changing `src/` or `scripts/`: it maps which module owns what and traces one video from `npm run new-video` to the checked MP4.

- `src/Root.tsx`: registers each folder in the videos root that has `Video.tsx`, `config.ts` and `voiceover.json` as a composition named after its slug, and its `Sheet.tsx` as a still.
- `src/lib/timing.ts`: the only place scene lengths are computed, as `ceil((durationSeconds + paddingSeconds) x fps)`. `scripts/fframes_sync.py` repeats the formula for FFrames.
- `src/lib/words.ts`: `useWord`, `wordFrame` and `wordEndFrame`, the frame where a narration word starts or ends.
- `src/lib/sketch.ts`: pure, seeded drawing helpers for canvas scenes.
- `src/components/`: React components shared by videos, imported as `@studio/components/<Name>`.
- `src/looks/<look>/`: a look's Remotion code, for example `paper-blueprint`.
- `scripts/`: one file per `npm run` command; `scripts/lib/` holds the shared modules and their tests. `scripts/tts.py` voices with Kokoro, in the `./tts` venv (Python 3.12, pinned in `tts-requirements.txt`).
- `scripts/shader-catalogue.mjs`: `npm run shader-catalogue` regenerates the skill's shader catalogue after a `shaders` upgrade.
- `templates/video/`: what `npm run new-video` copies.
- `skills/make-explainer-video/`: the studio's only skill. Machines install it globally with `npx skills add yahyabedirhan/explainer-studio -g --skill make-explainer-video`. `.claude/skills/` holds the installed official skills and is ignored.
- `skills-lock.json`: the official Remotion skills and FFrames' `fframes-video`, which `npm run setup:skills` restores.
- `docs/low-level-design.md`, `docs/videos-root.md`, `docs/decisions/`: the maintainer's docs.

## Rules

- **Run the three checks.** `npm run lint`, `npm test`, and `npm run acceptance`, which makes two videos with different layer choices end to end in a scratch root and checks nothing lands in the checkout.
- **Look at what you changed.** After a change to drawing code, render stills of a video that uses it and look at them. A successful command alone does not finish a task.
- **Tests on scratch folders only.** Point `STUDIO_VIDEOS_DIR` and `XDG_CONFIG_HOME` at a temporary folder; never read or write the real root in a test.
- **Free and local.** No paid APIs or keys. A new dependency is free, local and pinned.
- **Keep feedback edits small.** Change only the part the user named.
- **One meaning per word.** When a word means one thing in code and another in video making, use a word that can't be read both ways, in docs, the skill, issues and comments. For example, write "narration" for the text the voice speaks, never "script", which here means code.
- **Code comments stand alone.** Assume the reader of the code has never seen the skill or the docs. Say what they need in the comment itself, and don't point at the skill. When a comment must point at a doc, give its repository path, for example `docs/videos-root.md`.

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
