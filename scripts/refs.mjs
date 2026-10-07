// Download a reference video and pull frames from it, to study a style shot by shot.
//
//   npm run refs -- <slug> <url> [--name <name>]
//
// Writes the video to videos/<slug>/refs/<name>.mp4 (git-ignored, like the rest of the
// video) and, in out/<slug>/refs/<name>/:
//   probe.txt     size, fps, length and audio of the download
//   cuts.txt      the time of every hard cut (ffmpeg scene score above 0.3)
//   cut-NN.png    the first frame after each cut, plus the very first frame
//   sec-NN.png    one frame per second
//   contact.png   all the per-second frames on one sheet, 8 across
// Needs yt-dlp and ffmpeg on PATH. Any URL yt-dlp reads works (X, LinkedIn, YouTube...).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const name = flag("name", "ref");
const [slug, url] = args;
if (!slug || !url) {
  console.error("Usage: npm run refs -- <slug> <url> [--name <name>]");
  process.exit(1);
}

const run = (cmd, argv) => execFileSync(cmd, argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const refDir = join("videos", slug, "refs");
const outDir = join("out", slug, "refs", name);
mkdirSync(refDir, { recursive: true });
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const video = join(refDir, `${name}.mp4`);
if (!existsSync(video)) {
  console.log(`Downloading ${url}`);
  run("yt-dlp", [
    "-f",
    "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/b",
    "--merge-output-format",
    "mp4",
    "--write-info-json",
    "-o",
    join(refDir, `${name}.%(ext)s`),
    url,
  ]);
}

const probe = run("ffprobe", [
  "-v",
  "error",
  "-show_entries",
  "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
  "-of",
  "default=nw=1",
  video,
]);
writeFileSync(join(outDir, "probe.txt"), probe);

// Scene scores for every frame; a hard cut scores near 1.
const scores = run("ffmpeg", ["-v", "error", "-i", video, "-vf", "select='gte(scene,0)',metadata=print:file=-", "-f", "null", "-"]);
const cuts = [0];
let time = 0;
for (const line of scores.split("\n")) {
  const t = line.match(/pts_time:([\d.]+)/);
  if (t) time = Number(t[1]);
  const s = line.match(/scene_score=([\d.]+)/);
  if (s && Number(s[1]) > 0.3) cuts.push(time);
}
writeFileSync(join(outDir, "cuts.txt"), cuts.map((t) => t.toFixed(2)).join("\n") + "\n");

cuts.forEach((t, i) => {
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(t + 0.05), "-i", video, "-frames:v", "1", join(outDir, `cut-${String(i).padStart(2, "0")}.png`)]);
});
run("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", "fps=1", join(outDir, "sec-%02d.png")]);
const seconds = readdirSync(outDir).filter((f) => f.startsWith("sec-")).length;
const rows = Math.ceil(seconds / 8);
run("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-i",
  video,
  "-vf",
  `fps=1,scale=480:-1,tile=8x${rows}:padding=4:color=white`,
  "-frames:v",
  "1",
  join(outDir, "contact.png"),
]);

console.log(`${video}
${probe.trim()}
${cuts.length - 1} hard cuts: ${cuts.slice(1).map((t) => t.toFixed(2)).join(", ")}
Frames and contact sheet in ${outDir}. Read them before writing the brief.`);
