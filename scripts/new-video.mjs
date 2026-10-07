// Scaffold a video: npm run new-video -- <slug> [--fps <n>]   e.g. shipyard-architecture
// --fps sets config.ts's frame rate (default 30); the sketchbook style uses 24.
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const fpsAt = args.indexOf("--fps");
const fps = fpsAt === -1 ? null : Number(args.splice(fpsAt, 2)[1]);
const slug = args[0];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-video -- <kebab-case-slug> [--fps <n>]");
  process.exit(1);
}
const dest = join("videos", slug);
if (existsSync(dest)) {
  console.error(`${dest} already exists`);
  process.exit(1);
}

const component = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const title = slug.replace(/-/g, " ");
cpSync("templates/video", dest, { recursive: true });

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

console.log(`Created ${dest}. Git ignores it, so the video stays on this machine.
Studio and renders find it as ${component} once it has a voice:

npm run voice -- ${slug}`);
