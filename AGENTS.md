# AGENTS.md

A local explainer-video studio: Remotion for picture, Kokoro for voice. No paid APIs or keys. Other projects use it as an external tool. They only hold ideas, and every video lives here.

## Making a video about another project

1. Treat the source project as read-only. Read its code, README, docs and PRs for understanding, and never write into it.
2. Scaffold: `npm run new-video -- <project>-<topic>`, for example `shipyard-architecture`. Register the printed `<Composition>` in `src/Root.tsx`.
3. Fill `src/videos/<slug>/brief.md` from what you learned and from the user's request. Ask the user for anything the brief still needs.
4. Draft the script and scene plan and get the user's approval before writing animation code.
5. Put the approved narration in `voiceover.json`, run `npm run voice -- <slug>`, then build the scenes.
6. Check stills, then render to `out/<slug>/<slug>.mp4`.

## Layout

- `src/videos/<slug>/`: one video. `voiceover.json` holds its scenes, `config.ts` its fps and size, `Video.tsx` the sequence, and `scenes/` one file per scene.
- `src/lib/timing.ts`: the only place scene lengths are computed, as `ceil((durationSeconds + paddingSeconds) x fps)`.
- `src/components/`: building blocks shared by videos.
- `scripts/tts.py`: Kokoro voice generation (`npm run voice`). The venv is `./tts`, Python 3.12, pinned in `tts-requirements.txt`.
- `templates/video/`: what `npm run new-video` copies.
- `public/audio/<slug>/` and `out/` are generated and ignored by git.

## Rules

- Never hardcode a scene length. All timing comes from `voiceover.json`, after `npm run voice`.
- Write narration for the ear: short sentences, no symbols or unexplained abbreviations, numbers written as spoken. See [PRONUNCIATION.md](PRONUNCIATION.md).
- One scene per file.
- After every meaningful change, render stills at key frames (`npx remotion still <Id> out/<slug>/<name>.png --frame=<n>`) and look at them. A successful render command alone does not finish a task.
- Check final renders with `ffprobe`: length matches the summed scenes and there is an audio track.
- Avoid the generic AI look of a centred headline fading in over a gradient. Prefer bold typography, hard cuts, real UI captures (Playwright with Chromium is installed) and clear diagrams.
- Make small, targeted edits for feedback instead of rewriting.
- Read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to before writing Remotion code. Where it says to write scene lengths inline as literal numbers, the timing rule above wins.

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
