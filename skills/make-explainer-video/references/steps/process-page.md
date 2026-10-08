# Optional step: process-page

A making-of page that shows every stage of the video, from references to the final MP4. Choose it at the start: the page is built from snapshots that each step keeps as it goes.

## Snapshots

Each step of the process ends with a snapshot: copy what the step produced into `<root>/<slug>/out/process/<NN>-<stage>/`, with a `NOTES.md` whose first line is `# <title>`, saying what you did, what you saw and what you changed.

| Folder | Holds |
|---|---|
| `01-references` | `shots.png`, the picked frames and what to take from them (with `reference-study`) |
| `02-brief` | `brief.md`; copy it again when a later step changes it, and say what changed in that step's notes |
| `03-asset-sheet` | the asset sheet still |
| `04-voice` | `voiceover.json`, the WAVs and a list of cue times |
| `05-storyboard` | every round's end-pose stills, named `board-<n>-r<round>.png` |
| `06-review-1`, `07-review-2`, … | each review round's contact sheet, stills and what changed |
| `<NN>-final` | the MP4 and the `ffprobe` output |

Keep every round: a later round's files go beside the earlier ones, never over them.

## Build the page

```sh
npm run process -- <slug>
```

Open `<root>/<slug>/out/process/process.html` in a browser, or screenshot the full page with Playwright, and check every stage shows its images. Give the user its path with the MP4's.
