// Tailwind v4 finds class names by scanning the project folder, and the videos live outside it.
// This loader runs before Tailwind's and adds `@source "<root>"` after `@import "tailwindcss"`,
// so classes used in video code under the videos root are generated too.
module.exports = function tailwindSourceLoader(source) {
  const { root } = this.getOptions();
  return source.replace(/@import\s+["']tailwindcss["'];?/, (line) => `${line}\n@source ${JSON.stringify(root)};`);
};
