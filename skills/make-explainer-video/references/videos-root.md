# The videos root

Every video lives in one **videos root** outside the repository, shared by every checkout and worktree of the studio.

`npm run --silent root` prints the root. In these references `<root>` stands for that path. Set `STUDIO_VIDEOS_DIR`, or `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json`, to move it.

## One video's folder

Each video is `<root>/<slug>/`:

| Path | Holds |
|---|---|
| `brief.md` | the brief, the choices and the script |
| `voiceover.json` | the scenes and their narration, with each scene's length and word timings after `npm run voice` |
| `config.ts` | fps, size and colours |
| `Video.tsx`, `scenes/` | the Remotion sequence (its default export) and one file per scene |
| `Sheet.tsx` | the asset sheet, a still |
| `draw/` | the video's own drawing helpers, such as canvas props |
| `fframes/` | the FFrames project, with `fframes` |
| `assets/` | images and sound effects |
| `audio/` | the generated voice |
| `out/` | every render and check: stills, the MP4, contact sheets, reference frames and the process page |

`src/Root.tsx` registers a folder that has `Video.tsx`, `config.ts` and `voiceover.json` as a composition named after its slug in PascalCase (`shipyard-architecture` is `ShipyardArchitecture`), and its `Sheet.tsx` as `<Id>Sheet`.

The root is Remotion's public folder, so `staticFile("<slug>/assets/logo.png")` reaches a video's own file. Video code imports the studio's shared code as `@studio/...`, for example `@studio/lib/words`. `npx tsc -p <root>` type-checks every video.

## What each command writes

| Command | Writes |
|---|---|
| `npm run new-video -- <slug> [--fps <n>]` | `<root>/<slug>/` from the template |
| `npm run voice -- <slug>` | `audio/`, and lengths and word timings into `voiceover.json` |
| `npm run sound -- <slug> --seconds <n>` | `assets/sound/` |
| `npm run still -- <slug> <name> [--frame=<n>] [--sheet]` | `out/<name>.png`; `--sheet` draws `Sheet.tsx` |
| `npm run render -- <slug> [flags]` | `out/<slug>.mp4` |
| `npm run sheet -- <slug> [--every <s>]` | `out/sheet.png`, a contact sheet of the MP4 |
| `npm run refs -- <slug> <url> [--name <name>]` | the download in `refs/`, its frames in `out/refs/<name>/` |
| `npm run process -- <slug>` | `out/process/process.html` |
| `npm run fframes-sync -- <slug> --fps <n>` | `fframes/src/timing.rs`, and links of the WAVs in `fframes/assets/` |

Flags after the slug, or after the still's name, go on to Remotion.
