// Contact sheet of a render, to review motion and pacing in one image.
//
//   npm run sheet -- <slug> [--every <seconds>] [--file <video>] [--out <png>]
//
// Takes a frame every 0.5 s (by default) of <root>/<slug>/out/<slug>.mp4, 7 across, into
// <root>/<slug>/out/sheet.png, under the videos root (scripts/lib/videos-root.mjs).
// Read the sheet: a still shows a pose, a sheet shows a sequence.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { outputDir } from "./lib/videos-root.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const every = Number(flag("every", "0.5"));
const [slug] = args;
const file = flag("file", slug && join(outputDir(slug), `${slug}.mp4`));
const out = flag("out", slug && join(outputDir(slug), "sheet.png"));
if (!slug || !(every > 0)) {
  console.error(
    "Usage: npm run sheet -- <slug> [--every <seconds>] [--file <video>] [--out <png>]",
  );
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(
    `${file} does not exist. Render first: npm run render -- ${slug}`,
  );
  process.exit(1);
}

const duration = Number(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    {
      encoding: "utf8",
    },
  ),
);
const count = Math.ceil(duration / every);
const cols = 7;
const rows = Math.ceil(count / cols);
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-i",
  file,
  "-vf",
  `fps=1/${every},scale=480:-1,tile=${cols}x${rows}:padding=4:color=white`,
  "-frames:v",
  "1",
  out,
]);
console.log(
  `${out}: ${count} frames, one every ${every} s, ${cols} across, read left to right.`,
);
