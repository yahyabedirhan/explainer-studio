# Sketchbook style

A short explainer drawn entirely in code: warm **paper** storybook shots and navy **blueprint** diagram shots, alternating with hard cuts. A red tomato robot carries the story on paper and turns into a glowing outline robot on blueprint. Every frame is painted on a `<canvas>` by a `draw(ctx, { frame })` function: the code is the drawing.

Use it for a concept explainer of 10 to 60 seconds that shows a system or a process. It is a poor fit for a walkthrough of a real product, which wants real screen captures.

- **How to make one**: [`skills/sketchbook-video/SKILL.md`](../../skills/sketchbook-video/SKILL.md), the steps from idea to MP4, with the looks in [`references/look.md`](../../skills/sketchbook-video/references/look.md) and the motion vocabulary in [`references/motion.md`](../../skills/sketchbook-video/references/motion.md).
- **Code**: `src/styles/sketchbook/` (palettes, fonts, backgrounds, heading and dial, mascot, props, pill, storyboard ramp), drawn on `src/components/CanvasScene.tsx` with `src/lib/sketch.ts`.
- **Tools**: `npm run refs` (reference frames), `npm run sheet` (contact sheet of a render), `npm run process` (the making-of page), `npm run new-video -- <slug> --fps 24`, a video's `Sheet.tsx` as an asset-sheet still.

This page holds the why: where the style comes from, the choices behind it, and what was learned making the two videos so far.

## Where the style comes from

Addy Osmani posted a 40 second animation of his article ["How modern browsers work"](https://addyo.substack.com/p/how-modern-browsers-work) on [LinkedIn](https://www.linkedin.com/posts/addyosmani_ai-programming-softwareengineering-activity-7508775688909475840-Vg6e) and [X](https://x.com/addyosmani/status/2103009037164110327) on 2026-09-24.

**What he says**: Claude Opus 5.5 "drew each frame of this animation in JavaScript", with the article as input. It "doesn't generate pixels directly but writes programs that draw", and he made it with "animations, diagrams, sound, even music" in Claude Code.

**What he doesn't say**: the renderer, the prompt, the code or the cost. Replies asking whether he used Remotion or HyperFrames, and for the exact prompt, have no answer in the thread. The prompt indexes that list the video ([X-RayLuan/awesome-opus-5-5-video-prompts](https://github.com/X-RayLuan/awesome-opus-5-5-video-prompts), [athemeroy/awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos), the round-up at [blog.cosine.ren](https://blog.cosine.ren/en/post/opus-5-5-motion-video-resources/)) have no traced prompt for it. A reply said to have recreated it in HyperFrames turned out to be someone describing a similar experiment with their own article, not a recreation.

**What the video shows** (studied frame by frame with ffmpeg, now `npm run refs`):

- 1920x1080, 24 fps, 40 s. The LinkedIn copy is 30 fps with a duplicate every fifth frame, so 24 is the master.
- About 17 shots. Hard cuts every 2.0 s up to 20 s, then at 22.5, 24.5, 26.5, 29.5, 32, 34 and 37 s. No transitions.
- Two looks alternating, the mascot in both, a lowercase heading that types on at top left, a stage dial at top right in every shot.
- One visual metaphor per concept: a typed URL bar, a URL dimensioned into scheme, host and path, a sleepy server woken by "hello", a padlocked tunnel, a vine for the DOM paused by a script, exploded layers, a GPU chip mascot, V8 tiers as gears, garbage collection as fenced pens, a town of processes.
- Motion: paths drawing on with a sparkle at the head, objects thrown on arcs, back-out pops, type-on labels, a slow push, the line boiling about 8 times a second.
- No voice. A synthesized music bed with effects on actions, on a 1 s pulse that the cuts land on, at -16.8 LUFS.

**Guesses, not confirmed**: one canvas page with a pure `draw(t)`, captured frame by frame in headless Chrome and encoded with ffmpeg, with the sound synthesized in code. Write-ups from that week describe this as what Opus 5.5 builds by default when no framework is named ([zhuermu](https://zhuermu.com/en/blog/opus-5-5-five-videos/), [quantslant](https://quantslant.com/claude-opus-5-5-motion-graphics/), [LaoZhang](https://blog.laozhang.ai/en/posts/claude-opus-5-5-video-generation)), and the 24 fps master fits custom capture better than Remotion's default of 30. The two looks also match the "illustration shapes" and "cinematic flat + blueprint" techniques of [iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills) at `f7d0882a313249cbd43f0e4e9e209b1622870253`, published the same day. That repository was read as a reference while building this style (its pen line, hatching and draw-on ideas); Addy does not mention it.

## Why this studio draws it this way

The studio keeps Remotion ([renderers.md](../renderers.md)). `CanvasScene` gives the reference's method, a canvas the scene repaints from the frame number, inside what the studio already has: Kokoro narration, scene lengths from `voiceover.json`, reveals cued on narration words, stills for checks. The difference from the reference is narration: a shot lasts as long as its sentence, so cuts land where the voice ends rather than every 2 seconds, and the 120 BPM bed keeps the pulse underneath.

Choices that carry the look:

- **Paper for actors, blueprint for structure.** Switching the look on every cut makes each cut read as a new idea.
- **24 fps** gives the boiling line a film cadence.
- **The mascot is drawn from shapes and hatching**, not an image, so it boils with the rest of the line.
- **Pills size to their full text** and type inside it, so nothing grows or overflows while typing.
- **Key pose first.** The storyboard switch draws each shot's end pose before any motion exists, when composition fixes are cheap.

## What worked and what didn't

Worked:

- One `draw` function per shot. Coordinates stay in one place, and a still at any frame is exact.
- Cueing every reveal on a narration word. The picture never runs ahead of the voice.
- The asset sheet before animation. It caught file names colliding with the desk in one minute.
- The storyboard before animation. It caught a card landing on a signpost, a robot floating unattached, and arrows running through the mascot, all before a single ramp existed.
- Contact sheets every half second. One image showed a three-second stretch where the voice talked and nothing moved.

Didn't:

- Fixed pill widths: text ran out of them. Fixed with `pill`, which measures its text.
- A held prop drawn at a fixed point beside a moving hand. `mascot` returns its hand position; hang props on it.
- Trails left on screen after a flight. Fade them once the object lands.
- First frames after each cut as references: the heading is still typing and the shot is empty. The last frame of each shot is its key pose, so `npm run refs` saves both and tiles the key poses into `shots.png`.
- `@remotion/noise`: installing it was blocked in the first spike, and `sketch.ts`'s own seeded value noise covers the need.
- Copying video code (`.ts`) into `out/` for the process page broke the type check; `out/` is now excluded from it.

## The two videos so far

1. **browsers-spike** (18 s): the reference's "dns lookup" (blueprint) and "tcp + tls handshake" (paper) shots, rebuilt from the frames. The style code started here.
2. **sketchbook-demo** (26 s): how a git commit works, in three shots (git add on paper, the commit snapshot on blueprint, a branch as a moving label on paper), made by following the written recipe from the brief to the MP4, with every stage kept in `out/sketchbook-demo/process/process.html`.

What the second video changed in the recipe:

- `npm run refs` gained the key-pose frames and `shots.png` (above).
- `pill` moved into the style on its second use, and fixed the overflow for good.
- The storyboard became a switch (`makeRamp(STORYBOARD)`) instead of a separate drawing, so the end pose and the animation share one `draw`.
- A cue word said twice needs `useWord`'s occurrence argument; check for repeats when reading the voice timings.
- Every sentence of the narration needs something on screen; check it on the metaphor list, not in review.
- Keep every storyboard round's boards; the first round's were overwritten and lost from the process page.
