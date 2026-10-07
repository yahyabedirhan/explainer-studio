// The arguments `npm run render` and `npm run still` pass to the Remotion CLI, so an agent
// names a slug and never types the videos root. Any other flag goes on to Remotion.
//   render <slug> [flags]                 -> <root>/<slug>/out/<slug>.mp4
//   still <slug> <name> [--sheet] [flags] -> <root>/<slug>/out/<name>.png
// --sheet draws the video's asset sheet, <Id>Sheet, in place of the video.
import { join } from "node:path";
import { compositionId, outputDir } from "./videos-root.mjs";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const USAGE = {
  render: "Usage: npm run render -- <slug> [remotion render flags]",
  still:
    "Usage: npm run still -- <slug> <name> [--sheet] [--frame=<n>] [remotion still flags]",
};

export const remotionArgs = (mode, argv, env = process.env) => {
  const usage = USAGE[mode];
  if (!usage) throw new Error(`Unknown mode ${mode}: use render or still`);
  const rest = [...argv];
  const sheetAt = rest.indexOf("--sheet");
  const sheet = mode === "still" && sheetAt !== -1;
  if (sheet) rest.splice(sheetAt, 1);
  const slug = rest.shift();
  if (!slug || !SLUG.test(slug)) throw new Error(usage);
  const id = compositionId(slug) + (sheet ? "Sheet" : "");
  if (mode === "render")
    return ["render", id, join(outputDir(slug, env), `${slug}.mp4`), ...rest];
  const name = rest.shift();
  if (!name || !NAME.test(name)) throw new Error(usage);
  const file = /\.(png|jpe?g|webp|pdf)$/i.test(name) ? name : `${name}.png`;
  return ["still", id, join(outputDir(slug, env), file), ...rest];
};
