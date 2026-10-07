// Render a video, or a still of it, into its own outputs folder under the videos root.
//
//   npm run render -- <slug> [remotion render flags]
//   npm run still -- <slug> <name> [--sheet] [--frame=<n>] [remotion still flags]
//
// `render` writes <root>/<slug>/out/<slug>.mp4 and `still` writes <root>/<slug>/out/<name>.png.
// `--sheet` draws the asset sheet (<Id>Sheet). Both resolve the root as
// scripts/lib/videos-root.mjs does and then run `npx remotion render|still`, which works too.
import { spawnSync } from "node:child_process";
import { remotionArgs } from "./lib/remotion-args.mjs";

const [mode, ...argv] = process.argv.slice(2);
let args;
try {
  args = remotionArgs(mode, argv);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const { status } = spawnSync("npx", ["remotion", ...args], {
  stdio: "inherit",
});
process.exit(status ?? 1);
