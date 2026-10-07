// The videos root's tsconfig.json, for editors and `npx tsc -p <root>`: it extends the
// studio checkout's tsconfig and resolves @studio/* and every package from that checkout.
// A file another checkout wrote is kept while that checkout exists, so checkouts sharing
// one root don't rewrite it back and forth. Returns true when it wrote the file.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// True when the root's tsconfig.json stays as it is: one that names an existing checkout,
// or one that isn't JSON (a hand-made file). False when it's missing or its checkout is gone.
export const rootTsconfigIsKept = (root) => {
  const file = join(root, "tsconfig.json");
  if (!existsSync(file)) return false;
  let base;
  try {
    base = JSON.parse(readFileSync(file, "utf8")).extends;
  } catch {
    return true;
  }
  return typeof base !== "string" || existsSync(base);
};

export const writeRootTsconfig = (root, studio) => {
  if (rootTsconfigIsKept(root)) return false;
  const modules = join(studio, "node_modules");
  const tsconfig = {
    extends: join(studio, "tsconfig.json"),
    compilerOptions: {
      paths: {
        "@studio/*": [join(studio, "src", "*")],
        // @types first: a package such as react ships its code without types.
        "*": [join(modules, "@types", "*"), join(modules, "*")],
      },
      typeRoots: [join(modules, "@types")],
    },
    include: ["*/**/*.ts", "*/**/*.tsx"],
    exclude: ["*/out", "**/node_modules", "**/target"],
  };
  writeFileSync(join(root, "tsconfig.json"), `${JSON.stringify(tsconfig, null, 2)}\n`);
  return true;
};
