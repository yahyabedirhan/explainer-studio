# Videos root outside the repository

Findings of the spike in #23 (spec #22), on Remotion 4.0.532 with rspack, 2026-10-07. Every result below came from a scratch root made with `mktemp -d` and pointed to with `STUDIO_VIDEOS_DIR`.

## What `remotion.config.ts` does

- `STUDIO_VIDEOS_DIR` names the videos root. Without it the root is `videos/` in the checkout, as before. The full resolver (environment, then config, then `~/.local/share/explainer-studio/videos`) comes in #27.
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

## Still open

- Tailwind v4 finds class names by scanning files under the project. A video outside the repository that uses Tailwind classes may need an `@source` line for the root in `src/index.css`. The fixture used inline styles, so this is untested.
- Editor types for video code outside the repository (`@studio/*`, `remotion`, `@remotion/*`) need the root's own `tsconfig.json`, as the spec says.
