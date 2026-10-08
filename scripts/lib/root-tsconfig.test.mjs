// node --test scripts/   Checks the root's tsconfig.json on fake repositories in scratch folders.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import {
  exportPaths,
  rootTsconfigIsKept,
  writeRootTsconfig,
} from "./root-tsconfig.mjs";

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};
const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
    cwd,
    stdio: "ignore",
  });

// A studio checkout with one installed package, `fonts`, whose exports have a subpath.
const studioFiles = (dir) => {
  put(join(dir, "tsconfig.json"), "{}");
  put(
    join(dir, "package.json"),
    JSON.stringify({
      dependencies: { fonts: "1" },
      devDependencies: { "@types/x": "1" },
    }),
  );
  put(join(dir, "src", "lib", "a.ts"), "");
  put(
    join(dir, "node_modules", "fonts", "package.json"),
    JSON.stringify({
      exports: {
        ".": { types: "./index.d.ts" },
        "./*": { types: "./dist/*.d.ts" },
      },
    }),
  );
};

// A main worktree and a linked worktree of one repository, both with the studio files,
// and an empty root. Returns their paths.
const repo = () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "root-tsconfig-")));
  const main = join(base, "main");
  const linked = join(base, "linked");
  const root = join(base, "root");
  mkdirSync(main);
  mkdirSync(root);
  git(main, "init", "-q");
  git(main, "commit", "-q", "--allow-empty", "-m", "start");
  git(main, "worktree", "add", "-q", linked);
  studioFiles(main);
  studioFiles(linked);
  return { base, main, linked, root };
};
const read = (root) =>
  JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));

test("exports become paths entries that point at their types", () => {
  const exports = {
    "./package.json": "./package.json",
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
    "./*": { types: "./dist/cjs/*.d.ts", require: "./dist/cjs/*.js" },
    "./core/Vignette": {
      import: { types: "./dist/v.d.ts", default: "./dist/v.js" },
    },
    "./plain": "./dist/plain.d.ts",
    "./code-only": { default: "./x.js" },
    "./blocked": null,
  };
  assert.deepEqual(exportPaths("pkg", exports, "/m/pkg"), {
    pkg: ["/m/pkg/dist/index.d.ts"],
    "pkg/*": ["/m/pkg/dist/cjs/*.d.ts"],
    "pkg/core/Vignette": ["/m/pkg/dist/v.d.ts"],
    "pkg/plain": ["/m/pkg/dist/plain.d.ts"],
  });
  assert.deepEqual(
    exportPaths("pkg", { types: "./i.d.ts", default: "./i.js" }, "/m/pkg"),
    {
      pkg: ["/m/pkg/i.d.ts"],
    },
  );
  assert.deepEqual(exportPaths("pkg", undefined, "/m/pkg"), {});
});

test("a worktree's file names the main worktree, with paths from the exports, ahead of *", () => {
  const { main, linked, root } = repo();
  assert.equal(writeRootTsconfig(root, linked), true);
  const config = read(root);
  assert.match(config["//"], /root tsconfig v2/);
  assert.equal(config.extends, join(main, "tsconfig.json"));
  const keys = Object.keys(config.compilerOptions.paths);
  assert.deepEqual(keys, ["@studio/*", "fonts", "fonts/*", "*"]);
  assert.deepEqual(config.compilerOptions.paths["fonts/*"], [
    join(main, "node_modules", "fonts", "dist", "*.d.ts"),
  ]);
  // Written once, then kept.
  assert.equal(writeRootTsconfig(root, linked), false);
  assert.equal(writeRootTsconfig(root, main), false);
});

test("without a usable main worktree, the checkout names itself and keeps another's file", () => {
  const { base, main, linked, root } = repo();
  renameSync(join(main, "node_modules"), join(base, "parked"));
  assert.equal(writeRootTsconfig(root, linked), true);
  assert.equal(read(root).extends, join(linked, "tsconfig.json"));
  assert.equal(writeRootTsconfig(root, main), false);
  // Once the main worktree is usable again, it replaces the linked worktree's file.
  renameSync(join(base, "parked"), join(main, "node_modules"));
  assert.equal(rootTsconfigIsKept(root, linked), false);
  assert.equal(writeRootTsconfig(root, linked), true);
  assert.equal(read(root).extends, join(main, "tsconfig.json"));
});

test("a file whose checkout is gone is written again", () => {
  const { base, root, linked } = repo();
  put(
    join(root, "tsconfig.json"),
    JSON.stringify({
      "//": "explainer-studio root tsconfig v2. x",
      extends: join(base, "gone", "tsconfig.json"),
    }),
  );
  assert.equal(writeRootTsconfig(root, linked), true);
});

test("the user's file is never touched: no marker, or not JSON", () => {
  const { base, linked, root } = repo();
  for (const content of [
    JSON.stringify({
      extends: join(linked, "tsconfig.json"),
      compilerOptions: { strict: false },
    }),
    JSON.stringify({ extends: join(base, "gone", "tsconfig.json") }),
    "{ // a comment\n}",
  ]) {
    put(join(root, "tsconfig.json"), content);
    assert.equal(writeRootTsconfig(root, linked), false);
    assert.equal(readFileSync(join(root, "tsconfig.json"), "utf8"), content);
  }
});
