/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// The videos root. STUDIO_VIDEOS_DIR moves it outside the repository; the full resolver
// (environment, then config, then ~/.local/share/explainer-studio/videos) comes in #27.
// See docs/videos-root.md.
const videosRoot = path.resolve(process.env.STUDIO_VIDEOS_DIR ?? "videos");

Config.setRspack(true);
// Each video keeps its assets and voice in its own folder: staticFile("<slug>/assets/logo.png").
// `remotion render`, `still` and `compositions` symlink this folder into their bundle instead of
// copying it, so a render never copies other videos' files. `remotion bundle` copies it all.
Config.setPublicDir(videosRoot);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig((config) => {
  const withTailwind = enableTailwind(config);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...withTailwind.resolve?.alias,
        // Shared studio code, for video code that lives outside the repository.
        "@studio": path.resolve("src"),
        // The videos root, so Root.tsx's require.context can take a literal path.
        "@videos": videosRoot,
      },
      // A video outside the repository resolves packages from the studio's node_modules.
      modules: ["node_modules", path.resolve("node_modules")],
    },
  };
});
// WebGPU canvases (src/components/Shader.tsx) only reach the rendered frame with ANGLE.
// Without it the canvas is silently left out and the frame shows what is behind it.
Config.setChromiumOpenGlRenderer("angle");
