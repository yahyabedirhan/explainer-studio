// Scaffold a video: npm run new-video -- <slug> [--fps <n>]   e.g. shipyard-architecture
// --fps sets config.ts's frame rate (default 30); the sketchbook preset uses 24.
// The video goes to <videos root>/<slug>/ (scripts/lib/videos-root.mjs), outside the repository.
// The root and its tsconfig.json are created when missing.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeRootTsconfig } from "./lib/root-tsconfig.mjs";
import { compositionId, videosRoot } from "./lib/videos-root.mjs";

const studio = resolve(import.meta.dirname, "..");

const args = process.argv.slice(2);
const fpsAt = args.indexOf("--fps");
const fps = fpsAt === -1 ? null : Number(args.splice(fpsAt, 2)[1]);
const slug = args[0];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-video -- <kebab-case-slug> [--fps <n>]");
  process.exit(1);
}
const root = videosRoot();
const dest = join(root, slug);
if (existsSync(dest)) {
  console.error(`${dest} already exists`);
  process.exit(1);
}

const component = compositionId(slug);
const title = slug.replace(/-/g, " ");
mkdirSync(root, { recursive: true });
writeRootTsconfig(root, studio);
cpSync(join(studio, "templates", "video"), dest, { recursive: true });

const fill = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) fill(path);
    else
      writeFileSync(
        path,
        readFileSync(path, "utf8").replaceAll("__COMPONENT__", component).replaceAll("__TITLE__", title),
      );
  }
};
fill(dest);
if (fps !== null) {
  if (!(fps > 0)) {
    console.error("--fps needs a positive number");
    process.exit(1);
  }
  const config = join(dest, "config.ts");
  writeFileSync(config, readFileSync(config, "utf8").replace(/FPS = \d+/, `FPS = ${fps}`));
}

console.log(`Created ${dest}, outside the repository, so the video stays on this machine.
Studio and renders find it as ${component} once it has a voice:

npm run voice -- ${slug}`);

