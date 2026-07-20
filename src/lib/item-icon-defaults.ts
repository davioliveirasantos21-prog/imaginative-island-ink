/**
 * Capture the "current" 16×16 miniature for an item kind as an ItemPixels
 * map so the Admin Panel's item editor can open pre-populated with what the
 * game currently shows, instead of a blank canvas.
 *
 * Two sources are supported:
 *   1. If the item's hotbar icon is a PNG asset, we load the PNG and
 *      downsample it into the 16×16 grid.
 *   2. If the icon is drawn with CSS (colored squares, borders, inset
 *      highlights), we replicate the same visual by fillRect-ing into the
 *      canvas here — mirroring `SlotIcon` in `game.tsx`.
 *
 * The result is what the editor uses as its `initial` pixel map when there
 * is no admin-drawn override yet.
 */

import { ITEM_GRID, type ItemKind, type ItemPixels } from "@/lib/items";

/**
 * Baked-in default pixel maps for items whose current miniature was drawn
 * by hand in the Admin Panel and then "promoted" into code so every player
 * sees it without needing the localStorage override.
 *
 * SlotIcon uses these as a fallback when no admin override exists, and
 * `captureIconDefaultPixels` returns them so the editor opens pre-populated
 * with the current art.
 */
export const BAKED_ICON_PIXELS: Partial<Record<ItemKind, ItemPixels>> = {
  copperMetal: {"10,13":"#46464e","9,13":"#46464e","8,13":"#46464e","7,13":"#3a3a41","6,13":"#3a3a41","5,13":"#3a3a41","4,13":"#3a3a41","4,12":"#46464e","4,11":"#46464e","4,10":"#46464e","4,9":"#4a4a54","4,8":"#4a4a54","4,7":"#4a4a54","4,6":"#4a4a54","4,5":"#46464e","5,5":"#46464e","6,5":"#46464e","7,5":"#46464e","8,5":"#4a4a54","9,5":"#4a4a54","10,5":"#4a4a54","11,5":"#4a4a54","12,6":"#4a4a54","12,7":"#ffb347","12,8":"#4a4a54","12,9":"#46464e","12,10":"#46464e","12,11":"#46464e","12,12":"#46464e","12,13":"#4a4a54","11,13":"#46464e","7,12":"#46464e","6,12":"#46464e","6,11":"#ffb347","5,11":"#ffd166","5,10":"#4a4a54","5,9":"#4a4a54","6,8":"#ffb347","7,8":"#ffd166","8,8":"#4a4a54","9,9":"#4a4a54","9,10":"#ffb347","8,11":"#ffb347","7,11":"#46464e","6,9":"#4a4a54","7,9":"#4a4a54","8,9":"#4a4a54","8,10":"#ffb347","6,10":"#ffb347","7,10":"#4a4a54","5,12":"#ffb347","8,12":"#ffd166","9,12":"#ffb347","10,12":"#ffb347","11,12":"#ffd166","11,11":"#ffd166","11,10":"#ffd166","10,10":"#ffd166","10,11":"#ffd166","9,11":"#ffb347","10,9":"#46464e","10,8":"#46464e","11,8":"#4a4a54","11,9":"#46464e","9,8":"#46464e","9,7":"#4a4a54","9,6":"#4a4a54","10,6":"#ffb347","10,7":"#ffd166","11,7":"#ffb347","11,6":"#ffd166","8,6":"#46464e","7,7":"#ffb347","6,7":"#ffd166","5,8":"#4a4a54","5,7":"#ffd166","5,6":"#ffd166","6,6":"#ffd166","7,6":"#46464e","8,7":"#46464e"},
  bronzeMetal: {"10,13":"#46464e","9,13":"#46464e","8,13":"#46464e","7,13":"#3a3a41","6,13":"#3a3a41","5,13":"#3a3a41","4,13":"#3a3a41","4,12":"#46464e","4,11":"#46464e","4,10":"#46464e","4,9":"#4a4a54","4,8":"#4a4a54","4,7":"#4a4a54","4,6":"#4a4a54","4,5":"#46464e","5,5":"#46464e","6,5":"#46464e","7,5":"#46464e","8,5":"#4a4a54","9,5":"#4a4a54","10,5":"#4a4a54","11,5":"#4a4a54","12,6":"#4a4a54","12,7":"#ffb347","12,8":"#4a4a54","12,9":"#46464e","12,10":"#46464e","12,11":"#46464e","12,12":"#46464e","12,13":"#4a4a54","11,13":"#46464e","7,12":"#46464e","6,12":"#46464e","6,11":"#ffb347","5,11":"#ffd166","5,10":"#4a4a54","5,9":"#4a4a54","6,8":"#ffb347","7,8":"#ffd166","8,8":"#4a4a54","9,9":"#4a4a54","9,10":"#ffb347","8,11":"#ffb347","7,11":"#46464e","6,9":"#4a4a54","7,9":"#4a4a54","8,9":"#4a4a54","8,10":"#ffb347","6,10":"#ffb347","7,10":"#4a4a54","5,12":"#ffb347","8,12":"#ffd166","9,12":"#ffb347","10,12":"#ffb347","11,12":"#ffd166","11,11":"#ffd166","11,10":"#ffd166","10,10":"#ffd166","10,11":"#ffd166","9,11":"#ffb347","10,9":"#46464e","10,8":"#46464e","11,8":"#4a4a54","11,9":"#46464e","9,8":"#46464e","9,7":"#4a4a54","9,6":"#4a4a54","10,6":"#ffb347","10,7":"#ffd166","11,7":"#ffb347","11,6":"#ffd166","8,6":"#46464e","7,7":"#ffb347","6,7":"#ffd166","5,8":"#4a4a54","5,7":"#ffd166","5,6":"#ffd166","6,6":"#ffd166","7,6":"#46464e","8,7":"#46464e"},
  pick: {
    "1,14":"#3a2010", "2,13":"#7a4a24", "3,12":"#7a4a24", "4,11":"#7a4a24", "5,10":"#7a4a24", "6,9":"#7a4a24", "7,8":"#7a4a24", "8,7":"#7a4a24", "9,6":"#7a4a24", "10,5":"#7a4a24", "11,4":"#7a4a24", "12,3":"#3a2010",
    "8,2":"#5a5a64", "9,2":"#8a8a94", "10,2":"#c0c0ca", "11,2":"#ffffff", "12,2":"#8a8a94", "13,2":"#5a5a64",
    "7,3":"#5a5a64", "13,3":"#5a5a64",
    "6,4":"#5a5a64", "14,4":"#5a5a64"
  },
  copperPick: {
    "1,14":"#3a2010", "2,13":"#7a4a24", "3,12":"#7a4a24", "4,11":"#7a4a24", "5,10":"#7a4a24", "6,9":"#7a4a24", "7,8":"#7a4a24", "8,7":"#7a4a24", "9,6":"#7a4a24", "10,5":"#7a4a24", "11,4":"#7a4a24", "12,3":"#3a2010",
    "8,2":"#5a2a10", "9,2":"#b46b3a", "10,2":"#e07a3a", "11,2":"#f4a46a", "12,2":"#b46b3a", "13,2":"#5a2a10",
    "7,3":"#5a2a10", "13,3":"#5a2a10",
    "6,4":"#5a2a10", "14,4":"#5a2a10"
  },
  axe: {
    "1,14":"#3a2010", "2,13":"#7a4a24", "3,12":"#7a4a24", "4,11":"#7a4a24", "5,10":"#7a4a24", "6,9":"#7a4a24", "7,8":"#7a4a24", "8,7":"#7a4a24", "9,6":"#7a4a24", "10,5":"#7a4a24",
    "9,2":"#5a5a64", "10,2":"#8a8a94", "11,2":"#c0c0ca", "12,2":"#ffffff",
    "9,3":"#5a5a64", "10,3":"#8a8a94", "11,3":"#c0c0ca", "12,3":"#ffffff", "13,3":"#ffffff",
    "10,4":"#5a5a64", "11,4":"#8a8a94", "12,4":"#c0c0ca", "13,4":"#ffffff",
    "10,1":"#5a5a64", "11,1":"#5a5a64", "12,1":"#5a5a64"
  },
  spear: {
    "1,14":"#3a2010", "2,13":"#7a4a24", "3,12":"#7a4a24", "4,11":"#7a4a24", "5,10":"#7a4a24", "6,9":"#7a4a24", "7,8":"#7a4a24", "8,7":"#7a4a24", "9,6":"#7a4a24", "10,5":"#7a4a24", "11,4":"#7a4a24", "12,3":"#7a4a24", "13,2":"#7a4a24",
    "13,1":"#5a5a64", "14,1":"#8a8a94", "15,0":"#c0c0ca", "14,0":"#ffffff", "13,0":"#8a8a94", "12,1":"#5a5a64", "12,2":"#3a2010"
  },
  hoe: {
    "1,14":"#3a2010", "2,13":"#7a4a24", "3,12":"#7a4a24", "4,11":"#7a4a24", "5,10":"#7a4a24", "6,9":"#7a4a24", "7,8":"#7a4a24", "8,7":"#7a4a24", "9,6":"#7a4a24", "10,5":"#7a4a24", "11,4":"#7a4a24", "12,3":"#3a2010",
    "10,2":"#5a5a64", "11,2":"#8a8a94", "12,2":"#c0c0ca",
    "10,3":"#5a5a64", "11,3":"#8a8a94",
    "9,4":"#5a5a64", "10,4":"#5a5a64"
  }
};
import spearIconAsset from "@/assets/spear-icon.png.asset.json";
import axeIconAsset from "@/assets/axe-icon.png.asset.json";
import hoeIconAsset from "@/assets/hoe-icon.png.asset.json";
import pickIconUrl from "@/assets/pick-icon.png";
import seedIconUrl from "@/assets/seed-icon.png";
import copperPickIconAsset from "@/assets/copper-pick-icon.png.asset.json";
import torchIconAsset from "@/assets/torch-icon.png.asset.json";

const ASSET_URLS: Partial<Record<ItemKind, string>> = {
  spear: spearIconAsset.url,
  axe: axeIconAsset.url,
  hoe: hoeIconAsset.url,
  pick: pickIconUrl,
  seed: seedIconUrl,
  copperPick: copperPickIconAsset.url,
  torch: torchIconAsset.url,
};

function readCanvasPixels(ctx: CanvasRenderingContext2D): ItemPixels {
  const out: ItemPixels = {};
  const data = ctx.getImageData(0, 0, ITEM_GRID, ITEM_GRID).data;
  for (let y = 0; y < ITEM_GRID; y++) {
    for (let x = 0; x < ITEM_GRID; x++) {
      const i = (y * ITEM_GRID + x) * 4;
      if (data[i + 3] < 8) continue;
      const to = (n: number) => n.toString(16).padStart(2, "0");
      out[`${x},${y}`] = `#${to(data[i])}${to(data[i + 1])}${to(data[i + 2])}`;
    }
  }
  return out;
}

function loadImageToPixels(url: string): Promise<ItemPixels> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve({});
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = ITEM_GRID;
      c.height = ITEM_GRID;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve({});
      ctx.imageSmoothingEnabled = false;
      // Downsample the source PNG to fit the 16×16 grid while preserving
      // its aspect ratio (letterboxed).
      const scale = Math.min(ITEM_GRID / img.width, ITEM_GRID / img.height);
      const dw = Math.max(1, Math.round(img.width * scale));
      const dh = Math.max(1, Math.round(img.height * scale));
      const dx = Math.floor((ITEM_GRID - dw) / 2);
      const dy = Math.floor((ITEM_GRID - dh) / 2);
      ctx.drawImage(img, dx, dy, dw, dh);
      resolve(readCanvasPixels(ctx));
    };
    img.onerror = () => resolve({});
    img.src = url;
  });
}

// ------ Programmatic drawings that mirror SlotIcon's CSS shapes ------

type Ctx = CanvasRenderingContext2D;
const fill = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

/** 12×12 filled square centered on the 16×16 grid with a border + a bright
 *  inset highlight on the bottom/right — the same look copper/coal use. */
function drawOreSwatch(ctx: Ctx, base: string, border: string, hi: string) {
  fill(ctx, 2, 2, 12, 12, border);
  fill(ctx, 3, 3, 10, 10, base);
  // bottom + right inset highlight (matches CSS `boxShadow: inset -1px -1px 0`)
  fill(ctx, 3, 12, 10, 1, hi);
  fill(ctx, 12, 3, 1, 10, hi);
}

/** Small square gem centered — used by copperMetal / bronzeMetal. */
function drawMetalNugget(ctx: Ctx, base: string, border: string, hi: string, hi2: string) {
  fill(ctx, 4, 4, 8, 8, border);
  fill(ctx, 5, 5, 6, 6, base);
  fill(ctx, 5, 10, 6, 1, hi);
  fill(ctx, 10, 5, 1, 6, hi);
  fill(ctx, 5, 5, 6, 1, hi2);
  fill(ctx, 5, 5, 1, 6, hi2);
}

/** Wide, short bar centered — copperBar / bronzeBar. */
function drawBar(ctx: Ctx, base: string, border: string, hi: string, hi2: string) {
  fill(ctx, 2, 6, 12, 5, border);
  fill(ctx, 3, 7, 10, 3, base);
  fill(ctx, 3, 9, 10, 1, hi);
  fill(ctx, 3, 7, 10, 1, hi2);
}

function drawDefault(ctx: Ctx, kind: ItemKind): boolean {
  switch (kind) {
    case "stone":
      fill(ctx, 3, 3, 10, 10, "#4a4a54");
      fill(ctx, 4, 4, 8, 8, "#8a8a94");
      return true;
    case "wood":
      fill(ctx, 2, 4, 12, 8, "#3a2010");
      fill(ctx, 3, 5, 10, 6, "#7a4a24");
      return true;
    case "coal":
      drawOreSwatch(ctx, "#1a1416", "#000000", "#2a2226");
      return true;
    case "copper":
      // Reset to coal swatch
      drawOreSwatch(ctx, "#1a1416", "#000000", "#2a2226");
      return true;
    case "bronze":
      // Reset to coal swatch
      drawOreSwatch(ctx, "#1a1416", "#000000", "#2a2226");
      return true;
    case "iron":
      // Iron ore — same swatch shape as copper so admins can repaint it.
      drawOreSwatch(ctx, "#1a1416", "#000000", "#2a2226");
      return true;
    case "ironMetal":
      // Raw iron — mirror of copperMetal nugget, in cool gray tones.
      drawMetalNugget(ctx, "#8892a0", "#2a2f38", "#c8d0dc", "#eef0f6");
      return true;
    case "ironBar":
      // Iron bar — mirror of copperBar, in cool gray tones.
      drawBar(ctx, "#a8b0bc", "#2a2f38", "#d8dee6", "#eef1f6");
      return true;
    // Note: Old nuggets saved for future coins:
    // copperCoin: drawMetalNugget(ctx, "#c97a45", "#5a2a10", "#ffb070", "#ffd6a0");
    // bronzeCoin: drawMetalNugget(ctx, "#a88245", "#4a3418", "#e8c880", "#f4dfa0");
    // copperBar/bronzeBar are hotbar-only slot kinds, not ItemKind — no editor entry

    case "berrySeed":
      fill(ctx, 5, 5, 6, 6, "#5a1010");
      fill(ctx, 6, 6, 4, 4, "#c94b4b");
      return true;
    case "palmSeed":
      fill(ctx, 4, 5, 8, 6, "#3a220e");
      fill(ctx, 5, 6, 6, 4, "#7a5432");
      return true;
    case "mushroom":
      // stem
      fill(ctx, 7, 10, 2, 4, "#e8dbb0");
      fill(ctx, 6, 13, 4, 1, "#8a7a4a");
      // cap
      fill(ctx, 4, 5, 8, 5, "#5a1010");
      fill(ctx, 5, 5, 6, 4, "#c94b4b");
      return true;
    case "herb":
      // stem
      fill(ctx, 8, 6, 1, 8, "#2f5a24");
      // leaves
      fill(ctx, 4, 7, 3, 2, "#3a7a3a");
      fill(ctx, 10, 9, 3, 2, "#5aa84a");
      return true;
    case "copperHammer":
      // Copper hammer head + short handle
      fill(ctx, 2, 4, 12, 4, "#5a2a10");
      fill(ctx, 3, 5, 10, 2, "#b46b3a");
      fill(ctx, 3, 5, 10, 1, "#e07a3a");
      fill(ctx, 12, 5, 1, 2, "#f4a46a");
      fill(ctx, 7, 8, 2, 7, "#3a2010");
      fill(ctx, 8, 8, 1, 7, "#7a4a24");
      return true;
    default:
      return false;
  }
}

/**
 * Return the pixel map that reproduces the item's currently visible 16×16
 * miniature. Resolves to `{}` when we can't derive a default (custom item,
 * unknown kind); callers can then open the editor blank.
 */
export async function captureIconDefaultPixels(kind: ItemKind): Promise<ItemPixels> {
  if (typeof document === "undefined") return {};
  const baked = BAKED_ICON_PIXELS[kind];
  if (baked) return { ...baked };
  const assetUrl = ASSET_URLS[kind];
  if (assetUrl) return await loadImageToPixels(assetUrl);
  const c = document.createElement("canvas");
  c.width = ITEM_GRID;
  c.height = ITEM_GRID;
  const ctx = c.getContext("2d");
  if (!ctx) return {};
  ctx.imageSmoothingEnabled = false;
  if (!drawDefault(ctx, kind)) return {};
  return readCanvasPixels(ctx);
}
