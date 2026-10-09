// The frame furniture every shot carries: a typed heading and a stage dial.
import { clamp, type Ctx, typed } from "../../lib/sketch";
import { CARROT, CREAM, INK, SANS, type Theme } from "./theme";

export const heading = (ctx: Ctx, text: string, p: number, theme: Theme) => {
  ctx.save();
  ctx.font = `600 40px ${SANS}`;
  ctx.fillStyle = theme === "paper" ? INK : CREAM;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(typed(text, p), 110, 116);
  ctx.strokeStyle = theme === "paper" ? CARROT : CREAM;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(110, 134);
  ctx.lineTo(110 + 136 * clamp(p * 1.4), 134);
  ctx.stroke();
  ctx.restore();
};

// Stage dial, top right: a ring that fills as the chapter goes on.
export const dial = (ctx: Ctx, label: string, k: number, theme: Theme) => {
  const cx = 1760;
  const cy = 115;
  const fg = theme === "paper" ? INK : CREAM;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = fg;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(k));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = CARROT;
  ctx.beginPath();
  ctx.roundRect(cx - 8, cy - 8, 16, 16, 3);
  ctx.fill();
  ctx.font = `500 26px ${SANS}`;
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + 82);
  ctx.restore();
};

export const label = (
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  p: number,
  col = INK,
  size = 26,
) => {
  ctx.save();
  ctx.font = `500 ${size}px ${SANS}`;
  ctx.fillStyle = col;
  ctx.textAlign = "center";
  ctx.fillText(typed(text, p), x, y);
  ctx.restore();
};
