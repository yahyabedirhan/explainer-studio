# Preset: havooch

For videos about Havooch ([yahyabedirhan/havooch](https://github.com/yahyabedirhan/havooch)): the sketchbook preset in Havooch's colours, with Havuç as the mascot.

| Layer | Choice |
|---|---|
| Renderer | `remotion` |
| Drawing | `canvas` |
| Look | `paper-havooch` |
| Effects | none; the paper's own specks stand in for grain |
| Captions | `off` |
| Voice | `kokoro`, `af_heart`, speed 1.05 |
| Sound | `synth`, at 120 BPM |
| Optional steps | none |

Settings: 1920x1080 at 24 fps (`npm run new-video -- <slug> --fps 24`). `paddingSeconds` 0.3, and 0.6 on the last scene.

While building, replace the template's `Video.tsx` with a stub (`export default () => null`) until the storyboard step, and delete `scenes/Hook.tsx`. Then use the storyboard switch: [../references/drawing/canvas.md](../references/drawing/canvas.md).

Write "Havooch" as it is spelled in the narration: Kokoro says it "huh-VOOCH". Don't respell it in capitals: Kokoro reads capital letters one by one.
