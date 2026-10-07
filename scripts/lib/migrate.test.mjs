// node --test scripts/   Checks the migration on a fake checkout and root in scratch folders.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { migrate, rewriteImports } from "./migrate.mjs";
import { tsconfigStudio } from "./root-tsconfig.mjs";

const studio = resolve(import.meta.dirname, "..", "..");
const quiet = () => {};

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const SCENE = `import { AbsoluteFill } from "remotion";
import { getScene } from "../../../src/lib/timing";
import { useWord } from '../../../src/lib/words';
import { Mark } from "./Mark";
import voiceover from "../voiceover.json";
`;
const VIDEO = `import { Captions } from "../../src/components/Captions";
export { Grain } from "../../src/components/Grain";
const late = () => import("../../src/lib/sketch");
import { Hook } from "./scenes/Hook";
`;

// A checkout with a Remotion video, an FFrames video with a symlink, an out-only slug,
// and the files the checkout keeps in videos/ and out/. Returns its paths.
const fixture = () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "migrate-")));
  const checkout = join(base, "checkout");
  const root = join(base, "share", "videos");
  const v = join(checkout, "videos");
  const o = join(checkout, "out");
  mkdirSync(join(checkout, "src", "lib"), { recursive: true });
  put(join(v, ".gitkeep"), "");
  put(join(o, ".DS_Store"), "x");
  put(join(v, "demo", "Video.tsx"), VIDEO);
  put(join(v, "demo", "scenes", "Hook.tsx"), SCENE);
  put(join(v, "demo", "voiceover.json"), "{}");
  put(join(o, "demo", "demo.mp4"), "mp4");
  put(join(o, "demo", "process", "stage.png"), "png");
  put(join(v, "ff", "audio", "hook.wav"), "wav");
  mkdirSync(join(v, "ff", "fframes", "assets"), { recursive: true });
  symlinkSync("../../audio/hook.wav", join(v, "ff", "fframes", "assets", "hook.wav"));
  put(join(v, "ff", "fframes", "src", "main.rs"), "fn main() {}");
  put(join(o, "ff", "ff.mp4"), "mp4");
  put(join(o, "gone", "still.png"), "png");
  return { base, checkout, root };
};

// Every path under `dir` with its content or link target, to compare before and after.
const snapshot = (dir) => {
  if (!existsSync(dir)) return null;
  const files = {};
  const walk = (rel) => {
    for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const path = join(rel, entry.name);
      if (entry.isSymbolicLink()) files[path] = `-> ${readlinkSync(join(dir, path))}`;
      else if (entry.isDirectory()) {
        files[`${path}/`] = "";
        walk(path);
      } else files[path] = readFileSync(join(dir, path), "utf8");
    }
  };
  walk("");
  return files;
};

test("relative imports into src/ become @studio/, others stay", () => {
  const { text, count, strays } = rewriteImports(
    SCENE +
      `import x from "../../../templates/video/Video";\nconst u = new URL("../../../src/lib/a.json", import.meta.url);\n`,
    "/c/videos/demo/scenes/Hook.tsx",
    "/c/src",
    "/c/videos",
  );
  assert.equal(count, 2);
  assert.match(text, /from "@studio\/lib\/timing"/);
  assert.match(text, /from '@studio\/lib\/words'/);
  assert.match(text, /from "\.\/Mark"/);
  assert.match(text, /from "\.\.\/voiceover\.json"/);
  assert.deepEqual(strays, ["../../../templates/video/Video", "../../../src/lib/a.json"]);
});

test("a src look-alike outside src/ stays relative", () => {
  const { count } = rewriteImports(
    `import a from "../../srcs/x";\n`,
    "/c/videos/demo/Video.tsx",
    "/c/src",
    "/c/videos",
  );
  assert.equal(count, 0);
});

test("the migration joins sources and outputs under the root and rewrites imports", () => {
  const { checkout, root } = fixture();
  const result = migrate({ checkout, root, studio, log: quiet });

  assert.deepEqual(readdirSync(root).sort(), ["demo", "ff", "gone", "tsconfig.json"]);
  assert.equal(readFileSync(join(root, "demo", "out", "demo.mp4"), "utf8"), "mp4");
  assert.equal(readFileSync(join(root, "demo", "out", "process", "stage.png"), "utf8"), "png");
  assert.deepEqual(readdirSync(join(root, "gone")), ["out"]);
  assert.equal(readFileSync(join(root, "gone", "out", "still.png"), "utf8"), "png");

  const video = readFileSync(join(root, "demo", "Video.tsx"), "utf8");
  assert.equal(
    video,
    `import { Captions } from "@studio/components/Captions";
export { Grain } from "@studio/components/Grain";
const late = () => import("@studio/lib/sketch");
import { Hook } from "./scenes/Hook";
`,
  );
  const scene = readFileSync(join(root, "demo", "scenes", "Hook.tsx"), "utf8");
  assert.doesNotMatch(scene, /src\//);
  assert.match(scene, /from "\.\/Mark"/);
  assert.equal(result.videos.find((v) => v.slug === "demo").imports.count, 5);

  const link = join(root, "ff", "fframes", "assets", "hook.wav");
  assert.equal(readlinkSync(link), "../../audio/hook.wav");
  assert.equal(readFileSync(link, "utf8"), "wav");

  // The slug folders are gone; videos/ and out/ keep only what is not a video.
  assert.deepEqual(readdirSync(join(checkout, "videos")), [".gitkeep"]);
  assert.deepEqual(readdirSync(join(checkout, "out")), [".DS_Store"]);
  assert.deepEqual(result.leftBehind.sort(), [
    join(checkout, "out", ".DS_Store"),
    join(checkout, "videos", ".gitkeep"),
  ]);

  const tsconfig = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));
  assert.equal(tsconfig.extends, join(tsconfigStudio(studio).dir, "tsconfig.json"));
});

test("an existing target stops the migration with nothing changed", () => {
  const { base, checkout, root } = fixture();
  put(join(root, "ff", "keep.txt"), "mine");
  const before = snapshot(base);
  assert.throws(() => migrate({ checkout, root, studio, log: quiet }), /Nothing changed[\s\S]*ff already exists/);
  assert.deepEqual(snapshot(base), before);
});

test("an out/ folder in the sources clashes with the outputs", () => {
  const { base, checkout, root } = fixture();
  put(join(checkout, "videos", "demo", "out", "a.png"), "png");
  const before = snapshot(base);
  assert.throws(() => migrate({ checkout, root, studio, log: quiet }), /demo\/out would clash/);
  assert.deepEqual(snapshot(base), before);
});

test("a root inside the checkout is refused", () => {
  const { base, checkout } = fixture();
  const before = snapshot(base);
  assert.throws(
    () =>
      migrate({
        checkout,
        root: join(checkout, "videos", "root"),
        studio,
        log: quiet,
      }),
    /inside the checkout/,
  );
  assert.deepEqual(snapshot(base), before);
});

test("a dry run prints the plan and changes nothing", () => {
  const { base, checkout, root } = fixture();
  const before = snapshot(base);
  const lines = [];
  const plan = migrate({
    checkout,
    root,
    studio,
    dryRun: true,
    log: (line) => lines.push(line),
  });
  assert.deepEqual(snapshot(base), before);
  assert.equal(existsSync(root), false);
  assert.deepEqual(
    plan.videos.map((v) => v.slug),
    ["demo", "ff", "gone"],
  );
  assert.match(lines.join("\n"), /demo: sources \+ outputs, 5 imports to @studio/);
  assert.match(lines.join("\n"), /gone: outputs, 0 imports/);
});

test("the command runs against the resolved root", () => {
  const { checkout, root } = fixture();
  const run = (...args) =>
    execFileSync("node", [join(studio, "scripts", "migrate.mjs"), "--from", checkout, ...args], {
      env: { ...process.env, STUDIO_VIDEOS_DIR: root },
      encoding: "utf8",
    });
  assert.match(run("--dry-run"), /dry run/);
  assert.equal(existsSync(root), false);
  assert.match(run(), /Done: 3 videos/);
  assert.equal(statSync(join(root, "demo", "out")).isDirectory(), true);
});

test("an error midway stops and lists what was done", () => {
  const { checkout, root } = fixture();
  chmodSync(join(checkout, "out"), 0o555);
  try {
    assert.throws(
      () => migrate({ checkout, root, studio, log: quiet }),
      (error) =>
        /Stopped at "move .*out\/demo/.test(error.message) &&
        error.done.includes(`move ${join(checkout, "videos", "demo")} -> ${join(root, "demo")}`),
    );
    assert.equal(existsSync(join(root, "ff")), false);
  } finally {
    chmodSync(join(checkout, "out"), 0o755);
  }
});

test(
  "names that differ only in case stop the migration with nothing changed",
  {
    skip: !["darwin", "win32"].includes(process.platform),
  },
  () => {
    const { base, checkout, root } = fixture();
    put(join(checkout, "videos", "Pair", "Video.tsx"), "");
    put(join(checkout, "out", "pair", "x.png"), "png");
    const before = snapshot(base);
    assert.throws(() => migrate({ checkout, root, studio, log: quiet }), /pair and Pair differ only in case/);
    assert.deepEqual(snapshot(base), before);
  },
);

test("a root inside the checkout is refused whatever its case", { skip: process.platform !== "darwin" }, () => {
  const { checkout } = fixture();
  const root = join(dirname(checkout), "CHECKOUT", "videos-root");
  assert.throws(() => migrate({ checkout, root, studio, log: quiet }), /inside the checkout/);
});

test("hidden folders stay in the checkout", () => {
  const { checkout, root } = fixture();
  put(join(checkout, "out", ".cache", "x"), "x");
  const result = migrate({ checkout, root, studio, log: quiet });
  assert.equal(existsSync(join(root, ".cache")), false);
  assert.ok(result.leftBehind.includes(join(checkout, "out", ".cache")));
});

test("a symlink or path that leaves the video is warned about", () => {
  const { checkout, root } = fixture();
  symlinkSync("/etc/hosts", join(checkout, "videos", "ff", "fframes", "assets", "abs.wav"));
  put(join(checkout, "videos", "demo", "data.ts"), `export const u = "../../templates/x";\n`);
  const lines = [];
  migrate({ checkout, root, studio, dryRun: true, log: (line) => lines.push(line) });
  const text = lines.join("\n");
  assert.match(text, /WARNING: fframes\/assets\/abs\.wav: symlink leaves the video: \/etc\/hosts/);
  assert.doesNotMatch(text, /hook\.wav/);
  assert.match(text, /WARNING: data\.ts: path leaves the videos, not rewritten: \.\.\/\.\.\/templates\/x/);
});

test("a Rust path that leaves the video is warned about, from the crate, and never rewritten", () => {
  const { checkout, root } = fixture();
  const crate = join(checkout, "videos", "ff", "fframes");
  const main = `fn main() { Project::new().default_output("../../../out/ff/ff.mp4").assets("./assets"); }\n`;
  put(join(crate, "Cargo.toml"), "[package]\n");
  put(join(crate, "src", "main.rs"), main);
  const lines = [];
  migrate({ checkout, root, studio, log: (line) => lines.push(line) });
  const text = lines.join("\n");
  assert.match(text, /WARNING: fframes\/src\/main\.rs: path leaves the videos, not rewritten: \.\.\/\.\.\/\.\.\/out\/ff\/ff\.mp4/);
  assert.doesNotMatch(text, /\.\/assets/);
  assert.equal(readFileSync(join(root, "ff", "fframes", "src", "main.rs"), "utf8"), main);
});
