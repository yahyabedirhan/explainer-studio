// Paper props, each drawn around a point with the pen line.
import {
  backOut,
  clamp,
  type Ctx,
  ellipse,
  fill,
  hatch,
  ink,
  lerp,
  type Pt,
  quad,
  rrect,
  tracePath,
} from "../../lib/sketch";
import { GOLD, INK, MONO, PAPER, SANS } from "./theme";

export const envelope = (
  ctx: Ctx,
  x: number,
  y: number,
  boil: number,
  s = 1,
) => {
  const pts = rrect(x - 36 * s, y - 24 * s, 72 * s, 48 * s, 4 * s);
  fill(ctx, pts, "#FFFDF7", 0.8, 60, boil);
  ink(ctx, pts, { w: 3.2 * s, closed: true, boil, seed: 61 });
  ink(
    ctx,
    [
      [x - 34 * s, y - 22 * s],
      [x, y + 4 * s],
      [x + 34 * s, y - 22 * s],
    ],
    { w: 2.6 * s, boil, seed: 62, passes: 1 },
  );
};

type ServerOpts = { boil: number; frame: number; awake: number };

// The sleepy server rack. (x, footY) is its left foot on the ground.
export const server = (ctx: Ctx, x: number, footY: number, o: ServerOpts) => {
  const { boil, frame } = o;
  const awake = clamp(o.awake);
  const w = 200;
  const h = 400;
  const y = footY - 18 - h;
  // Cable to the right edge.
  ink(
    ctx,
    quad([x + w - 10, footY - 40], [x + w + 40, footY + 10], [1940, footY - 4]),
    { w: 7, boil, seed: 70, passes: 1 },
  );
  hatch(ctx, ellipse(x + w / 2, footY + 4, 140, 14, 24), {
    gap: 5,
    alpha: 0.4,
    seed: 9,
  });
  for (const fx of [16, 64, 120, 168])
    fill(
      ctx,
      rrect(x + fx, footY - 22, 18, 22, 3),
      "#3B4256",
      0.8,
      71 + fx,
      boil,
    );
  const body = rrect(x, y, w, h, 18);
  fill(ctx, body, "#5B6782", 1, 72, boil);
  ctx.save();
  tracePath(ctx, body, true);
  ctx.clip();
  hatch(
    ctx,
    [
      [x + w * 0.62, y],
      [x + w, y],
      [x + w, y + h],
      [x + w * 0.62, y + h],
    ],
    { gap: 7, alpha: 0.25, seed: 10 },
  );
  ctx.restore();
  // Face screen.
  const screen = rrect(x + 24, y + 26, w - 48, 112, 14);
  fill(
    ctx,
    screen,
    lerp(0, 1, awake) > 0.5 ? "#C4D3E6" : "#B3C1D4",
    0.8,
    73,
    boil,
  );
  ink(ctx, screen, { w: 3.5, closed: true, boil, seed: 74 });
  const ey = y + 80;
  const cx = x + w / 2;
  for (const dx of [-36, 36]) {
    if (awake < 0.5) {
      ink(
        ctx,
        quad(
          [cx + dx - 12, ey - 2],
          [cx + dx, ey + 8],
          [cx + dx + 12, ey - 2],
          8,
        ),
        { w: 3.5, boil, seed: 75 + dx, passes: 1 },
      );
    } else {
      const r = lerp(6, 12, backOut(clamp((awake - 0.5) * 2)));
      fill(ctx, ellipse(cx + dx, ey, r * 0.85, r, 14), INK);
      fill(ctx, ellipse(cx + dx + 3, ey - 4, 3, 3, 8), "#FFFFFF");
    }
    fill(
      ctx,
      ellipse(cx + dx * 1.45, ey + 22, 11, 6, 14),
      "rgba(240,150,160,0.7)",
    );
  }
  ink(
    ctx,
    quad(
      [cx - 9, ey + 22],
      [cx, ey + (awake > 0.5 ? 30 : 26)],
      [cx + 9, ey + 22],
      8,
    ),
    { w: 3, boil, seed: 76, passes: 1 },
  );
  // Rack slots and lights.
  for (let i = 0; i < 6; i++) {
    const sy = y + 164 + i * 36;
    fill(ctx, rrect(x + 22, sy, w - 44, 24, 4), "#3E465C", 0.6, 80 + i, boil);
    ctx.save();
    ctx.strokeStyle = "#8A93AA";
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(x + 40 + j * 22, sy + 12);
      ctx.lineTo(x + 54 + j * 22, sy + 12);
      ctx.stroke();
    }
    ctx.restore();
    const on = awake > 0.5 && (i + Math.floor(frame / 5)) % 3 !== 0;
    fill(
      ctx,
      ellipse(x + w - 40, sy + 12, 5, 5, 10),
      on ? "#86D37E" : "#7B8399",
    );
  }
  ink(ctx, body, { w: 4.5, closed: true, boil, seed: 77 });
  // Sleep Zs drift up while it sleeps.
  if (awake < 0.5) {
    ctx.save();
    ctx.font = `600 34px ${SANS}`;
    ctx.fillStyle = INK;
    for (let i = 0; i < 3; i++) {
      const k = (((frame / 36 + i / 3) % 1) + 1) % 1;
      ctx.globalAlpha = Math.sin(k * Math.PI) * (1 - awake * 2);
      ctx.fillText("z", x + w - 10 + k * 40 + i * 6, y - 10 - k * 80);
    }
    ctx.restore();
  } else {
    // Wake-up surprise marks.
    const k = clamp((awake - 0.5) * 2);
    ctx.save();
    ctx.globalAlpha = Math.sin(k * Math.PI);
    for (const a of [-0.5, 0, 0.5]) {
      const dx = Math.sin(a) * 1;
      ink(
        ctx,
        [
          [cx + dx * 60, y - 20],
          [cx + dx * 84, y - 44],
        ],
        { w: 3.5, boil, seed: 78 + a, passes: 1 },
      );
    }
    ctx.restore();
  }
};

export const certificate = (
  ctx: Ctx,
  x: number,
  y: number,
  boil: number,
  rot = 0,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const card = rrect(-50, -36, 100, 72, 5);
  fill(ctx, card, "#FBF5E6", 0.8, 90, boil);
  ink(ctx, card, { w: 3.2, closed: true, boil, seed: 91 });
  for (let i = 0; i < 3; i++)
    ink(
      ctx,
      [
        [-36, -18 + i * 13],
        [i === 2 ? 0 : 22, -18 + i * 13],
      ],
      { w: 2.4, boil, seed: 92 + i, passes: 1 },
    );
  fill(
    ctx,
    [
      [18, 20],
      [12, 38],
      [22, 32],
      [30, 40],
      [28, 20],
    ],
    "#B8392C",
  );
  fill(ctx, ellipse(24, 16, 13, 13, 16), "#C9483A", 0.6, 96, boil);
  ink(ctx, ellipse(24, 16, 13, 13, 16), {
    w: 2.4,
    closed: true,
    boil,
    seed: 97,
    passes: 1,
  });
  ctx.restore();
};

export const key = (
  ctx: Ctx,
  x: number,
  y: number,
  boil: number,
  rot = 0,
  s = 1,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  fill(ctx, ellipse(-28, 0, 15, 15, 18), GOLD, 0.6, 100, boil);
  ink(ctx, ellipse(-28, 0, 15, 15, 18), {
    w: 3.2,
    closed: true,
    boil,
    seed: 101,
    passes: 1,
  });
  fill(ctx, ellipse(-28, 0, 5, 5, 10), PAPER);
  const shaft: Pt[] = [
    [-14, -5],
    [34, -5],
    [34, 14],
    [26, 14],
    [26, 5],
    [18, 5],
    [18, 12],
    [10, 12],
    [10, 5],
    [-14, 5],
  ];
  fill(ctx, shaft, GOLD, 0.6, 102, boil);
  ink(ctx, shaft, { w: 3, closed: true, boil, seed: 103, passes: 1 });
  ctx.restore();
};

export const padlock = (
  ctx: Ctx,
  x: number,
  y: number,
  boil: number,
  s = 1,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ink(
    ctx,
    quad([-20, -6], [-20, -52], [0, -52], 12).concat(
      quad([0, -52], [20, -52], [20, -6], 12),
    ),
    {
      w: 8,
      col: "#8C8C8C",
      boil,
      seed: 110,
      passes: 1,
    },
  );
  const b = rrect(-32, -12, 64, 50, 8);
  fill(ctx, b, GOLD, 0.8, 111, boil);
  ink(ctx, b, { w: 3.5, closed: true, boil, seed: 112 });
  fill(ctx, ellipse(0, 6, 6, 6, 12), INK);
  fill(
    ctx,
    [
      [-3, 8],
      [3, 8],
      [5, 24],
      [-5, 24],
    ],
    INK,
  );
  ctx.restore();
};

// A rounded word balloon in a mono face, for messages on the wire.
export const bubble = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  boil: number,
  rot = 0,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `500 28px ${MONO}`;
  const w = ctx.measureText(text).width + 32;
  const pill = rrect(-w / 2, -24, w, 48, 24);
  fill(ctx, pill, "#FFFDF7", 0.8, 120, boil);
  ink(ctx, pill, { w: 3, closed: true, boil, seed: 121 });
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 2);
  ctx.restore();
};
