# Sound: synth, none

- **synth:** `npm run sound -- <slug> --seconds <N> [--bpm 96] [--seed 1]` synthesizes a music bed, an end sting, and `click`, `tick`, `whoosh` and `pop` effects into `<root>/<slug>/assets/sound/`, with a `SOURCES.md`. `<N>` is the `total with padding` that `npm run voice` printed, after the last voice change.
  - Lay `bed.wav` under the whole video, faded at both ends, and `sting.wav` at the end. Put each effect on a cue: `whoosh` on a scene's first frame or a throw, `pop` on a word that reveals something, `click` or `tick` on small changes. The look may say more.
  - In Remotion:
    ```tsx
    // Video.tsx; total = totalFrames(voiceover, fps)
    <Audio src={staticFile("<slug>/assets/sound/bed.wav")}
      volume={(f) => interpolate(f, [0, fps, total - 2 * fps, total], [0, 0.14, 0.14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    <Sequence from={total - Math.round(3.2 * fps)} premountFor={fps}>
      <Audio src={staticFile("<slug>/assets/sound/sting.wav")} volume={0.35} />
    </Sequence>
    ```
  - In FFrames: the renderer reference's "Wire media and timing" step.
- **none:** the voice only.

A sound the synthesizer can't make comes from your own script in the `./tts` venv (it has numpy and soundfile), or from a freely licensed file with its source and licence noted in `SOURCES.md`.
