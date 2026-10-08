// The mascot: a red tomato robot on paper, a glowing outline robot on blueprint.
import {
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
import { GOLD, INK, RED } from "./theme";
import { glow } from "./blueprint";

type MascotOpts = {
  boil: number;
  frame: number;
  scale?: number;
  mood?: "determined" | "happy" | "calm";
  armUp?: number; // 0..1, right arm raised
  squash?: number; // landing squash, 0..1
};

// The red tomato robot. (cx, footY) is the middle of its feet on the ground.
// Returns where its right hand is, so it can hold things.
export const mascot = (
  ctx: Ctx,
  cx: number,
  footY: number,
  o: MascotOpts,
): Pt => {
  const s = o.scale ?? 1;
  const { boil } = o;
  const bob = Math.sin(o.frame / 7) * 3 * s;
  const sq = o.squash ?? 0;
  const bw = 170 * s * (1 + sq * 0.12);
  const bh = 132 * s * (1 - sq * 0.12);
  const by = footY - 34 * s - bh + bob;
  const bx = cx - bw / 2;

  // Hatched ground shadow.
  hatch(ctx, ellipse(cx, footY + 6, 110 * s, 14 * s, 24), {
    gap: 5,
    alpha: 0.4,
    seed: 2,
  });

  // Feet and arms behind the body.
  fill(
    ctx,
    ellipse(cx - 32 * s, footY - 8 * s, 22 * s, 13 * s, 20),
    INK,
    1,
    31,
    boil,
  );
  fill(
    ctx,
    ellipse(cx + 32 * s, footY - 8 * s, 22 * s, 13 * s, 20),
    INK,
    1,
    32,
    boil,
  );
  const legTop = by + bh - 6 * s;
  ink(
    ctx,
    [
      [cx - 28 * s, legTop],
      [cx - 32 * s, footY - 12 * s],
    ],
    { w: 5 * s, boil, seed: 33 },
  );
  ink(
    ctx,
    [
      [cx + 28 * s, legTop],
      [cx + 32 * s, footY - 12 * s],
    ],
    { w: 5 * s, boil, seed: 34 },
  );

  const lHand: Pt = [bx - 22 * s, by + bh * 0.95];
  const up = clamp(o.armUp ?? 0);
  const rHand: Pt = [
    bx + bw + lerp(22, 30, up) * s,
    by + lerp(bh * 0.95, -bh * 0.1, up),
  ];
  ink(
    ctx,
    quad([bx + 8 * s, by + bh * 0.55], [bx - 18 * s, by + bh * 0.7], lHand),
    { w: 5 * s, boil, seed: 35 },
  );
  ink(
    ctx,
    quad(
      [bx + bw - 8 * s, by + bh * 0.55],
      [bx + bw + 18 * s, by + bh * 0.5],
      rHand,
    ),
    { w: 5 * s, boil, seed: 36 },
  );

  // Antenna.
  const top: Pt = [cx + 6 * s, by + 4 * s];
  const tip: Pt = [cx + 10 * s, by - 44 * s];
  ink(ctx, [top, tip], { w: 5 * s, boil, seed: 37 });
  fill(ctx, ellipse(tip[0], tip[1], 12 * s, 12 * s, 20), GOLD, 1, 38, boil);
  ink(ctx, ellipse(tip[0], tip[1], 12 * s, 12 * s, 20), {
    w: 3.5 * s,
    closed: true,
    boil,
    seed: 39,
    passes: 1,
  });

  // Body: fill, darker hatch toward the lower right, highlight, outline.
  const body = rrect(bx, by, bw, bh, 52 * s);
  fill(ctx, body, RED, 1.2, 40, boil);
  ctx.save();
  tracePath(ctx, body, true);
  ctx.clip();
  hatch(ctx, ellipse(bx + bw * 0.85, by + bh * 0.95, bw * 0.55, bh * 0.5, 24), {
    gap: 6,
    alpha: 0.35,
    col: "#7A2418",
    seed: 4,
  });
  ctx.restore();
  fill(
    ctx,
    rrect(bx + 22 * s, by + 18 * s, 26 * s, 20 * s, 7 * s),
    "#F6D5C8",
    0.6,
    41,
    boil,
  );
  ink(ctx, body, { w: 4.5 * s, closed: true, boil, seed: 42 });

  // Hands on top of the outline.
  for (const [i, h] of [lHand, rHand].entries()) {
    fill(ctx, ellipse(h[0], h[1], 10 * s, 10 * s, 16), RED, 0.6, 43 + i, boil);
    ink(ctx, ellipse(h[0], h[1], 10 * s, 10 * s, 16), {
      w: 3.5 * s,
      closed: true,
      boil,
      seed: 45 + i,
      passes: 1,
    });
  }

  // Face.
  const ey = by + bh * 0.47;
  const blink = o.frame % 70 > 66 ? 0.15 : 1;
  for (const dx of [-30, 30]) {
    fill(ctx, ellipse(cx + dx * s, ey, 10 * s, 13 * s * blink, 16), INK);
    if (blink === 1)
      fill(
        ctx,
        ellipse(cx + dx * s + 3 * s, ey - 5 * s, 3.5 * s, 3.5 * s, 10),
        "#FFFFFF",
      );
    fill(
      ctx,
      ellipse(cx + dx * 1.6 * s, ey + 22 * s, 13 * s, 7 * s, 16),
      "rgba(240,150,160,0.75)",
    );
  }
  const mood = o.mood ?? "determined";
  if (mood === "determined") {
    ink(
      ctx,
      [
        [cx - 46 * s, ey - 30 * s],
        [cx - 16 * s, ey - 20 * s],
      ],
      { w: 4.5 * s, boil, seed: 47, passes: 1 },
    );
    ink(
      ctx,
      [
        [cx + 46 * s, ey - 30 * s],
        [cx + 16 * s, ey - 20 * s],
      ],
      { w: 4.5 * s, boil, seed: 48, passes: 1 },
    );
    ink(
      ctx,
      [
        [cx - 8 * s, ey + 26 * s],
        [cx + 10 * s, ey + 26 * s],
      ],
      { w: 3.5 * s, boil, seed: 49, passes: 1 },
    );
  } else {
    ink(
      ctx,
      quad(
        [cx - 12 * s, ey + 22 * s],
        [cx, ey + (mood === "happy" ? 36 : 30) * s],
        [cx + 12 * s, ey + 22 * s],
        10,
      ),
      {
        w: 3.5 * s,
        boil,
        seed: 49,
        passes: 1,
      },
    );
  }
  return rHand;
};

export const robotOutline = (
  ctx: Ctx,
  cx: number,
  cy: number,
  s: number,
  frame: number,
) => {
  ctx.save();
  ctx.translate(cx, cy + Math.sin(frame / 6) * 3);
  ctx.scale(s, s);
  glow(ctx, "#9AA8FF", 14, () => {
    ctx.strokeStyle = "#E9ECFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-40, -32, 80, 62, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, -52);
    ctx.stroke();
    ctx.fillStyle = "#F07A8C";
    ctx.beginPath();
    ctx.arc(0, -56, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E9ECFF";
    for (const dx of [-14, 14]) {
      ctx.beginPath();
      ctx.ellipse(dx, -4, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 8, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    for (const dx of [-22, 22]) {
      ctx.beginPath();
      ctx.moveTo(dx * 0.6, 30);
      ctx.lineTo(dx, 46);
      ctx.stroke();
    }
  });
  ctx.restore();
};
