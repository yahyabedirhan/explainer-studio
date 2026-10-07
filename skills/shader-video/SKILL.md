---
name: shader-video
description: Make a narrated video in the explainer studio whose picture is built from GPU shader effects (gradients, noise, halftone, light rays, wipes). Use when the user gives an idea for a shader video, or asks for shaders in a video.
---

# Shader video

Turn a bare idea into a rendered studio video whose backgrounds, textures and transitions are effects from the `shaders` package, drawn frame by frame by `src/components/Shader.tsx`. Why it works this way, and its limits: [`docs/shaders.md`](../../docs/shaders.md).

Work in the studio's checkout and follow its `AGENTS.md`; where this skill and `AGENTS.md` differ, `AGENTS.md` wins. Before writing scene code, read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to, with the overrides table in `AGENTS.md`.

## Steps

1. **Scaffold.** Pick a kebab-case slug for the idea and run `npm run new-video -- <slug>`.
   - Done when `videos/<slug>/` exists.
2. **Brief.** Fill `videos/<slug>/brief.md`: goal, audience, length, and a **Look** section. If the idea leaves the goal or audience open, ask the user once, in a single round. When nobody can answer (you run as a subagent), decide, and write each decision in the brief.
   - The Look names: the palette as hex values, one display font and one mono font from `@remotion/google-fonts`, and for every scene its effect stack (from step 3) and the one thing the stack shows.
   - Done when every brief heading has content and every scene has a stack.
3. **Choose effects.** Pick them from [`effects.md`](effects.md). Use effects marked `tested` or `yes`; an effect marked `check` only after two stills of one frame come out byte-identical (step 7).
   - One generator per scene, plus at most two filters nested over it. Make the effect carry the idea: `Pixelate` for "pixels", `IrisWipe` to close, `Halftone` for print. A shader behind a text card is decoration; a shader the narration points at is the explainer.
   - Read each chosen effect's props in `node_modules/shaders/dist/core/shaders/<Effect>/index.d.ts`.
4. **Narration.** Write the script in `brief.md`, then the scenes in `voiceover.json`, and run `npm run voice -- <slug>`.
   - Done when every scene has `durationSeconds` and `words`.
5. **Scenes.** One file per scene in `videos/<slug>/scenes/`, built from the pattern in [`patterns.md`](patterns.md): a `<Shader layers={...} />` at the back, typography over it, `<Captions>`, the scene's `<Audio>`, and every reveal and every animated prop cued with `useWord`. List the scenes in `Video.tsx` with `sceneFrames`.
   - Done when `npx tsc --noEmit` and `npx eslint src videos/<slug>` pass.
6. **Sound.** Sum `ceil((durationSeconds + paddingSeconds) x 30)` over the scenes, divide by the fps, and run `npm run sound -- <slug> --seconds <N>`. Lay `bed.wav` under the whole video and place the effects on word cues, as in `patterns.md`.
7. **Stills.** For each scene, render a still at its first frame and at each cue: `npx remotion still <Id> out/<slug>/<name>.png --frame=<n> --gl=angle`. Read every still.
   - A still that shows only the scene's CSS background colour means the shader did not draw: see "Troubleshooting" in `docs/shaders.md`.
   - Render one frame twice and compare with `md5`; the two files match.
   - Done when every still shows its effect, its text and its caption as the brief says.
8. **Render.** `npx remotion render <Id> out/<slug>/<slug>.mp4`. Check it with `ffprobe -v error -show_entries format=duration:stream=codec_type,nb_frames -of compact out/<slug>/<slug>.mp4`.
   - Done when the video frame count equals the summed scene frames and an audio stream is present.

Hand over the MP4 path and the stills you checked.
