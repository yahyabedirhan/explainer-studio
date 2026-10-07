/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
// Each video keeps its assets and voice in its own folder: staticFile("<slug>/assets/logo.png").
Config.setPublicDir("videos");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
// WebGPU canvases (src/components/Shader.tsx) only reach the rendered frame with ANGLE.
// Without it the canvas is silently left out and the frame shows what is behind it.
Config.setChromiumOpenGlRenderer("angle");
