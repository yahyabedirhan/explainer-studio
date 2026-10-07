// Frames where a scene's spoken words start and end, from the word timings
// `npm run voice` writes into voiceover.json. Frames are relative to the scene's
// start, where its WAV plays from frame 0.
import { useVideoConfig } from "remotion";
import { getScene, type Voiceover, type VoiceoverScene } from "./timing";

const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const findPhrase = (scene: VoiceoverScene, phrase: string, occurrence: number) => {
  const words = scene.words;
  if (!words?.length) {
    throw new Error(`Scene "${scene.id}" has no word timings. Run: npm run voice`);
  }
  const target = phrase.split(/\s+/).map(normalize).filter(Boolean);
  const spoken = words.map((w) => normalize(w.text));
  let seen = 0;
  for (let i = 0; target.length && i + target.length <= spoken.length; i++) {
    if (target.every((t, j) => spoken[i + j] === t) && ++seen === occurrence) {
      return { first: words[i], last: words[i + target.length - 1] };
    }
  }
  throw new Error(
    `Scene "${scene.id}" never says "${phrase}"${occurrence > 1 ? ` ${occurrence} times` : ""}. ` +
      `It says: ${words.map((w) => w.text).join(" ")}`,
  );
};

// Frame where the nth "phrase" starts (case and punctuation ignored).
export const wordFrame = (
  scene: VoiceoverScene,
  phrase: string,
  fps: number,
  occurrence = 1,
): number => Math.round(findPhrase(scene, phrase, occurrence).first.start * fps);

// Frame where the nth "phrase" ends.
export const wordEndFrame = (
  scene: VoiceoverScene,
  phrase: string,
  fps: number,
  occurrence = 1,
): number => Math.round(findPhrase(scene, phrase, occurrence).last.end * fps);

export const useWord = (
  voiceover: Voiceover,
  sceneId: string,
  phrase: string,
  occurrence = 1,
): number => {
  const { fps } = useVideoConfig();
  return wordFrame(getScene(voiceover, sceneId), phrase, fps, occurrence);
};
