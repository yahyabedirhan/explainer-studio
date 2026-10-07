import { prog } from "../../lib/sketch";

// A video's cue ramp: 0 to 1 between frames a and b. With `storyboard` true it is
// always 1, so every shot draws its end pose: the storyboard, checked before animating.
//   export const ramp = makeRamp(STORYBOARD);   // in the video's draw/ramp.ts
export const makeRamp =
  (storyboard: boolean) =>
  (frame: number, a: number, b: number): number =>
    storyboard ? 1 : prog(frame, a, b);
