// Blueprint look: navy grid, glowing lines, ticked ring nodes and sparkles.
import {
  backOut,
  clamp,
  type Ctx,
  ellipse,
  type Pt,
  tracePath,
} from "../../lib/sketch";
import { LINE } from "./theme";
import { speckles } from "./paper";

export const blueprintBg = (ctx: Ctx, w: number, h: number, frame: number) => {
  const g = ctx.createRadialGradient(
    w * 0.6,
    h * 0.52,
    80,
    w * 0.6,
    h * 0.52,
    w * 0.75,
  );
  g.addColorStop(0, "#232B63");
  g.addColorStop(1, "#0E1232");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.strokeStyle = LINE;
  for (let x = 0; x <= w; x += 40) {
    ctx.globalAlpha = x % 200 === 0 ? 0.08 : 0.035;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.globalAlpha = y % 200 === 0 ? 0.08 : 0.035;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // Slowly turning concentric rings.
  ctx.globalAlpha = 0.07;
  for (let r = 260; r < 1000; r += 130) {
    ctx.beginPath();
    ctx.arc(w * 0.6, h * 0.55, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12;
  ctx.setLineDash([2, 14]);
  ctx.lineDashOffset = -frame * 0.4;
  ctx.beginPath();
  ctx.arc(w * 0.6, h * 0.55, 450, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Rulers and corner brackets.
  ctx.globalAlpha = 0.25;
  for (let y = 60; y < h - 40; y += 20) {
    ctx.beginPath();
    ctx.moveTo(48, y);
    ctx.lineTo(y % 100 === 0 ? 62 : 55, y);
    ctx.stroke();
  }
  for (let x = 180; x < w - 180; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, h - 38);
    ctx.lineTo(x, x % 100 === 0 ? h - 50 : h - 44);
    ctx.stroke();
  }
  const bracket = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 22);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 22, y);
    ctx.stroke();
  };
  bracket(34, 34, 1, 1);
  bracket(w - 34, 34, -1, 1);
  bracket(34, h - 34, 1, -1);
  bracket(w - 34, h - 34, -1, -1);
  ctx.restore();
  speckles(ctx, w, h, 23, "#000000", "#9AA6FF");
};

export const glow = (ctx: Ctx, col: string, blur: number, draw: () => void) => {
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
};

export const line = (
  ctx: Ctx,
  pts: Pt[],
  o: {
    w?: number;
    col?: string;
    alpha?: number;
    dash?: number[];
    offset?: number;
  } = {},
) => {
  ctx.save();
  ctx.strokeStyle = o.col ?? LINE;
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.lineWidth = o.w ?? 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (o.dash) ctx.setLineDash(o.dash);
  if (o.offset) ctx.lineDashOffset = o.offset;
  tracePath(ctx, pts);
  ctx.stroke();
  ctx.restore();
};

// A four-point star with a glow: the travelling "head" of a request.
export const sparkle = (
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  frame: number,
) => {
  const r = s * (1 + 0.15 * Math.sin(frame / 2));
  glow(ctx, "#FFFFFF", 24, () => {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + frame * 0.03;
      const rr = i % 2 ? r * 0.18 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  });
};

// A ticked ring node; `inner` draws its icon at (cx, cy).
export const node = (
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  p: number,
  frame: number,
  inner: () => void,
) => {
  if (p <= 0) return;
  const k = backOut(clamp(p));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = clamp(p * 2);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
  g.addColorStop(0, "rgba(120,140,255,0.22)");
  g.addColorStop(1, "rgba(120,140,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  line(ctx, ellipse(cx, cy, r, r, 64).concat([[cx + r, cy]]), { w: 2.5 });
  line(
    ctx,
    ellipse(cx, cy, r * 0.82, r * 0.82, 64).concat([[cx + r * 0.82, cy]]),
    { w: 1.5, alpha: 0.6 },
  );
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + frame * 0.01;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6));
    ctx.lineTo(
      cx + Math.cos(a) * (r + (i % 5 ? 12 : 18)),
      cy + Math.sin(a) * (r + (i % 5 ? 12 : 18)),
    );
    ctx.stroke();
  }
  inner();
  ctx.restore();
};

export const hexes = (ctx: Ctx, cx: number, cy: number, r: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = LINE;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  const s = 14;
  for (let row = -6; row <= 6; row++) {
    for (let col = -6; col <= 6; col++) {
      const hx = cx + col * s * 1.75 + (row % 2 ? s * 0.87 : 0);
      const hy = cy + row * s * 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        ctx.lineTo(hx + Math.cos(a) * s, hy + Math.sin(a) * s);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
};

export const book = (ctx: Ctx, cx: number, cy: number) => {
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cx - 26, cy - 34, 52, 68, 6);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 18 + i * 9);
    ctx.lineTo(cx + 14, cy - 18 + i * 9);
    ctx.globalAlpha = i === 2 ? 1 : 0.5;
    ctx.strokeStyle = i === 2 ? "#7FE0D2" : LINE;
    ctx.stroke();
  }
  ctx.restore();
};

// The mascot again, as a glowing outline robot.
