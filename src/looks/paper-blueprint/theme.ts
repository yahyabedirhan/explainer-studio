// The paper-blueprint look's type, colours and line boil.
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

export const INK = "#2B2622";
export const PAPER = "#EFE6D2";
export const RED = "#D9533F";
export const GOLD = "#E2B23C";
export const NAVY = "#141A3E";
export const LINE = "#C9D0F5";

export type Theme = "paper" | "blueprint";

// The pen wobble changes 8 times a second at 24 fps.
export const boilOf = (frame: number) => Math.floor(frame / 3);

// Paper stripe colours: blue for network and talk, yellow for pixels and painting.
export const STRIPE_BLUE = "#BCCACF";
export const STRIPE_YELLOW = "#EAD892";
// Blueprint accents: teal for answers and data, pink for a highlight ring.
export const TEAL = "#7FE0D2";
export const PINK = "#D2457E";
