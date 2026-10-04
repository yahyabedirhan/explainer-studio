// Scaffold a video: npm run new-video -- <slug>   e.g. shipyard-architecture
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-video -- <kebab-case-slug>");
  process.exit(1);
}
const dest = join("src/videos", slug);
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

console.log(`Created ${dest}. Register it in src/Root.tsx:

import * as ${component}Config from "./videos/${slug}/config";
import ${component}Voiceover from "./videos/${slug}/voiceover.json";
import { ${component} } from "./videos/${slug}/Video";

      <Folder name="${slug}">
        <Composition
          id="${component}"
          component={${component}}
          durationInFrames={totalFrames(${component}Voiceover, ${component}Config.FPS)}
          fps={${component}Config.FPS}
          width={${component}Config.WIDTH}
          height={${component}Config.HEIGHT}
        />
      </Folder>

Then: npm run voice -- ${slug}`);
