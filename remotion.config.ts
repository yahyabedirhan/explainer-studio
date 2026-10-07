/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";
import { videosRoot } from "./scripts/lib/videos-root.mjs";

// The videos root, outside the repository: STUDIO_VIDEOS_DIR, then videosDir in
// ~/.config/explainer-studio/config.json, then ~/.local/share/explainer-studio/videos.
// See docs/videos-root.md. It's created when missing, so Studio opens on a fresh machine.
const root = videosRoot();
mkdirSync(root, { recursive: true });

Config.setRspack(true);
// Each video keeps its assets and voice in its own folder: staticFile("<slug>/assets/logo.png").
// `remotion render`, `still` and `compositions` symlink this folder into their bundle instead of
// copying it, so a render never copies other videos' files. `remotion bundle` copies it all.
Config.setPublicDir(root);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig((config) => {
  const withTailwind = enableTailwind(config);
  return {
    ...withTailwind,
    module: {
      ...withTailwind.module,
      // Tailwind scans the videos root too, not only the project folder.
      rules: withTailwind.module?.rules?.map((rule) =>
        rule && typeof rule === "object" && String(rule.test).includes(".css") && Array.isArray(rule.use)
          ? {
              ...rule,
              use: [
                ...rule.use,
                { loader: path.resolve("scripts/lib/tailwind-source-loader.cjs"), options: { root } },
              ],
            }
          : rule,
      ),
    },
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...withTailwind.resolve?.alias,
        // Shared studio code, for video code that lives outside the repository.
        "@studio": path.resolve("src"),
        // The videos root, so Root.tsx's require.context can take a literal path.
        "@videos": root,
      },
      // A video outside the repository resolves packages from the studio's node_modules.
      modules: ["node_modules", path.resolve("node_modules")],
    },
  };
});
// WebGPU canvases (src/components/Shader.tsx) only reach the rendered frame with ANGLE.
// Without it the canvas is silently left out and the frame shows what is behind it.
Config.setChromiumOpenGlRenderer("angle");
