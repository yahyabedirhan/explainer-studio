---
name: sketchbook-video
description: Make a short explainer video in the studio's sketchbook style (paper storybook and navy blueprint shots, hard cuts, every frame drawn in code) from a bare idea. Use when asked for a sketchbook video, or for a short animated explainer of a concept "in the style of the browsers video".
---

# Sketchbook video

Turn an idea into a 10 to 60 second explainer in the sketchbook style, rendered to `out/<slug>/<slug>.mp4`, with every stage of the making kept under `out/<slug>/process/`. Why the style looks and moves the way it does, and where it comes from: `docs/styles/sketchbook.md`.

Read before starting:

- `AGENTS.md`: videos are private and git-ignored, scene lengths come only from `voiceover.json`, reveals cue on narration words with `useWord`, narration is written for the ear.
- [`references/look.md`](references/look.md): the two looks, the cast and the drawing API in `src/styles/sketchbook/`.
- [`references/motion.md`](references/motion.md): the motion vocabulary and a scene skeleton to copy.

Read the Remotion skill (`.claude/skills/remotion-best-practices/SKILL.md`) only if you leave the `CanvasScene` pattern.

Each step ends with a **snapshot**: copy what the step produced into `out/<slug>/process/<NN>-<stage>/` with a `NOTES.md` whose first line is `# <title>`, saying what you did, what you saw and what you changed. The snapshot is part of the step.

## 1. Scaffold and references

```sh
npm run new-video -- <slug> --fps 24
npm run refs -- <slug> https://x.com/addyosmani/status/2103009037164110327 --name addy
```

Delete `scenes/Hook.tsx`, and replace `Video.tsx` with a stub (`export default () => null`) until step 5. Run `refs` again with another `--name` for any reference the user gave.

Read `out/<slug>/refs/<name>/shots.png` (every shot's key pose) and pick two or three `end-NN.png` frames close to your idea. List what to take from them: framing, a prop idea, a palette choice, never the subject.

Snapshot: `01-references` with `shots.png`, the picked frames and the list.

## 2. Brief

If the user is reachable, ask one round of questions; otherwise decide yourself and write your choices into the brief.

Fill `videos/<slug>/brief.md`, including **Look**. The Look section is the **metaphor list**, one line per shot:

```
<n>. <concept> | <paper or blueprint> | <metaphor> | <cue word> (<what it reveals>), ...
```

- One concept per shot, one metaphor per concept: a picture that acts the concept out, never a label naming it.
- Paper for actors and actions, blueprint for structure and data. Alternate, so every cut changes the look. Two shots: paper then blueprint, or the reverse.
- Write the narration now, one or two short sentences per shot, 4 to 10 seconds each, adding up to the requested length within about 20 percent (roughly 2.5 spoken words a second).
- Every sentence names something that appears or moves. List each shot's cues in the order the narration says them, each a word the narration says.

Done when each shot has its line and every sentence has a cue. Snapshot: `02-brief` with `brief.md`. When a later step changes the brief, copy it into `02-brief` again and say what changed in that step's notes.

## 3. Asset sheet

Draw every character and prop the metaphor list names on one still, `videos/<slug>/Sheet.tsx`, from the skeleton in `references/look.md`. The studio registers it as `<Id>Sheet` even before the video has a voice. Use the style's cast first; draw new props in `videos/<slug>/draw/props.ts`.

```sh
npx remotion still <Id>Sheet out/<slug>/sheet-assets.png
```

Look at it. Fix props that collide, read badly or have text outside their shape.

Done when every prop in the metaphor list is on the sheet and reads at a glance. Snapshot: `03-asset-sheet`.

## 4. Voice

Write `voiceover.json`, one scene per shot (`voice` "af_heart", `speed` 1.05, `paddingSeconds` 0.3, 0.6 on the last), and voice it:

```sh
npm run voice -- <slug>
```

Find each cue word in the scene's `words`. A word said twice in a scene needs `useWord(voiceover, id, word, 2)` for the second.

Done when every cue word is found. Snapshot: `04-voice` with `voiceover.json`, the WAVs and a list of cue times.

## 5. Storyboard

Append `export const STORYBOARD = true;` to the end of `config.ts`, and create `videos/<slug>/draw/ramp.ts`:

```ts
import { makeRamp } from "../../../src/styles/sketchbook";
import { STORYBOARD } from "../config";
export const ramp = makeRamp(STORYBOARD);
```

Write one scene file per shot from the skeleton in `references/motion.md`, timing every reveal with `ramp(frame, cue, cue + n)`, and a `Video.tsx` with a `<Series>` of them (no transitions). Leave the sound effects out until step 6. While `STORYBOARD` is true every ramp is 1, so each frame shows the shot's end pose: design it so everything that moved is visible where it ends up, and a thrown or carried thing rests where it lands rather than vanishing or hanging mid-air. Find each shot's last frame (the running sum of `sceneFrames`, minus 1) and render it:

```sh
npx remotion still <Id> out/<slug>/board-<n>-r<round>.png --frame=<last frame of shot n>
```

Look at every board. Fix overlaps, text running out of shapes, props floating unattached, and an empty half of the frame.

Done when every end pose reads at a glance with nothing overlapping. Snapshot: `05-storyboard` with every round's boards.

## 6. Sound

```sh
npm run sound -- <slug> --seconds <total seconds> --bpm 120
```

Total seconds: the `total with padding` line `npm run voice` printed. Put `bed.wav` under the whole video at volume 0.22 in `Video.tsx`, and in each scene put effects on cues: `whoosh` on throws and flights, `pop` on things appearing, `click` on things locking into place, `tick` on the first typed pill or label (not the heading), `sting` (volume 0.5) on the final landing. Note the command and the effect cues in the first review's notes.

## 7. Animate and review

Set `STORYBOARD = false`. Then loop:

```sh
npx remotion render <Id> out/<slug>/<slug>.mp4
npm run sheet -- <slug>
```

Read `out/<slug>/sheet.png` (a frame every half second, left to right; add `--every 0.125` for a video under 15 seconds) and stills at two or three cue frames. For fast motion, render four stills a few frames apart. Look for: a reveal off its word, a stretch with nothing moving while the voice talks, a trail left after a flight, text outside its pill, something popping in without a cue, a rotation fast enough to look frozen (keep turns under a quarter turn per frame).

Done when a round finds nothing to fix. Snapshot each round as `06-review-1`, `07-review-2`, … with the sheet, the stills and what you changed.

## 8. Final checks

```sh
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames -of default=nw=1 out/<slug>/<slug>.mp4
```

Done when the frame count equals the sum of `sceneFrames` over the scenes, there is an audio stream, and the size is 1920x1080 at 24 fps. Snapshot: a new `<NN>-final` folder after the last review, with the MP4 and the ffprobe output.

## 9. Process page

```sh
npm run process -- <slug>
```

Open `out/<slug>/process/process.html` in a browser (or screenshot it with Playwright, scrolling the full page) and check every stage shows its images.

Report the MP4 path, the process page path and anything you improvised that the steps did not cover. Commit only studio code (`src/`, `scripts/`, docs, this skill), never a video's files. If you worked in a worktree, say that `videos/<slug>/` and `out/<slug>/` must move to the main checkout before the worktree is returned.
