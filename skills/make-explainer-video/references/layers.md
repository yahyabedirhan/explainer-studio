# Layers

A video passes from an idea to an MP4 through a fixed process: the steps in `SKILL.md`. The **layers** are the parts of that process that change from video to video. Each layer has options, and a video uses one option per layer, or several where the layers table says so. A **preset** is only a saved set of choices: it adds no behaviour of its own.

## What each layer owns

| Layer | Owns | Where it plugs into the process |
|---|---|---|
| Renderer | how frames are drawn and encoded, the asset sheet, stills, the render and its own checks | steps 7, 9, 10, 11 |
| Drawing | how a scene draws inside the renderer: elements, or a canvas repainted each frame | steps 7, 9, 10 |
| Look | palette, type, materials, motion and what to avoid; the code that draws it in each renderer | steps 5 to 10 |
| Effects | texture and light over or behind the picture | steps 7, 10 |
| Captions | the narration's text on screen | step 10 |
| Voice | the narration WAVs and each word's timing, the clock of the video | step 8 |
| Sound | the music bed and the effects on cues | step 10 |
| Optional steps | extra steps: a reference study before the brief, a making-of page from snapshots of every step | step 5, then every step after it |

The voice is the clock: `@studio/lib/timing` turns each scene's measured length into frames as `ceil((durationSeconds + paddingSeconds) × fps)`, and `useWord` (or `src/timing.rs` in FFrames) turns a word's timing into a frame.

## What each option needs

| Option | Needs |
|---|---|
| `dom`, `canvas` | `remotion` |
| `shaders` | `remotion` for the `shaders` package and `ShaderLayer`; in `fframes`, shaders are SkSL, drawn by the renderer itself |
| `grain` | `remotion` for the `Grain` component; in `fframes`, draw grain in the scene |
| `dark-ui`, `paper-blueprint`, `pixel-thermal` | any renderer. A look's "In each renderer" section says where its code is, or that it is not built yet |
| `process-page` | the step snapshots that its reference describes, kept from the start |

Any other pair works. A look does not promise the same result in two renderers: a look built in a new renderer follows the look's intent, not a copy of another renderer's frames.

## Recording the choices

The brief's Choices lines hold one option per layer, plus the preset when the video started from one:

```text
- Preset: sketchbook
- Renderer: remotion
- Drawing: canvas
- Look: paper-blueprint
- Effects: grain
- Captions: on        (changed from the preset)
- Voice: kokoro, af_heart
- Sound: synth
- Optional steps: reference-study, process-page
```

## A look in a new renderer

When the chosen look has no code for the chosen renderer or drawing method:

1. Read the look's intent: palette, type, materials, motion and what to avoid.
2. Build the look's pieces in that renderer: in Remotion, shared code goes in `src/looks/<look>/`; in FFrames, in the video's own project.
3. Add the location to the look's "In each renderer" section, so the next video can use it.
