import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";

export type DrawInfo = {
  frame: number;
  fps: number;
  width: number;
  height: number;
};

export type DrawFn = (ctx: CanvasRenderingContext2D, info: DrawInfo) => void;

type Props = {
  readonly draw: DrawFn;
  // `waitUntilDone` from each @remotion/google-fonts loadFont() the drawing uses.
  // Canvas text doesn't redraw when a font arrives, so the first frame waits for them.
  readonly fonts?: ReadonlyArray<() => Promise<unknown>>;
};

// A full-frame <canvas> that a scene paints from scratch on every frame: the
// "program draws each frame" approach. `draw` must depend only on `info.frame`.
export const CanvasScene: React.FC<Props> = ({ draw, fonts = [] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("CanvasScene fonts"));
  const [ready, setReady] = useState(false);
  const released = useRef(false);

  useEffect(() => {
    Promise.all(fonts.map((wait) => wait()))
      .then(() => document.fonts.ready)
      .then(() => setReady(true));
    // Fonts are fixed for a scene; load them once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    draw(ctx, { frame, fps, width, height });
    ctx.restore();
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [ready, frame, fps, width, height, draw, handle]);

  return (
    <AbsoluteFill>
      <canvas ref={canvas} width={width} height={height} style={{ width, height }} />
    </AbsoluteFill>
  );
};
