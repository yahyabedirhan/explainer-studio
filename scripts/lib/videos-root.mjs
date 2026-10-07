// The videos root: the one folder outside the repository that holds every video, one
// <root>/<slug>/ per video, with its outputs in <root>/<slug>/out/. Every checkout and
// worktree resolves the same root, in this order:
//   1. STUDIO_VIDEOS_DIR (relative paths resolve against the working directory)
//   2. "videosDir" in $XDG_CONFIG_HOME/explainer-studio/config.json (~/.config by default)
//   3. ~/.local/share/explainer-studio/videos
// A leading ~ expands in both settings. A missing or unreadable config file is skipped;
// one that isn't JSON stops with its path. The Python scripts mirror this order.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export const DEFAULT_ROOT = join(homedir(), ".local", "share", "explainer-studio", "videos");

const expandHome = (path) => (path === "~" || path.startsWith("~/") ? join(homedir(), path.slice(1)) : path);

export const configFile = (env = process.env) => {
  const xdg = env.XDG_CONFIG_HOME;
  const base = xdg && isAbsolute(xdg) ? xdg : join(homedir(), ".config");
  return join(base, "explainer-studio", "config.json");
};

const configuredRoot = (env) => {
  const file = configFile(env);
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  let config;
  try {
    config = JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
  const value = config?.videosDir;
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${file}: "videosDir" must be a path string`);
  return value;
};

export const videosRoot = (env = process.env) => {
  const setting = env.STUDIO_VIDEOS_DIR || configuredRoot(env);
  return setting ? resolve(expandHome(setting)) : DEFAULT_ROOT;
};
