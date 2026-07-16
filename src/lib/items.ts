/**
 * Custom pixel art for hotbar items (tools + resources).
 *
 * Each item has TWO independent art variants:
 *   - `icon`: shown in the hotbar, crafting menu and anywhere the item icon
 *     appears in the UI.
 *   - `held`: painted on top of the character's front hand while the item
 *     slot is selected (replaces the default hardcoded shaft/head drawing).
 *
 * Admins can repaint either variant per item via the Admin Panel. Overrides
 * are stored in localStorage and re-render reactively.
 */

export type ItemKind =
  | "stone"
  | "wood"
  | "seed"
  | "axe"
  | "hoe"
  | "pick"
  | "copperPick"
  | "copperHammer"
  | "spear"
  | "berrySeed"
  | "palmSeed"
  | "mushroom"
  | "herb"
  | "coal"
  | "copper"
  | "bronze"
  | "copperMetal"
  | "bronzeMetal"
  | "torch";

export const ITEM_KINDS: ItemKind[] = [
  "stone",
  "wood",
  "seed",
  "axe",
  "hoe",
  "pick",
  "copperPick",
  "copperHammer",
  "spear",
  "berrySeed",
  "palmSeed",
  "mushroom",
  "herb",
  "coal",
  "copper",
  "bronze",
  "copperMetal",
  "bronzeMetal",
  "torch",
];

/** Grid dimension for item art — matches the tile grid the game uses. */
export const ITEM_GRID = 16;

export type ItemVariant = "icon" | "held";
export const ITEM_VARIANTS: ItemVariant[] = ["icon", "held"];

export type ItemPixels = Record<string, string>; // "x,y" -> "#rrggbb" or a SKIN_* sentinel
export type ItemOverride = {
  icon?: ItemPixels;
  held?: ItemPixels;
};
export type ItemOverrides = Partial<Record<ItemKind, ItemOverride>>;

/**
 * Sentinel "colors" used inside held-item pixel maps to mean "paint this
 * pixel with the current character's skin tone". They pass `isHex` so the
 * existing storage / sanitize pipeline keeps working unchanged, but the
 * renderer swaps them for the live skin (light / mid / shadow) at draw time
 * so the hand always matches whichever skin the player picked.
 */
export const SKIN_HI = "#ff00f1";
export const SKIN_MID = "#ff00f2";
export const SKIN_LO = "#ff00f3";
export const SKIN_MARKERS: readonly string[] = [SKIN_HI, SKIN_MID, SKIN_LO];

export function isSkinMarker(c: string): boolean {
  const l = c.toLowerCase();
  return l === SKIN_HI || l === SKIN_MID || l === SKIN_LO;
}

/**
 * Resolve a stored pixel color into an actual fillStyle. Skin sentinels are
 * mapped to shaded versions of `skinBase`; every other color is returned
 * as-is. Callers that don't know the real skin can pass a preview tone
 * (e.g. the item editor).
 */
export function resolveItemPixelColor(
  color: string,
  skinBase: string,
  shade: (hex: string, amt: number) => string,
): string {
  const l = color.toLowerCase();
  if (l === SKIN_MID) return skinBase;
  if (l === SKIN_HI) return shade(skinBase, 0.18);
  if (l === SKIN_LO) return shade(skinBase, -0.3);
  return color;
}

const KEY = "item-overrides-v1";
let _cache: ItemOverrides | null = null;
let _version = 0;
const _listeners = new Set<() => void>();

function bump() {
  _version++;
  for (const l of _listeners) l();
}

function isHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

function sanitizePixels(m: unknown, maxW = ITEM_GRID, maxH = ITEM_GRID): ItemPixels {
  if (!m || typeof m !== "object") return {};
  const out: ItemPixels = {};
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v !== "string" || !isHex(v)) continue;
    const [xs, ys] = k.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || x >= maxW || y < 0 || y >= maxH) continue;
    out[`${x},${y}`] = v;
  }
  return out;
}

/** Grid dimensions per variant — icon is the hotbar sprite, held is the
 *  larger canvas that fits the tool head + full shaft on the character. */
export function getVariantGrid(variant: ItemVariant): { w: number; h: number } {
  if (variant === "held") return { w: 16, h: 40 };
  return { w: ITEM_GRID, h: ITEM_GRID };
}

function sanitizePixelsForVariant(m: unknown, variant: ItemVariant): ItemPixels {
  const g = getVariantGrid(variant);
  return sanitizePixels(m, g.w, g.h);
}

function sanitizeOverride(v: unknown): ItemOverride {
  if (!v || typeof v !== "object") return {};
  const raw = v as { icon?: unknown; held?: unknown; pixels?: unknown };
  const out: ItemOverride = {};
  // Legacy shape: a single { pixels } field applied to both icon + held.
  if (raw.pixels && !raw.icon && !raw.held) {
    const legacyIcon = sanitizePixelsForVariant(raw.pixels, "icon");
    if (Object.keys(legacyIcon).length > 0) out.icon = legacyIcon;
    return out;
  }
  if (raw.icon) {
    const p = sanitizePixelsForVariant(raw.icon, "icon");
    if (Object.keys(p).length > 0) out.icon = p;
  }
  if (raw.held) {
    const p = sanitizePixelsForVariant(raw.held, "held");
    if (Object.keys(p).length > 0) out.held = p;
  }
  return out;
}

const DEFAULT_ITEM_OVERRIDES: ItemOverrides = {
  stone: {
    icon: {"5,4":"#2a2a2a","6,4":"#2a2a2a","7,4":"#2a2a2a","8,4":"#2a2a2a","9,4":"#2a2a2a","5,5":"#2a2a2a","6,5":"#474747","7,5":"#4a4a54","8,5":"#4a4a54","9,5":"#4a4a54","10,5":"#2a2a2a","11,5":"#2a2a2a","3,6":"#2a2a2a","4,6":"#2a2a2a","5,6":"#474747","6,6":"#474747","7,6":"#4a4a54","8,6":"#4a4a54","9,6":"#4a4a54","10,6":"#4a4a54","11,6":"#2a2a2a","3,7":"#2a2a2a","4,7":"#474747","5,7":"#474747","6,7":"#474747","7,7":"#4a4a54","8,7":"#4a4a54","9,7":"#4a4a54","10,7":"#4a4a54","11,7":"#2a2a2a","12,7":"#2a2a2a","3,8":"#2a2a2a","4,8":"#474747","5,8":"#474747","6,8":"#474747","7,8":"#4a4a54","8,8":"#4a4a54","9,8":"#4a4a54","10,8":"#4a4a54","11,8":"#4a4a54","12,8":"#2a2a2a","3,9":"#2a2a2a","4,9":"#474747","5,9":"#474747","6,9":"#474747","7,9":"#4a4a54","8,9":"#4a4a54","9,9":"#4a4a54","10,9":"#4a4a54","11,9":"#4a4a54","12,9":"#2a2a2a","3,10":"#2a2a2a","4,10":"#474747","5,10":"#474747","6,10":"#474747","7,10":"#474747","8,10":"#474747","9,10":"#4a4a54","10,10":"#4a4a54","11,10":"#4a4a54","12,10":"#2a2a2a","3,11":"#2a2a2a","4,11":"#474747","5,11":"#474747","6,11":"#474747","7,11":"#474747","8,11":"#474747","9,11":"#474747","10,11":"#474747","11,11":"#4a4a54","12,11":"#2a2a2a","4,12":"#2a2a2a","5,12":"#2a2a2a","6,12":"#2a2a2a","7,12":"#2a2a2a","8,12":"#2a2a2a","9,12":"#2a2a2a","10,12":"#2a2a2a","11,12":"#2a2a2a","4,5":"#2a2a2a"},
    held: {"6,24":"#ff00f2","7,24":"#ff00f2","8,24":"#ff00f2","6,23":"#ff00f2","7,23":"#ff00f2","8,23":"#ff00f2","5,24":"#2a2a2a","5,23":"#2a2a2a","9,24":"#2a2a2a","8,21":"#2a2a2a","7,21":"#2a2a2a","6,21":"#2a2a2a","5,22":"#2a2a2a","6,22":"#2a2a2a","7,22":"#2a2a2a","8,22":"#2a2a2a","9,23":"#2a2a2a","9,22":"#2a2a2a"}
  },
  herb: {
    icon: {"8,8":"#2f5a24","4,9":"#3a7a3a","5,9":"#3a7a3a","6,9":"#3a7a3a","8,9":"#2f5a24","4,10":"#3a7a3a","5,10":"#3a7a3a","6,10":"#2f5a24","8,10":"#2f5a24","8,11":"#2f5a24","10,11":"#5aa84a","11,11":"#5aa84a","12,11":"#5aa84a","8,12":"#2f5a24","10,12":"#5aa84a","11,12":"#5aa84a","12,12":"#5aa84a","8,13":"#2f5a24","8,14":"#2f5a24","8,15":"#2f5a24","7,10":"#2f5a24","9,12":"#2f5a24","9,7":"#e8e8ee","8,7":"#e8e8ee","7,7":"#e8e8ee","7,6":"#e8e8ee","7,5":"#e8e8ee","8,5":"#e8e8ee","9,5":"#e8e8ee","9,6":"#e8e8ee","8,6":"#ffd166"}
  },
  coal: {
    icon: {"3,5":"#000000","4,5":"#000000","5,5":"#1a1416","6,5":"#1a1416","7,5":"#1a1416","2,6":"#000000","3,6":"#000000","4,6":"#1a1416","5,6":"#1a1416","6,6":"#1a1416","7,6":"#1a1416","8,6":"#1a1416","2,7":"#000000","3,7":"#1a1416","4,7":"#1a1416","5,7":"#1a1416","6,7":"#1a1416","7,7":"#1a1416","8,7":"#1a1416","9,7":"#1a1416","2,8":"#000000","3,8":"#1a1416","4,8":"#1a1416","5,8":"#1a1416","6,8":"#1a1416","7,8":"#1a1416","8,8":"#1a1416","9,8":"#1a1416","10,8":"#2a2226","2,9":"#000000","3,9":"#1a1416","4,9":"#1a1416","5,9":"#1a1416","6,9":"#1a1416","7,9":"#1a1416","8,9":"#1a1416","9,9":"#1a1416","10,9":"#2a2226","11,9":"#000000","2,10":"#000000","3,10":"#000000","4,10":"#2a2226","5,10":"#2a2226","6,10":"#2a2226","7,10":"#1a1416","8,10":"#1a1416","9,10":"#2a2226","10,10":"#2a2226","11,10":"#000000","3,11":"#000000","4,11":"#000000","5,11":"#2a2226","6,11":"#2a2226","7,11":"#2a2226","8,11":"#2a2226","9,11":"#2a2226","10,11":"#2a2226","11,11":"#000000","4,12":"#000000","5,12":"#000000","6,12":"#2a2226","7,12":"#2a2226","8,12":"#2a2226","9,12":"#2a2226","10,12":"#000000","11,12":"#000000","9,13":"#000000","10,13":"#000000","8,13":"#000000","7,13":"#000000","6,13":"#000000","5,13":"#000000","9,5":"#000000","8,5":"#000000","9,6":"#000000","10,6":"#000000","10,7":"#000000","11,7":"#000000","11,8":"#000000","7,4":"#000000","6,4":"#000000","5,4":"#000000","4,4":"#000000","8,4":"#000000"}
  },
  copperHammer: {
    icon: {"3,2":"#5a2a10","4,2":"#5a2a10","5,2":"#5a2a10","6,2":"#5a2a10","7,2":"#5a2a10","8,2":"#5a2a10","9,2":"#5a2a10","10,2":"#5a2a10","11,2":"#5a2a10","12,2":"#5a2a10","3,3":"#5a2a10","4,3":"#e07a3a","5,3":"#e07a3a","6,3":"#e07a3a","7,3":"#e07a3a","8,3":"#e07a3a","9,3":"#e07a3a","10,3":"#e07a3a","11,3":"#f4a46a","3,4":"#5a2a10","4,4":"#b46b3a","5,4":"#b46b3a","6,4":"#b46b3a","7,4":"#b46b3a","8,4":"#b46b3a","9,4":"#b46b3a","10,4":"#b46b3a","11,4":"#f4a46a","12,4":"#5a2a10","3,5":"#5a2a10","4,5":"#5a2a10","5,5":"#5a2a10","6,5":"#5a2a10","7,5":"#5a2a10","8,5":"#5a2a10","9,5":"#5a2a10","10,5":"#5a2a10","11,5":"#5a2a10","12,5":"#5a2a10","7,6":"#3a2010","8,6":"#7a4a24","7,7":"#3a2010","8,7":"#7a4a24","7,8":"#3a2010","8,8":"#7a4a24","7,9":"#3a2010","8,9":"#7a4a24","7,10":"#3a2010","8,10":"#7a4a24","7,11":"#3a2010","8,11":"#7a4a24","7,12":"#3a2010","8,12":"#7a4a24","12,3":"#5a2a10","8,13":"#7a4a24","8,14":"#7a4a24","7,13":"#3a2010","7,14":"#3a2010"},
    held: {"2,10":"#e07a3a","3,10":"#e07a3a","4,10":"#e07a3a","5,10":"#e07a3a","6,10":"#e07a3a","7,10":"#e07a3a","8,10":"#e07a3a","9,10":"#e07a3a","2,11":"#b46b3a","3,11":"#b46b3a","4,11":"#b46b3a","5,11":"#b46b3a","6,11":"#b46b3a","7,11":"#b46b3a","8,11":"#b46b3a","9,11":"#f4a46a","2,12":"#b46b3a","3,12":"#b46b3a","4,12":"#b46b3a","5,12":"#b46b3a","6,12":"#b46b3a","7,12":"#b46b3a","8,12":"#b46b3a","9,12":"#f4a46a","2,13":"#5a2a10","3,13":"#5a2a10","4,13":"#5a2a10","5,13":"#5a2a10","6,13":"#5a2a10","7,13":"#5a2a10","8,13":"#5a2a10","9,13":"#5a2a10","5,14":"#a06a34","6,14":"#5f3a1c","5,15":"#a06a34","6,15":"#5f3a1c","5,16":"#a06a34","6,16":"#5f3a1c","5,17":"#a06a34","6,17":"#5f3a1c","5,18":"#a06a34","6,18":"#5f3a1c","5,19":"#a06a34","6,19":"#5f3a1c","5,20":"#a06a34","6,20":"#5f3a1c","5,21":"#a06a34","6,21":"#5f3a1c","5,22":"#a06a34","6,22":"#5f3a1c","5,23":"#a06a34","6,23":"#5f3a1c","5,24":"#a06a34","6,24":"#5f3a1c","5,25":"#a06a34","6,25":"#5f3a1c","5,26":"#a06a34","6,26":"#5f3a1c","5,27":"#a06a34","6,27":"#5f3a1c","5,28":"#a06a34","6,28":"#5f3a1c","5,29":"#a06a34","6,29":"#5f3a1c","5,30":"#a06a34","6,30":"#5f3a1c","5,31":"#3a2010","6,31":"#3a2010","4,32":"#e2b48c","5,32":"#e2b48c","6,32":"#e2b48c","4,33":"#e2b48c","5,33":"#e2b48c","6,33":"#e2b48c","4,34":"#9e7e62","5,34":"#9e7e62","6,34":"#9e7e62","5,35":"#3a2010","6,35":"#3a2010","5,36":"#a06a34","6,36":"#5f3a1c","5,37":"#a06a34","6,37":"#5f3a1c","5,38":"#a06a34","6,38":"#5f3a1c","5,39":"#a06a34","6,39":"#5f3a1c"}
  },
  copper: {
    icon: {"3,5":"#4c2b20","4,5":"#4c2b20","5,5":"#7e4735","6,5":"#7e4735","7,5":"#7e4735","2,6":"#4c2b20","3,6":"#4c2b20","4,6":"#7e4735","5,6":"#7e4735","6,6":"#7e4735","7,6":"#7e4735","8,6":"#7e4735","2,7":"#4c2b20","3,7":"#7e4735","4,7":"#7e4735","5,7":"#7e4735","6,7":"#7e4735","7,7":"#7e4735","8,7":"#7e4735","9,7":"#7e4735","2,8":"#4c2b20","3,8":"#7e4735","4,8":"#7e4735","5,8":"#7e4735","6,8":"#7e4735","7,8":"#7e4735","8,8":"#7e4735","9,8":"#7e4735","10,8":"#9a4c32","2,9":"#4c2b20","3,9":"#7e4735","4,9":"#7e4735","5,9":"#7e4735","6,9":"#7e4735","7,9":"#7e4735","8,9":"#7e4735","9,9":"#7e4735","10,9":"#9a4c32","11,9":"#4c2b20","2,10":"#4c2b20","3,10":"#4c2b20","4,10":"#9a4c32","5,10":"#9a4c32","6,10":"#7e4735","7,10":"#7e4735","8,10":"#7e4735","9,10":"#9a4c32","10,10":"#9a4c32","11,10":"#4c2b20","3,11":"#4c2b20","4,11":"#4c2b20","5,11":"#9a4c32","6,11":"#9a4c32","7,11":"#9a4c32","8,11":"#9a4c32","9,11":"#9a4c32","10,11":"#9a4c32","11,11":"#4c2b20","4,12":"#4c2b20","5,12":"#4c2b20","6,12":"#9a4c32","7,12":"#9a4c32","8,12":"#9a4c32","9,12":"#9a4c32","10,12":"#4c2b20","11,12":"#4c2b20","9,13":"#4c2b20","10,13":"#4c2b20","8,13":"#4c2b20","7,13":"#4c2b20","6,13":"#4c2b20","5,13":"#4c2b20","9,5":"#4c2b20","8,5":"#4c2b20","9,6":"#4c2b20","10,6":"#4c2b20","10,7":"#4c2b20","11,7":"#4c2b20","11,8":"#4c2b20","7,4":"#4c2b20","6,4":"#4c2b20","5,4":"#4c2b20","4,4":"#4c2b20","8,4":"#4c2b20"}
  },
  bronze: {
    icon: {"3,5":"#3d2d00","4,5":"#3d2d00","5,5":"#cba552","6,5":"#cba552","7,5":"#cba552","2,6":"#3d2d00","3,6":"#3d2d00","4,6":"#cba552","5,6":"#cba552","6,6":"#cba552","7,6":"#cba552","8,6":"#cba552","2,7":"#3d2d00","3,7":"#cba552","4,7":"#cba552","5,7":"#cba552","6,7":"#cba552","7,7":"#cba552","8,7":"#cba552","9,7":"#cba552","2,8":"#3d2d00","3,8":"#cba552","4,8":"#cba552","5,8":"#cba552","6,8":"#cba552","7,8":"#cba552","8,8":"#cba552","9,8":"#cba552","10,8":"#ffe08a","2,9":"#3d2d00","3,9":"#cba552","4,9":"#cba552","5,9":"#cba552","6,9":"#cba552","7,9":"#cba552","8,9":"#cba552","9,9":"#cba552","10,9":"#ffe08a","11,9":"#3d2d00","2,10":"#3d2d00","3,10":"#3d2d00","4,10":"#ffe08a","5,10":"#ffe08a","6,10":"#ffe08a","7,10":"#cba552","8,10":"#cba552","9,10":"#ffe08a","10,10":"#ffe08a","11,10":"#3d2d00","3,11":"#3d2d00","4,11":"#3d2d00","5,11":"#ffe08a","6,11":"#ffe08a","7,11":"#ffe08a","8,11":"#ffe08a","9,11":"#ffe08a","10,11":"#ffe08a","11,11":"#3d2d00","4,12":"#3d2d00","5,12":"#3d2d00","6,12":"#ffe08a","7,12":"#ffe08a","8,12":"#ffe08a","9,12":"#ffe08a","10,12":"#3d2d00","11,12":"#3d2d00","9,13":"#3d2d00","10,13":"#3d2d00","8,13":"#3d2d00","7,13":"#3d2d00","6,13":"#3d2d00","5,13":"#3d2d00","9,5":"#3d2d00","8,5":"#3d2d00","9,6":"#3d2d00","10,6":"#3d2d00","10,7":"#3d2d00","11,7":"#3d2d00","11,8":"#3d2d00","7,4":"#3d2d00","6,4":"#3d2d00","5,4":"#3d2d00","4,4":"#3d2d00","8,4":"#3d2d00"}
  },
  copperPick: {
    icon: {"7,14":"#7a4a24","7,13":"#7a4a24","7,12":"#7a4a24","7,11":"#7a4a24","7,10":"#7a4a24","8,14":"#a06a34","8,13":"#a06a34","8,12":"#a06a34","8,11":"#a06a34","8,10":"#a06a34","7,9":"#7a4a24","8,9":"#a06a34","8,8":"#a06a34","7,8":"#3a7a3a","6,8":"#2f5a24","8,7":"#2f5a24","7,6":"#2f5a24","9,8":"#3a7a3a","7,7":"#9e4a29","6,7":"#cf6c44","6,6":"#9e4a29","5,8":"#cf6c44","4,8":"#cf6c44","3,8":"#9e4a29","3,9":"#9e4a29","4,9":"#cf6c44","4,7":"#9e4a29","5,7":"#9e4a29","5,6":"#9e4a29","8,6":"#cf6c44","9,6":"#9e4a29","9,7":"#cf6c44","10,7":"#9e4a29","10,8":"#cf6c44","11,8":"#9e4a29","11,9":"#cf6c44","12,9":"#cf6c44","12,8":"#9e4a29","11,7":"#9e4a29","10,6":"#9e4a29"},
    held: {"7,24":"#a06a34","8,24":"#5f3a1c","7,25":"#a06a34","8,25":"#5f3a1c","7,26":"#a06a34","8,26":"#5f3a1c","7,27":"#a06a34","8,27":"#5f3a1c","7,29":"#ff00f2","8,29":"#ff00f2","8,30":"#ff00f2","7,30":"#ff00f2","6,30":"#ff00f2","6,29":"#ff00f2","9,29":"#ff00f2","9,30":"#ff00f3","6,23":"#3a7a3a","7,23":"#3a7a3a","7,22":"#3a7a3a","8,22":"#2f5a24","9,23":"#2f5a24","9,21":"#3a7a3a","9,20":"#3a7a3a","6,21":"#2f5a24","7,21":"#2f5a24","6,20":"#3a7a3a","7,20":"#c37246","8,20":"#c37246","8,21":"#9a5632","9,22":"#9a5632","8,23":"#9a5632","10,21":"#c37246","11,21":"#c37246","12,22":"#c37246","13,22":"#c37246","13,23":"#9a5632","14,23":"#c37246","14,24":"#c37246","13,24":"#9a5632","12,23":"#9a5632","11,23":"#9a5632","10,23":"#9a5632","10,22":"#9a5632","11,22":"#9a5632","5,21":"#9a5632","4,21":"#c37246","3,22":"#9a5632","2,22":"#c37246","1,23":"#c37246","1,24":"#9a5632","2,24":"#9a5632","2,23":"#9a5632","3,23":"#9a5632","4,23":"#9a5632","5,23":"#9a5632","5,22":"#9a5632","4,22":"#9a5632","6,22":"#9a5632","7,28":"#a06a34","8,28":"#5f3a1c","9,31":"#ff00f3","8,31":"#ff00f3","7,31":"#ff00f3","6,31":"#ff00f3","5,30":"#ff00f2","5,31":"#ff00f2","4,31":"#ff00f2","4,30":"#ff00f2","4,29":"#ff00f2","3,31":"#ff00f2","3,30":"#ff00f2","3,29":"#ff00f2","3,28":"#ff00f2","7,32":"#a06a34","7,33":"#a06a34","7,34":"#a06a34","7,35":"#a06a34","8,32":"#5f3a1c","8,33":"#5f3a1c","8,34":"#5f3a1c","8,35":"#5f3a1c"}
  },
  pick: {
    icon: {"7,14":"#7a4a24","7,13":"#7a4a24","7,12":"#7a4a24","7,11":"#7a4a24","7,10":"#7a4a24","8,14":"#a06a34","8,13":"#a06a34","8,12":"#a06a34","8,11":"#a06a34","8,10":"#a06a34","7,9":"#7a4a24","8,9":"#a06a34","8,8":"#a06a34","7,8":"#3a7a3a","6,8":"#2f5a24","8,7":"#2f5a24","7,6":"#2f5a24","9,8":"#3a7a3a","7,7":"#4a4a54","6,7":"#8a8a94","6,6":"#4a4a54","5,8":"#8a8a94","4,8":"#4a4a54","3,8":"#4a4a54","3,9":"#8a8a94","4,9":"#8a8a94","4,7":"#4a4a54","5,7":"#4a4a54","5,6":"#4a4a54","8,6":"#8a8a94","9,6":"#4a4a54","9,7":"#8a8a94","10,7":"#4a4a54","10,8":"#8a8a94","11,8":"#4a4a54","11,9":"#8a8a94","12,9":"#8a8a94","12,8":"#4a4a54","11,7":"#4a4a54","10,6":"#4a4a54"},
    held: {"7,24":"#a06a34","8,24":"#5f3a1c","7,25":"#a06a34","8,25":"#5f3a1c","7,26":"#a06a34","8,26":"#5f3a1c","7,27":"#a06a34","8,27":"#5f3a1c","7,29":"#ff00f2","8,29":"#ff00f2","8,30":"#ff00f2","7,30":"#ff00f2","6,30":"#ff00f2","6,29":"#ff00f2","9,29":"#ff00f2","9,30":"#ff00f3","6,23":"#3a7a3a","7,23":"#3a7a3a","7,22":"#3a7a3a","8,22":"#2f5a24","9,23":"#2f5a24","9,21":"#3a7a3a","9,20":"#3a7a3a","6,21":"#2f5a24","7,21":"#2f5a24","6,20":"#3a7a3a","7,20":"#8a8a94","8,20":"#8a8a94","8,21":"#4a4a54","9,22":"#4a4a54","8,23":"#4a4a54","10,21":"#8a8a94","11,21":"#8a8a94","12,22":"#8a8a94","13,22":"#8a8a94","13,23":"#4a4a54","14,23":"#8a8a94","14,24":"#8a8a94","13,24":"#4a4a54","12,23":"#4a4a54","11,23":"#4a4a54","10,23":"#4a4a54","10,22":"#4a4a54","11,22":"#4a4a54","5,21":"#4a4a54","4,21":"#8a8a94","3,22":"#4a4a54","2,22":"#8a8a94","1,23":"#8a8a94","1,24":"#4a4a54","2,24":"#4a4a54","2,23":"#4a4a54","3,23":"#4a4a54","4,23":"#4a4a54","5,23":"#4a4a54","5,22":"#4a4a54","4,22":"#4a4a54","6,22":"#4a4a54","7,28":"#a06a34","8,28":"#5f3a1c","9,31":"#ff00f3","8,31":"#ff00f3","7,31":"#ff00f3","6,31":"#ff00f3","5,30":"#ff00f2","5,31":"#ff00f2","4,31":"#ff00f2","4,30":"#ff00f2","4,29":"#ff00f2","3,31":"#ff00f2","3,30":"#ff00f2","3,29":"#ff00f2","3,28":"#ff00f2","7,32":"#a06a34","7,33":"#a06a34","7,34":"#a06a34","7,35":"#a06a34","8,32":"#5f3a1c","8,33":"#5f3a1c","8,34":"#5f3a1c","8,35":"#5f3a1c"}
  },
  copperMetal: {
    icon: JSON.parse('{"10,13":"#46464e","9,13":"#46464e","8,13":"#46464e","7,13":"#3a3a41","6,13":"#3a3a41","5,13":"#3a3a41","4,13":"#3a3a41","4,12":"#46464e","4,11":"#46464e","4,10":"#46464e","4,9":"#4a4a54","4,8":"#4a4a54","4,7":"#4a4a54","4,6":"#4a4a54","4,5":"#46464e","5,5":"#46464e","6,5":"#46464e","7,5":"#46464e","8,5":"#4a4a54","9,5":"#4a4a54","10,5":"#4a4a54","11,5":"#4a4a54","12,6":"#4a4a54","12,7":"#c76538","12,8":"#4a4a54","12,9":"#46464e","12,10":"#46464e","12,11":"#46464e","12,12":"#46464e","12,13":"#4a4a54","11,13":"#46464e","7,12":"#46464e","6,12":"#46464e","6,11":"#c76538","5,11":"#e47644","5,10":"#4a4a54","5,9":"#4a4a54","6,8":"#c76538","7,8":"#e47644","8,8":"#4a4a54","9,9":"#4a4a54","9,10":"#c76538","8,11":"#c76538","7,11":"#46464e","6,9":"#4a4a54","7,9":"#4a4a54","8,9":"#4a4a54","8,10":"#c76538","6,10":"#e47644","7,10":"#4a4a54","5,12":"#e47644","8,12":"#e47644","9,12":"#c76538","10,12":"#c76538","11,12":"#e47644","11,11":"#e47644","11,10":"#e47644","10,10":"#e47644","10,11":"#e47644","9,11":"#c76538","10,9":"#46464e","10,8":"#46464e","11,8":"#4a4a54","11,9":"#46464e","9,8":"#46464e","9,7":"#4a4a54","9,6":"#4a4a54","10,6":"#c76538","10,7":"#e47644","11,7":"#c76538","11,6":"#e47644","8,6":"#46464e","7,7":"#c76538","6,7":"#e47644","5,8":"#4a4a54","5,7":"#e47644","5,6":"#e47644","6,6":"#4a4a54","5,7":"#e47644","5,6":"#e47644","6,6":"#e47644","7,6":"#46464e","8,7":"#46464e"}') as Record<string, string>
  },
  spear: {
    icon: {"7,14":"#7a4a24","7,13":"#a06a34","7,12":"#a06a34","7,11":"#a06a34","7,10":"#a06a34","7,9":"#a06a34","7,8":"#7a4a24","7,7":"#7a4a24","7,6":"#7a4a24","7,5":"#7a4a24","7,4":"#8a8a94","7,3":"#8a8a94","7,2":"#4a4a54","6,3":"#4a4a54","6,4":"#4a4a54"},
    held: {"5,0":"#2a2a30","6,0":"#2a2a30","5,1":"#5a5a64","6,1":"#5a5a64","5,2":"#8a8a94","6,2":"#5a5a64","5,3":"#c0c0ca","6,3":"#5a5a64","5,4":"#8a8a94","6,4":"#5a5a64","5,5":"#5a5a64","6,5":"#5a5a64","4,6":"#5a5a64","5,6":"#8a8a94","6,6":"#5a5a64","7,6":"#5a5a64","4,7":"#5a5a64","5,7":"#5a5a64","6,7":"#5a5a64","7,7":"#5a5a64","4,8":"#2a2a30","5,8":"#4a3010","6,8":"#4a3010","7,8":"#2a2a30","5,9":"#a06a34","6,9":"#5f3a1c","5,10":"#4a3010","6,10":"#4a3010","5,11":"#a06a34","6,11":"#5f3a1c","5,12":"#a06a34","6,12":"#5f3a1c","5,13":"#a06a34","6,13":"#5f3a1c","5,14":"#a06a34","6,14":"#5f3a1c","5,15":"#a06a34","6,15":"#5f3a1c","5,16":"#a06a34","6,16":"#5f3a1c","5,17":"#a06a34","6,17":"#5f3a1c","5,18":"#a06a34","6,18":"#5f3a1c","5,19":"#a06a34","6,19":"#5f3a1c","5,20":"#a06a34","6,20":"#5f3a1c","5,21":"#a06a34","6,21":"#5f3a1c","5,22":"#a06a34","6,22":"#5f3a1c","5,23":"#a06a34","6,23":"#5f3a1c","5,24":"#a06a34","6,24":"#5f3a1c","5,25":"#a06a34","6,25":"#5f3a1c","5,26":"#a06a34","6,26":"#5f3a1c","5,27":"#a06a34","6,27":"#5f3a1c","5,28":"#a06a34","6,28":"#5f3a1c","5,29":"#a06a34","6,29":"#5f3a1c","5,30":"#a06a34","6,30":"#5f3a1c","5,31":"#3a2010","6,31":"#3a2010","4,32":"#ff00f2","5,32":"#ff00f2","6,32":"#ff00f2","4,33":"#ff00f2","5,33":"#ff00f2","6,33":"#ff00f2","4,34":"#ff00f3","5,34":"#ff00f3","6,34":"#ff00f3","5,35":"#3a2010","6,35":"#3a2010","5,36":"#a06a34","6,36":"#5f3a1c","5,37":"#a06a34","6,37":"#5f3a1c","5,38":"#a06a34","6,38":"#5f3a1c","5,39":"#a06a34","6,39":"#5f3a1c"}
  },
  mushroom: {
    icon: {"4,5":"#5a1010","5,5":"#c94b4b","6,5":"#c94b4b","7,5":"#c94b4b","8,5":"#c94b4b","9,5":"#c94b4b","10,5":"#c94b4b","11,5":"#5a1010","4,6":"#5a1010","5,6":"#c94b4b","6,6":"#c94b4b","7,6":"#c94b4b","8,6":"#c94b4b","9,6":"#c94b4b","10,6":"#c94b4b","11,6":"#5a1010","4,7":"#5a1010","5,7":"#c94b4b","6,7":"#c94b4b","7,7":"#c94b4b","8,7":"#c94b4b","9,7":"#c94b4b","10,7":"#c94b4b","11,7":"#5a1010","4,8":"#5a1010","5,8":"#c94b4b","6,8":"#c94b4b","7,8":"#c94b4b","8,8":"#c94b4b","9,8":"#c94b4b","10,8":"#c94b4b","11,8":"#5a1010","4,9":"#5a1010","5,9":"#5a1010","6,9":"#5a1010","7,9":"#5a1010","8,9":"#5a1010","9,9":"#5a1010","10,9":"#5a1010","11,9":"#5a1010","7,10":"#e8dbb0","8,10":"#e8dbb0","7,11":"#e8dbb0","8,11":"#e8dbb0","7,12":"#e8dbb0","8,12":"#e8dbb0","6,13":"#8a7a4a","7,13":"#8a7a4a","8,13":"#8a7a4a","9,13":"#8a7a4a"}
  },
  hoe: {
    icon: {"7,14":"#a06a34","7,13":"#a06a34","7,12":"#a06a34","7,11":"#a06a34","7,10":"#a06a34","7,9":"#7a4a24","7,8":"#7a4a24","7,7":"#7a4a24","7,6":"#7a4a24","7,5":"#7a4a24","7,4":"#7a4a24","7,3":"#4a4a54","6,3":"#4a4a54","6,2":"#4a4a54","5,3":"#4a4a54","5,4":"#4a4a54","6,4":"#4a4a54","4,4":"#8a8a94","4,3":"#8a8a94","4,2":"#8a8a94","5,2":"#8a8a94"},
    held: {"7,9":"#2a2a30","8,9":"#2a2a30","9,9":"#2a2a30","10,9":"#2a2a30","7,10":"#8a8a94","8,10":"#8a8a94","9,10":"#8a8a94","10,10":"#5a5a64","5,11":"#a06a34","6,11":"#5a5a64","7,11":"#5a5a64","8,11":"#b8b8c2","9,11":"#5a5a64","10,11":"#c0c0ca","4,12":"#4a3010","5,12":"#4a3010","6,12":"#5a5a64","7,12":"#8a8a94","8,12":"#8a8a94","9,12":"#5a5a64","10,12":"#c0c0ca","5,13":"#a06a34","6,13":"#5a5a64","7,13":"#5a5a64","8,13":"#5a5a64","9,13":"#5a5a64","10,13":"#c0c0ca","4,14":"#4a3010","5,14":"#4a3010","6,14":"#4a3010","7,14":"#5a5a64","8,14":"#5a5a64","9,14":"#5a5a64","10,14":"#5a5a64","5,15":"#a06a34","6,15":"#5f3a1c","7,15":"#2a2a30","8,15":"#2a2a30","9,15":"#2a2a30","10,15":"#2a2a30","5,16":"#a06a34","6,16":"#5f3a1c","5,17":"#a06a34","6,17":"#5f3a1c","5,18":"#a06a34","6,18":"#5f3a1c","5,19":"#a06a34","6,19":"#5f3a1c","5,20":"#a06a34","6,20":"#5f3a1c","5,21":"#a06a34","6,21":"#5f3a1c","5,22":"#a06a34","6,22":"#5f3a1c","5,23":"#a06a34","6,23":"#5f3a1c","5,24":"#a06a34","6,24":"#5f3a1c","5,25":"#a06a34","6,25":"#5f3a1c","5,26":"#a06a34","6,26":"#5f3a1c","5,27":"#a06a34","6,27":"#5f3a1c","5,28":"#a06a34","6,28":"#5f3a1c","5,29":"#a06a34","6,29":"#5f3a1c","5,30":"#a06a34","6,30":"#5f3a1c","5,31":"#3a2010","6,31":"#3a2010","4,32":"#e2b48c","5,32":"#e2b48c","6,32":"#e2b48c","4,33":"#e2b48c","5,33":"#e2b48c","6,33":"#e2b48c","4,34":"#9e7e62","5,34":"#9e7e62","6,34":"#9e7e62","5,35":"#3a2010","6,35":"#3a2010","5,36":"#a06a34","6,36":"#5f3a1c","5,37":"#a06a34","6,37":"#5f3a1c","5,38":"#a06a34","6,38":"#5f3a1c","5,39":"#a06a34","6,39":"#5f3a1c"}
  },
  axe: {
    icon: {"7,14":"#a06a34","7,13":"#a06a34","7,12":"#7a4a24","7,11":"#7a4a24","7,10":"#7a4a24","7,9":"#7a4a24","7,8":"#7a4a24","7,7":"#7a4a24","7,6":"#a06a34","7,5":"#2f5a24","6,4":"#4a4a54","5,4":"#4a4a54","5,5":"#8a8a94","6,5":"#4a4a54","8,5":"#4a4a54","8,4":"#4a4a54","8,3":"#4a4a54","9,3":"#8a8a94","10,3":"#8a8a94","10,4":"#8a8a94","10,5":"#8a8a94","10,6":"#8a8a94","9,6":"#4a4a54","9,5":"#4a4a54","9,4":"#4a4a54","7,4":"#2f5a24","6,6":"#2f5a24"},
    held: {"6,20":"#3a7a3a","7,20":"#3a7a3a","7,21":"#a06a34","7,22":"#a06a34","8,22":"#2f5a24","7,23":"#a06a34","8,23":"#5f3a1c","7,24":"#a06a34","8,24":"#5f3a1c","7,25":"#a06a34","8,25":"#5f3a1c","7,26":"#a06a34","8,26":"#5f3a1c","7,27":"#a06a34","8,27":"#5f3a1c","7,28":"#a06a34","8,28":"#5f3a1c","7,29":"#a06a34","8,29":"#5f3a1c","7,30":"#a06a34","8,30":"#5f3a1c","7,31":"#a06a34","8,31":"#5f3a1c","7,32":"#ff00f2","8,32":"#ff00f2","7,33":"#ff00f2","8,33":"#ff00f3","7,34":"#ff00f3","8,34":"#ff00f3","7,35":"#a06a34","8,35":"#5f3a1c","7,36":"#a06a34","8,36":"#5f3a1c","6,33":"#ff00f2","6,32":"#ff00f2","6,34":"#ff00f3","9,18":"#5a5a64","10,19":"#8a8a94","11,19":"#8a8a94","11,20":"#8a8a94","11,21":"#8a8a94","10,21":"#5a5a64","9,21":"#2f5a24","8,21":"#2f5a24","8,20":"#2f5a24","8,19":"#3a7a3a","9,19":"#5a5a64","10,20":"#5a5a64","9,20":"#5a5a64","10,22":"#5a5a64","9,22":"#5a5a64","6,19":"#5a5a64","7,19":"#3a7a3a","5,20":"#5a5a64","5,19":"#5a5a64","5,18":"#5a5a64","6,18":"#2f5a24","6,21":"#3a7a3a","8,18":"#3a7a3a","5,21":"#8a8a94","4,20":"#8a8a94","4,19":"#8a8a94","10,18":"#4a4a54","11,18":"#4a4a54","12,18":"#4a4a54","12,19":"#4a4a54","12,20":"#4a4a54","5,33":"#ff00f2","4,33":"#ff00f2","5,34":"#ff00f2","4,34":"#ff00f2","3,33":"#ff00f2","3,32":"#ff00f2","4,32":"#ff00f2","3,31":"#ff00f2","3,34":"#ff00f2"}
  }
};

export function loadItemOverrides(): ItemOverrides {
  if (_cache) return _cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const out: ItemOverrides = { ...DEFAULT_ITEM_OVERRIDES };
    for (const [k, v] of Object.entries(parsed ?? {})) {
      if (!ITEM_KINDS.includes(k as ItemKind)) continue;
      const ov = sanitizeOverride(v);
      if (ov.icon || ov.held) out[k as ItemKind] = ov;
    }
    _cache = out;
    return out;
  } catch {
    _cache = { ...DEFAULT_ITEM_OVERRIDES };
    return _cache;
  }
}

export function getItemOverride(kind: ItemKind): ItemOverride | undefined {
  return loadItemOverrides()[kind];
}

export function getItemVariantPixels(
  kind: ItemKind,
  variant: ItemVariant,
): ItemPixels | undefined {
  const ov = getItemOverride(kind);
  if (!ov) return undefined;
  const p = ov[variant];
  return p && Object.keys(p).length > 0 ? p : undefined;
}

function persist(next: ItemOverrides) {
  try {
    if (Object.keys(next).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  _cache = next;
  bump();
}

export function saveItemVariant(
  kind: ItemKind,
  variant: ItemVariant,
  pixels: ItemPixels,
) {
  const all = loadItemOverrides();
  const cur = all[kind] ?? {};
  const cleaned = sanitizePixelsForVariant(pixels, variant);
  const nextForKind: ItemOverride = { ...cur, [variant]: cleaned };
  if (Object.keys(cleaned).length === 0) delete nextForKind[variant];
  const next: ItemOverrides = { ...all };
  if (nextForKind.icon || nextForKind.held) next[kind] = nextForKind;
  else delete next[kind];
  persist(next);
}

export function deleteItemVariant(kind: ItemKind, variant: ItemVariant) {
  const all = loadItemOverrides();
  const cur = all[kind];
  if (!cur) return;
  const nextForKind: ItemOverride = { ...cur };
  delete nextForKind[variant];
  const next: ItemOverrides = { ...all };
  if (nextForKind.icon || nextForKind.held) next[kind] = nextForKind;
  else delete next[kind];
  persist(next);
}

export function deleteItemOverride(kind: ItemKind) {
  const all = { ...loadItemOverrides() };
  delete all[kind];
  persist(all);
}

/**
 * Wipe every stored customization at once — used by the "clear all
 * customizations" button in the Admin Panel.
 */
export function clearAllCustomizations() {
  if (typeof window === "undefined") return;
  const keys = [
    KEY,
    "hair-overrides-v1",
    "beard-overrides-v1",
    "shirt-overrides-v1",
    "pants-overrides-v1",
    "custom-garments-v1",
    "custom-hairs-v1",
  ];
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  _cache = {};
  bump();
}

// ----- Reactive subscription so the game hotbar re-renders after edits -----

export function subscribeItemOverrides(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

export function getItemOverridesVersion(): number {
  return _version;
}

// ----- Rendering helpers -----

const _urlCache = new Map<string, string>();

export function renderItemPixelsToDataURL(pixels: ItemPixels): string {
  const cacheKey = JSON.stringify(pixels);
  const cached = _urlCache.get(cacheKey);
  if (cached) return cached;
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = ITEM_GRID;
  c.height = ITEM_GRID;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ITEM_GRID, ITEM_GRID);
  for (const [k, color] of Object.entries(pixels)) {
    const [x, y] = k.split(",").map(Number);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }
  const url = c.toDataURL();
  _urlCache.set(cacheKey, url);
  return url;
}

/** Translation key for the display name of each item kind. */
export function itemNameKey(kind: ItemKind): string {
  return `item.${kind}`;
}
