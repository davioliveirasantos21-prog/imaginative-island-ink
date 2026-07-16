/**
 * Default pixel art for the "held tool" pose (axe, hoe, spear, pickaxe).
 *
 * Two responsibilities:
 *
 * 1. `drawHeldTool` — the exact same pixel-perfect drawing the game renders
 *    on the character's front hand when a tool slot is selected. Extracted
 *    here so both `game.tsx` (at runtime) and the admin editor (to capture
 *    a starting snapshot) share one source of truth.
 *
 * 2. `captureHeldDefaultPixels` — runs `drawHeldTool` onto an offscreen
 *    canvas and returns a sparse ItemPixels map, so the "Segurado" editor
 *    opens pre-populated with the current hardcoded art. Editing then
 *    just modifies that snapshot.
 */

import type { ItemPixels } from "@/lib/items";

export type HeldToolKind = "spear" | "axe" | "hoe" | "pick" | "copperPick" | "copperHammer";

/** Grid used for held-tool overrides. Wide enough for the axe wedge + pick
 *  head, tall enough to include the full spear (tip crown at ty-7 above the
 *  hand and the bottom of the shaft below it). */
export const HELD_GRID_W = 16;
export const HELD_GRID_H = 40;

/** Where the front hand sits inside the held-grid. The runtime renderer
 *  aligns this pixel with the character's actual hand position. */
export const HELD_ANCHOR = { x: 5, y: 32 } as const;

function shadeHex(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(f(r))}${to(f(g))}${to(f(b))}`;
}

/**
 * Draw the same held-tool artwork the game currently uses onto `ctx`, with
 * the front hand centered on (handX, handY). `dir === 1` means the character
 * faces right; `dir === -1` faces left (mirrors the layout, matching what
 * the runtime does with `facing`).
 */
export function drawHeldTool(
  ctx: CanvasRenderingContext2D,
  kind: HeldToolKind,
  handX: number,
  handY: number,
  dir: 1 | -1,
  skin: string,
) {
  const facing = dir === 1 ? 1 : 0;
  const spriteY = handY - 19;
  const shaftTop = spriteY - (kind === "spear" ? 6 : 2);
  const shaftBottom = spriteY + 27;
  const sx = handX + (facing === 1 ? 0 : 1);

  // Wood shaft
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(sx, shaftTop, 2, shaftBottom - shaftTop);
  ctx.fillStyle = "#a06a34";
  ctx.fillRect(sx, shaftTop, 1, shaftBottom - shaftTop);
  ctx.fillStyle = "#5f3a1c";
  ctx.fillRect(sx + 1, shaftTop, 1, shaftBottom - shaftTop);
  // Rope grip wrap where the hand holds it
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(sx, handY - 1, 2, 1);
  ctx.fillRect(sx, handY + 1, 2, 1);
  ctx.fillRect(sx, handY + 3, 2, 1);

  // Front hand overlay so the fist appears wrapped around the shaft
  const skinShadow = shadeHex(skin, -0.3);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(handX - (facing === 1 ? 1 : 0), handY, 3, 3);
  ctx.fillStyle = skin;
  ctx.fillRect(handX - (facing === 1 ? 1 : 0), handY, 3, 2);

  if (kind === "spear") {
    const tipCx = sx;
    const ty = shaftTop;
    ctx.fillStyle = "#4a3010";
    ctx.fillRect(sx - 1, ty + 1, 4, 1);
    ctx.fillRect(sx, ty + 3, 2, 1);
    ctx.fillStyle = "#5a5a64";
    ctx.fillRect(tipCx - 1, ty - 1, 4, 2);
    ctx.fillRect(tipCx, ty - 3, 2, 2);
    ctx.fillRect(tipCx, ty - 5, 2, 2);
    ctx.fillRect(tipCx, ty - 6, 2, 1);
    ctx.fillStyle = "#8a8a94";
    ctx.fillRect(tipCx, ty - 1, 1, 1);
    ctx.fillRect(tipCx, ty - 3, 1, 1);
    ctx.fillRect(tipCx, ty - 5, 1, 1);
    ctx.fillStyle = "#c0c0ca";
    ctx.fillRect(tipCx, ty - 4, 1, 1);
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(tipCx, ty - 7, 2, 1);
    ctx.fillRect(tipCx - 1, ty + 1, 1, 1);
    ctx.fillRect(tipCx + 2, ty + 1, 1, 1);
  } else if (kind === "hoe") {
    const ty = shaftTop;
    const bx = dir === 1 ? sx + 2 : sx - 4;
    ctx.fillStyle = "#4a3010";
    ctx.fillRect(sx - 1, ty + 1, 4, 1);
    ctx.fillRect(sx - 1, ty + 3, 4, 1);
    ctx.fillStyle = "#5a5a64";
    ctx.fillRect(bx, ty - 1, 4, 5);
    ctx.fillRect(bx + (dir === 1 ? -1 : 4), ty, 1, 3);
    ctx.fillStyle = "#8a8a94";
    ctx.fillRect(bx, ty - 1, 3, 1);
    ctx.fillRect(bx, ty + 1, 2, 1);
    ctx.fillStyle = "#b8b8c2";
    ctx.fillRect(bx + 1, ty, 1, 1);
    ctx.fillStyle = "#c0c0ca";
    ctx.fillRect(bx + (dir === 1 ? 3 : 0), ty, 1, 3);
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(bx, ty + 4, 4, 1);
    ctx.fillRect(bx, ty - 2, 4, 1);
  } else if (kind === "axe") {
    const ty = shaftTop;
    const ax = dir === 1 ? sx + 1 : sx - 3;
    // Connector collar
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(sx - 1, ty + 2, 4, 1);
    // Iron head body
    ctx.fillStyle = "#5a5a64";
    ctx.fillRect(ax, ty - 1, 3, 4);
    // highlight / blade
    ctx.fillStyle = "#8a8a94";
    ctx.fillRect(ax + (dir === 1 ? 1 : 0), ty, 2, 3);
    ctx.fillStyle = "#c0c0ca";
    ctx.fillRect(ax + (dir === 1 ? 2 : -1), ty + 1, 1, 2);
    // Shadow bottom edge
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(ax, ty + 3, 3, 1);
  } else if (kind === "pick" || kind === "copperPick") {
    const ty = shaftTop;
    const copper = kind === "copperPick";
    const cBase = copper ? "#b46b3a" : "#5a5a64";
    const cMid = copper ? "#e07a3a" : "#8a8a94";
    const cHi = copper ? "#f4a46a" : "#c0c0ca";
    const cLo = copper ? "#5a2a10" : "#2a2a30";
    // shaft connector
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(sx - 1, ty + 1, 4, 1);
    // main crescent head of the pickaxe
    ctx.fillStyle = cBase;
    ctx.fillRect(sx - 3, ty - 1, 8, 2);
    ctx.fillRect(sx - 4, ty, 1, 1);
    ctx.fillRect(sx + 5, ty, 1, 1);
    // highlight/midtones
    ctx.fillStyle = cHi;
    ctx.fillRect(sx + (dir === 1 ? 5 : -4), ty, 1, 1);
    ctx.fillStyle = cMid;
    ctx.fillRect(sx - 2, ty - 1, 6, 1);
    // bottom outline
    ctx.fillStyle = cLo;
    ctx.fillRect(sx - 3, ty + 1, 8, 1);
  } else if (kind === "copperHammer") {
    const ty = shaftTop;
    const cBase = "#b46b3a";
    const cMid = "#e07a3a";
    const cHi = "#f4a46a";
    const cLo = "#5a2a10";
    // Iron collar
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(sx - 1, ty + 2, 4, 1);
    // Main hammer head block
    ctx.fillStyle = cBase;
    ctx.fillRect(sx - 3, ty - 1, 8, 3);
    // Highlights
    ctx.fillStyle = cMid;
    ctx.fillRect(sx - 3, ty - 1, 8, 1);
    ctx.fillStyle = cHi;
    ctx.fillRect(sx + (dir === 1 ? 4 : -3), ty, 1, 2);
    // Bottom shadow
    ctx.fillStyle = cLo;
    ctx.fillRect(sx - 3, ty + 2, 8, 1);
  }
}


/** Read every non-transparent pixel from `ctx` and return it as an
 *  ItemPixels sparse map keyed by "x,y" → #rrggbb. */
function readPixels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): ItemPixels {
  const out: ItemPixels = {};
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 8) continue;
      const to = (n: number) => n.toString(16).padStart(2, "0");
      out[`${x},${y}`] = `#${to(data[i])}${to(data[i + 1])}${to(data[i + 2])}`;
    }
  }
  return out;
}

/** Default skin color used when snapshotting held art in the admin editor.
 *  Matches the default character skin so the fist overlay reads naturally. */
const DEFAULT_SNAPSHOT_SKIN = "#e2b48c";

/**
 * Render the current hardcoded held-tool art into a pixel map that fits the
 * `HELD_GRID_W × HELD_GRID_H` canvas the editor uses, aligned so the front
 * hand sits at `HELD_ANCHOR`. Facing is always "right" (dir=1) — the runtime
 * mirrors overrides for the other direction automatically.
 */
export function captureHeldDefaultPixels(kind: HeldToolKind): ItemPixels {
  if (typeof document === "undefined") return {};
  const c = document.createElement("canvas");
  c.width = HELD_GRID_W;
  c.height = HELD_GRID_H;
  const ctx = c.getContext("2d");
  if (!ctx) return {};
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);
  drawHeldTool(ctx, kind, HELD_ANCHOR.x, HELD_ANCHOR.y, 1, DEFAULT_SNAPSHOT_SKIN);
  return readPixels(ctx, c.width, c.height);
}

export const HELD_TOOL_KINDS: HeldToolKind[] = ["spear", "axe", "hoe", "pick", "copperPick", "copperHammer"];

export function isHeldToolKind(kind: string): kind is HeldToolKind {
  return HELD_TOOL_KINDS.includes(kind as HeldToolKind);
}
