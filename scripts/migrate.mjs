// Move every video of a checkout into the videos root, once:
//   npm run migrate -- [--from <checkout>] [--dry-run]
// --from defaults to this checkout. The root is the resolved videos root
// (scripts/lib/videos-root.mjs). --dry-run prints the plan and changes nothing.
// See "Migration" in docs/videos-root.md.
import { resolve } from "node:path";
import { migrate } from "./lib/migrate.mjs";
import { videosRoot } from "./lib/videos-root.mjs";

const studio = resolve(import.meta.dirname, "..");
const usage = () => {
  console.error("Usage: npm run migrate -- [--from <checkout>] [--dry-run]");
  process.exit(1);
};
let from = studio;
let dryRun = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") dryRun = true;
  else if (args[i] === "--from" && args[i + 1] && !args[i + 1].startsWith("--")) from = args[++i];
  else usage();
}

try {
  const result = migrate({ checkout: resolve(from), root: videosRoot(), studio, dryRun });
  if (result.leftBehind.length)
    console.log(`Left in the checkout:\n${result.leftBehind.map((path) => `  ${path}`).join("\n")}`);
  if (!dryRun) console.log("Next: remove the checkout's videos/ and out/ folders and their .gitignore lines.");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
