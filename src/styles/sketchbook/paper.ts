// Paper look: cream paper, diagonal stripes, a pen-drawn ground and drafting guides.
import { type Ctx, ellipse, fill, ink, rng } from "../../lib/sketch";
import { INK, PAPER, STRIPE_BLUE } from "./theme";

export const speckles = (
  ctx: Ctx,
  w: number,
  h: number,
  seed: number,
  dark: string,
  light: string,
) => {
  const r = rng(seed);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() < 0.5 ? dark : light;
    ctx.globalAlpha = 0.05 + r() * 0.08;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.globalAlpha = 1;
};

export const paperBg = (
  ctx: Ctx,
  w: number,
  h: number,
  stripe = STRIPE_BLUE,
) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  // Broad diagonal stripes with slightly ragged edges.
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(0.6);
  ctx.fillStyle = stripe;
  ctx.globalAlpha = 0.85;
  for (let x = -1600; x < 1600; x += 300) {
    fill(
      ctx,
      [
        [x, -1400],
        [x + 150, -1400],
        [x + 150, 1400],
        [x, 1400],
      ],
      stripe,
      2.5,
      x,
      0,
    );
  }
  ctx.restore();
  speckles(ctx, w, h, 11, "#5B4B3A", "#FFFFFF");
};

// A faint construction circle and crosshair behind the action, like a drafting guide.
export const guides = (
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  col = INK,
  alpha = 0.16,
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ink(ctx, ellipse(cx, cy, r, r, 96), {
    w: 1.4,
    col,
    closed: true,
    amp: 0,
    passes: 1,
  });
  ink(ctx, ellipse(cx, cy, r + 14, r + 14, 96), {
    w: 1,
    col,
    closed: true,
    amp: 0,
    passes: 1,
    dash: [6, 10],
  });
  ink(
    ctx,
    [
      [cx - r - 60, cy],
      [cx + r + 60, cy],
    ],
    { w: 1, col, amp: 0, passes: 1 },
  );
  ink(
    ctx,
    [
      [cx, cy - r - 60],
      [cx, cy + r + 60],
    ],
    { w: 1, col, amp: 0, passes: 1 },
  );
  ctx.restore();
};

export const ground = (ctx: Ctx, w: number, y: number, boil: number) => {
  ink(
    ctx,
    [
      [-20, y],
      [w + 20, y],
    ],
    { w: 2.6, amp: 1.2, seed: 5, boil },
  );
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    if (r() < 0.5) {
      // A grass tuft.
      ctx.save();
      ctx.globalAlpha = 0.8;
      ink(
        ctx,
        [
          [x, y],
          [x - 6, y - 12],
        ],
        { w: 2, col: "#6E9A5A", amp: 0.6, seed: i, boil, passes: 1 },
      );
      ink(
        ctx,
        [
          [x + 4, y],
          [x + 6, y - 14],
        ],
        { w: 2, col: "#6E9A5A", amp: 0.6, seed: i + 3, boil, passes: 1 },
      );
      ctx.restore();
    } else {
      fill(
        ctx,
        ellipse(x, y + 10 + r() * 14, 3 + r() * 3, 2 + r() * 2, 10),
        "#A99C87",
      );
    }
  }
};
