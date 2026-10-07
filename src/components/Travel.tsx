import { Easing, interpolate, useCurrentFrame } from "remotion";

export type Point = { readonly x: number; readonly y: number };
// Start, first control, second control, end.
export type BezierPath = readonly [Point, Point, Point, Point];

// The point at `t` (0 to 1) on a cubic Bézier, and the direction of travel there in degrees.
export const pointOnPath = (
  path: BezierPath,
  t: number,
): { x: number; y: number; angle: number } => {
  const [p0, p1, p2, p3] = path;
  const u = 1 - t;
  const x =
    u * u * u * p0.x +
    3 * u * u * t * p1.x +
    3 * u * t * t * p2.x +
    t * t * t * p3.x;
  const y =
    u * u * u * p0.y +
    3 * u * u * t * p1.y +
    3 * u * t * t * p2.y +
    t * t * t * p3.y;
  const dx =
    3 * u * u * (p1.x - p0.x) +
    6 * u * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const dy =
    3 * u * u * (p1.y - p0.y) +
    6 * u * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);
  const angle = dx === 0 && dy === 0 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angle };
};

type Props = {
  readonly path: BezierPath;
  readonly from: number;
  readonly to: number;
  readonly easing?: (t: number) => number;
  // Turn the child to follow the path's direction.
  readonly rotate?: boolean;
  readonly children: React.ReactNode;
};

// Carries its children, centred on the path, along a cubic Bézier between two frames.
export const Travel: React.FC<Props> = ({
  path,
  from,
  to,
  easing = Easing.bezier(0.45, 0, 0.2, 1),
  rotate = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  const { x, y, angle } = pointOnPath(path, t);

  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <div
        style={{
          translate: "-50% -50%",
          rotate: rotate ? `${angle}deg` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
