# Captions: on, off

Captions are the script: each scene's `caption ?? text` from `voiceover.json`, timed word by word by the voice's word timings. No transcription step.

- **on:** keep the captions clear of the picture's controls and labels.
  - **remotion:** put `<Captions scene={getScene(voiceover, "<id>")} />` from `@studio/components/Captions` in each scene. Its `style` prop places it.
  - **fframes:** show `<SCENE>_SHOWN` from `src/timing.rs` word by word.
- **off:** leave the captions out. The picture and the voice carry the video.

A scene's `caption` overrides its `text` on screen.
