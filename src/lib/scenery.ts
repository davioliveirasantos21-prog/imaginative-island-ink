/**
 * Scenery pixel overrides — currently just the cave entrance.
 *
 * The cave entrance is drawn procedurally by `drawCaveEntranceRaw`, which
 * is shared between the game runtime and the admin editor. The admin can
 * open a pixel canvas seeded with the current procedural drawing (via
 * `captureCaveDefaultPixels`) and paint over it. Whatever pixels are saved
 * are then rendered *on top* of the procedural art at runtime, so the
 * admin only needs to paint the pixels that are missing / to be changed.
 */

export type SceneryKind =
  | "caveEntrance"
  | "bench"
  | "workshop"
  | "furnace"
  | "furnaceOff"
  | "chest"
  | "anvil";
export const SCENERY_KINDS: SceneryKind[] = [
  "caveEntrance",
  "bench",
  "workshop",
  "furnace",
  "furnaceOff",
  "chest",
  "anvil",
];

/** Pixel grid for the cave entrance override. Wide enough to fully cover
 *  the procedural drawing (which spans baseX-78..baseX+78 horizontally
 *  and baseY-64..baseY vertically). */
export const CAVE_GRID_W = 160;
export const CAVE_GRID_H = 76;

/** Which pixel inside the grid maps to (baseX, baseY) in world coords. */
export const CAVE_ANCHOR = { x: 80, y: 71 } as const;

/** Per-kind grid + anchor lookup. The anchor pixel maps to (baseX, baseY)
 *  in world coords when the sprite is drawn/painted. */
export type SceneryGrid = { w: number; h: number; anchor: { x: number; y: number } };
export const SCENERY_GRIDS: Record<SceneryKind, SceneryGrid> = {
  caveEntrance: { w: CAVE_GRID_W, h: CAVE_GRID_H, anchor: CAVE_ANCHOR },
  bench:    { w: 20, h: 13, anchor: { x: 0, y: 12 } },
  workshop: { w: 22, h: 13, anchor: { x: 1, y: 12 } },
  furnace:  { w: 20, h: 21, anchor: { x: 1, y: 20 } },
  furnaceOff: { w: 20, h: 21, anchor: { x: 1, y: 20 } },
  chest:    { w: 18, h: 11, anchor: { x: 0, y: 10 } },
  anvil:    { w: 16, h: 10, anchor: { x: 1, y: 9 } },
};



export function getSceneryGrid(kind: SceneryKind): SceneryGrid {
  return SCENERY_GRIDS[kind];
}

export type SceneryPixels = Record<string, string>; // "x,y" -> "#rrggbb"
export type SceneryOverrides = Partial<Record<SceneryKind, SceneryPixels>>;

const KEY = "scenery-overrides-v1";
let _cache: SceneryOverrides | null = null;
let _version = 0;
const _listeners = new Set<() => void>();

function bump() {
  _version++;
  for (const l of _listeners) l();
}

function isHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

function sanitize(m: unknown, w: number, h: number): SceneryPixels {
  if (!m || typeof m !== "object") return {};
  const out: SceneryPixels = {};
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v !== "string" || !isHex(v)) continue;
    const [xs, ys] = k.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    out[`${x},${y}`] = v;
  }
  return out;
}

function gridFor(kind: SceneryKind): { w: number; h: number } {
  const g = SCENERY_GRIDS[kind];
  return g ? { w: g.w, h: g.h } : { w: 16, h: 16 };
}

import sceneryDefaultsRaw from "./scenery-defaults.json";

const DEFAULT_SCENERY_OVERRIDES: SceneryOverrides = (() => {
  const out: SceneryOverrides = {};
  const src = sceneryDefaultsRaw as Record<string, Record<string, string>>;
  for (const [k, v] of Object.entries(src)) {
    if (!SCENERY_KINDS.includes(k as SceneryKind)) continue;
    const g = gridFor(k as SceneryKind);
    const px = sanitize(v, g.w, g.h);
    if (Object.keys(px).length) out[k as SceneryKind] = px;
  }
  return out;
})();

export function loadSceneryOverrides(): SceneryOverrides {
  if (_cache) return _cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const out: SceneryOverrides = { ...DEFAULT_SCENERY_OVERRIDES };
    for (const [k, v] of Object.entries(parsed)) {
      if (!SCENERY_KINDS.includes(k as SceneryKind)) continue;
      const g = gridFor(k as SceneryKind);
      const px = sanitize(v, g.w, g.h);
      if (Object.keys(px).length) out[k as SceneryKind] = px;
    }
    _cache = out;
    return out;
  } catch {
    _cache = { ...DEFAULT_SCENERY_OVERRIDES };
    return _cache;
  }
}

export function getSceneryOverride(kind: SceneryKind): SceneryPixels | undefined {
  return loadSceneryOverrides()[kind];
}

export function saveSceneryOverride(kind: SceneryKind, pixels: SceneryPixels) {
  const g = gridFor(kind);
  const clean = sanitize(pixels, g.w, g.h);
  const cur = { ...loadSceneryOverrides() };
  if (Object.keys(clean).length === 0) delete cur[kind];
  else cur[kind] = clean;
  _cache = cur;
  try {
    localStorage.setItem(KEY, JSON.stringify(cur));
  } catch {
    /* ignore */
  }
  bump();
}

export function deleteSceneryOverride(kind: SceneryKind) {
  const cur = { ...loadSceneryOverrides() };
  if (!(kind in cur)) return;
  delete cur[kind];
  _cache = cur;
  try {
    localStorage.setItem(KEY, JSON.stringify(cur));
  } catch {
    /* ignore */
  }
  bump();
}

export function clearAllScenery() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  _cache = {};
  bump();
}

export function subscribeSceneryOverrides(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

export function getSceneryOverridesVersion(): number {
  return _version;
}

// ==========================================================================
// Cave entrance — procedural drawing shared between runtime and editor.
// ==========================================================================

/**
 * Draw the current procedural cave entrance onto `ctx`, with the base of
 * the stone wall centered at (baseX, baseY). All original coordinates from
 * the game's inline draw are preserved verbatim so the rasterized snapshot
 * matches what the runtime shows pixel-for-pixel.
 */
export function drawCaveEntranceRaw(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const rock = (x: number, y: number, w: number, h: number, light = false) => {
    ctx.fillStyle = light ? "#686070" : "#4a4450";
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x - w + 3, y - h * 0.6);
    ctx.lineTo(x - w * 0.3, y - h);
    ctx.lineTo(x + w * 0.4, y - h * 0.85);
    ctx.lineTo(x + w - 2, y - h * 0.45);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#332e38";
    ctx.fillRect(x - w + 2, y - 3, w * 0.5, 2);
    ctx.fillStyle = "#7f7888";
    ctx.fillRect(x - w + 1, y - h * 0.6, 2, h * 0.4);
  };

  // Back dark stone wall
  ctx.fillStyle = "#3a3540";
  ctx.beginPath();
  ctx.moveTo(baseX - 78, baseY);
  ctx.lineTo(baseX - 72, baseY - 26);
  ctx.lineTo(baseX - 60, baseY - 20);
  ctx.lineTo(baseX - 52, baseY - 40);
  ctx.lineTo(baseX - 40, baseY - 32);
  ctx.lineTo(baseX - 30, baseY - 52);
  ctx.lineTo(baseX - 14, baseY - 44);
  ctx.lineTo(baseX - 2, baseY - 60);
  ctx.lineTo(baseX + 14, baseY - 48);
  ctx.lineTo(baseX + 28, baseY - 64);
  ctx.lineTo(baseX + 44, baseY - 46);
  ctx.lineTo(baseX + 58, baseY - 36);
  ctx.lineTo(baseX + 72, baseY - 24);
  ctx.lineTo(baseX + 78, baseY);
  ctx.closePath();
  ctx.fill();

  // Overhanging ledges / broken stone layers
  ctx.fillStyle = "#524c58";
  ctx.beginPath();
  ctx.moveTo(baseX - 72, baseY - 26);
  ctx.lineTo(baseX - 60, baseY - 20);
  ctx.lineTo(baseX - 54, baseY - 28);
  ctx.lineTo(baseX - 40, baseY - 32);
  ctx.lineTo(baseX - 30, baseY - 52);
  ctx.lineTo(baseX - 18, baseY - 48);
  ctx.lineTo(baseX - 2, baseY - 60);
  ctx.lineTo(baseX + 10, baseY - 56);
  ctx.lineTo(baseX + 28, baseY - 64);
  ctx.lineTo(baseX + 44, baseY - 46);
  ctx.lineTo(baseX + 52, baseY - 42);
  ctx.lineTo(baseX + 58, baseY - 36);
  ctx.lineTo(baseX + 72, baseY - 24);
  ctx.lineTo(baseX + 70, baseY - 18);
  ctx.lineTo(baseX + 56, baseY - 30);
  ctx.lineTo(baseX + 44, baseY - 38);
  ctx.lineTo(baseX + 28, baseY - 56);
  ctx.lineTo(baseX + 14, baseY - 48);
  ctx.lineTo(baseX - 4, baseY - 52);
  ctx.lineTo(baseX - 20, baseY - 42);
  ctx.lineTo(baseX - 34, baseY - 44);
  ctx.lineTo(baseX - 50, baseY - 24);
  ctx.lineTo(baseX - 66, baseY - 22);
  ctx.closePath();
  ctx.fill();

  // Highlighted stone chunks on the left face
  ctx.fillStyle = "#6b6470";
  ctx.beginPath();
  ctx.moveTo(baseX - 52, baseY - 40);
  ctx.lineTo(baseX - 44, baseY - 46);
  ctx.lineTo(baseX - 34, baseY - 44);
  ctx.lineTo(baseX - 30, baseY - 52);
  ctx.lineTo(baseX - 14, baseY - 44);
  ctx.lineTo(baseX - 18, baseY - 34);
  ctx.lineTo(baseX - 34, baseY - 30);
  ctx.closePath();
  ctx.fill();

  // Shadowed crevices
  ctx.fillStyle = "#2c2830";
  ctx.beginPath();
  ctx.moveTo(baseX + 14, baseY - 48);
  ctx.lineTo(baseX + 28, baseY - 56);
  ctx.lineTo(baseX + 44, baseY - 46);
  ctx.lineTo(baseX + 58, baseY - 36);
  ctx.lineTo(baseX + 50, baseY - 28);
  ctx.lineTo(baseX + 36, baseY - 36);
  ctx.lineTo(baseX + 22, baseY - 42);
  ctx.closePath();
  ctx.fill();

  // Cave mouth
  const mouthW = 30;
  const mouthH = 40;
  const mouthCX = baseX;
  const mouthBaseY = baseY - 2;

  // Outer broken rim
  ctx.fillStyle = "#4a4450";
  ctx.beginPath();
  ctx.moveTo(mouthCX - mouthW / 2 - 6, mouthBaseY);
  ctx.lineTo(mouthCX - mouthW / 2 - 6, mouthBaseY - mouthH + 8);
  ctx.quadraticCurveTo(mouthCX, mouthBaseY - mouthH - 12, mouthCX + mouthW / 2 + 6, mouthBaseY - mouthH + 8);
  ctx.lineTo(mouthCX + mouthW / 2 + 6, mouthBaseY);
  ctx.closePath();
  ctx.fill();

  // Inner darkness
  ctx.fillStyle = "#05030a";
  ctx.beginPath();
  ctx.moveTo(mouthCX - mouthW / 2, mouthBaseY);
  ctx.lineTo(mouthCX - mouthW / 2, mouthBaseY - mouthH + 10);
  ctx.quadraticCurveTo(mouthCX, mouthBaseY - mouthH - 4, mouthCX + mouthW / 2, mouthBaseY - mouthH + 10);
  ctx.lineTo(mouthCX + mouthW / 2, mouthBaseY);
  ctx.closePath();
  ctx.fill();

  // Cracked stone slabs at the mouth base
  ctx.fillStyle = "#524c58";
  ctx.beginPath();
  ctx.moveTo(mouthCX - mouthW / 2 - 8, mouthBaseY);
  ctx.lineTo(mouthCX - mouthW / 2 - 6, mouthBaseY - 6);
  ctx.lineTo(mouthCX - mouthW / 2 + 4, mouthBaseY - 5);
  ctx.lineTo(mouthCX - mouthW / 2 + 6, mouthBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(mouthCX + mouthW / 2 - 4, mouthBaseY);
  ctx.lineTo(mouthCX + mouthW / 2 - 2, mouthBaseY - 7);
  ctx.lineTo(mouthCX + mouthW / 2 + 8, mouthBaseY - 4);
  ctx.lineTo(mouthCX + mouthW / 2 + 10, mouthBaseY);
  ctx.closePath();
  ctx.fill();

  // Scattered rocks on the ground around the entrance
  rock(baseX - 54, baseY, 10, 9);
  rock(baseX - 34, baseY, 8, 6);
  rock(baseX + 42, baseY, 12, 10);
  rock(baseX + 62, baseY, 7, 5);
  rock(baseX - 64, baseY, 6, 5, true);
  rock(baseX + 26, baseY, 5, 4, true);

  ctx.restore();
}

/** Rasterize the procedural cave into a sparse pixel map (one entry per
 *  non-transparent pixel) so the admin editor opens pre-populated. */
export function captureCaveDefaultPixels(): SceneryPixels {
  if (typeof document === "undefined") return {};
  const c = document.createElement("canvas");
  c.width = CAVE_GRID_W;
  c.height = CAVE_GRID_H;
  const ctx = c.getContext("2d");
  if (!ctx) return {};
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);
  drawCaveEntranceRaw(ctx, CAVE_ANCHOR.x, CAVE_ANCHOR.y);
  const out: SceneryPixels = {};
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const to = (n: number) => n.toString(16).padStart(2, "0");
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (data[i + 3] < 8) continue;
      out[`${x},${y}`] = `#${to(data[i])}${to(data[i + 1])}${to(data[i + 2])}`;
    }
  }
  return out;
}

/** Paint stored pixels onto `ctx`, aligned so the anchor pixel lands on
 *  (baseX, baseY). Coordinates use the ctx's current transform.
 *  Cached into an offscreen canvas keyed by the pixels object identity so
 *  repeated frames only cost a single drawImage. */
const _sceneryCanvasCache = new WeakMap<SceneryPixels, HTMLCanvasElement>();
export function paintScenery(
  ctx: CanvasRenderingContext2D,
  pixels: SceneryPixels,
  baseX: number,
  baseY: number,
  anchor: { x: number; y: number } = CAVE_ANCHOR,
  gridW: number = CAVE_GRID_W,
  gridH: number = CAVE_GRID_H,
) {
  if (typeof document === "undefined") return;
  let cached = _sceneryCanvasCache.get(pixels);
  if (!cached) {
    cached = document.createElement("canvas");
    cached.width = gridW;
    cached.height = gridH;
    const c = cached.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    for (const [k, color] of Object.entries(pixels)) {
      const [xs, ys] = k.split(",");
      c.fillStyle = color;
      c.fillRect(Number(xs), Number(ys), 1, 1);
    }
    _sceneryCanvasCache.set(pixels, cached);
  }
  const offX = Math.round(baseX) - anchor.x;
  const offY = Math.round(baseY) - anchor.y;
  ctx.drawImage(cached, offX, offY);
}

/** Convenience: paint a scenery override for a built structure at (baseX, baseY).
 *  Looks up the per-kind grid + anchor so callers don't need to pass them. */
export function paintSceneryFor(
  ctx: CanvasRenderingContext2D,
  kind: SceneryKind,
  baseX: number,
  baseY: number,
) {
  const px = getSceneryOverride(kind);
  if (!px) return;
  const g = SCENERY_GRIDS[kind];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  paintScenery(ctx, px, baseX, baseY, g.anchor, g.w, g.h);
  ctx.restore();
}

export function sceneryNameKey(kind: SceneryKind): string {
  return `scenery.${kind}`;
}

// ==========================================================================
// Built structures — procedural drawings shared with the game runtime.
// Solidity fades the fill (blueprint ghost previews).
// ==========================================================================

function makeDraw(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  solidity: number,
) {
  return (color: string, dx: number, dy: number, w: number, h: number) => {
    if (solidity >= 1) ctx.fillStyle = color;
    else {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${solidity.toFixed(2)})`;
    }
    ctx.fillRect(x + dx, y + dy, w, h);
  };
}

export function drawSawBench(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  solidity: number = 1,
  variant: "common" | "saw" = "common",
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const draw = makeDraw(ctx, x, y, solidity);
  ctx.fillStyle = `rgba(0,0,0,${(0.28 * solidity).toFixed(2)})`;
  ctx.fillRect(x, y, 20, 1);
  draw("#8a5a2e", 0, -8, 20, 3);
  draw("#a97442", 1, -8, 18, 1);
  draw("#5f3a1c", 0, -6, 20, 1);
  draw("#5f3a1c", 1, -5, 2, 5);
  draw("#5f3a1c", 17, -5, 2, 5);
  draw("#7a4a24", 3, -3, 14, 1);
  if (variant === "saw") {
    draw("#c9c9d2", 8, -12, 5, 4);
    draw("#e8e8ee", 8, -12, 5, 1);
    draw("#5a5a64", 8, -9, 5, 1);
    draw("#c9c9d2", 7, -11, 1, 1);
    draw("#c9c9d2", 13, -11, 1, 1);
    draw("#c9c9d2", 7, -9, 1, 1);
    draw("#c9c9d2", 13, -9, 1, 1);
    draw("#3a3a44", 10, -10, 1, 1);
  } else {
    draw("#7a7770", 8, -11, 6, 3);
    draw("#7a7770", 7, -10, 1, 1);
    draw("#7a7770", 14, -10, 1, 1);
    draw("#9a978f", 9, -11, 4, 1);
    draw("#b8b5ad", 10, -11, 1, 1);
    draw("#5a564e", 8, -9, 6, 1);
  }
}

export function drawWorkshopBench(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  solidity: number = 1,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const draw = makeDraw(ctx, x, y, solidity);
  ctx.fillStyle = `rgba(0,0,0,${(0.32 * solidity).toFixed(2)})`;
  ctx.fillRect(x - 1, y, 22, 1);
  draw("#7a4a24", -1, -9, 22, 3);
  draw("#a06a34", 0, -9, 20, 1);
  draw("#4a2a12", -1, -7, 22, 1);
  draw("#4a2a12", 0, -6, 2, 6);
  draw("#4a2a12", 18, -6, 2, 6);
  draw("#5f3a1c", 6, -6, 2, 6);
  draw("#5f3a1c", 12, -6, 2, 6);
  draw("#5f3a1c", 2, -3, 16, 1);
  draw("#e8dfc4", 2, -12, 9, 3);
  draw("#f4ecd0", 2, -12, 9, 1);
  draw("#a89968", 2, -12, 1, 3);
  draw("#a89968", 10, -12, 1, 3);
  draw("#3a6ea5", 4, -11, 5, 1);
  draw("#3a6ea5", 4, -10, 3, 1);
  draw("#7a7770", 14, -12, 5, 3);
  draw("#9a978f", 15, -12, 3, 1);
  draw("#5a564e", 14, -10, 5, 1);
  draw("#3a2a10", 3, -9, 1, 1);
  draw("#3a2a10", 16, -9, 1, 1);
}

export function drawFurnace(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  solidity: number = 1,
  lit: boolean = true,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const draw = makeDraw(ctx, x, y, solidity);
  
  // Shadow on ground
  ctx.fillStyle = `rgba(0,0,0,${(0.3 * solidity).toFixed(2)})`;
  ctx.fillRect(x - 1, y, 20, 1);
  
  // Outer outline of the furnace structure (PICO-8 style black border)
  draw("#141013", 1, -15, 16, 15); // base body border
  draw("#141013", 4, -20, 10, 5);  // chimney border
  
  // Fill body color
  draw("#5e5264", 2, -14, 14, 13); // base body fill
  draw("#5e5264", 5, -19, 8, 4);   // chimney fill
  
  // Simple blocky stone details (low detail side bricks)
  draw("#736879", 2, -14, 3, 2);   // highlight top-left
  draw("#736879", 13, -14, 3, 2);  // highlight top-right
  draw("#463a4b", 2, -3, 14, 2);   // bottom base shadow
  
  // Center archway (inside the furnace)
  draw("#100c0f", 5, -9, 8, 8);    // black arch
  draw("#100c0f", 6, -10, 6, 1);
  
  // Lit/Unlit state
  if (lit) {
    // simple blocky flame
    draw("#f03024", 6, -4, 6, 3);   // red base
    draw("#f06a24", 7, -8, 4, 5);   // orange flame
    draw("#ffb03a", 8, -6, 2, 2);   // yellow center
  } else {
    // simple cold firewood logs inside the arch
    draw("#221208", 6, -3, 6, 1);   // simple bottom logs line
  }
}

export function drawChest(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  solidity: number = 1,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const draw = makeDraw(ctx, x, y, solidity);
  ctx.fillStyle = `rgba(0,0,0,${(0.3 * solidity).toFixed(2)})`;
  ctx.fillRect(x, y, 18, 1);
  draw("#7a4a24", 1, -6, 16, 6);
  draw("#5f3a1c", 1, -1, 16, 1);
  draw("#a06a34", 2, -6, 14, 1);
  draw("#4a2a12", 6, -6, 1, 6);
  draw("#4a2a12", 12, -6, 1, 6);
  draw("#8a5a2e", 1, -10, 16, 4);
  draw("#a97442", 2, -10, 14, 1);
  draw("#5f3a1c", 1, -7, 16, 1);
  draw("#5f3a1c", 1, -10, 1, 1);
  draw("#5f3a1c", 16, -10, 1, 1);
  draw("#7a7770", 0, -9, 2, 9);
  draw("#5a564e", 0, -1, 2, 1);
  draw("#9a978f", 0, -9, 2, 1);
  draw("#7a7770", 16, -9, 2, 9);
  draw("#5a564e", 16, -1, 2, 1);
  draw("#9a978f", 16, -9, 2, 1);
  draw("#7a7770", 8, -10, 2, 10);
  draw("#9a978f", 8, -10, 2, 1);
  draw("#5a564e", 8, -1, 2, 1);
  draw("#3a3a44", 8, -7, 2, 2);
  draw("#c9c9d2", 8, -7, 2, 1);
  draw("#1a0a08", 8, -5, 2, 1);
}

export function drawAnvil(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  solidity: number = 1,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const draw = makeDraw(ctx, x, y, solidity);
  ctx.fillStyle = `rgba(0,0,0,${(0.32 * solidity).toFixed(2)})`;
  ctx.fillRect(x, y, 14, 1);
  // Wooden stump base
  draw("#5f3a1c", 3, -3, 8, 3);
  draw("#7a4a24", 3, -3, 8, 1);
  draw("#4a2a12", 3, -1, 8, 1);
  draw("#3a2010", 3, -3, 1, 3);
  draw("#3a2010", 10, -3, 1, 3);
  // Anvil waist (narrow neck)
  draw("#3a3a42", 5, -6, 4, 3);
  draw("#4a4a52", 5, -6, 4, 1);
  draw("#2a2a32", 5, -4, 4, 1);
  // Anvil top plate (wide, with horn on the left)
  draw("#4a4a52", 1, -8, 12, 2);
  draw("#6a6a72", 1, -8, 12, 1);
  draw("#3a3a42", 1, -7, 12, 1);
  // Horn tip (left)
  draw("#5a5a62", 0, -7, 1, 1);
  // Right heel step
  draw("#5a5a62", 13, -8, 1, 2);
  draw("#6a6a72", 13, -8, 1, 1);
  // Hardy hole (small dark square on top)
  draw("#1a1a22", 10, -8, 1, 1);
}

/** Rasterize a built structure into a sparse pixel map so the admin editor
 *  opens pre-populated with the current procedural art. */
export function captureBuildDefaultPixels(kind: SceneryKind): SceneryPixels {
  if (typeof document === "undefined") return {};
  const g = SCENERY_GRIDS[kind];
  if (!g) return {};
  const c = document.createElement("canvas");
  c.width = g.w;
  c.height = g.h;
  const ctx = c.getContext("2d");
  if (!ctx) return {};
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);
  if (kind === "caveEntrance") drawCaveEntranceRaw(ctx, g.anchor.x, g.anchor.y);
  else if (kind === "bench") drawSawBench(ctx, g.anchor.x, g.anchor.y, 1, "common");
  else if (kind === "workshop") drawWorkshopBench(ctx, g.anchor.x, g.anchor.y, 1);
  else if (kind === "furnace") drawFurnace(ctx, g.anchor.x, g.anchor.y, 1, true);
  else if (kind === "furnaceOff") drawFurnace(ctx, g.anchor.x, g.anchor.y, 1, false);
  else if (kind === "chest") drawChest(ctx, g.anchor.x, g.anchor.y, 1);
  else if (kind === "anvil") drawAnvil(ctx, g.anchor.x, g.anchor.y, 1);
  const out: SceneryPixels = {};
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const to = (n: number) => n.toString(16).padStart(2, "0");
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (data[i + 3] < 8) continue;
      out[`${x},${y}`] = `#${to(data[i])}${to(data[i + 1])}${to(data[i + 2])}`;
    }
  }
  return out;
}
