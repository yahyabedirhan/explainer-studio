// Drawing helpers for scenes that paint every frame on a <canvas> (see
// src/components/CanvasScene.tsx). Every function is pure: the same arguments draw the
// same marks, so a frame depends only on its number. Randomness is seeded, never Math.random.

export type Pt = [number, number];
export type Ctx = CanvasRenderingContext2D;

// ---------- numbers and time ----------

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// 0 before frame a, 1 after frame b, linear in between.
export const prog = (frame: number, a: number, b: number) =>
  b === a ? (frame >= a ? 1 : 0) : clamp((frame - a) / (b - a));

export const easeOut = (k: number) => 1 - (1 - k) ** 3;
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
// Overshoots a little and settles: a pop.
export const backOut = (k: number, s = 1.7) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;

// ---------- seeded randomness ----------

// mulberry32: a small, fast, seeded generator.
export const rng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash2 = (x: number, y: number) => {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Smooth value noise in -1..1.
export const noise2 = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (lerp(lerp(a, b, u), lerp(c, d, u), v) - 0.5) * 2;
};

// ---------- shapes as point lists ----------

export const ellipse = (cx: number, cy: number, rx: number, ry = rx, n = 48): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

export const rrect = (x: number, y: number, w: number, h: number, r: number): Pt[] => {
  const pts: Pt[] = [];
  const rr = Math.min(r, w / 2, h / 2);
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
  };
  corner(x + w - rr, y + rr, -Math.PI / 2);
  corner(x + w - rr, y + h - rr, 0);
  corner(x + rr, y + h - rr, Math.PI / 2);
  corner(x + rr, y + rr, Math.PI);
  return pts;
};

export const quad = (a: Pt, c: Pt, b: Pt, n = 32): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const k = i / n;
    return [
      (1 - k) ** 2 * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0],
      (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1],
    ];
  });

export const cubic = (a: Pt, c1: Pt, c2: Pt, b: Pt, n = 48): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const k = i / n;
    const m = 1 - k;
    return [
      m ** 3 * a[0] + 3 * m * m * k * c1[0] + 3 * m * k * k * c2[0] + k ** 3 * b[0],
      m ** 3 * a[1] + 3 * m * m * k * c1[1] + 3 * m * k * k * c2[1] + k ** 3 * b[1],
    ];
  });

// Point at fraction k along a polyline, by length.
export const along = (pts: Pt[], k: number): Pt => {
  const part = partial(pts, k);
  return part[part.length - 1] ?? pts[0];
};

// The first fraction p of a polyline, by length: a stroke being drawn on.
export const partial = (pts: Pt[], p: number): Pt[] => {
  if (p >= 1) return pts;
  if (p <= 0 || pts.length < 2) return pts.slice(0, 1);
  const lens = [0];
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const target = lens[lens.length - 1] * p;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] < target) {
      out.push(pts[i]);
      continue;
    }
    const k = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]);
    break;
  }
  return out;
};

// Evenly spaced points, so a wobble bends long edges too.
export const resample = (pts: Pt[], closed: boolean, step = 14): Pt[] => {
  const src = closed ? [...pts, pts[0]] : pts;
  const out: Pt[] = [];
  for (let i = 0; i < src.length - 1; i++) {
    const [x0, y0] = src[i];
    const [x1, y1] = src[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j < n; j++) out.push([lerp(x0, x1, j / n), lerp(y0, y1, j / n)]);
  }
  if (!closed) out.push(src[src.length - 1]);
  return out;
};

// Pen wobble: shift each point by noise along its length. `boil` changes the noise
// a few times a second, so lines shimmer like hand-drawn animation.
export const wobble = (pts: Pt[], amp: number, seed: number, boil: number, closed = false): Pt[] => {
  if (amp === 0) return pts;
  const src = resample(pts, closed);
  let s = 0;
  return src.map((p, i) => {
    if (i > 0) s += Math.hypot(p[0] - src[i - 1][0], p[1] - src[i - 1][1]);
    return [
      p[0] + noise2(s * 0.012 + seed, boil * 7.13) * amp,
      p[1] + noise2(s * 0.012 + seed + 91.7, boil * 7.13) * amp,
    ];
  });
};

// ---------- marks ----------

export const tracePath = (ctx: Ctx, pts: Pt[], closed = false) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed) ctx.closePath();
};

export type InkOpts = {
  w?: number;
  col?: string;
  closed?: boolean;
  amp?: number;
  seed?: number;
  boil?: number;
  passes?: 1 | 2;
  dash?: number[];
};

// A pen line: one full stroke and, for two passes, a thinner, fainter second stroke
// with its own wobble.
export const ink = (ctx: Ctx, pts: Pt[], o: InkOpts = {}) => {
  const { w = 3, col = "#2B2622", closed = false, amp = 1.6, seed = 1, boil = 0, passes = 2 } = o;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.lineWidth = w;
  tracePath(ctx, wobble(pts, amp, seed, boil, closed), closed);
  ctx.stroke();
  if (passes === 2) {
    ctx.globalAlpha *= 0.45;
    ctx.lineWidth = w * 0.5;
    tracePath(ctx, wobble(pts, amp * 1.3, seed + 17, boil, closed), closed);
    ctx.stroke();
  }
  ctx.restore();
};

export const fill = (ctx: Ctx, pts: Pt[], col: string, amp = 0, seed = 1, boil = 0) => {
  ctx.save();
  ctx.fillStyle = col;
  tracePath(ctx, wobble(pts, amp, seed, boil, true), true);
  ctx.fill();
  ctx.restore();
};

// Parallel pen strokes clipped to a shape: shading and shadows.
export const hatch = (
  ctx: Ctx,
  pts: Pt[],
  o: { gap?: number; angle?: number; col?: string; alpha?: number; w?: number; seed?: number } = {},
) => {
  const { gap = 7, angle = -0.9, col = "#2B2622", alpha = 0.35, w = 1.4, seed = 3 } = o;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  const r = rng(seed);
  ctx.save();
  tracePath(ctx, pts, true);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = col;
  ctx.globalAlpha *= alpha;
  ctx.lineWidth = w;
  ctx.beginPath();
  for (let y = -R; y < R; y += gap) {
    const j = (r() - 0.5) * 2;
    ctx.moveTo(-R, y + j);
    ctx.lineTo(R, y - j);
  }
  ctx.stroke();
  ctx.restore();
};

// Text typed out: the first fraction p of its characters.
export const typed = (text: string, p: number) => text.slice(0, Math.round(text.length * clamp(p)));
