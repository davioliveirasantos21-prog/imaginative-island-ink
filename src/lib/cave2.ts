/**
 * Cave Level 2 — procedural sequential dungeon.
 *
 * Segments live back-to-back along the x axis. Each is a "room" with a
 * particular hazard/challenge; once the player crosses its right edge it
 * flips to "cleared" and becomes a safe mining pocket.
 */

export type Cave2SegmentKind =
  | "start"
  | "normal"
  | "stalactites"
  | "stalagmites"
  | "water"
  | "pit"
  | "double_pit"
  | "crystals"
  | "bats"
  | "webs"
  | "centipede"
  | "end";


export type Cave2Segment = {
  index: number;
  kind: Cave2SegmentKind;
  x: number; // left world-x (inclusive)
  w: number; // width
};

export const CAVE2_SEG_W = 380;
export const CAVE2_SEG_COUNT = 12; // start + 10 challenges + end
export const CAVE2_W = CAVE2_SEG_W * CAVE2_SEG_COUNT;
export const CAVE2_ENTRY_X = 40;
export const CAVE2_RETURN_X = 20;

// Water pool geometry inside a "water" segment.
export const CAVE2_WATER_PAD = 40;
export const CAVE2_WATER_DEPTH = 46;

// Pit geometry inside a "pit" segment (a floor gap the player must jump).
export const CAVE2_PIT_PAD = 155;
export const CAVE2_PIT_DEPTH = 70;

export const CAVE2_CEILING = 44;
/** Low overhead ceiling used in most rooms — cave feels tighter and more
 *  claustrophobic. Only stalactite rooms keep the tall CAVE2_CEILING so
 *  the falling spikes have room to drop. */
export const CAVE2_LOW_CEILING = 150;
/** Returns the effective visible ceiling Y for a segment. Stalactite and
 *  web rooms keep the high ceiling; everything else uses the low overhead. */
export function ceilingYFor(seg: { kind: Cave2SegmentKind }): number {
  if (seg.kind === "stalactites" || seg.kind === "webs") return CAVE2_CEILING;
  return CAVE2_LOW_CEILING;
}

export const CAVE2_MAX_BREATH = 8;
export const CAVE2_MAX_HEARTS = 3;
export const CAVE2_HIT_INVULN_MS = 1200;

// LocalStorage key used by game.tsx to run a one-time cave2 progress wipe.
// Bump this string whenever the cave layout / segment pool changes so
// existing players get a fresh dungeon.
export const CAVE2_RESET_KEY = "cave2-reset-v8";

function makeRng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function generateCave2Layout(worldSeed: number): Cave2Segment[] {
  // XOR salt bumped to force a fresh layout for the same world seed after
  // the v5 reset (paired with CAVE2_RESET_KEY).
  const rnd = makeRng((worldSeed ^ 0xc4ce55) >>> 0);
  const pool: Cave2SegmentKind[] = [
    "stalactites",
    "stalagmites",
    "water",
    "pit",
    "double_pit",
    "bats",
    "webs",
    "webs",
    "centipede",
    "centipede",
    "normal",
    "normal",
  ];

  const middleCount = CAVE2_SEG_COUNT - 2;
  // Sample with limited repeats: no same kind twice in a row.
  const middle: Cave2SegmentKind[] = [];
  let last: Cave2SegmentKind | null = null;
  for (let i = 0; i < middleCount; i++) {
    let pick: Cave2SegmentKind;
    let tries = 0;
    do {
      pick = pool[Math.floor(rnd() * pool.length)];
      tries++;
    } while (pick === last && tries < 6);
    middle.push(pick);
    last = pick;
  }
  const order: Cave2SegmentKind[] = ["start", ...middle, "end"];
  const segs: Cave2Segment[] = [];
  let x = 0;
  for (let i = 0; i < order.length; i++) {
    segs.push({ index: i, kind: order[i], x, w: CAVE2_SEG_W });
    x += CAVE2_SEG_W;
  }
  return segs;
}

export function segmentAt(segs: Cave2Segment[], x: number): Cave2Segment | undefined {
  if (x < 0 || x >= CAVE2_W) return undefined;
  const i = Math.floor(x / CAVE2_SEG_W);
  return segs[i];
}

/** True when the horizontal position sits over the water pool. */
export function isOverWaterPool(seg: Cave2Segment | undefined, x: number): boolean {
  if (!seg || seg.kind !== "water") return false;
  const left = seg.x + CAVE2_WATER_PAD;
  const right = seg.x + seg.w - CAVE2_WATER_PAD;
  return x >= left && x <= right;
}

/** Pit gap spans for a segment (world-x ranges). Empty when no gap. */
export function pitGapsFor(seg: Cave2Segment | undefined): Array<[number, number]> {
  if (!seg) return [];
  if (seg.kind === "pit") {
    return [[seg.x + CAVE2_PIT_PAD, seg.x + seg.w - CAVE2_PIT_PAD]];
  }
  if (seg.kind === "double_pit") {
    // Two narrower gaps with a stone island in the middle.
    const gapW = 78;
    const islandW = 60;
    const totalW = gapW * 2 + islandW;
    const startX = seg.x + (seg.w - totalW) / 2;
    return [
      [startX, startX + gapW],
      [startX + gapW + islandW, startX + gapW + islandW + gapW],
    ];
  }
  return [];
}

/** True when the horizontal position sits over any pit gap. */
export function isOverPitGap(seg: Cave2Segment | undefined, x: number): boolean {
  for (const [l, r] of pitGapsFor(seg)) {
    if (x >= l && x <= r) return true;
  }
  return false;
}

/** Does the floor plane exist at this x? Water pools count as walkable
 *  ground. Only pit gaps are true holes. */
export function hasGroundAt(seg: Cave2Segment | undefined, x: number): boolean {
  if (!seg) return true;
  if (isOverPitGap(seg, x)) return false;
  return true;
}

export function waterDepthAt(seg: Cave2Segment | undefined, x: number): number {
  return isOverWaterPool(seg, x) ? CAVE2_WATER_DEPTH : 0;
}

/** True when the player is meaningfully below the water surface. */
export function isSubmergedAt(
  seg: Cave2Segment | undefined,
  x: number,
  feetY: number,
  groundY: number,
): boolean {
  return isOverWaterPool(seg, x) && feetY > groundY + 4;
}

// ---------- Stalactite hazard ----------

export type Stalactite = {
  id: string;
  x: number;
  cycleMs: number;
  offsetMs: number;
  /** 1 = small, 1.5 = medium, 2 = large, 2.6 = huge */
  sizeMul: number;
};

export function generateStalactites(segs: Cave2Segment[], worldSeed: number): Stalactite[] {
  const rnd = makeRng((worldSeed ^ 0x574a1) >>> 0);
  const out: Stalactite[] = [];
  // Size tiers: small, medium, large, huge — weighted toward smaller.
  const sizeTiers = [1.0, 1.0, 1.5, 1.5, 2.0, 2.6];
  for (const seg of segs) {
    if (seg.kind !== "stalactites") continue;
    const count = 4;
    for (let i = 0; i < count; i++) {
      const slot = seg.x + 60 + Math.round((seg.w - 120) * ((i + 0.5) / count));
      const jitter = Math.round((rnd() - 0.5) * 44);
      const sizeMul = sizeTiers[Math.floor(rnd() * sizeTiers.length)];
      // Larger stalactites fall a bit slower, and cycles are highly staggered
      // so drops feel random rather than metronomic.
      out.push({
        id: `stal-${seg.index}-${i}`,
        x: slot + jitter,
        cycleMs: 1800 + Math.round(rnd() * 2600) + Math.round(sizeMul * 400),
        offsetMs: Math.round(rnd() * 4200),
        sizeMul,
      });
    }
  }
  return out;
}

export function stalactiteFrame(s: Stalactite, now: number) {
  const t = ((now + s.offsetMs) % s.cycleMs) / s.cycleMs;
  if (t < 0.40) return { phase: "hang" as const, fallY: 0 };
  if (t < 0.60) {
    const k = (t - 0.40) / 0.2;
    return { phase: "fall" as const, fallY: k * 260 };
  }
  if (t < 0.72) return { phase: "shatter" as const, fallY: 260 };
  return { phase: "gone" as const, fallY: 260 };
}

const STAL_W = 10;
const STAL_HEAD_H = 10;
const STAL_TIP_H = 10;
const STAL_TOTAL_H = STAL_HEAD_H + STAL_TIP_H;

// ---------- Stalagmites (floor spikes) ----------

const STALAGMITE_W = 12;
const STALAGMITE_H = 16;

export function stalagmiteXs(seg: Cave2Segment): number[] {
  return [seg.x + 110, seg.x + 190, seg.x + 270];
}

export function stalagmiteHitBoxes(seg: Cave2Segment, groundY: number) {
  return stalagmiteXs(seg).map((gx) => ({
    x: gx - STALAGMITE_W / 2 + 2,
    y: groundY - STALAGMITE_H + 2,
    w: STALAGMITE_W - 4,
    h: STALAGMITE_H - 4,
  }));
}

function drawStalagmite(ctx: CanvasRenderingContext2D, cx: number, groundY: number) {
  ctx.fillStyle = "#2a2d32";
  ctx.fillRect(cx - STALAGMITE_W / 2, groundY - 4, STALAGMITE_W, 4);
  ctx.fillStyle = "#4a4e56";
  ctx.fillRect(cx - 5, groundY - 8, 10, 4);
  ctx.fillRect(cx - 4, groundY - 12, 8, 4);
  ctx.fillRect(cx - 2, groundY - 16, 4, 4);
  ctx.fillStyle = "#6e737b";
  ctx.fillRect(cx - 4, groundY - 8, 2, 6);
  ctx.fillStyle = "#a0a5ad";
  ctx.fillRect(cx - 1, groundY - 15, 1, 2);
}

// Crystal clusters removed — a dedicated crystal cave will be added later.

// ---------- Bats (flying enemy) ----------

export type Bat = {
  id: string;
  segIndex: number;
  baseY: number;      // ceiling anchor
  centerX: number;    // horizontal patrol center (world-x)
  ampX: number;       // horizontal amplitude
  ampY: number;       // vertical bob amplitude
  speed: number;      // rad/s
  phase: number;
};

export function generateBats(segs: Cave2Segment[], worldSeed: number): Bat[] {
  const rnd = makeRng((worldSeed ^ 0xba7a5) >>> 0);
  const out: Bat[] = [];
  for (const seg of segs) {
    if (seg.kind !== "bats") continue;
    const count = 2 + Math.floor(rnd() * 2); // 2–3 bats per room
    for (let i = 0; i < count; i++) {
      out.push({
        id: `bat-${seg.index}-${i}`,
        segIndex: seg.index,
        baseY: CAVE2_CEILING + 20 + Math.floor(rnd() * 30),
        centerX: seg.x + 80 + rnd() * (seg.w - 160),
        ampX: 50 + rnd() * 40,
        ampY: 10 + rnd() * 14,
        speed: 1.2 + rnd() * 0.8,
        phase: rnd() * Math.PI * 2,
      });
    }
  }
  return out;
}

const BAT_W = 12;
const BAT_H = 8;

export function batPosition(b: Bat, now: number): { x: number; y: number } {
  const t = now / 1000;
  const x = b.centerX + Math.sin(t * b.speed + b.phase) * b.ampX;
  const y = b.baseY + Math.sin(t * b.speed * 2 + b.phase) * b.ampY;
  return { x, y };
}

export function batHitBox(b: Bat, now: number) {
  const p = batPosition(b, now);
  return { x: p.x - BAT_W / 2 + 2, y: p.y - BAT_H / 2 + 1, w: BAT_W - 4, h: BAT_H - 2 };
}

function drawBat(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const flap = Math.sin(t * 12) > 0 ? 1 : -1;
  // Body
  ctx.fillStyle = "#1a1418";
  ctx.fillRect(cx - 2, cy - 1, 4, 3);
  // Wings — flap animates open/closed
  ctx.fillStyle = "#2a2028";
  if (flap > 0) {
    ctx.fillRect(cx - 6, cy - 2, 4, 2);
    ctx.fillRect(cx + 2, cy - 2, 4, 2);
    ctx.fillRect(cx - 7, cy - 1, 1, 1);
    ctx.fillRect(cx + 6, cy - 1, 1, 1);
  } else {
    ctx.fillRect(cx - 5, cy, 3, 2);
    ctx.fillRect(cx + 2, cy, 3, 2);
  }
  // Eyes
  ctx.fillStyle = "#c8261a";
  ctx.fillRect(cx - 1, cy, 1, 1);
  ctx.fillRect(cx + 0, cy, 1, 1);
}

// ---------- Rendering ----------

// Grayer stone palette.
const CEIL_COLOR_A = "#2a2d32";
const CEIL_COLOR_B = "#1a1c20";
const FLOOR_TOP = "#2f333a";
const FLOOR_MID = "#22252a";
const FLOOR_LO = "#151719";

export function drawCave2Scene(
  ctx: CanvasRenderingContext2D,
  camX: number,
  vw: number,
  vh: number,
  groundY: number,
  segs: Cave2Segment[],
  clearedSet: ReadonlySet<number>,
  stalactites: Stalactite[],
  now: number,
  bats: Bat[] = [],
) {
  // Backdrop — cool gray.
  const g = ctx.createLinearGradient(0, 0, 0, vh);
  g.addColorStop(0, "#0a0b0d");
  g.addColorStop(0.55, "#1c1e22");
  g.addColorStop(1, "#101215");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);

  // Ceiling band
  ctx.fillStyle = CEIL_COLOR_A;
  ctx.fillRect(0, 0, vw, CAVE2_CEILING);
  ctx.fillStyle = CEIL_COLOR_B;
  for (let x = -((camX * 0.5) % 16); x < vw; x += 16) {
    ctx.fillRect(x, 12, 8, 3);
    ctx.fillRect(x + 4, 28, 6, 3);
  }
  // Ceiling cracks
  ctx.fillStyle = "#0d0e10";
  for (let x = ((-camX * 0.5) % 110 + 110) % 110 - 110; x < vw + 110; x += 110) {
    ctx.fillRect(x + 10, 4, 1, 6);
    ctx.fillRect(x + 11, 8, 1, 5);
    ctx.fillRect(x + 12, 12, 1, 6);
    ctx.fillRect(x + 60, 0, 1, 10);
    ctx.fillRect(x + 61, 8, 1, 6);
    ctx.fillRect(x + 90, 6, 1, 8);
    ctx.fillRect(x + 91, 12, 1, 5);
  }

  // Cobwebs (radial fine lines with arcs) in ceiling corners.
  ctx.strokeStyle = "rgba(220, 225, 235, 0.28)";
  ctx.lineWidth = 1;
  const drawWeb = (cx: number, cy: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 - 0.7 + (i / 4) * 1.4;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * size, cy + Math.sin(a) * size);
    }
    for (let r = size * 0.35; r < size; r += size * 0.3) {
      ctx.moveTo(
        cx + Math.cos(-Math.PI / 2 - 0.7) * r,
        cy + Math.sin(-Math.PI / 2 - 0.7) * r,
      );
      for (let i = 1; i <= 4; i++) {
        const a = -Math.PI / 2 - 0.7 + (i / 4) * 1.4;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    ctx.stroke();
  };
  const webOff = -Math.floor(camX * 0.7);
  const spiderT = now / 1000;
  const drawSpider = (sx: number, sy: number, legPhase: number) => {
    // Body
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(sx - 1, sy - 1, 3, 2);
    ctx.fillRect(sx, sy - 2, 1, 1);
    // Legs — 3 per side, wiggle with legPhase
    ctx.fillStyle = "rgba(20, 20, 24, 0.9)";
    const wig = Math.sin(legPhase) > 0 ? 1 : 0;
    ctx.fillRect(sx - 3, sy - 1 + wig, 2, 1);
    ctx.fillRect(sx - 4, sy + wig, 1, 1);
    ctx.fillRect(sx - 3, sy + 1 - wig, 2, 1);
    ctx.fillRect(sx + 2, sy - 1 + wig, 2, 1);
    ctx.fillRect(sx + 4, sy + wig, 1, 1);
    ctx.fillRect(sx + 2, sy + 1 - wig, 2, 1);
    // Silk strand up to ceiling
    ctx.fillStyle = "rgba(220, 225, 235, 0.22)";
    for (let sy2 = sy - 2; sy2 > 2; sy2 -= 2) ctx.fillRect(sx, sy2, 1, 1);
  };
  const webs: Array<[number, number, number, number]> = [
    [22, 4, 22, 0], [190, 6, 18, 1], [110, 5, 16, 2], [300, 5, 20, 3],
  ];
  for (let x = ((webOff % 360) + 360) % 360 - 360; x < vw + 360; x += 360) {
    for (const [ox, oy, sz, seed] of webs) {
      drawWeb(x + ox, oy, sz);
      // Spider swings horizontally under the web
      const range = sz * 0.6;
      const t = spiderT * (0.4 + (seed % 3) * 0.15) + seed * 1.3;
      const sxp = Math.round(x + ox + Math.sin(t) * range);
      const syp = Math.round(oy + sz * 0.85 + Math.sin(t * 2) * 1);
      drawSpider(sxp, syp, spiderT * 8 + seed);
    }
  }

  // Falling water drops (deterministic, animated).
  const dropOff = -Math.floor(camX * 0.6);
  const tt = now / 1000;
  for (let x = ((dropOff % 170) + 170) % 170 - 170; x < vw + 170; x += 170) {
    const worldCol = Math.round(x + camX * 0.6);
    const seed = ((worldCol * 928371) & 0xffff) / 0xffff;
    const period = 1.6 + seed * 1.4;
    const phase = (tt + seed * 5) % period;
    const p = phase / period;
    const startY = CAVE2_CEILING + 22;
    const floorY = groundY - 2;
    const dy = startY + (floorY - startY) * p;
    const dropX = x + 12 + Math.floor(seed * 40);
    ctx.fillStyle = "rgba(150, 190, 220, 0.85)";
    ctx.fillRect(dropX, Math.round(dy), 1, 2);
    if (p > 0.9) {
      ctx.fillStyle = "rgba(150, 190, 220, 0.7)";
      ctx.fillRect(dropX - 2, floorY, 1, 1);
      ctx.fillRect(dropX + 2, floorY, 1, 1);
    }
  }

  // Per-segment low overhead ceiling — most rooms are cramped. Draw AFTER
  // cobwebs / cracks / drops so the fill covers them in low-ceiling zones.
  for (const seg of segs) {
    const sxL = seg.x - camX;
    if (sxL + seg.w < -8 || sxL > vw + 8) continue;
    const cy = ceilingYFor(seg);
    if (cy <= CAVE2_CEILING) continue; // stalactite rooms — keep tall
    const dxL = Math.round(sxL);
    const w = seg.w;
    // Main fill
    ctx.fillStyle = CEIL_COLOR_A;
    ctx.fillRect(dxL, CAVE2_CEILING, w, cy - CAVE2_CEILING);
    // Darker underside band
    ctx.fillStyle = "#151719";
    ctx.fillRect(dxL, cy - 3, w, 3);
    // Rough hanging lip highlights
    ctx.fillStyle = CEIL_COLOR_B;
    for (let x = dxL + 6; x < dxL + w - 6; x += 22) {
      ctx.fillRect(x, cy - 5, 4, 2);
    }
    // Small stalactite nubs hanging from the low ceiling (purely visual).
    ctx.fillStyle = "#3a3d44";
    const nubSeed = (seg.index * 2654435761) >>> 0;
    for (let i = 0; i < 3; i++) {
      const off = ((nubSeed >> (i * 5)) & 0xff) % Math.max(1, w - 40);
      const nx = dxL + 20 + off;
      const nh = 3 + (((nubSeed >> (i * 3)) & 0x3));
      ctx.fillRect(nx, cy, 3, nh);
      ctx.fillRect(nx + 1, cy + nh, 1, 1);
    }
    // Cave wall bevel where the low ceiling meets the tall stalactite room.
    const leftNeighbor = segs[seg.index - 1];
    const rightNeighbor = segs[seg.index + 1];
    ctx.fillStyle = "#22252a";
    if (leftNeighbor && ceilingYFor(leftNeighbor) < cy) {
      ctx.fillRect(dxL, CAVE2_CEILING, 2, cy - CAVE2_CEILING);
    }
    if (rightNeighbor && ceilingYFor(rightNeighbor) < cy) {
      ctx.fillRect(dxL + w - 2, CAVE2_CEILING, 2, cy - CAVE2_CEILING);
    }
  }


  // Floor base band — drawn per-segment so we can carve out pools/pits.
  ctx.fillStyle = FLOOR_MID;
  ctx.fillRect(0, groundY, vw, vh - groundY);

  for (const seg of segs) {
    const sxL = seg.x - camX;
    const sxR = sxL + seg.w;
    if (sxR < -8 || sxL > vw + 8) continue;

    // Divider between rooms — anchored to this segment's effective ceiling.
    if (seg.index > 0) {
      const dx = Math.round(sxL);
      const topY = ceilingYFor(seg);
      ctx.fillStyle = "#2a2d32";
      ctx.fillRect(dx - 2, topY, 4, 8);
      ctx.fillRect(dx - 2, groundY - 6, 4, 6);
    }

    if (seg.kind === "water") {
      const wl = Math.round(seg.x + CAVE2_WATER_PAD - camX);
      const wr = Math.round(seg.x + seg.w - CAVE2_WATER_PAD - camX);
      const wy = groundY;
      const wh = CAVE2_WATER_DEPTH;
      ctx.fillStyle = "#0e1418";
      ctx.fillRect(wl, wy, wr - wl, wh);
      ctx.fillStyle = "rgba(24, 76, 108, 0.85)";
      ctx.fillRect(wl, wy, wr - wl, wh);
      ctx.fillStyle = "rgba(60, 140, 170, 0.75)";
      ctx.fillRect(wl, wy, wr - wl, 4);
      ctx.fillStyle = "rgba(200,230,240,0.25)";
      for (let i = 0; i < 6; i++) {
        const px = wl + ((i * 24 + Math.floor(tt * 20)) % Math.max(1, wr - wl));
        ctx.fillRect(px, wy + 1, 6, 1);
      }
    } else if (seg.kind === "pit" || seg.kind === "double_pit") {
      for (const [gl, gr] of pitGapsFor(seg)) {
        const pl = Math.round(gl - camX);
        const pr = Math.round(gr - camX);
        ctx.fillStyle = "#1a1c20";
        ctx.fillRect(pl, groundY, pr - pl, CAVE2_PIT_DEPTH);
        ctx.fillStyle = "#0d0e10";
        ctx.fillRect(pl, groundY + CAVE2_PIT_DEPTH - 12, pr - pl, 12);
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(pl - 3, groundY, 3, 3);
        ctx.fillRect(pr, groundY, 3, 3);
        ctx.fillStyle = "#52565e";
        ctx.fillRect(pl, groundY, 2, 2);
        ctx.fillRect(pr - 2, groundY, 2, 2);
      }
    }

    if (seg.kind === "stalactites") {
      ctx.fillStyle = "#1e2024";
      ctx.fillRect(Math.round(sxL), CAVE2_CEILING, seg.w, 3);
    }

    if (seg.kind === "stalagmites") {
      for (const gx of stalagmiteXs(seg)) {
        const dx = Math.round(gx - camX);
        drawStalagmite(ctx, dx, groundY);
      }
    }

    // "crystals" kind is kept in the union for legacy layouts but rendered
    // as a plain room — a dedicated crystal cave will live elsewhere.

    if (seg.kind === "bats") {
      // Ambient guano on floor.
      ctx.fillStyle = "#22252a";
      ctx.fillRect(Math.round(sxL) + 40, groundY - 1, seg.w - 80, 1);
    }

    if (seg.kind === "webs") {
      drawWebsRoomOverlay(ctx, seg, camX, groundY);
    }


    // (Scenery boulders + relief mounds drawn after floor-top pass below.)
  }

  // Floor top/bottom highlights — only where floor exists.
  for (const seg of segs) {
    const sxL = seg.x - camX;
    if (sxL + seg.w < -8 || sxL > vw + 8) continue;
    const spans: Array<[number, number]> = [];
    if (seg.kind === "water") {
      spans.push([seg.x, seg.x + CAVE2_WATER_PAD]);
      spans.push([seg.x + seg.w - CAVE2_WATER_PAD, seg.x + seg.w]);
    } else if (seg.kind === "pit" || seg.kind === "double_pit") {
      const gaps = pitGapsFor(seg);
      let cursor = seg.x;
      for (const [gl, gr] of gaps) {
        if (gl > cursor) spans.push([cursor, gl]);
        cursor = gr;
      }
      if (cursor < seg.x + seg.w) spans.push([cursor, seg.x + seg.w]);
    } else {
      spans.push([seg.x, seg.x + seg.w]);
    }
    for (const [a, b] of spans) {
      const ax = Math.round(a - camX);
      const bw = Math.round(b - a);
      ctx.fillStyle = FLOOR_TOP;
      ctx.fillRect(ax, groundY, bw, 4);
      ctx.fillStyle = FLOOR_LO;
      ctx.fillRect(ax, groundY + 4, bw, 3);
    }
  }



  // Scenery boulders + small relief mounds — drawn after the floor top strip
  // so they visually rest on the ground instead of hovering above it.
  for (const seg of segs) {
    const sxL = seg.x - camX;
    if (sxL + seg.w < -16 || sxL > vw + 16) continue;
    if (seg.kind === "water" || seg.kind === "pit" || seg.kind === "double_pit"
        || seg.kind === "stalagmites") continue;

    // Boulder cluster — 3–5 rocks of varied sizes per segment, deterministic.
    // Bottoms sit on the floor top strip (groundY..groundY+4).
    const drawRock = (rx: number, sizeIdx: number) => {
      const dx = Math.round(rx - camX);
      // sizeIdx 0=tiny, 1=small, 2=medium, 3=large, 4=huge
      if (sizeIdx === 0) {
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(dx, groundY - 2, 3, 3);
        ctx.fillStyle = "#54585f";
        ctx.fillRect(dx, groundY - 2, 1, 1);
        ctx.fillStyle = "#1a1c1f";
        ctx.fillRect(dx, groundY + 1, 3, 1);
      } else if (sizeIdx === 1) {
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(dx, groundY - 3, 6, 4);
        ctx.fillRect(dx + 1, groundY - 4, 4, 1);
        ctx.fillStyle = "#54585f";
        ctx.fillRect(dx + 1, groundY - 3, 1, 2);
        ctx.fillStyle = "#1a1c1f";
        ctx.fillRect(dx, groundY + 1, 6, 1);
      } else if (sizeIdx === 2) {
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(dx, groundY - 3, 10, 5);
        ctx.fillRect(dx + 1, groundY - 4, 8, 1);
        ctx.fillStyle = "#54585f";
        ctx.fillRect(dx + 1, groundY - 3, 1, 4);
        ctx.fillRect(dx + 4, groundY - 4, 2, 1);
        ctx.fillStyle = "#1a1c1f";
        ctx.fillRect(dx, groundY + 1, 10, 1);
      } else if (sizeIdx === 3) {
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(dx, groundY - 5, 14, 7);
        ctx.fillRect(dx + 2, groundY - 7, 10, 2);
        ctx.fillRect(dx + 1, groundY - 6, 12, 1);
        ctx.fillStyle = "#54585f";
        ctx.fillRect(dx + 2, groundY - 5, 1, 5);
        ctx.fillRect(dx + 5, groundY - 7, 3, 1);
        ctx.fillStyle = "#1a1c1f";
        ctx.fillRect(dx, groundY + 2, 14, 1);
        ctx.fillRect(dx + 12, groundY - 3, 2, 3);
      } else {
        // Huge boulder
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(dx, groundY - 7, 20, 9);
        ctx.fillRect(dx + 2, groundY - 10, 16, 3);
        ctx.fillRect(dx + 5, groundY - 12, 10, 2);
        ctx.fillStyle = "#54585f";
        ctx.fillRect(dx + 2, groundY - 7, 1, 7);
        ctx.fillRect(dx + 6, groundY - 11, 4, 1);
        ctx.fillRect(dx + 14, groundY - 4, 1, 4);
        ctx.fillStyle = "#6a6e76";
        ctx.fillRect(dx + 7, groundY - 12, 3, 1);
        ctx.fillStyle = "#1a1c1f";
        ctx.fillRect(dx, groundY + 2, 20, 1);
        ctx.fillRect(dx + 18, groundY - 4, 2, 5);
      }
    };
    const baseSeed = (seg.index * 733091) >>> 0;
    const rockCount = 3 + (baseSeed & 0x3); // 3–6 rocks
    for (let i = 0; i < rockCount; i++) {
      const rs = (baseSeed * (i + 1) * 2654435761) >>> 0;
      const rx = seg.x + 30 + ((rs >> 8) % Math.max(1, seg.w - 80));
      // Weighted size distribution: mostly tiny/small, occasional large/huge.
      const roll = rs & 0xff;
      let sizeIdx: number;
      if (roll < 90) sizeIdx = 0;
      else if (roll < 170) sizeIdx = 1;
      else if (roll < 220) sizeIdx = 2;
      else if (roll < 245) sizeIdx = 3;
      else sizeIdx = 4;
      drawRock(rx, sizeIdx);
    }

    // Low relief on the floor — small mound or shallow dip. Deterministic
    // per segment so it doesn't jitter. Purely visual (no collision).
    const reliefRoll = (seg.index * 1103515245 + 12345) & 0xffff;
    const shouldRelief = (reliefRoll % 10) < 7; // ~70% of eligible rooms
    if (shouldRelief) {
      const mx = seg.x + 200 + ((reliefRoll >> 4) % Math.max(1, seg.w - 280));
      const mdx = Math.round(mx - camX);
      const kind = (reliefRoll >> 8) % 3; // 0 mound, 1 tall mound, 2 dip
      if (kind === 0) {
        // Small rounded mound bulging up from the floor top.
        ctx.fillStyle = FLOOR_TOP;
        ctx.fillRect(mdx - 18, groundY - 2, 36, 2);
        ctx.fillRect(mdx - 13, groundY - 4, 26, 2);
        ctx.fillRect(mdx - 8, groundY - 6, 16, 2);
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(mdx - 19, groundY - 1, 1, 2);
        ctx.fillRect(mdx + 18, groundY - 1, 1, 2);
        ctx.fillRect(mdx - 14, groundY - 3, 1, 1);
        ctx.fillRect(mdx + 13, groundY - 3, 1, 1);
        ctx.fillStyle = "#5a5e66";
        ctx.fillRect(mdx - 10, groundY - 5, 3, 1);
        ctx.fillRect(mdx - 3, groundY - 6, 4, 1);
      } else if (kind === 1) {
        // Taller step-mound — small hill.
        ctx.fillStyle = FLOOR_TOP;
        ctx.fillRect(mdx - 22, groundY - 3, 44, 3);
        ctx.fillRect(mdx - 16, groundY - 6, 32, 3);
        ctx.fillRect(mdx - 10, groundY - 9, 20, 3);
        ctx.fillRect(mdx - 5, groundY - 11, 10, 2);
        ctx.fillStyle = "#3a3d44";
        ctx.fillRect(mdx - 23, groundY - 2, 1, 3);
        ctx.fillRect(mdx + 22, groundY - 2, 1, 3);
        ctx.fillRect(mdx - 17, groundY - 5, 1, 2);
        ctx.fillRect(mdx + 16, groundY - 5, 1, 2);
        ctx.fillStyle = "#5a5e66";
        ctx.fillRect(mdx - 12, groundY - 8, 4, 1);
        ctx.fillRect(mdx - 3, groundY - 10, 5, 1);
      } else {
        // Shallow dip — recess in the floor top strip.
        ctx.fillStyle = FLOOR_MID;
        ctx.fillRect(mdx - 14, groundY, 28, 2);
        ctx.fillRect(mdx - 9, groundY, 18, 4);
        ctx.fillStyle = "#151719";
        ctx.fillRect(mdx - 14, groundY, 1, 2);
        ctx.fillRect(mdx + 13, groundY, 1, 2);
        ctx.fillRect(mdx - 9, groundY + 2, 1, 2);
        ctx.fillRect(mdx + 8, groundY + 2, 1, 2);
      }
    }
  }


  // Wall cracks
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  const wallCrackOff = -Math.floor(camX * 0.85);
  for (let x = ((wallCrackOff % 220) + 220) % 220 - 220; x < vw + 220; x += 220) {
    ctx.fillRect(x + 60, 70, 1, 24);
    ctx.fillRect(x + 61, 94, 1, 18);
    ctx.fillRect(x + 62, 112, 1, 14);
    ctx.fillRect(x + 160, 80, 1, 16);
    ctx.fillRect(x + 161, 96, 1, 20);
  }

  // Stalactites — size scales width/head/tip/fall distance.
  // In cleared (safe) segments the stalactites are gone entirely: the room
  // has been conquered and is now a safe mining pocket.
  for (const s of stalactites) {
    const seg = segmentAt(segs, s.x);
    if (!seg) continue;
    if (clearedSet.has(seg.index)) continue;
    const sx = Math.round(s.x - camX);
    if (sx < -20 || sx > vw + 20) continue;
    const frame = stalactiteFrame(s, now);
    const w = Math.max(6, Math.round(STAL_W * s.sizeMul));
    const headH = Math.max(6, Math.round(STAL_HEAD_H * s.sizeMul));
    const tipH = Math.max(6, Math.round(STAL_TIP_H * s.sizeMul));
    const halfW = Math.floor(w / 2);
    const capX = sx - halfW;
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(capX, CAVE2_CEILING, w, Math.max(3, Math.round(5 * s.sizeMul)));
    ctx.fillStyle = "#2a2d32";
    ctx.fillRect(capX, CAVE2_CEILING + Math.round(5 * s.sizeMul), w, 2);
    const baseY = CAVE2_CEILING + Math.round(5 * s.sizeMul) + 2;
    // If the falling body's tip reaches the floor, treat as shatter — the
    // stalactite must never render below the ground.
    const grounded = frame.phase === "fall" && baseY + frame.fallY + headH + tipH >= groundY;
    const effPhase = grounded ? "shatter" : frame.phase;
    if (effPhase === "hang") {
      ctx.fillStyle = "#54585f";
      ctx.fillRect(capX, baseY, w, headH);
      ctx.fillStyle = "#70747c";
      ctx.fillRect(capX + 1, baseY, Math.max(1, Math.round(2 * s.sizeMul)), headH - 2);
      ctx.fillStyle = "#3a3d44";
      // Tapered tip in 3 tiers scaled by sizeMul.
      const t1 = Math.max(2, Math.round(6 * s.sizeMul));
      const t2 = Math.max(1, Math.round(4 * s.sizeMul));
      const t3 = Math.max(1, Math.round(2 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t1 / 2), baseY + headH, t1, Math.round(4 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t2 / 2), baseY + headH + Math.round(4 * s.sizeMul), t2, Math.round(3 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t3 / 2), baseY + headH + Math.round(7 * s.sizeMul), t3, Math.round(3 * s.sizeMul));
    } else if (effPhase === "fall") {
      const fy = baseY + frame.fallY;
      ctx.fillStyle = "#a8adb5";
      ctx.fillRect(capX, fy, w, headH);
      ctx.fillStyle = "#c8cdd5";
      ctx.fillRect(capX + 1, fy, Math.max(1, Math.round(2 * s.sizeMul)), headH - 2);
      ctx.fillStyle = "#70747c";
      const t1 = Math.max(2, Math.round(6 * s.sizeMul));
      const t2 = Math.max(1, Math.round(4 * s.sizeMul));
      const t3 = Math.max(1, Math.round(2 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t1 / 2), fy + headH, t1, Math.round(4 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t2 / 2), fy + headH + Math.round(4 * s.sizeMul), t2, Math.round(3 * s.sizeMul));
      ctx.fillRect(sx - Math.floor(t3 / 2), fy + headH + Math.round(7 * s.sizeMul), t3, Math.round(3 * s.sizeMul));
    } else if (effPhase === "shatter") {
      // Chunky debris — same fixed count (4 pieces) but each piece scales up
      // with sizeMul so bigger stalactites leave clearly bigger rubble.
      const spread = Math.round(10 * s.sizeMul);
      const chunkW = Math.max(4, Math.round(6 * s.sizeMul));
      const chunkH = Math.max(3, Math.round(5 * s.sizeMul));
      const midW = Math.max(3, Math.round(4 * s.sizeMul));
      const midH = Math.max(3, Math.round(4 * s.sizeMul));
      ctx.fillStyle = "#6a6e76";
      ctx.fillRect(sx - spread, groundY - chunkH, chunkW, chunkH);
      ctx.fillRect(sx + spread - chunkW, groundY - chunkH, chunkW, chunkH);
      ctx.fillStyle = "#54585f";
      ctx.fillRect(sx - Math.round(midW / 2) - 2, groundY - midH - 2, midW, midH);
      ctx.fillRect(sx + 1, groundY - midH - 1, midW, midH);
    }
  }

  // Bats
  for (const b of bats) {
    const p = batPosition(b, now);
    const sx = Math.round(p.x - camX);
    if (sx < -16 || sx > vw + 16) continue;
    drawBat(ctx, sx, Math.round(p.y), tt);
  }
}

/** Rectangle the falling stalactite currently occupies (for hit test). */
export function stalactiteHitBox(s: Stalactite, now: number, groundY: number) {
  const f = stalactiteFrame(s, now);
  if (f.phase !== "fall") return null;
  const w = Math.max(6, Math.round(STAL_W * s.sizeMul));
  const headH = Math.max(6, Math.round(STAL_HEAD_H * s.sizeMul));
  const tipH = Math.max(6, Math.round(STAL_TIP_H * s.sizeMul));
  const baseY = CAVE2_CEILING + Math.round(5 * s.sizeMul) + 2;
  const top = baseY + f.fallY;
  // Already impacted the floor — treated as shatter, no active hazard rect.
  if (top + headH + tipH >= groundY) return null;
  return { x: s.x - Math.floor(w / 2), y: top, w, h: headH + tipH };
}

// ==========================================================================
// Floor webs (webs room) — sticky patches on the ground.
// ==========================================================================

export type FloorWeb = { id: string; segIndex: number; x: number };

export function generateFloorWebs(segs: Cave2Segment[], worldSeed: number): FloorWeb[] {
  const rnd = makeRng((worldSeed ^ 0xfeed1e) >>> 0);
  const out: FloorWeb[] = [];
  for (const seg of segs) {
    if (seg.kind !== "webs") continue;
    const count = 2 + Math.floor(rnd() * 3); // 2–4
    for (let i = 0; i < count; i++) {
      const slot = seg.x + 70 + Math.round((seg.w - 140) * ((i + 0.5) / count));
      const jitter = Math.round((rnd() - 0.5) * 40);
      out.push({ id: `web-${seg.index}-${i}`, segIndex: seg.index, x: slot + jitter });
    }
  }
  return out;
}

export const FLOOR_WEB_HALF_W = 12;

export function drawFloorWeb(ctx: CanvasRenderingContext2D, sx: number, groundY: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Sticky mat: pale radial strokes on the floor.
  ctx.strokeStyle = "rgba(230, 235, 245, 0.55)";
  ctx.lineWidth = 1;
  const gy = groundY - 1;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI;
    const dx = Math.cos(a) * FLOOR_WEB_HALF_W;
    const dy = Math.sin(a) * 5;
    ctx.moveTo(sx, gy);
    ctx.lineTo(sx + dx, gy + dy);
  }
  ctx.stroke();
  // Concentric arcs.
  ctx.beginPath();
  for (let r = 4; r <= FLOOR_WEB_HALF_W; r += 4) {
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI + (i / 12) * Math.PI;
      const x = sx + Math.cos(a) * r;
      const y = gy + Math.sin(a) * (r * 0.35);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // A few silk knots.
  ctx.fillStyle = "rgba(240, 245, 255, 0.7)";
  ctx.fillRect(sx - 1, gy - 1, 1, 1);
  ctx.fillRect(sx + 4, gy - 1, 1, 1);
  ctx.fillRect(sx - 5, gy - 1, 1, 1);
  ctx.restore();
}

/** Draw the dense wall-and-ceiling webs that fill a "webs" segment. */
export function drawWebsRoomOverlay(
  ctx: CanvasRenderingContext2D,
  seg: Cave2Segment,
  camX: number,
  groundY: number,
) {
  const dxL = Math.round(seg.x - camX);
  const w = seg.w;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.strokeStyle = "rgba(220, 225, 235, 0.32)";
  ctx.lineWidth = 1;

  const drawCornerWeb = (cx: number, cy: number, size: number, dir: 1 | -1, down: 1 | -1) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * (Math.PI / 2);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * size * dir, cy + Math.sin(a) * size * down);
    }
    for (let r = size * 0.3; r < size; r += size * 0.22) {
      for (let i = 0; i <= 6; i++) {
        const a = (i / 5) * (Math.PI / 2);
        const x = cx + Math.cos(a) * r * dir;
        const y = cy + Math.sin(a) * r * down;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };
  // Top-left / top-right ceiling corners of the room.
  drawCornerWeb(dxL + 2, CAVE2_CEILING + 2, 36, 1, 1);
  drawCornerWeb(dxL + w - 2, CAVE2_CEILING + 2, 36, -1, 1);
  // Bottom corners (against the floor).
  drawCornerWeb(dxL + 2, groundY - 2, 24, 1, -1);
  drawCornerWeb(dxL + w - 2, groundY - 2, 24, -1, -1);
  // Mid ceiling drapes.
  for (let i = 0; i < 3; i++) {
    const cx = dxL + 60 + i * 100;
    drawCornerWeb(cx, CAVE2_CEILING + 2, 22, 1, 1);
    drawCornerWeb(cx + 30, CAVE2_CEILING + 2, 22, -1, 1);
  }
  ctx.restore();
}

// ==========================================================================
// Big spider (used when the player fails the web trap).
// ==========================================================================

export function drawBigSpider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  legPhase: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const wig = Math.sin(legPhase) > 0 ? 1 : 0;
  ctx.fillStyle = "#0a0a0c";
  // Body
  ctx.fillRect(cx - 4, cy - 3, 8, 6);
  ctx.fillRect(cx - 5, cy - 2, 10, 4);
  ctx.fillRect(cx - 3, cy - 4, 6, 1);
  // Fangs
  ctx.fillStyle = "#e0e0e6";
  ctx.fillRect(cx - 2, cy + 3, 1, 2);
  ctx.fillRect(cx + 1, cy + 3, 1, 2);
  // Eyes
  ctx.fillStyle = "#e04a2a";
  ctx.fillRect(cx - 3, cy - 2, 1, 1);
  ctx.fillRect(cx - 1, cy - 2, 1, 1);
  ctx.fillRect(cx + 1, cy - 2, 1, 1);
  ctx.fillRect(cx + 3, cy - 2, 1, 1);
  // Legs — 4 per side
  ctx.fillStyle = "#0a0a0c";
  for (let side = -1 as -1 | 1; side <= 1; side = (side + 2) as -1 | 1) {
    for (let i = 0; i < 4; i++) {
      const jitter = ((i + (side === 1 ? 2 : 0)) % 2) === 0 ? wig : -wig;
      const y0 = cy - 3 + i * 2;
      ctx.fillRect(cx + side * 5, y0 + jitter, side * 3, 1);
      ctx.fillRect(cx + side * 8, y0 + 1 + jitter, side * 3, 1);
    }
    if (side === 1) break;
  }
  ctx.restore();
}

// ==========================================================================
// Centipede (centipede room) — long segmented enemy patrolling the room.
// ==========================================================================

export type CentipedePhase = "hunt" | "strike" | "flee";
export type CentipedeVariant = "diver" | "wall";
export type Centipede = {
  id: string;
  segIndex: number;
  variant: CentipedeVariant;
  hp: number;
  maxHp: number;
  head: { x: number; y: number };
  phase: CentipedePhase;
  phaseUntil: number; // performance.now() ms — safety timeout per phase
  strikeTX: number;
  strikeTY: number;
  // Wall-serpent oscillation state.
  waveT: number;
  waveBaseY: number;
  retreating: boolean;
  // Wall serpent — becomes true after damaging the player; slowed while true.
  slowUntil: number; // performance.now() ms
  // Only active centipedes chase the player and are damaged/rendered.
  // Others wait dormant (hidden in the dark) until an active one dies.
  active: boolean;
  // Per-instance visual variation.
  sizeMul: number; // 0.85..1.20
  tintShift: number; // -1..+1 hue shift into cooler/warmer tones
  // Wall serpent: smoothed movement direction (turn-rate limited).
  moveDirX: number;
  moveDirY: number;
  // One-shot SFX event emitted by updateCentipede, consumed by game.tsx.
  // "diveStrike" — diver just entered strike phase.
  // "wallAttack" — wall serpent just committed to attacking (stopped retreating).
  pendingSfx: null | "diveStrike" | "wallAttack";
  // Wall serpent: next time we should re-emit an attack roar while pursuing.
  nextAttackSfxAt: number;
  body: Array<{ x: number; y: number }>;
  facing: 1 | -1;
  dead: boolean;
};



export const CENTIPEDE_MAX_HP = 3; // diver
export const CENTIPEDE_WALL_MAX_HP = 15; // wall serpent
export const CENTIPEDE_BODY_LEN = 12;
const CENTIPEDE_WALL_BODY_LEN = 18;
const CENTIPEDE_SEG_SPACING = 8;
const CENTIPEDE_SPEED_HUNT = 155; // px/s — cruising along the ceiling toward player
const CENTIPEDE_SPEED_STRIKE = 480; // px/s — lunge attack (fast dive)
const CENTIPEDE_SPEED_FLEE = 240; // px/s — retreat straight up
const CENTIPEDE_WALL_FOLLOW_SPEED = 135; // px/s — chases along the wall
const CENTIPEDE_WALL_RETREAT_SPEED = 130; // px/s — backing away
const CENTIPEDE_HEAD_R = 7;

// Player must be within this horizontal distance for the centipede to notice
// them. Outside this range the centipede rests / hides in the dark.
export const CENTIPEDE_SIGHT_RANGE = 280;
/** Player is considered "in sight" and the centipede is actively hunting. */
export function centipedeIsAwake(c: Centipede, playerX: number): boolean {
  if (c.dead || !c.active) return false;
  return Math.abs(playerX - c.head.x) <= CENTIPEDE_SIGHT_RANGE;
}

export function generateCentipedes(segs: Cave2Segment[], worldSeed: number): Centipede[] {
  const rnd = makeRng((worldSeed ^ 0xcea71) >>> 0);
  const out: Centipede[] = [];
  let firstDiver = true;
  let firstWall = true;
  for (const seg of segs) {
    if (seg.kind !== "centipede") continue;
    // Diver — lunges from the ceiling.
    {
      const startX = seg.x + seg.w * 0.5;
      const startY = CAVE2_CEILING + 12;
      const body: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < CENTIPEDE_BODY_LEN; i++) {
        body.push({ x: startX - (i + 1) * CENTIPEDE_SEG_SPACING, y: startY });
      }
      out.push({
        id: `cent-${seg.index}-diver`,
        segIndex: seg.index,
        variant: "diver",
        hp: CENTIPEDE_MAX_HP,
        maxHp: CENTIPEDE_MAX_HP,
        head: { x: startX, y: startY },
        phase: "hunt",
        phaseUntil: 0,
        strikeTX: startX,
        strikeTY: startY,
        waveT: 0,
        waveBaseY: startY,
        retreating: false,
        slowUntil: 0,
        active: true,
        sizeMul: 0.9 + rnd() * 0.3,
        tintShift: (rnd() - 0.5) * 2,
        moveDirX: 0,
        moveDirY: 1,
        pendingSfx: null,
        nextAttackSfxAt: 0,
        body,
        facing: rnd() < 0.5 ? 1 : -1,
        dead: false,

      });
      firstDiver = false;
    }
    // Wall serpent — snakes along the back wall following the player.
    {
      const startX = seg.x + seg.w * (0.25 + rnd() * 0.5);
      const baseY = CAVE2_CEILING + 60 + rnd() * 40;
      const body: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < CENTIPEDE_WALL_BODY_LEN; i++) {
        body.push({ x: startX - (i + 1) * CENTIPEDE_SEG_SPACING, y: baseY });
      }
      out.push({
        id: `cent-${seg.index}-wall`,
        segIndex: seg.index,
        variant: "wall",
        hp: CENTIPEDE_WALL_MAX_HP,
        maxHp: CENTIPEDE_WALL_MAX_HP,
        head: { x: startX, y: baseY },
        phase: "hunt",
        phaseUntil: 0,
        strikeTX: startX,
        strikeTY: baseY,
        waveT: rnd() * 6.28,
        waveBaseY: baseY,
        retreating: false,
        slowUntil: 0,
        active: true,
        sizeMul: 0.9 + rnd() * 0.3,
        tintShift: (rnd() - 0.5) * 2,
        moveDirX: 1,
        moveDirY: 0,
        pendingSfx: null,
        nextAttackSfxAt: 0,
        body,
        facing: 1,
        dead: false,

      });
      firstWall = false;
    }
  }
  return out;
}


export function updateCentipede(
  c: Centipede,
  dt: number,
  nowMs: number,
  playerX: number,
  playerY: number,
  seg: Cave2Segment,
  groundY: number,
) {
  if (c.dead || !c.active) return;
  // Player must be within sight range — otherwise the centipede rests in the dark.
  if (Math.abs(playerX - c.head.x) > CENTIPEDE_SIGHT_RANGE) return;
  const ceilY = CAVE2_CEILING + 12;
  let tx: number, ty: number, speed: number;

  // ---- Wall serpent: slither along the back wall, follow player, retreat ----
  if (c.variant === "wall") {
    c.waveT += dt;
    // Post-hit slowdown: after damaging the player, back off slowly for a while.
    const slowed = nowMs < c.slowUntil;
    // Normally only allowed to retreat after taking 3+ hits.
    const canRetreat = slowed || c.maxHp - c.hp >= 3;
    if (!canRetreat) c.retreating = false;
    if (slowed) c.retreating = true;
    const wasRetreating = c.retreating;
    if (!slowed && nowMs >= c.phaseUntil) {
      c.retreating = canRetreat && !c.retreating && Math.random() < 0.55;
      c.phaseUntil = nowMs + (c.retreating ? 1400 + Math.random() * 900 : 3200 + Math.random() * 1800);
    }
    // Detect transition: (retreating|slowed) → attacking again = commit to a strike.
    if (wasRetreating && !c.retreating && !slowed) {
      c.pendingSfx = "wallAttack";
      c.nextAttackSfxAt = nowMs + 3200 + Math.random() * 1800;
    }
    // Periodic roar while actively pursuing so the player always hears it coming.
    if (!c.retreating && !slowed && nowMs >= c.nextAttackSfxAt) {
      c.pendingSfx = "wallAttack";
      c.nextAttackSfxAt = nowMs + 3500 + Math.random() * 2500;
    }

    if (c.retreating) {
      const away = c.head.x >= playerX ? 1 : -1;
      tx = c.head.x + away * 260;
      speed = slowed ? CENTIPEDE_WALL_RETREAT_SPEED * 0.45 : CENTIPEDE_WALL_RETREAT_SPEED;
    } else {
      tx = playerX;
      speed = CENTIPEDE_WALL_FOLLOW_SPEED;
    }
    // Sinusoidal vertical wave around a base line that drifts toward the player.
    c.waveBaseY += (Math.max(CAVE2_CEILING + 40, Math.min(groundY - 40, playerY - 10)) - c.waveBaseY) * Math.min(1, dt * 1.2);
    ty = c.waveBaseY + Math.sin(c.waveT * 2.4) * 22;
  }
  // ---- Diver: hunt along ceiling → strike → flee ----
  else if (c.phase === "flee") {
    tx = c.head.x;
    ty = ceilY;
    speed = CENTIPEDE_SPEED_FLEE;
    if (Math.abs(c.head.y - ty) < 3 || nowMs > c.phaseUntil) {
      c.phase = "hunt";
      c.phaseUntil = nowMs + 350;
    }
  } else if (c.phase === "hunt") {
    tx = playerX;
    ty = ceilY + 6;
    speed = CENTIPEDE_SPEED_HUNT;
    const closeX = Math.abs(playerX - c.head.x) < 34;
    const nearCeil = Math.abs(c.head.y - ceilY) < 34;
    if (nowMs >= c.phaseUntil && closeX && nearCeil) {
      c.phase = "strike";
      c.phaseUntil = nowMs + 900;
      c.strikeTX = playerX;
      c.strikeTY = Math.min(groundY - 10, playerY - 2);
      c.pendingSfx = "diveStrike";
    }
  } else {
    tx = c.strikeTX;
    ty = c.strikeTY;
    speed = CENTIPEDE_SPEED_STRIKE;
    const dxs = tx - c.head.x;
    const dys = ty - c.head.y;
    if (Math.hypot(dxs, dys) < 16 || nowMs > c.phaseUntil) {
      c.phase = "flee";
      c.phaseUntil = nowMs + 2500;
    }
  }
  tx = Math.max(seg.x + 20, Math.min(seg.x + seg.w - 20, tx));
  ty = Math.max(ceilY, Math.min(groundY - 6, ty));
  const dx = tx - c.head.x;
  const dy = ty - c.head.y;
  const d = Math.hypot(dx, dy) || 1;
  const desiredDX = dx / d;
  const desiredDY = dy / d;
  let vx: number, vy: number;
  if (c.variant === "wall") {
    // Turn-rate limited steering — the wall serpent cannot snap direction.
    // Slew current moveDir toward desired at a fixed angular rate.
    const curLen = Math.hypot(c.moveDirX, c.moveDirY) || 1;
    let cx = c.moveDirX / curLen;
    let cy = c.moveDirY / curLen;
    const curAng = Math.atan2(cy, cx);
    const desAng = Math.atan2(desiredDY, desiredDX);
    let diff = desAng - curAng;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    // Slower turn rate when retreating (feels sluggish) or slowed.
    const slowed = nowMs < c.slowUntil;
    const turnRate = slowed ? 1.1 : (c.retreating ? 1.4 : 2.0); // rad/s
    const maxStep = turnRate * dt;
    const step = Math.max(-maxStep, Math.min(maxStep, diff));
    const newAng = curAng + step;
    cx = Math.cos(newAng);
    cy = Math.sin(newAng);
    c.moveDirX = cx;
    c.moveDirY = cy;
    vx = cx * speed;
    vy = cy * speed;
  } else {
    vx = desiredDX * speed;
    vy = desiredDY * speed;
  }
  c.head.x += vx * dt;
  c.head.y += vy * dt;
  if (Math.abs(vx) > 4) c.facing = vx > 0 ? 1 : -1;
  // Body follow — each segment chases the previous with spacing.
  let prev = c.head;
  for (const b of c.body) {
    const bdx = b.x - prev.x;
    const bdy = b.y - prev.y;
    const bd = Math.hypot(bdx, bdy) || 1;
    if (bd > CENTIPEDE_SEG_SPACING) {
      const k = (bd - CENTIPEDE_SEG_SPACING) / bd;
      b.x -= bdx * k;
      b.y -= bdy * k;
    }
    prev = b;
  }
}


export function centipedeHeadHitBox(c: Centipede) {
  if (c.dead) return null;
  return { x: c.head.x - CENTIPEDE_HEAD_R, y: c.head.y - CENTIPEDE_HEAD_R, w: CENTIPEDE_HEAD_R * 2, h: CENTIPEDE_HEAD_R * 2 };
}

/** Full body hit test for pickaxe clicks — click near ANY segment lands a hit. */
export function centipedeClickHit(c: Centipede, wx: number, wy: number): boolean {
  if (c.dead) return false;
  const d0 = Math.hypot(c.head.x - wx, c.head.y - wy);
  if (d0 <= 10) return true;
  for (const b of c.body) {
    if (Math.hypot(b.x - wx, b.y - wy) <= 8) return true;
  }
  return false;
}

export function drawCentipede(
  ctx: CanvasRenderingContext2D,
  c: Centipede,
  camX: number,
  now: number,
) {
  if (c.dead) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Per-instance color tint — precomputed once per centipede below.
  // Cache tinted palette on the instance so we skip color math per-frame.
  type Palette = { plateA: string; plateB: string; plateC: string; skullA: string; skullB: string };
  type CentInternal = Centipede & { __pal?: Palette };
  const ci = c as CentInternal;
  if (!ci.__pal) {
    // Warm shift → more orange/red; cool shift → deeper brown/purple.
    const s = c.tintShift;
    const shift = (r: number, g: number, b: number) => {
      const rr = Math.max(0, Math.min(255, Math.round(r + s * 30)));
      const gg = Math.max(0, Math.min(255, Math.round(g + s * 10)));
      const bb = Math.max(0, Math.min(255, Math.round(b - s * 12)));
      return `rgb(${rr},${gg},${bb})`;
    };
    ci.__pal = {
      plateA: shift(0x3a, 0x1a, 0x10),
      plateB: shift(0x5a, 0x28, 0x18),
      plateC: shift(0x2a, 0x10, 0x08),
      skullA: shift(0x4a, 0x20, 0x10),
      skullB: shift(0x7a, 0x3a, 0x1a),
    };
  }
  const pal = ci.__pal!;
  const M = c.sizeMul;
  const t = now / 1000;
  // Body — dark red-brown segments back to front.
  for (let i = c.body.length - 1; i >= 0; i--) {
    const b = c.body[i];
    const sx = Math.round(b.x - camX);
    const sy = Math.round(b.y);
    const r = Math.max(3, Math.round((5 - Math.floor(i / 4)) * M));
    // Segment plate
    ctx.fillStyle = pal.plateA;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    ctx.fillStyle = pal.plateB;
    ctx.fillRect(sx - r + 1, sy - r + 1, r * 2 - 2, r - 1);
    ctx.fillStyle = pal.plateC;
    ctx.fillRect(sx - r, sy + r - 1, r * 2, 1);
    // Legs — wiggling on both sides
    const wig = Math.sin(t * 12 + i * 0.6) > 0 ? 1 : 0;
    ctx.fillStyle = pal.plateC;
    ctx.fillRect(sx - r - 2, sy - 1 + wig, 2, 1);
    ctx.fillRect(sx + r, sy - 1 + wig, 2, 1);
    ctx.fillRect(sx - r - 3, sy + wig, 1, 1);
    ctx.fillRect(sx + r + 2, sy + wig, 1, 1);
  }
  // Head
  const hx = Math.round(c.head.x - camX);
  const hy = Math.round(c.head.y);
  const fd = c.facing;
  const hw = Math.round(8 * M); // half-width
  const hh = Math.round(5 * M); // half-height (top half)
  // Skull plate
  ctx.fillStyle = pal.skullA;
  ctx.fillRect(hx - hw, hy - hh - 2, hw * 2, hh + 5);
  ctx.fillStyle = pal.skullB;
  ctx.fillRect(hx - hw + 1, hy - hh - 1, hw * 2 - 2, 3);
  // Big gaping mouth — opens/closes subtly, wider during a strike.
  const openBoost = c.phase === "strike" ? 3 : 0;
  const mouthOpen = Math.round((3 + openBoost + (Math.sin(t * 10) > 0 ? 1 : 0)) * M);
  ctx.fillStyle = "#000";
  ctx.fillRect(hx - hw + 1, hy - 1, hw * 2 - 2, mouthOpen + 4);
  // Inner throat glow
  ctx.fillStyle = "#3a0000";
  ctx.fillRect(hx - hw + 3, hy, hw * 2 - 6, mouthOpen + 2);
  // Fangs — upper row
  ctx.fillStyle = "#f0e0b0";
  ctx.fillRect(hx - hw + 2, hy - 1, 2, 3);
  ctx.fillRect(hx - 2, hy - 1, 2, 4);
  ctx.fillRect(hx + 1, hy - 1, 2, 4);
  ctx.fillRect(hx + hw - 3, hy - 1, 2, 3);
  // Fangs — lower row
  const lowFangY = hy + mouthOpen + 2;
  ctx.fillStyle = "#d8c090";
  ctx.fillRect(hx - hw + 3, lowFangY, 2, 2);
  ctx.fillRect(hx - 1, lowFangY, 2, 3);
  ctx.fillRect(hx + hw - 5, lowFangY, 2, 2);
  // Mandibles on the leading side
  ctx.fillStyle = "#e0d090";
  ctx.fillRect(hx + fd * (hw - 2), hy + 2, 2, 3);
  ctx.fillRect(hx + fd * (hw - 1), hy + 4, 1, 2);
  // Head legs
  const wig = Math.sin(t * 14) > 0 ? 1 : 0;
  ctx.fillStyle = "#2a1008";
  ctx.fillRect(hx - hw - 2, hy + wig, 2, 1);
  ctx.fillRect(hx + hw, hy + wig, 2, 1);
  ctx.restore();
}
