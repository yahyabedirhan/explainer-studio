# explainer-studio

A local studio for narrated explainer videos, made by coding agents. [Remotion](https://www.remotion.dev) draws the picture and [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) speaks the narration, both on your own machine. No paid APIs and no API keys.

It is built to be used as an **external tool**: your other projects keep only the idea for a video, and the studio holds every video and all the setup. Point an agent at a project, and it reads that project and makes the video here.

**Your videos stay private.** This repository holds only the studio. Every video, renders included, lives in its own folder in one videos root outside the repository (`~/.local/share/explainer-studio/videos` by default), so a video about a private project never reaches a commit. Every checkout and worktree of the studio shares that root. [AGENTS.md](AGENTS.md#the-videos-root) says how to move it, and [docs/videos-root.md](docs/videos-root.md) holds the detail.

## How it works

Narration is the clock. Each video has a `voiceover.json` that lists its scenes and their narration. `npm run voice` turns each line into a WAV with Kokoro, measures it, and writes the real length and each word's timing back. Every scene then lasts as long as its line plus a short pause, so editing a sentence re-times the video by itself.

```text
voiceover.json   text, voice, speed per scene
   │  npm run voice   (only changed scenes are regenerated, by hash)
   ▼
<root>/<video>/audio/<scene>.wav  ──measured──▶  durationSeconds written back
   │
   ▼
src/lib/timing.ts   frames = ceil((durationSeconds + paddingSeconds) × fps)
   ├─▶ Video.tsx   each <Series.Sequence>
   └─▶ Root.tsx    the whole <Composition>, found in the videos root by itself
```

No scene length is ever typed by hand, and reveals are cued on spoken words with `useWord` from `src/lib/words.ts`.

## Styles

Pick a style for each video; the agent recommends one when it asks its questions.

- **Studio** (default): Remotion scenes with real interfaces, bold type and diagrams.
- **Sketchbook**: paper and blueprint shots drawn in code, for a concept in under a minute.
- **FFrames**: the Rust renderer, for effect-heavy pieces.
- **Shaders**: an optional, experimental add-on; you pick the effects from a prototype sheet first.

`AGENTS.md` is the entry point for the process, `docs/pipeline.md` describes the twelve layers from idea to MP4, and `docs/styles/` holds a page per style.

## Layout

```text
src/
├── Root.tsx               finds every video in the videos root and registers it
├── lib/timing.ts          the only place scene lengths are computed
├── lib/words.ts           frames where narration words start and end
└── components/            captions, cursor, travel, typewriter, grain
<root>/<video>/            outside the repository: everything one video needs
├── brief.md               goal, audience, format, voice, scene list
├── voiceover.json         the scenes and their narration
├── config.ts              fps, size, colours
├── Video.tsx              the scenes in order
├── scenes/                one file per scene
├── assets/                its images and sound effects
├── audio/                 the generated voice
└── out/                   renders, stills and contact sheets
scripts/
├── tts.py                 npm run voice
├── sound.py               npm run sound: music bed, sting, effects
├── new-video.mjs          npm run new-video
├── render.mjs             npm run render and npm run still
├── acceptance.sh          npm run acceptance: the whole flow in a scratch root
├── videos_root.py         the root for the Python scripts
└── lib/
    ├── videos-root.mjs    resolves the videos root (npm run root)
    ├── root-tsconfig.mjs  <root>/tsconfig.json, for npx tsc -p <root>
    └── *.test.mjs         npm test, with scripts/*_test.py
templates/video/           what new-video copies
AGENTS.md                  the rules agents follow here
PRONUNCIATION.md           fixing words Kokoro says wrong
docs/pipeline.md           the twelve layers from idea to MP4
docs/styles/               one page per style
docs/videos-root.md        the videos root: resolver, outputs, limits
docs/renderers.md          renderer benchmarks: Remotion default, FFrames, HyperFrames dropped
```

Git ignores the `tts/` venv and the agent skills. The videos root sits outside the repository, so git never sees it.

## Setup

Needs macOS or Linux with Node 18 or newer, [uv](https://docs.astral.sh/uv/), ffmpeg and espeak-ng (`brew install ffmpeg espeak-ng`, or your distro's packages).

```sh
git clone https://github.com/yahyabedirhan/explainer-studio
cd explainer-studio
npm install
npm run setup:voice      # Python 3.12 venv in ./tts with Kokoro
npm run setup:skills     # Remotion's agent skills into .claude/skills
npx playwright install chromium   # optional: capture real UI for demos
```

Kokoro downloads its model, about 330 MB, from Hugging Face on the first `npm run voice`. Keep the clone at a path of normal length: espeak-ng can't read its data from a venv path of 160 characters or more, and `npm run voice` says so when that happens.

Check it works with a throwaway video from the template:

```sh
npm run new-video -- smoke-test
npm run voice -- smoke-test
npm run render -- smoke-test     # <root>/smoke-test/out/smoke-test.mp4
```

## Making a video

```sh
npm run new-video -- my-project-overview   # scaffold <root>/my-project-overview
npm run voice -- my-project-overview       # narration and timing
npm run sound -- my-project-overview --seconds 90   # music bed and effects, at the final length
npm run dev                                # Remotion Studio preview
npm run still -- my-project-overview frame --frame=60   # <root>/my-project-overview/out/frame.png
npm run render -- my-project-overview      # <root>/my-project-overview/out/my-project-overview.mp4
```

## Using it from another project

Your project doesn't install anything. In an agent session (Claude Code, Codex, Cursor, opencode), from the project you want explained, say:

> Make an explainer video about how X works in this project. Use the explainer studio at `<path to explainer-studio>` and read its AGENTS.md first.

[AGENTS.md](AGENTS.md) takes it from there. The agent:

1. reads your project's code, docs and pull requests, and never writes to it;
2. scaffolds `<root>/<project>-<topic>/` and fills in `brief.md`;
3. asks you once what you want to learn from the video, then drafts the script and scene plan around that, with no further check-ins;
4. generates the voice, builds one scene per file, and looks at rendered stills itself;
5. renders the MP4 to `<root>/<video>/out/` and checks its length and audio with ffprobe.

The video and its sources stay in the videos root, on your machine only. Copy the MP4 wherever you need it.

## Writing narration

Write for the ear: short sentences, no symbols, numbers as they are spoken. When Kokoro says a word wrong, respell it in `voiceover.json`, for example `Kubernetes` as `koo-ber-NET-eez`. See [PRONUNCIATION.md](PRONUNCIATION.md).

Voices are Kokoro's: `af_heart` by default. Ids starting `af_`/`am_` are American English, `bf_`/`bm_` British.

## Licenses

This repository is MIT. [Remotion](https://www.remotion.dev/license) has its own license: free for individuals and companies of up to three people. Kokoro's model is Apache 2.0.
