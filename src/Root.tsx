import "./index.css";
import { Composition, Folder, Still } from "remotion";
import { totalFrames, Voiceover } from "./lib/timing";

// Every video is a folder in videos/, which git ignores: the repository is public, and a
// video can show private projects. Root finds each folder by itself, so adding a video
// changes no tracked file. Lengths always come from voiceover.json.
// An optional Sheet.tsx (the video's asset sheet: palette, type, characters, props) is
// registered as a still, <Id>Sheet, before the video has a voice.
const files = require.context(
  "../videos",
  true,
  /^\.\/[a-z0-9-]+\/(Video\.tsx|Sheet\.tsx|config\.ts|voiceover\.json)$/,
);

type VideoModule = { default: React.FC };
type ConfigModule = { FPS: number; WIDTH: number; HEIGHT: number };

const PARTS = ["Video.tsx", "config.ts", "voiceover.json"];
const slugs = [...new Set(files.keys().map((key) => key.split("/")[1]))]
  .filter((slug) => PARTS.every((part) => files.keys().includes(`./${slug}/${part}`)))
  .sort();

const compositionId = (slug: string) =>
  slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

// A video that hasn't been voiced yet has no lengths. Leave it out rather than break the others.
const frames = (slug: string, voiceover: Voiceover, fps: number) => {
  try {
    return totalFrames(voiceover, fps);
  } catch (error) {
    console.warn(`${slug}: ${(error as Error).message}`);
    return null;
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {slugs.map((slug) => {
        const config = files<ConfigModule>(`./${slug}/config.ts`);
        const voiceover = files<Voiceover>(`./${slug}/voiceover.json`);
        const { default: Video } = files<VideoModule>(`./${slug}/Video.tsx`);
        const durationInFrames = frames(slug, voiceover, config.FPS);
        const sheet = files.keys().includes(`./${slug}/Sheet.tsx`)
          ? files<VideoModule>(`./${slug}/Sheet.tsx`).default
          : null;
        if (durationInFrames === null && !sheet) return null;
        return (
          <Folder key={slug} name={slug}>
            {durationInFrames === null ? null : (
              <Composition
                id={compositionId(slug)}
                component={Video}
                durationInFrames={durationInFrames}
                fps={config.FPS}
                width={config.WIDTH}
                height={config.HEIGHT}
              />
            )}
            {sheet ? (
              <Still
                id={`${compositionId(slug)}Sheet`}
                component={sheet}
                width={config.WIDTH}
                height={config.HEIGHT}
              />
            ) : null}
          </Folder>
        );
      })}
    </>
  );
};
