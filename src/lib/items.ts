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
  | "ironPick"
  | "ironAxe"
  | "ironSpear"
  | "ironHammer"
  | "berrySeed"
  | "palmSeed"
  | "mushroom"
  | "herb"
  | "coal"
  | "copper"
  | "bronze"
  | "copperMetal"
  | "bronzeMetal"
  | "iron"
  | "ironMetal"
  | "ironBar"
  | "copperBar"
  | "bronzeBar"
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
  "ironPick",
  "ironAxe",
  "ironSpear",
  "ironHammer",
  "berrySeed",
  "palmSeed",
  "mushroom",
  "herb",
  "coal",
  "copper",
  "bronze",
  "copperMetal",
  "bronzeMetal",
  "iron",
  "ironMetal",
  "ironBar",
  "copperBar",
  "bronzeBar",
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
 *  larger canvas that fits the tool head + full shaft on the character.
 *  Carried resources (wood/bars) get a wide horizontal canvas since they're
 *  rendered as a stack across the torso, no vertical shaft needed. */
export function getVariantGrid(variant: ItemVariant, kind?: ItemKind): { w: number; h: number } {
  if (variant === "held") {
    if (kind === "wood" || kind === "copperBar" || kind === "bronzeBar" || kind === "ironBar") {
      return { w: 32, h: 16 };
    }
    return { w: 16, h: 40 };
  }
  return { w: ITEM_GRID, h: ITEM_GRID };
}

function sanitizePixelsForVariant(m: unknown, variant: ItemVariant, kind?: ItemKind): ItemPixels {
  const g = getVariantGrid(variant, kind);
  return sanitizePixels(m, g.w, g.h);
}

function sanitizeOverride(v: unknown, kind?: ItemKind): ItemOverride {
  if (!v || typeof v !== "object") return {};
  const raw = v as { icon?: unknown; held?: unknown; pixels?: unknown };
  const out: ItemOverride = {};
  // Legacy shape: a single { pixels } field applied to both icon + held.
  if (raw.pixels && !raw.icon && !raw.held) {
    const legacyIcon = sanitizePixelsForVariant(raw.pixels, "icon", kind);
    if (Object.keys(legacyIcon).length > 0) out.icon = legacyIcon;
    return out;
  }
  if (raw.icon) {
    const p = sanitizePixelsForVariant(raw.icon, "icon", kind);
    if (Object.keys(p).length > 0) out.icon = p;
  }
  if (raw.held) {
    const p = sanitizePixelsForVariant(raw.held, "held", kind);
    if (Object.keys(p).length > 0) out.held = p;
  }
  return out;
}

import itemDefaultsRaw from "./item-defaults.json";

const DEFAULT_ITEM_OVERRIDES: ItemOverrides = (() => {
  const out: ItemOverrides = {};
  const src = itemDefaultsRaw as Record<string, { icon?: unknown; held?: unknown }>;
  for (const [k, v] of Object.entries(src)) {
    if (!ITEM_KINDS.includes(k as ItemKind)) continue;
    const ov = sanitizeOverride(v, k as ItemKind);
    if (ov.icon || ov.held) out[k as ItemKind] = ov;
  }
  return out;
})();


export function loadItemOverrides(): ItemOverrides {
  if (_cache) return _cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const out: ItemOverrides = { ...DEFAULT_ITEM_OVERRIDES };
    for (const [k, v] of Object.entries(parsed ?? {})) {
      if (!ITEM_KINDS.includes(k as ItemKind)) continue;
      const ov = sanitizeOverride(v, k as ItemKind);
      if (ov.icon || ov.held) out[k as ItemKind] = ov;
    }
    _cache = out;
    return out;
  } catch {
    _cache = { ...DEFAULT_ITEM_OVERRIDES };
    return _cache;
  }
}

/**
 * Drop the in-memory cache and notify subscribers. Called when cloud-sync
 * writes fresh data straight into localStorage (bypassing the patched
 * setItem), so the next read picks up the new pixels instead of returning
 * a stale snapshot from before hydration.
 */
export function invalidateItemOverridesCache() {
  _cache = null;
  bump();
}

if (typeof window !== "undefined") {
  window.addEventListener("cloud-sync:write", (ev) => {
    const key = (ev as CustomEvent<{ key?: string }>).detail?.key;
    if (key === KEY) invalidateItemOverridesCache();
  });
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
  const cleaned = sanitizePixelsForVariant(pixels, variant, kind);
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
