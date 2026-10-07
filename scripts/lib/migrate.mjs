// Moves a checkout's videos into the videos root: videos/<slug>/ becomes <root>/<slug>/,
// out/<slug>/ becomes <root>/<slug>/out/, and relative imports of the studio's src/
// become @studio/... . Every check runs before the first change: a target that exists, a
// name that would clash, a root inside the checkout or on another volume stops it with a
// list and nothing moved. Then it moves one slug at a time with rename, never a copy, and
// an error stops it with the list of what was done.
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { rootTsconfigIsKept, writeRootTsconfig } from "./root-tsconfig.mjs";

const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
// Folders that hold no video code: outputs, packages and Rust builds.
const SKIP_DIRS = new Set(["out", "node_modules", "target"]);
// What an import, export, dynamic import or require names.
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])(\.\.?\/[^"'\n]*)\2/g;
// Any quoted relative path, whatever uses it: new URL(), a reference comment, a string.
const QUOTED_PATH = /(["'`])(\.\.?\/[^"'`\n]*)\1/g;
// macOS and Windows volumes ignore case by default, so names that differ only in case clash.
const fold = process.platform === "darwin" || process.platform === "win32" ? (s) => s.toLowerCase() : (s) => s;

const within = (dir, path) => fold(path) === fold(dir) || fold(path).startsWith(fold(dir + sep));
const toPosix = (path) => path.split(sep).join("/");

const isLink = (path) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};
// A path that holds anything, a dangling symlink included.
const occupied = (path) => existsSync(path) || isLink(path);

// Rewrites the relative imports in `text` that resolve, from `originalFile`, into `srcDir`.
// `strays` are the quoted relative paths left that point outside `videosDir`: imports into
// the rest of the checkout, or src/ paths that are not imports. They break after the move.
export const rewriteImports = (text, originalFile, srcDir, videosDir) => {
  const from = dirname(originalFile);
  let count = 0;
  const rewritten = text.replace(SPECIFIER, (match, lead, quote, spec) => {
    const target = resolve(from, spec);
    if (!within(srcDir, target)) return match;
    count += 1;
    const rest = toPosix(relative(srcDir, target));
    return `${lead}${quote}${rest ? `@studio/${rest}` : "@studio"}${quote}`;
  });
  const strays = [...rewritten.matchAll(QUOTED_PATH)]
    .map((match) => match[2])
    .filter((spec) => !within(videosDir, resolve(from, spec)));
  return { text: rewritten, count, strays };
};

// The code files and symlinks under `dir`, as paths relative to it. Symlinks are not followed.
const walk = (dir, rel = "", found = { code: [], links: [] }) => {
  for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const path = rel ? join(rel, entry.name) : entry.name;
    if (entry.isSymbolicLink()) found.links.push(path);
    else if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(dir, path, found);
    } else if (entry.isFile() && CODE.test(entry.name)) found.code.push(path);
  }
  return found;
};

// A video's import rewrites, without writing them. `dir` holds the files now; `originalDir`
// is where they were written, and every path resolves from there. `warnings` lists the
// relative paths and symlinks that leave the video and may break after the move.
const videoImports = (dir, originalDir, checkout) => {
  const srcDir = join(checkout, "src");
  const videosDir = join(checkout, "videos");
  const { code, links } = walk(dir);
  const changes = [];
  const warnings = [];
  let count = 0;
  for (const rel of code) {
    const before = readFileSync(join(dir, rel), "utf8");
    const after = rewriteImports(before, join(originalDir, rel), srcDir, videosDir);
    count += after.count;
    warnings.push(...after.strays.map((spec) => `${rel}: path leaves the videos, not rewritten: ${spec}`));
    if (after.text !== before) changes.push({ rel, text: after.text });
  }
  for (const rel of links) {
    const target = readlinkSync(join(dir, rel));
    if (!within(originalDir, resolve(dirname(join(originalDir, rel)), target)))
      warnings.push(`${rel}: symlink leaves the video: ${target}`);
  }
  return { count, changes, warnings };
};

// The realpath of `path`, or of its nearest existing parent with the rest appended, and
// that parent.
const realPathOfNearest = (path) => {
  let existing = resolve(path);
  const rest = [];
  while (!existsSync(existing)) {
    rest.unshift(existing.slice(dirname(existing).length + 1));
    existing = dirname(existing);
  }
  return { real: join(realpathSync.native(existing), ...rest), existing };
};

const entries = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []);

// What a migration would do, and every reason it can't start. Reads only.
export const planMigration = ({ checkout, root }) => {
  const videosDir = join(checkout, "videos");
  const outDir = join(checkout, "out");
  const problems = [];
  const leftBehind = [];
  const slugs = new Map();

  if (!existsSync(videosDir) && !existsSync(outDir)) problems.push(`${checkout} has no videos/ or out/ folder`);
  const collect = (dir, add) => {
    for (const entry of entries(dir)) {
      const path = join(dir, entry.name);
      // Hidden entries (.gitkeep, .DS_Store, caches) and loose files are not videos.
      if (entry.name.startsWith(".") || (!entry.isDirectory() && !entry.isSymbolicLink())) leftBehind.push(path);
      else if (entry.isSymbolicLink()) problems.push(`${path} is a symlink; move it by hand`);
      else {
        const slug = slugs.get(entry.name) ?? { slug: entry.name, target: join(root, entry.name) };
        add(slug, path);
        slugs.set(entry.name, slug);
      }
    }
  };
  collect(videosDir, (slug, path) => (slug.sources = path));
  collect(outDir, (slug, path) => (slug.outputs = path));

  const checkoutReal = realpathSync.native(checkout);
  const rootReal = realPathOfNearest(root);
  if (within(checkoutReal, rootReal.real)) problems.push(`the root ${root} is inside the checkout ${checkout}`);
  if (existsSync(root) && !statSync(root).isDirectory()) problems.push(`the root ${root} is not a folder`);
  if (statSync(rootReal.existing).dev !== statSync(checkout).dev)
    problems.push(`the root ${root} is on another volume than ${checkout}; rename can't move there`);

  const folded = new Map();
  for (const slug of slugs.values()) {
    const key = fold(slug.slug);
    if (folded.has(key)) problems.push(`${slug.slug} and ${folded.get(key)} differ only in case`);
    folded.set(key, slug.slug);
    if (occupied(slug.target)) problems.push(`${slug.target} already exists`);
    if (slug.sources && slug.outputs && occupied(join(slug.sources, "out")))
      problems.push(`${join(slug.sources, "out")} would clash with ${slug.outputs}`);
  }

  const videos = [...slugs.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const video of videos) {
    const imports = video.sources ? videoImports(video.sources, video.sources, checkout) : null;
    video.imports = imports ? { count: imports.count, warnings: imports.warnings } : { count: 0, warnings: [] };
  }
  return { checkout, root, videos, problems, leftBehind, writesTsconfig: !rootTsconfigIsKept(root) };
};

const kinds = (video) =>
  [video.sources ? "sources" : null, video.outputs ? "outputs" : null].filter(Boolean).join(" + ");

// Runs the migration and logs the plan. `studio` is the checkout whose packages the root's
// tsconfig.json names. A problem found before the start throws with nothing changed; an
// error after the start throws with `done`, the steps that finished. Returns the plan,
// with `done` when it ran.
export const migrate = ({ checkout, root, studio, dryRun = false, log = console.log }) => {
  const plan = planMigration({ checkout, root });
  log(`${dryRun ? "Plan (dry run, nothing changes)" : "Migrating"}: ${checkout} -> ${root}`);
  for (const video of plan.videos) {
    log(`  ${video.slug}: ${kinds(video)}, ${video.imports.count} imports to @studio`);
    for (const warning of video.imports.warnings) log(`    WARNING: ${warning}`);
  }
  if (plan.writesTsconfig) log(`  ${join(root, "tsconfig.json")}: to write`);
  if (plan.problems.length) {
    const error = new Error(`Nothing changed. Fix these first:\n${plan.problems.map((p) => `  - ${p}`).join("\n")}`);
    error.plan = plan;
    throw error;
  }
  if (dryRun) return plan;

  const done = [];
  const step = (what, action) => {
    try {
      action();
    } catch (error) {
      const report = done.length ? done.map((d) => `  - ${d}`).join("\n") : "  (nothing)";
      const wrapped = new Error(`Stopped at "${what}": ${error.message}\nDone before the error:\n${report}`);
      wrapped.done = done;
      throw wrapped;
    }
    done.push(what);
  };
  // rename() over an existing empty folder replaces it, so check again right before.
  const move = (from, to) => {
    if (occupied(to)) throw new Error(`${to} already exists`);
    renameSync(from, to);
  };

  step(`create ${root}`, () => mkdirSync(root, { recursive: true }));
  if (plan.writesTsconfig) step(`write ${join(root, "tsconfig.json")}`, () => writeRootTsconfig(root, studio));
  for (const video of plan.videos) {
    if (video.sources) step(`move ${video.sources} -> ${video.target}`, () => move(video.sources, video.target));
    else step(`create ${video.target}`, () => mkdirSync(video.target));
    if (video.outputs) {
      const out = join(video.target, "out");
      step(`move ${video.outputs} -> ${out}`, () => move(video.outputs, out));
    }
    if (!video.sources) continue;
    let changes = [];
    step(`read the imports in ${video.target}`, () => {
      changes = videoImports(video.target, video.sources, checkout).changes;
    });
    for (const change of changes) {
      const file = join(video.target, change.rel);
      step(`rewrite the imports in ${file}`, () => writeFileSync(file, change.text));
    }
  }
  const total = plan.videos.reduce((sum, video) => sum + video.imports.count, 0);
  log(`Done: ${plan.videos.length} videos in ${root}, ${total} imports rewritten to @studio.`);
  return { ...plan, done };
};
