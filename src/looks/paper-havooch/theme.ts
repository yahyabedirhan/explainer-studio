// The paper-havooch look's type, colours and line boil: paper-blueprint's shapes in
// the colours of Havooch's logo, Havuç the orange tabby.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

const inter = loadInter("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
export const SANS = inter.fontFamily;
export const MONO = mono.fontFamily;
export const FONTS = [inter.waitUntilDone, mono.waitUntilDone];

// Paper and its pen.
export const PAPER = "#EFE6D2";
export const INK = "#2E1D14"; // the logo's ink
export const CARROT = "#F37A1F"; // Havuç's fur and the main accent
export const TABBY = "#D9601A"; // the forehead stripes and the second accent
export const PEACH = "#F7B9A4"; // the inner ears
export const NOSE = "#EE8E92"; // the nose, and a highlight on the cocoa print
export const WHITE = "#FFFFFF"; // the muzzle, the bib and the paws
export const BUTTER = "#FFE9A8"; // sticky notes
// The brass of keys and padlocks, which the props share with paper-blueprint.
export const GOLD = "#E2B23C";

// The cocoa print: the dark ground for structure and data.
export const COCOA = "#4A2C1C";
export const COCOA_DEEP = "#1F130C";
export const LINE = "#F6DCC8"; // warm cream lines
export const CREAM = "#FFF4EA"; // headings and pill text on the cocoa print

export type Theme = "paper" | "cocoa";

// The pen wobble changes 8 times a second at 24 fps.
export const boilOf = (frame: number) => Math.floor(frame / 3);

// Paper stripe colours: peach for talking and networks, butter for making and building.
export const STRIPE_PEACH = "#F4C9AE";
export const STRIPE_BUTTER = "#FFE9A8";
// Cocoa print accents: carrot for answers and data, nose pink for a relation or highlight.
export const ANSWER = CARROT;
export const HIGHLIGHT = NOSE;
