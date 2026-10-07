// The videos root's tsconfig.json, for editors and `npx tsc -p <root>`: it extends a studio
// checkout's tsconfig and resolves @studio/* and every package from that checkout. That
// checkout is the main worktree when it has the studio and its packages, so every worktree
// sharing the root names the same one; otherwise it is the checkout that writes the file.
//
// The file carries a "//" marker with its version. A file with the marker is rewritten when
// its version is older, when the checkout it names is gone, or when it names another
// checkout than a usable main worktree. A file without the marker, or one that isn't JSON,
// is the user's and is never touched.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export const VERSION = 2;
const MARKER = `explainer-studio root tsconfig v${VERSION}. Delete this line to keep your edits: the studio rewrites a file that has it.`;
const markerVersion = (text) =>
  Number(/^explainer-studio root tsconfig v(\d+)\./.exec(String(text))?.[1]);

const real = (path) => {
  try {
    return realpathSync.native(path);
  } catch {
    return resolve(path);
  }
};

// True when `dir` has what the root's tsconfig.json names: the studio's tsconfig and
// package.json, its src/ and its installed packages.
const usable = (dir) =>
  ["tsconfig.json", "package.json", "src", "node_modules"].every((name) =>
    existsSync(join(dir, name)),
  );

// The main worktree of the repository that holds `checkout`, or null when git can't tell.
export const mainWorktree = (checkout) => {
  try {
    const common = execFileSync(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      {
        cwd: checkout,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    return basename(common) === ".git" ? real(dirname(common)) : null;
  } catch {
    return null;
  }
};

// The checkout the root's tsconfig.json names, and whether it is the usable main worktree.
export const tsconfigStudio = (checkout) => {
  const main = mainWorktree(checkout);
  return main && usable(main)
    ? { dir: main, isMain: true }
    : { dir: real(checkout), isMain: false };
};

// The first types file an `exports` target names, or null. A target is a path, an array
// of fallbacks or an object of conditions: "types" first, then the others in order.
const typesTarget = (target) => {
  if (typeof target === "string")
    return /\.d\.[cm]?ts$/.test(target) ? target : null;
  if (Array.isArray(target))
    return target.map(typesTarget).find(Boolean) ?? null;
  if (target && typeof target === "object") {
    if ("types" in target) return typesTarget(target.types);
    return Object.values(target).map(typesTarget).find(Boolean) ?? null;
  }
  return null;
};

// `paths` entries for a package's `exports` map, because tsc ignores `exports` behind a
// paths mapping into node_modules. "." becomes "<name>", "./x" becomes "<name>/x" and "./*"
// becomes "<name>/*", each pointing at its types file in `dir`. A subpath without types is
// left to the "*" fallback.
export const exportPaths = (name, exports, dir) => {
  const paths = {};
  if (!exports || typeof exports !== "object" || Array.isArray(exports))
    return paths;
  // An exports object of conditions only is the package's "." entry.
  const map = Object.keys(exports).some((key) => key.startsWith("."))
    ? exports
    : { ".": exports };
  for (const [subpath, target] of Object.entries(map)) {
    if (!subpath.startsWith(".") || subpath === "./package.json") continue;
    const types = typesTarget(target);
    if (types)
      paths[subpath === "." ? name : `${name}/${subpath.slice(2)}`] = [
        join(dir, types),
      ];
  }
  return paths;
};

// `paths` entries for every dependency of the studio, from its installed packages.
const dependencyPaths = (studio) => {
  const manifest = JSON.parse(
    readFileSync(join(studio, "package.json"), "utf8"),
  );
  const names = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  }).sort();
  const paths = {};
  for (const name of names) {
    // Type packages are reached through "*": code imports "react", never "@types/react".
    if (name.startsWith("@types/")) continue;
    const dir = join(studio, "node_modules", name);
    try {
      const { exports } = JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      );
      Object.assign(paths, exportPaths(name, exports, dir));
    } catch {
      // Not installed: the "*" fallback finds what it can.
    }
  }
  return paths;
};

const shape = (studio, paths) => {
  const modules = join(studio, "node_modules");
  return {
    extends: join(studio, "tsconfig.json"),
    compilerOptions: {
      paths: {
        "@studio/*": [join(studio, "src", "*")],
        ...paths,
        // @types first: a package such as react ships its code without types.
        "*": [join(modules, "@types", "*"), join(modules, "*")],
      },
      typeRoots: [join(modules, "@types")],
    },
    include: ["*/**/*.ts", "*/**/*.tsx"],
    exclude: ["*/out", "**/node_modules", "**/target"],
  };
};

// The file for `studio`. TypeScript ignores the "//" key.
export const rootTsconfig = (studio) => ({
  "//": MARKER,
  ...shape(studio, dependencyPaths(studio)),
});

// True when the root's tsconfig.json stays as it is, for a write from `checkout`.
export const rootTsconfigIsKept = (root, checkout) => {
  const file = join(root, "tsconfig.json");
  if (!existsSync(file)) return false;
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return true;
  }
  if (
    !config ||
    typeof config !== "object" ||
    typeof config.extends !== "string"
  )
    return true;
  // NaN for the user's own file, which has no marker.
  const version = "//" in config ? markerVersion(config["//"]) : NaN;
  if (!Number.isInteger(version)) return true;
  if (version < VERSION || !existsSync(config.extends)) return false;
  // A file that names another checkout is kept, unless the main worktree can replace it.
  const studio = tsconfigStudio(checkout);
  return !studio.isMain || real(dirname(config.extends)) === studio.dir;
};

// Writes the root's tsconfig.json unless it is kept. Returns true when it wrote the file.
export const writeRootTsconfig = (root, checkout) => {
  if (rootTsconfigIsKept(root, checkout)) return false;
  const tsconfig = rootTsconfig(tsconfigStudio(checkout).dir);
  writeFileSync(
    join(root, "tsconfig.json"),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
  );
  return true;
};
