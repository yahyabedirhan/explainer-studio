---
name: shader-video
description: Add GPU shader effects (gradients, noise, halftone, light rays, wipes) to a studio video, with the user picking each effect from a prototype sheet first. Use when the user asks for shaders, or when one or a few effects clearly suit what the video explains.
---

# Shader video

Shaders are an optional, experimental add-on: effects from the `shaders` package, drawn frame by frame by `src/components/Shader.tsx`, behind or over a video's own scenes. Use one when the effect carries the idea the narration explains, never as decoration added for its own sake. Taste in effects is the user's: they pick every effect from a prototype sheet (step 3) before any scene is built. Why it works this way, and its limits: [`docs/styles/shaders.md`](../../docs/styles/shaders.md).

Work in the studio's checkout and follow its `AGENTS.md`; where this skill and `AGENTS.md` differ, `AGENTS.md` wins. Before writing scene code, read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to, with the overrides table in `AGENTS.md`.

## Steps

1. **Scaffold.** Pick a kebab-case slug for the idea and run `npm run new-video -- <slug>`. The template's `scenes/Hook.tsx` is a placeholder title card: replace it with your own scenes.
   - Done when `videos/<slug>/` exists.
2. **Brief.** Fill `videos/<slug>/brief.md`: goal, audience, length, and a **Look** section, which you add as a heading of its own. If the idea leaves the goal or audience open, ask the user once, in a single round. When nobody can answer (you run as a subagent), decide, and write each decision in the brief.
   - The Look names: the palette as hex values, one display font and one mono font from `@remotion/google-fonts`, and for every scene the one thing it shows. Its effect stack comes from the user's picks in step 3.
   - Done when every brief heading has content.
3. **Prototype the effects with the user.** Shortlist six to ten candidate stacks from [`effects.md`](effects.md) for the brief's scenes. Use effects marked `tested` or `yes`; an effect marked `check` only after two stills of one frame come out byte-identical (step 7).
   - One generator per stack, plus at most two filters nested over it. Each candidate carries an idea: `Pixelate` for "pixels", `IrisWipe` to close, `Halftone` for print. Read each effect's props in `node_modules/shaders/dist/core/shaders/<Effect>/index.d.ts`.
   - Draw the shortlist on the video's asset sheet, `videos/<slug>/Sheet.tsx`: one labelled row per candidate in the brief's palette, each row showing the stack at three times through `<Shader time={...}>` (start, middle, end), so the sheet shows motion as well as look. Render it with `npx remotion still <Id>Sheet out/<slug>/shader-sheet.png` and read it.
   - Show the sheet to the user and ask which candidates to use, for which scenes. Write their picks and the reason into the brief's Look section.
   - Done when the user has picked, and every scene's stack in the brief comes from their picks. A scene the user leaves without a pick gets no shader.
4. **Narration.** Write the script in `brief.md`, then the scenes in `voiceover.json`, and run `npm run voice -- <slug>`. Kokoro speaks about 2.5 words a second at speed 1.0: budget the words for the target length, and shorten lines (or raise `speed` up to 1.1) when the total runs long.
   - Done when every scene has `durationSeconds` and `words`, and the summed length is within 10 % of the target.
5. **Scenes.** One file per scene in `videos/<slug>/scenes/`, built from the pattern in [`patterns.md`](patterns.md): a `<Shader layers={...} />` at the back, typography over it, `<Captions>`, the scene's `<Audio>`, and every reveal and every animated prop cued with `useWord`. List the scenes in `Video.tsx` with `sceneFrames`.
   - Done when `npx tsc --noEmit` and `npx eslint src videos/<slug>` pass.
6. **Sound.** Sum `ceil((durationSeconds + paddingSeconds) x fps)` over the scenes, with the fps from `config.ts`, divide by the fps, and run `npm run sound -- <slug> --seconds <N>`. Lay `bed.wav` under the whole video and place the effects on word cues, as in `patterns.md`.
7. **Stills.** For each scene, render a still at its first frame and about ten frames after each cue, when the reveal has landed: `npx remotion still <Id> out/<slug>/<name>.png --frame=<n>`. `remotion.config.ts` sets the ANGLE renderer that WebGPU needs. Read every still.
   - A still that shows only the scene's CSS background colour means the shader did not draw: see "Troubleshooting" in `docs/styles/shaders.md`.
   - Render one frame twice and compare with `md5`; the two files match.
   - Done when every still shows its effect, its text and its caption as the brief says.
8. **Render.** `npx remotion render <Id> out/<slug>/<slug>.mp4`. Check it with `ffprobe -v error -show_entries format=duration:stream=codec_type,nb_frames -of compact out/<slug>/<slug>.mp4`.
   - Done when the video frame count equals the summed scene frames and an audio stream is present.

Hand over the MP4 path and the stills you checked.
