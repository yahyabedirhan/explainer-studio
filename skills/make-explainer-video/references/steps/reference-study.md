# Optional step: reference-study

Study a reference video before writing the brief, so the video borrows its framing and rhythm. Do it whenever the user names a video to imitate, and in any video that chose this step.

1. Pull the reference's cuts and key poses:
   ```sh
   npm run refs -- <slug> <url> [--name <name>]
   ```
   It downloads the video into `<root>/<slug>/refs/<name>.mp4` and writes its frames into `<root>/<slug>/out/refs/<name>/`: the first and last frame of each shot, and `shots.png`, every shot's key pose (its last frame) in one image. Run it again with another `--name` for each reference.
2. Look at `shots.png`. Pick two or three `end-NN.png` frames close to the idea.
3. Write into the brief what to take from them: framing, a prop idea, a palette choice, a cut rhythm. Never the subject.
   - Done when the brief's Reference videos section names each reference, its picked frames and what to take.

The paper-blueprint look's own reference is Addy Osmani's "How modern browsers work" animation: `npm run refs -- <slug> https://x.com/addyosmani/status/2103009037164110327 --name addy`.
