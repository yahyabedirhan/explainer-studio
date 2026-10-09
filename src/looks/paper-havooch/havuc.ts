// Havuç, Havooch's orange tabby, redrawn by hand from the logo: big upright ears with
// peach insides, three tabby stripes on the forehead, big dark eyes with one catchlight
// each, a pink nose, a small "w" mouth and a white muzzle. The sketchbook adds a sitting
// body with a white bib, white paws and a curled tail. On paper it is a wobbly pen
// drawing; on the cocoa print it is a glowing cream outline.
import {
  clamp,
  type Ctx,
  cubic,
  ellipse,
  fill,
  hatch,
  ink,
  lerp,
  type Pt,
  quad,
} from "../../lib/sketch";
import { glow, line } from "./cocoa";
import { CARROT, HIGHLIGHT, INK, LINE, NOSE, PEACH, TABBY, WHITE } from "./theme";

// The drawing's own units: x from the middle, y = 0 at the bottom of the paws.
// The cat is about 200 wide and 330 tall at scale 1.
const join = (...parts: Pt[][]): Pt[] => {
  const out: Pt[] = [];
  for (const part of parts)
    for (const p of part) {
      const last = out[out.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
    }
  return out;
};
const seg = (a: Pt, b: Pt, n = 8): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);

// Every shape, in the drawing's units, with the head's y measured from the paws.
const H = -184; // the head and body were drawn with the paws' bottom at y = 184
const up = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, y + H]);

const HEAD = up(
  join(
    cubic([-96, -8], [-100, -40], [-92, -62], [-84, -70], 16),
    seg([-84, -70], [-80, -126]),
    quad([-80, -126], [-76, -142], [-64, -132], 8),
    seg([-64, -132], [-22, -90]),
    cubic([-22, -90], [-8, -94], [8, -94], [22, -90], 12),
    seg([22, -90], [64, -132]),
    quad([64, -132], [76, -142], [80, -126], 8),
    seg([80, -126], [84, -70]),
    cubic([84, -70], [92, -62], [100, -40], [96, -8], 16),
    cubic([96, -8], [92, 52], [50, 78], [0, 78], 24),
    cubic([0, 78], [-50, 78], [-92, 52], [-96, -8], 24),
  ),
);
const EAR_L = up([[-72, -84], [-70, -118], [-38, -90]]);
const EAR_R = up([[72, -84], [70, -118], [38, -90]]);
const STRIPES: Pt[][] = [
  up([[-24, -72], [-17, -56]]),
  up([[0, -76], [0, -59]]),
  up([[24, -72], [17, -56]]),
];
const MUZZLE = up(
  join(
    quad([-7, -44], [0, -50], [7, -44], 6),
    seg([7, -44], [11, -2]),
    cubic([11, -2], [28, 18], [60, 10], [70, 30], 14),
    cubic([70, 30], [76, 52], [48, 72], [0, 74], 16),
    cubic([0, 74], [-48, 72], [-76, 52], [-70, 30], 16),
    cubic([-70, 30], [-60, 10], [-28, 18], [-11, -2], 14),
    seg([-11, -2], [-7, -44]),
  ),
);
const NOSE_SHAPE = up(join(quad([-9, 20], [0, 16], [9, 20], 6), seg([9, 20], [2, 29], 3), quad([2, 29], [0, 31], [-2, 29], 3)));
const BODY = up(ellipse(0, 120, 62, 58, 40));
const BIB = up(join(quad([-26, 80], [0, 70], [26, 80], 10), quad([26, 80], [32, 128], [0, 152], 12), quad([0, 152], [-32, 128], [-26, 80], 12)));
const TAIL = up(cubic([48, 150], [112, 152], [124, 92], [98, 68], 24));
const PAW_L = up(ellipse(-26, 172, 20, 12, 20));
const PAW_R = up(ellipse(26, 172, 20, 12, 20));
const EYES: Pt[] = [
  [-44, 2 + H],
  [44, 2 + H],
];

export type HavucOpts = {
  boil: number;
  frame: number;
  scale?: number;
  mood?: "happy" | "calm" | "wow";
  pawUp?: number; // 0..1, the right paw raised beside the face
  squash?: number; // landing squash, 0..1
  tilt?: number; // head tilt in radians, small: about -0.15 to 0.15
  look?: number; // -1..1, the eyes' catchlights shift left or right
};

// Blinks for 3 frames every 3.5 seconds at 24 fps; `seed` staggers two cats.
const blinkOf = (frame: number, seed = 0) => ((frame + seed) % 84 < 3 ? 0.12 : 1);

const place = (pts: Pt[], cx: number, footY: number, s: number, sx: number, sy: number): Pt[] =>
  pts.map(([x, y]) => [cx + x * s * sx, footY + y * s * sy]);

// Havuç on paper. (cx, footY) is the middle of its paws on the ground.
// Returns where its raised right paw is, so it can hold things.
export const havuc = (ctx: Ctx, cx: number, footY: number, o: HavucOpts): Pt => {
  const s = o.scale ?? 1;
  const { boil, frame } = o;
  const sq = o.squash ?? 0;
  const sx = 1 + sq * 0.1;
  const sy = 1 - sq * 0.1;
  const bob = Math.sin(frame / 7) * 2.5 * s;
  const P = (pts: Pt[]) => place(pts, cx, footY, s, sx, sy);
  // The head bobs and tilts around its chin.
  const chin: Pt = [cx, footY + (78 + H) * s * sy];
  const tilt = o.tilt ?? 0;
  const headPts = (pts: Pt[]) =>
    P(pts).map(([x, y]): Pt => {
      const dx = x - chin[0];
      const dy = y - chin[1];
      return [
        chin[0] + dx * Math.cos(tilt) - dy * Math.sin(tilt),
        chin[1] + dx * Math.sin(tilt) + dy * Math.cos(tilt) + bob,
      ];
    });
  const w = (k: number) => k * s;

  // Hatched ground shadow.
  hatch(ctx, ellipse(cx, footY + 6 * s, 96 * s, 13 * s, 24), { gap: 5, alpha: 0.4, seed: 2, col: INK });

  // Tail: a thick ink stroke with the fur inside it.
  ink(ctx, P(TAIL), { w: w(24), col: INK, amp: 1, seed: 201, boil, passes: 1 });
  ink(ctx, P(TAIL), { w: w(15), col: CARROT, amp: 1, seed: 201, boil, passes: 1 });

  // Body, bib, paws.
  fill(ctx, P(BODY), CARROT, 1, 202, boil);
  ink(ctx, P(BODY), { w: w(4), col: INK, closed: true, boil, seed: 203 });
  fill(ctx, P(BIB), WHITE, 0.6, 204, boil);
  ink(ctx, P(BIB), { w: w(2.6), col: INK, closed: true, boil, seed: 205, passes: 1 });
  hatch(ctx, P(up(ellipse(34, 150, 26, 22, 20))), { gap: 6, alpha: 0.4, seed: 206, col: INK });
  for (const [paw, sd] of [
    [PAW_L, 207],
    [PAW_R, 209],
  ] as const) {
    fill(ctx, P(paw), WHITE, 0.6, sd, boil);
    ink(ctx, P(paw), { w: w(3), col: INK, closed: true, boil, seed: sd + 1, passes: 1 });
  }

  // Head.
  const head = headPts(HEAD);
  fill(ctx, head, CARROT, 1, 211, boil);
  ink(ctx, head, { w: w(4), col: INK, closed: true, boil, seed: 212 });
  for (const [ear, sd] of [
    [EAR_L, 213],
    [EAR_R, 215],
  ] as const) {
    fill(ctx, headPts(ear), PEACH, 0.6, sd, boil);
    ink(ctx, headPts(ear), { w: w(2.6), col: INK, closed: true, boil, seed: sd + 1, passes: 1 });
  }
  STRIPES.forEach((st, i) =>
    ink(ctx, headPts(st), { w: w(6), col: TABBY, amp: 0.5, seed: 217 + i, boil, passes: 1 }),
  );
  const muzzle = headPts(MUZZLE);
  fill(ctx, muzzle, WHITE, 0.6, 221, boil);
  ink(ctx, muzzle, { w: w(2.6), col: INK, closed: true, boil, seed: 222, passes: 1 });
  hatch(ctx, headPts(up(ellipse(70, 40, 18, 16, 16))), { gap: 6, alpha: 0.45, seed: 223, col: INK });

  // Eyes: big and dark, with one catchlight each.
  const blink = blinkOf(frame);
  const look = clamp(o.look ?? 0, -1, 1);
  EYES.forEach(([ex, ey], i) => {
    const [px, py] = headPts([[ex, ey]])[0];
    fill(ctx, ellipse(px, py, 22 * s, 22 * s * blink, 24), INK);
    if (blink > 0.5)
      fill(ctx, ellipse(px + (7 + look * 6) * s, py - 8 * s, 6.5 * s, 6.5 * s, 12), WHITE);
    else ink(ctx, [[px - 22 * s, py], [px + 22 * s, py]], { w: w(3), col: INK, seed: 224 + i, passes: 1 });
  });

  // Nose and mouth.
  const nose = headPts(NOSE_SHAPE);
  fill(ctx, nose, NOSE, 0.3, 226, boil);
  ink(ctx, nose, { w: w(2), col: INK, closed: true, boil, seed: 227, passes: 1, amp: 0.6 });
  const mood = o.mood ?? "happy";
  if (mood === "wow") {
    const [mx, my] = headPts([[0, 42 + H]])[0];
    fill(ctx, ellipse(mx, my, 6 * s, 8 * s, 16), INK);
  } else {
    ink(ctx, headPts(up(seg([0, 30], [0, 36], 2))), { w: w(2.6), col: INK, seed: 228, boil, passes: 1, amp: 0.4 });
    const deep = mood === "happy" ? 43 : 39;
    ink(ctx, headPts(up(join(quad([-13, 35], [-7, deep], [0, 36], 8), quad([0, 36], [7, deep], [13, 35], 8)))), {
      w: w(2.6),
      col: INK,
      seed: 229,
      boil,
      passes: 1,
      amp: 0.4,
    });
  }

  // The raised right paw, drawn over the cheek.
  const k = clamp(o.pawUp ?? 0);
  const pawX = lerp(54, 80, k);
  const pawY = lerp(122, 44, k);
  const [ppx, ppy] = P(up([[pawX, pawY]]))[0];
  if (k > 0.05) {
    const angle = lerp(0.2, 0.9, k);
    const arm = ellipse(0, 0, 16 * s, 30 * s, 20).map(([x, y]): Pt => [
      ppx + x * Math.cos(angle) - y * Math.sin(angle),
      ppy + x * Math.sin(angle) + y * Math.cos(angle),
    ]);
    fill(ctx, arm, CARROT, 0.8, 231, boil);
    ink(ctx, arm, { w: w(3.6), col: INK, closed: true, boil, seed: 232, passes: 1 });
  }
  return [ppx + 14 * s, ppy - 22 * s];
};

// Havuç on the cocoa print: a glowing cream outline, centred on (cx, cy).
export const havucOutline = (ctx: Ctx, cx: number, cy: number, s: number, frame: number) => {
  const bob = Math.sin(frame / 6) * 3;
  // Centre the drawing: it spans y from about -326 to 0 in its own units.
  const P = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [cx + x * s, cy + (y + 163) * s + bob]);
  const blink = blinkOf(frame, 30);
  // An outline has no fill to hide what is behind it, so each part is clipped
  // outside the parts in front of it: the tail outside the body, the body outside the head.
  const behind = (front: Pt[][], draw: () => void) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const shape of front) {
      shape.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    }
    ctx.clip("evenodd");
    draw();
    ctx.restore();
  };
  glow(ctx, CARROT, 14, () => {
    const o = { w: 3, col: LINE };
    const close = (pts: Pt[]) => pts.concat([pts[0]]);
    behind([P(BODY), P(HEAD)], () => line(ctx, P(TAIL), o));
    behind([P(HEAD), P(PAW_L), P(PAW_R)], () => {
      line(ctx, close(P(BODY)), o);
      line(ctx, close(P(BIB)), { w: 2, col: LINE, alpha: 0.7 });
    });
    for (const paw of [PAW_L, PAW_R]) line(ctx, close(P(paw)), o);
    line(ctx, close(P(HEAD)), o);
    for (const ear of [EAR_L, EAR_R]) line(ctx, P(ear).concat([P(ear)[0]]), { w: 2, col: LINE, alpha: 0.7 });
    line(ctx, P(MUZZLE).concat([P(MUZZLE)[0]]), { w: 2, col: LINE, alpha: 0.7 });
    for (const st of STRIPES) line(ctx, P(st), { w: 4, col: CARROT });
    for (const [ex, ey] of EYES) {
      const [px, py] = P([[ex, ey]])[0];
      line(ctx, ellipse(px, py, 22 * s, 22 * s * blink, 32).concat([[px + 22 * s, py]]), o);
    }
    const nose = P(NOSE_SHAPE);
    line(ctx, nose.concat([nose[0]]), { w: 2.5, col: HIGHLIGHT });
    line(ctx, P(up(join(quad([-13, 35], [-7, 43], [0, 36], 8), quad([0, 36], [7, 43], [13, 35], 8)))), { w: 2, col: LINE });
  });
};
