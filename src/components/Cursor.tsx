import { Easing, interpolate, useCurrentFrame } from "remotion";

export type CursorKey = {
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  // The button state from this key until the next one. Leave it out for "up".
  readonly down?: boolean;
};

export type CursorState = {
  x: number;
  y: number;
  down: boolean;
  // 0 when up, rising to 1 over PRESS_FRAMES after a press and falling back after a release.
  pressing: number;
};

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const PRESS_FRAMES = 4;
// How far the path bows sideways, as a share of the distance travelled.
const ARC = 0.12;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Where the cursor is at `frame`: it eases between keys on a gentle arc, and holds the
// first key before it and the last key after it. Keys must be sorted by frame.
export const cursorAt = (
  keys: readonly CursorKey[],
  frame: number,
): CursorState => {
  if (keys.length === 0) {
    throw new Error("cursorAt needs at least one key");
  }

  let x = keys[0].x;
  let y = keys[0].y;
  const next = keys.findIndex((k) => k.frame > frame);
  if (next === -1) {
    x = keys[keys.length - 1].x;
    y = keys[keys.length - 1].y;
  } else if (next > 0) {
    const a = keys[next - 1];
    const b = keys[next];
    const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
      ...clamp,
      easing: ease,
    });
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Bow to the left of the direction of travel, most in the middle of the move.
    const bow = ARC * Math.sin(Math.PI * t);
    x = a.x + dx * t + dy * bow;
    y = a.y + dy * t - dx * bow;
  }

  const passed = next === -1 ? keys.length : next;
  const down = passed > 0 && Boolean(keys[passed - 1].down);

  // The frame of the last change of button state at or before `frame`.
  let changedAt: number | null = null;
  for (let i = 0; i < passed; i++) {
    const wasDown = i > 0 && Boolean(keys[i - 1].down);
    if (Boolean(keys[i].down) !== wasDown) changedAt = keys[i].frame;
  }
  const pressing =
    changedAt === null
      ? 0
      : interpolate(
          frame - changedAt,
          [0, PRESS_FRAMES],
          down ? [0, 1] : [1, 0],
          clamp,
        );

  return { x, y, down, pressing };
};

type Props = {
  readonly keys: readonly CursorKey[];
  // Show or hide the pointer, for example before it enters.
  readonly visible?: boolean;
  // Frame at which it fades in over a few frames. Leave it out to show it at once.
  readonly fadeInFrom?: number;
  // Height of the arrow in px. About 36 at 1080p.
  readonly size?: number;
};

const HEIGHT = 36;

// A macOS-style arrow pointer whose tip follows `cursorAt`, squashing slightly while pressed.
export const Cursor: React.FC<Props> = ({
  keys,
  visible = true,
  fadeInFrom,
  size = HEIGHT,
}) => {
  const frame = useCurrentFrame();
  const { x, y, pressing } = cursorAt(keys, frame);
  if (!visible) return null;

  const k = size / HEIGHT;
  return (
    <svg
      width={24 * k}
      height={HEIGHT * k}
      viewBox="0 0 24 36"
      style={{
        position: "absolute",
        left: x - 3 * k,
        top: y - 2 * k,
        overflow: "visible",
        transformOrigin: `${3 * k}px ${2 * k}px`,
        scale: String(1 - 0.12 * pressing),
        opacity:
          fadeInFrom === undefined
            ? 1
            : interpolate(frame, [fadeInFrom, fadeInFrom + 6], [0, 1], clamp),
        filter: "drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.35))",
        pointerEvents: "none",
      }}
    >
      <path
        d="M3 2 L3 29 L9.4 23 L13.6 32.6 L18.2 30.6 L14 21.2 L22.6 21.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
};
