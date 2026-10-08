# Renderer: remotion

Remotion draws every frame as a React component of the frame number, in headless Chrome, and encodes with its bundled FFmpeg. It is the default renderer: the studio's shared code (timing, captions, cursor, canvas helpers, look code) is written for it, and nothing has to compile.

Read `.claude/skills/remotion-best-practices/SKILL.md` and the references it routes to before writing Remotion code, with the "Where the official skills differ" table in `SKILL.md`.

## A video's code

- `Video.tsx` default-exports a `<Series>` of scenes. Give each `<Series.Sequence>` `durationInFrames={sceneFrames(voiceover, "<id>", fps)}` from `@studio/lib/timing`, and `premountFor={fps}`.
- `scenes/<Scene>.tsx`: one file per scene. Each plays its narration with `<Audio src={staticFile(getScene(voiceover, "<id>").audioFile)} />` from `@remotion/media`.
- Call `getScene` inside the component. At module level it throws before `npm run voice`, and the throw breaks `Root`'s listing of every other video.
- `config.ts` exports `FPS`, `WIDTH`, `HEIGHT` and the colours.
- Cue a reveal with `const at = useWord(voiceover, "<id>", "<phrase>")` from `@studio/lib/words`: the frame where that phrase starts in the scene. A phrase said twice needs the occurrence, `useWord(voiceover, id, phrase, 2)`. A phrase the scene never says throws. `wordEndFrame` gives the frame where a word ends.
- Put a sound effect on a cue in a `<Sequence from={at} durationInFrames={fps} premountFor={fps}>`. A `Sequence` cue below 0 fails: start at `Math.max(0, at - n)`.
- `totalFrames(voiceover, fps)` is the video's length, for the music bed.

Installed packages beyond the core: `@remotion/paths` (strokes that draw on), `@remotion/shapes` (diagram shapes), `@remotion/layout-utils` (text that fits its box), `@remotion/motion-blur`, `@remotion/noise`, `@remotion/google-fonts` and `@remotion/media`. Playwright with Chromium is installed for real UI captures.

## Asset sheet and stills

- `Sheet.tsx` default-exports a component that draws the asset sheet. Render it with `npm run still -- <slug> sheet-assets --sheet`, to `<root>/<slug>/out/sheet-assets.png`. It renders before the video has a voice.
- `npm run still -- <slug> <name> --frame=<n>` renders one frame to `<root>/<slug>/out/<name>.png`. A scene's last frame is the running sum of `sceneFrames` up to it, minus 1.
- After a change, render stills at the frames it affects and look at them.

## Render and checks

```sh
npm run render -- <slug>                 # <root>/<slug>/out/<slug>.mp4
npm run sheet -- <slug> [--every 0.125]  # out/sheet.png, a frame every half second by default
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames -of default=nw=1 "$(npm run --silent root)/<slug>/out/<slug>.mp4"
```

- The frame count equals the sum of `sceneFrames` over the scenes, and there is an audio stream.
- `remotion.config.ts` sets `--gl=angle` for every render, which WebGL and WebGPU layers need.
- `npm run dev` opens Remotion Studio, to watch or tweak the video.
