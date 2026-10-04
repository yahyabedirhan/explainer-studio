// The only place scene lengths are computed. Every length comes from a video's
// voiceover.json, after `npm run voice` has measured the audio.

export type VoiceoverScene = {
  id: string;
  text: string;
  voice: string;
  speed: number;
  audioFile: string;
  durationSeconds: number;
  paddingSeconds: number;
  hash?: string;
};

export type Voiceover = {
  scenes: VoiceoverScene[];
};

export const getScene = (voiceover: Voiceover, id: string): VoiceoverScene => {
  const scene = voiceover.scenes.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`Scene "${id}" is not in voiceover.json`);
  }
  if (!scene.durationSeconds) {
    throw new Error(`Scene "${id}" has no duration. Run: npm run voice`);
  }
  return scene;
};

export const sceneFrames = (voiceover: Voiceover, id: string, fps: number) => {
  const scene = getScene(voiceover, id);
  // Round away float noise first, so 6.3 s x 30 fps is 189 frames, not 190.
  const frames = Number(((scene.durationSeconds + scene.paddingSeconds) * fps).toFixed(3));
  return Math.ceil(frames);
};

export const totalFrames = (voiceover: Voiceover, fps: number) =>
  voiceover.scenes.reduce((sum, s) => sum + sceneFrames(voiceover, s.id, fps), 0);
