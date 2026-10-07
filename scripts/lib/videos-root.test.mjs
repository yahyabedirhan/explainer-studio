// node --test scripts/   Checks the videos root's resolution order with scratch folders only.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { configFile, DEFAULT_ROOT, videosRoot } from "./videos-root.mjs";

const scratch = () => mkdtempSync(join(tmpdir(), "videos-root-"));
const withConfig = (content) => {
  const xdg = scratch();
  mkdirSync(join(xdg, "explainer-studio"));
  writeFileSync(join(xdg, "explainer-studio", "config.json"), content);
  return xdg;
};

test("the environment variable wins over the config setting", () => {
  const xdg = withConfig(JSON.stringify({ videosDir: "/from/config" }));
  assert.equal(videosRoot({ STUDIO_VIDEOS_DIR: "/from/env", XDG_CONFIG_HOME: xdg }), "/from/env");
});

test("a relative environment variable resolves against the working directory", () => {
  assert.equal(videosRoot({ STUDIO_VIDEOS_DIR: "here" }), resolve("here"));
});

test("an empty environment variable counts as unset", () => {
  assert.equal(videosRoot({ STUDIO_VIDEOS_DIR: "", XDG_CONFIG_HOME: scratch() }), DEFAULT_ROOT);
});

test("the config setting wins over the default, and ~ expands", () => {
  const xdg = withConfig(JSON.stringify({ videosDir: "~/films" }));
  assert.equal(videosRoot({ XDG_CONFIG_HOME: xdg }), join(homedir(), "films"));
});

test("a missing config file falls back to the default", () => {
  assert.equal(videosRoot({ XDG_CONFIG_HOME: scratch() }), DEFAULT_ROOT);
  assert.equal(DEFAULT_ROOT, join(homedir(), ".local/share/explainer-studio/videos"));
});

test("a config file without videosDir falls back to the default", () => {
  assert.equal(videosRoot({ XDG_CONFIG_HOME: withConfig("{}") }), DEFAULT_ROOT);
});

test("a config file that is not JSON stops with its path", () => {
  const xdg = withConfig("videosDir = nope");
  assert.throws(() => videosRoot({ XDG_CONFIG_HOME: xdg }), new RegExp(configFile({ XDG_CONFIG_HOME: xdg })));
});

test("without XDG_CONFIG_HOME the config file is under ~/.config", () => {
  assert.equal(configFile({}), join(homedir(), ".config/explainer-studio/config.json"));
});
