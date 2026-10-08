# explainer-studio

A local studio for narrated explainer videos, made by coding agents. [Remotion](https://www.remotion.dev) or [FFrames](https://fframes.studio) draws the picture and [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) speaks the narration, both on your own machine. No paid APIs and no API keys.

It is built to be used as an **external tool**: your other projects keep only the idea for a video, and the studio holds every video and all the setup. Point an agent at a project, and it reads that project and makes the video here.

**Your videos stay private.** This repository holds only the studio. Every video, renders included, lives in its own folder in one videos root outside the repository (`~/.local/share/explainer-studio/videos` by default), so a video about a private project never reaches a commit. Every checkout and worktree of the studio shares that root. [docs/videos-root.md](docs/videos-root.md) says how to move it.

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

## Layers and presets

A video is a stack of layers, and it picks one option at each:

| Layer | Options |
|---|---|
| Renderer | `remotion`, `fframes` |
| Drawing | `dom`, `canvas` |
| Look | `dark-ui`, `paper-blueprint`, `pixel-thermal` |
| Effects | `grain`, `shaders` |
| Captions | `on`, `off` |
| Voice | `kokoro` |
| Sound | `synth`, `none` |
| Optional steps | `reference-study`, `process-page` |

A preset is a saved set of choices: `studio` (real UI, bold type, captions) and `sketchbook` (paper and blueprint drawn on a canvas). Start from a preset, change any layer, or choose every layer yourself, and try one script with different looks and renderers.

Two readers, two entry points. An agent making a video follows the [`make-explainer-video`](skills/make-explainer-video/SKILL.md) skill, which holds the process, the layers and one reference per option. An agent changing the studio starts at [AGENTS.md](AGENTS.md), with [docs/low-level-design.md](docs/low-level-design.md) for the code and [docs/decisions/](docs/decisions/) for the reasons.

## Layout

```text
src/
├── Root.tsx               finds every video in the videos root and registers it
├── lib/timing.ts          the only place scene lengths are computed
├── lib/words.ts           frames where narration words start and end
├── components/            captions, cursor, travel, typewriter, canvas, grain, shaders
└── looks/                 each look's Remotion code, such as paper-blueprint
<root>/<video>/            outside the repository: everything one video needs
├── brief.md               goal, audience, one choice per layer, scene list
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
skills/make-explainer-video/  the skill a video maker follows: process, layers, presets
AGENTS.md                  the entry point for changing the studio
docs/low-level-design.md   how the code fits together, one video traced end to end
docs/videos-root.md        the videos root: resolver, outputs, limits
docs/decisions/            dated records: renderers, prototypes, layers and presets
```

Git ignores the `tts/` venv and the installed official skills. The videos root sits outside the repository, so git never sees it.

## Setup

Needs macOS or Linux with Node 18 or newer, [uv](https://docs.astral.sh/uv/), ffmpeg and espeak-ng (`brew install ffmpeg espeak-ng`, or your distro's packages).

```sh
git clone https://github.com/yahyabedirhan/explainer-studio
cd explainer-studio
npm install
npm run setup:voice      # Python 3.12 venv in ./tts with Kokoro
npm run setup:skills     # the official Remotion and FFrames skills into .claude/skills
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

Your project doesn't install anything. Install the skill once per machine:

```sh
npx skills add yahyabedirhan/explainer-studio -g --skill make-explainer-video
```

Then, in an agent session from the project you want explained, ask for an explainer video about it. The agent:

1. reads your project's code, docs and pull requests, and never writes to it;
2. asks you once only what your request leaves open, such as the takeaway, the length or the preset;
3. scaffolds `<root>/<project>-<topic>/`, records its layer choices in `brief.md`, and writes the script;
4. generates the voice, builds one scene per file, and looks at rendered stills itself;
5. renders the MP4 to `<root>/<video>/out/` and checks its length and audio with ffprobe.

The video and its sources stay in the videos root, on your machine only. Copy the MP4 wherever you need it.

## Writing narration

Write for the ear: short sentences, no symbols, numbers as they are spoken. When Kokoro says a word wrong, respell it in `voiceover.json`, for example `Kubernetes` as `koo-ber-NET-eez`. See [the pronunciation guide](skills/make-explainer-video/references/pronunciation.md).

Voices are Kokoro's: `af_heart` by default. Ids starting `af_`/`am_` are American English, `bf_`/`bm_` British.

## Licenses

This repository is MIT. [Remotion](https://www.remotion.dev/license) has its own license: free for individuals and companies of up to three people. Kokoro's model is Apache 2.0.
