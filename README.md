# explainer-studio

A local studio for narrated explainer videos, made by coding agents. [Remotion](https://www.remotion.dev) draws the picture and [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) speaks the narration, both on your own machine. No paid APIs and no API keys.

It is built to be used as an **external tool**: your other projects keep only the idea for a video, and the studio holds every video and all the setup. Point an agent at a project, and it reads that project and makes the video here.

## How it works

Narration is the clock. Each video has a `voiceover.json` that lists its scenes and their narration. `npm run voice` turns each line into a WAV with Kokoro, measures it, and writes the real length back. Every scene then lasts as long as its line plus a short pause, so editing a sentence re-times the video by itself.

```text
voiceover.json   text, voice, speed per scene
   │  npm run voice   (only changed scenes are regenerated, by hash)
   ▼
public/audio/<video>/<scene>.wav  ──measured──▶  durationSeconds written back
   │
   ▼
src/lib/timing.ts   frames = ceil((durationSeconds + paddingSeconds) × fps)
   ├─▶ Video.tsx   each <Series.Sequence>
   └─▶ Root.tsx    the whole <Composition>
```

No scene length is ever typed by hand.

## Layout

```text
src/
├── Root.tsx               one <Composition> per video
├── lib/timing.ts          the only place scene lengths are computed
├── components/            pieces shared by videos
└── videos/<video>/
    ├── brief.md           goal, audience, format, voice, scene list
    ├── voiceover.json     the scenes and their narration
    ├── config.ts          fps, size, colours
    ├── Video.tsx          the scenes in order
    └── scenes/            one file per scene
scripts/
├── tts.py                 npm run voice
└── new-video.mjs          npm run new-video
templates/video/           what new-video copies
AGENTS.md                  the rules agents follow here
PRONUNCIATION.md           fixing words Kokoro says wrong
```

Generated files stay out of git: `public/audio/`, `out/`, the `tts/` venv and the agent skills.

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

Kokoro downloads its model, about 330 MB, from Hugging Face on the first `npm run voice`.

Check it works:

```sh
npm run voice -- smoke-test
npx remotion render SmokeTest out/smoke-test/smoke-test.mp4
```

## Making a video

```sh
npm run new-video -- my-project-overview   # scaffold src/videos/my-project-overview
# register the printed <Composition> in src/Root.tsx
npm run voice -- my-project-overview       # narration and timing
npm run dev                                # Remotion Studio preview
npx remotion still MyProjectOverview out/my-project-overview/frame.png --frame=60
npx remotion render MyProjectOverview out/my-project-overview/my-project-overview.mp4
```

## Using it from another project

Your project doesn't install anything. In an agent session (Claude Code, Codex, Cursor, opencode), from the project you want explained, say:

> Make an explainer video about how X works in this project. Use the explainer studio at `<path to explainer-studio>` and read its AGENTS.md first.

[AGENTS.md](AGENTS.md) takes it from there. The agent:

1. reads your project's code, docs and pull requests, and never writes to it;
2. scaffolds `src/videos/<project>-<topic>/` here and fills in `brief.md`;
3. drafts the script and scene plan, and **waits for your approval** before any animation;
4. generates the voice, builds one scene per file, and looks at rendered stills itself;
5. renders the MP4 to `out/<video>/` and checks its length and audio with ffprobe.

The video and its sources stay in the studio. Copy the MP4 wherever you need it.

## Writing narration

Write for the ear: short sentences, no symbols, numbers as they are spoken. When Kokoro says a word wrong, respell it in `voiceover.json`, for example `Kubernetes` as `koo-ber-NET-eez`. See [PRONUNCIATION.md](PRONUNCIATION.md).

Voices are Kokoro's: `af_heart` by default. Ids starting `af_`/`am_` are American English, `bf_`/`bm_` British.

## Licenses

This repository is MIT. [Remotion](https://www.remotion.dev/license) has its own license: free for individuals and companies of up to three people. Kokoro's model is Apache 2.0.
