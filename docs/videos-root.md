# Videos root outside the repository

## Where the root is

`scripts/lib/videos-root.mjs` resolves the videos root, in this order:

1. `STUDIO_VIDEOS_DIR`. A relative path resolves against the working directory.
2. `videosDir` in `$XDG_CONFIG_HOME/explainer-studio/config.json` (`~/.config/explainer-studio/config.json` by default), for example `{ "videosDir": "~/Movies/explainers" }`. A missing or unreadable file is skipped. A file that is not JSON stops the command with its path.
3. `~/.local/share/explainer-studio/videos`.

A leading `~` expands in both settings. `remotion.config.ts` and `npm run new-video` use this module, and the Python scripts mirror the same order. `remotion.config.ts` creates the root when it is missing, so Studio opens on a fresh machine.

Each video is `<root>/<slug>/`, and its outputs (stills, contact sheet, process page, renders) go in `<root>/<slug>/out/`.

To test without touching your videos, point the root at a scratch folder: `STUDIO_VIDEOS_DIR=$(mktemp -d) npm run new-video -- fixture`. `npm test` checks the resolution order with scratch folders only.

## The Python scripts

`scripts/videos_root.py` mirrors `scripts/lib/videos-root.mjs` with the standard library only: the same order and edge cases. A config file that is not JSON, or whose `videosDir` is not a string, stops the script with its path. `npm test` runs its tests (`scripts/videos_root_test.py`) after the Node tests.

- `npm run voice` reads `<root>/<slug>/voiceover.json` and writes `<root>/<slug>/audio/`. With no slug, it voices every video in the root.
- `npm run sound` writes `<root>/<slug>/assets/sound/`.
- `npm run fframes-sync` writes `<root>/<slug>/fframes/src/timing.rs` and links the WAVs into `<root>/<slug>/fframes/assets/`. The FFrames project stays inside its video's folder.

## What `npm run new-video` writes

- `<root>/<slug>/`, from `templates/video/`. Its code imports shared studio code as `@studio/...`.
- `<root>/tsconfig.json`, when it is missing, for editors and `npx tsc -p <root>`. It extends the studio's `tsconfig.json` and resolves `@studio/*` and every package (`remotion`, `@remotion/*`, `react` and its types) from the checkout that wrote it. Another checkout that shares the root keeps the file as it is, while the checkout it names still exists. When that checkout is gone (a returned worktree), the next `new-video` writes the file again for its own checkout.

## Tailwind

Tailwind v4 scans only the project folder for class names. `scripts/lib/tailwind-source-loader.cjs` runs before Tailwind's loader and adds `@source "<root>"` after `@import "tailwindcss"`, so a class used only in video code under the root is generated too. Tailwind skips binary files such as renders and audio.

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
