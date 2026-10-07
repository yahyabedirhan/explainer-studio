# Videos root outside the repository

## Where the root is

`scripts/lib/videos-root.mjs` resolves the videos root, in this order:

1. `STUDIO_VIDEOS_DIR`. A relative path resolves against the working directory.
2. `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json` (`~/.config/explainer-studio/config.json` by default), for example `{ "videosDir": "~/Movies/explainers" }`. A missing or unreadable file is skipped. A file that is not JSON stops the command with its path.
3. `~/.local/share/explainer-studio/videos`.

A leading `~` expands in both settings. `remotion.config.ts` and `npm run new-video` use this module, and the Python scripts mirror the same order. `remotion.config.ts` creates the root when it is missing, so Studio opens on a fresh machine.

Each video is `<root>/<slug>/`, and its outputs (stills, contact sheet, process page, renders) go in `<root>/<slug>/out/`.

To test without touching your videos, point the root at a scratch folder: `STUDIO_VIDEOS_DIR=$(mktemp -d) npm run new-video -- fixture`. `npm test` checks the resolution order with scratch folders only. `npm run acceptance` runs the whole flow in a scratch root, from `new-video` to a render and a contact sheet, and checks that the checkout gains no files.

## The Python scripts

`scripts/videos_root.py` mirrors `scripts/lib/videos-root.mjs` with the standard library only: the same order and edge cases. A config file that is not JSON, or whose `videosDir` is not a string, stops the script with its path. `npm test` runs its tests (`scripts/videos_root_test.py`) after the Node tests.

- `npm run voice` reads `<root>/<slug>/voiceover.json` and writes `<root>/<slug>/audio/`. With no slug, it voices every video in the root.
- `npm run sound` writes `<root>/<slug>/assets/sound/`.
- `npm run fframes-sync` writes `<root>/<slug>/fframes/src/timing.rs` and links the WAVs into `<root>/<slug>/fframes/assets/`. The FFrames project stays inside its video's folder.

## What `npm run new-video` writes

- `<root>/<slug>/`, from `templates/video/`. Its code imports shared studio code as `@studio/...`.
- `<root>/tsconfig.json`, when it is missing, for editors and `npx tsc -p <root>`. It extends the studio's `tsconfig.json` and resolves `@studio/*` and every package (`remotion`, `@remotion/*`, `react` and its types) from the checkout that wrote it. Another checkout that shares the root keeps the file as it is, while the checkout it names still exists. When that checkout is gone (a returned worktree), the next `new-video` writes the file again for its own checkout.

## Outputs and the render command

Every render and check of a video goes in `<root>/<slug>/out/`, never in the checkout's `out/`:

| Command | Writes |
|---|---|
| `npm run render -- <slug> [flags]` | `out/<slug>.mp4` |
| `npm run still -- <slug> <name> --frame=<n> [flags]` | `out/<name>.png`. `--sheet` draws the asset sheet, `<Id>Sheet`. |
| `npm run sheet -- <slug>` | `out/sheet.png`, from `out/<slug>.mp4` |
| `npm run refs -- <slug> <url> [--name <name>]` | the download in `<root>/<slug>/refs/<name>.mp4`, the frames in `out/refs/<name>/` |
| `npm run process -- <slug>` | `out/process/process.html`, from the stages in `out/process/` |

`render` and `still` resolve the root and call `npx remotion render|still <Id> <path>`. Flags after the slug (or the still's name) go on to Remotion. Plain `npx remotion render|still` works too, with the output path typed out.

Every video's outputs stay in the root, which is the public folder. A render does not copy them: see "Render copies: the chosen method" below.

## Tailwind

Tailwind v4 scans only the project folder for class names. `scripts/lib/tailwind-source-loader.cjs` runs before Tailwind's loader and adds `@source "<root>"` after `@import "tailwindcss"`, so a class used only in video code under the root is generated too. Tailwind skips binary files such as renders and audio.

## Migration

`npm run migrate -- [--from <checkout>] [--dry-run]` moves the videos of a checkout that still has `videos/` and `out/` into the resolved root, once. `--from` defaults to the checkout the script is in. `--dry-run` prints the plan, with the import count of each video, and changes nothing.

- Each folder in `videos/` or `out/` is a slug, except hidden ones. `videos/<slug>/` becomes `<root>/<slug>/`, and `out/<slug>/` becomes `<root>/<slug>/out/`. A slug with only outputs gets only `<root>/<slug>/out/`.
- Relative imports that reach the checkout's `src/` become `@studio/...`, resolved from where each file was. Other relative imports stay as they are. The plan warns about each quoted relative path that leaves `videos/` (an import of other checkout code, or a `src/` path in `new URL()` or a reference comment) and each symlink that leaves its video: these break after the move.
- It checks everything before the first change. It stops, lists the reasons and changes nothing when a `<root>/<slug>` already exists, when `videos/<slug>/out` would clash with `out/<slug>`, when two slugs differ only in case, when a slug is a symlink, or when the root is inside the checkout or on another volume.
- It moves with `rename`, never a copy, one slug at a time, then rewrites that slug's files one by one. An error stops it and lists the steps done. A run after a stop moves the slugs still in the checkout, unless a half-moved slug's target exists: finish that one by hand.
- It writes `<root>/tsconfig.json` as `new-video` does. It leaves `videos/` and `out/` themselves, with `.gitkeep` and `.DS_Store`, and `.gitignore` for you to clean up.

Rehearse on scratch folders: `STUDIO_VIDEOS_DIR=<scratch root> npm run migrate -- --from <scratch checkout>`.

## Known limits

- `npx remotion compositions` on a root with no voiced video fails with `Array of 0 length`. The Remotion CLI (`print-compositions.js`) cannot print an empty list. Studio opens normally on an empty root.

# Spike findings

Findings of the spike in #23 (spec #22), on Remotion 4.0.532 with rspack, 2026-10-07. Every result below came from a scratch root made with `mktemp -d` and pointed to with `STUDIO_VIDEOS_DIR`.

## What `remotion.config.ts` does

- The root comes from `scripts/lib/videos-root.mjs` (see "Where the root is").
- `Config.setPublicDir(<root>)` takes the absolute path, so `staticFile("<slug>/...")` reaches a video's files.
- One bundler override keeps Tailwind and adds three things:
  - the alias `@studio` to `src/`, for video code outside the repository;
  - the alias `@videos` to the root, so `require.context("@videos", ...)` in `src/Root.tsx` takes a literal path;
  - the studio's `node_modules` in `resolve.modules`, so a video outside the repository finds `@remotion/media` and every other installed package.

Studio, `npx remotion compositions`, `still` and `render` all read `remotion.config.ts`, so they share this setup. Each of them found and drew the scratch root's video through the aliases, which exist only in that file.

## Results

| Question | Result |
|---|---|
| Does `require.context` take an alias as its directory? | Yes. `require.context("@videos", ...)` lists the root's videos, with the same `./<slug>/<file>` keys. No generated registry is needed. |
| Does a video outside the repository compile with `@studio/...` and `@remotion/media`? | Yes. Without the `resolve.modules` entry, rspack fails: `Can't resolve '@remotion/media' in '<root>/fixture-one/scenes'`. |
| Does Studio hot-reload an edit to that video? | Yes. The preview changed about 250 ms after the file was written, with no page reload. |
| Does Studio show a new video folder without a restart? | Yes. A folder moved into the root appeared in the sidebar about 250 ms later, and its composition opened. |
| Does a render copy other videos' outputs into its bundle? | No. `render`, `still` and `compositions` symlink the public folder into their temporary bundle (`symlinkPublicDir` in `@remotion/cli`'s `setup-cache.js`). With 48 MB of another video's outputs in the root, the bundle was 28 MB and its `public` was a symlink to the root. |

## Render copies: the chosen method

Keep each video's outputs inside its own folder and the whole root as the public folder. The CLI's symlink does the work, so no per-render public folder is needed.

One exception: `npx remotion bundle` (`npm run build`) passes a fixed output folder, and then Remotion copies the whole public folder, every video's outputs included. Do not use it with a large root, or give it `--public-dir <root>/<slug>`.

Tailwind and editor types, still open after the spike, are settled above (#27).
