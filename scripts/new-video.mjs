// Scaffold a video: npm run new-video -- <slug>   e.g. shipyard-architecture
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-video -- <kebab-case-slug>");
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

console.log(`Created ${dest}. Git ignores it, so the video stays on this machine.
Studio and renders find it as ${component} once it has a voice:

npm run voice -- ${slug}`);
