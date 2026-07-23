import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";


import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { getActiveSlot, loadSlots, updateSlotAppearance, type Character } from "@/lib/characters";
import { flushPlayerSaveSync, waitForPlayerSaveReady } from "@/lib/player-sync";
import {
  BEARD_STYLES,
  BOOT_COLORS,
  DEFAULT_APPEARANCE,
  HAIR_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SPRITE_H,
  SPRITE_W,
  drawCharacter,
  shade,
  type Appearance,
  type BeardStyle,
  type HairStyle,
} from "@/lib/appearance";
import sharkFinAsset from "@/assets/shark-fin.png.asset.json";
import sharkFullAsset from "@/assets/shark-full.png.asset.json";
import beachBgAsset from "@/assets/beach-bg.png.asset.json";
import caveEntranceAsset from "@/assets/cave-entrance.png.asset.json";

import spearIconAsset from "@/assets/spear-icon.png.asset.json";
import axeIconAsset from "@/assets/axe-icon.png.asset.json";
import hoeIconAsset from "@/assets/hoe-icon.png.asset.json";
import pickIconUrl from "@/assets/pick-icon.png";
import seedIconUrl from "@/assets/seed-icon.png";

import torchIconAsset from "@/assets/torch-icon.png.asset.json";
import copperPickIconAsset from "@/assets/copper-pick-icon.png.asset.json";
import woodPanelBg from "@/assets/wood-panel-bg.jpg";

import uiBuildAsset from "@/assets/ui-build.png.asset.json";
import uiMapaAsset from "@/assets/ui-mapa.png.asset.json";
import ironOreAsset from "@/assets/iron-ore-cave.png.asset.json";
import uiCameraAsset from "@/assets/ui-camera.png.asset.json";
import stoneBgAsset from "@/assets/stone-bg.png.asset.json";
import uiConfigAsset from "@/assets/ui-config.png.asset.json";
import uiCustomAsset from "@/assets/ui-custom.png.asset.json";
import uiMenuAsset from "@/assets/ui-menu.png.asset.json";
import uiMissoesAsset from "@/assets/ui-missoes.png.asset.json";
import uiSetinhaAbrirAsset from "@/assets/ui-setinha-abrir.png.asset.json";
import uiSetinhaFecharAsset from "@/assets/ui-setinha-fechar.png.asset.json";
import {
  getItemVariantPixels,
  renderItemPixelsToDataURL,
  subscribeItemOverrides,
  getItemOverridesVersion,
  resolveItemPixelColor,
  type ItemKind,
  ITEM_KINDS,
} from "@/lib/items";
import { BAKED_ICON_PIXELS } from "@/lib/item-icon-defaults";
import { getItemIconImage } from "@/lib/item-icon-image-cache";
import { drawHeldTool, HELD_ANCHOR } from "@/lib/held-defaults";
import {
  CAVE2_W,
  CAVE2_ENTRY_X,
  CAVE2_RETURN_X,
  CAVE2_MAX_BREATH,
  CAVE2_MAX_HEARTS,
  CAVE2_HIT_INVULN_MS,
  CAVE2_SEG_W,
  CAVE2_PIT_DEPTH,
  CAVE2_WATER_PAD,
  CAVE2_RESET_KEY,
  drawCave2Scene,
  generateCave2Layout,
  generateStalactites,
  generateBats,
  batHitBox,
  hasGroundAt,
  isOverPitGap,
  isOverWaterPool,
  isSubmergedAt,
  segmentAt,
  stalactiteHitBox,
  stalagmiteHitBoxes,
  waterDepthAt,
  generateFloorWebs,
  drawFloorWeb,
  FLOOR_WEB_HALF_W,
  drawBigSpider,
  generateCentipedes,
  updateCentipede,
  centipedeHeadHitBox,
  centipedeClickHit,
  drawCentipede,
  centipedeIsAwake,


  
  type Cave2Segment,
  type Stalactite,
  type Bat,
  type FloorWeb,
  type Centipede,
} from "@/lib/cave2";

import {
  drawAnvil,
  drawCaveEntranceRaw,
  drawChest,
  drawFurnace,
  drawSawBench,
  drawWorkshopBench,
  getSceneryOverride,
  paintScenery,
  paintSceneryFor,
  type SceneryKind,
} from "@/lib/scenery";
import { useSyncExternalStore } from "react";
import ambientWaterAsset from "@/assets/ambient-water.mp3.asset.json";
import furnaceLoopAsset from "@/assets/furnace-loop.mp3.asset.json";
import caveAmbientAsset from "@/assets/cave-ambient.mp3.asset.json";
import underwaterAmbientAsset from "@/assets/underwater-ambient.mp3.asset.json";
import walkSfxAsset from "@/assets/walk.mp3.asset.json";
import walkSandSfxAsset from "@/assets/walk-sand.mp3.asset.json";

const islandAmbientUrl = "/sfx/ambiente-ilha.mp3";
const caveAmbientLoopUrl = "/sfx/caverna.mp3";
const footstepLoopUrl = "/sfx/andar.mp3";
import hammerSfxAsset from "@/assets/hammer-hit.mp3.asset.json";
import pickSfxAsset from "@/assets/pick-hit.mp3.asset.json";
// Centipede sounds are served from /public/sfx/ (previous asset pointers were
// pinned to a stale project id and 404'd, silencing the cave).
const centipedeGrowlAsset = { url: "/sfx/centipede-growl.mp3" };
const lacraiaDescendoAsset = { url: "/sfx/lacraia-descendo.mp3" };
const lacraiaParedeAtacando1Asset = { url: "/sfx/lacraia-parede-atacando.mp3" };
const lacraiaParedeAtacando2Asset = { url: "/sfx/lacraia-parede-atacando2.mp3" };
const lacraiaWalkingAsset = { url: "/sfx/lacraia-walking.mp3" };
// No dedicated death sample yet — reuse an attack cry as fallback.
const lacraiaDeathAsset = { url: "/sfx/lacraia-parede-atacando2.mp3" };
import jumpSfxAsset from "@/assets/jump.mp3.asset.json";
import woodHitSfxAsset from "@/assets/wood-hit.mp3.asset.json";
import waterSplashSfxAsset from "@/assets/water-splash.mp3.asset.json";
import { createLoop, createReverbLoop, playOneShot, playOneShotReverb, type SfxLoop } from "@/lib/sfx";



// Kick off image preloads at module import so the browser starts fetching
// the tropical backdrop and shark sprites before the component even mounts.
// This avoids the palm trees / islands popping in a few seconds after the
// player reaches the beach.
const PRELOADED_IMAGES: HTMLImageElement[] = [];
if (typeof window !== "undefined") {
  for (const url of [beachBgAsset.url, sharkFinAsset.url, sharkFullAsset.url, caveEntranceAsset.url]) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    PRELOADED_IMAGES.push(img);
  }
}


export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "In-game — Pixel Realms" },
      { name: "description", content: "Explore the Whispering Meadows in Pixel Realms." },
    ],
  }),
  component: GamePage,
});

// Small icon component reused by the hotbar and the workbench crafting menu
// so both surfaces render the exact same miniature for each inventory kind.
type SlotIconKind =
  | "stone" | "wood" | "seed"
  | "axe" | "hoe" | "pick" | "copperPick" | "copperHammer" | "spear"
  | "berrySeed" | "palmSeed" | "mushroom" | "herb"
  | "coal" | "copper" | "bronze" | "iron" | "copperMetal" | "bronzeMetal" | "ironMetal" | "copperBar" | "bronzeBar" | "ironBar" | "torch";

function SlotIcon({ kind, size = "md" }: { kind: SlotIconKind; size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5 sm:h-6 sm:w-6";
  const imgStyle = { imageRendering: "pixelated" as const };
  // Admin-drawn override: if this item has custom pixel art in the admin
  // panel, render it here instead of the default asset/CSS shape. The same
  // override is reused everywhere the item shows up (hotbar, crafting menu).
  useSyncExternalStore(subscribeItemOverrides, getItemOverridesVersion, () => 0);
  // Fall back to the baked-in default pixel map (hand-drawn art promoted
  // into code) when the player hasn't set their own override.
  const iconPixels =
    getItemVariantPixels(kind as ItemKind, "icon") ??
    BAKED_ICON_PIXELS[kind as ItemKind];
  if (iconPixels) {
    const url = renderItemPixelsToDataURL(iconPixels);
    if (url) {
      return (
        <img
          src={url}
          alt=""
          aria-hidden
          className={`${dim} object-contain`}
          style={imgStyle}
        />
      );
    }
  }
  // Picareta and lança miniatures both tilt diagonally like "\" (top-left to
  // bottom-right) so the tool silhouette reads well in a small square.
  const tiltStyle = {
    ...imgStyle,
    transform: "rotate(-45deg)",
  } as const;
  if (kind === "stone") {
    return (
      <span aria-hidden className="inline-block h-3 w-3 sm:h-4 sm:w-4 bg-[#8a8a94] border border-[#4a4a54]" />
    );
  }
  if (kind === "wood") {
    return (
      <span aria-hidden className="inline-block h-3 w-4 sm:h-4 sm:w-5 bg-[#7a4a24] border border-[#3a2010]" />
    );
  }
  if (kind === "seed") {
    return <img src={seedIconUrl} alt="" aria-hidden className={`${dim} object-contain`} style={imgStyle} />;
  }
  if (kind === "axe") {
    return <img src={axeIconAsset.url} alt="" aria-hidden className={`${dim} object-contain`} style={imgStyle} />;
  }
  if (kind === "hoe") {
    return <img src={hoeIconAsset.url} alt="" aria-hidden className={`${dim} object-contain`} style={imgStyle} />;
  }
  if (kind === "pick") {
    return <img src={pickIconUrl} alt="" aria-hidden className={`${dim} object-contain`} style={tiltStyle} />;
  }
  if (kind === "copperPick") {
    return <img src={copperPickIconAsset.url} alt="" aria-hidden className={`${dim} object-contain`} style={tiltStyle} />;
  }
  if (kind === "copperHammer") {
    // Placeholder icon: a copper-tinted square with a darker "head" stripe
    // on top. Admins can override this via the Admin Panel like any other
    // item; a dedicated asset can replace it later.
    return (
      <span aria-hidden className={`${dim} inline-block relative`}>
        <span className="absolute left-1/2 -translate-x-1/2 top-0 h-1/2 w-full bg-[#b46b3a] border border-[#5a2a10]" />
        <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1/2 w-[25%] bg-[#7a4a24] border border-[#3a2010]" />
      </span>
    );
  }

  if (kind === "spear") {
    return <img src={spearIconAsset.url} alt="" aria-hidden className={`${dim} object-contain`} style={tiltStyle} />;
  }
  if (kind === "berrySeed") {
    return (
      <span aria-hidden className="inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-[#c94b4b] border border-[#5a1010]" />
    );
  }
  if (kind === "palmSeed") {
    return (
      <span aria-hidden className="inline-block h-3 w-4 sm:h-4 sm:w-5 rounded-full bg-[#7a5432] border border-[#3a220e]" />
    );
  }
  if (kind === "mushroom") {
    return (
      <span aria-hidden className={`inline-flex items-end justify-center ${dim}`} style={imgStyle}>
        <span className="relative inline-block h-3 w-4 sm:h-4 sm:w-5">
          <span className="absolute inset-x-0 top-0 h-1.5 sm:h-2 bg-[#c94b4b] border border-[#5a1010] rounded-t-full" />
          <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1.5 sm:h-2 w-1.5 sm:w-2 bg-[#e8dbb0] border border-[#8a7a4a]" />
        </span>
      </span>
    );
  }
  if (kind === "coal") {
    return (
      <span aria-hidden className="inline-block h-3 w-3 sm:h-4 sm:w-4 bg-[#1a1416] border border-[#000]" style={{ boxShadow: "inset -1px -1px 0 #2a2226" }} />
    );
  }
  if (kind === "copper") {
    return (
      <span aria-hidden className="inline-block h-3 w-3 sm:h-4 sm:w-4 bg-[#b46b3a] border border-[#5a2a10]" style={{ boxShadow: "inset -1px -1px 0 #e4a065" }} />
    );
  }
  if (kind === "bronze") {
    // Same CSS shape as copper ore — admins can then repaint via the
    // Admin Panel's item editor. `captureDefaultIconPixels("bronze")`
    // returns the exact same pixel map as copper so the editor opens
    // pre-populated for editing.
    return (
      <span aria-hidden className="inline-block h-3 w-3 sm:h-4 sm:w-4 bg-[#b46b3a] border border-[#5a2a10]" style={{ boxShadow: "inset -1px -1px 0 #e4a065" }} />
    );
  }
  if (kind === "copperMetal") {
    return (
      <span aria-hidden className={`inline-flex items-center justify-center ${dim}`} style={imgStyle}>
        <span className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 bg-[#c97a45] border border-[#5a2a10] rounded-sm" style={{ boxShadow: "inset -1px -1px 0 #ffb070, inset 1px 1px 0 #ffd6a0" }} />
      </span>
    );
  }
  if (kind === "bronzeMetal") {
    return (
      <span aria-hidden className={`inline-flex items-center justify-center ${dim}`} style={imgStyle}>
        <span className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 bg-[#a88245] border border-[#4a3418] rounded-sm" style={{ boxShadow: "inset -1px -1px 0 #e8c880, inset 1px 1px 0 #f4dfa0" }} />
      </span>
    );
  }
  if (kind === "copperBar") {
    return (
      <span aria-hidden className={`inline-flex items-center justify-center ${dim}`} style={imgStyle}>
        <span className="inline-block h-2 w-4 sm:h-2.5 sm:w-5 bg-[#d47a3a] border border-[#5a2a10]" style={{ boxShadow: "inset -1px -1px 0 #ffb070, inset 1px 1px 0 #ffd6a0" }} />
      </span>
    );
  }
  if (kind === "bronzeBar") {
    return (
      <span aria-hidden className={`inline-flex items-center justify-center ${dim}`} style={imgStyle}>
        <span className="inline-block h-2 w-4 sm:h-2.5 sm:w-5 bg-[#b58c4a] border border-[#4a3418]" style={{ boxShadow: "inset -1px -1px 0 #e8c880, inset 1px 1px 0 #f4dfa0" }} />
      </span>
    );
  }
  if (kind === "ironBar") {
    return (
      <span aria-hidden className={`inline-flex items-center justify-center ${dim}`} style={imgStyle}>
        <span className="inline-block h-2 w-4 sm:h-2.5 sm:w-5 bg-[#a8b0bc] border border-[#2a2f38]" style={{ boxShadow: "inset -1px -1px 0 #d8dee6, inset 1px 1px 0 #eef1f6" }} />
      </span>
    );
  }

  if (kind === "torch") {
    return <img src={torchIconAsset.url} alt="" aria-hidden className={`${dim} object-contain`} style={imgStyle} />;
  }
  // herb
  return (
    <span aria-hidden className={`inline-flex items-end justify-center ${dim}`} style={imgStyle}>
      <span className="relative inline-block h-4 w-4 sm:h-5 sm:w-5">
        <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-full w-[2px] bg-[#2f5a24]" />
        <span className="absolute left-0 top-1 h-1.5 w-2 bg-[#3a7a3a] rounded-full" />
        <span className="absolute right-0 top-2 h-1.5 w-2 bg-[#5aa84a] rounded-full" />
      </span>
    </span>
  );
}


// Virtual (internal) resolution — scaled up by CSS for that crisp pixel look.
const VW = 640;
const VH = 360;
const GROUND_Y = 280; // top of the ground surface, in virtual px
// Extra pixels of ground painted below the virtual viewport bottom so the
// player can pan the camera down (MAX_CAM_Y) without exposing background.
const GROUND_EXTRA = 160;
const HORIZON_Y = 232; // sky ↔ ocean split for the distant view
const ISLAND_LEFT = 700; // world-x where the island (sand) begins
const ISLAND_RIGHT = 4100; // world-x where the island ends
const WORLD_W = 4800; // total scrollable world width — extra room to swim
const BEACH = 260; // width of each sand beach segment
const SHARK_TRIGGER = 240; // distance past island edge that summons a shark
const SWIM_SINK = 10; // px the character sinks below the sand level while swimming
const SHARK_SPEED = 200;
const DEEP_DIST = 900; // distance past the island where the ocean is fully "deep"
const DEATH_ANIM = 1.1; // seconds of chomping before the game-over overlay appears

// Physics (virtual px / sec)
const MOVE_SPEED = 130;
const SWIM_SPEED = 78;
const JUMP_VELOCITY = -260;
const GRAVITY = 780;

// ----- Cave scene -----
const CAVE_W = 640;
const CAVE_EXIT_X = 60;    // world-x of the "way out" portal inside the cave
const CAVE_SPAWN_X = 110;  // where the player lands after entering
const CAVE_WALL_X = CAVE_W - 60; // stone wall blocking passage to deeper minerals
const CAVE_ENTRANCE_DRAW_W = 96;
const CAVE_ENTRANCE_DRAW_H = 70;
// Radius around the cave entrance where nothing (props, planted trees) may spawn.
const CAVE_ENTRANCE_CLEAR = CAVE_ENTRANCE_DRAW_W / 2 + 5;
// Ore mining: 10 HP each, regenerates 2 min after being fully mined.
const ORE_MAX_HP = 10;
const oreMaxHp = (kind: OreKind): number => (kind === "iron" ? 26 : ORE_MAX_HP);
// Regen delay is randomized per mined ore between MIN and MAX (ms).
const ORE_REGEN_MIN_MS = 90000;
const ORE_REGEN_MAX_MS = 90000;
const ROCK_MAX_HP = 8;
const ROCK_RESPAWN_MS = 45_000;
const ROCK_MIN_DROP = 3;
const ROCK_MAX_DROP = 5;
// Radius of light cast by a single torch, in virtual pixels.
const TORCH_LIGHT_RADIUS = 78;

// Hand-drawn 3×5 pixel-art digit font for crisp counters on the
// nearest-neighbor upscaled game canvas. Each glyph is 5 rows of 3-bit
// masks (top row = index 0). Only characters we actually draw are included.
const PIXEL_FONT_3x5: Record<string, number[]> = {
  "0": [0b111, 0b101, 0b101, 0b101, 0b111],
  "1": [0b010, 0b110, 0b010, 0b010, 0b111],
  "2": [0b111, 0b001, 0b111, 0b100, 0b111],
  "3": [0b111, 0b001, 0b111, 0b001, 0b111],
  "4": [0b101, 0b101, 0b111, 0b001, 0b001],
  "5": [0b111, 0b100, 0b111, 0b001, 0b111],
  "6": [0b111, 0b100, 0b111, 0b101, 0b111],
  "7": [0b111, 0b001, 0b010, 0b010, 0b010],
  "8": [0b111, 0b101, 0b111, 0b101, 0b111],
  "9": [0b111, 0b101, 0b111, 0b001, 0b111],
  "/": [0b001, 0b001, 0b010, 0b100, 0b100],
};
function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  const charW = 3;
  const charH = 5;
  const charGap = 1;
  for (let i = 0; i < text.length; i++) {
    const glyph = PIXEL_FONT_3x5[text[i]];
    if (!glyph) continue;
    const gx = x + i * (charW + charGap);
    for (let row = 0; row < charH; row++) {
      const bits = glyph[row];
      for (let col = 0; col < charW; col++) {
        if (bits & (1 << (charW - 1 - col))) ctx.fillRect(gx + col, y + row, 1, 1);
      }
    }
  }
}

// Deterministic entrance x within the island, far enough from spawn.
function computeCaveEntranceX(worldSeed: number, spawnX: number): number {
  let s = ((worldSeed ^ 0x1c0ffee) >>> 0) || 7;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const lo = ISLAND_LEFT + 200;
  const hi = ISLAND_RIGHT - 200;
  // Try several candidates until one is far enough from the spawn point.
  for (let i = 0; i < 20; i++) {
    const x = Math.round(lo + rand() * (hi - lo));
    if (Math.abs(x - spawnX) >= 520) return x;
  }
  // Fallback — push it to the far right side of the island.
  return Math.round(spawnX + 620 > hi ? spawnX - 620 : spawnX + 620);
}

// ----- Cave ores (deterministic layout per world seed) -----
export type OreKind = "coal" | "copper" | "bronze" | "iron";
export type CaveOre = { id: string; x: number; kind: OreKind };
function computeCaveOres(worldSeed: number): CaveOre[] {
  let s = ((worldSeed ^ 0x0b1e5) >>> 0) || 13;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const lo = CAVE_EXIT_X + 90;
  const hi = CAVE_WALL_X - 40;
  const kinds: OreKind[] = ["coal", "copper", "bronze"];
  const ores: CaveOre[] = [];
  // 2 of each ore type, spaced apart so they don't overlap visually.
  for (const kind of kinds) {
    for (let i = 0; i < 2; i++) {
      let x = 0;
      for (let tries = 0; tries < 30; tries++) {
        const cand = Math.round(lo + rand() * (hi - lo));
        if (ores.every((o) => Math.abs(o.x - cand) >= 42)) { x = cand; break; }
        x = cand;
      }
      ores.push({ id: `${kind}-${i}-${x}`, x, kind });
    }
  }
  return ores;
}


function GamePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ambient background sound
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 35;
    const v = window.localStorage.getItem("ambientVolume");
    return v ? Number(v) : 35;
  });
  useEffect(() => {
    const audio = new Audio(ambientWaterAsset.url);
    audio.loop = true;
    audio.volume = ambientVolume / 100;
    ambientAudioRef.current = audio;
    let started = false;
    const tryPlay = () => {
      if (started) return;
      audio.play().then(() => { started = true; }).catch(() => {});
    };
    tryPlay();
    const onInteract = () => {
      tryPlay();
      if (started) {
        window.removeEventListener("pointerdown", onInteract);
        window.removeEventListener("keydown", onInteract);
      }
    };
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      audio.pause();
      audio.src = "";
      ambientAudioRef.current = null;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const applyVol = () => {
      if (!ambientAudioRef.current) return;
      const inCave = modeRef.current === "cave" || modeRef.current === "cave2";
      ambientAudioRef.current.volume = inCave ? 0 : ambientVolume / 100;
    };
    applyVol();
    const iv = window.setInterval(applyVol, 200);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ambientVolume", String(ambientVolume));
    }
    return () => window.clearInterval(iv);
  }, [ambientVolume]);

  // Furnace ambient sound — plays when a placed furnace is actively smelting
  // and the player is nearby. Volume fades with distance.
  useEffect(() => {
    const audio = new Audio(furnaceLoopAsset.url);
    audio.loop = true;
    audio.volume = 0;
    let started = false;
    const tryPlay = () => {
      if (started) return;
      audio.play().then(() => { started = true; }).catch(() => {});
    };
    const onInteract = () => {
      tryPlay();
      if (started) {
        window.removeEventListener("pointerdown", onInteract);
        window.removeEventListener("keydown", onInteract);
      }
    };
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    tryPlay();


    const interval = window.setInterval(() => {
      if (modeRef.current !== "world") { audio.volume = 0; return; }
      const px = stateRef.current?.x ?? 0;
      const playerCX = px + 16 / 2;
      const now = Date.now();
      let nearest = Infinity;
      for (const b of builtRef.current) {
        if (b.kind !== "furnace") continue;
        if (!b.smeltJob || b.smeltJob.endsAt <= now) continue;
        const d = Math.abs((b.x + 10) - playerCX);
        if (d < nearest) nearest = d;
      }
      if (!isFinite(nearest)) { audio.volume = 0; return; }
      // Audible within ~140px, max volume at ~30px. Overall cap keeps it quiet.
      const maxRange = 140;
      const near = 30;
      let vol = 0;
      if (nearest <= near) vol = 1;
      else if (nearest < maxRange) vol = 1 - (nearest - near) / (maxRange - near);
      const cap = 0.09 * (ambientVolume / 100);
      audio.volume = Math.max(0, Math.min(1, vol)) * cap;
    }, 120);

    return () => {
      window.clearInterval(interval);
      
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientVolume]);

  // Cave + underwater ambient loops, plus walking footsteps.
  // Driven by a polling interval reading refs so we don't need to promote
  // fast-changing game-loop state into React state.
  useEffect(() => {
    const caveLoop: SfxLoop = createLoop(caveAmbientLoopUrl);
    const waterLoop: SfxLoop = createLoop(underwaterAmbientAsset.url);
    const walkLoop: SfxLoop = createLoop(footstepLoopUrl, { playbackRate: 1.0 });
    const walkSandLoop: SfxLoop = createLoop(walkSandSfxAsset.url, { playbackRate: 1.3 });
    // Separate footstep loop that runs through the shared reverb — used only
    // when the player is inside a cave so steps get the same wet tail as
    // one-shot cave sounds.
    const walkCaveLoop: SfxLoop = createReverbLoop(footstepLoopUrl, { playbackRate: 1.0, dry: 0.4, wet: 1.0 });
    const wormLoop: SfxLoop = createLoop(lacraiaWalkingAsset.url);
    const islandAmbientLoop: SfxLoop = createLoop(islandAmbientUrl);
    caveLoop.setVolume(0);
    waterLoop.setVolume(0);
    walkLoop.setVolume(0);
    walkSandLoop.setVolume(0);
    walkCaveLoop.setVolume(0);
    wormLoop.setVolume(0);
    islandAmbientLoop.setVolume(0);
    const iv = window.setInterval(() => {
      const vol = ambientVolume / 100;
      const s = stateRef.current;
      const inCave = modeRef.current === "cave" || modeRef.current === "cave2";
      const submerged = !!s && (s.swimming || (s.submersion ?? 0) > 0.4);
      caveLoop.setVolume(inCave ? vol * 0.85 : 0);
      waterLoop.setVolume(submerged ? vol * 0.7 : 0);
      islandAmbientLoop.setVolume(!inCave && !submerged ? vol * 0.55 : 0);
      const walking = !!s && s.grounded && Math.abs(s.vx ?? 0) > 1 && !submerged;
      const cx = s ? s.x + SPRITE_W / 2 : 0;
      const onSand = !inCave && !!s && (
        (cx >= BEACH_START && cx <= OCEAN_START) ||
        (cx >= OCEAN_LEFT_END && cx <= BEACH_LEFT_END)
      );
      walkLoop.setVolume(walking && !onSand && !inCave ? vol * 0.6 : 0);
      walkSandLoop.setVolume(walking && onSand ? vol * 0.45 : 0);
      walkCaveLoop.setVolume(walking && inCave ? vol * 0.55 : 0);
      // Lacraia walking loop — audible only when player is near any live
      // centipede (attacking or resting).
      let wormVol = 0;
      if (modeRef.current === "cave2" && s) {
        const playerX = s.x + SPRITE_W / 2;
        let closest = Infinity;
        for (const c of cave2CentipedesRef.current) {
          if (c.dead) continue;
          const d = Math.abs(c.head.x - playerX);
          if (d < closest) closest = d;
        }
        if (closest < 520) {
          const falloff = Math.max(0.1, 1 - closest / 520);
          wormVol = vol * 0.6 * falloff;
        }

      }
      wormLoop.setVolume(wormVol);
    }, 80);
    return () => {
      window.clearInterval(iv);
      caveLoop.dispose();
      waterLoop.dispose();
      walkLoop.dispose();
      walkSandLoop.dispose();
      walkCaveLoop.dispose();
      wormLoop.dispose();
      islandAmbientLoop.dispose();
    };

  }, [ambientVolume]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [dead, setDead] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [editingLook, setEditingLook] = useState(false);
  const zoomRef = useRef(1);
  const MIN_ZOOM = 0.6;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;
  const setZoomBoth = (z: number) => {
    zoomRef.current = z;
    setZoom(z);
  };
  const zoomIn = () =>
    setZoomBoth(Math.min(MAX_ZOOM, +(zoomRef.current + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoomBoth(Math.max(MIN_ZOOM, +(zoomRef.current - ZOOM_STEP).toFixed(2)));

  const gameStageRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);
  const toggleFullscreen = () => setIsFullscreen((v) => !v);



  const keysRef = useRef<Set<string>>(new Set());
  // Sprite's rendered bottom row is 3 px above its declared 32-tall edge, so
  // shift by 3 to plant the boots visibly into the sand instead of hovering.
  const FOOT_OFFSET = 3;
  const spawnX = Math.floor((ISLAND_LEFT + ISLAND_RIGHT) / 2 - SPRITE_W / 2);
  type SharkPhase = "idle" | "approach" | "lunge" | "retreat";
  const stateRef = useRef({
    x: spawnX,
    y: GROUND_Y - SPRITE_H + FOOT_OFFSET,
    vx: 0,
    vy: 0,
    facing: 1 as 1 | -1,
    grounded: true,
    swimming: false,
    dead: false,
    deathT: 0,
    animT: 0,
    submersion: 0,
    submersionTime: 0,
    treading: false,

    shark: {
      phase: "idle" as SharkPhase,
      x: 0,
      t: 0,
      lungeStart: 0,
      lungeEnd: 0,
      dir: 1 as 1 | -1, // 1 = comes from right, -1 = comes from left
    },
  });
  const appearanceRef = useRef<Appearance>(DEFAULT_APPEARANCE);
  const sharkFinImgRef = useRef<HTMLImageElement | null>(null);
  const sharkFullImgRef = useRef<HTMLImageElement | null>(null);
  const beachBgImgRef = useRef<HTMLImageElement | null>(null);
  const insectsRef = useRef<Insect[] | null>(null);
  const caveEntranceImgRef = useRef<HTMLImageElement | null>(null);
  const caveEntranceXRef = useRef<number>(2000);
  // "world" = outdoor island. "cave" = level 1. "cave2" = deeper procedural cave.
  const modeRef = useRef<"world" | "cave" | "cave2">("world");
  const [mode, setMode] = useState<"world" | "cave" | "cave2">("world");
  // Where the player came from in the world — used to restore position on exit.
  const caveReturnXRef = useRef<number>(0);
  // Cave ore layout (deterministic per world seed) + which ores the player mined.
  const caveOresRef = useRef<CaveOre[]>([]);
  // minedAt timestamp per ore id — regenerates ORE_REGEN_MS after mining.
  const minedOresRef = useRef<Map<string, number>>(new Map());
  // Per-ore chip damage (ore.id -> remaining HP). Missing = full HP.
  const caveOreHPRef = useRef<Map<string, number>>(new Map());
  const caveWallBrokenRef = useRef<boolean>(false);
  // Torches the player has hung inside the cave (world-x positions).
  type PlacedTorch = { id: string; x: number };
  const placedTorchesRef = useRef<PlacedTorch[]>([]);
  const placedTorchesCave2Ref = useRef<PlacedTorch[]>([]);
  const darkOffscreenRef = useRef<HTMLCanvasElement | null>(null);

  // ----- Cave 2 (procedural dungeon) -----
  const cave2SegsRef = useRef<Cave2Segment[]>([]);
  const cave2StalactitesRef = useRef<Stalactite[]>([]);
  const cave2BatsRef = useRef<Bat[]>([]);
  const cave2ClearedRef = useRef<Set<number>>(new Set());
  const cave2OresRef = useRef<CaveOre[]>([]);
  const cave2OreHPRef = useRef<Map<string, number>>(new Map());
  const cave2MinedOresRef = useRef<Map<string, number>>(new Map());
  const heartsRef = useRef<number>(CAVE2_MAX_HEARTS);
  const [hearts, setHearts] = useState<number>(CAVE2_MAX_HEARTS);
  const breathRef = useRef<number>(CAVE2_MAX_BREATH);
  const [breath, setBreath] = useState<number>(CAVE2_MAX_BREATH);
  const lastHitAtRef = useRef<number>(0);
  // Spear attack animation — set on click while holding a spear.
  // holdEndsAt === null while pointer is still down (spear stays extended,
  // aim follows the cursor). Set to a timestamp on pointer-up to trigger the
  // retract animation.
  const spearAttackRef = useRef<{ startedAt: number; angle: number; holdEndsAt: number | null } | null>(null);
  // Tool swing animation — set on click while holding pick or axe.
  const toolSwingRef = useRef<{ startedAt: number; kind: "pick" | "copperPick" | "axe"; hasHit: boolean } | null>(null);
  const lastToolSwingTimeRef = useRef<number>(0);
  // Latest pointer world position — updated on move so held spear tracks the cursor.
  const pointerWorldRef = useRef<{ x: number; y: number } | null>(null);
  const spearHitCooldownRef = useRef<Map<string, number>>(new Map());

  const lastWaterJumpAtRef = useRef<number>(0);
  const wasSwimmingRef = useRef<boolean>(false);
  const cave2DeathFlashRef = useRef<number>(0);
  const tintCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web room
  const cave2FloorWebsRef = useRef<FloorWeb[]>([]);
  const cave2ConsumedWebsRef = useRef<Set<string>>(new Set());
  type StuckWeb = { webId: string; progress: number; pullY: number; startX: number; killed?: boolean; killT?: number };
  const stuckWebRef = useRef<StuckWeb | null>(null);
  const [stuckProgress, setStuckProgress] = useState<number>(0);
  const [stuckActive, setStuckActive] = useState<boolean>(false);
  // Centipedes
  const cave2CentipedesRef = useRef<Centipede[]>([]);
  const centipedeGrowlAtRef = useRef<number>(0);




  // ----- Inventory + gatherable world state -----
  const [inventory, setInventoryRaw] = useState<{
    stones: number; wood: number; seeds: number;
    axe: number; hoe: number; pick: number; copperPick: number; copperHammer: number; spear: number;
    berrySeeds: number; palmSeeds: number; mushrooms: number; herbs: number;
    coal: number; copper: number; bronze: number; iron: number; copperMetal: number; bronzeMetal: number; ironMetal: number; copperBar: number; bronzeBar: number; ironBar: number; torches: number;
  }>({
    stones: 0, wood: 0, seeds: 0, axe: 0, hoe: 0, pick: 0, copperPick: 0, copperHammer: 0, spear: 0,
    berrySeeds: 0, palmSeeds: 0, mushrooms: 0, herbs: 0,
    coal: 0, copper: 0, bronze: 0, iron: 0, copperMetal: 0, bronzeMetal: 0, ironMetal: 0, copperBar: 0, bronzeBar: 0, ironBar: 0, torches: 0,
  });

  type Inv = typeof inventory;
  const setInventory: React.Dispatch<React.SetStateAction<Inv>> = setInventoryRaw;
  const MAX_CARRY_LOGS = 3;
  const MAX_CARRY_BARS = 3; // combined copper + bronze bars — hands are occupied
  const LOG_STACK_RANGE = 6; // dropped logs within this many pixels snap into the same pile
  const [carriedLogs, setCarriedLogs] = useState(0);
  const carriedLogsRef = useRef(0);
  carriedLogsRef.current = carriedLogs;
  // Total bars currently in the player's hands. Mirrors the wood mechanic:
  // any bar in inventory means the player is physically holding it, blocking
  // hotbar use and slowing movement. Capped at MAX_CARRY_BARS (3 total).
  const totalCarriedBars = inventory.copperBar + inventory.bronzeBar + inventory.ironBar;
  const totalCarriedBarsRef = useRef(0);
  totalCarriedBarsRef.current = totalCarriedBars;
  // Hotbar selection — which inventory item is "held" for use (e.g. seed → plant).
  type SlotKind =
    | "stone" | "wood" | "seed"
    | "axe" | "hoe" | "pick" | "copperPick" | "copperHammer" | "spear"
    | "berrySeed" | "palmSeed" | "mushroom" | "herb"
    | "coal" | "copper" | "bronze" | "iron" | "copperMetal" | "bronzeMetal" | "ironMetal" | "copperBar" | "bronzeBar" | "ironBar" | "torch";
  // Hotbar has exactly 10 slots. We surface only the items the player
  // actually owns, in a fixed priority order, and pad the rest with empty
  // slots so the UI always shows 10 boxes.
  const HOTBAR_CAPACITY = 10;
  const HOTBAR_PRIORITY: SlotKind[] = [
    "stone", "wood", "seed", "axe", "hoe", "pick", "copperPick", "copperHammer", "spear",
    "berrySeed", "palmSeed", "mushroom", "herb",
    "coal", "copper", "bronze", "iron", "copperMetal", "bronzeMetal", "ironMetal", "copperBar", "bronzeBar", "ironBar", "torch",
  ];
  const countFor = (k: SlotKind): number => {
    switch (k) {
      case "stone": return inventory.stones;
      case "wood": return inventory.wood;
      case "seed": return inventory.seeds;
      case "axe": return inventory.axe;
      case "hoe": return inventory.hoe;
      case "pick": return inventory.pick;
      case "copperPick": return inventory.copperPick;
      case "copperHammer": return inventory.copperHammer;
      case "spear": return inventory.spear;
      case "berrySeed": return inventory.berrySeeds;
      case "palmSeed": return inventory.palmSeeds;
      case "mushroom": return inventory.mushrooms;
      case "herb": return inventory.herbs;
      case "coal": return inventory.coal;
      case "copper": return inventory.copper;
      case "bronze": return inventory.bronze;
      case "iron": return inventory.iron;
      case "copperMetal": return inventory.copperMetal;
      case "bronzeMetal": return inventory.bronzeMetal;
      case "copperBar": return inventory.copperBar;
      case "bronzeBar": return inventory.bronzeBar;
      case "ironBar": return inventory.ironBar;
      case "ironMetal": return inventory.ironMetal;
      case "torch": return inventory.torches;
    }
  };

  const HOTBAR_SLOTS: (SlotKind | null)[] = (() => {
    const owned = HOTBAR_PRIORITY.filter((k) => countFor(k) > 0).slice(0, HOTBAR_CAPACITY);
    const slots: (SlotKind | null)[] = [...owned];
    while (slots.length < HOTBAR_CAPACITY) slots.push(null);
    return slots;
  })();
  const hotbarSlotsRef = useRef<(SlotKind | null)[]>(HOTBAR_SLOTS);
  hotbarSlotsRef.current = HOTBAR_SLOTS;

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const selectedSlotRef = useRef<number | null>(null);
  selectedSlotRef.current = selectedSlot;
  // Track the *kind* the player selected so index shifts caused by inventory
  // reordering (e.g. picking up a stone bumps items to the right) don't
  // silently swap what's in the player's hand.
  const selectedKindRef = useRef<SlotKind | null>(null);
  // Reconcile after each render: if the selected kind moved to a different
  // slot (or vanished from the hotbar entirely), realign the index so the
  // same item stays "in hand".
  useEffect(() => {
    const currentKind = selectedSlot != null ? HOTBAR_SLOTS[selectedSlot] ?? null : null;
    const trackedKind = selectedKindRef.current;
    if (trackedKind == null) {
      selectedKindRef.current = currentKind;
      return;
    }
    if (currentKind === trackedKind) return;
    const newIdx = HOTBAR_SLOTS.indexOf(trackedKind);
    if (newIdx === -1) {
      selectedKindRef.current = null;
      selectedSlotRef.current = null;
      setSelectedSlot(null);
    } else {
      selectedSlotRef.current = newIdx;
      setSelectedSlot(newIdx);
    }
  });
  // Carrying logs or bars occupies both hands — clear any hotbar selection
  // so the player is visibly holding what they've got and can't accidentally
  // act with a tool until they set it down / deliver it.
  useEffect(() => {
    if ((carriedLogs > 0 || totalCarriedBars > 0) && selectedSlot != null) {
      selectedSlotRef.current = null;
      setSelectedSlot(null);
      selectedKindRef.current = null;
    }
  }, [carriedLogs, totalCarriedBars, selectedSlot]);
  const [pickupFlash, setPickupFlash] = useState<string | null>(null);
  // Regen timers: taken/chopped entries carry a timestamp so we can regrow
  // pebbles and fade the stumps away over time.
  const stonesTakenRef = useRef<Map<number, number>>(new Map());
  const treesBrokenRef = useRef<Map<number, number>>(new Map());
  // Foraged bushes / mushrooms / ferns / flowers — key is `${type}:${x}`.
  const pickedPropsRef = useRef<Set<string>>(new Set());
  // Palms felled by the player — key is world-x of the palm base.
  const brokenPalmsRef = useRef<Set<number>>(new Set());
  // Per-palm timestamp of when it was felled (performance.now()). Used to
  // regrow palms naturally after PALM_REGROW_MS.
  const brokenPalmsAtRef = useRef<Map<number, number>>(new Map());
  const PALM_REGROW_MS = 120_000;
  // Extra palms planted by the player (with palmSeed) at arbitrary x on the island.
  const extraPalmsRef = useRef<PalmPos[]>([]);
  const palmHPRef = useRef<Map<number, number>>(new Map());
  const PALM_MAX_HP = 6;
  // Big forest rocks: mined with the pickaxe, drop several pebbles, then
  // regenerate elsewhere on the grass after ROCK_RESPAWN_MS.
  const rockHPRef = useRef<Map<number, number>>(new Map());
  const minedRocksRef = useRef<Map<number, number>>(new Map()); // key = worldX
  const extraRocksRef = useRef<{ x: number }[]>([]);
  type GroundLog = { id: string; x: number; droppedAt?: number };
  type GroundSeed = { id: string; x: number };
  type GroundPebble = { id: string; x: number; variant: number };
  type PlantedTree = { id: string; x: number; plantedAt: number; variant: number };
   type GroundItem = { id: string; x: number; kind: ItemKind; mode: "world" | "cave" | "cave2"; droppedAt: number };
   // Dropped items despawn after 5 minutes. If more than MAX_GROUND_ITEMS
   // are on the ground, the one closest to despawning is removed to make
   // room for the new drop.
   const DROP_LIFETIME_MS = 5 * 60 * 1000;
   const MAX_GROUND_ITEMS = 40;
  const groundLogsRef = useRef<GroundLog[]>([]);
  const groundPebblesRef = useRef<GroundPebble[]>([]);
  const groundItemsRef = useRef<GroundItem[]>([]);
  const seedsRef = useRef<GroundSeed[]>([]);
  const plantedRef = useRef<PlantedTree[]>([]);
  // Per-tree HP: a stone deals 1 damage per hit; the axe deals 3 damage per hit.
  // Key format: `n:<worldX>` for natural trees, `p:<plantedId>` for planted.
  const TREE_MAX_HP = 9;
  const HP_BAR_VIEW_RANGE = 110; // px around the player where HP bars are visible
  const treeHPRef = useRef<Map<string, number>>(new Map());
  // A single stone endures for TREE_MAX_HP swings. When charges hit 0, the next
  // hit consumes another stone from the inventory and refills to TREE_MAX_HP.
  const stoneChargesRef = useRef(0);
  // ----- Building system -----
  type BuildKind = "bench" | "workshop" | "furnace" | "chest" | "anvil";
  const BUILD_COSTS: Record<BuildKind, { wood: number; stones: number; coal: number; copper: number; bronzeMetal: number }> = {
    bench: { wood: 3, stones: 0, coal: 0, copper: 0, bronzeMetal: 0 },
    workshop: { wood: 6, stones: 3, coal: 0, copper: 0, bronzeMetal: 0 },
    // Every structure is now placed as a blueprint and completed by hauling
    // materials to it — including the furnace, which also needs coal.
    furnace: { wood: 2, stones: 20, coal: 3, copper: 0, bronzeMetal: 0 },
    chest: { wood: 4, stones: 3, coal: 0, copper: 0, bronzeMetal: 0 },
    // Anvil: wooden stump plus bronze bars.
    anvil: { wood: 1, stones: 0, coal: 0, copper: 0, bronzeMetal: 4 },
  };
  const BUILD_LABELS: Record<BuildKind, string> = {
    bench: t("build.bench"),
    workshop: t("build.workshop"),
    furnace: t("build.furnace"),
    chest: t("build.chest"),
    anvil: t("build.anvil"),
  };
  // Visual widths (px) of each build sprite — used for placement collision so
  // hitboxes match the actual art instead of a fixed radius.
  const BUILD_WIDTHS: Record<BuildKind, number> = {
    bench: 20,
    workshop: 22,
    furnace: 20,
    chest: 18,
    anvil: 16,
  };
  const buildsOverlap = (
    x1: number, k1: BuildKind,
    x2: number, k2: BuildKind,
  ): boolean => {
    const margin = 2; // tiny gap so sprites don't touch
    return x1 < x2 + BUILD_WIDTHS[k2] + margin
        && x2 < x1 + BUILD_WIDTHS[k1] + margin;
  };
  // Furnace recipe consumed at the workshop menu.
  const FURNACE_COST = { wood: 2, stones: 20, coal: 3 };
  // Smelting recipe used inside the furnace menu.
  const SMELT_COST = { coal: 1, ore: 4, bars: 4 };

  type Blueprint = {
    id: string;
    x: number;
    kind: BuildKind;
    // legacy `delivered` still accepted at load time — mapped into deliveredWood.
    deliveredWood: number;
    deliveredStones: number;
    deliveredCoal: number;
    deliveredCopper: number;
    deliveredBronzeMetal: number;
  };
  type ForgeJob = {
    rawKind: "copperMetal" | "bronzeMetal";
    barKind: "copperBar" | "bronzeBar";
    barName: string;
    hits: number;
    hitsRequired: number;
  };
  type Built = {
    id: string;
    x: number;
    kind: BuildKind;
    variant?: "common" | "saw";
    // Chest only: stored counts per SlotKind. Undefined for non-chests.
    storage?: Partial<Record<SlotKind, number>>;
    // Structural hp. Every build starts at BUILD_MAX_HP; axe/pick reduces it,
    // hammer + wood/stone brings it back.
    hp?: number;
    // While true, clicking the structure deposits repair materials (wood for
    // most builds, stone for the furnace) instead of opening its menu.
    repairing?: boolean;
    // Frozen wood/stone cost the player committed to when clicking "Repair".
    repairCost?: number;
    // How much of that cost has already been deposited.
    repairDelivered?: number;
    // Anvil only: an in-progress forge — raw metal already consumed, sits on
    // top of the anvil, and the player must hammer it N times to finish.
    forgeJob?: ForgeJob;
    // Furnace only: this furnace's own smelting job. Each furnace is
    // independent — one can be smelting copper while another burns wood.
    smeltJob?: SmeltJob;
  };
  const FORGE_HITS_REQUIRED = 5;
  const BUILD_MAX_HP = 10;
  const CHEST_MAX_ITEMS = 40;
  // Material used to fix each build kind.
  const repairMaterialFor = (kind: BuildKind): "wood" | "stone" =>
    kind === "furnace" || kind === "anvil" ? "stone" : "wood";
  // Wood/stone cost = 1..3 based on how much HP is missing.
  const repairCostFor = (hp: number): number => {
    const missing = Math.max(0, BUILD_MAX_HP - hp);
    if (missing <= 0) return 0;
    if (missing <= 3) return 1;
    if (missing <= 6) return 2;
    return 3;
  };
  const blueprintsRef = useRef<Blueprint[]>([]);
  // When the player clicks a blueprint without the right material, we show
  // the remaining materials as item icon miniatures floating above THAT
  // blueprint for a short while.
  const blueprintHintRef = useRef<{ id: string; until: number } | null>(null);
  const builtRef = useRef<Built[]>([]);
  // Unlocks the "burn salitre into coal" furnace recipe once the player has
  // mined a salitre (green iron) ore at least once. Persisted with the world.
  const [salitreDiscovered, setSalitreDiscovered] = useState(false);
  const salitreDiscoveredRef = useRef(false);
  const [repairModalOpen, setRepairModalOpen] = useState<string | null>(null);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const [cameraOffsetY, setCameraOffsetY] = useState(0);
  const camYRef = useRef(0);
  camYRef.current = cameraOffsetY;
  const MAX_CAM_Y = 80;
  const MIN_CAM_Y = -80;
  const CAMERA_STEP = 20;
  const cameraUp = () => setCameraOffsetY((y) => Math.max(MIN_CAM_Y, y - CAMERA_STEP));
  const cameraDown = () => setCameraOffsetY((y) => Math.min(MAX_CAM_Y, y + CAMERA_STEP));
  const cameraReset = () => setCameraOffsetY(0);
  const [benchMenuOpen, setBenchMenuOpen] = useState(false);
  const [workshopMenuOpen, setWorkshopMenuOpen] = useState(false);
  const [furnaceMenuOpen, setFurnaceMenuOpen] = useState<string | null>(null);
  const [anvilMenuOpen, setAnvilMenuOpen] = useState<string | null>(null);
  // When set, the chest with this id has its storage panel open.
  const [chestMenuOpen, setChestMenuOpen] = useState<string | null>(null);

  // Anti tap-through: after a menu opens (typically from a tap on a workbench),
  // ignore any close-triggering click for 500ms. Prevents the same tap from
  // registering on the backdrop / close button and immediately dismissing.
  const menuOpenedAtRef = useRef(0);
  const markMenuOpened = () => { menuOpenedAtRef.current = Date.now(); };
  const canCloseMenu = () => Date.now() - menuOpenedAtRef.current >= 500;
  // Smelting job type. Each furnace stores its OWN job on `Built.smeltJob`,
  // so multiple furnaces can smelt different things in parallel.
  type SmeltJob = { barKind: "copperMetal" | "bronzeMetal" | "coal"; barName: string; barQty: number; startedAt: number; endsAt: number };
  const SMELT_DURATION_MS = 30000;
  // Initialize with Date.now() so the very first render of the furnace menu
  // computes remainingMs against a real timestamp — otherwise a stale `0` here
  // would produce a nonsense "1.7 billion seconds remaining" flash before the
  // first tick lands.
  const [smeltNow, setSmeltNow] = useState(() => Date.now());
  // Tick while any furnace has an active job so the UI/audio updates.
  useEffect(() => {
    const id = window.setInterval(() => {
      const anyActive = builtRef.current.some(
        (b) => b.kind === "furnace" && b.smeltJob && b.smeltJob.endsAt > Date.now() - 2000,
      );
      if (anyActive) setSmeltNow(Date.now());
    }, 250);
    return () => window.clearInterval(id);
  }, []);


  // ----- Hotbar transparency -----
  // The hotbar fades when the player isn't receiving or spending items and
  // isn't hovering or clicking it. Any inventory change, or interaction with
  // the hotbar itself, snaps it back to full opacity.
  const [inventoryVisible, setInventoryVisible] = useState(true);
  const lastInventoryChangeRef = useRef(Date.now());
  const lastInventoryHoverRef = useRef(Date.now());
  useEffect(() => {
    // Any inventory change (gain/spend) keeps the bar visible.
    lastInventoryChangeRef.current = Date.now();
    setInventoryVisible((v) => (v ? v : true));
  }, [inventory]);
  useEffect(() => {
    const HOTBAR_IDLE_MS = 1500;
    const iv = window.setInterval(() => {
      const now = Date.now();
      if (
        now - lastInventoryChangeRef.current > HOTBAR_IDLE_MS &&
        now - lastInventoryHoverRef.current > HOTBAR_IDLE_MS
      ) {
        setInventoryVisible((v) => (v ? false : v));
      }
    }, 200);
    return () => window.clearInterval(iv);
  }, []);

  // ----- Hotbar item tooltip -----
  // Desktop: long hover or selecting a slot shows the item name above the slot.
  // Mobile: tapping a slot shows the name briefly.
  const [slotTooltip, setSlotTooltip] = useState<{ kind: SlotKind; label: string } | null>(null);
  const slotTooltipTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (isMobile || selectedSlot == null) return;
    const kind = hotbarSlotsRef.current[selectedSlot];
    if (!kind) {
      setSlotTooltip(null);
      return;
    }
    const label = t(`item.${kind}`);
    if (slotTooltipTimerRef.current) window.clearTimeout(slotTooltipTimerRef.current);
    setSlotTooltip({ kind, label });
    slotTooltipTimerRef.current = window.setTimeout(() => setSlotTooltip(null), 1500);
    return () => {
      if (slotTooltipTimerRef.current) window.clearTimeout(slotTooltipTimerRef.current);
    };
  }, [selectedSlot, isMobile, t]);

  const [placingKind, setPlacingKind] = useState<BuildKind | null>(null);
  const placingKindRef = useRef<BuildKind | null>(null);
  placingKindRef.current = placingKind;
  // When set, the built structure with this id is in "move" mode: the next
  // valid ground click relocates it (no cost, hammer required to start).
  const [movingBuildId, setMovingBuildId] = useState<string | null>(null);
  const movingBuildRef = useRef<string | null>(null);
  movingBuildRef.current = movingBuildId;
  // Bump to force re-render when refs change (blueprint progress etc).
  const [worldTick, setWorldTick] = useState(0);
  const bumpWorld = () => setWorldTick((n) => n + 1);
  void worldTick;
  const camXRef = useRef(0);
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const countForInventory = (k: SlotKind, inv: Inv = inventoryRef.current): number => {
    switch (k) {
      case "stone": return inv.stones;
      case "wood": return inv.wood;
      case "seed": return inv.seeds;
      case "axe": return inv.axe;
      case "hoe": return inv.hoe;
      case "pick": return inv.pick;
      case "copperPick": return inv.copperPick;
      case "copperHammer": return inv.copperHammer;

      case "spear": return inv.spear;
      case "berrySeed": return inv.berrySeeds;
      case "palmSeed": return inv.palmSeeds;
      case "mushroom": return inv.mushrooms;
      case "herb": return inv.herbs;
      case "coal": return inv.coal;
      case "copper": return inv.copper;
      case "bronze": return inv.bronze;
      case "iron": return inv.iron;
      case "copperMetal": return inv.copperMetal;
      case "bronzeMetal": return inv.bronzeMetal;
      case "copperBar": return inv.copperBar;
      case "bronzeBar": return inv.bronzeBar;
      case "ironBar": return inv.ironBar;
      case "ironMetal": return inv.ironMetal;
      case "torch": return inv.torches;
    }
  };
  const getSelectedHotbarKind = (): SlotKind | null => {
    const trackedKind = selectedKindRef.current;
    if (trackedKind && countForInventory(trackedKind) > 0) return trackedKind;
    const slot = selectedSlotRef.current;
    if (slot == null) return null;
    const kind = hotbarSlotsRef.current[slot] ?? null;
    return kind && countForInventory(kind) > 0 ? kind : null;
  };

  // Map an ItemKind to its inventory numeric field. Every ItemKind maps to
  // exactly one Inv counter — used by pickup / drop / inventory-full checks.
  const invFieldForKind = (kind: ItemKind): keyof Inv => {
    switch (kind) {
      case "stone": return "stones";
      case "wood": return "wood";
      case "seed": return "seeds";
      case "berrySeed": return "berrySeeds";
      case "palmSeed": return "palmSeeds";
      case "mushroom": return "mushrooms";
      case "herb": return "herbs";
      case "torch": return "torches";
      default: return kind as keyof Inv;
    }
  };

  // Hotbar caps distinct owned kinds at HOTBAR_CAPACITY. A pickup succeeds
  // if the item already has a stack (adds to it) OR there is a free slot.
  // Bars/tools count the same way — one distinct kind uses one slot.
  const HOTBAR_SLOT_KINDS: SlotKind[] = HOTBAR_PRIORITY;
  const canAcquireKind = (kind: ItemKind, inv: Inv = inventoryRef.current): boolean => {
    const field = invFieldForKind(kind);
    if ((inv[field] as number) > 0) return true;
    let owned = 0;
    for (const k of HOTBAR_SLOT_KINDS) {
      if (countForInventory(k, inv) > 0) owned++;
    }
    return owned < HOTBAR_CAPACITY;
  };

  // Same as invFieldForKind but also handles the two SlotKinds that aren't
  // ItemKinds (copperBar / bronzeBar). Used by chest storage transfers.
  const slotKindInvField = (k: SlotKind): keyof Inv => {
    if (k === "copperBar") return "copperBar";
    if (k === "bronzeBar") return "bronzeBar";
    return invFieldForKind(k as ItemKind);
  };
  const canAcquireSlot = (k: SlotKind, inv: Inv = inventoryRef.current): boolean => {
    const field = slotKindInvField(k);
    if ((inv[field] as number) > 0) return true;
    let owned = 0;
    for (const kk of HOTBAR_SLOT_KINDS) {
      if (countForInventory(kk, inv) > 0) owned++;
    }
    return owned < HOTBAR_CAPACITY;
  };

  // Shared helper: try to pick up a dropped ground item near (worldX, worldY)
  // that belongs to the current scene. Returns true if a pickup happened
  // (or a full-inventory message was shown), so the click handler can bail.
  const tryPickupGroundItem = (
    worldX: number,
    worldY: number,
    mode: "world" | "cave" | "cave2",
    withinReach: (x: number) => boolean,
  ): boolean => {
    let best: GroundItem | null = null;
    let bestD = 14;
    for (const it of groundItemsRef.current) {
      if (it.mode !== mode) continue;
      if (!withinReach(it.x + 5)) continue;
      const d = Math.abs(it.x + 5 - worldX);
      const gY = mode === "world" ? getGroundYAt(it.x) : GROUND_Y;
      if (d < bestD && worldY > gY - 16 && worldY < gY + 12) {
        bestD = d; best = it;
      }
    }
    if (!best) return false;
    const picked = best;
    if (!canAcquireKind(picked.kind)) {
      flashPickup(t("msg.inventoryFull"));
      return true;
    }
    groundItemsRef.current = groundItemsRef.current.filter((x) => x.id !== picked.id);
    const field = invFieldForKind(picked.kind);
    setInventory((inv) => {
      const cur = inv[field] as number;
      const nxt = { ...inv, [field]: cur + 1 };
      inventoryRef.current = nxt;
      return nxt;
    });
    flashPickup(t(`item.${picked.kind}`));
    saveWorld();
    return true;
  };

  // Drop a stack of items onto the ground near a world-x anchor, spreading
  // them slightly so they don't overlap. Used when an ore is broken so its
  // loot (ore + stone) lands next to the deposit instead of teleporting
  // straight into the player's inventory.
  const dropGroundItems = (
    anchorX: number,
    mode: "world" | "cave" | "cave2",
    drops: ItemKind[],
  ) => {
    const now = Date.now();
    // Wood must NEVER drop as a tiny inventory item — it's always the
    // physical log/trunk the player hauls. Divert any wood in the batch
    // into groundLogsRef (world only) and drop the rest normally.
    const woodCount = drops.filter((k) => k === "wood").length;
    const nonWood = drops.filter((k) => k !== "wood");
    if (woodCount > 0 && mode === "world") {
      const newLogs: GroundLog[] = [];
      for (let i = 0; i < woodCount; i++) {
        newLogs.push({
          id: `log-${now}-${i}-${Math.floor(Math.random() * 1000)}`,
          x: Math.round(anchorX + (i % 3) * 11 - 11),
          droppedAt: now + i,
        });
      }
      groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
    }
    const list = [...groundItemsRef.current];
    for (let i = 0; i < nonWood.length; i++) {
      const spread = (i - (nonWood.length - 1) / 2) * 6;
      const jitter = Math.floor((Math.random() - 0.5) * 4);
      const id = `drop-${now}-${i}-${Math.floor(Math.random() * 1000)}`;
      list.push({ id, x: Math.round(anchorX + spread + jitter), kind: nonWood[i], mode, droppedAt: now + i });
    }
    groundItemsRef.current = list;
    enforceCombinedGroundLimit();
  };

  // Ground cap covers BOTH the small dropped items and the physical logs.
  // Total across both must never exceed MAX_GROUND_ITEMS — if a new batch
  // pushes past the cap (e.g. destroying a full chest), the oldest entries
  // across either bucket are removed first to make room.
  const enforceCombinedGroundLimit = () => {
    const now = Date.now();
    const items = groundItemsRef.current.filter(
      (it) => now - it.droppedAt < DROP_LIFETIME_MS,
    );
    const logs = [...groundLogsRef.current];
    const total = items.length + logs.length;
    if (total <= MAX_GROUND_ITEMS) {
      if (items.length !== groundItemsRef.current.length) {
        groundItemsRef.current = items;
      }
      return;
    }
    type Entry =
      | { kind: "item"; droppedAt: number; ref: GroundItem }
      | { kind: "log"; droppedAt: number; ref: GroundLog };
    const combined: Entry[] = [
      ...items.map((it): Entry => ({ kind: "item", droppedAt: it.droppedAt, ref: it })),
      ...logs.map((l): Entry => ({ kind: "log", droppedAt: l.droppedAt ?? 0, ref: l })),
    ];
    combined.sort((a, b) => b.droppedAt - a.droppedAt);
    const kept = combined.slice(0, MAX_GROUND_ITEMS);
    groundItemsRef.current = kept
      .filter((c): c is Extract<Entry, { kind: "item" }> => c.kind === "item")
      .map((c) => c.ref);
    groundLogsRef.current = kept
      .filter((c): c is Extract<Entry, { kind: "log" }> => c.kind === "log")
      .map((c) => c.ref);
  };

  // Sweep expired dropped items every few seconds so they despawn even
  // while nothing else is happening on the ground.
  useEffect(() => {
    const id = window.setInterval(() => {
      enforceCombinedGroundLimit();
    }, 5000);
    return () => window.clearInterval(id);
  }, []);



  const slotIdRef = useRef<number | null>(null);
  const worldStorageKey = (slot: number) => `pixel-realms.world.${slot}`;
  const worldSeedRef = useRef<number>(1337);

  const loadWorld = (slot: number) => {
    // Ensure a per-slot random world seed exists BEFORE reading anything
    // that depends on getProps() / getStones(). Persists across reloads so
    // the island layout stays stable within a slot but differs between slots.
    try {
      const seedKey = `pixel-realms.worldseed.${slot}`;
      const existing = localStorage.getItem(seedKey);
      let seed = existing ? parseInt(existing, 10) : NaN;
      if (!Number.isFinite(seed) || seed <= 0) {
        seed = Math.floor(Math.random() * 0x7fffffff) || 1;
        localStorage.setItem(seedKey, String(seed));
      }
      worldSeedRef.current = seed;
      setWorldSeed(seed);
      caveEntranceXRef.current = computeCaveEntranceX(seed, spawnX);
      caveOresRef.current = computeCaveOres(seed);
      cave2SegsRef.current = generateCave2Layout(seed);
      cave2StalactitesRef.current = generateStalactites(cave2SegsRef.current, seed);
      cave2BatsRef.current = generateBats(cave2SegsRef.current, seed);
      cave2FloorWebsRef.current = generateFloorWebs(cave2SegsRef.current, seed);
      cave2CentipedesRef.current = generateCentipedes(cave2SegsRef.current, seed);

    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(worldStorageKey(slot));
      if (!raw) return;
      const data = JSON.parse(raw) as {
        stones?: number;
        wood?: number;
        seeds?: number;
        axe?: number;
        hoe?: number;
        pick?: number;
        copperPick?: number;

        spear?: number;
        berrySeeds?: number;
        palmSeeds?: number;
        mushrooms?: number;
        herbs?: number;
        coal?: number;
        copper?: number;
        bronze?: number;
        iron?: number;
        copperMetal?: number;
        bronzeMetal?: number;
        copperBar?: number;
        bronzeBar?: number;
        torches?: number;
        carriedLogs?: number;
        takenStones?: [number, number][];
        brokenTrees?: [number, number][];
        pickedProps?: string[];
        brokenPalms?: number[];
        extraPalms?: PalmPos[];
        groundLogs?: GroundLog[];
        groundPebbles?: GroundPebble[];
        groundItems?: GroundItem[];
        groundSeeds?: GroundSeed[];
        planted?: PlantedTree[];
        blueprints?: Blueprint[];
        built?: Built[];
        // legacy shape (Set<string>) or new shape [id, timestamp][]
        minedOres?: string[] | [string, number][];
        caveOres?: CaveOre[];
        oreHP?: [string, number][];
        placedTorches?: PlacedTorch[];
        caveWallBroken?: boolean;
        smeltJob?: SmeltJob | null;
        playerX?: number;
        playerY?: number;
        playerFacing?: 1 | -1;
        mode?: "world" | "cave" | "cave2";
        caveReturnX?: number;
        cave2Cleared?: number[];
        cave2Ores?: CaveOre[];
        cave2OreHP?: [string, number][];
        cave2MinedOres?: [string, number][];
        placedTorchesCave2?: PlacedTorch[];
        salitreDiscovered?: boolean;
      };
      const loadedInventory: Inv = {
        stones: data.stones ?? 0,
        wood: data.wood ?? 0,
        seeds: data.seeds ?? 0,
        axe: data.axe ?? 0,
        hoe: data.hoe ?? 0,
        pick: data.pick ?? 0,
        copperPick: data.copperPick ?? 0,
        copperHammer: (data as { copperHammer?: number }).copperHammer ?? 0,

        spear: data.spear ?? 0,
        berrySeeds: data.berrySeeds ?? 0,
        palmSeeds: data.palmSeeds ?? 0,
        mushrooms: data.mushrooms ?? 0,
        herbs: data.herbs ?? 0,
        coal: data.coal ?? 0,
        copper: data.copper ?? 0,
        bronze: data.bronze ?? 0,
        iron: data.iron ?? 0,
        copperMetal: data.copperMetal ?? 0,
        bronzeMetal: data.bronzeMetal ?? 0,
        ironMetal: (data as { ironMetal?: number }).ironMetal ?? 0,
        copperBar: data.copperBar ?? 0,
        bronzeBar: data.bronzeBar ?? 0,
        ironBar: (data as { ironBar?: number }).ironBar ?? 0,
        torches: data.torches ?? 0,
      };
      // Keep the ref in sync immediately. In dev/preview Strict Mode the
      // mount effect can clean up before React applies setState; without this,
      // the cleanup save writes an empty inventory over the loaded world.
      inventoryRef.current = loadedInventory;
      setInventory(loadedInventory);
      // Accept both legacy (string[]) and new ([id, ts][]) shapes.
      {
        const raw = data.minedOres ?? [];
        const now = Date.now();
        const map = new Map<string, number>();
        for (const entry of raw as Array<unknown>) {
          if (typeof entry === "string") map.set(entry, now);
          else if (Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "number") {
            map.set(entry[0] as string, entry[1] as number);
          }
        }
        minedOresRef.current = map;
      }
      caveOreHPRef.current = new Map(data.oreHP ?? []);
      if (Array.isArray(data.caveOres) && data.caveOres.length > 0) {
        caveOresRef.current = data.caveOres;
      }
      // Recovery: if the player mined every cave-1 ore before the regen
      // system existed (so no pending mined-entry will ever fire), reseed
      // the cave now. We consider the cave "empty" when fewer than 2 ores
      // remain unmined AND nothing is queued to respawn.
      {
        const unminedCount = caveOresRef.current.filter(
          (o) => !minedOresRef.current.has(o.id),
        ).length;
        if (unminedCount < 2 && minedOresRef.current.size === 0) {
          caveOresRef.current = computeCaveOres(worldSeedRef.current);
          caveOreHPRef.current = new Map();
        }
      }
      placedTorchesRef.current = data.placedTorches ?? [];
      placedTorchesCave2Ref.current = data.placedTorchesCave2 ?? [];
      salitreDiscoveredRef.current = data.salitreDiscovered ?? false;
      setSalitreDiscovered(salitreDiscoveredRef.current);
      caveWallBrokenRef.current = !!data.caveWallBroken;
      // One-time migration: restore the cave wall for players who broke it
      // before the copper-pickaxe requirement was enforced correctly.
      try {
        if (caveWallBrokenRef.current && !localStorage.getItem("cave-wall-restore-v1")) {
          caveWallBrokenRef.current = false;
          localStorage.setItem("cave-wall-restore-v1", "1");
        }
      } catch { /* ignore */ }
      // Legacy migration: earlier versions stored a single global smeltJob.
      // If present, attach it to the first furnace in the world so the
      // player doesn't lose an in-progress smelt.
      if (data.smeltJob && data.smeltJob.endsAt && data.smeltJob.barKind) {
        const built = data.built ?? [];
        const firstFurnace = built.find((b) => b.kind === "furnace");
        if (firstFurnace && !firstFurnace.smeltJob) {
          firstFurnace.smeltJob = data.smeltJob;
        }
      }

      carriedLogsRef.current = data.carriedLogs ?? 0;
      setCarriedLogs(data.carriedLogs ?? 0);
      stonesTakenRef.current = new Map(data.takenStones ?? []);
      treesBrokenRef.current = new Map(data.brokenTrees ?? []);
      pickedPropsRef.current = new Set(data.pickedProps ?? []);
      brokenPalmsRef.current = new Set(data.brokenPalms ?? []);
      // Seed regrow timestamps for any palms already broken at load time so
      // they eventually regrow after PALM_REGROW_MS from now.
      {
        const nowLoad = performance.now();
        brokenPalmsAtRef.current = new Map();
        for (const wx of brokenPalmsRef.current) brokenPalmsAtRef.current.set(wx, nowLoad);
      }
      extraPalmsRef.current = (data.extraPalms ?? []).map((p) => ({ wx: p.wx, variant: (p.variant ?? 0) as 0 | 1 | 2 | 3 }));
      rockHPRef.current = new Map((data as { rockHP?: [number, number][] }).rockHP ?? []);
      minedRocksRef.current = new Map((data as { minedRocks?: [number, number][] }).minedRocks ?? []);
      extraRocksRef.current = ((data as { extraRocks?: { x: number }[] }).extraRocks ?? []);
      groundLogsRef.current = data.groundLogs ?? [];
      groundPebblesRef.current = data.groundPebbles ?? [];
      // Migrate legacy saves where dropped items had no `mode` or `droppedAt`
      // field (all pre-cave dropped items were in world mode; missing timestamps
      // start their 5-minute lifetime from now).
      const rawGround = (data.groundItems ?? []).map((g) => ({
        ...g,
        mode: (g as GroundItem).mode ?? "world",
        droppedAt: (g as GroundItem).droppedAt ?? Date.now(),
      }));
      // Convert any lingering wood miniatures into physical logs — wood must
      // NEVER exist as a small ground item.
      const strayWood = rawGround.filter((g) => g.kind === "wood" && g.mode === "world");
      if (strayWood.length > 0) {
        const nowLoad = Date.now();
        const converted: GroundLog[] = strayWood.map((g, i) => ({
          id: `logmig-${nowLoad}-${i}`,
          x: g.x,
        }));
        groundLogsRef.current = [...groundLogsRef.current, ...converted];
      }
      groundItemsRef.current = rawGround.filter((g) => g.kind !== "wood");
      seedsRef.current = data.groundSeeds ?? [];
      plantedRef.current = data.planted ?? [];
      // Migrate legacy blueprints that used `delivered` (log count only).
      blueprintsRef.current = (data.blueprints ?? []).map((raw) => {
        const legacy = raw as unknown as { delivered?: number; deliveredCoal?: number; deliveredCopper?: number; deliveredBronzeMetal?: number };
        return {
          id: raw.id,
          x: raw.x,
          kind: raw.kind,
          deliveredWood: raw.deliveredWood ?? legacy.delivered ?? 0,
          deliveredStones: raw.deliveredStones ?? 0,
          deliveredCoal: legacy.deliveredCoal ?? 0,
          deliveredCopper: legacy.deliveredCopper ?? 0,
          deliveredBronzeMetal: legacy.deliveredBronzeMetal ?? 0,
        };
      });
      builtRef.current = (data.built ?? []).map((b) => ({
        ...b,
        hp: typeof b.hp === "number" ? Math.max(0, Math.min(BUILD_MAX_HP, b.hp)) : BUILD_MAX_HP,
      }));
      // Cave 2 progress
      cave2ClearedRef.current = new Set(data.cave2Cleared ?? []);
      // Nunca renasce lacraia num segmento já limpo (área segura): remove
      // qualquer bicho gerado por generateCentipedes cujo home-segment
      // esteja no set de cleared. Roda também quando o set é atualizado.
      cave2CentipedesRef.current = cave2CentipedesRef.current.filter(
        (c) => !cave2ClearedRef.current.has(c.segIndex),
      );
      cave2OresRef.current = data.cave2Ores ?? [];
      cave2OreHPRef.current = new Map(data.cave2OreHP ?? []);
      cave2MinedOresRef.current = new Map(data.cave2MinedOres ?? []);
      // Cleanup pass: remove any ore that ended up on the water pool or
      // pit gap from an older buggy spawn. Segment layout is regenerated
      // above, so `segmentAt` gives us the current segment kinds.
      cave2OresRef.current = cave2OresRef.current.filter((ore) => {
        const seg = segmentAt(cave2SegsRef.current, ore.x);
        const ORE_HALF_W = 10;
        for (let dx = -ORE_HALF_W; dx <= ORE_HALF_W; dx += 2) {
          const px = ore.x + dx;
          if (!hasGroundAt(seg, px) || isOverWaterPool(seg, px)) return false;
        }
        return true;
      });
      // One-time cave2 wipe so the newly-varied layout regenerates for
      // players who already explored the old 2-kind version.
      let cave2Reset = false;
      try {
        if (!localStorage.getItem(CAVE2_RESET_KEY)) {
          cave2ClearedRef.current = new Set();
          cave2OresRef.current = [];
          cave2OreHPRef.current = new Map();
          cave2MinedOresRef.current = new Map();
          localStorage.setItem(CAVE2_RESET_KEY, "1");
          cave2Reset = true;
        }
      } catch { /* ignore */ }
      // Restore player position/facing and which scene they were in.
      {
        const s = stateRef.current;
        if (typeof data.playerX === "number") s.x = data.playerX;
        if (typeof data.playerY === "number") s.y = data.playerY;
        if (data.playerFacing === 1 || data.playerFacing === -1) s.facing = data.playerFacing;
        if (typeof data.caveReturnX === "number") caveReturnXRef.current = data.caveReturnX;
        if (data.mode === "cave" || data.mode === "world" || data.mode === "cave2") {
          modeRef.current = data.mode;
          setMode(data.mode);
        }
        // If the cave2 layout was just wiped, snap the player back to the
        // entry so an old x doesn't strand them inside a new hazard room.
        if (cave2Reset && modeRef.current === "cave2") {
          s.x = CAVE2_ENTRY_X;
          s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
          s.vx = 0; s.vy = 0; s.grounded = true;
          heartsRef.current = CAVE2_MAX_HEARTS;
          setHearts(CAVE2_MAX_HEARTS);
          breathRef.current = CAVE2_MAX_BREATH;
          setBreath(CAVE2_MAX_BREATH);
        }
      }
    } catch {
      /* ignore */
    }
  };
  const saveWorld = () => {
    const slot = slotIdRef.current;
    if (slot == null) return;
    try {
      localStorage.setItem(
        worldStorageKey(slot),
        JSON.stringify({
          stones: inventoryRef.current.stones,
          wood: inventoryRef.current.wood,
          seeds: inventoryRef.current.seeds,
          axe: inventoryRef.current.axe,
          hoe: inventoryRef.current.hoe,
          pick: inventoryRef.current.pick,
          copperPick: inventoryRef.current.copperPick,
          copperHammer: inventoryRef.current.copperHammer,

          spear: inventoryRef.current.spear,
          berrySeeds: inventoryRef.current.berrySeeds,
          palmSeeds: inventoryRef.current.palmSeeds,
          mushrooms: inventoryRef.current.mushrooms,
          herbs: inventoryRef.current.herbs,
          coal: inventoryRef.current.coal,
          copper: inventoryRef.current.copper,
          bronze: inventoryRef.current.bronze,
          iron: inventoryRef.current.iron,
          copperMetal: inventoryRef.current.copperMetal,
          bronzeMetal: inventoryRef.current.bronzeMetal,
          ironMetal: inventoryRef.current.ironMetal,
          copperBar: inventoryRef.current.copperBar,
          bronzeBar: inventoryRef.current.bronzeBar,
          ironBar: inventoryRef.current.ironBar,
          torches: inventoryRef.current.torches,
          minedOres: Array.from(minedOresRef.current.entries()),
          caveOres: caveOresRef.current,
          oreHP: Array.from(caveOreHPRef.current.entries()),
          placedTorches: placedTorchesRef.current,
          caveWallBroken: caveWallBrokenRef.current,
          // smeltJob now lives on each Built furnace, persisted via `built`.
          carriedLogs: carriedLogsRef.current,
          takenStones: Array.from(stonesTakenRef.current.entries()),
          brokenTrees: Array.from(treesBrokenRef.current.entries()),
          pickedProps: Array.from(pickedPropsRef.current),
          brokenPalms: Array.from(brokenPalmsRef.current),
          extraPalms: extraPalmsRef.current,
          rockHP: Array.from(rockHPRef.current.entries()),
          minedRocks: Array.from(minedRocksRef.current.entries()),
          extraRocks: extraRocksRef.current,
          groundLogs: groundLogsRef.current,
          groundPebbles: groundPebblesRef.current,
          groundItems: groundItemsRef.current,
          groundSeeds: seedsRef.current,
          planted: plantedRef.current,
          blueprints: blueprintsRef.current,
          built: builtRef.current,
          playerX: stateRef.current.x,
          playerY: stateRef.current.y,
          playerFacing: stateRef.current.facing,
          mode: modeRef.current,
          caveReturnX: caveReturnXRef.current,
          cave2Cleared: Array.from(cave2ClearedRef.current),
          cave2Ores: cave2OresRef.current,
          cave2OreHP: Array.from(cave2OreHPRef.current.entries()),
          cave2MinedOres: Array.from(cave2MinedOresRef.current.entries()),
          placedTorchesCave2: placedTorchesCave2Ref.current,
          salitreDiscovered: salitreDiscoveredRef.current,
        }),
      );
    } catch {
      /* ignore */
    }
  };
  const flashPickup = (msg: string) => {
    setPickupFlash(msg);
    window.setTimeout(() => setPickupFlash((cur) => (cur === msg ? null : cur)), 1200);
  };
  // Lighten/darken a #rrggbb color by a factor in [-1, 1].
  const shadeHex = (hex: string, amt: number) => {
    const h = hex.replace("#", "");
    if (h.length !== 6) return hex;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const adj = (c: number) =>
      Math.max(0, Math.min(255, Math.round(c + (amt >= 0 ? (255 - c) : c) * amt)));
    const to = (n: number) => n.toString(16).padStart(2, "0");
    return `#${to(adj(r))}${to(adj(g))}${to(adj(b))}`;
  };





  const respawn = () => {
    const s = stateRef.current;
    s.x = spawnX;
    s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
    s.vx = 0;
    s.vy = 0;
    s.facing = 1;
    s.grounded = true;
    s.swimming = false;
    s.dead = false;
    s.deathT = 0;
    s.animT = 0;
    s.submersion = 0;
    s.submersionTime = 0;
    s.shark.phase = "idle";
    s.shark.x = 0;
    s.shark.t = 0;
    s.shark.dir = 1;
    setDead(false);
  };


  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void waitForPlayerSaveReady().then(() => {
      if (cancelled) return;
      const slot = getActiveSlot();
      if (slot == null) {
        navigate({ to: "/characters" });
        return;
      }
      const slots = loadSlots();
      const c = slots[slot];
      if (!c) {
        navigate({ to: "/characters" });
        return;
      }
      setCharacter(c);
      appearanceRef.current = c.appearance ?? DEFAULT_APPEARANCE;
      slotIdRef.current = slot;
      loadWorld(slot);
      // Persist position + world periodically and on exit so the player
      // resumes exactly where they left off.
      const tick = window.setInterval(() => saveWorld(), 3000);
      const saveAndFlush = () => {
        saveWorld();
        void flushPlayerSaveSync();
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") saveAndFlush();
      };
      window.addEventListener("beforeunload", saveAndFlush);
      window.addEventListener("pagehide", saveAndFlush);
      document.addEventListener("visibilitychange", onVisibilityChange);
      cleanup = () => {
        window.clearInterval(tick);
        window.removeEventListener("beforeunload", saveAndFlush);
        window.removeEventListener("pagehide", saveAndFlush);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        saveAndFlush();
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate]);


  useEffect(() => {
    const map: Record<string, string> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "jump",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
      w: "jump",
      W: "jump",
      " ": "jump",
      Spacebar: "jump",
    };
    const kd = (e: KeyboardEvent) => {
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        zoomOut();
        return;
      }
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      // If stuck in a web, jump-taps only count toward escape (never move).
      if (dir === "jump" && stuckWebRef.current && !stuckWebRef.current.killed) {
        // Edge trigger — only new presses, not autorepeat.
        if (e.repeat) return;
        const sw = stuckWebRef.current;
        sw.progress = Math.min(10, sw.progress + 1);
        setStuckProgress(sw.progress);
        if (sw.progress >= 10) {
          // Escaped — release from web and let gravity pull the player down.
          const s = stateRef.current;
          s.vy = 0;
          s.grounded = false;
          stuckWebRef.current = null;
          setStuckActive(false);
          setStuckProgress(0);
          flashPickup(t("cave2.freed"));
        }
        return;
      }
      keysRef.current.add(dir);
    };

    const ku = (e: KeyboardEvent) => {
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      keysRef.current.delete(dir);
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  // Preload shark sprites once — reuse the module-level preloads so we
  // don't re-fetch (they've usually finished by the time we get here).
  useEffect(() => {
    sharkFinImgRef.current = PRELOADED_IMAGES[1] ?? null;
    sharkFullImgRef.current = PRELOADED_IMAGES[2] ?? null;
    beachBgImgRef.current = PRELOADED_IMAGES[0] ?? null;
    caveEntranceImgRef.current = PRELOADED_IMAGES[3] ?? null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = performance.now();
    const MAX_FRAME_DT = 1 / 30;

    const OCEAN_DEEP_END = 4720; // full submersion by this world-x (right)
    const OCEAN_LEFT_DEEP_END = 80; // full submersion by this world-x (left)
    const KILL_X_MAX = WORLD_W - SPRITE_W - 4;

    const step = (dt: number) => {
      const s = stateRef.current;
      const keys = keysRef.current;

      // ----- Cave mode: simple side-scroller physics, no water/shark -----
      if (modeRef.current === "cave") {
        if (!s.dead) {
          let ax = 0;
          if (keys.has("left")) ax -= 1;
          if (keys.has("right")) ax += 1;
          if (ax !== 0) s.facing = ax > 0 ? 1 : -1;
          const carrySlow = Math.max(0.4, 1 - 0.15 * (carriedLogsRef.current + totalCarriedBarsRef.current));
          s.vx = ax * MOVE_SPEED * carrySlow;
          if (keys.has("jump") && s.grounded) {
            s.vy = JUMP_VELOCITY;
            s.grounded = false;
            playOneShotReverb(jumpSfxAsset.url, (ambientVolume / 100) * 0.7);
          }
          s.vy += GRAVITY * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const groundYHere = GROUND_Y;
          const feet = s.y + SPRITE_H - FOOT_OFFSET;
          if (feet >= groundYHere) {
            s.y = groundYHere - SPRITE_H + FOOT_OFFSET;
            s.vy = 0;
            s.grounded = true;
          }
          if (s.grounded && s.vx !== 0) s.animT += dt;
          else if (!s.grounded) s.animT = 0;
        }
        if (s.x < 4) s.x = 4;
        if (s.x > CAVE_W - SPRITE_W - 4) s.x = CAVE_W - SPRITE_W - 4;
        s.swimming = false;
        s.submersion = 0;
        s.submersionTime = 0;
        s.shark.phase = "idle";
        return;
      }

      // ----- Cave 2: procedural dungeon with hazards -----
      if (modeRef.current === "cave2") {
        const centerX2 = s.x + SPRITE_W / 2;
        const segNow = segmentAt(cave2SegsRef.current, centerX2);
        const feetY = s.y + SPRITE_H - FOOT_OFFSET;
        const overWater = isOverWaterPool(segNow, centerX2);
        const overPit = isOverPitGap(segNow, centerX2);
        // "Submerged" now requires the feet to actually be past the water
        // surface, so walking up to a pool no longer teleports you into
        // swim mode — you fall (or jump) in first.
        const submerged = !s.treading && isSubmergedAt(segNow, centerX2, feetY, GROUND_Y);

        // ----- Centipedes update (chase player across ALL rooms) -----
        {
          const nowMs = performance.now();
          const segs = cave2SegsRef.current;
          if (segs.length > 0) {
            // Virtual "world segment" spanning the entire cave so centipedes
            // can freely cross between rooms.
            const first = segs[0];
            const last = segs[segs.length - 1];
            const worldSeg = {
              ...first,
              x: first.x,
              w: (last.x + last.w) - first.x,
            } as typeof first;
            for (const c of cave2CentipedesRef.current) {
              if (c.dead) continue;
              const playerX = s.x + SPRITE_W / 2;
              const wasAwake = centipedeIsAwake(c, playerX);
              updateCentipede(c, dt, nowMs, playerX, s.y + SPRITE_H / 2, worldSeg, GROUND_Y);
              const isAwake = centipedeIsAwake(c, playerX);
              // Wake-up scare: wall serpent entering sight range mid-attack should still roar.
              if (!wasAwake && isAwake && c.variant === "wall" && !c.retreating && !c.pendingSfx) {
                c.pendingSfx = "wallAttack";
              }
              // Consume one-shot SFX events emitted by the update step.
              if (c.pendingSfx) {
                const dist = Math.abs(c.head.x - playerX);
                const falloff = Math.max(0.15, 1 - dist / 1400);
                const vol = Math.min(1, (ambientVolume / 100) * 1.35 * falloff);
                if (vol > 0.02) {
                  const url = c.pendingSfx === "diveStrike"
                    ? lacraiaDescendoAsset.url
                    : (Math.random() < 0.5 ? lacraiaParedeAtacando1Asset.url : lacraiaParedeAtacando2Asset.url);
                  playOneShotReverb(url, vol);
                }
                c.pendingSfx = null;
              }
              // Spear hitbox vs centipede — damage while the spear is thrusting.
              if (spearAttackRef.current && getSelectedHotbarKind() === "spear" && inventoryRef.current.spear > 0) {
                const sa = spearAttackRef.current;
                const facing = s.facing;
                const handWX = s.x + (facing === 1 ? 14 : 1);
                const handWY = s.y + 19;
                const ang = sa.angle;
                const EXT_MS = 130;
                const RETRACT_MS = 130;
                const el = nowMs - sa.startedAt;
                let thrust: number;
                if (sa.holdEndsAt === null) {
                  thrust = el < EXT_MS ? (el / EXT_MS) * 8 : 8;
                } else {
                  const rt = nowMs - sa.holdEndsAt;
                  thrust = rt >= RETRACT_MS ? 0 : (1 - rt / RETRACT_MS) * 8;
                }

                const SPEAR_LEN = 22;
                const tipX = handWX + Math.cos(ang) * (SPEAR_LEN + thrust);
                const tipY = handWY + Math.sin(ang) * (SPEAR_LEN + thrust);
                const pts: Array<[number, number]> = [];
                for (let i = 1; i <= 4; i++) {
                  const f = i / 4;
                  pts.push([handWX + (tipX - handWX) * f, handWY + (tipY - handWY) * f]);
                }
                const HIT_R = 10;
                const last = spearHitCooldownRef.current.get(c.id) ?? 0;
                if (nowMs - last >= 500) {
                  let hit = false;
                  for (const [hx, hy] of pts) {
                    if (Math.hypot(c.head.x - hx, c.head.y - hy) <= HIT_R) { hit = true; break; }
                    for (const b of c.body) {
                      if (Math.hypot(b.x - hx, b.y - hy) <= HIT_R) { hit = true; break; }
                    }
                    if (hit) break;
                  }
                  if (hit) {
                    spearHitCooldownRef.current.set(c.id, nowMs);
                    playOneShot(pickSfxAsset.url, (ambientVolume / 100) * 1.0);
                    // Hit SFX (also plays on kill) — trim the silent head.
                    playOneShotReverb(lacraiaDeathAsset.url, Math.min(1, (ambientVolume / 100) * 0.9), 0.15);
                    c.hp -= 1;
                    if (c.hp <= 0) {
                      c.dead = true;
                      flashPickup(t("cave2.centipedeSlain"));
                      // Death cry — reuse the wall-attack shrieks.
                      const deathCry = Math.random() < 0.5 ? lacraiaParedeAtacando1Asset.url : lacraiaParedeAtacando2Asset.url;
                      playOneShotReverb(deathCry, Math.min(1, (ambientVolume / 100) * 1.0));
                      // Drop MINÉRIO (raw ore) — stone / copper / bronze. In cave2
                      // the item settles on the floor automatically.
                      const drops: ItemKind[] = [];
                      const nDrops = 1 + Math.floor(Math.random() * 2); // 1..2
                      for (let i = 0; i < nDrops; i++) {
                        const r = Math.random();
                        drops.push(r < 0.55 ? "stone" : r < 0.85 ? "copper" : "bronze");
                      }
                      dropGroundItems(c.head.x, "cave2", drops);
                      const pX = s.x + SPRITE_W / 2;
                      let best: Centipede | null = null;
                      let bestD = Infinity;
                      for (const other of cave2CentipedesRef.current) {
                        if (other.dead || other.active) continue;
                        if (other.variant !== c.variant) continue;
                        const d = Math.abs(other.head.x - pX);
                        if (d < bestD) { bestD = d; best = other; }
                      }
                      if (best) best.active = true;

                    } else {
                      flashPickup(t("cave2.centipedeHit", { n: c.hp, max: c.maxHp }));
                    }
                  }
                }
              }




              // Track which room the head is currently over — used for draw culling.
              for (const sg of segs) {
                if (c.head.x >= sg.x && c.head.x < sg.x + sg.w) { c.segIndex = sg.index; break; }
              }

            }
            // ----- Resting centipede growl (echoing in the dark) -----
            // Audible anywhere in the cave as long as there is at least one
            // live, non-attacking lacraia. Distance still shapes the volume
            // but never drops to zero within the cave.
            if (nowMs >= centipedeGrowlAtRef.current) {
              const playerX = s.x + SPRITE_W / 2;
              const resting = cave2CentipedesRef.current.filter(
                (c) => !c.dead && !centipedeIsAwake(c, playerX),
              );
              if (resting.length > 0) {
                const pick = resting[Math.floor(Math.random() * resting.length)];
                const dist = Math.abs(pick.head.x - playerX);
                // Volume falls off with distance but keeps a floor so a distant
                // lacraia is still faintly audible from anywhere in the cave.
                const falloff = Math.max(0.35, 1 - dist / 2800);
                const baseVol = Math.min(1, (ambientVolume / 100) * 0.7 * falloff);
                if (baseVol > 0.01) {
                  // Use the reverb path (WebAudio) — same as wall-attack SFX
                  // so it works reliably even when HTMLAudio autoplay is stuck.
                  playOneShotReverb(centipedeGrowlAsset.url, baseVol);
                }
              }
              centipedeGrowlAtRef.current = nowMs + 2600 + Math.random() * 2600;
            }
          }
        }

        // ----- Web trap: pulling the player up toward the ceiling -----
        if (stuckWebRef.current && !s.dead) {
          const sw = stuckWebRef.current;
          if (sw.killed) {
            sw.killT = (sw.killT ?? 0) + dt;
            if (sw.killT > 1.2) {
              // Death: apply damage and clear state.
              stuckWebRef.current = null;
              setStuckActive(false);
              setStuckProgress(0);
              const nowMs = performance.now();
              lastHitAtRef.current = nowMs;
              heartsRef.current = 0;
              setHearts(0);
              cave2DeathFlashRef.current = nowMs;
              s.dead = true; s.deathT = 0;
            }
          } else {
            // Freeze horizontal, pull upward slowly.
            s.vx = 0;
            s.x = sw.startX;
            const pullSpeed = 32; // px/s upward
            sw.pullY += pullSpeed * dt;
            const targetY = GROUND_Y - SPRITE_H + FOOT_OFFSET - sw.pullY;
            s.y = targetY;
            s.vy = 0;
            s.grounded = false;
            // Reached the ceiling — spider eats the player.
            const ceilingLimit = 44 + 8; // CAVE2_CEILING + tiny margin
            if (s.y + 4 <= ceilingLimit) {
              sw.killed = true;
              sw.killT = 0;
            }
          }
          // Skip the rest of the cave2 update this frame — player is stuck.
          s.animT = 0;
          s.swimming = false;
          s.submersion = 0;
          s.submersionTime = 0;
          s.shark.phase = "idle";
          return;
        }

        // ----- Floor web trigger (webs room) -----
        if (!s.dead && segNow && segNow.kind === "webs" && s.grounded) {
          for (const web of cave2FloorWebsRef.current) {
            if (web.segIndex !== segNow.index) continue;
            if (cave2ConsumedWebsRef.current.has(web.id)) continue;
            if (Math.abs(centerX2 - web.x) <= FLOOR_WEB_HALF_W) {
              const next = new Set(cave2ConsumedWebsRef.current);
              next.add(web.id);
              cave2ConsumedWebsRef.current = next;
              stuckWebRef.current = {
                webId: web.id,
                progress: 0,
                pullY: 0,
                startX: s.x,
              };
              setStuckActive(true);
              setStuckProgress(0);
              flashPickup(t("cave2.stuck"));
              break;
            }
          }
        }

        if (!s.dead) {

          let ax = 0;
          if (keys.has("left")) ax -= 1;
          if (keys.has("right")) ax += 1;
          if (ax !== 0) s.facing = ax > 0 ? 1 : -1;

          if (submerged) {
            s.treading = false;
            // Underwater: gentle drift, buoyant; jump = swim up.

            s.vx = ax * MOVE_SPEED * 0.55;
            s.vy = keys.has("jump") ? -70 : 45;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.grounded = false;
            // Clamp above pool bed.
            const bedY = GROUND_Y + waterDepthAt(segNow, centerX2) - SPRITE_H + FOOT_OFFSET;
            if (s.y > bedY) { s.y = bedY; s.vy = 0; }
            // Solid pool walls: while below the surface you can't just walk
            // sideways out of the pool — you have to swim up first and hop
            // out. Only clamp the axis the player is trying to cross into.
            if (segNow) {
              const poolL = segNow.x + CAVE2_WATER_PAD;
              const poolR = segNow.x + segNow.w - CAVE2_WATER_PAD;
              // Full-sprite wall collision — the character bumps its face
              // into the pool wall instead of sliding half its body through.
              if (s.x < poolL) { s.x = poolL; s.vx = 0; }
              if (s.x + SPRITE_W > poolR) { s.x = poolR - SPRITE_W; s.vx = 0; }
            }
            s.animT += dt * 0.6;
            // Drain breath while fully under.
            breathRef.current = Math.max(0, breathRef.current - dt);
            if (breathRef.current <= 0) {
              const nowMs = performance.now();
              if (nowMs - lastHitAtRef.current > 800) {
                lastHitAtRef.current = nowMs;
                heartsRef.current = Math.max(0, heartsRef.current - 1);
                setHearts(heartsRef.current);
                cave2DeathFlashRef.current = nowMs;
                if (heartsRef.current <= 0) {
                  s.dead = true; s.deathT = 0;
                }
              }
            }
          } else {
            // Normal walk/jump physics with per-x ground plane.
            // Water surface is walkable, so walking across a pool no longer
            // drops you in. To actually enter the water, press jump while
            // standing on the water surface — that dives instead of jumping.
            breathRef.current = Math.min(CAVE2_MAX_BREATH, breathRef.current + dt * 3);
            s.vx = ax * MOVE_SPEED;
            // Require BOTH feet fully over the pool (with a small inset) so
            // the player only sinks when standing completely on water — not
            // when the edge of the sprite just brushes the surface. When
            // fully on water, the player automatically dives (water is NOT
            // walkable), so they can never stand on the surface.
            const footInset = 4;
            const leftFootX = s.x + footInset;
            const rightFootX = s.x + SPRITE_W - footInset;
            const segLeft = segmentAt(cave2SegsRef.current, leftFootX);
            const segRight = segmentAt(cave2SegsRef.current, rightFootX);
            const fullyOnWater =
              isOverWaterPool(segLeft, leftFootX) &&
              isOverWaterPool(segRight, rightFootX);
            const overWaterCenter = isOverWaterPool(segNow, centerX2);
            const holdingUp = keys.has("jump");
            const feetY0 = s.y + SPRITE_H - FOOT_OFFSET;
            const nearSurface = feetY0 >= GROUND_Y - 4;
            s.treading = false;
            if (holdingUp && overWaterCenter && nearSurface && s.vy >= -20
                && performance.now() - lastWaterJumpAtRef.current >= 500) {
              // Mini-jump out of water: brief pop above the surface, then
              // gravity pulls the player back down into the pool. Rate-limited
              // to at most one hop every 500ms so the player can't spam it.
              lastWaterJumpAtRef.current = performance.now();
              s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
              s.vy = JUMP_VELOCITY * 0.55;
              s.grounded = false;
            } else if (holdingUp && s.grounded && !fullyOnWater && !overWaterCenter) {
              // Jump on land only when clearly not over water.
              s.vy = JUMP_VELOCITY;
              s.grounded = false;
              playOneShotReverb(jumpSfxAsset.url, (ambientVolume / 100) * 0.7);
            } else if (fullyOnWater && s.grounded && !holdingUp) {
              // Released up while standing fully on water → sink in.
              s.y = GROUND_Y + 6 - SPRITE_H + FOOT_OFFSET;
              s.vy = 40;
              s.grounded = false;
            }
            s.vy += GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            const feetNow = s.y + SPRITE_H - FOOT_OFFSET;
            const centerNow = s.x + SPRITE_W / 2;
            const segNow2 = segmentAt(cave2SegsRef.current, centerNow);
            const overWaterNow = isOverWaterPool(segNow2, centerNow);
            const groundHere = hasGroundAt(segNow2, centerNow);
            {
              const clampToSurface = groundHere
                && !(overWaterNow && !s.grounded && s.vy > 30);
              if (clampToSurface && feetNow >= GROUND_Y) {
                s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
                s.vy = 0;
                s.grounded = true;
              } else {
                s.grounded = false;
                // Fell into a dry pit → damage and respawn.
                if (isOverPitGap(segNow2, centerNow) && feetNow >= GROUND_Y + CAVE2_PIT_DEPTH - 8) {
                  const nowMs = performance.now();
                  if (nowMs - lastHitAtRef.current > CAVE2_HIT_INVULN_MS) {
                    lastHitAtRef.current = nowMs;
                    heartsRef.current = Math.max(0, heartsRef.current - 1);
                    setHearts(heartsRef.current);
                    cave2DeathFlashRef.current = nowMs;
                    if (heartsRef.current <= 0) { s.dead = true; s.deathT = 0; }
                  }
                  if (segNow2) {
                    s.x = segNow2.x + 8;
                    s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
                    s.vx = 0; s.vy = 0; s.grounded = true;
                  }
                }
              }
            }


            if (s.grounded && s.vx !== 0) s.animT += dt;
            else if (!s.grounded) s.animT = 0;
          }
        } else {
          s.deathT += dt;
          if (s.deathT >= 1.2) {
            s.x = CAVE2_ENTRY_X;
            s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
            s.vx = 0; s.vy = 0; s.grounded = true;
            s.dead = false; s.deathT = 0;
            heartsRef.current = CAVE2_MAX_HEARTS;
            setHearts(CAVE2_MAX_HEARTS);
            breathRef.current = CAVE2_MAX_BREATH;
            setBreath(CAVE2_MAX_BREATH);
          }
        }

        if (s.x < 4) s.x = 4;
        if (s.x > CAVE2_W - SPRITE_W - 4) s.x = CAVE2_W - SPRITE_W - 4;

        // Mark segment cleared once the player exits into the next room.
        if (segNow && !cave2ClearedRef.current.has(segNow.index)
            && segNow.kind !== "start" && segNow.kind !== "end") {
          if (centerX2 >= segNow.x + segNow.w - 8) {
            cave2ClearedRef.current = new Set([...cave2ClearedRef.current, segNow.index]);
            // Área segura: mata/remove qualquer lacraia cujo home-segment é este.
            cave2CentipedesRef.current = cave2CentipedesRef.current.filter(
              (c) => c.segIndex !== segNow.index,
            );
            flashPickup(t("cave2.safe"));
            // Ore spawn: only on walkable ground within the segment —
            // never over the water pool or pit gap.
            const baseKinds: OreKind[] = ["coal", "copper", "bronze"];
            let placed = 0;
            let attempts = 0;
            while (placed < 2 && attempts < 20) {
              attempts++;
              const nx = Math.round(segNow.x + 40 + Math.random() * (segNow.w - 80));
              // Ore sprite is ~14px wide — reject any candidate whose full
              // footprint isn't on solid, dry ground so ores can't hang
              // half-over the water pool or the pit gap.
              const ORE_HALF_W = 10;
              let blocked = false;
              for (let dx = -ORE_HALF_W; dx <= ORE_HALF_W; dx += 2) {
                const px = nx + dx;
                if (!hasGroundAt(segNow, px) || isOverWaterPool(segNow, px)) {
                  blocked = true;
                  break;
                }
              }
              if (blocked) continue;
              const kind = Math.random() < 0.1 ? "iron" : baseKinds[Math.floor(Math.random() * baseKinds.length)];
              cave2OresRef.current = [
                ...cave2OresRef.current,
                { id: `c2-${segNow.index}-${placed}-${nx}`, x: nx, kind },
              ];
              placed++;
            }
            saveWorld();
          }
        }

        // Stalactite + stalagmite hits — full player hitbox.
        if (!s.dead) {
          const nowMs = performance.now();
          if (nowMs - lastHitAtRef.current > CAVE2_HIT_INVULN_MS) {
            const px = s.x + 3;
            const py = s.y + 4;
            const pw = SPRITE_W - 6;
            const ph = SPRITE_H - 6;
            const hitBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];
            for (const st of cave2StalactitesRef.current) {
              const segFor = segmentAt(cave2SegsRef.current, st.x);
              if (segFor && cave2ClearedRef.current.has(segFor.index)) continue;
              const box = stalactiteHitBox(st, nowMs, GROUND_Y);
              if (box) hitBoxes.push(box);
            }
            // Stalagmites in the current room (and neighbors, for edge cases).
            for (let d = -1; d <= 1; d++) {
              const seg = cave2SegsRef.current[(segNow?.index ?? -99) + d];
              if (seg && seg.kind === "stalagmites") {
                hitBoxes.push(...stalagmiteHitBoxes(seg, GROUND_Y));
              }
            }
            // Flying bats — hit boxes updated per frame from their sine paths.
            for (const b of cave2BatsRef.current) {
              if (Math.abs(b.segIndex - (segNow?.index ?? -99)) > 1) continue;
              hitBoxes.push(batHitBox(b, nowMs));
            }
            // Centipede head — only active ones can damage the player.
            const centipedeBoxes: Array<{ box: {x:number;y:number;w:number;h:number}; c: Centipede }> = [];
            const playerCX = s.x + SPRITE_W / 2;
            for (const c of cave2CentipedesRef.current) {
              if (!centipedeIsAwake(c, playerCX)) continue;
              const hb = centipedeHeadHitBox(c);
              if (hb) centipedeBoxes.push({ box: hb, c });
            }

            for (const box of hitBoxes) {
              if (px < box.x + box.w && px + pw > box.x
                  && py < box.y + box.h && py + ph > box.y) {
                lastHitAtRef.current = nowMs;
                heartsRef.current = Math.max(0, heartsRef.current - 1);
                setHearts(heartsRef.current);
                cave2DeathFlashRef.current = nowMs;
                if (heartsRef.current <= 0) { s.dead = true; s.deathT = 0; }
                break;
              }
            }
            // Centipede damage — same effect but also triggers wall-serpent slowdown/retreat.
            for (const { box, c } of centipedeBoxes) {
              if (px < box.x + box.w && px + pw > box.x
                  && py < box.y + box.h && py + ph > box.y) {
                lastHitAtRef.current = nowMs;
                heartsRef.current = Math.max(0, heartsRef.current - 1);
                setHearts(heartsRef.current);
                cave2DeathFlashRef.current = nowMs;
                if (c.variant === "wall") {
                  c.slowUntil = nowMs + 3500;
                  c.retreating = true;
                }
                if (heartsRef.current <= 0) { s.dead = true; s.deathT = 0; }
                break;
              }
            }
          }
        }

        if (submerged && !wasSwimmingRef.current) {
          playOneShotReverb(waterSplashSfxAsset.url, (ambientVolume / 100) * 0.8);
        }
        wasSwimmingRef.current = submerged;
        s.swimming = submerged;
        s.submersion = submerged ? 1 : 0;
        s.submersionTime = 0;
        s.shark.phase = "idle";
        setBreath(breathRef.current);
        // Silence unused-var lint for helpers referenced conditionally.
        void overWater; void overPit;
        return;
      }


      const centerX = s.x + SPRITE_W / 2;

      const rawSubR = (centerX - OCEAN_START) / (OCEAN_DEEP_END - OCEAN_START);
      const rawSubL = (OCEAN_LEFT_END - centerX) / (OCEAN_LEFT_END - OCEAN_LEFT_DEEP_END);
      const submersion = Math.max(0, Math.min(1, Math.max(rawSubR, rawSubL)));
      s.submersion = submersion;
      const inWater = submersion > 0.02;
      if (inWater && !wasSwimmingRef.current) {
        playOneShot(waterSplashSfxAsset.url, (ambientVolume / 100) * 0.8);
      }
      wasSwimmingRef.current = inWater;
      s.swimming = inWater;

      if (!s.dead) {
        let ax = 0;
        if (keys.has("left")) ax -= 1;
        if (keys.has("right")) ax += 1;
        if (ax !== 0) s.facing = ax > 0 ? 1 : -1;

        // Ground level follows the beach slope so the character walks down
        // the sand into the water instead of hovering above a flat plane.
        const groundYHere = GROUND_Y + beachSurfaceOffset(centerX);

        const carrySlow = Math.max(0.4, 1 - 0.15 * (carriedLogsRef.current + totalCarriedBarsRef.current));
        if (inWater) {
          s.vx = ax * MOVE_SPEED * (1 - 0.5 * submersion) * carrySlow;
          s.vy = 0;
          s.grounded = false;
          s.x += s.vx * dt;
          const bob = Math.sin(performance.now() / 260) * 1.2;
          // Feet follow the beach shelf as it slopes into the water so the
          // wade-to-swim transition doesn't snap the character upward.
          s.y = groundYHere - SPRITE_H + FOOT_OFFSET + submersion * 18 + bob;
          if (ax !== 0) s.animT += dt * 0.6;
        } else {
          s.vx = ax * MOVE_SPEED * carrySlow;
          if (keys.has("jump") && s.grounded) {
            s.vy = JUMP_VELOCITY;
            s.grounded = false;
            playOneShot(jumpSfxAsset.url, (ambientVolume / 100) * 0.7);
          }
          s.vy += GRAVITY * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const feet = s.y + SPRITE_H - FOOT_OFFSET;
          if (feet >= groundYHere) {
            s.y = groundYHere - SPRITE_H + FOOT_OFFSET;
            s.vy = 0;
            s.grounded = true;
          }
          if (s.grounded && s.vx !== 0) s.animT += dt;
          else if (!s.grounded) s.animT = 0;
        }
        if (s.x < 4) s.x = 4;
        if (s.x > KILL_X_MAX) s.x = KILL_X_MAX;

        // Track how long the player has been submerged (only while alive)
        if (submersion > 0.35) s.submersionTime += dt;
        else s.submersionTime = Math.max(0, s.submersionTime - dt * 2);
      } else {
        s.deathT += dt;
        if (inWater) s.y += 8 * dt;
        if (s.deathT >= DEATH_ANIM && !dead) setDead(true);
      }

      // Shark update runs regardless of player death so the shark can
      // swim back into the deep water after biting the player.
      const sh = s.shark;
      if (sh.phase === "idle" && !s.dead && s.submersionTime > 0.4) {
        sh.phase = "approach";
        // Come from whichever ocean the player is in
        sh.dir = centerX < (OCEAN_LEFT_END + BEACH_LEFT_END) / 2 ? -1 : 1;
        sh.x = sh.dir === 1
          ? Math.min(WORLD_W + 40, centerX + 260)
          : Math.max(-40, centerX - 260);
        sh.t = 0;
      } else if (sh.phase === "approach") {
        sh.t += dt;
        sh.x -= sh.dir * 140 * dt; // glide toward player just under the surface
        if (submersion < 0.1) {
          // Player left the water — bail out and swim back to the deep.
          sh.phase = "retreat";
          sh.t = 0;
        } else if (Math.abs(sh.x - centerX) < 22) {
          // Reached the player: bite, then swim off. No jumping arc.
          if (!s.dead) {
            s.dead = true;
            s.deathT = 0;
            // Death drops everything the player was carrying — troncos e
            // barras vão para o fundo do mar.
            const lost = carriedLogsRef.current;
            const lostBars = totalCarriedBarsRef.current;
            if (lost > 0 || lostBars > 0) {
              if (lost > 0) setCarriedLogs(0);
              setInventory((inv) => ({
                ...inv,
                wood: Math.max(0, inv.wood - lost),
                copperBar: 0,
                bronzeBar: 0,
                ironBar: 0,
              }));
              saveWorld();
            }
          }

          sh.phase = "retreat";
          sh.t = 0;
        }
      } else if (sh.phase === "lunge") {
        // Legacy phase — no longer entered, but keep as a safe fallback.
        sh.phase = "retreat";
        sh.t = 0;
      } else if (sh.phase === "retreat") {
        sh.t += dt;
        sh.x += sh.dir * 180 * dt;
        if (sh.t > 2.5) sh.phase = "idle";
      }
    };

    // Cap the render loop on mobile only. On desktop we let requestAnimationFrame
    // pace naturally (typically 60 Hz) — an arbitrary min-ms cap here caused
    // variable dt between frames (sometimes 15 ms, sometimes 33 ms), which made
    // the world/parallax move by variable pixel amounts each frame and looked
    // like an oscillating stutter even though the player was pinned smoothly.
    const MOBILE_FRAME_MIN_MS = 24; // ~40 FPS

    const loop = (now: number) => {
      if (isMobileRef.current && now - last < MOBILE_FRAME_MIN_MS) {
        raf = requestAnimationFrame(loop);
        return;
      }
      let dt = (now - last) / 1000;
      last = now;
      // Move on every animation frame instead of waiting for fixed 60 Hz
      // buckets. This removes the small "stair-step" feeling on previews that
      // render at 75/90/120 Hz, while still capping big hitches so tab switches
      // never launch the player forward.
      if (!Number.isFinite(dt) || dt < 0) dt = 0;
      step(Math.min(dt, MAX_FRAME_DT));

      // Hitbox swing detection
      if (toolSwingRef.current) {
        const ts = toolSwingRef.current;
        const elapsed = now - ts.startedAt;
        const duration = 180;
        if (elapsed >= duration) {
          toolSwingRef.current = null;
        } else if (elapsed >= 65 && !ts.hasHit) { // Active part of the swing
          const player = stateRef.current;
          const playerCenter = player.x + SPRITE_W / 2;
          const isFacingRight = player.facing === 1;

          if (ts.kind === "pick" || ts.kind === "copperPick") {
            let bestOre: CaveOre | null = null;
            let bestOreD = 60;
            const currentOres = modeRef.current === "cave2" ? cave2OresRef.current : caveOresRef.current;
            const currentMined = modeRef.current === "cave2" ? cave2MinedOresRef.current : minedOresRef.current;
            const currentHP = modeRef.current === "cave2" ? cave2OreHPRef.current : caveOreHPRef.current;

            for (const ore of currentOres) {
              if (currentMined.has(ore.id)) continue;
              if (isFacingRight && ore.x < playerCenter) continue;
              if (!isFacingRight && ore.x > playerCenter) continue;
              const d = Math.abs(ore.x - playerCenter);
              if (d <= 50) {
                if (d < bestOreD) {
                  bestOreD = d;
                  bestOre = ore;
                }
              }
            }

            if (bestOre) {
              ts.hasHit = true;
              const ore = bestOre;
              const oreMax = oreMaxHp(bestOre.kind);
              const prevHP = currentHP.get(ore.id) ?? oreMax;
              playOneShotReverb(pickSfxAsset.url, Math.min(1, (ambientVolume / 100) * 1.6), 0, {
                dry: 1.4,
                wet: 0.45,
              });
              const damage = ts.kind === "copperPick" ? 2 : 1;
              const nextHP = prevHP - damage;
              if (nextHP > 0) {
                currentHP.set(ore.id, nextHP);
              } else {
                currentHP.delete(ore.id);
                const nextMined = new Map(currentMined);
                const delay = ORE_REGEN_MIN_MS + Math.random() * (ORE_REGEN_MAX_MS - ORE_REGEN_MIN_MS);
                nextMined.set(ore.id, Date.now() + delay);
                if (modeRef.current === "cave2") {
                  cave2MinedOresRef.current = nextMined;
                } else {
                  minedOresRef.current = nextMined;
                }
                dropGroundItems(ore.x, modeRef.current as "cave" | "cave2", ["stone", ore.kind]);
              }
              saveWorld();
            }
          } else if (ts.kind === "axe" && modeRef.current !== "cave" && modeRef.current !== "cave2") {
            const props = getProps();
            let bestTree: Prop | null = null;
            let bestTreeD = 60;
            for (const p of props) {
              if (p.type !== "tree") continue;
              if (treesBrokenRef.current.has(p.x)) continue;
              const trunkCenter = p.x + 13;
              if (isFacingRight && trunkCenter < playerCenter) continue;
              if (!isFacingRight && trunkCenter > playerCenter) continue;
              const d = Math.abs(trunkCenter - playerCenter);
              if (d <= 50) {
                if (d < bestTreeD) {
                  bestTreeD = d;
                  bestTree = p;
                }
              }
            }

            let bestPlanted: PlantedTree | null = null;
            let bestPlantedD = 60;
            for (const pl of plantedRef.current) {
              const age = (Date.now() - pl.plantedAt) / 1000;
              if (age < SAPLING_GROW_S) continue;
              const trunkCenter = pl.x + 13;
              if (isFacingRight && trunkCenter < playerCenter) continue;
              if (!isFacingRight && trunkCenter > playerCenter) continue;
              const d = Math.abs(trunkCenter - playerCenter);
              if (d <= 50) {
                if (d < bestPlantedD) {
                  bestPlantedD = d;
                  bestPlanted = pl;
                }
              }
            }

            const chopTarget = bestTree
              ? { x: bestTree.x, variant: bestTree.variant ?? 0, isPlanted: false }
              : bestPlanted
              ? { x: bestPlanted.x, variant: bestPlanted.variant, isPlanted: true, treeObj: bestPlanted }
              : null;

            if (chopTarget) {
              const usingAxe = inventoryRef.current.axe > 0;
              if (usingAxe || stoneChargesRef.current > 0 || inventoryRef.current.stones > 0) {
                ts.hasHit = true;
                const targetX = chopTarget.x;
                const nowMs = performance.now();
                playOneShot(woodHitSfxAsset.url, (ambientVolume / 100) * 0.7);

                if (!usingAxe) {
                  if (stoneChargesRef.current > 0) {
                    stoneChargesRef.current -= 1;
                    if (stoneChargesRef.current === 0) {
                      setInventory((inv) => ({ ...inv, stones: Math.max(0, inv.stones - 1) }));
                    }
                  } else {
                    stoneChargesRef.current = TREE_MAX_HP - 1;
                  }
                }

                const maxHits = TREE_MAX_HP;
                const hpKey = chopTarget.isPlanted ? `p:${chopTarget.treeObj!.id}` : `n:${chopTarget.x}`;
                const prevHP = treeHPRef.current.get(hpKey) ?? maxHits;
                const damage = usingAxe ? 3 : 1;
                const nextHP = prevHP - damage;

                if (nextHP > 0) {
                  treeHPRef.current.set(hpKey, nextHP);
                  flashPickup(t("msg.tree", { n: nextHP, max: maxHits }));
                } else {
                  treeHPRef.current.delete(hpKey);
                  if (chopTarget.isPlanted) {
                    plantedRef.current = plantedRef.current.filter((pl) => pl !== chopTarget.treeObj);
                  } else {
                    treesBrokenRef.current.set(targetX, nowMs);
                  }

                  const count = Math.min(3, chopTarget.variant + 1);
                  const nowChop = Date.now();
                  const newLogs: GroundLog[] = [];
                  for (let i = 0; i < count; i++) {
                    newLogs.push({
                      id: `${chopTarget.x}-${nowMs}-${i}`,
                      x: chopTarget.x + 4 + i * 11,
                      droppedAt: nowChop + i,
                    });
                  }
                  groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
                  enforceCombinedGroundLimit();

                  const seedCount = 1 + Math.floor(Math.random() * 2);
                  const newSeeds: GroundSeed[] = [];
                  for (let i = 0; i < seedCount; i++) {
                    newSeeds.push({
                      id: `seed-${chopTarget.x}-${nowMs}-${i}`,
                      x: chopTarget.x + 18 + i * 6,
                    });
                  }
                  seedsRef.current = [...seedsRef.current, ...newSeeds];
                  flashPickup(
                    t("msg.treeFelled", { logs: count, seeds: seedCount })
                  );
                }
                saveWorld();
              } else {
                ts.hasHit = true;
                flashPickup(t("msg.needStones"));
              }
            }

            // Also try to chop a palm during the SAME axe swing — the palm
            // that's actually within the axe's reach in front of the player,
            // not whichever palm the mouse is over.
            if (!ts.hasHit) {
              let bestPalm: PalmPos | null = null;
              let bestPalmIsExtra = false;
              let bestPalmD = 60;
              const scanPalmList = (list: PalmPos[], isExtra: boolean) => {
                for (const p of list) {
                  if (!isExtra && brokenPalmsRef.current.has(p.wx)) continue;
                  const trunkCenter = p.wx + 2;
                  if (isFacingRight && trunkCenter < playerCenter) continue;
                  if (!isFacingRight && trunkCenter > playerCenter) continue;
                  const d = Math.abs(trunkCenter - playerCenter);
                  if (d <= 50 && d < bestPalmD) {
                    bestPalmD = d;
                    bestPalm = p;
                    bestPalmIsExtra = isExtra;
                  }
                }
              };
              for (const side of ["left", "right"] as const) scanPalmList(getPalms(side), false);
              scanPalmList(extraPalmsRef.current, true);
              if (bestPalm) {
                const palm: PalmPos = bestPalm;
                const usingAxe = inventoryRef.current.axe > 0;
                if (usingAxe) {
                  ts.hasHit = true;
                  const nowMs = performance.now();
                  playOneShot(woodHitSfxAsset.url, (ambientVolume / 100) * 0.7);
                  const damage = Math.ceil(PALM_MAX_HP / 3);
                  const prevHP = palmHPRef.current.get(palm.wx) ?? PALM_MAX_HP;
                  const nextHP = prevHP - damage;
                  if (nextHP > 0) {
                    palmHPRef.current.set(palm.wx, nextHP);
                    flashPickup(t("msg.palm", { n: nextHP, max: PALM_MAX_HP }));
                  } else {
                    palmHPRef.current.delete(palm.wx);
                    if (bestPalmIsExtra) {
                      extraPalmsRef.current = extraPalmsRef.current.filter((pp) => pp !== palm);
                    } else {
                      brokenPalmsRef.current = new Set(brokenPalmsRef.current).add(palm.wx);
                      brokenPalmsAtRef.current.set(palm.wx, nowMs);
                    }
                    const logCount = 2 + Math.floor(Math.random() * 2);
                    const nowPalm = Date.now();
                    const newLogs: GroundLog[] = [];
                    for (let i = 0; i < logCount; i++) {
                      newLogs.push({
                        id: `palm-${palm.wx}-${nowMs}-${i}`,
                        x: palm.wx + 4 + i * 11,
                        droppedAt: nowPalm + i,
                      });
                    }
                    groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
                    enforceCombinedGroundLimit();
                    const seedCount = 1 + Math.floor(Math.random() * 2);
                    setInventory((inv) => ({ ...inv, palmSeeds: inv.palmSeeds + seedCount }));
                    flashPickup(t("msg.palmFelled", { logs: logCount, seeds: seedCount }));
                  }
                  saveWorld();
                }
              }
            }
          }
        }
      }

      const s = stateRef.current;
      const inCave = modeRef.current === "cave";
      const inCave2 = modeRef.current === "cave2";
      const worldW = inCave2 ? CAVE2_W : inCave ? CAVE_W : WORLD_W;
      // Fractional camera position — used by slow parallax layers (mountains,
      // clouds, horizon islands) so they don't stutter when the integer camX
      // jumps 1–2px per frame with variable dt.
      const camXfRaw = s.x - VW / 2 + SPRITE_W / 2;
      const camXf = Math.max(0, Math.min(worldW - VW, camXfRaw));
      // Integer camera derived from the ROUNDED player position, not from
      // rounding camXf. This way `roundedPlayerX - camX` is EXACTLY the
      // constant `VW/2 - SPRITE_W/2` every frame, so the character stays
      // pinned to the screen center with zero 1px tremor relative to the
      // camera. All other entities snap to whole pixels as usual.
      const playerRoundedX = Math.round(s.x);
      let camX = playerRoundedX - Math.round(VW / 2 - SPRITE_W / 2);
      if (camX < 0) camX = 0;
      if (camX > worldW - VW) camX = worldW - VW;
      camXRef.current = camX;

      // Follow the player with the CSS zoom transform so zooming stays
      // focused on the character even near world edges (when the camera
      // clamp stops centering the player). Account for the manual vertical
      // camera offset so the zoom still tracks the player after the view
      // has been shifted up or down.
      const playerScreenX = playerRoundedX - camX + SPRITE_W / 2;
      const playerScreenY = s.y + SPRITE_H / 2 - camYRef.current;
      const originX = Math.max(0, Math.min(100, (playerScreenX / VW) * 100));
      const originY = Math.max(0, Math.min(100, (playerScreenY / VH) * 100));
      const originStr = `${originX.toFixed(1)}% ${originY.toFixed(1)}%`;
      if (canvas.style.transformOrigin !== originStr) {
        canvas.style.transformOrigin = originStr;
      }

      // Apply the manual vertical camera offset to the canvas context so
      // the whole rendered frame shifts up or down while keeping the
      // player centered horizontally.
      ctx.save();
      ctx.translate(0, -camYRef.current);



      // Prune regen-eligible stones and compute per-frame visibility sets.
      const nowMs = now;
      for (const [id, t] of stonesTakenRef.current) {
        if (nowMs - t > STONE_RESPAWN_MS) stonesTakenRef.current.delete(id);
      }
      const takenStoneIds = new Set<number>(stonesTakenRef.current.keys());
      const choppedSet = new Set<number>(treesBrokenRef.current.keys());
      const stumpSet = new Set<number>();
      for (const [x, t] of treesBrokenRef.current) {
        if (nowMs - t < STUMP_LIFESPAN_MS) stumpSet.add(x);
      }
      // Prune mined rocks past ROCK_RESPAWN_MS; when one respawns, seed a
      // new "extra rock" at a random empty spot on the grass so rocks
      // re-appear elsewhere instead of the same slot.
      if (minedRocksRef.current.size > 0) {
        let dirty = false;
        for (const [x, t] of minedRocksRef.current) {
          if (nowMs - t >= ROCK_RESPAWN_MS) {
            minedRocksRef.current.delete(x);
            const spot = findEmptyRockSpot(
              getProps(),
              extraRocksRef.current,
              blueprintsRef.current,
              builtRef.current,
              minedRocksRef.current,
              caveEntranceXRef.current,
            );
            if (spot != null) {
              extraRocksRef.current = [...extraRocksRef.current, { x: spot }];
            }
            dirty = true;
          }
        }
        if (dirty) saveWorld();
      }
      // ----- Regrow felled palms after PALM_REGROW_MS -----
      if (brokenPalmsRef.current.size > 0) {
        let palmDirty = false;
        const nextSet = new Set(brokenPalmsRef.current);
        for (const wx of brokenPalmsRef.current) {
          if (!brokenPalmsAtRef.current.has(wx)) {
            brokenPalmsAtRef.current.set(wx, nowMs);
            continue;
          }
          const t = brokenPalmsAtRef.current.get(wx)!;
          if (nowMs - t >= PALM_REGROW_MS) {
            nextSet.delete(wx);
            brokenPalmsAtRef.current.delete(wx);
            palmDirty = true;
          }
        }
        if (palmDirty) {
          brokenPalmsRef.current = nextSet;
          saveWorld();
        }
      }
      const minedRocksSet = new Set<number>(minedRocksRef.current.keys());

      if (inCave) {
        // ----- Regenerate mined ores after ORE_REGEN_MS as NEW ores at random empty spots.
        //       We NEVER remove or move existing ores — the mined spot stays empty,
        //       and a fresh ore of random kind appears somewhere else in the cave.
        if (minedOresRef.current.size > 0) {
          const wallClockMs = Date.now();
          let dirty = false;
          const lo = CAVE_EXIT_X + 90;
          const hi = CAVE_WALL_X - 40;
          const kinds: OreKind[] = ["coal", "copper", "bronze"];
          for (const [id, t] of minedOresRef.current) {
            if (wallClockMs < t) continue;
            // Pick a random empty spot away from every existing UNMINED ore
            // (≥42px). Mined-but-still-in-array ores are ignored so the
            // cave doesn't stay "crowded" with ghost slots forever.
            let nx: number | null = null;
            for (let tries = 0; tries < 60; tries++) {
              const cand = Math.round(lo + Math.random() * (hi - lo));
              const ok = caveOresRef.current.every(
                (o) => o.id === id || minedOresRef.current.has(o.id) || Math.abs(o.x - cand) >= 42,
              );
              if (ok) {
                nx = cand;
                break;
              }
            }
            if (nx == null) {
              // Cave is crowded right now — try again in ~2s instead of
              // stacking an ore on top of another.
              minedOresRef.current.set(id, wallClockMs + 2000);
              continue;
            }
            const nkind = kinds[Math.floor(Math.random() * kinds.length)];
            const nid = `${nkind}-r-${nx}-${wallClockMs}-${Math.floor(Math.random() * 1000)}`;
            // Drop the old mined slot from the array and append the fresh
            // ore. This keeps caveOresRef from growing unbounded across
            // long play sessions.
            caveOresRef.current = [
              ...caveOresRef.current.filter((o) => o.id !== id),
              { id: nid, x: nx, kind: nkind },
            ];
            // Consume the mined entry so it doesn't keep spawning new ores every frame.
            minedOresRef.current.delete(id);
            dirty = true;
          }
          if (dirty) saveWorld();
        }
        drawCaveScene(ctx, camX, now / 1000, camXf);
        // ----- Cave ores (only unbroken ones) -----
        for (const ore of caveOresRef.current) {
          if (minedOresRef.current.has(ore.id)) continue;
          const sx = ore.x - camX;
          if (sx < -20 || sx > VW + 20) continue;
          drawOre(ctx, Math.round(sx), GROUND_Y, ore.kind);
        }
        // ----- Items dropped on the cave floor (ore loot / hotbar discards).
        for (const it of groundItemsRef.current) {
          if (it.mode !== "cave") continue;
          const sx = it.x - camX;
          if (sx < -12 || sx > VW + 12) continue;
          const img = getItemIconImage(it.kind);
          const gy = GROUND_Y;
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(Math.round(sx) - 1, Math.round(gy) - 1, 14, 2);
          if (img) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, Math.round(sx) - 2, Math.round(gy - 12), 16, 16);
          } else {
            ctx.fillStyle = "#f4e9c1";
            ctx.fillRect(Math.round(sx), Math.round(gy - 10), 10, 10);
          }
        }
        // ----- End wall (dark stone barrier) or portal to level 2 -----
        if (!caveWallBrokenRef.current) {
          const wx = CAVE_WALL_X - camX;
          if (wx > -30 && wx < VW + 30) {
            drawCaveWall(ctx, Math.round(wx), GROUND_Y);
          }
        } else {
          const wx = CAVE_WALL_X - camX;
          if (wx > -40 && wx < VW + 40) {
            drawCave2Portal(ctx, Math.round(wx), GROUND_Y, now / 1000);
          }
        }
        // ----- Torches the player has hung on the walls -----
        for (const torch of placedTorchesRef.current) {
          const tx = torch.x - camX;
          if (tx < -20 || tx > VW + 20) continue;
          drawWallTorch(ctx, Math.round(tx), GROUND_Y, now / 1000);
        }
        // ----- Ore HP bars (only for damaged ores near the player) -----
        {
          const playerCX2 = s.x + SPRITE_W / 2;
          for (const ore of caveOresRef.current) {
            if (minedOresRef.current.has(ore.id)) continue;
            const hp = caveOreHPRef.current.get(ore.id);
            const oreMax = oreMaxHp(ore.kind);
            if (hp == null || hp >= oreMax) continue;
            if (Math.abs(ore.x - playerCX2) > HP_BAR_VIEW_RANGE) continue;
            const pct = Math.max(0, Math.min(1, hp / oreMax));
            const bx = Math.round(ore.x - 7 - camX);
            const by = GROUND_Y - 22;
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(bx - 1, by - 1, 16, 4);
            ctx.fillStyle = "#3a1010";
            ctx.fillRect(bx, by, 14, 2);
            ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
            ctx.fillRect(bx, by, Math.round(14 * pct), 2);
          }
        }
        // ----- Darkness overlay: paint the cave dark EVERYWHERE except
        //       inside the player's crisp "vision zone", then add warm
        //       torch light on top. The zone is cut with evenodd so we
        //       never touch the cave background pixels themselves (no
        //       destination-out — that was erasing the bg and letting
        //       the page color show through as a blue ball). -----
        {
          const VISION_R = 40;
          const EXIT_R = 60;
          const vcx = s.x + SPRITE_W / 2 - camX;
          const vcy = s.y + SPRITE_H / 2;
          // Light coming in from the outside through the cave exit —
          // centered low so a circular pool doesn't spill into the ceiling.
          const ecx = CAVE_EXIT_X - camX;
          const ecy = GROUND_Y - 10;

          // Build the darkness on an offscreen canvas so we can punch the
          // vision + exit holes as a proper UNION (overlaps stay lit).
          // Using evenodd on the main ctx made overlapping circles
          // re-darken the intersection, which is the "dark patch when the
          // lights touch" the user reported.
          let off = darkOffscreenRef.current;
          if (!off || off.width !== VW || off.height !== VH) {
            off = document.createElement("canvas");
            off.width = VW;
            off.height = VH;
            darkOffscreenRef.current = off;
          }
          const octx = off.getContext("2d")!;
          octx.globalCompositeOperation = "source-over";
          octx.clearRect(0, 0, VW, VH);
          octx.fillStyle = "rgba(0,0,0,0.82)";
          octx.fillRect(0, 0, VW, VH);
          octx.globalCompositeOperation = "destination-out";
          octx.fillStyle = "#000";
          octx.beginPath();
          octx.arc(vcx, vcy, VISION_R, 0, Math.PI * 2);
          octx.fill();
          octx.beginPath();
          octx.arc(ecx, ecy, EXIT_R, 0, Math.PI * 2);
          octx.fill();
          // Each hung torch reveals a vision circle just like the player/exit.
          for (const torch of placedTorchesRef.current) {
            const tcx = torch.x - camX;
            const tcy = GROUND_Y - 14;
            octx.beginPath();
            octx.arc(tcx, tcy, TORCH_LIGHT_RADIUS, 0, Math.PI * 2);
            octx.fill();
          }
          ctx.drawImage(off, 0, 0);

        }
        // Hint when the cave is unlit and the player has no torches.
        if (placedTorchesRef.current.length === 0 && inventoryRef.current.torches === 0) {
          ctx.save();
          ctx.font = "10px monospace";
          ctx.fillStyle = "rgba(255,214,102,0.9)";
          ctx.textAlign = "center";
          ctx.fillText(t("cave.dark"), VW / 2, 22);
          ctx.restore();
        }
      } else if (inCave2) {
        // ----- Regenerate mined cave-2 ores after ORE_REGEN_MS as NEW ores
        //       inside a random cleared segment (never over water/pit, and
        //       ≥42px from every existing cave-2 ore).
        if (cave2MinedOresRef.current.size > 0) {
          const wallClockMs = Date.now();
          let dirty = false;
          const baseKinds: OreKind[] = ["coal", "copper", "bronze"];
          const clearedSegs = cave2SegsRef.current.filter(
            (seg) =>
              seg.kind !== "start" &&
              seg.kind !== "end" &&
              cave2ClearedRef.current.has(seg.index),
          );
          for (const [id, t2] of cave2MinedOresRef.current) {
            if (wallClockMs < t2) continue;
            if (clearedSegs.length === 0) {
              cave2MinedOresRef.current.set(id, wallClockMs + 5000);
              continue;
            }
            let nx: number | null = null;
            const ORE_HALF_W = 10;
            for (let tries = 0; tries < 60; tries++) {
              const seg = clearedSegs[Math.floor(Math.random() * clearedSegs.length)];
              const cand = Math.round(seg.x + 40 + Math.random() * Math.max(1, seg.w - 80));
              let blocked = false;
              for (let dx = -ORE_HALF_W; dx <= ORE_HALF_W; dx += 2) {
                const px = cand + dx;
                if (!hasGroundAt(seg, px) || isOverWaterPool(seg, px)) {
                  blocked = true;
                  break;
                }
              }
              if (blocked) continue;
              const ok = cave2OresRef.current.every(
                (o) => o.id === id || cave2MinedOresRef.current.has(o.id) || Math.abs(o.x - cand) >= 42,
              );
              if (ok) {
                nx = cand;
                break;
              }
            }
            if (nx == null) {
              cave2MinedOresRef.current.set(id, wallClockMs + 2000);
              continue;
            }
            const nkind = Math.random() < 0.1 ? "iron" : baseKinds[Math.floor(Math.random() * baseKinds.length)];
            const nid = `c2-r-${nx}-${wallClockMs}-${Math.floor(Math.random() * 1000)}`;
            cave2OresRef.current = [
              ...cave2OresRef.current.filter((o) => o.id !== id),
              { id: nid, x: nx, kind: nkind },
            ];
            cave2MinedOresRef.current.delete(id);
            dirty = true;
          }
          if (dirty) saveWorld();
        }
        // ----- Cave 2 scene -----
        drawCave2Scene(
          ctx,
          camX,
          VW,
          VH,
          GROUND_Y,
          cave2SegsRef.current,
          cave2ClearedRef.current,
          cave2StalactitesRef.current,
          now,
          cave2BatsRef.current,
        );
        // Floor webs (webs room) — draw after the scene so they sit on the floor.
        for (const web of cave2FloorWebsRef.current) {
          if (cave2ConsumedWebsRef.current.has(web.id)) continue;
          const sx = web.x - camX;
          if (sx < -20 || sx > VW + 20) continue;
          drawFloorWeb(ctx, Math.round(sx), GROUND_Y);
        }
        // Centipedes — big enemy on the back wall. Cull by head position so
        // they render smoothly as they cross between rooms.
        {
          const playerCX = stateRef.current.x + SPRITE_W / 2;
          for (const c of cave2CentipedesRef.current) {
            if (!centipedeIsAwake(c, playerCX)) continue;
            const sx = c.head.x - camX;
            if (sx < -140 || sx > VW + 140) continue;
            drawCentipede(ctx, c, camX, now);
            // HP bar above the head — only when damaged.
            if (c.hp < c.maxHp && c.hp > 0) {
              const pct = c.hp / c.maxHp;
              const bw = 22;
              const bx = Math.round(c.head.x - camX - bw / 2);
              const by = Math.round(c.head.y - 18);
              ctx.fillStyle = "rgba(0,0,0,0.6)";
              ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
              ctx.fillStyle = "#3a1010";
              ctx.fillRect(bx, by, bw, 2);
              ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
              ctx.fillRect(bx, by, Math.max(1, Math.round(bw * pct)), 2);
            }

          }
        }
        // Stuck web: silk line from ceiling to player + big spider descending.
        if (stuckWebRef.current) {
          const sw = stuckWebRef.current;
          const s2 = stateRef.current;
          const sx = Math.round(s2.x + SPRITE_W / 2 - camX);
          const topY = 44 + 4;
          ctx.fillStyle = "rgba(230,235,245,0.75)";
          for (let yy = topY; yy < s2.y + 4; yy += 2) ctx.fillRect(sx, yy, 1, 1);
          // Big spider descends as player rises.
          const spiderY = Math.min(s2.y - 6, topY + Math.round(sw.pullY * 0.6));
          drawBigSpider(ctx, sx, Math.round(spiderY), now / 60);
        }
        // Exit portal back to cave1
        drawCave2ExitPortal(ctx, CAVE2_RETURN_X - camX, GROUND_Y, now / 1000);
        // Torches the player has hung inside cave 2
        for (const torch of placedTorchesCave2Ref.current) {
          const tx = torch.x - camX;
          if (tx < -20 || tx > VW + 20) continue;
          drawWallTorch(ctx, Math.round(tx), GROUND_Y, now / 1000);
        }

        // Ores in cleared segments
        for (const ore of cave2OresRef.current) {
          if (cave2MinedOresRef.current.has(ore.id)) continue;
          const sx = ore.x - camX;
          if (sx < -20 || sx > VW + 20) continue;
          drawOre(ctx, Math.round(sx), GROUND_Y, ore.kind);
        }
        // Items dropped inside cave 2 (ore loot / hotbar discards).
        for (const it of groundItemsRef.current) {
          if (it.mode !== "cave2") continue;
          const sx = it.x - camX;
          if (sx < -12 || sx > VW + 12) continue;
          const img = getItemIconImage(it.kind);
          const gy = GROUND_Y;
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(Math.round(sx) - 1, Math.round(gy) - 1, 14, 2);
          if (img) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, Math.round(sx) - 2, Math.round(gy - 12), 16, 16);
          } else {
            ctx.fillStyle = "#f4e9c1";
            ctx.fillRect(Math.round(sx), Math.round(gy - 10), 10, 10);
          }
        }
        // Ore HP bars
        {
          const playerCX2 = s.x + SPRITE_W / 2;
          for (const ore of cave2OresRef.current) {
            if (cave2MinedOresRef.current.has(ore.id)) continue;
            const hp = cave2OreHPRef.current.get(ore.id);
            const oreMax = oreMaxHp(ore.kind);
            if (hp == null || hp >= oreMax) continue;
            if (Math.abs(ore.x - playerCX2) > HP_BAR_VIEW_RANGE) continue;
            const pct = Math.max(0, Math.min(1, hp / oreMax));
            const bx = Math.round(ore.x - 7 - camX);
            const by = GROUND_Y - 22;
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(bx - 1, by - 1, 16, 4);
            ctx.fillStyle = "#3a1010";
            ctx.fillRect(bx, by, 14, 2);
            ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
            ctx.fillRect(bx, by, Math.round(14 * pct), 2);
          }
        }
        // ----- Darkness overlay: cave 2 is unlit like cave 1. Vision hole
        //       around the player plus the exit portal so the return route
        //       is always visible. -----
        {
          const VISION_R = 40;
          const PORTAL_R = 50;
          const vcx = s.x + SPRITE_W / 2 - camX;
          const vcy = s.y + SPRITE_H / 2;
          const pcx = CAVE2_RETURN_X - camX;
          const pcy = GROUND_Y - 10;
          let off = darkOffscreenRef.current;
          if (!off || off.width !== VW || off.height !== VH) {
            off = document.createElement("canvas");
            off.width = VW;
            off.height = VH;
            darkOffscreenRef.current = off;
          }
          const octx = off.getContext("2d")!;
          octx.globalCompositeOperation = "source-over";
          octx.clearRect(0, 0, VW, VH);
          octx.fillStyle = "rgba(0,0,0,0.82)";
          octx.fillRect(0, 0, VW, VH);
          octx.globalCompositeOperation = "destination-out";
          octx.fillStyle = "#000";
          octx.beginPath();
          octx.arc(vcx, vcy, VISION_R, 0, Math.PI * 2);
          octx.fill();
          octx.beginPath();
          octx.arc(pcx, pcy, PORTAL_R, 0, Math.PI * 2);
          octx.fill();
          for (const torch of placedTorchesCave2Ref.current) {
            const tcx = torch.x - camX;
            const tcy = GROUND_Y - 14;
            octx.beginPath();
            octx.arc(tcx, tcy, TORCH_LIGHT_RADIUS, 0, Math.PI * 2);
            octx.fill();
          }
          ctx.drawImage(off, 0, 0);
        }
        // Red hit flash overlay right after taking damage.
        {
          const flash = cave2DeathFlashRef.current;
          if (flash) {
            const dt = performance.now() - flash;
            if (dt < 350) {
              const a = (1 - dt / 350) * 0.4;
              ctx.fillStyle = `rgba(200, 40, 40, ${a.toFixed(2)})`;
              ctx.fillRect(0, 0, VW, VH);
            }
          }
        }
      } else {

      drawScene(
        ctx,
        camX,
        now / 1000,
        s.submersion,
        false,
        beachBgImgRef.current,
        {
          choppedTrees: choppedSet,
          visibleStumps: stumpSet,
          takenStones: takenStoneIds,
          pickedProps: pickedPropsRef.current,
          brokenPalms: brokenPalmsRef.current,
          extraPalms: extraPalmsRef.current,
          minedRocks: minedRocksSet,
          extraRocks: extraRocksRef.current,
          groundLogs: groundLogsRef.current,
          groundPebbles: groundPebblesRef.current,
          groundItems: groundItemsRef.current,
          seeds: seedsRef.current,
          planted: plantedRef.current,
          now: Date.now(),
        },
        camXf,
      );

      // ----- Cave entrance overlay: rocky mountain with an arched cave mouth -----
      // The cave entrance is now an authored sprite; the old procedural override
      // is intentionally ignored so the authored art is shown cleanly.
      {
        const cx = caveEntranceXRef.current;
        const sxE = cx - camX;
        if (sxE > -CAVE_ENTRANCE_DRAW_W - 20 && sxE < VW + CAVE_ENTRANCE_DRAW_W + 20) {
          const baseX = Math.round(sxE);
          const baseY = GROUND_Y + 1;
          const img = caveEntranceImgRef.current;
          if (img && img.complete && img.naturalWidth) {
            const scale = 0.45;
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            // Anchor at the bottom-center of the sprite's opaque area so the
            // cave mouth sits flush with the ground line (no floating).
            const anchorX = 243; // opaque center x in source pixels
            const anchorY = 256; // sprite bottom in source pixels
            const dx = baseX - anchorX * scale;
            const dy = baseY - anchorY * scale;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
          } else {
            drawCaveEntranceRaw(ctx, baseX, baseY);
          }
        }
      }



      // ----- Ambient insects (decorative wandering) -----
      if (!inCave) {
        if (!insectsRef.current) insectsRef.current = spawnInsects();
        updateInsects(insectsRef.current, dt, now / 1000);
        drawInsects(ctx, insectsRef.current, camX, now / 1000);
      }


      // ----- Tree HP bars (only for damaged trees near the player) -----
      const playerCX = s.x + SPRITE_W / 2;
      const drawHPBar = (worldX: number, hp: number) => {
        const pct = Math.max(0, Math.min(1, hp / TREE_MAX_HP));
        const bx = Math.round(worldX + 13 - 7 - camX); // centered on trunk
        const by = GROUND_Y - 58;
        // frame
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(bx - 1, by - 1, 16, 4);
        // background
        ctx.fillStyle = "#3a1010";
        ctx.fillRect(bx, by, 14, 2);
        // fill
        ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
        ctx.fillRect(bx, by, Math.round(14 * pct), 2);
      };
      if (treeHPRef.current.size > 0) {
        const propsForHP = getProps();
        for (const p of propsForHP) {
          if (p.type !== "tree") continue;
          if (treesBrokenRef.current.has(p.x)) continue;
          if (Math.abs(p.x + 13 - playerCX) > HP_BAR_VIEW_RANGE) continue;
          const hp = treeHPRef.current.get(`n:${p.x}`);
          if (hp == null || hp >= TREE_MAX_HP) continue;
          drawHPBar(p.x, hp);
        }
        for (const pl of plantedRef.current) {
          const age = (Date.now() - pl.plantedAt) / 1000;
          if (age < SAPLING_GROW_S) continue;
          if (Math.abs(pl.x + 13 - playerCX) > HP_BAR_VIEW_RANGE) continue;
          const hp = treeHPRef.current.get(`p:${pl.id}`);
          if (hp == null || hp >= TREE_MAX_HP) continue;
          drawHPBar(pl.x, hp);
        }
      }
      if (palmHPRef.current.size > 0) {
        for (const [wx, hp] of palmHPRef.current) {
          if (brokenPalmsRef.current.has(wx)) continue;
          if (Math.abs(wx + 2 - playerCX) > HP_BAR_VIEW_RANGE) continue;
          if (hp >= PALM_MAX_HP) continue;
          // Reuse the tree HP bar renderer but scale the fill to palm max.
          const pct = Math.max(0, Math.min(1, hp / PALM_MAX_HP));
          const bx = Math.round(wx + 2 - 7 - camX);
          const by = GROUND_Y - 58;
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(bx - 1, by - 1, 16, 4);
          ctx.fillStyle = "#3a1010";
          ctx.fillRect(bx, by, 14, 2);
          ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
          ctx.fillRect(bx, by, Math.round(14 * pct), 2);
        }
      }
      // ----- Rock HP bars (damaged forest rocks near the player) -----
      if (rockHPRef.current.size > 0) {
        for (const [wx, hp] of rockHPRef.current) {
          if (minedRocksRef.current.has(wx)) continue;
          if (Math.abs(wx + 6 - playerCX) > HP_BAR_VIEW_RANGE) continue;
          if (hp >= ROCK_MAX_HP) continue;
          const pct = Math.max(0, Math.min(1, hp / ROCK_MAX_HP));
          const bx = Math.round(wx + 6 - 7 - camX);
          const by = GROUND_Y - 20;
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillRect(bx - 1, by - 1, 16, 4);
          ctx.fillStyle = "#3a1010";
          ctx.fillRect(bx, by, 14, 2);
          ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
          ctx.fillRect(bx, by, Math.round(14 * pct), 2);
        }
      }



      // ----- Built structures and blueprints -----
      for (const b of builtRef.current) {
        const sx = b.x - camX;
        if (sx < -32 || sx > VW + 32) continue;
        // If an admin override exists for this kind, it fully replaces the
        // procedural art (so erased pixels stay erased). Otherwise draw the
        // default procedural version.
        // Furnace uses two possible overrides: "furnace" when actively smelting,
        // "furnaceOff" otherwise (so admins can paint a variant without fire).
        const furnaceLit = b.kind === "furnace"
          ? !!(b.smeltJob && b.smeltJob.endsAt > Date.now())
          : false;
        const overrideKind: SceneryKind = b.kind === "furnace" && !furnaceLit
          ? "furnaceOff"
          : b.kind;
        const override = getSceneryOverride(overrideKind);
        if (override) {
          paintSceneryFor(ctx, overrideKind, Math.round(sx), GROUND_Y);
        } else if (b.kind === "bench") {
          drawSawBench(ctx, sx, GROUND_Y, 1, b.variant === "saw" ? "saw" : "common");
        } else if (b.kind === "workshop") {
          drawWorkshopBench(ctx, sx, GROUND_Y, 1);
        } else if (b.kind === "furnace") {
          drawFurnace(ctx, sx, GROUND_Y, 1, furnaceLit);
        } else if (b.kind === "chest") {
          drawChest(ctx, sx, GROUND_Y, 1);
        } else if (b.kind === "anvil") {
          drawAnvil(ctx, sx, GROUND_Y, 1);
        }

        // Raw metal (or finished bar, when ready to collect) sitting on top
        // of the anvil during / after a forge job.
        if (b.kind === "anvil" && b.forgeJob) {
          const job = b.forgeJob;
          const done = job.hits >= job.hitsRequired;
          const ax = Math.round(sx);
          const topY = GROUND_Y - 8; // anvil top plate lives ~8px above ground
          const size = 8; // small so it fits on the anvil
          const drawX = ax + Math.floor((14 - size) / 2);
          ctx.imageSmoothingEnabled = false;
          if (done) {
            // Draw a tiny procedural bar (copperBar/bronzeBar aren't ItemKinds
            // so they have no icon image). Gentle float = "pick me up".
            const bob = Math.round(Math.sin(performance.now() / 260) * 1);
            const y0 = topY - size - 1 + bob;
            const isCopper = job.barKind === "copperBar";
            const border = isCopper ? "#5a2a10" : "#4a3418";
            const base = isCopper ? "#c97a45" : "#a88245";
            const hi = isCopper ? "#ffb070" : "#e8c880";
            ctx.fillStyle = border;
            ctx.fillRect(drawX, y0 + 2, 8, 4);
            ctx.fillStyle = base;
            ctx.fillRect(drawX + 1, y0 + 3, 6, 2);
            ctx.fillStyle = hi;
            ctx.fillRect(drawX + 1, y0 + 3, 6, 1);
          } else {
            const img = getItemIconImage(job.rawKind);
            if (img) {
              const pulse = Math.round(Math.sin(performance.now() / 140) * 1);
              ctx.drawImage(img, drawX, topY - size - 1 + pulse, size, size);
            }
            const pct = Math.max(0, Math.min(1, job.hits / job.hitsRequired));
            const bx = ax + 1;
            const by = topY - size - 5;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(bx - 1, by - 1, 14, 3);
            ctx.fillStyle = "#2a1a08";
            ctx.fillRect(bx, by, 12, 1);
            ctx.fillStyle = "#ffb060";
            ctx.fillRect(bx, by, Math.round(12 * pct), 1);
          }
        }

        // Animated smoke rising from the chimney while the furnace is lit.
        if (b.kind === "furnace" && furnaceLit) {
          const x = Math.round(sx);
          const y = GROUND_Y;
          const t = performance.now() / 1000;
          // Chimney center (grid col ~9, anchor col 1 → sx + 8).
          const cx = x + 8;
          // Four staggered puffs climb higher, grow, and fade.
          for (let i = 0; i < 4; i++) {
            const phase = (t * 0.5 + i * 0.25) % 1;
            const rise = Math.floor(phase * 18);      // 0..17 pixels up
            const drift = Math.round(Math.sin((t + i) * 1.6) * 2); // -2..2
            const alpha = 0.6 * (1 - phase);
            if (alpha <= 0.03) continue;
            // Puff grows as it rises.
            const size = 2 + Math.floor(phase * 3);   // 2..4 px
            const px = cx + drift - Math.floor(size / 2);
            const py = y - 22 - rise;
            ctx.fillStyle = `rgba(220,220,220,${alpha.toFixed(2)})`;
            ctx.fillRect(px, py, size, size);
            // Softer inner highlight to give a fluffier feel.
            if (size >= 3) {
              ctx.fillStyle = `rgba(245,245,245,${(alpha * 0.7).toFixed(2)})`;
              ctx.fillRect(px + 1, py, size - 2, 1);
            }
          }
        }


        // Damage bar over damaged builds (mirrors ore HP style).
        const hp = b.hp ?? BUILD_MAX_HP;
        if (hp < BUILD_MAX_HP) {
          const pct = Math.max(0, Math.min(1, hp / BUILD_MAX_HP));
          const bx = Math.round(sx + 10 - 7);
          const by = GROUND_Y - 26;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(bx - 1, by - 1, 16, 4);
          ctx.fillStyle = "#2a1010";
          ctx.fillRect(bx, by, 14, 2);
          ctx.fillStyle = pct > 0.5 ? "#7ad07a" : pct > 0.25 ? "#e8c94a" : "#e05a4a";
          ctx.fillRect(bx, by, Math.round(14 * pct), 2);
        }
        // Repair progress marker (blue) when repair materials are being brought.
        if (b.repairing && (b.repairCost ?? 0) > 0) {
          const rp = Math.max(0, Math.min(1, (b.repairDelivered ?? 0) / (b.repairCost ?? 1)));
          const bx = Math.round(sx + 10 - 7);
          const by = GROUND_Y - 30;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(bx - 1, by - 1, 16, 3);
          ctx.fillStyle = "#0a2848";
          ctx.fillRect(bx, by, 14, 1);
          ctx.fillStyle = "#58a8ff";
          ctx.fillRect(bx, by, Math.round(14 * rp), 1);

          // Missing repair materials floating above — mirrors the blueprint
          // hint style so damaged builds telegraph what they still need.
          const done = b.repairDelivered ?? 0;
          const total = b.repairCost ?? 0;
          if (total > done) {
            const mat = repairMaterialFor(b.kind);
            const kind: ItemKind = mat === "wood" ? "wood" : "stone";
            const label = `${done}/${total}`;
            const iconSize = 12;
            const cellGap = 2;
            const charW = 3;
            const charH = 5;
            const charGap = 1;
            const labelW = label.length * charW + (label.length - 1) * charGap;
            const totalW = iconSize + cellGap + labelW;
            const startX = Math.round(sx + 10 - totalW / 2);
            const boxY = by - 20;
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(startX - 3, boxY - 2, totalW + 6, iconSize + 4);
            ctx.imageSmoothingEnabled = false;
            const img = getItemIconImage(kind);
            if (img) {
              ctx.drawImage(img, startX, boxY, iconSize, iconSize);
            } else {
              ctx.fillStyle = "#555";
              ctx.fillRect(startX, boxY, iconSize, iconSize);
            }
            const tx = startX + iconSize + cellGap;
            const ty = boxY + Math.floor((iconSize - charH) / 2);
            const color = done > 0 ? "#ffe28a" : "#ff8a8a";
            drawPixelText(ctx, label, tx, ty, color);
          }
        }
      }
      for (const bp of blueprintsRef.current) {
        const sx = bp.x - camX;
        if (sx < -32 || sx > VW + 32) continue;
        // Blueprint ghost should match the admin-customized appearance if one
        // exists, so what you place looks like what you'll get. Fall back to
        // the procedural default only when no override is set.
        const bpOverrideKind: SceneryKind =
          bp.kind === "furnace" ? "furnaceOff" : bp.kind;
        const bpOverride = getSceneryOverride(bpOverrideKind);
        if (bpOverride) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          paintSceneryFor(ctx, bpOverrideKind, Math.round(sx), GROUND_Y);
          ctx.restore();
        } else if (bp.kind === "bench") drawSawBench(ctx, sx, GROUND_Y, 0.45);
        else if (bp.kind === "workshop") drawWorkshopBench(ctx, sx, GROUND_Y, 0.45);
        else if (bp.kind === "furnace") drawFurnace(ctx, sx, GROUND_Y, 0.45, false);
        else if (bp.kind === "chest") drawChest(ctx, sx, GROUND_Y, 0.45);
        else if (bp.kind === "anvil") drawAnvil(ctx, sx, GROUND_Y, 0.45);
        // Progress bar(s) above the blueprint. Show wood + stones separately
        // for structures that need both, so the player sees what's still owed.
        const cost = BUILD_COSTS[bp.kind];
        const totalCost = cost.wood + cost.stones + cost.coal + cost.copper + cost.bronzeMetal;
        const totalDone = bp.deliveredWood + bp.deliveredStones + bp.deliveredCoal + bp.deliveredCopper + bp.deliveredBronzeMetal;
        const pct = totalCost > 0 ? totalDone / totalCost : 1;
        const bx = Math.round(sx + 10 - 8);
        const by = GROUND_Y - 22;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bx - 1, by - 1, 18, 4);
        ctx.fillStyle = "#2a2018";
        ctx.fillRect(bx, by, 16, 2);
        ctx.fillStyle = "#c69a67";
        ctx.fillRect(bx, by, Math.round(16 * pct), 2);

        // Missing-materials hint: icons + counts floating above this blueprint.
        const hint = blueprintHintRef.current;
        if (hint && hint.id === bp.id && performance.now() < hint.until) {
          type Need = { kind: ItemKind; done: number; total: number };
          const needs: Need[] = [];
          if (cost.wood > 0 && bp.deliveredWood < cost.wood)
            needs.push({ kind: "wood", done: bp.deliveredWood, total: cost.wood });
          if (cost.stones > 0 && bp.deliveredStones < cost.stones)
            needs.push({ kind: "stone", done: bp.deliveredStones, total: cost.stones });
          if (cost.coal > 0 && bp.deliveredCoal < cost.coal)
            needs.push({ kind: "coal", done: bp.deliveredCoal, total: cost.coal });
          if (cost.copper > 0 && bp.deliveredCopper < cost.copper)
            needs.push({ kind: "copper", done: bp.deliveredCopper, total: cost.copper });
          if (cost.bronzeMetal > 0 && bp.deliveredBronzeMetal < cost.bronzeMetal)
            needs.push({ kind: "bronzeMetal", done: bp.deliveredBronzeMetal, total: cost.bronzeMetal });
          if (needs.length > 0) {
            // Text via ctx.fillText looks terrible on a pixelated-upscaled
            // canvas (grey subpixels get nearest-neighbor'd into mush), so
            // we draw counters using a hand-rolled 3×5 pixel-art digit font.
            const iconSize = 12;
            const cellGap = 2;
            const groupGap = 4;
            const labels = needs.map((n) => `${n.done}/${n.total}`);
            const charW = 3;
            const charH = 5;
            const charGap = 1;
            const labelWidths = labels.map(
              (l) => l.length * charW + (l.length - 1) * charGap,
            );
            const cellWidths = labelWidths.map((w) => iconSize + cellGap + w);
            const totalW =
              cellWidths.reduce((a, b) => a + b, 0) + groupGap * (needs.length - 1);
            const startX = Math.round(sx + 10 - totalW / 2);
            const boxY = by - 20;
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(startX - 3, boxY - 2, totalW + 6, iconSize + 4);
            ctx.imageSmoothingEnabled = false;
            let cx = startX;
            for (let i = 0; i < needs.length; i++) {
              const n = needs[i];
              const img = getItemIconImage(n.kind);
              if (img) {
                ctx.drawImage(img, cx, boxY, iconSize, iconSize);
              } else {
                ctx.fillStyle = "#555";
                ctx.fillRect(cx, boxY, iconSize, iconSize);
              }
              const tx = cx + iconSize + cellGap;
              const ty = boxY + Math.floor((iconSize - charH) / 2);
              const color =
                n.done >= n.total ? "#7fff9a" : n.done > 0 ? "#ffe28a" : "#ff8a8a";
              drawPixelText(ctx, labels[i], tx, ty, color);
              cx += cellWidths[i] + groupGap;
            }
          }
        }
      }
      // Ghost preview of the blueprint being placed — follows player x for now.
      // Also renders the ghost when a built structure is in "move" mode.
      const ghostKind: BuildKind | null = placingKindRef.current
        ?? (movingBuildRef.current
            ? (builtRef.current.find((b) => b.id === movingBuildRef.current)?.kind ?? null)
            : null);
      if (ghostKind) {
        const gx = Math.round(s.x + SPRITE_W / 2 - 10 - camX);
        ctx.save();
        ctx.globalAlpha = 0.35;
        const ghostOverrideKind: SceneryKind =
          ghostKind === "furnace" ? "furnaceOff" : ghostKind;
        const ghostOverride = getSceneryOverride(ghostOverrideKind);
        if (ghostOverride) {
          paintSceneryFor(ctx, ghostOverrideKind, Math.round(gx), GROUND_Y);
        } else if (ghostKind === "bench") drawSawBench(ctx, gx, GROUND_Y, 0.6);
        else if (ghostKind === "workshop") drawWorkshopBench(ctx, gx, GROUND_Y, 0.6);
        else if (ghostKind === "furnace") drawFurnace(ctx, gx, GROUND_Y, 0.6, false);
        else if (ghostKind === "chest") drawChest(ctx, gx, GROUND_Y, 0.6);
        else if (ghostKind === "anvil") drawAnvil(ctx, gx, GROUND_Y, 0.6);
        ctx.restore();
      }
      } // end else (world drawing)







      // Ground shadow directly under the feet — follows the sloped beach
      // (or flat cave floor when inside the cave).
      if (s.submersion < 0.02) {
        const shadowY = (inCave || inCave2) ? GROUND_Y : GROUND_Y + beachSurfaceOffset(s.x + SPRITE_W / 2);
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.fillRect(playerRoundedX - camX + 2, shadowY + 3, SPRITE_W - 4, 2);
        ctx.fillRect(playerRoundedX - camX + 3, shadowY + 5, SPRITE_W - 6, 1);
      }

      // Draw player (with water occlusion when wading)
      if (!s.dead || s.deathT < DEATH_ANIM) {
        const dyingT = s.dead ? Math.min(1, s.deathT / DEATH_ANIM) : 0;
        const spriteX = playerRoundedX - camX;
        const spriteY = Math.floor(s.y);
        ctx.save();
        if (dyingT > 0) ctx.globalAlpha = 1 - dyingT * 0.7;
        // Cave-2 underwater tint: draw the sprite to a small offscreen canvas
        // and tint it there using source-atop. Using ctx.filter with
        // hue-rotate/saturate/brightness on the main canvas triggers a
        // per-frame full-layer GPU filter pass and caused massive lag while
        // submerged. The offscreen route only touches sprite-sized pixels.
        const cave2Underwater = modeRef.current === "cave2" && s.submersion > 0.5;
        if (cave2Underwater) {
          // Extra top padding so hair styles that extend above the sprite
          // box aren't clipped by the offscreen tint canvas.
          const PAD_TOP = 10;
          let off = tintCanvasRef.current;
          if (!off || off.height !== SPRITE_H + PAD_TOP) {
            off = document.createElement("canvas");
            off.width = SPRITE_W;
            off.height = SPRITE_H + PAD_TOP;
            tintCanvasRef.current = off;
          }
          const octx = off.getContext("2d")!;
          octx.clearRect(0, 0, SPRITE_W, SPRITE_H + PAD_TOP);
          drawCharacter(
            octx,
            0,
            PAD_TOP,
            appearanceRef.current,
            {
              facing: s.facing,
              animT: s.animT,
              grounded: s.grounded,
              carrying: carriedLogsRef.current + totalCarriedBarsRef.current,
            },
          );
          octx.globalCompositeOperation = "source-atop";
          octx.fillStyle = "rgba(40,110,190,0.55)";
          octx.fillRect(0, 0, SPRITE_W, SPRITE_H + PAD_TOP);
          octx.globalCompositeOperation = "source-over";
          ctx.drawImage(off, spriteX, spriteY - PAD_TOP);
        } else {
          drawCharacter(
            ctx,
            spriteX,
            spriteY,
            appearanceRef.current,
            {
              facing: s.facing,
              animT: s.animT,
              grounded: s.grounded,
              carrying: carriedLogsRef.current + totalCarriedBarsRef.current,
            },
          );
        }

        // White silk cocoon wrapping the player while stuck in a spider web.
        // Drawn AFTER the character so it fully covers them until they escape.
        if (stuckWebRef.current) {
          const cocoonCX = Math.round(spriteX + SPRITE_W / 2);
          const cocoonCY = Math.round(spriteY + SPRITE_H / 2 + 1);
          const hw = Math.round(SPRITE_W / 2 + 3);
          const hh = Math.round(SPRITE_H / 2 + 4);
          // Build a chunky pixel-art ellipse mask using 2px "pixels" for a blocky look.
          const px = 2;
          const drawEllipseBlocks = (color: string, ox: number, oy: number, rw: number, rh: number) => {
            ctx.fillStyle = color;
            for (let y = -rh; y <= rh; y += px) {
              for (let x = -rw; x <= rw; x += px) {
                const nx = x / rw;
                const ny = y / rh;
                if (nx * nx + ny * ny <= 1) {
                  ctx.fillRect(cocoonCX + ox + x, cocoonCY + oy + y, px, px);
                }
              }
            }
          };
          // Drop shadow
          drawEllipseBlocks("rgba(0,0,0,0.28)", 2, 2, hw, hh);
          // Cocoon body
          drawEllipseBlocks("#f2f4f7", 0, 0, hw, hh);
          // Silk wrap bands (horizontal stripes)
          ctx.fillStyle = "#bec4d2";
          for (let i = -2; i <= 2; i++) {
            const yb = cocoonCY + i * Math.round(hh / 2.4);
            for (let x = -hw; x <= hw; x += px) {
              const nx = x / hw;
              const norm = (yb - cocoonCY) / hh;
              if (nx * nx + norm * norm <= 1) {
                ctx.fillRect(cocoonCX + x, yb, px, px);
              }
            }
          }
          // Highlight
          drawEllipseBlocks(
            "rgba(255,255,255,0.75)",
            -Math.round(hw / 3),
            -Math.round(hh / 2),
            Math.max(2, Math.round(hw / 4)),
            Math.max(2, Math.round(hh / 5)),
          );
        }


        // Carried logs stacked across the torso (horizontal), showing what
        // the player is hauling. Each log = 1 wood, and each slows movement.
        // Hands wrap over the ends of the top log so the pose reads as "held".
        const nLogs = carriedLogsRef.current;
        if (nLogs > 0 && (!s.dead || s.deathT < DEATH_ANIM)) {
          const torsoBaseY = spriteY + 15;
          const logX = spriteX + 1;
          for (let i = 0; i < nLogs; i++) {
            const ly = torsoBaseY - i * 3;
            // shadow tick under the stack (only lowest)
            if (i === 0) {
              ctx.fillStyle = "rgba(0,0,0,0.25)";
              ctx.fillRect(logX, ly + 3, 14, 1);
            }
            ctx.fillStyle = "#7a4a24";
            ctx.fillRect(logX, ly, 14, 3);
            ctx.fillStyle = "#a06a34";
            ctx.fillRect(logX + 1, ly, 12, 1);
            ctx.fillStyle = "#5f3a1c";
            ctx.fillRect(logX, ly + 2, 14, 1);
            ctx.fillStyle = "#3a2010";
            ctx.fillRect(logX, ly, 1, 3);
            ctx.fillRect(logX + 13, ly, 1, 3);
          }
          // Skin-tone hands gripping each end of the topmost log —
          // replaces the swinging arms so the pose reads as "carrying".
          const topLy = torsoBaseY - (nLogs - 1) * 3;
          const skin = appearanceRef.current.skin;
          const skinShadow = shadeHex(skin, -0.3);
          // left hand
          ctx.fillStyle = skinShadow;
          ctx.fillRect(logX - 2, topLy - 1, 3, 5);
          ctx.fillStyle = skin;
          ctx.fillRect(logX - 2, topLy, 3, 3);
          // right hand
          ctx.fillStyle = skinShadow;
          ctx.fillRect(logX + 13, topLy - 1, 3, 5);
          ctx.fillStyle = skin;
          ctx.fillRect(logX + 13, topLy, 3, 3);
        }
        // Carried bars on the torso — copper first, then bronze, iron on top.
        // Rendered only when the player isn't already hauling logs (logs win
        // the hand slot). If the admin painted a custom "held" variant for a
        // bar, we use that pixel art instead of the hardcoded metallic stripe
        // so edits in the Admin Panel actually show up on the character.
        const nCopperBars = inventoryRef.current.copperBar;
        const nBronzeBars = inventoryRef.current.bronzeBar;
        const nIronBars = inventoryRef.current.ironBar;
        const nBars = nCopperBars + nBronzeBars + nIronBars;
        if (nBars > 0 && carriedLogsRef.current === 0 && (!s.dead || s.deathT < DEATH_ANIM)) {
          const torsoBaseY = spriteY + 15;
          const barX = spriteX + 2;
          const stack: Array<"copperBar" | "bronzeBar" | "ironBar"> = [];
          for (let i = 0; i < nCopperBars; i++) stack.push("copperBar");
          for (let i = 0; i < nBronzeBars; i++) stack.push("bronzeBar");
          for (let i = 0; i < nIronBars; i++) stack.push("ironBar");
          const skin = appearanceRef.current.skin;
          const skinShadow = shadeHex(skin, -0.3);
          // Each bar sprite is 4px tall in the current defaults; step by 4
          // so stacked bars don't overlap and cover the row below.
          const BAR_STEP = 4;
          for (let i = 0; i < stack.length; i++) {
            const by = torsoBaseY - i * BAR_STEP;
            const kind = stack[i];
            if (i === 0) {
              ctx.fillStyle = "rgba(0,0,0,0.25)";
              ctx.fillRect(barX, by + BAR_STEP, 12, 1);
            }
            const heldPx = getItemVariantPixels(kind, "held");
            if (heldPx) {
              // Center the admin-drawn bar horizontally on the 12px stack slot.
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              for (const k of Object.keys(heldPx)) {
                const [px, py] = k.split(",").map(Number);
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
              }
              const w = maxX - minX + 1;
              const originX = barX + Math.round((12 - w) / 2) - minX;
              const originY = by - minY;
              for (const [k, color] of Object.entries(heldPx)) {
                const [px, py] = k.split(",").map(Number);
                ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                ctx.fillRect(originX + px, originY + py, 1, 1);
              }
            } else {
              const base = kind === "copperBar" ? "#b3541e" : kind === "bronzeBar" ? "#a37244" : "#a8b0bc";
              const hi   = kind === "copperBar" ? "#e08a3a" : kind === "bronzeBar" ? "#d6a15c" : "#d8dee6";
              const lo   = kind === "copperBar" ? "#7a3812" : kind === "bronzeBar" ? "#6d4826" : "#5a6270";
              const edge = kind === "ironBar" ? "#2a2f38" : "#2a1508";
              ctx.fillStyle = base; ctx.fillRect(barX, by, 12, 3);
              ctx.fillStyle = hi;   ctx.fillRect(barX + 1, by, 10, 1);
              ctx.fillStyle = lo;   ctx.fillRect(barX, by + 2, 12, 1);
              ctx.fillStyle = edge; ctx.fillRect(barX, by, 1, 3);
              ctx.fillRect(barX + 11, by, 1, 3);
            }
          }
          const topBy = torsoBaseY - (stack.length - 1) * BAR_STEP;
          ctx.fillStyle = skinShadow;
          ctx.fillRect(barX - 2, topBy - 1, 3, 5);
          ctx.fillStyle = skin;
          ctx.fillRect(barX - 2, topBy, 3, 3);
          ctx.fillStyle = skinShadow;
          ctx.fillRect(barX + 11, topBy - 1, 3, 5);
          ctx.fillStyle = skin;
          ctx.fillRect(barX + 11, topBy, 3, 3);
        }


        // Held tool — spear, axe, hoe or pickaxe visible in the front hand
        // when its slot is selected and the player owns one. Rendered as a
        // vertical shaft passing through the fist, with the tool head at the
        // top.
        {
          const selKind = getSelectedHotbarKind();
          // Any selected slot with inventory > 0 is a candidate. For the
          // built-in tools (spear/axe/hoe/pick) we fall back to hardcoded art
          // when the admin hasn't customized a "held" variant; every other
          // item kind only appears in the hand if a custom "held" variant
          // was drawn in the Admin Panel.
          const selCount =
            selKind === "stone" ? inventoryRef.current.stones :
            selKind === "wood"  ? inventoryRef.current.wood :
            selKind === "seed"  ? inventoryRef.current.seeds :
            selKind === "axe"   ? inventoryRef.current.axe :
            selKind === "hoe"   ? inventoryRef.current.hoe :
            selKind === "pick"  ? inventoryRef.current.pick :
            selKind === "copperPick" ? inventoryRef.current.copperPick :
            selKind === "copperHammer" ? inventoryRef.current.copperHammer :

            selKind === "spear" ? inventoryRef.current.spear :
            selKind === "berrySeed" ? inventoryRef.current.berrySeeds :
            selKind === "palmSeed"  ? inventoryRef.current.palmSeeds :
            selKind === "mushroom"  ? inventoryRef.current.mushrooms :
            selKind === "herb"      ? inventoryRef.current.herbs :
            selKind === "coal"      ? inventoryRef.current.coal :
            selKind === "copper"    ? inventoryRef.current.copper :
            selKind === "bronze"    ? inventoryRef.current.bronze :
            selKind === "copperMetal" ? inventoryRef.current.copperMetal :
            selKind === "bronzeMetal" ? inventoryRef.current.bronzeMetal :
            selKind === "copperBar" ? inventoryRef.current.copperBar :
            selKind === "bronzeBar" ? inventoryRef.current.bronzeBar :
            selKind === "ironBar" ? inventoryRef.current.ironBar :
            selKind === "ironMetal" ? inventoryRef.current.ironMetal :
            selKind === "torch"     ? inventoryRef.current.torches : 0;
          const isBuiltInTool = selKind === "spear" || selKind === "axe" || selKind === "hoe" || selKind === "pick" || selKind === "copperPick" || selKind === "copperHammer";
          const hasDefaultHeldArt = isBuiltInTool || selKind === "stone";
          const _heldPixels = selKind ? getItemVariantPixels(selKind as ItemKind, "held") : undefined;
          const canRenderHeld = selKind != null && selCount > 0 && nLogs === 0 && (hasDefaultHeldArt || !!_heldPixels) && !stuckWebRef.current;
          if (canRenderHeld) {
            const facing = s.facing;
            const dir: 1 | -1 = facing === 1 ? 1 : -1;
            // Nudge the hand anchor 2px further out from the body so held
            // items sit clearly outside the sprite instead of clipping the
            // torso.
            const handX = spriteX + (facing === 1 ? 14 : 1);
            const handY = spriteY + 19;
            const skin = appearanceRef.current.skin;
            if (isBuiltInTool) {
              const toolKind = selKind as "spear" | "axe" | "hoe" | "pick" | "copperPick" | "copperHammer";
              let axOffset = HELD_ANCHOR.x;
              let ayOffset = HELD_ANCHOR.y;

              if (toolKind === "spear" && spearAttackRef.current) {
                const sa = spearAttackRef.current;
                const EXT_MS = 130;
                const RETRACT_MS = 130;
                const elapsed = now - sa.startedAt;
                let thrust: number;
                if (sa.holdEndsAt === null) {
                  thrust = elapsed < EXT_MS ? (elapsed / EXT_MS) * 8 : 8;
                } else {
                  const rt = now - sa.holdEndsAt;
                  if (rt >= RETRACT_MS) {
                    spearAttackRef.current = null;
                    thrust = 0;
                  } else {
                    thrust = (1 - rt / RETRACT_MS) * 8;
                  }
                }
                if (spearAttackRef.current) {
                  const rot = sa.angle + Math.PI / 2;
                  const ax = Math.cos(sa.angle) * thrust;
                  const ay = Math.sin(sa.angle) * thrust;
                  ctx.save();
                  ctx.translate(handX + ax, handY + ay);
                  ctx.rotate(rot);
                  if (_heldPixels) {
                    for (const [k, color] of Object.entries(_heldPixels)) {
                      const [px, py] = k.split(",").map(Number);
                      const offX = px - axOffset;
                      ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                      ctx.fillRect(offX, py - ayOffset, 1, 1);
                    }
                  } else {
                    drawHeldTool(ctx, toolKind, 0, 0, 1, skin);
                  }
                  ctx.restore();
                } else {
                  if (_heldPixels) {
                    for (const [k, color] of Object.entries(_heldPixels)) {
                      const [px, py] = k.split(",").map(Number);
                      const offX = dir === 1 ? px - axOffset : axOffset + 1 - px;
                      ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                      ctx.fillRect(handX + offX, handY + (py - ayOffset), 1, 1);
                    }
                  } else {
                    drawHeldTool(ctx, toolKind, handX, handY, dir, skin);
                  }
                }
              } else {
                const ts = toolSwingRef.current;
                let rot = 0;
                let hasSwing = false;
                if (ts && (toolKind === "pick" || toolKind === "copperPick" || toolKind === "axe")) {
                  const elapsed = now - ts.startedAt;
                  const duration = 180;
                  if (elapsed < duration) {
                    hasSwing = true;
                    const t = elapsed / duration;
                    const swingFactor = Math.sin(t * Math.PI);
                    const maxAngle = Math.PI / 4;
                    rot = dir === 1 ? swingFactor * maxAngle : -swingFactor * maxAngle;
                  }
                }

                if (hasSwing) {
                  ctx.save();
                  ctx.translate(handX, handY);
                  ctx.rotate(rot);
                  if (_heldPixels) {
                    for (const [k, color] of Object.entries(_heldPixels)) {
                      const [px, py] = k.split(",").map(Number);
                      const offX = dir === 1 ? px - axOffset : axOffset + 1 - px;
                      ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                      ctx.fillRect(offX, py - ayOffset, 1, 1);
                    }
                  } else {
                    drawHeldTool(ctx, toolKind, 0, 0, dir, skin);
                  }
                  ctx.restore();
                } else {
                  if (_heldPixels) {
                    for (const [k, color] of Object.entries(_heldPixels)) {
                      const [px, py] = k.split(",").map(Number);
                      const offX = dir === 1 ? px - axOffset : axOffset + 1 - px;
                      ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                      ctx.fillRect(handX + offX, handY + (py - ayOffset), 1, 1);
                    }
                  } else {
                    drawHeldTool(ctx, toolKind, handX, handY, dir, skin);
                  }
                }
              }
            } else if (_heldPixels) {
              let ax: number = HELD_ANCHOR.x;
              let ay: number = HELD_ANCHOR.y;
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              for (const k of Object.keys(_heldPixels)) {
                const [px, py] = k.split(",").map(Number);
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
              }
              if (minX !== Infinity) {
                ax = Math.round((minX + maxX) / 2);
                ay = Math.round((minY + maxY) / 2);
              }
              for (const [k, color] of Object.entries(_heldPixels)) {
                const [px, py] = k.split(",").map(Number);
                const offX = dir === 1 ? px - ax : ax + 1 - px;
                ctx.fillStyle = resolveItemPixelColor(color, skin, shade);
                ctx.fillRect(handX + offX, handY + (py - ay), 1, 1);
              }
            } else if (selKind === "stone") {
              drawHeldStone(ctx, handX, handY, dir);
            }
          }
        }






        // (Cave-2 underwater tint is applied via ctx.filter at the top of
        // this sprite draw block, scoped by save/restore.)


        // Water surface sits at WATER_LEVEL_Y (the lowered ocean line that
        // meets the sloped sand). Only the portion of the sprite below this
        // line gets tinted so wading through the shallows doesn't drown the
        // waist when only the feet are wet.
        const spriteBottom = spriteY + SPRITE_H;
        if (s.submersion > 0.02 && spriteBottom > WATER_LEVEL_Y && modeRef.current !== "cave2") {
          const wob = Math.round(Math.sin(now / 220) * 1);
          const waterTop = WATER_LEVEL_Y + wob;
          const h = Math.max(0, spriteBottom - waterTop);
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = `rgba(40,120,150,${(0.42 + s.submersion * 0.32).toFixed(2)})`;
          ctx.fillRect(spriteX - 1, waterTop, SPRITE_W + 2, h + 2);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.restore();

        if (s.submersion > 0.02 && spriteBottom > WATER_LEVEL_Y) {
          const wob = Math.round(Math.sin(now / 220) * 1);
          const waterTop = WATER_LEVEL_Y + wob;
          // Small ripple caps flanking the character, not a full-width bar.
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillRect(spriteX - 3, waterTop, 3, 1);
          ctx.fillRect(spriteX + SPRITE_W, waterTop, 3, 1);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillRect(spriteX - 5, waterTop + 1, 2, 1);
          ctx.fillRect(spriteX + SPRITE_W + 3, waterTop + 1, 2, 1);
          // bubbles rising
          if (Math.floor(now / 180) % 2 === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(spriteX + 4, waterTop + 3, 1, 1);
            ctx.fillRect(spriteX + SPRITE_W - 5, waterTop + 6, 1, 1);
          }
        }
      }

      // Draw shark last (over water, under nothing else)
      drawSharkSequence(
        ctx,
        stateRef.current,
        camX,
        now / 1000,
        sharkFinImgRef.current,
        sharkFullImgRef.current,
      );

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };


    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dead]);

  // Canvas click: pick up stones/logs nearby, or chop trees (needs a stone).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onClick = (e: PointerEvent) => {
      // Ignore clicks originating from the mobile overlay buttons.
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const canvasX = ((e.clientX - rect.left) / rect.width) * VW;
      const canvasY = ((e.clientY - rect.top) / rect.height) * VH;
      const worldX = canvasX + camXRef.current;
      const worldY = canvasY + camYRef.current;
      const player = stateRef.current;
      const playerCenter = player.x + SPRITE_W / 2;
      const REACH = 60;
      const withinReach = (x: number) =>
        Math.abs(x - playerCenter) <= REACH;

      // Stuck in a web? Any click anywhere counts as an escape tap.
      if (stuckWebRef.current && !stuckWebRef.current.killed) {
        const sw = stuckWebRef.current;
        sw.progress = Math.min(10, sw.progress + 1);
        setStuckProgress(sw.progress);
        if (sw.progress >= 10) {
          const s = stateRef.current;
          s.vy = 0;
          s.grounded = false;
          stuckWebRef.current = null;
          setStuckActive(false);
          setStuckProgress(0);
          flashPickup(t("cave2.freed"));
        }
        return;
      }

      // Spear attack — trigger animation whenever the player clicks while holding a spear.
      // The pointer stays down → spear stays extended, tracking the cursor (see move handler).
      {
        const heldKind = getSelectedHotbarKind();
        const hasSpear = heldKind === "spear" && inventoryRef.current.spear > 0;
        if (hasSpear) {
          const facing = stateRef.current.facing;
          const handWX = stateRef.current.x + (facing === 1 ? 14 : 1);
          const handWY = stateRef.current.y + 19;
          const angle = Math.atan2(worldY - handWY, worldX - handWX);
          pointerWorldRef.current = { x: worldX, y: worldY };
          spearAttackRef.current = { startedAt: performance.now(), angle, holdEndsAt: null };
        }
      }

      // Tool swing — trigger animation whenever the player clicks while holding pick or axe.
      {
        const heldKind = getSelectedHotbarKind();
        const isPickOrAxe =
          (heldKind === "pick" && inventoryRef.current.pick > 0) ||
          (heldKind === "copperPick" && inventoryRef.current.copperPick > 0) ||
          (heldKind === "axe" && inventoryRef.current.axe > 0);
        if (isPickOrAxe) {
          const now = performance.now();
          if (now - lastToolSwingTimeRef.current >= 500) {
            lastToolSwingTimeRef.current = now;
            toolSwingRef.current = { startedAt: now, kind: heldKind as "pick" | "copperPick" | "axe", hasHit: false };
          }
        }
      }


      // Centipede damage now happens via the spear's animated hitbox in the
      // game loop (see the spear-vs-centipede block). Clicking the centipede
      // without a spear still shows a hint.
      if (modeRef.current === "cave2") {
        const heldKind = getSelectedHotbarKind();
        const hasSpear = heldKind === "spear" && inventoryRef.current.spear > 0;
        if (!hasSpear) {
          for (const c of cave2CentipedesRef.current) {
            if (c.dead || !c.active) continue;
            if (!centipedeClickHit(c, worldX, worldY)) continue;
            flashPickup(t("cave2.needSpear"));
            return;
          }
        }
      }



      const nowMs = performance.now();


      // 0z) Cave transitions — always checked first so the doorway/portal
      // takes priority over any world/cave interaction.
      if (modeRef.current === "cave") {
        // Click the exit portal (or anywhere close to it while within reach).
        const exitDx = Math.abs(worldX - CAVE_EXIT_X);
        if (exitDx <= 24 && worldY >= GROUND_Y - 60 && worldY <= GROUND_Y + 8) {
          if (!withinReach(CAVE_EXIT_X)) {
            flashPickup(t("cave.approach"));
            return;
          }
          modeRef.current = "world";
          setMode("world");
          const s = stateRef.current;
          const returnX = caveReturnXRef.current || (caveEntranceXRef.current + 30);
          s.x = returnX;
          s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
          s.vx = 0; s.vy = 0; s.grounded = true;
          s.facing = 1; s.animT = 0;
          flashPickup(t("cave.leave"));
          return;
        }

        // Torch removal: click a hung torch to take it back.
        {
          let bestTorch: PlacedTorch | null = null;
          let bestTorchD = 14;
          for (const torch of placedTorchesRef.current) {
            const d = Math.abs(torch.x - worldX);
            if (d < bestTorchD && worldY >= GROUND_Y - 26 && worldY <= GROUND_Y + 4) {
              bestTorchD = d; bestTorch = torch;
            }
          }
          if (bestTorch) {
            if (!withinReach(bestTorch.x)) {
              flashPickup(t("cave.approach"));
              return;
            }
            if (!canAcquireKind("torch")) {
              flashPickup(t("msg.inventoryFull"));
              return;
            }
            const removeId = bestTorch.id;
            placedTorchesRef.current = placedTorchesRef.current.filter((t) => t.id !== removeId);
            setInventory((inv) => {
              const next = { ...inv, torches: inv.torches + 1 };
              inventoryRef.current = next;
              return next;
            });
            flashPickup(t("msg.torchRemoved"));
            saveWorld();
            return;
          }
        }


        // Torch placement: hang a torch on the wall wherever the player clicks.
        {
          const heldKind =
            getSelectedHotbarKind();
          if (heldKind === "torch") {
            if (inventoryRef.current.torches <= 0) {
              flashPickup(t("msg.needTorches"));
              return;
            }
            if (!withinReach(worldX)) {
              flashPickup(t("cave.approach"));
              return;
            }
            // Snap x within cave bounds so torches don't overlap the exit/wall.
            const tx = Math.max(CAVE_EXIT_X + 40, Math.min(CAVE_WALL_X - 20, Math.round(worldX)));
            placedTorchesRef.current = [
              ...placedTorchesRef.current,
              { id: `torch-${Date.now()}-${Math.floor(Math.random() * 1000)}`, x: tx },
            ];
            setInventory((inv) => ({ ...inv, torches: Math.max(0, inv.torches - 1) }));
            flashPickup(t("msg.torchPlaced"));
            saveWorld();
            return;
          }
        }

        // Pick up dropped items (ore loot, hotbar discards) on the cave floor.
        if (tryPickupGroundItem(worldX, worldY, "cave", withinReach)) return;

        // Mining: click an ore. Requires the pickaxe slot to be selected.
        if (getSelectedHotbarKind() !== "pick" && getSelectedHotbarKind() !== "copperPick") {
          const heldKind = getSelectedHotbarKind();
          let bestOre: CaveOre | null = null;
          let bestOreD = 18;
          for (const ore of caveOresRef.current) {
            if (minedOresRef.current.has(ore.id)) continue;
            if (!withinReach(ore.x)) continue;
            const d = Math.abs(ore.x - worldX);
            if (d < bestOreD && worldY >= GROUND_Y - 14 && worldY <= GROUND_Y + 4) {
              bestOreD = d; bestOre = ore;
            }
          }
          if (bestOre) {
            const usingPick =
              (heldKind === "pick" && inventoryRef.current.pick > 0) ||
              (heldKind === "copperPick" && inventoryRef.current.copperPick > 0);
            if (!usingPick) {
              flashPickup(t("msg.needPick"));
              return;
            }
            // Pick deals 1 damage per hit; ore has ORE_MAX_HP.
            const ore = bestOre;
            const oreMax = oreMaxHp(ore.kind);
            const prevHP = caveOreHPRef.current.get(ore.id) ?? oreMax;
            playOneShotReverb(pickSfxAsset.url, (ambientVolume / 100) * 1.0);
            const nextHP = prevHP - 1;
            if (nextHP > 0) {
              caveOreHPRef.current.set(ore.id, nextHP);
              saveWorld();
              return;
            }
            // Final blow — remove HP entry, mark mined (with timestamp for regen).
            caveOreHPRef.current.delete(ore.id);
            const nextMined = new Map(minedOresRef.current);
            const delay = ORE_REGEN_MIN_MS + Math.random() * (ORE_REGEN_MAX_MS - ORE_REGEN_MIN_MS);
            nextMined.set(ore.id, Date.now() + delay);
            minedOresRef.current = nextMined;
            // Loot lands on the cave floor next to the deposit instead of
            // teleporting into the inventory — the player has to walk over
            // and click to pick it up.
            dropGroundItems(ore.x, "cave", ["stone", ore.kind]);
            saveWorld();
            return;
          }
        }

        // Cave end wall — requires copper pickaxe. Once broken, the same
        // spot becomes a click portal that takes the player to level 2.
        if (!caveWallBrokenRef.current) {
          const wdx = Math.abs(worldX - CAVE_WALL_X);
          if (wdx <= 18 && worldY >= GROUND_Y - 60 && worldY <= GROUND_Y + 4) {
            if (!withinReach(CAVE_WALL_X)) {
              flashPickup(t("cave.approach"));
              return;
            }
            const heldKind =
              getSelectedHotbarKind();
            if (heldKind !== "copperPick" || inventoryRef.current.copperPick <= 0) {
              flashPickup(t("cave.needStrongPick"));
              return;
            }

            caveWallBrokenRef.current = true;
            flashPickup(t("cave.wallBroken"));
            saveWorld();
            return;
          }
        } else {
          const wdx = Math.abs(worldX - CAVE_WALL_X);
          if (wdx <= 22 && worldY >= GROUND_Y - 66 && worldY <= GROUND_Y + 4) {
            if (!withinReach(CAVE_WALL_X)) {
              flashPickup(t("cave.approach"));
              return;
            }
            // Enter cave level 2.
            modeRef.current = "cave2";
            setMode("cave2");
            const s = stateRef.current;
            s.x = CAVE2_ENTRY_X;
            s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
            s.vx = 0; s.vy = 0; s.grounded = true;
            s.facing = 1; s.animT = 0;
            heartsRef.current = CAVE2_MAX_HEARTS;
            setHearts(CAVE2_MAX_HEARTS);
            breathRef.current = CAVE2_MAX_BREATH;
            setBreath(CAVE2_MAX_BREATH);
            flashPickup(t("cave2.enter"));
            saveWorld();
            return;
          }
        }

        // In cave, nothing else on the world map is interactive.
        return;
      } else if (modeRef.current === "cave2") {
        // Exit portal back to cave 1 — only when the player is close.
        const exitDx2 = Math.abs(worldX - CAVE2_RETURN_X);
        if (exitDx2 <= 24 && worldY >= GROUND_Y - 60 && worldY <= GROUND_Y + 8) {
          if (!withinReach(CAVE2_RETURN_X)) {
            flashPickup(t("cave.approach"));
            return;
          }
          modeRef.current = "cave";
          setMode("cave");
          const s = stateRef.current;
          // Come out just to the left of the wall/portal in cave 1.
          s.x = CAVE_WALL_X - 40;
          s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
          s.vx = 0; s.vy = 0; s.grounded = true;
          s.facing = -1; s.animT = 0;
          flashPickup(t("cave.leave"));
          saveWorld();
          return;
        }
        // Torch removal: click a hung torch to take it back.
        {
          let bestTorch: PlacedTorch | null = null;
          let bestTorchD = 14;
          for (const torch of placedTorchesCave2Ref.current) {
            const d = Math.abs(torch.x - worldX);
            if (d < bestTorchD && worldY >= GROUND_Y - 26 && worldY <= GROUND_Y + 4) {
              bestTorchD = d; bestTorch = torch;
            }
          }
          if (bestTorch) {
            if (!withinReach(bestTorch.x)) {
              flashPickup(t("cave.approach"));
              return;
            }
            if (!canAcquireKind("torch")) {
              flashPickup(t("msg.inventoryFull"));
              return;
            }
            const removeId = bestTorch.id;
            placedTorchesCave2Ref.current = placedTorchesCave2Ref.current.filter((t) => t.id !== removeId);
            setInventory((inv) => {
              const next = { ...inv, torches: inv.torches + 1 };
              inventoryRef.current = next;
              return next;
            });
            flashPickup(t("msg.torchRemoved"));
            saveWorld();
            return;
          }
        }
        // Torch placement: hang a torch inside cave 2.
        {
          const heldKind = getSelectedHotbarKind();
          if (heldKind === "torch") {
            if (inventoryRef.current.torches <= 0) {
              flashPickup(t("msg.needTorches"));
              return;
            }
            if (!withinReach(worldX)) {
              flashPickup(t("cave.approach"));
              return;
            }
            const tx = Math.max(CAVE2_RETURN_X + 40, Math.round(worldX));
            placedTorchesCave2Ref.current = [
              ...placedTorchesCave2Ref.current,
              { id: `torch2-${Date.now()}-${Math.floor(Math.random() * 1000)}`, x: tx },
            ];
            setInventory((inv) => ({ ...inv, torches: Math.max(0, inv.torches - 1) }));
            flashPickup(t("msg.torchPlaced"));
            saveWorld();
            return;
          }
        }
        // Pick up dropped items (ore loot, hotbar discards) on the cave-2 floor.
        if (tryPickupGroundItem(worldX, worldY, "cave2", withinReach)) return;

        // Mining ores inside cave 2 (only inside cleared safe segments,
        // but we also allow mining any ore that has spawned — new ores
        // only spawn in cleared segments anyway).
        if (getSelectedHotbarKind() !== "pick" && getSelectedHotbarKind() !== "copperPick") {
          const heldKind = getSelectedHotbarKind();
          let bestOre: CaveOre | null = null;
          let bestOreD = 18;
          for (const ore of cave2OresRef.current) {
            if (cave2MinedOresRef.current.has(ore.id)) continue;
            if (!withinReach(ore.x)) continue;
            const d = Math.abs(ore.x - worldX);
            if (d < bestOreD && worldY >= GROUND_Y - 14 && worldY <= GROUND_Y + 4) {
              bestOreD = d; bestOre = ore;
            }
          }
          if (bestOre) {
            const usingPick =
              (heldKind === "pick" && inventoryRef.current.pick > 0) ||
              (heldKind === "copperPick" && inventoryRef.current.copperPick > 0);
            if (!usingPick) {
              flashPickup(t("msg.needPick"));
              return;
            }
            const ore = bestOre;
            const oreMax = oreMaxHp(ore.kind);
            const prevHP = cave2OreHPRef.current.get(ore.id) ?? oreMax;
            playOneShotReverb(pickSfxAsset.url, (ambientVolume / 100) * 1.0);
            const nextHP = prevHP - 1;
            if (nextHP > 0) {
              cave2OreHPRef.current.set(ore.id, nextHP);
              
              saveWorld();
              return;
            }
            cave2OreHPRef.current.delete(ore.id);
            const nextMined = new Map(cave2MinedOresRef.current);
            const delay2 = ORE_REGEN_MIN_MS + Math.random() * (ORE_REGEN_MAX_MS - ORE_REGEN_MIN_MS);
            nextMined.set(ore.id, Date.now() + delay2);
            cave2MinedOresRef.current = nextMined;
            dropGroundItems(ore.x, "cave2", ["stone", ore.kind]);
            if (ore.kind === "iron" && !salitreDiscoveredRef.current) {
              salitreDiscoveredRef.current = true;
              setSalitreDiscovered(true);
            }
            
            saveWorld();
            return;
          }
        }
        return;
      } else {
        // World mode — click near the cave entrance to enter.
        const cx = caveEntranceXRef.current;
        const dx = Math.abs(worldX - cx);
        if (dx <= 28 && worldY >= GROUND_Y - CAVE_ENTRANCE_DRAW_H + 10 && worldY <= GROUND_Y + 18) {
          if (!withinReach(cx)) {
            flashPickup(t("cave.approach"));
            return;
          }
          caveReturnXRef.current = cx + 30;
          modeRef.current = "cave";
          setMode("cave");
          const s = stateRef.current;
          s.x = CAVE_SPAWN_X;
          s.y = GROUND_Y - SPRITE_H + FOOT_OFFSET;
          s.vx = 0; s.vy = 0; s.grounded = true;
          s.facing = 1; s.animT = 0;
          s.swimming = false;
          s.submersion = 0;
          s.submersionTime = 0;
          flashPickup(t("cave.enter"));
          return;
        }
      }


      // 0a-move) Relocating an existing built structure (hammer + "move"
      // option). The click chooses the new x; no materials are consumed.
      if (movingBuildRef.current) {
        const mid = movingBuildRef.current;
        const target = builtRef.current.find((b) => b.id === mid);
        if (!target) {
          setMovingBuildId(null);
          return;
        }
        if (
          withinReach(worldX) &&
          worldY > GROUND_Y - 30 && worldY < GROUND_Y + 16 &&
          worldX > BEACH_LEFT_END + 40 && worldX < BEACH_START - 40
        ) {
          const bx = Math.round(worldX - 10);
          const tooClose =
            blueprintsRef.current.some((b) => buildsOverlap(bx, target.kind, b.x, b.kind)) ||
            builtRef.current.some((b) => b.id !== mid && buildsOverlap(bx, target.kind, b.x, b.kind));
          if (tooClose) {
            flashPickup(t("build.tooClose"));
            return;
          }
          target.x = bx;
          setMovingBuildId(null);
          flashPickup(t("build.moved", { name: BUILD_LABELS[target.kind] }));
          bumpWorld();
          saveWorld();
          return;
        }
        flashPickup(t("build.pickGrass"));
        return;
      }

      // 0a) Placing a blueprint from the build menu — first click on the
      // grass plants the ghost, then the player has to haul logs to it.
      if (placingKindRef.current) {
        const kind = placingKindRef.current;
        if (
          withinReach(worldX) &&
          worldY > GROUND_Y - 30 && worldY < GROUND_Y + 16 &&
          worldX > BEACH_LEFT_END + 40 && worldX < BEACH_START - 40
        ) {
          const bx = Math.round(worldX - 10);
          const tooClose =
            blueprintsRef.current.some((b) => buildsOverlap(bx, kind, b.x, b.kind)) ||
            builtRef.current.some((b) => buildsOverlap(bx, kind, b.x, b.kind));
          if (tooClose) {
            flashPickup(t("build.tooClose"));
            return;
          }
          blueprintsRef.current = [
            ...blueprintsRef.current,
            { id: `bp-${nowMs}`, x: bx, kind, deliveredWood: 0, deliveredStones: 0, deliveredCoal: 0, deliveredCopper: 0, deliveredBronzeMetal: 0 },
          ];
          setPlacingKind(null);
          const cost0 = BUILD_COSTS[kind];
          const parts0: string[] = [];
          if (cost0.wood > 0) parts0.push(`0/${cost0.wood} 🪵`);
          if (cost0.stones > 0) parts0.push(`0/${cost0.stones} 🪨`);
          if (cost0.coal > 0) parts0.push(`0/${cost0.coal} ⚫`);
          if (cost0.copper > 0) parts0.push(`0/${cost0.copper} 🟠`);
          if (cost0.bronzeMetal > 0) parts0.push(`0/${cost0.bronzeMetal} 🟫`);
          flashPickup(`${BUILD_LABELS[kind]}: ${parts0.join(" · ")}`);
          bumpWorld();
          saveWorld();
          return;
        }
        flashPickup(t("build.pickGrass"));
        return;
      }


      // 0b) Click on a blueprint → deposit whichever material the player is
      // carrying / holding (wood via carried logs, stones/coal via hotbar).
      for (const bp of blueprintsRef.current) {
        if (worldX < bp.x - 2 || worldX > bp.x + 22) continue;
        if (worldY < GROUND_Y - 18 || worldY > GROUND_Y + 4) continue;
        if (!withinReach(bp.x + 10)) {
          flashPickup(t("build.approachProject"));
          return;
        }

        const cost = BUILD_COSTS[bp.kind];
        const heldNow = getSelectedHotbarKind();

        // Hammer + click on blueprint = cancel it, refunding all delivered materials.
        if (heldNow === "copperHammer" && inventoryRef.current.copperHammer > 0) {
          setInventory((inv) => ({
            ...inv,
            wood: inv.wood + bp.deliveredWood,
            stones: inv.stones + bp.deliveredStones,
            coal: inv.coal + bp.deliveredCoal,
            copper: inv.copper + bp.deliveredCopper,
            bronzeMetal: inv.bronzeMetal + bp.deliveredBronzeMetal,
          }));
          // Wood refunded to inventory doesn't create physical logs; that's
          // consistent with how other consumables work.
          blueprintsRef.current = blueprintsRef.current.filter((b) => b.id !== bp.id);
          flashPickup(t("build.cancelled", { name: BUILD_LABELS[bp.kind] }));
          bumpWorld();
          saveWorld();
          return;
        }

        const woodLeft = cost.wood - bp.deliveredWood;
        const stonesLeft = cost.stones - bp.deliveredStones;
        const coalLeft = cost.coal - bp.deliveredCoal;
        const copperLeft = cost.copper - bp.deliveredCopper;
        const bronzeMetalLeft = cost.bronzeMetal - bp.deliveredBronzeMetal;

        let deposited = false;
        if (carriedLogsRef.current > 0 && woodLeft > 0) {
          bp.deliveredWood += 1;
          setCarriedLogs((c) => Math.max(0, c - 1));
          setInventory((inv) => ({ ...inv, wood: Math.max(0, inv.wood - 1) }));
          deposited = true;
        } else if (heldNow === "stone" && inventoryRef.current.stones > 0 && stonesLeft > 0) {
          bp.deliveredStones += 1;
          setInventory((inv) => ({ ...inv, stones: Math.max(0, inv.stones - 1) }));
          deposited = true;
        } else if (heldNow === "coal" && inventoryRef.current.coal > 0 && coalLeft > 0) {
          bp.deliveredCoal += 1;
          setInventory((inv) => ({ ...inv, coal: Math.max(0, inv.coal - 1) }));
          deposited = true;
        } else if (heldNow === "copper" && inventoryRef.current.copper > 0 && copperLeft > 0) {
          bp.deliveredCopper += 1;
          setInventory((inv) => ({ ...inv, copper: Math.max(0, inv.copper - 1) }));
          deposited = true;
        } else if (heldNow === "bronzeMetal" && inventoryRef.current.bronzeMetal > 0 && bronzeMetalLeft > 0) {
          bp.deliveredBronzeMetal += 1;
          setInventory((inv) => ({ ...inv, bronzeMetal: Math.max(0, inv.bronzeMetal - 1) }));
          deposited = true;
        }

        if (!deposited) {
          const anyLeft =
            woodLeft > 0 || stonesLeft > 0 || coalLeft > 0 || copperLeft > 0 || bronzeMetalLeft > 0;
          if (anyLeft) {
            blueprintHintRef.current = { id: bp.id, until: performance.now() + 2500 };
            bumpWorld();
          }
          return;
        }

        const complete =
          bp.deliveredWood >= cost.wood &&
          bp.deliveredStones >= cost.stones &&
          bp.deliveredCoal >= cost.coal &&
          bp.deliveredCopper >= cost.copper &&
          bp.deliveredBronzeMetal >= cost.bronzeMetal;
        if (complete) {
          blueprintsRef.current = blueprintsRef.current.filter((b) => b.id !== bp.id);
          const rareRoll = bp.kind === "bench" && Math.random() < 1 / 10000;
          builtRef.current = [
            ...builtRef.current,
            {
              id: `built-${nowMs}`,
              x: bp.x,
              kind: bp.kind,
              variant: rareRoll ? "saw" : "common",
              ...(bp.kind === "chest" ? { storage: {} } : {}),
            },
          ];
          flashPickup(t("build.built", { name: BUILD_LABELS[bp.kind] }));
        } else {
          const parts: string[] = [];
          if (cost.wood > 0) parts.push(`${bp.deliveredWood}/${cost.wood} 🪵`);
          if (cost.stones > 0) parts.push(`${bp.deliveredStones}/${cost.stones} 🪨`);
          if (cost.coal > 0) parts.push(`${bp.deliveredCoal}/${cost.coal} ⚫`);
          if (cost.copper > 0) parts.push(`${bp.deliveredCopper}/${cost.copper} 🟠`);
          if (cost.bronzeMetal > 0) parts.push(`${bp.deliveredBronzeMetal}/${cost.bronzeMetal} 🟫`);
          flashPickup(parts.join(" · "));
        }

        bumpWorld();
        saveWorld();
        return;
      }

      // 0c) Click on a built structure → damage it (with the right tool),
      // deposit repair materials, open the repair modal, or open its menu.
      for (const b of builtRef.current) {
        if (b.kind !== "bench" && b.kind !== "workshop" && b.kind !== "furnace" && b.kind !== "chest" && b.kind !== "anvil") continue;
        if (worldX < b.x - 2 || worldX > b.x + 22) continue;
        if (worldY < GROUND_Y - 22 || worldY > GROUND_Y + 4) continue;
        if (!withinReach(b.x + 10)) {
          flashPickup(
            b.kind === "furnace" ? t("furnace.approach") :
            b.kind === "chest" ? t("chest.approach") :
            b.kind === "anvil" ? t("anvil.approach") :
            t("build.approachBench"),
          );
          return;
        }

        const heldKindNow = getSelectedHotbarKind();
        const curHp = b.hp ?? BUILD_MAX_HP;

        // If a repair is in progress, deposit the required material.
        if (b.repairing) {
          const mat = repairMaterialFor(b.kind);
          const need = (b.repairCost ?? 0) - (b.repairDelivered ?? 0);
          if (need <= 0) {
            b.repairing = false;
            b.hp = BUILD_MAX_HP;
            b.repairCost = 0;
            b.repairDelivered = 0;
            bumpWorld();
            saveWorld();
            return;
          }
          let deposited = false;
          if (mat === "wood" && carriedLogsRef.current > 0) {
            b.repairDelivered = (b.repairDelivered ?? 0) + 1;
            setCarriedLogs((c) => Math.max(0, c - 1));
            setInventory((inv) => ({ ...inv, wood: Math.max(0, inv.wood - 1) }));
            deposited = true;
          } else if (mat === "stone" && heldKindNow === "stone" && inventoryRef.current.stones > 0) {
            b.repairDelivered = (b.repairDelivered ?? 0) + 1;
            setInventory((inv) => ({ ...inv, stones: Math.max(0, inv.stones - 1) }));
            deposited = true;
          }
          if (deposited) {
            if ((b.repairDelivered ?? 0) >= (b.repairCost ?? 0)) {
              b.repairing = false;
              b.hp = BUILD_MAX_HP;
              flashPickup(t("build.repaired", { name: BUILD_LABELS[b.kind] }));
              b.repairCost = 0;
              b.repairDelivered = 0;
            } else {
              flashPickup(`${b.repairDelivered}/${b.repairCost} ${mat === "wood" ? "🪵" : "🪨"}`);
            }
            bumpWorld();
            saveWorld();
            return;
          }
          flashPickup(
            mat === "wood"
              ? t("build.repairNeedWood", { n: (b.repairCost ?? 0) - (b.repairDelivered ?? 0) })
              : t("build.repairNeedStone", { n: (b.repairCost ?? 0) - (b.repairDelivered ?? 0) }),
          );
          return;
        }

        // Anvil with a finished forge → any click collects the bar, no menu.
        // Bars occupy the player's hands (mesma mecânica da madeira), so
        // refuse to collect when the player is already at the 3-bar limit
        // or hauling logs.
        if (b.kind === "anvil" && b.forgeJob && b.forgeJob.hits >= b.forgeJob.hitsRequired) {
          if (carriedLogsRef.current > 0 || totalCarriedBarsRef.current >= MAX_CARRY_BARS) {
            flashPickup(t("msg.handsFull"));
            return;
          }
          const barKind = b.forgeJob.barKind;
          const barName = b.forgeJob.barName;
          setInventory((inv) => ({
            ...inv,
            [barKind]: (inv[barKind] ?? 0) + 1,
          }));
          b.forgeJob = undefined;
          flashPickup(`+1 ${barName}`);
          bumpWorld();
          saveWorld();
          return;
        }

        // Hammer + structure → open repair / move dialog (repair enabled
        // only when damaged; move is always available, chests only if empty).
        // Exception: hammer on an anvil that has an active forge job advances
        // the job by one hit instead of opening the repair modal. On the
        // final hit the bar is left sitting on the anvil to be collected.
        if (heldKindNow === "copperHammer" && inventoryRef.current.copperHammer > 0) {
          if (b.kind === "anvil" && b.forgeJob) {
            const job = b.forgeJob;
            job.hits += 1;
            playOneShot(hammerSfxAsset.url, (ambientVolume / 100) * 0.7);
            if (job.hits >= job.hitsRequired) {
              flashPickup(t("anvil.forgeReady"));
            } else {
              flashPickup(t("anvil.forgeHit", { n: job.hits, max: job.hitsRequired }));
            }
            bumpWorld();
            saveWorld();
            return;
          }
          setRepairModalOpen(b.id);
          return;
        }

        // Damaging: axe hits bench/workshop/chest; pick/copperPick hits furnace.
        const isAxe = heldKindNow === "axe" && inventoryRef.current.axe > 0;
        const isPick =
          (heldKindNow === "pick" && inventoryRef.current.pick > 0) ||
          (heldKindNow === "copperPick" && inventoryRef.current.copperPick > 0);
        const canBreakWithAxe = b.kind !== "furnace" && b.kind !== "anvil";
        const canBreakWithPick = b.kind === "furnace" || b.kind === "anvil";
        if ((isAxe && canBreakWithAxe) || (isPick && canBreakWithPick)) {
          const nextHP = curHp - 1;
          if (nextHP > 0) {
            b.hp = nextHP;
            flashPickup(t("build.hit", { name: BUILD_LABELS[b.kind], n: nextHP, max: BUILD_MAX_HP }));
            bumpWorld();
            saveWorld();
            return;
          }
          // Destroyed. Chests spill their contents onto the ground.
          if (b.kind === "chest" && b.storage) {
            const drops: ItemKind[] = [];
            let woodDrops = 0;
            for (const [k, n] of Object.entries(b.storage)) {
              const count = n ?? 0;
              if (count <= 0) continue;
              // Wood must drop as physical logs (the trunks the player hauls),
              // not as inventory items — otherwise the log/wood counts desync.
              if (k === "wood") {
                woodDrops += count;
                continue;
              }
              // copperBar / bronzeBar are SlotKind-only; drop them as their metal form.
              const dropKind: ItemKind | null =
                k === "copperBar" ? "copperMetal"
                : k === "bronzeBar" ? "bronzeMetal"
                : ((ITEM_KINDS as string[]).includes(k) ? (k as ItemKind) : null);
              if (!dropKind) continue;
              for (let i = 0; i < count; i++) drops.push(dropKind);
            }
            if (drops.length > 0) {
              dropGroundItems(b.x + 10, "world", drops);
            }
            if (woodDrops > 0) {
              const baseX = b.x + 4;
              const nowChest = Date.now();
              const newLogs: GroundLog[] = [];
              for (let i = 0; i < woodDrops; i++) {
                newLogs.push({
                  id: `chest-${b.id}-${nowMs}-${i}`,
                  x: baseX + (i % 3) * 11,
                  droppedAt: nowChest + i,
                });
              }
              groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
              enforceCombinedGroundLimit();
            }
          }
          if (chestMenuOpen === b.id) setChestMenuOpen(null);
          builtRef.current = builtRef.current.filter((x) => x.id !== b.id);
          flashPickup(t("build.destroyed", { name: BUILD_LABELS[b.kind] }));
          bumpWorld();
          saveWorld();
          return;
        }

        if (b.kind === "bench") { markMenuOpened(); setBenchMenuOpen(true); }
        else if (b.kind === "workshop") { markMenuOpened(); setWorkshopMenuOpen(true); }
        else if (b.kind === "furnace") { markMenuOpened(); setFurnaceMenuOpen(b.id); }
        else if (b.kind === "chest") { markMenuOpened(); setChestMenuOpen(b.id); }
        else if (b.kind === "anvil") { markMenuOpened(); setAnvilMenuOpen(b.id); }
        return;
      }


      // 1) If click lands on the player's own carried log stack, DROP one.
      const spriteLeft = player.x - 2;
      const spriteRight = player.x + SPRITE_W + 2;
      const spriteTop = player.y + 10;
      const spriteBottom = player.y + SPRITE_H;
      if (
        carriedLogsRef.current > 0 &&
        worldX >= spriteLeft && worldX <= spriteRight &&
        worldY >= spriteTop && worldY <= spriteBottom
      ) {
        // Drop one log at the player's feet — snap into a nearby pile so
        // repeatedly dropping in place stacks visually instead of scattering.
        const dropId = `drop-${nowMs}-${Math.floor(Math.random() * 1000)}`;
        const feetX = Math.round(player.x + SPRITE_W / 2 - 5);
        let stackX = feetX;
        let bestPileD = LOG_STACK_RANGE;
        for (const log of groundLogsRef.current) {
          const d = Math.abs(log.x - feetX);
          if (d <= bestPileD) {
            bestPileD = d;
            stackX = log.x;
          }
        }
        groundLogsRef.current = [
          ...groundLogsRef.current,
          { id: dropId, x: stackX },
        ];
        setCarriedLogs((c) => Math.max(0, c - 1));
        setInventory((inv) => ({ ...inv, wood: Math.max(0, inv.wood - 1) }));
        flashPickup(t("msg.logDropped"));
        saveWorld();
        return;
      }

      // 1) Dropped tree logs: closest wins so a chopped tree can be
      // gathered piece by piece. When a pile is clicked the topmost
      // (most recently dropped) log comes off first.
      // On desktop (mouse) tighten the hit-box a lot so a nearby tree
      // trunk/canopy click doesn't get stolen by a log lying next to it.
      const isMouse = e.pointerType === "mouse";
      const logXTol = isMouse ? 6 : 22;
      const logYTopBase = isMouse ? GROUND_Y - 6 : GROUND_Y - 32;
      const logYBotBase = isMouse ? GROUND_Y + 8 : GROUND_Y + 16;
      let bestLog: GroundLog | null = null;
      let bestLogD = logXTol;
      for (const log of groundLogsRef.current) {
        if (!withinReach(log.x + 5)) continue;
        const d = Math.abs(log.x + 5 - worldX);
        // Adjust the vertical pickup band so it follows the sand slope —
        // otherwise palm logs on the beach render below the flat Y check.
        const slope = beachSurfaceOffset(log.x);
        const logYTop = logYTopBase + slope;
        const logYBot = logYBotBase + slope;
        if (d < bestLogD && worldY > logYTop && worldY < logYBot) {
          bestLogD = d;
          bestLog = log;
        }
      }
      if (bestLog) {
        const selKindNow = getSelectedHotbarKind();
        const inv = inventoryRef.current;
        const holdingTool =
          (selKindNow === "axe"   && inv.axe   > 0) ||
          (selKindNow === "hoe"   && inv.hoe   > 0) ||
          (selKindNow === "pick"  && inv.pick  > 0) ||
          (selKindNow === "copperPick" && inv.copperPick > 0) ||

          (selKindNow === "spear" && inv.spear > 0) ||
          (selKindNow === "stone" && inv.stones > 0);
        if (holdingTool) {
          flashPickup(t("msg.handsFull"));
          return;
        }
        if (totalCarriedBarsRef.current > 0) {
          flashPickup(t("msg.handsFull"));
          return;
        }
        if (carriedLogsRef.current >= MAX_CARRY_LOGS) {
          flashPickup(t("msg.maxLogs", { n: MAX_CARRY_LOGS }));
          return;
        }
        if (!canAcquireKind("wood")) {
          flashPickup(t("msg.inventoryFull"));
          return;
        }

        // Prefer the last-dropped log at that pile (top of the stack).
        const pileX = bestLog.x;
        const pile = groundLogsRef.current.filter((l) => l.x === pileX);
        const topLog = pile[pile.length - 1] ?? bestLog;
        groundLogsRef.current = groundLogsRef.current.filter(
          (l) => l.id !== topLog.id,
        );
        setCarriedLogs((c) => c + 1);
        setInventory((inv) => ({ ...inv, wood: inv.wood + 1 }));
        flashPickup(t("msg.pickLog"));
        saveWorld();
        return;
      }

      // 2) Seed on the ground → pick it up.
      let bestSeed: GroundSeed | null = null;
      let bestSeedD = 10;
      for (const seed of seedsRef.current) {
        if (!withinReach(seed.x + 2)) continue;
        const d = Math.abs(seed.x + 2 - worldX);
        const gY = getGroundYAt(seed.x);
        if (d < bestSeedD && worldY > gY - 10 && worldY < gY + 8) {
          bestSeedD = d;
          bestSeed = seed;
        }
      }
      if (bestSeed) {
        if (!canAcquireKind("seed")) {
          flashPickup(t("msg.inventoryFull"));
          return;
        }
        seedsRef.current = seedsRef.current.filter((s) => s.id !== bestSeed!.id);
        setInventory((inv) => ({ ...inv, seeds: inv.seeds + 1 }));
        flashPickup(t("msg.pickSeed"));
        saveWorld();
        return;
      }

      // 3) Pick up a loose pebble within a small radius (seeded or dropped).
      {
        const stones = getStones();
        let bestStone: Stone | null = null;
        let bestD = 14;
        for (const st of stones) {
          if (stonesTakenRef.current.has(st.id)) continue;
          if (!withinReach(st.x + 2)) continue;
          const d = Math.abs(st.x + 2 - worldX);
          const gY = getGroundYAt(st.x);
          if (d < bestD && worldY > gY - 14 && worldY < gY + 12) {
            bestD = d; bestStone = st;
          }
        }
        let bestGP: GroundPebble | null = null;
        let bestGPD = 14;
        for (const p of groundPebblesRef.current) {
          if (!withinReach(p.x + 2)) continue;
          const d = Math.abs(p.x + 2 - worldX);
          const gY = getGroundYAt(p.x);
          if (d < bestGPD && worldY > gY - 14 && worldY < gY + 12) {
            bestGPD = d; bestGP = p;
          }
        }
        // Prefer whichever pebble is closer to the click.
        if (bestGP && (!bestStone || bestGPD < bestD)) {
          if (!canAcquireKind("stone")) {
            flashPickup(t("msg.inventoryFull"));
            return;
          }
          groundPebblesRef.current = groundPebblesRef.current.filter((x) => x.id !== bestGP!.id);
          setInventory((inv) => ({ ...inv, stones: inv.stones + 1 }));
          flashPickup(t("msg.pickStone"));
          saveWorld();
          return;
        }
        if (bestStone) {
          if (!canAcquireKind("stone")) {
            flashPickup(t("msg.inventoryFull"));
            return;
          }
          stonesTakenRef.current.set(bestStone.id, nowMs);
          setInventory((inv) => ({ ...inv, stones: inv.stones + 1 }));
          flashPickup(t("msg.pickStone"));
          saveWorld();
          return;
        }
      }

      // 3b) Pick up a dropped item (from the hotbar discard or an ore break)
      //     — walk near it and click to recover it into the inventory.
      if (tryPickupGroundItem(worldX, worldY, "world", withinReach)) return;



      // 3c) Hammer on a leftover tree stump → clear it instantly (no cost).
      {
        const heldNow = getSelectedHotbarKind();
        if (heldNow === "copperHammer" && inventoryRef.current.copperHammer > 0) {
          let bestStumpX: number | null = null;
          let bestStumpD = 16;
          for (const [sx, brokenAt] of treesBrokenRef.current) {
            if (nowMs - brokenAt >= STUMP_LIFESPAN_MS) continue; // already faded
            const cx = sx + 13;
            if (!withinReach(cx)) continue;
            const d = Math.abs(cx - worldX);
            if (d < bestStumpD && worldY > GROUND_Y - 12 && worldY < GROUND_Y + 8) {
              bestStumpD = d;
              bestStumpX = sx;
            }
          }
          if (bestStumpX != null) {
            // Age the stump past its lifespan so it disappears immediately
            // while keeping the tree marked as chopped (won't regrow on its own).
            treesBrokenRef.current.set(bestStumpX, nowMs - STUMP_LIFESPAN_MS - 1);
            flashPickup(t("msg.stumpRemoved"));
            bumpWorld();
            saveWorld();
            return;
          }
        }
      }


      // 4) Chop a natural tree if we have stones.
      if (getSelectedHotbarKind() !== "axe") {
        const props = getProps();
        let bestTree: Prop | null = null;
        let bestTreeD = 20;
        for (const p of props) {
          if (p.type !== "tree") continue;
          if (treesBrokenRef.current.has(p.x)) continue;
          const trunkCenter = p.x + 13;
          if (!withinReach(trunkCenter)) continue;
          const d = Math.abs(trunkCenter - worldX);
          // Click roughly on the trunk / canopy area.
          if (d < bestTreeD && worldY > GROUND_Y - 60 && worldY < GROUND_Y + 8) {
            bestTreeD = d;
            bestTree = p;
          }
        }
        // 4b) Also allow chopping a mature planted tree.
        let bestPlanted: PlantedTree | null = null;
        let bestPlantedD = 20;
        for (const pl of plantedRef.current) {
          const age = (Date.now() - pl.plantedAt) / 1000;
          if (age < SAPLING_GROW_S) continue; // still a sapling
          const trunkCenter = pl.x + 13;
          if (!withinReach(trunkCenter)) continue;
          const d = Math.abs(trunkCenter - worldX);
          if (d < bestPlantedD && worldY > GROUND_Y - 60 && worldY < GROUND_Y + 8) {
            bestPlantedD = d;
            bestPlanted = pl;
          }
        }

        const chopTarget: { x: number; variant: number } | null = bestTree
          ? { x: bestTree.x, variant: bestTree.variant ?? 0 }
          : bestPlanted
          ? { x: bestPlanted.x, variant: bestPlanted.variant }
          : null;

        if (chopTarget) {
          // Chopping requires either the stone slot (9 hits, consumes stones)
          // or the improvised axe (3 hits, no cost) to be selected.
          const heldForChop =
            getSelectedHotbarKind();
          const usingAxe = heldForChop === "axe" && inventoryRef.current.axe > 0;
          if (heldForChop !== "stone" && !usingAxe) {
            flashPickup(t("msg.pickAxeOrStone"));
            return;
          }
          if (!usingAxe && stoneChargesRef.current <= 0 && inventoryRef.current.stones <= 0) {
            flashPickup(t("msg.needStones"));
            return;
          }

          // Per-hit damage: axe deals 3 damage per swing; stone deals 1 and
          // consumes a stone every TREE_MAX_HP swings.
          const damage = usingAxe ? 3 : 1;
          if (!usingAxe) {
            // Stones wear out over TREE_MAX_HP swings. We consume the pebble
            // only on its FINAL swing (when charges hit 0) so the player sees
            // it stay in the inventory until it's actually worn out, instead
            // of vanishing on the very first click.
            if (stoneChargesRef.current > 0) {
              stoneChargesRef.current -= 1;
              if (stoneChargesRef.current === 0) {
                setInventory((inv) => ({ ...inv, stones: Math.max(0, inv.stones - 1) }));
              }
            } else {
              // Start a fresh stone: use one hit now, leave 9 more before wear-out.
              stoneChargesRef.current = TREE_MAX_HP - 1;
            }
          }

          const hpKey = bestTree ? `n:${chopTarget.x}` : `p:${bestPlanted!.id}`;
          const prevHP = treeHPRef.current.get(hpKey) ?? TREE_MAX_HP;
          const nextHP = prevHP - damage;
          // Wood-hit SFX plays every time a tree loses HP (world → no reverb).
          playOneShot(woodHitSfxAsset.url, (ambientVolume / 100) * 0.7);



          if (nextHP > 0) {
            treeHPRef.current.set(hpKey, nextHP);
            flashPickup(t("msg.tree", { n: nextHP, max: TREE_MAX_HP }));
            saveWorld();
            return;
          }

          // Final blow — remove HP entry and fell the tree.
          treeHPRef.current.delete(hpKey);
          if (bestTree) {
            treesBrokenRef.current.set(chopTarget.x, nowMs);
          } else if (bestPlanted) {
            plantedRef.current = plantedRef.current.filter((p) => p.id !== bestPlanted!.id);
          }
          // Variant 0..2 → drop 1..3 logs on the ground next to the stump.
          const count = Math.min(3, chopTarget.variant + 1);
          const nowChop = Date.now();
          const newLogs: GroundLog[] = [];
          for (let i = 0; i < count; i++) {
            newLogs.push({
              id: `${chopTarget.x}-${nowMs}-${i}`,
              x: chopTarget.x + 4 + i * 11,
              droppedAt: nowChop + i,
            });
          }
          groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
          enforceCombinedGroundLimit();
          // Trees scatter 1 or 2 seeds so replanting is a bit more forgiving.
          const seedCount = 1 + Math.floor(Math.random() * 2);
          const newSeeds: GroundSeed[] = [];
          for (let i = 0; i < seedCount; i++) {
            newSeeds.push({
              id: `seed-${chopTarget.x}-${nowMs}-${i}`,
              x: chopTarget.x + 18 + i * 6,
            });
          }
          seedsRef.current = [...seedsRef.current, ...newSeeds];
          flashPickup(
            t("msg.treeFelled", { logs: count, seeds: seedCount }),
          );

          saveWorld();
          return;
        }
      }

      // 5) Plant a seed on empty ground — only when the seed slot is selected,
      // so casual clicks on grass don't accidentally consume seeds.
      const heldKind =
        getSelectedHotbarKind();
      if (
        heldKind === "seed" &&
        inventoryRef.current.seeds > 0 &&
        withinReach(worldX) &&
        worldY > GROUND_Y - 20 && worldY < GROUND_Y + 16 &&
        worldX > BEACH_LEFT_END + 40 && worldX < BEACH_START - 40
      ) {
        const px = Math.round(worldX - 13);
        const nearCave = Math.abs(px + 13 - caveEntranceXRef.current) <= CAVE_ENTRANCE_CLEAR;
        // Don't plant right on top of an existing sapling, and never inside the cave entrance clear zone.
        const tooClose = nearCave || plantedRef.current.some((p) => Math.abs(p.x - px) < 24);
        if (!tooClose) {
          plantedRef.current = [
            ...plantedRef.current,
            {
              id: `plant-${Date.now()}`,
              x: px,
              // Wall-clock timestamp so growth survives page reloads.
              plantedAt: Date.now(),
              variant: Math.floor(Math.random() * 3),
            },
          ];
          setInventory((inv) => ({ ...inv, seeds: inv.seeds - 1 }));
          flashPickup(t("msg.seedPlanted"));
          saveWorld();
          return;
        }
      }

      // 5b) Plant a palm seed — anywhere on the island (grass or beach),
      // as long as it's on solid ground (not water, not inside the cave).
      if (
        heldKind === "palmSeed" &&
        inventoryRef.current.palmSeeds > 0 &&
        withinReach(worldX) &&
        worldX > OCEAN_LEFT_END + 10 && worldX < OCEAN_START - 10
      ) {
        const groundYHere = GROUND_Y + beachSurfaceOffset(worldX);
        if (worldY > groundYHere - 20 && worldY < groundYHere + 16) {
          const px = Math.round(worldX);
          const nearCave = Math.abs(px - caveEntranceXRef.current) <= CAVE_ENTRANCE_CLEAR;
          const tooCloseNatural =
            getPalms("left").some((p) => !brokenPalmsRef.current.has(p.wx) && Math.abs(p.wx - px) < 28) ||
            getPalms("right").some((p) => !brokenPalmsRef.current.has(p.wx) && Math.abs(p.wx - px) < 28);
          const tooCloseExtra = extraPalmsRef.current.some((p) => Math.abs(p.wx - px) < 28);
          const tooClosePlanted = plantedRef.current.some((p) => Math.abs(p.x - px) < 28);
          if (!nearCave && !tooCloseNatural && !tooCloseExtra && !tooClosePlanted) {
            extraPalmsRef.current = [
              ...extraPalmsRef.current,
              { wx: px, variant: (Math.floor(Math.random() * 4)) as 0 | 1 | 2 | 3 },
            ];
            setInventory((inv) => ({ ...inv, palmSeeds: inv.palmSeeds - 1 }));
            flashPickup(t("msg.seedPlanted"));
            saveWorld();
            return;
          }
        }
      }

      // 6) Forage: click a bush / mushroom / flower / fern to pick it.
      //    Bushes break with a chance to drop berry seeds; mushrooms and
      //    plants go straight into the hotbar.
      {
        const forageProps = getProps();
        let bestForage: Prop | null = null;
        let bestForageD = 14;
        for (const p of forageProps) {
          if (p.type !== "bush" && p.type !== "mushroom" && p.type !== "flower" && p.type !== "fern") continue;
          if (pickedPropsRef.current.has(`${p.type}:${p.x}`)) continue;
          const cx = p.x + 3;
          if (!withinReach(cx)) continue;
          const d = Math.abs(cx - worldX);
          if (d < bestForageD && worldY > GROUND_Y - 20 && worldY < GROUND_Y + 8) {
            bestForageD = d;
            bestForage = p;
          }
        }
        if (bestForage) {
          const p = bestForage;
          // Which item this forage would produce; gate on inventory-full.
          const producedKind: ItemKind | null =
            p.type === "bush" ? "berrySeed" :
            p.type === "mushroom" ? "mushroom" :
            "herb";
          if (producedKind && !canAcquireKind(producedKind)) {
            flashPickup(t("msg.inventoryFull"));
            return;
          }
          pickedPropsRef.current = new Set(pickedPropsRef.current).add(`${p.type}:${p.x}`);
          if (p.type === "bush") {
            // ~55% chance the bush drops a berry seed when broken.
            if (Math.random() < 0.55) {
              setInventory((inv) => ({ ...inv, berrySeeds: inv.berrySeeds + 1 }));
              flashPickup(t("msg.bushBrokenWithSeed"));
            } else {
              flashPickup(t("msg.bushBroken"));
            }
          } else if (p.type === "mushroom") {
            setInventory((inv) => ({ ...inv, mushrooms: inv.mushrooms + 1 }));
            flashPickup(t("msg.pickMushroom"));
          } else {
            // flower and fern → herb bundle
            setInventory((inv) => ({ ...inv, herbs: inv.herbs + 1 }));
            flashPickup(t("msg.pickHerb"));
          }
          saveWorld();
          return;
        }
      }

      // 6.5) Mine a big forest rock. Requires the pickaxe slot selected.
      //      Rocks take ROCK_MAX_HP hits, then drop 3–5 pebbles and mark
      //      the spot as mined; regeneration handles respawning elsewhere.
      {
        type RockTarget = { key: number; x: number };
        const targets: RockTarget[] = [];
        for (const p of getProps()) {
          if (p.type !== "rock") continue;
          if (minedRocksRef.current.has(p.x)) continue;
          targets.push({ key: p.x, x: p.x });
        }
        for (const r of extraRocksRef.current) {
          if (minedRocksRef.current.has(r.x)) continue;
          targets.push({ key: r.x, x: r.x });
        }
        let bestRock: RockTarget | null = null;
        let bestRockD = 16;
        for (const r of targets) {
          const cx = r.x + 6;
          if (!withinReach(cx)) continue;
          const d = Math.abs(cx - worldX);
          if (d < bestRockD && worldY >= GROUND_Y - 12 && worldY <= GROUND_Y + 6) {
            bestRockD = d;
            bestRock = r;
          }
        }
        if (bestRock) {
          const heldKind =
            getSelectedHotbarKind();
          const canBreakRock =
            (heldKind === "pick" && inventoryRef.current.pick > 0) ||
            (heldKind === "copperPick" && inventoryRef.current.copperPick > 0);
          if (!canBreakRock) {
            flashPickup(t("msg.needPick"));
            return;
          }

          const key = bestRock.key;
          const prevHP = rockHPRef.current.get(key) ?? ROCK_MAX_HP;
          const nextHP = prevHP - 1;
          // Pick sound plays each time the rock loses HP (world → no reverb).
          playOneShot(pickSfxAsset.url, (ambientVolume / 100) * 1.0);
          if (nextHP > 0) {
            rockHPRef.current.set(key, nextHP);
            flashPickup(t("msg.rock", { n: nextHP, max: ROCK_MAX_HP }));
            saveWorld();
            return;
          }
          // Broken — spill 3-5 pebbles on the ground around the rock.
          rockHPRef.current.delete(key);
          const dropped =
            ROCK_MIN_DROP + Math.floor(Math.random() * (ROCK_MAX_DROP - ROCK_MIN_DROP + 1));
          minedRocksRef.current = new Map(minedRocksRef.current).set(key, Date.now());
          const newPebbles: GroundPebble[] = [];
          for (let i = 0; i < dropped; i++) {
            const spread = Math.round(-10 + Math.random() * 20);
            newPebbles.push({
              id: `peb-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              x: bestRock.x + 3 + spread,
              variant: Math.floor(Math.random() * 4),
            });
          }
          groundPebblesRef.current = [...groundPebblesRef.current, ...newPebbles];
          flashPickup(t("msg.rockBroken", { n: dropped }));
          saveWorld();
          return;
        }
      }



      // 7) Chop a palm tree on the beach. Requires stone or axe like a
      //    regular tree, but a palm is smaller (PALM_MAX_HP hits) and
      //    drops 1-2 palm seeds when it falls.
      //    Skip when holding the axe — axe damage is dealt by the swing
      //    animation tick (above), based on which palm is in front of the
      //    player, NOT which one the mouse is over.
      if (getSelectedHotbarKind() !== "axe") {
        let bestPalm: PalmPos | null = null;
        let bestPalmIsExtra = false;
        let bestPalmD = 18;
        const scanClickPalm = (list: PalmPos[], isExtra: boolean) => {
          for (const p of list) {
            if (!isExtra && brokenPalmsRef.current.has(p.wx)) continue;
            const sxPalm = p.wx - camXRef.current;
            if (sxPalm < -20 || sxPalm > VW + 20) continue;
            const cx = p.wx + 2;
            if (!withinReach(cx)) continue;
            const d = Math.abs(cx - worldX);
            const gY = getGroundYAt(cx);
            if (d < bestPalmD && worldY > gY - 80 && worldY < gY + 12) {
              bestPalmD = d;
              bestPalm = p;
              bestPalmIsExtra = isExtra;
            }
          }
        };
        for (const side of ["left", "right"] as const) scanClickPalm(getPalms(side), false);
        scanClickPalm(extraPalmsRef.current, true);
        if (bestPalm) {
          const palm: PalmPos = bestPalm;
          const heldForChop =
            getSelectedHotbarKind();
          const usingAxe = heldForChop === "axe" && inventoryRef.current.axe > 0;
          if (heldForChop !== "stone" && !usingAxe) {
            flashPickup(t("msg.pickAxeOrStone"));
            return;
          }
          if (!usingAxe && stoneChargesRef.current <= 0 && inventoryRef.current.stones <= 0) {
            flashPickup(t("msg.needStones"));
            return;
          }
          const damage = usingAxe ? Math.ceil(PALM_MAX_HP / 3) : 1;
          if (!usingAxe) {
            if (stoneChargesRef.current > 0) {
              stoneChargesRef.current -= 1;
              if (stoneChargesRef.current === 0) {
                setInventory((inv) => ({ ...inv, stones: Math.max(0, inv.stones - 1) }));
              }
            } else {
              stoneChargesRef.current = TREE_MAX_HP - 1;
            }
          }
          const prevHP = palmHPRef.current.get(palm.wx) ?? PALM_MAX_HP;
          const nextHP = prevHP - damage;
          playOneShot(woodHitSfxAsset.url, (ambientVolume / 100) * 0.7);
          if (nextHP > 0) {
            palmHPRef.current.set(palm.wx, nextHP);
            flashPickup(t("msg.palm", { n: nextHP, max: PALM_MAX_HP }));
            saveWorld();
            return;
          }
          palmHPRef.current.delete(palm.wx);
          const nowMsPalm = performance.now();
          if (bestPalmIsExtra) {
            extraPalmsRef.current = extraPalmsRef.current.filter((pp) => pp !== palm);
          } else {
            brokenPalmsRef.current = new Set(brokenPalmsRef.current).add(palm.wx);
            brokenPalmsAtRef.current.set(palm.wx, nowMsPalm);
          }
          const logCount = 2 + Math.floor(Math.random() * 2);
          const nowPalm = Date.now();
          const newLogs: GroundLog[] = [];
          for (let i = 0; i < logCount; i++) {
            newLogs.push({
              id: `palm-${palm.wx}-${nowMsPalm}-${i}`,
              x: palm.wx + 4 + i * 11,
              droppedAt: nowPalm + i,
            });
          }
          groundLogsRef.current = [...groundLogsRef.current, ...newLogs];
          enforceCombinedGroundLimit();
          const seedCount = 1 + Math.floor(Math.random() * 2);
          setInventory((inv) => ({ ...inv, palmSeeds: inv.palmSeeds + seedCount }));
          flashPickup(
            t("msg.palmFelled", { logs: logCount, seeds: seedCount }),
          );

          saveWorld();
          return;
        }
      }

      // Nothing interactive under this click.
      flashPickup(t("msg.nothingHere"));
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const canvasX = ((e.clientX - rect.left) / rect.width) * VW;
      const canvasY = ((e.clientY - rect.top) / rect.height) * VH;
      pointerWorldRef.current = { x: canvasX + camXRef.current, y: canvasY + camYRef.current };
      // While the spear is held down, its aim tracks the cursor.
      const sa = spearAttackRef.current;
      if (sa && sa.holdEndsAt === null) {
        const facing = stateRef.current.facing;
        const handWX = stateRef.current.x + (facing === 1 ? 14 : 1);
        const handWY = stateRef.current.y + 19;
        sa.angle = Math.atan2(pointerWorldRef.current.y - handWY, pointerWorldRef.current.x - handWX);
      }
    };
    const onPointerUp = () => {
      const sa = spearAttackRef.current;
      if (sa && sa.holdEndsAt === null) sa.holdEndsAt = performance.now();
    };
    canvas.addEventListener("pointerdown", onClick);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);



  const pressKey = (dir: "left" | "right" | "jump") => keysRef.current.add(dir);
  const releaseKey = (dir: "left" | "right" | "jump") => keysRef.current.delete(dir);
  const holdProps = (dir: "left" | "right" | "jump") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pressKey(dir);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      releaseKey(dir);
    },
    onPointerCancel: () => releaseKey(dir),
    onPointerLeave: () => releaseKey(dir),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div
      className="min-h-screen bg-[#0d1b2a] font-pixel text-[#f4e9c1] select-none"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        <div />

        <div className="order-last w-full text-center text-xs sm:text-sm sm:order-none sm:w-auto text-[#ffd166]" style={{ textShadow: "2px 2px 0 #7a3e1d" }}>
          {t("game.zone")}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
            aria-label={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
            className="border-2 border-[#f4e9c1]/40 px-2 py-1.5 sm:py-2 text-[12px] hover:bg-[#f4e9c1]/10"
          >
            {isFullscreen ? "⛶✕" : "⛶"}
          </button>
          <div className="hidden sm:block text-[10px] tracking-widest">{character ? character.name : ""}</div>
        </div>

      </header>

      <div className="flex flex-col items-center gap-2 px-2 pb-4">
        <div
          ref={gameStageRef}
          className={
            isFullscreen
              ? "fixed inset-0 z-40 w-screen h-screen bg-black flex items-center justify-center overflow-hidden"
              : "relative border-2 border-[#f4e9c1] w-full max-w-[1600px] overflow-hidden"
          }
          style={isFullscreen ? undefined : { boxShadow: "0 6px 0 #0a141f, 0 10px 0 rgba(0,0,0,0.5)" }}
        >
          <canvas
            ref={canvasRef}
            width={VW}
            height={VH}
            className={
              isFullscreen
                ? "block pixelated cursor-crosshair"
                : "block pixelated w-full h-auto cursor-crosshair"
            }
            style={{
              imageRendering: "pixelated",
              aspectRatio: `${VW} / ${VH}`,
              transform: `scale(${zoom})`,
              willChange: "transform",
              touchAction: "manipulation",
              ...(isFullscreen
                ? { maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }
                : {}),
            }}
          />

          {pickupFlash ? (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 border-2 border-[#ffd166] bg-[#0d1b2a]/85 px-3 py-1 text-[10px] sm:text-xs tracking-widest text-[#ffd166]">
              {pickupFlash}
            </div>
          ) : null}
          {stuckActive ? (
            <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 flex flex-col items-center gap-1 border-2 border-[#e94560] bg-[#0d1b2a]/90 px-3 py-2 text-[10px] sm:text-xs tracking-widest text-[#f4e9c1]">
              <div>{t("cave2.escapePrompt")}</div>
              <div className="w-40 h-2 border border-[#f4e9c1]/40 bg-black/50">
                <div
                  className="h-full bg-[#ffd166] transition-all"
                  style={{ width: `${(stuckProgress / 10) * 100}%` }}
                />
              </div>
              <div className="text-[9px] opacity-75">{stuckProgress}/10</div>
            </div>
          ) : null}

          {mode === "cave2" ? (
            <div className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 flex flex-col items-center gap-1">
              <div className="flex gap-1">
                {Array.from({ length: CAVE2_MAX_HEARTS }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "text-base sm:text-lg drop-shadow " +
                      (i < hearts ? "text-[#ff5a6e]" : "text-[#3a1e24]")
                    }
                    aria-hidden
                  >
                    ♥
                  </span>
                ))}
              </div>
              {breath < CAVE2_MAX_BREATH - 0.05 ? (
                <div className="w-24 h-1.5 border border-[#8ac8ff]/60 bg-[#0a141f]/70">
                  <div
                    className="h-full bg-[#8ac8ff]"
                    style={{ width: `${Math.max(0, Math.min(100, (breath / CAVE2_MAX_BREATH) * 100))}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setGameMenuOpen((v) => !v)}
            aria-label={t("gameMenu.open")}
            title={t("gameMenu.open")}
            className="absolute left-1 top-1 z-30 h-16 w-16 flex items-center justify-center bg-transparent border-0 p-0 hover:brightness-110 active:scale-95 transition-all"
          >
            <img
              src={(gameMenuOpen ? uiSetinhaFecharAsset : uiSetinhaAbrirAsset).url}
              alt=""
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
              draggable={false}
            />
          </button>


          {gameMenuOpen ? (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
            >

              {(() => {
                const stroke = "#f4e9c1";
                const pngIcon = (url: string, alt = "") => (
                  <img
                    src={url}
                    alt={alt}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                    draggable={false}
                  />
                );
                const IconBuild = pngIcon(uiBuildAsset.url, t("gameMenu.build"));
                const IconMap = pngIcon(uiMapaAsset.url, t("game.map"));
                const IconLook = pngIcon(uiCustomAsset.url, t("game.editLook"));
                const IconSettings = pngIcon(uiConfigAsset.url, t("settings.title"));
                const IconZoom = pngIcon(uiCameraAsset.url, t("gameMenu.camera.title"));
                const IconHelp = pngIcon(uiMissoesAsset.url, t("gameMenu.tutorial.title"));
                const IconExit = pngIcon(uiMenuAsset.url, t("game.leave"));
                void stroke;

                type CornerBtn = {
                  key: string;
                  label: string;
                  icon: React.ReactNode;
                  pos: string;
                  size?: string;
                  onClick: () => void;
                  disabled?: boolean;
                };
                const buttons: CornerBtn[] = [
                  {
                    key: "build",
                    label: t("gameMenu.build"),
                    icon: IconBuild,
                    pos: "left-0.5 bottom-[20%] sm:left-1",
                    size: "h-20 w-20 sm:h-24 sm:w-24",
                    onClick: () => { markMenuOpened(); setBuildMenuOpen(true); },
                  },
                  {
                    key: "map",
                    label: t("game.map"),
                    icon: IconMap,
                    pos: "right-3 top-14 sm:right-6 sm:top-16",
                    onClick: () => { setMapOpen(true); },
                  },
                  {
                    key: "look",
                    label: t("game.editLook"),
                    icon: IconLook,
                    pos: "left-2 top-[45%] -translate-y-1/2 sm:left-4",
                    onClick: () => { setEditingLook(true); },
                    disabled: !character,
                  },
                  {
                    key: "settings",
                    label: t("settings.title"),
                    icon: IconSettings,
                    pos: "right-3 bottom-24 sm:right-6 sm:bottom-28",
                    onClick: () => { setSettingsOpen(true); },
                  },
                  {
                    key: "exit",
                    label: t("game.leave"),
                    icon: IconExit,
                    pos: "left-[5.5rem] top-1",
                    size: "h-16 w-16",
                    onClick: () => { setGameMenuOpen(false); navigate({ to: "/characters" }); },
                  },
                  {
                    key: "camera",
                    label: t("gameMenu.camera.title"),
                    icon: IconZoom,
                    pos: "left-[10.75rem] -top-1",
                    size: "h-20 w-20",
                    onClick: () => setCameraMenuOpen((v) => !v),
                  },


                  {
                    key: "tutorial",
                    label: t("gameMenu.tutorial.title"),
                    icon: IconHelp,
                    pos: "right-3 top-1/2 -translate-y-1/2 sm:right-6",
                    onClick: () => setTutorialOpen((v) => !v),
                  },
                ];

                return buttons.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (!b.disabled) b.onClick(); }}
                    disabled={b.disabled}
                    aria-label={b.label}
                    title={b.label}
                    className={`group absolute ${b.pos} ${b.size || "h-16 w-16 sm:h-20 sm:w-20"} pointer-events-auto flex items-center justify-center bg-transparent border-0 p-0 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed animate-scale-in`}
                  >
                    <span className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full">
                      {b.icon}
                    </span>
                    <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] tracking-wider uppercase text-[#f4e9c1] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-1.5 py-0.5 rounded-sm border border-[#3a2010]" style={{ background: "linear-gradient(180deg, #7a4a24, #5a3416)" }}>
                      {b.label}
                    </span>
                  </button>
                ));

              })()}
              {cameraMenuOpen ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-[10.75rem] top-[5rem] z-10 w-[200px] border-2 border-[#3a2010] p-2 animate-fade-in rounded-sm pointer-events-auto" style={{ background: "linear-gradient(180deg, #7a4a24, #4a2810)", boxShadow: "0 4px 0 #2a1608" }}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] tracking-widest uppercase text-[#f4e9c1]/80 mb-2">
                    <span>🔍</span>
                    <span className="tabular-nums text-[#ffd166]">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <button onClick={zoomOut} className="flex-1 border-2 border-[#f4e9c1]/40 hover:border-[#f4e9c1] py-1 text-sm text-[#f4e9c1]">−</button>
                    <button onClick={zoomIn} className="flex-1 border-2 border-[#f4e9c1]/40 hover:border-[#f4e9c1] py-1 text-sm text-[#f4e9c1]">+</button>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] tracking-widest uppercase text-[#f4e9c1]/80 mb-2">
                    <span>↕</span>
                    <span className="tabular-nums text-[#ffd166]">{cameraOffsetY}px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={cameraUp} className="flex-1 border-2 border-[#f4e9c1]/40 hover:border-[#f4e9c1] py-1 text-sm text-[#f4e9c1]">↑</button>
                    <button onClick={cameraDown} className="flex-1 border-2 border-[#f4e9c1]/40 hover:border-[#f4e9c1] py-1 text-sm text-[#f4e9c1]">↓</button>
                  </div>
                  <button onClick={cameraReset} className="w-full mt-2 border border-[#f4e9c1]/40 hover:border-[#f4e9c1] py-1 text-[10px] tracking-wider text-[#f4e9c1]">
                    ↺
                  </button>
                </div>
              ) : null}
              {tutorialOpen ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-20 top-1/2 -translate-y-1/2 z-10 w-[220px] border-2 border-[#c69a67] bg-[#3a2010]/95 p-3 animate-fade-in"
                  style={{ boxShadow: "0 4px 0 #0a141f" }}
                >
                  <p className="text-[10px] leading-snug text-[#f4e9c1]/90">
                    {t("gameMenu.tutorial.text")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          {settingsOpen ? (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
              onClick={() => setSettingsOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm overflow-hidden border-4 border-[#1a1a1a] text-[#f4e9c1] animate-scale-in"
                style={{
                  backgroundImage: `url(${stoneBgAsset.url})`,
                  backgroundSize: "256px 256px",
                  backgroundRepeat: "repeat",
                  imageRendering: "pixelated",
                  boxShadow: "0 10px 0 #000, inset 0 0 40px rgba(0,0,0,0.65), inset 0 0 0 2px #4a3a2a",
                }}
              >
                {/* dark vignette overlay for legibility */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%)" }}
                />
                {/* torch flicker glows */}
                <div className="pointer-events-none absolute -top-2 left-4 text-3xl" style={{ filter: "drop-shadow(0 0 12px #ff8c42)" }}>🔥</div>
                <div className="pointer-events-none absolute -top-2 right-4 text-3xl" style={{ filter: "drop-shadow(0 0 12px #ff8c42)" }}>🔥</div>

                <div className="relative p-6">
                  <div className="mb-1 text-center text-xs tracking-[0.4em] text-[#ffd166] uppercase" style={{ textShadow: "0 2px 0 #000, 0 0 12px rgba(255,140,66,0.6)" }}>
                    ⚔ {t("settings.title")} ⚔
                  </div>
                  <div className="mb-5 mx-auto h-[2px] w-24 bg-gradient-to-r from-transparent via-[#ffd166] to-transparent" />

                  <div className="border-2 border-[#1a1a1a] p-3" style={{ background: "rgba(0,0,0,0.45)", boxShadow: "inset 0 0 0 1px #4a3a2a" }}>
                    <div className="mb-2 flex items-center justify-between text-[10px] tracking-widest uppercase">
                      <span className="text-[#f4e9c1]">🔊 {t("settings.ambient")}</span>
                      <span className="text-[#ffd166] tabular-nums" style={{ textShadow: "0 1px 0 #000" }}>{ambientVolume}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(Number(e.target.value))}
                      className="w-full accent-[#ffd166]"
                    />
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setSettingsOpen(false)}
                      className="border-2 border-[#1a1a1a] px-6 py-2 text-[10px] tracking-[0.3em] text-[#ffd166] uppercase hover:brightness-110 active:translate-y-[2px] transition-all"
                      style={{ background: "linear-gradient(180deg, #7a4a24, #4a2810)", boxShadow: "0 4px 0 #1a0f06", textShadow: "0 1px 0 #000" }}
                    >
                      {t("settings.close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {isMobile ? (
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-between p-3 sm:p-5"
              style={{ touchAction: "none" }}
            >
              <div className="pointer-events-auto flex gap-2">
                <button
                  {...holdProps("left")}
                  aria-label="Left"
                  className="h-14 w-14 select-none border-4 border-[#f4e9c1] bg-[#0d1b2a]/70 text-2xl text-[#ffd166] active:bg-[#ffd166]/30"
                  style={{ touchAction: "none", boxShadow: "0 4px 0 #0a141f" }}
                >
                  ◄
                </button>
                <button
                  {...holdProps("right")}
                  aria-label="Right"
                  className="h-14 w-14 select-none border-4 border-[#f4e9c1] bg-[#0d1b2a]/70 text-2xl text-[#ffd166] active:bg-[#ffd166]/30"
                  style={{ touchAction: "none", boxShadow: "0 4px 0 #0a141f" }}
                >
                  ►
                </button>
              </div>
              <button
                {...holdProps("jump")}
                aria-label="Jump"
                className="pointer-events-auto h-16 w-16 select-none border-4 border-[#f4e9c1] bg-[#0d1b2a]/70 text-xl text-[#ffd166] active:bg-[#ffd166]/30"
                style={{ touchAction: "none", boxShadow: "0 4px 0 #0a141f" }}
              >
                ▲
              </button>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-2">
            <div
              className="pointer-events-auto flex items-center gap-1 sm:gap-2 border-2 border-[#f4e9c1]/60 bg-[#0d1b2a]/85 px-1.5 py-1 sm:px-2 sm:py-1.5"
              title={t("game.inv")}
              onMouseEnter={() => { lastInventoryHoverRef.current = Date.now(); setInventoryVisible(true); }}
              onMouseMove={() => { lastInventoryHoverRef.current = Date.now(); setInventoryVisible(true); }}
              onMouseLeave={() => { lastInventoryHoverRef.current = Date.now(); setInventoryVisible(true); }}
              onClick={() => { lastInventoryHoverRef.current = Date.now(); setInventoryVisible(true); }}
              onTouchStart={() => { lastInventoryHoverRef.current = Date.now(); setInventoryVisible(true); }}
              style={{
                boxShadow: "0 3px 0 #0a141f",
                opacity: inventoryVisible ? 1 : 0.18,
                transition: "opacity 600ms ease",
              }}
            >
              {HOTBAR_SLOTS.map((kind, i) => {
                const count =
                  kind === "stone" ? inventory.stones :
                  kind === "wood"  ? inventory.wood :
                  kind === "seed"  ? inventory.seeds :
                  kind === "axe"   ? inventory.axe :
                  kind === "hoe"   ? inventory.hoe :
                  kind === "pick"  ? inventory.pick :
                  kind === "copperPick" ? inventory.copperPick :
                  kind === "copperHammer" ? inventory.copperHammer :

                  kind === "spear" ? inventory.spear :
                  kind === "berrySeed" ? inventory.berrySeeds :
                  kind === "palmSeed"  ? inventory.palmSeeds :
                  kind === "mushroom"  ? inventory.mushrooms :
                  kind === "herb"      ? inventory.herbs :
                  kind === "coal"      ? inventory.coal :
                  kind === "copper"    ? inventory.copper :
                  kind === "bronze"    ? inventory.bronze :
                  kind === "iron"      ? inventory.iron :
                  kind === "copperMetal" ? inventory.copperMetal :
                  kind === "bronzeMetal" ? inventory.bronzeMetal :
                  kind === "copperBar" ? inventory.copperBar :
                  kind === "bronzeBar" ? inventory.bronzeBar :
                  kind === "torch"     ? inventory.torches : 0;
                const has = kind != null && count > 0;
                const selected = selectedSlot === i;
                const label = kind ? t(`item.${kind}`) : t("item.empty");
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${label}${has ? ` (${count})` : ""}`}
                    aria-pressed={selected}
                    onClick={() => {
                      if (carriedLogs > 0 || totalCarriedBars > 0) { flashPickup(t("msg.handsFull")); return; }
                      if (!has) { selectedKindRef.current = null; selectedSlotRef.current = null; setSelectedSlot(null); return; }
                      const next = selectedSlot === i ? null : i;
                      selectedSlotRef.current = next;
                      selectedKindRef.current = next == null ? null : kind;
                      setSelectedSlot(next);
                      // Mobile: tapping an item shows its name briefly.
                      if (isMobile && kind) {
                        if (slotTooltipTimerRef.current) window.clearTimeout(slotTooltipTimerRef.current);
                        setSlotTooltip({ kind, label });
                        slotTooltipTimerRef.current = window.setTimeout(() => setSlotTooltip(null), 2000);
                      }
                    }}
                    onDoubleClick={() => {
                      if (!has || kind == null) return;
                      const field: keyof Inv =
                        kind === "stone" ? "stones" :
                        kind === "wood"  ? "wood" :
                        kind === "seed"  ? "seeds" :
                        kind === "berrySeed" ? "berrySeeds" :
                        kind === "palmSeed"  ? "palmSeeds" :
                        kind === "mushroom"  ? "mushrooms" :
                        kind === "herb"      ? "herbs" :
                        kind === "torch"     ? "torches" :
                        (kind as keyof Inv);
                      setInventory((inv) => {
                        const cur = inv[field] as number;
                        if (cur <= 0) return inv;
                        const nxt = { ...inv, [field]: cur - 1 };
                        inventoryRef.current = nxt;
                        return nxt;
                      });
                      // Drop the item on the ground at the player's feet so
                      // it can be picked up again — matches how carried logs
                      // are released. Bars aren't in ItemKind so they still
                      // just discard.
                      const droppable = kind !== "copperBar" && kind !== "bronzeBar";
                      if (droppable) {
                        const s = stateRef.current;
                        const feetX = Math.round(s.x + SPRITE_W / 2 - 5);
                        // slight jitter so repeated drops fan out visually
                        const jitter = Math.floor((Math.random() - 0.5) * 10);
                        const dropId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        groundItemsRef.current = [
                          ...groundItemsRef.current,
                          { id: dropId, x: feetX + jitter, kind: kind as ItemKind, mode: modeRef.current, droppedAt: Date.now() },
                        ];
                        enforceCombinedGroundLimit();
                      }
                      flashPickup(t("msg.dropped"));
                      saveWorld();
                    }}
                    onMouseEnter={() => {
                      if (isMobile || !kind) return;
                      if (slotTooltipTimerRef.current) window.clearTimeout(slotTooltipTimerRef.current);
                      slotTooltipTimerRef.current = window.setTimeout(() => {
                        setSlotTooltip({ kind, label });
                      }, 500);
                    }}
                    onMouseLeave={() => {
                      if (slotTooltipTimerRef.current) window.clearTimeout(slotTooltipTimerRef.current);
                      slotTooltipTimerRef.current = null;
                      setSlotTooltip(null);
                    }}


                    className={
                      "relative h-6 w-6 sm:h-9 sm:w-9 flex items-center justify-center border-2 " +
                      (selected
                        ? "border-[#ffd166] bg-[#3a2a0a]"
                        : "border-[#f4e9c1]/40 bg-[#0a141f]/70 hover:border-[#f4e9c1]/70")
                    }
                    style={{ imageRendering: "pixelated" }}
                  >
                    {has ? <SlotIcon kind={kind!} /> : null}
                    {has ? (
                      <span className="absolute bottom-0 right-0.5 text-[9px] sm:text-[10px] leading-none tabular-nums text-[#f4e9c1]"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        {count}
                      </span>
                    ) : null}
                    {slotTooltip?.kind === kind ? (
                      <span
                        className="absolute -top-5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded border border-[#f4e9c1]/60 bg-[#0d1b2a]/95 px-1.5 py-0.5 text-[9px] text-[#f4e9c1] shadow-md"
                        style={{ textShadow: "1px 1px 0 #000" }}
                      >
                        {slotTooltip.label}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[9px] sm:text-[10px] tracking-widest text-[#f4e9c1]/60 text-center px-2">
          {isMobile ? t("game.hint.mobile") : `${t("game.hint.side")} · I / O = zoom`}
          {" · "}{t("game.hint.actions")}

        </p>


      </div>





      {mapOpen ? <WorldMap onClose={() => setMapOpen(false)} /> : null}
      {buildMenuOpen ? (
        <WoodMenu title={t("build.title")} onClose={() => { if (canCloseMenu()) setBuildMenuOpen(false); }}>
          <div className="grid grid-cols-2 gap-3">
            <BuildTile
              emoji="🪚"
              onClick={() => {
                setPlacingKind("bench");
                setBuildMenuOpen(false);
                flashPickup(t("build.clickGround"));
              }}
              costs={[
                { qty: BUILD_COSTS.bench.wood, kind: "wood" },
              ]}
              label={t("build.bench")}
            />
            <BuildTile
              emoji="🔨"
              onClick={() => {
                setPlacingKind("workshop");
                setBuildMenuOpen(false);
                flashPickup(t("build.clickGround"));
              }}
              costs={[
                { qty: BUILD_COSTS.workshop.wood, kind: "wood" },
                { qty: BUILD_COSTS.workshop.stones, kind: "stone" },
              ]}
              label={t("build.workshop")}
            />
          </div>
        </WoodMenu>
      ) : null}
      {benchMenuOpen ? (
        <WoodMenu title={t("bench.title")} onClose={() => { if (canCloseMenu()) setBenchMenuOpen(false); }} wide>
          {(() => {
            type CraftKey = "axe" | "hoe" | "pick" | "copperPick" | "copperHammer" | "spear" | "torch";
            const recipes: { key: CraftKey; label: string; wood: number; stones: number; coal: number; copper: number; copperMetal: number; invField: keyof typeof inventory; yield?: number }[] = [
              { key: "axe",   label: t("craft.axe"),   wood: 2, stones: 1, coal: 0, copper: 0, copperMetal: 0, invField: "axe" },
              { key: "hoe",   label: t("craft.hoe"),   wood: 2, stones: 1, coal: 0, copper: 0, copperMetal: 0, invField: "hoe" },
              { key: "pick",  label: t("craft.pick"),  wood: 2, stones: 2, coal: 0, copper: 0, copperMetal: 0, invField: "pick" },
              { key: "copperPick", label: t("craft.copperPick"), wood: 2, stones: 0, coal: 0, copper: 0, copperMetal: 2, invField: "copperPick" },
              { key: "copperHammer", label: t("craft.copperHammer"), wood: 2, stones: 0, coal: 0, copper: 0, copperMetal: 2, invField: "copperHammer" },
              { key: "spear", label: t("craft.spear"), wood: 2, stones: 1, coal: 0, copper: 0, copperMetal: 0, invField: "spear" },
              { key: "torch", label: t("craft.torch"), wood: 1, stones: 0, coal: 1, copper: 0, copperMetal: 0, invField: "torches", yield: 3 },
            ];
            return (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
                {recipes.map((r) => {
                  const canCraft =
                    inventory.wood >= r.wood && inventory.stones >= r.stones && inventory.coal >= r.coal && inventory.copper >= r.copper && inventory.copperMetal >= r.copperMetal;
                  return (
                    <CraftTile
                      key={r.key}
                      title={r.label}
                      disabled={!canCraft}
                      onClick={() => {
                        if (!canCraft) return;
                        setInventory((inv) => {
                          const next = {
                            ...inv,
                            wood: inv.wood - r.wood,
                            stones: inv.stones - r.stones,
                            coal: inv.coal - r.coal,
                            copper: inv.copper - r.copper,
                            copperMetal: inv.copperMetal - r.copperMetal,
                            [r.invField]: (inv[r.invField] as number) + (r.yield ?? 1),
                          };
                          inventoryRef.current = next;
                          return next;
                        });
                        if (r.wood > 0) {
                          carriedLogsRef.current = Math.max(0, carriedLogsRef.current - r.wood);
                          setCarriedLogs(carriedLogsRef.current);
                        }
                        flashPickup(t("craft.created", { name: r.label }));
                        saveWorld();
                      }}
                      thumb={<SlotIcon kind={r.key} size="lg" />}
                      costs={[
                        r.wood > 0 ? { qty: r.wood, kind: "wood" as SlotIconKind, affordable: inventory.wood >= r.wood } : null,
                        r.stones > 0 ? { qty: r.stones, kind: "stone" as SlotIconKind, affordable: inventory.stones >= r.stones } : null,
                        r.coal > 0 ? { qty: r.coal, kind: "coal" as SlotIconKind, affordable: inventory.coal >= r.coal } : null,
                        r.copper > 0 ? { qty: r.copper, kind: "copper" as SlotIconKind, affordable: inventory.copper >= r.copper } : null,
                        r.copperMetal > 0 ? { qty: r.copperMetal, kind: "copperMetal" as SlotIconKind, affordable: inventory.copperMetal >= r.copperMetal } : null,
                      ].filter(Boolean) as { qty: number; kind: SlotIconKind; affordable: boolean }[]}
                    />
                  );
                })}
              </div>
            );
          })()}
        </WoodMenu>
      ) : null}
      {workshopMenuOpen ? (
        <WoodMenu title={t("workshop.title")} onClose={() => { if (canCloseMenu()) setWorkshopMenuOpen(false); }}>
          {(() => {
            const furnaceCost = BUILD_COSTS.furnace;
            const chestCost = BUILD_COSTS.chest;
            const anvilCost = BUILD_COSTS.anvil;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <BuildTile
                  emoji="🔥"
                  label={t("workshop.craftFurnace")}
                  onClick={() => {
                    setWorkshopMenuOpen(false);
                    setPlacingKind("furnace");
                    flashPickup(t("build.clickGround"));
                  }}
                  costs={[
                    { qty: furnaceCost.stones, kind: "stone" },
                    { qty: furnaceCost.coal, kind: "coal" },
                    { qty: furnaceCost.wood, kind: "wood" },
                  ]}
                />
                <BuildTile
                  emoji="📦"
                  label={t("workshop.craftChest")}
                  onClick={() => {
                    setWorkshopMenuOpen(false);
                    setPlacingKind("chest");
                    flashPickup(t("build.clickGround"));
                  }}
                  costs={[
                    { qty: chestCost.wood, kind: "wood" },
                    { qty: chestCost.stones, kind: "stone" },
                  ]}
                />
                <BuildTile
                  emoji="⚒️"
                  label={t("workshop.craftAnvil")}
                  onClick={() => {
                    setWorkshopMenuOpen(false);
                    setPlacingKind("anvil");
                    flashPickup(t("build.clickGround"));
                  }}
                  costs={[
                    { qty: anvilCost.bronzeMetal, kind: "bronzeMetal" },
                    { qty: anvilCost.wood, kind: "wood" },
                  ]}
                />
              </div>
            );
          })()}
        </WoodMenu>
      ) : null}

      {anvilMenuOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => { if (canCloseMenu()) setAnvilMenuOpen(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative border-4 border-[#f4e9c1] bg-[#0d1b2a] p-5 max-w-[480px] w-full text-[#f4e9c1]"
            style={{ boxShadow: "0 6px 0 #0a141f" }}
          >
            <h2 className="text-sm sm:text-base tracking-widest uppercase mb-2">{t("anvil.title")}</h2>
            <p className="text-[10px] sm:text-xs text-[#f4e9c1]/70 mb-3">{t("anvil.intro")}</p>
            {(() => {
              const anvilId = anvilMenuOpen;
              const anvil = builtRef.current.find((b) => b.id === anvilId && b.kind === "anvil");
              const activeJob = anvil?.forgeJob;
              const hasHammer = inventory.copperHammer > 0;
              type ARow = {
                key: string;
                label: string;
                rawKind: "copperMetal" | "bronzeMetal";
                rawQty: number;
                barKind: "copperBar" | "bronzeBar";
                barName: string;
                barQty: number;
                canRun: boolean;
              };
              const rows: ARow[] = [
                {
                  key: "copper",
                  label: t("anvil.forgeCopper"),
                  rawKind: "copperMetal",
                  rawQty: 8,
                  barKind: "copperBar",
                  barName: t("item.copperBar"),
                  barQty: 1,
                  canRun: !activeJob && hasHammer && inventory.copperMetal >= 8,
                },
                {
                  key: "bronze",
                  label: t("anvil.forgeBronze"),
                  rawKind: "bronzeMetal",
                  rawQty: 8,
                  barKind: "bronzeBar",
                  barName: t("item.bronzeBar"),
                  barQty: 1,
                  canRun: !activeJob && hasHammer && inventory.bronzeMetal >= 8,
                },
              ];
              return (
                <div className="grid grid-cols-1 gap-2">
                  {!hasHammer ? (
                    <div className="text-[10px] sm:text-xs text-[#e05a4a] border-2 border-[#e05a4a]/40 p-2">
                      {t("anvil.needHammer")}
                    </div>
                  ) : null}
                  {activeJob ? (
                    <div className="text-[10px] sm:text-xs text-[#ffd166] border-2 border-[#ffd166]/40 p-2 flex items-center gap-2">
                      <SlotIcon kind={activeJob.rawKind} size="sm" />
                      <span>
                        {t("anvil.inProgress", {
                          n: activeJob.hitsRequired - activeJob.hits,
                          max: activeJob.hitsRequired,
                        })}
                      </span>
                    </div>
                  ) : null}
                  {rows.map((r) => (
                    <button
                      key={r.key}
                      disabled={!r.canRun}
                      onClick={() => {
                        if (!r.canRun || !anvil) return;
                        if (carriedLogsRef.current > 0 || totalCarriedBarsRef.current >= MAX_CARRY_BARS) {
                          flashPickup(t("msg.handsFull"));
                          return;
                        }
                        setInventory((inv) => ({
                          ...inv,
                          [r.rawKind]: Math.max(0, (inv[r.rawKind] ?? 0) - r.rawQty),
                        }));
                        anvil.forgeJob = {
                          rawKind: r.rawKind,
                          barKind: r.barKind,
                          barName: r.barName,
                          hits: 0,
                          hitsRequired: FORGE_HITS_REQUIRED,
                        };
                        bumpWorld();
                        saveWorld();
                        flashPickup(t("anvil.startForge"));
                        setAnvilMenuOpen(null);
                      }}
                      className={`w-full text-left border-2 p-3 ${r.canRun ? "border-[#c69a67]/60 bg-[#3a2010]/40 hover:border-[#ffd166]" : "border-[#f4e9c1]/20 bg-[#0d1b2a] opacity-50 cursor-not-allowed"}`}
                    >
                      <div className="text-[11px] sm:text-xs tracking-wider">{r.label}</div>
                      <div className="text-[9px] sm:text-[10px] text-[#f4e9c1]/70 mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
                        <span className="inline-flex items-center gap-1">{r.rawQty}× <SlotIcon kind={r.rawKind} size="sm" /></span>
                        <span>→</span>
                        <span className="inline-flex items-center gap-1">{r.barQty}× <SlotIcon kind={r.barKind} size="sm" /></span>
                        <span className="ml-2 text-[#ffd166]/80">
                          {t("anvil.hitsLabel", { n: FORGE_HITS_REQUIRED })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
            <button
              onClick={() => { if (canCloseMenu()) setAnvilMenuOpen(null); }}
              className="mt-4 w-full text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1]/40 py-2 hover:border-[#f4e9c1]"
            >
              {t("build.close")}
            </button>
          </div>
        </div>
      ) : null}
      {furnaceMenuOpen ? (
        <StoneMenu title={t("furnace.title")} onClose={() => { if (canCloseMenu()) setFurnaceMenuOpen(null); }}>

          {/* Ember glow bar under the title — sells the "hot forge" feel */}
          <div
            className="mb-3 h-1 w-full"
            style={{
              background: "linear-gradient(90deg, transparent, #ff4a10 20%, #ffb03a 50%, #ff4a10 80%, transparent)",
              boxShadow: "0 0 12px rgba(255,90,20,0.7)",
            }}
          />
          <p className="text-[10px] sm:text-xs text-[#ffd1a3]/85 mb-1" style={{ textShadow: "1px 1px 0 #000" }}>
            {t("furnace.intro")}
          </p>
          <p className="text-[9px] sm:text-[10px] text-[#ffd1a3]/55 mb-3" style={{ textShadow: "1px 1px 0 #000" }}>
            {t("furnace.recipe")}
          </p>
          {(() => {
            type Row = {
              key: string;
              label: string;
              barKind: SmeltJob["barKind"];
              barName: string;
              barQty: number;
              inputs: { field: keyof Inv; kind: SlotKind; qty: number }[];
              canRun: boolean;
            };
            const rows: Row[] = [
              {
                key: "copper",
                label: t("furnace.smeltCopper"),
                barKind: "copperMetal",
                barName: t("item.copperMetal"),
                barQty: 4,
                inputs: [
                  { field: "coal", kind: "coal", qty: 8 },
                  { field: "copper", kind: "copper", qty: 4 },
                ],
                canRun: inventory.coal >= 8 && inventory.copper >= 4,
              },
              {
                key: "bronze",
                label: t("furnace.smeltBronze"),
                barKind: "bronzeMetal",
                barName: t("item.bronzeMetal"),
                barQty: 4,
                inputs: [
                  { field: "coal", kind: "coal", qty: 8 },
                  { field: "bronze", kind: "bronze", qty: 4 },
                ],
                canRun: inventory.coal >= 8 && inventory.bronze >= 4,
              },
              {
                key: "coal",
                label: t("furnace.burnWood"),
                barKind: "coal",
                barName: t("item.coal"),
                barQty: 2,
                inputs: [{ field: "wood", kind: "wood", qty: 1 }],
                canRun: inventory.wood >= 1,
              },
              ...(salitreDiscovered
                ? [{
                    key: "salitre",
                    label: t("furnace.burnSalitre"),
                    barKind: "coal" as const,
                    barName: t("item.coal"),
                    barQty: 16,
                    inputs: [
                      { field: "iron" as keyof Inv, kind: "iron" as SlotKind, qty: 1 },
                      { field: "wood" as keyof Inv, kind: "wood" as SlotKind, qty: 1 },
                    ],
                    canRun: inventory.iron >= 1 && inventory.wood >= 1,
                  }]
                : []),
            ];
            const furnace = builtRef.current.find((x) => x.id === furnaceMenuOpen && x.kind === "furnace");
            const active = furnace?.smeltJob ?? null;
            const remainingMs = active ? Math.max(0, active.endsAt - smeltNow) : 0;
            const pct = active
              ? Math.max(0, Math.min(1, 1 - remainingMs / SMELT_DURATION_MS))
              : 0;
            // Ember pulse when actively smelting; still glow when ready to collect.
            const emberPulse = active
              ? (remainingMs <= 0
                ? "0 0 24px rgba(255,180,60,0.9), 0 0 0 3px #ff7a3d inset"
                : "0 0 14px rgba(255,120,40,0.55), 0 0 0 3px #ff7a3d inset")
              : undefined;
            return (
              <div className="grid grid-cols-1 gap-2">
                {active ? (
                  (() => {
                    const done = remainingMs <= 0;
                    return (
                      <div
                        className="relative p-3 overflow-hidden"
                        style={{
                          border: "3px solid #0a0608",
                          background:
                            "radial-gradient(ellipse at 50% 120%, rgba(255,90,20,0.35), transparent 60%), linear-gradient(180deg, #2a2028, #14101a)",
                          boxShadow: emberPulse,
                        }}
                      >
                        {/* Flickering ember flecks */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-70"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, #ffb03a 1px, transparent 2px), radial-gradient(circle, #ff5a10 1px, transparent 2px)",
                            backgroundSize: "40px 40px, 60px 60px",
                            backgroundPosition: "0 0, 20px 30px",
                            mixBlendMode: "screen",
                            animation: "pulse 2.4s ease-in-out infinite",
                          }}
                        />
                        <div className="relative text-[11px] sm:text-xs tracking-wider flex items-center gap-2 mb-2 text-[#ffe6a3]" style={{ textShadow: "1px 1px 0 #000" }}>
                          <span
                            className="inline-flex items-center justify-center h-7 w-7"
                            style={{
                              border: "2px solid #ff7a3d",
                              background: "#0a0608",
                              boxShadow: "0 0 10px rgba(255,120,40,0.6) inset",
                            }}
                          >
                            <SlotIcon kind={active.barKind} size="sm" />
                          </span>
                          <span className="truncate">
                            {done
                              ? t("furnace.ready", { name: active.barName })
                              : `${t("furnace.smelting", { name: active.barName })} · ${Math.ceil(remainingMs / 1000)}s`}
                          </span>
                        </div>
                        <div
                          className="relative h-2.5 w-full mb-2"
                          style={{ background: "#0a0608", border: "2px solid #1a1015" }}
                        >
                          <div
                            className="h-full transition-[width] duration-200"
                            style={{
                              width: `${Math.round(pct * 100)}%`,
                              background: "linear-gradient(90deg, #ff4a10, #ffb03a, #fff2a3)",
                              boxShadow: "0 0 8px rgba(255,150,50,0.9)",
                            }}
                          />
                        </div>
                        {done ? (
                          <button
                          onClick={() => {
                              const f = builtRef.current.find((x) => x.id === furnaceMenuOpen && x.kind === "furnace");
                              const job = f?.smeltJob;
                              if (!f || !job || Date.now() < job.endsAt) return;
                              f.smeltJob = undefined;
                              setInventory((inv) => {
                                const next = { ...inv, [job.barKind]: (inv[job.barKind] as number) + job.barQty } as Inv;
                                inventoryRef.current = next;
                                return next;
                              });
                              setSmeltNow(Date.now());
                              flashPickup(`+${job.barQty} ${job.barName}`);
                              saveWorld();
                            }}
                            className="relative w-full text-[10px] sm:text-xs tracking-widest uppercase py-2 text-[#fff2a3] active:translate-y-[2px]"
                            style={{
                              border: "3px solid #0a0608",
                              background: "linear-gradient(180deg, #ff7a3d, #c94a10)",
                              boxShadow: "0 0 0 2px #ffd166 inset, 0 4px 0 #0a0608, 0 0 18px rgba(255,150,50,0.7)",
                              textShadow: "1px 1px 0 #000",
                            }}
                          >
                            {t("furnace.collect")} ({active.barQty}× {active.barName})
                          </button>
                        ) : null}
                      </div>
                    );
                  })()
                ) : (
                  rows.map((r) => {
                    return (
                      <button
                        key={r.key}
                        disabled={!r.canRun}
                        onClick={() => {
                          const f = builtRef.current.find((x) => x.id === furnaceMenuOpen && x.kind === "furnace");
                          if (!f || !r.canRun || f.smeltJob) return;
                          setInventory((inv) => {
                            for (const inp of r.inputs) {
                              if ((inv[inp.field] as number) < inp.qty) return inv;
                            }
                            const next = { ...inv } as Inv;
                            for (const inp of r.inputs) {
                              (next[inp.field] as number) = (inv[inp.field] as number) - inp.qty;
                            }
                            inventoryRef.current = next;
                            return next;
                          });
                          const woodIn = r.inputs.find((i) => i.field === "wood");
                          if (woodIn) {
                            const drop = Math.min(woodIn.qty, carriedLogsRef.current);
                            if (drop > 0) {
                              carriedLogsRef.current = carriedLogsRef.current - drop;
                              setCarriedLogs((c) => Math.max(0, c - drop));
                            }
                          }
                          const startedAt = Date.now();
                          const job: SmeltJob = {
                            barKind: r.barKind,
                            barName: r.barName,
                            barQty: r.barQty,
                            startedAt,
                            endsAt: startedAt + SMELT_DURATION_MS,
                          };
                          f.smeltJob = job;
                          setSmeltNow(startedAt);
                          saveWorld();
                        }}
                        className={`relative text-left p-2 transition-transform ${r.canRun ? "active:translate-y-[2px]" : "cursor-not-allowed"}`}
                        style={{
                          border: "3px solid #0a0608",
                          background: r.canRun
                            ? "linear-gradient(180deg, rgba(90,80,95,0.75), rgba(40,32,44,0.9))"
                            : "linear-gradient(180deg, rgba(30,26,34,0.85), rgba(15,12,18,0.9))",
                          boxShadow: r.canRun
                            ? "0 0 0 2px #ff7a3d inset, 0 4px 0 #0a0608"
                            : "0 0 0 2px #3a3038 inset",
                          filter: r.canRun ? undefined : "brightness(0.7)",
                        }}
                      >
                        <div className="text-[11px] sm:text-xs tracking-wider flex items-center gap-2 text-[#ffe6a3]" style={{ textShadow: "1px 1px 0 #000" }}>
                          <span
                            className="inline-flex items-center justify-center h-7 w-7"
                            style={{
                              border: "2px solid " + (r.canRun ? "#ff7a3d" : "#3a3038"),
                              background: "#0a0608",
                              boxShadow: r.canRun ? "0 0 8px rgba(255,120,40,0.55) inset" : undefined,
                            }}
                          >
                            <SlotIcon kind={r.barKind} size="sm" />
                          </span>
                          <span className="truncate">{r.label}</span>
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#ffd1a3]/80 mt-1 flex items-center flex-wrap gap-x-2 gap-y-1" style={{ textShadow: "1px 1px 0 #000" }}>
                          {r.inputs.map((inp, i) => {
                            const have = (inventory[inp.field] as number) ?? 0;
                            const short = have < inp.qty;
                            return (
                              <span key={i} className="inline-flex items-center gap-1">
                                <span style={{ color: short ? "#ff5a4a" : "#ffd166" }}>{inp.qty}×</span>
                                <SlotIcon kind={inp.kind} size="sm" />
                              </span>
                            );
                          })}
                          <span className="text-[#ffd1a3]/50">→</span>
                          <span className="inline-flex items-center gap-1">
                            <span style={{ color: "#ffd166" }}>{r.barQty}×</span>
                            <SlotIcon kind={r.barKind} size="sm" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })()}
          <button
            onClick={() => { if (canCloseMenu()) setFurnaceMenuOpen(null); }}
            className="mt-4 w-full text-[10px] tracking-widest uppercase py-2 text-[#ffd1a3] hover:text-[#ffe6a3]"
            style={{
              border: "3px solid #0a0608",
              background: "linear-gradient(180deg, #2a2028, #14101a)",
              boxShadow: "0 0 0 2px #4a4650 inset, 0 3px 0 #0a0608",
              textShadow: "1px 1px 0 #000",
            }}
          >
            {t("build.close")}
          </button>
        </StoneMenu>
      ) : null}
      {chestMenuOpen ? (() => {
        const chestId = chestMenuOpen;
        const chest = builtRef.current.find((b) => b.id === chestId && b.kind === "chest");
        if (!chest) {
          // Chest was removed somehow — close the panel.
          return null;
        }
        const storage: Partial<Record<SlotKind, number>> = chest.storage ?? {};
        const allKinds: SlotKind[] = HOTBAR_PRIORITY;
        const playerRows = allKinds.filter((k) => countFor(k) > 0);
        const chestRows = allKinds.filter((k) => (storage[k] ?? 0) > 0);
        const chestTotal = (s: Partial<Record<SlotKind, number>>): number => {
          let sum = 0;
          for (const v of Object.values(s)) sum += v ?? 0;
          return sum;
        };
        const deposit = (k: SlotKind, all: boolean) => {
          const field = slotKindInvField(k);
          const have = inventoryRef.current[field] as number;
          if (have <= 0) return;
          const wanted = all ? have : 1;
          const room = Math.max(0, CHEST_MAX_ITEMS - chestTotal(storage));
          if (room <= 0) {
            flashPickup(t("chest.full", { n: CHEST_MAX_ITEMS }));
            return;
          }
          const take = Math.min(wanted, have, room);
          if (take <= 0) return;
          setInventory((inv) => {
            const cur = inv[field] as number;
            const t2 = Math.min(take, cur);
            const nxt = { ...inv, [field]: cur - t2 };
            inventoryRef.current = nxt;
            return nxt;
          });
          // Wood is also "held" as visible logs on the character — keep the
          // carriedLogs counter in sync so depositing wood also removes it
          // from the player's hands (prevents duplication by dropping it).
          if (k === "wood") {
            const drop = Math.min(take, carriedLogsRef.current);
            if (drop > 0) {
              carriedLogsRef.current = carriedLogsRef.current - drop;
              setCarriedLogs((c) => Math.max(0, c - drop));
            }
          }
          const nextStorage = { ...storage, [k]: (storage[k] ?? 0) + take };
          chest.storage = nextStorage;
          bumpWorld();
          saveWorld();
        };
        const withdraw = (k: SlotKind, all: boolean) => {
          const inChest = storage[k] ?? 0;
          if (inChest <= 0) return;
          // When taking multiple, only take as many as the hotbar can still
          // accept — first item creates the stack, the rest pile on top of it.
          if (!canAcquireSlot(k)) {
            flashPickup(t("msg.inventoryFull"));
            return;
          }
          let n = all ? inChest : 1;
          // Wood withdrawals are capped by MAX_CARRY_LOGS since each wood
          // in inventory corresponds to a log visibly carried by the player.
          if (k === "wood") {
            if (totalCarriedBarsRef.current > 0) {
              flashPickup(t("msg.handsFull"));
              return;
            }
            const room = Math.max(0, MAX_CARRY_LOGS - carriedLogsRef.current);
            if (room <= 0) {
              flashPickup(t("msg.maxLogs", { n: MAX_CARRY_LOGS }));
              return;
            }
            n = Math.min(n, room);
          }
          if (k === "copperBar" || k === "bronzeBar" || k === "ironBar") {
            if (carriedLogsRef.current > 0) {
              flashPickup(t("msg.handsFull"));
              return;
            }
            const room = Math.max(0, MAX_CARRY_BARS - totalCarriedBarsRef.current);
            if (room <= 0) {
              flashPickup(t("msg.handsFull"));
              return;
            }
            n = Math.min(n, room);
          }
          const field = slotKindInvField(k);
          setInventory((inv) => {
            const nxt = { ...inv, [field]: (inv[field] as number) + n };
            inventoryRef.current = nxt;
            return nxt;
          });
          if (k === "wood") {
            carriedLogsRef.current = carriedLogsRef.current + n;
            setCarriedLogs((c) => c + n);
          }
          const remaining = inChest - n;
          const nextStorage = { ...storage };
          if (remaining > 0) nextStorage[k] = remaining;
          else delete nextStorage[k];
          chest.storage = nextStorage;
          bumpWorld();
          saveWorld();
        };
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => { if (canCloseMenu()) setChestMenuOpen(null); }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative border-4 border-[#f4e9c1] bg-[#0d1b2a] p-4 sm:p-5 max-w-[720px] w-full max-h-[90vh] flex flex-col text-[#f4e9c1]"
              style={{ boxShadow: "0 6px 0 #0a141f" }}
            >
              <h2 className="text-sm sm:text-base tracking-widest uppercase mb-2">{t("chest.title")}</h2>
              <p className="text-[10px] sm:text-xs text-[#f4e9c1]/70 mb-1">{t("chest.intro")}</p>
              <p className="text-[10px] text-[#ffd166]/80 mb-2">{chestTotal(storage)}/{CHEST_MAX_ITEMS}</p>
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
                <div className="border-2 border-[#c69a67]/40 p-2">
                  <div className="text-[10px] sm:text-xs tracking-widest uppercase mb-2 text-[#f4e9c1]/80">
                    {t("chest.you")}
                  </div>
                  {playerRows.length === 0 ? (
                    <div className="text-[10px] text-[#f4e9c1]/40 italic">{t("chest.empty")}</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {playerRows.map((k) => (
                        <button
                          key={k}
                          onClick={(e) => deposit(k, e.shiftKey)}
                          className="flex items-center gap-2 border border-[#c69a67]/40 hover:border-[#ffd166] bg-[#3a2010]/30 px-2 py-1 text-left"
                        >
                          <span className="inline-flex items-center justify-center h-6 w-6 shrink-0 border border-[#f4e9c1]/30 bg-[#0a141f]/70">
                            <SlotIcon kind={k} size="sm" />
                          </span>
                          <span className="text-[11px] truncate flex-1">{t(`item.${k}`)}</span>
                          <span className="text-[11px] tabular-nums text-[#ffd166]">{countFor(k)}</span>
                          <span className="text-[10px] text-[#f4e9c1]/60">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-2 border-[#c69a67]/40 p-2">
                  <div className="text-[10px] sm:text-xs tracking-widest uppercase mb-2 text-[#f4e9c1]/80">
                    {t("chest.chest")}
                  </div>
                  {chestRows.length === 0 ? (
                    <div className="text-[10px] text-[#f4e9c1]/40 italic">{t("chest.empty")}</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {chestRows.map((k) => (
                        <button
                          key={k}
                          onClick={(e) => withdraw(k, e.shiftKey)}
                          className="flex items-center gap-2 border border-[#c69a67]/40 hover:border-[#ffd166] bg-[#3a2010]/30 px-2 py-1 text-left"
                        >
                          <span className="text-[10px] text-[#f4e9c1]/60">←</span>
                          <span className="inline-flex items-center justify-center h-6 w-6 shrink-0 border border-[#f4e9c1]/30 bg-[#0a141f]/70">
                            <SlotIcon kind={k} size="sm" />
                          </span>
                          <span className="text-[11px] truncate flex-1">{t(`item.${k}`)}</span>
                          <span className="text-[11px] tabular-nums text-[#ffd166]">{storage[k] ?? 0}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => { if (canCloseMenu()) setChestMenuOpen(null); }}
                className="mt-4 w-full text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1]/40 py-2 hover:border-[#f4e9c1]"
              >
                {t("build.close")}
              </button>
            </div>
          </div>
        );
      })() : null}
      {repairModalOpen ? (() => {
        const b = builtRef.current.find((x) => x.id === repairModalOpen);
        if (!b) return null;
        const hp = b.hp ?? BUILD_MAX_HP;
        const damaged = hp < BUILD_MAX_HP;
        const cost = repairCostFor(hp);
        const mat = repairMaterialFor(b.kind);
        const chestHasItems =
          b.kind === "chest" &&
          !!b.storage &&
          Object.values(b.storage).some((v) => (v ?? 0) > 0);
        const canMove = !chestHasItems;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setRepairModalOpen(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative border-4 border-[#f4e9c1] bg-[#0d1b2a] p-4 sm:p-5 max-w-[360px] w-full text-[#f4e9c1]"
              style={{ boxShadow: "0 6px 0 #0a141f" }}
            >
              <h2 className="text-sm tracking-widest uppercase mb-2">
                {BUILD_LABELS[b.kind]}
              </h2>
              <p className="text-[10px] sm:text-xs text-[#f4e9c1]/70 mb-2">
                {t("build.repairHP", { hp, max: BUILD_MAX_HP })}
              </p>
              {damaged ? (
                <>
                  <p className="text-[11px] sm:text-xs mb-2">
                    {t("build.repairCost")}: <span className="text-[#ffd166]">{cost}× {mat === "wood" ? "🪵" : "🪨"}</span>
                  </p>
                  <p className="text-[10px] text-[#f4e9c1]/60 mb-3">
                    {mat === "wood" ? t("build.repairHintWood") : t("build.repairHintStone")}
                  </p>
                </>
              ) : null}
              {!canMove ? (
                <p className="text-[10px] text-[#ff8b7a] mb-3">
                  {t("build.moveNeedEmpty")}
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                {damaged ? (
                  <button
                    onClick={() => {
                      b.repairing = true;
                      b.repairCost = cost;
                      b.repairDelivered = 0;
                      // Force the hammer out of the player's hand.
                      setSelectedSlot(null);
                      selectedKindRef.current = null;
                      setRepairModalOpen(null);
                      bumpWorld();
                      saveWorld();
                    }}
                    className="w-full text-[11px] tracking-widest uppercase border-2 border-[#ffd166] text-[#ffd166] py-2 hover:bg-[#ffd166]/10"
                  >
                    {t("build.repair")}
                  </button>
                ) : null}
                <button
                  disabled={!canMove}
                  onClick={() => {
                    if (!canMove) return;
                    setMovingBuildId(b.id);
                    // Put the hammer away so the player can walk & click ground freely.
                    setSelectedSlot(null);
                    selectedKindRef.current = null;
                    setRepairModalOpen(null);
                    bumpWorld();
                  }}
                  className={
                    "w-full text-[11px] tracking-widest uppercase border-2 py-2 " +
                    (canMove
                      ? "border-[#7fd1ff] text-[#7fd1ff] hover:bg-[#7fd1ff]/10"
                      : "border-[#f4e9c1]/20 text-[#f4e9c1]/30 cursor-not-allowed")
                  }
                >
                  {t("build.move")}
                </button>
                <button
                  onClick={() => setRepairModalOpen(null)}
                  className="w-full text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1]/40 py-2 hover:border-[#f4e9c1]"
                >
                  {t("build.cancel")}
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}
      {placingKind ? (
        <div className="pointer-events-none fixed top-2 left-1/2 -translate-x-1/2 z-40 border-2 border-[#ffd166] bg-[#0d1b2a]/90 text-[#ffd166] text-[10px] sm:text-xs tracking-widest uppercase px-3 py-1.5">
          {t("build.positioning", { name: BUILD_LABELS[placingKind] })} <button
            className="pointer-events-auto underline ml-1"
            onClick={() => setPlacingKind(null)}
          >
            {t("build.cancel")}
          </button>
        </div>
      ) : null}
      {movingBuildId ? (() => {
        const mb = builtRef.current.find((x) => x.id === movingBuildId);
        if (!mb) return null;
        return (
          <div className="pointer-events-none fixed top-2 left-1/2 -translate-x-1/2 z-40 border-2 border-[#7fd1ff] bg-[#0d1b2a]/90 text-[#7fd1ff] text-[10px] sm:text-xs tracking-widest uppercase px-3 py-1.5">
            {t("build.moving", { name: BUILD_LABELS[mb.kind] })} <button
              className="pointer-events-auto underline ml-1"
              onClick={() => setMovingBuildId(null)}
            >
              {t("build.cancel")}
            </button>
          </div>
        );
      })() : null}

      {dead ? <DeathOverlay onRestart={respawn} /> : null}
      {editingLook && character ? (
        <AppearanceEditModal
          appearance={character.appearance}
          onCancel={() => setEditingLook(false)}
          onSave={(patch) => {
            const slot = getActiveSlot();
            if (slot == null) return;
            const next = updateSlotAppearance(slot, patch);
            if (next) {
              setCharacter(next);
              appearanceRef.current = next.appearance;
            }
            setEditingLook(false);
          }}
        />
      ) : null}
    </div>
  );
}

// ---------- world map ----------

function WorldMap({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative border-4 border-[#f4e9c1] bg-[#0d1b2a] p-4 max-w-[560px] w-full"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#ffd166]" style={{ textShadow: "2px 2px 0 #7a3e1d" }}>
            🗺 {t("game.mapTitle")}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1]/40 px-3 py-1 hover:border-[#f4e9c1]"
          >
            ✕
          </button>
        </div>

        {/* Ocean + island pixel map */}
        <div
          className="border-2 border-[#f4e9c1]/30"
          style={{
            imageRendering: "pixelated",
            aspectRatio: "16 / 10",
            background:
              "repeating-linear-gradient(0deg, #1e3a5f 0px, #1e3a5f 8px, #24487a 8px, #24487a 16px)",
            position: "relative",
          }}
        >
          {/* Faint ocean wave dashes */}
          <svg
            viewBox="0 0 160 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: "pixelated" }}
          >
            {/* wave marks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const x = (i * 37) % 160;
              const y = (i * 23) % 100;
              return (
                <g key={i} fill="#4a7ab0" opacity={0.6}>
                  <rect x={x} y={y} width={3} height={1} />
                  <rect x={x + 5} y={y + 1} width={2} height={1} />
                </g>
              );
            })}

            {/* Island silhouette (rough blob) */}
            <g>
              {/* sand ring */}
              <ellipse cx={80} cy={52} rx={28} ry={18} fill="#e6c98a" />
              {/* grass body */}
              <ellipse cx={80} cy={50} rx={22} ry={13} fill="#4a7a3a" />
              <ellipse cx={72} cy={46} rx={10} ry={5} fill="#6ea44a" />
              {/* tiny palm tree */}
              <rect x={86} y={44} width={1.5} height={6} fill="#5a3a1a" />
              <ellipse cx={87} cy={43} rx={4} ry={2} fill="#3a6a44" />
              {/* small mountain */}
              <polygon points="75,50 80,42 85,50" fill="#6a5a3a" />
              <polygon points="78,46 80,42 82,46" fill="#f4e9c1" />
            </g>

            {/* "You are here" marker */}
            <g>
              <circle cx={80} cy={50} r={2.4} fill="#c94b4b" stroke="#f4e9c1" strokeWidth={0.6} />
            </g>

            {/* Island label */}
            <text
              x={80}
              y={78}
              textAnchor="middle"
              fill="#f4e9c1"
              fontSize={6}
              fontFamily="monospace"
              style={{ textShadow: "1px 1px 0 #000" }}
            >
              {t("game.islandName")}
            </text>
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between text-[9px] tracking-widest text-[#f4e9c1]/70 uppercase">
          <span>
            <span className="inline-block w-2 h-2 mr-1 align-middle bg-[#c94b4b] border border-[#f4e9c1]" />
            {t("game.youAreHere")}
          </span>
          <span>{t("game.mapHint")}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- rendering ----------

// ----- Biome system -----
// Two continuous environments smoothly cross-fade across the world:
//   0 = Verdant Meadow  (cool blue sky, bright green rolling grasslands)
//   1 = Autumn Woodlands (warm dusk sky, ember-orange hills and dark pines)
const BIOME_A_END = 1400;
const BIOME_B_START = 3400;
const BIOME_HORIZON = HORIZON_Y;

function biomeMix(worldX: number): number {
  if (worldX <= BIOME_A_END) return 0;
  if (worldX >= BIOME_B_START) return 1;
  const t = (worldX - BIOME_A_END) / (BIOME_B_START - BIOME_A_END);
  return t * t * (3 - 2 * t); // smoothstep — no sudden shift
}

const BIOME_A = {
  skyTop: "#6fb4e6",
  skyMid: "#a6d4ef",
  skyLow: "#d8ecf6",
  skyHorizon: "#f2e8d0",
  mountainBack: "#7a8caf",
  mountainFront: "#5a6d90",
  hillBack: "#5aa055",
  hillFront: "#3f7f45",
  treeBack: "#294f2e",
  treeFront: "#1e3d25",
  grassTop: "#7ab848",
  grass: "#5a9a42",
  grassDark: "#4e8a3a",
  soil: "#6a4a28",
  soilDeep: "#4a3018",
};

// Second biome is another lush green meadow with slightly warmer light —
// keeps the ground green everywhere while adding gentle variety.
const BIOME_B = {
  skyTop: "#66acdf",
  skyMid: "#9fcfea",
  skyLow: "#d0e7f2",
  skyHorizon: "#f5ecd6",
  mountainBack: "#7686aa",
  mountainFront: "#586a8c",
  hillBack: "#5fa858",
  hillFront: "#438548",
  treeBack: "#26482a",
  treeFront: "#1b3820",
  grassTop: "#88c650",
  grass: "#66a446",
  grassDark: "#568c3a",
  soil: "#6a4a28",
  soilDeep: "#4a3018",
};

// Coast: the far-right end of the world is a sandy beach that fades into an
// animated ocean. Everything between BEACH_START and OCEAN_START is walkable
// sand; past OCEAN_START the water begins and the player is stopped.
const BEACH_START = 3800;
const OCEAN_START = 4450;
// Mirror coast on the left side of the world
const BEACH_LEFT_END = 900; // sand from OCEAN_LEFT_END..BEACH_LEFT_END
const OCEAN_LEFT_END = 300; // ocean from 0..OCEAN_LEFT_END
const SAND_TOP = "#f5e0a8";
const SAND = "#e8c98a";
const SAND_DEEP = "#c9a86a";
const WATER_SHALLOW: [number, number, number] = [128, 206, 198];
const WATER_MID: [number, number, number] = [58, 148, 170];
const WATER_DEEP: [number, number, number] = [24, 78, 108];

// Slope offset (in screen px) added to GROUND_Y to make the beach descend
// diagonally into the ocean instead of ending in a hard horizontal cut.
// 0 at the grass edge, growing to SAND_SLOPE_MAX at shore, and STAYING at
// SAND_SLOPE_MAX beyond the shore so the sand meets the water surface with
// no step and the player doesn't pop back up out of the water.
const SAND_SLOPE_MAX = 20;
// Water surface line sits this far below GROUND_Y, aligned with where the
// sloped beach ends — no hard vertical cut between sand and ocean.
const WATER_LEVEL_Y = GROUND_Y + SAND_SLOPE_MAX;
function beachSurfaceOffset(wx: number): number {
  // Right beach: dry slope from BEACH_START to OCEAN_START.
  if (wx >= BEACH_START && wx <= OCEAN_START) {
    const t = (wx - BEACH_START) / (OCEAN_START - BEACH_START);
    return Math.round(t * SAND_SLOPE_MAX);
  }
  if (wx > OCEAN_START) return SAND_SLOPE_MAX; // submerged shelf
  // Left beach: dry slope from BEACH_LEFT_END down to OCEAN_LEFT_END.
  if (wx <= BEACH_LEFT_END && wx >= OCEAN_LEFT_END) {
    const t = (BEACH_LEFT_END - wx) / (BEACH_LEFT_END - OCEAN_LEFT_END);
    return Math.round(t * SAND_SLOPE_MAX);
  }
  if (wx < OCEAN_LEFT_END) return SAND_SLOPE_MAX;
  return 0;
}

// Canonical surface Y for any world-x. Drops, pickups and beach entities
// must use THIS instead of raw GROUND_Y so they follow the sand slope.
export function getGroundYAt(wx: number): number {
  return GROUND_Y + beachSurfaceOffset(wx);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function biomeColor(key: keyof typeof BIOME_A, worldX: number): string {
  return mixHex(BIOME_A[key], BIOME_B[key], biomeMix(worldX));
}

// Paint a horizontal band using a left→right gradient whose stops come from
// the biome palette evaluated at the left/right world-x of the viewport.
function bandGradient(
  ctx: CanvasRenderingContext2D,
  key: keyof typeof BIOME_A,
  camX: number,
  y: number,
  h: number,
) {
  const leftCol = biomeColor(key, camX);
  const rightCol = biomeColor(key, camX + VW);
  const midCol = biomeColor(key, camX + VW / 2);
  const g = ctx.createLinearGradient(0, 0, VW, 0);
  g.addColorStop(0, leftCol);
  g.addColorStop(0.5, midCol);
  g.addColorStop(1, rightCol);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, VW, h);
}

type WorldRender = {
  choppedTrees: Set<number>;      // trees fully removed (never redraw canopy)
  visibleStumps: Set<number>;     // subset still showing a stump
  takenStones: Set<number>;       // pebbles currently gone
  pickedProps: Set<string>;       // foraged bushes/mushrooms/plants (key = `${type}:${x}`)
  brokenPalms: Set<number>;       // felled palm bases (worldX)
  extraPalms: PalmPos[];          // palms planted by the player at arbitrary x
  minedRocks: Set<number>;        // big forest rocks currently mined out (worldX)
  extraRocks: { x: number }[];    // rocks spawned by regeneration at new spots
  groundLogs: { id: string; x: number }[];
  groundPebbles: { id: string; x: number; variant: number }[];
  groundItems: { id: string; x: number; kind: ItemKind; mode: "world" | "cave" | "cave2"; droppedAt: number }[];
  seeds: { id: string; x: number }[];
  planted: { id: string; x: number; plantedAt: number; variant: number }[];
  now: number;                    // performance.now() ms
};

// ------------------- Cave interior scene -------------------
function drawCaveScene(ctx: CanvasRenderingContext2D, camX: number, time: number, camXf: number = camX) {
  // Cooler, grayer palette for a stone cave feel (was brownish/red).
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, "#0a0b0d");
  g.addColorStop(0.55, "#1c1e22");
  g.addColorStop(1, "#101215");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);

  // Ceiling band — gray rock with faint texture rows.
  ctx.fillStyle = "#2a2d32";
  ctx.fillRect(0, 0, VW, 44);
  ctx.fillStyle = "#1a1c20";
  for (let x = -((camXf * 0.5) % 16); x < VW; x += 16) {
    ctx.fillRect(x, 12, 8, 3);
    ctx.fillRect(x + 4, 28, 6, 3);
  }
  // Ceiling cracks — jagged darker lines.
  ctx.fillStyle = "#0d0e10";
  for (let x = ((-camXf * 0.5) % 90 + 90) % 90 - 90; x < VW + 90; x += 90) {
    ctx.fillRect(x + 10, 4, 1, 6);
    ctx.fillRect(x + 11, 8, 1, 5);
    ctx.fillRect(x + 12, 12, 1, 6);
    ctx.fillRect(x + 48, 0, 1, 10);
    ctx.fillRect(x + 49, 8, 1, 6);
    ctx.fillRect(x + 70, 6, 1, 8);
    ctx.fillRect(x + 71, 12, 1, 5);
  }

  // Cobwebs in the ceiling corners — fine radial lines with arcs.
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
      ctx.moveTo(cx + Math.cos(-Math.PI / 2 - 0.7) * r, cy + Math.sin(-Math.PI / 2 - 0.7) * r);
      for (let i = 1; i <= 4; i++) {
        const a = -Math.PI / 2 - 0.7 + (i / 4) * 1.4;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    }
    ctx.stroke();
  };
  const webOff = -Math.floor(camXf * 0.7);
  for (let x = ((webOff % 220) + 220) % 220 - 220; x < VW + 220; x += 220) {
    drawWeb(x + 20, 4, 22);
    drawWeb(x + 180, 6, 18);
  }

  // Stalactites hanging from the ceiling — parallax against camera.
  ctx.fillStyle = "#3a3d44";
  const stalOff = -Math.floor(camXf * 0.6);
  for (let x = ((stalOff % 60) + 60) % 60 - 60; x < VW + 60; x += 60) {
    ctx.fillRect(x + 8, 44, 6, 12);
    ctx.fillRect(x + 9, 56, 4, 6);
    ctx.fillRect(x + 10, 62, 2, 4);
    ctx.fillRect(x + 30, 44, 4, 8);
    ctx.fillRect(x + 31, 52, 2, 4);
  }
  ctx.fillStyle = "#52565e";
  for (let x = ((stalOff % 60) + 60) % 60 - 60; x < VW + 60; x += 60) {
    ctx.fillRect(x + 8, 44, 1, 6);
    ctx.fillRect(x + 30, 44, 1, 4);
  }

  // Falling water drops (deterministic per column, animated).
  const dropOff = -Math.floor(camXf * 0.6);
  for (let x = ((dropOff % 180) + 180) % 180 - 180; x < VW + 180; x += 180) {
    const worldCol = Math.round(x + camXf * 0.6);
    const seed = ((worldCol * 928371) & 0xffff) / 0xffff;
    const period = 1.6 + seed * 1.4;
    const phase = (time + seed * 5) % period;
    const t = phase / period;
    const startY = 66;
    const floorY = GROUND_Y - 2;
    const dy = startY + (floorY - startY) * t;
    const dropX = x + 10 + Math.floor(seed * 40);
    ctx.fillStyle = "rgba(150, 190, 220, 0.85)";
    ctx.fillRect(dropX, Math.round(dy), 1, 2);
    if (t > 0.9) {
      ctx.fillStyle = "rgba(150, 190, 220, 0.7)";
      ctx.fillRect(dropX - 2, floorY, 1, 1);
      ctx.fillRect(dropX + 2, floorY, 1, 1);
    }
  }

  // Cave floor — gray, layered stone.
  ctx.fillStyle = "#22252a";
  ctx.fillRect(0, GROUND_Y, VW, VH - GROUND_Y + GROUND_EXTRA);
  ctx.fillStyle = "#2f333a";
  ctx.fillRect(0, GROUND_Y, VW, 4);
  ctx.fillStyle = "#151719";
  ctx.fillRect(0, GROUND_Y + 4, VW, 3);
  // Floor cracks.
  ctx.fillStyle = "#0d0e10";
  const floorCrackOff = -camX;
  for (let x = ((floorCrackOff % 140) + 140) % 140 - 140; x < VW + 140; x += 140) {
    ctx.fillRect(x + 20, GROUND_Y + 2, 10, 1);
    ctx.fillRect(x + 30, GROUND_Y + 3, 6, 1);
    ctx.fillRect(x + 80, GROUND_Y + 5, 14, 1);
    ctx.fillRect(x + 92, GROUND_Y + 6, 4, 1);
  }
  // Small pebble scatter on the floor.
  ctx.fillStyle = "#4a4e56";
  const floorOff = -camX;
  for (let x = ((floorOff % 34) + 34) % 34 - 34; x < VW + 34; x += 34) {
    ctx.fillRect(x + 6, GROUND_Y + 8, 2, 1);
    ctx.fillRect(x + 18, GROUND_Y + 12, 3, 1);
  }

  // Scenery boulders scattered along the ground.
  const rockOff = -camX;
  for (let x = ((rockOff % 90) + 90) % 90 - 90; x < VW + 90; x += 90) {
    const worldCol = Math.round(x + camX);
    const seed = ((worldCol * 733091) & 0xff) / 0xff;
    const bx = x + Math.floor(seed * 60);
    const size = 3 + Math.floor(seed * 3);
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(bx, GROUND_Y - size, size * 3, size);
    ctx.fillRect(bx + 1, GROUND_Y - size - 1, size * 3 - 2, 1);
    ctx.fillStyle = "#54585f";
    ctx.fillRect(bx + 1, GROUND_Y - size, 1, size - 1);
    ctx.fillStyle = "#1a1c1f";
    ctx.fillRect(bx, GROUND_Y - 1, size * 3, 1);
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(bx + size * 3 + 3, GROUND_Y - 2, 2, 2);
  }

  // Stalagmites rising from the floor.
  ctx.fillStyle = "#3a3d44";
  for (let x = ((-camX % 120) + 120) % 120 - 120; x < VW + 120; x += 120) {
    const bx = x + 40;
    ctx.fillRect(bx, GROUND_Y - 6, 8, 6);
    ctx.fillRect(bx + 1, GROUND_Y - 10, 6, 4);
    ctx.fillRect(bx + 2, GROUND_Y - 12, 4, 2);
    ctx.fillStyle = "#54585f";
    ctx.fillRect(bx + 2, GROUND_Y - 6, 2, 2);
    ctx.fillStyle = "#3a3d44";
  }

  // Subtle wall cracks along the mid-cave.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  const wallCrackOff = -Math.floor(camXf * 0.85);
  for (let x = ((wallCrackOff % 200) + 200) % 200 - 200; x < VW + 200; x += 200) {
    ctx.fillRect(x + 60, 70, 1, 24);
    ctx.fillRect(x + 61, 94, 1, 18);
    ctx.fillRect(x + 62, 112, 1, 14);
    ctx.fillRect(x + 140, 80, 1, 16);
    ctx.fillRect(x + 141, 96, 1, 20);
  }

  // ----- Exit portal ("way out") near the left side of the cave -----
  const exitSx = CAVE_EXIT_X - camX;
  if (exitSx > -60 && exitSx < VW + 60) {
    // Arch stones
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(exitSx - 18, GROUND_Y - 50, 36, 8);
    ctx.fillRect(exitSx - 22, GROUND_Y - 44, 6, 44);
    ctx.fillRect(exitSx + 16, GROUND_Y - 44, 6, 44);
    ctx.fillStyle = "#6a5238";
    ctx.fillRect(exitSx - 18, GROUND_Y - 50, 36, 2);
    // Warm doorway light
    const pulse = 0.6 + 0.4 * Math.sin(time * 2.5);
    const grad = ctx.createLinearGradient(0, GROUND_Y - 44, 0, GROUND_Y);
    grad.addColorStop(0, `rgba(255, 214, 128, ${0.85 * pulse})`);
    grad.addColorStop(1, `rgba(255, 160, 80, ${0.55 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(exitSx - 16, GROUND_Y - 44, 32, 44);
    // "EXIT" hint arrow bobbing above
    const bob = Math.round(Math.sin(time * 3) * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(exitSx - 4, GROUND_Y - 60 + bob, 8, 2);
    ctx.fillRect(exitSx - 2, GROUND_Y - 58 + bob, 4, 2);
    ctx.fillRect(exitSx - 1, GROUND_Y - 56 + bob, 2, 2);
  }
}

// Iron ore sprite — the EXACT image the user provided, loaded from CDN and
// drawn pixel-perfect (no reinterpretation).
let ironOreImg: HTMLImageElement | null = null;
if (typeof window !== "undefined") {
  ironOreImg = new Image();
  ironOreImg.src = ironOreAsset.url;
}

// Pixel-art ore chunk embedded on the cave floor.
function drawOre(ctx: CanvasRenderingContext2D, sx: number, groundY: number, kind: OreKind) {
  if (kind === "iron") {
    // Render the exact user-provided image, scaled to sprite size.
    const dw = 15;
    const dh = 24;
    const ox = sx - Math.floor(dw / 2);
    const oy = groundY - dh + 1;
    if (ironOreImg && ironOreImg.complete && ironOreImg.naturalWidth > 0) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ironOreImg, ox, oy, dw, dh);
      ctx.imageSmoothingEnabled = prev;
    }
    return;
  }

  // Rock base uses the new gray cave palette; ore cores keep their tint.
  const palette: Record<OreKind, { rock: string; core: string; hi: string; sparkle: string }> = {
    coal:   { rock: "#2f333a", core: "#0a0608", hi: "#4a4e56", sparkle: "#a0a5ad" },
    copper: { rock: "#2f333a", core: "#b46b3a", hi: "#e4a065", sparkle: "#fff0d0" },
    bronze: { rock: "#2f333a", core: "#8a6a3a", hi: "#d4a86a", sparkle: "#fff2c0" },
    iron:   { rock: "#2f333a", core: "#c46a2a", hi: "#ffa25a", sparkle: "#ffd8a8" },
  };
  const p = palette[kind];
  // Rocky base (12x10) sitting on the floor.
  ctx.fillStyle = p.rock;
  ctx.fillRect(sx - 8, groundY - 10, 16, 10);
  ctx.fillRect(sx - 6, groundY - 12, 12, 2);
  // Ore veins (core color pixels).
  ctx.fillStyle = p.core;
  ctx.fillRect(sx - 4, groundY - 9, 3, 2);
  ctx.fillRect(sx + 1, groundY - 7, 3, 2);
  ctx.fillRect(sx - 2, groundY - 4, 2, 2);
  ctx.fillRect(sx + 3, groundY - 3, 2, 2);
  // Highlights
  ctx.fillStyle = p.hi;
  ctx.fillRect(sx - 3, groundY - 9, 1, 1);
  ctx.fillRect(sx + 2, groundY - 7, 1, 1);
  ctx.fillRect(sx + 4, groundY - 3, 1, 1);
  // Cover previous sparkle pixels with the base rock color to remove shine
  ctx.fillStyle = p.rock;
  ctx.fillRect(sx - 6, groundY - 11, 1, 1);
  ctx.fillRect(sx + 5, groundY - 10, 1, 1);
}


// Stone barrier at the end of the cave — a stack of dark blocks.
function drawCaveWall(ctx: CanvasRenderingContext2D, sx: number, groundY: number) {
  const w = 26;
  const h = 60;
  ctx.fillStyle = "#2a2024";
  ctx.fillRect(sx - w / 2, groundY - h, w, h);
  // Brick rows
  ctx.fillStyle = "#1a1216";
  for (let y = groundY - h + 8; y < groundY; y += 10) {
    ctx.fillRect(sx - w / 2, y, w, 1);
  }
  for (let y = groundY - h; y < groundY; y += 10) {
    const off = ((y / 10) % 2 === 0) ? 0 : 6;
    ctx.fillRect(sx - w / 2 + off, y, 1, 10);
    ctx.fillRect(sx - w / 2 + off + 12, y, 1, 10);
  }
  // Highlights
  ctx.fillStyle = "#3a2e34";
  ctx.fillRect(sx - w / 2, groundY - h, w, 1);
  ctx.fillRect(sx - w / 2, groundY - h, 1, h);
}

// Entrance portal to cave level 2 — drawn where the wall used to be after
// the player breaks through with a copper pickaxe. Same silhouette as the
// wall so the transformation reads clearly, but with a dark passage
// through the middle and a faint blue-purple glow.
function drawCave2Portal(ctx: CanvasRenderingContext2D, sx: number, groundY: number, time: number) {
  const w = 30;
  const h = 62;
  // Broken stone frame around the passage.
  ctx.fillStyle = "#221820";
  ctx.fillRect(sx - w / 2, groundY - h, w, h);
  ctx.fillStyle = "#3a2830";
  ctx.fillRect(sx - w / 2, groundY - h, w, 2);
  ctx.fillRect(sx - w / 2, groundY - h, 2, h);
  ctx.fillRect(sx + w / 2 - 2, groundY - h, 2, h);
  // Rubble at the base
  ctx.fillStyle = "#4a3540";
  ctx.fillRect(sx - w / 2 - 4, groundY - 3, 6, 3);
  ctx.fillRect(sx + w / 2 - 2, groundY - 3, 6, 3);
  // Dark passage
  const px = sx - 8;
  const py = groundY - h + 6;
  const pw = 16;
  const ph = h - 10;
  ctx.fillStyle = "#050308";
  ctx.fillRect(px, py, pw, ph);
  // Cool pulsing glow at the mouth
  const pulse = 0.55 + 0.45 * Math.sin(time * 2);
  const grad = ctx.createLinearGradient(0, py, 0, groundY);
  grad.addColorStop(0, `rgba(90, 60, 180, ${0.35 * pulse})`);
  grad.addColorStop(1, `rgba(30, 20, 80, ${0.20 * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);
  // "↓" hint arrow bobbing above
  const bob = Math.round(Math.sin(time * 3) * 2);
  ctx.fillStyle = "#c8b8ff";
  ctx.fillRect(sx - 4, groundY - h - 10 + bob, 8, 2);
  ctx.fillRect(sx - 2, groundY - h - 8 + bob, 4, 2);
  ctx.fillRect(sx - 1, groundY - h - 6 + bob, 2, 2);
}

// Exit portal inside cave level 2 that returns the player to cave level 1.
function drawCave2ExitPortal(ctx: CanvasRenderingContext2D, sx: number, groundY: number, time: number) {
  // Arch frame — warm brown to match the level-1 exit style.
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(sx - 18, groundY - 50, 36, 8);
  ctx.fillRect(sx - 22, groundY - 44, 6, 44);
  ctx.fillRect(sx + 16, groundY - 44, 6, 44);
  ctx.fillStyle = "#6a5238";
  ctx.fillRect(sx - 18, groundY - 50, 36, 2);
  // Warm doorway light
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.5);
  const grad = ctx.createLinearGradient(0, groundY - 44, 0, groundY);
  grad.addColorStop(0, `rgba(255, 214, 128, ${0.85 * pulse})`);
  grad.addColorStop(1, `rgba(255, 160, 80, ${0.55 * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 16, groundY - 44, 32, 44);
  // "↑" hint arrow
  const bob = Math.round(Math.sin(time * 3) * 2);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(sx - 1, groundY - 60 + bob, 2, 2);
  ctx.fillRect(sx - 2, groundY - 58 + bob, 4, 2);
  ctx.fillRect(sx - 4, groundY - 56 + bob, 8, 2);
}




// Wall-mounted torch the player has hung inside the cave.
function drawWallTorch(ctx: CanvasRenderingContext2D, sx: number, groundY: number, time: number) {
  const baseY = groundY - 30;
  // wooden bracket
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(sx - 1, baseY, 2, 14);
  ctx.fillStyle = "#5a3418";
  ctx.fillRect(sx - 2, baseY + 10, 4, 2);
  // flame — 2-frame flicker
  const flick = Math.floor(time * 12) % 2 === 0;
  ctx.fillStyle = flick ? "#ff8a3a" : "#ffb84a";
  ctx.fillRect(sx - 2, baseY - 5, 4, 5);
  ctx.fillStyle = flick ? "#ffcf6a" : "#ffd88a";
  ctx.fillRect(sx - 1, baseY - 4, 2, 3);
  ctx.fillStyle = "#fff2c0";
  ctx.fillRect(sx, baseY - 3, 1, 1);
}

function drawHeldStone(ctx: CanvasRenderingContext2D, handX: number, handY: number, dir: 1 | -1) {
  const x = handX + (dir === 1 ? 1 : -4);
  const y = handY - 3;
  ctx.fillStyle = "#4a4a54";
  ctx.fillRect(x + 1, y, 3, 1);
  ctx.fillRect(x, y + 1, 5, 3);
  ctx.fillRect(x + 1, y + 4, 3, 1);
  ctx.fillStyle = "#8a8a94";
  ctx.fillRect(x + 1, y + 1, 3, 2);
  ctx.fillRect(x + 2, y + 3, 2, 1);
  ctx.fillStyle = "#b8b8c2";
  ctx.fillRect(x + 1, y + 1, 1, 1);
  ctx.fillRect(x + 3, y + 2, 1, 1);
}




function drawScene(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  _swimDepth: number,
  _onBeach: boolean,
  beachBg: HTMLImageElement | null,
  world: WorldRender,
  camXf: number = camX,
) {


  void _swimDepth; void _onBeach;
  const HORIZON = BIOME_HORIZON;
  const worldCenter = camX + VW / 2;

  // Coastness: 0 in the meadow, 1 when clearly at/past either beach.
  const coastFade = 220;
  const rCoast = Math.max(0, Math.min(1, (worldCenter - (BEACH_START - coastFade)) / coastFade));
  const lCoast = Math.max(0, Math.min(1, ((BEACH_LEFT_END + coastFade) - worldCenter) / coastFade));
  const coastness = Math.max(rCoast, lCoast);

  // ----- Sky: single smooth vertical gradient (top → horizon) -----
  // Fill down to GROUND_Y so the mid band (mountains/hills area) is always
  // repainted, even when those layers are faded out on the beach — otherwise
  // scrolling smears leftover palm/tree pixels across that strip.
  {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, biomeColor("skyTop", worldCenter));
    g.addColorStop(0.45, biomeColor("skyMid", worldCenter));
    g.addColorStop(0.78, biomeColor("skyLow", worldCenter));
    g.addColorStop(1, biomeColor("skyHorizon", worldCenter));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON);
    // Solid horizon-tinted band from HORIZON down to the water surface line
    // (WATER_LEVEL_Y). This covers the 20px strip below the old GROUND_Y that
    // sits above the ocean, otherwise residual pixels from previous frames
    // (palm trunks, grass) would smear there since nothing else repaints it.
    ctx.fillStyle = biomeColor("skyHorizon", worldCenter);
    ctx.fillRect(0, HORIZON, VW, WATER_LEVEL_Y - HORIZON);
  }

  // Warm sun with a soft halo (fades out on the beach — the bg image has its own)
  if (coastness < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - coastness;
    drawSun(ctx, 480, 44, time);
    ctx.restore();
  }

  // ----- Clouds: two parallax layers, both soft white -----
  ctx.save();
  ctx.globalAlpha = 1 - coastness * 0.7;
  drawClouds(ctx, camXf * 0.04 + time * 2, 18, "#ffffff", 5, 0);
  drawClouds(ctx, camXf * 0.08 + time * 3.5, 40, "#ffffff", 6, 1);
  drawClouds(ctx, camXf * 0.14 + time * 5 + 180, 72, "#f4f9fd", 5, 2);
  ctx.restore();

  // Distant birds
  drawSeagulls(ctx, camXf * 0.2 + time * 10, time);

  // ----- Distant mountain silhouettes (with biome-mixed color) -----
  if (coastness < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - coastness;
    drawMountains(
      ctx,
      camXf * 0.2,
      130,
      biomeColor("mountainBack", worldCenter),
      biomeColor("mountainFront", worldCenter),
    );
    drawHills(
      ctx,
      camXf * 0.45,
      190,
      biomeColor("hillBack", worldCenter),
      biomeColor("hillFront", worldCenter),
    );
    ctx.restore();
  }

  // ----- Procedural tropical horizon: distant animated ocean + pixel islands
  // (replaces the old baked backdrop image).
  if (coastness > 0) {
    drawTropicalHorizon(ctx, camXf, time, coastness);
  }
  void beachBg;

  // ----- Continuous ground with per-region grass + soil blending -----
  drawGround(ctx, camX);

  // ----- Beach + animated ocean on BOTH sides of the world -----
  _brokenPalmsFilter = world.brokenPalms;
  drawCoast(ctx, camX, time);
  _brokenPalmsFilter = null;

  // ----- Foreground props: skip anything inside either beach/ocean zone -----
  const props = getProps();
  for (const p of props) {
    if (p.x > BEACH_START - 20) continue;
    if (p.x < BEACH_LEFT_END + 20) continue;
    const sx = p.x - camX;
    if (sx < -80) continue;
    if (sx > VW + 80) break; // props are x-sorted; nothing else is visible
    const mix = biomeMix(p.x);
    if (mix < 0.35 && p.type === "mushroom") continue;
    if (mix > 0.65 && p.type === "flower") continue;
    // Skip foraged bushes/mushrooms/flowers/ferns (trees use their own set).
    if (p.type !== "tree" && world.pickedProps.has(`${p.type}:${p.x}`)) continue;
    if (p.type === "tree") {
      if (world.choppedTrees.has(p.x)) {
        if (world.visibleStumps.has(p.x)) {
          drawTreeStump(ctx, sx, GROUND_Y);
        }
        // else: stump has faded — bare ground until a seed is planted here
      } else {
        drawTree(ctx, sx, GROUND_Y, p.variant ?? 0);
      }
    }
    else if (p.type === "bush") drawBush(ctx, sx, GROUND_Y, p.variant ?? 0);
    else if (p.type === "flower") drawFlower(ctx, sx, GROUND_Y, p.variant ?? 0);
    else if (p.type === "rock") {
      if (world.minedRocks.has(p.x)) continue;
      drawRock(ctx, sx, GROUND_Y);
    }
    else if (p.type === "grass") drawGrassTuft(ctx, sx, GROUND_Y);
    else if (p.type === "mushroom") drawMushroom(ctx, sx, GROUND_Y, p.variant ?? 0);
    else if (p.type === "fern") drawFern(ctx, sx, GROUND_Y);
  }

  // ----- Extra rocks spawned by regeneration at random empty spots -----
  for (const r of world.extraRocks) {
    if (world.minedRocks.has(r.x)) continue;
    const sx = r.x - camX;
    if (sx < -80 || sx > VW + 80) continue;
    drawRock(ctx, sx, GROUND_Y);
  }

  // ----- Small collectible pebbles scattered on the grass -----
  const stones = getStones();
  const bob = Math.sin(time * 2) * 0.3;
  for (const st of stones) {
    if (world.takenStones.has(st.id)) continue;
    const sx = st.x - camX;
    if (sx < -8 || sx > VW + 8) continue;
    drawPickupStone(ctx, sx, GROUND_Y + bob, st.variant);
  }

  // ----- Pebbles dropped by broken rocks — pick up like seeded pebbles -----
  for (const p of world.groundPebbles) {
    const sx = p.x - camX;
    if (sx < -8 || sx > VW + 8) continue;
    drawPickupStone(ctx, sx, getGroundYAt(p.x) + bob, p.variant);
  }



  // ----- Dropped tree logs on the grass, waiting to be carried -----
  // Group entries sharing the same x so a re-dropped log piles on top
  // instead of z-fighting at the same pixel.
  const logPiles = new Map<number, number>();
  for (const log of world.groundLogs) {
    const sx = log.x - camX;
    if (sx < -12 || sx > VW + 12) continue;
    const stackIndex = logPiles.get(log.x) ?? 0;
    logPiles.set(log.x, stackIndex + 1);
    drawGroundLog(ctx, sx, GROUND_Y + beachSurfaceOffset(log.x), stackIndex);
  }

  // ----- Items dropped by the player from the hotbar (double-click discard).
  // Each is rendered as the item's 16×16 miniature, letterboxed to 12×12 so
  // it sits nicely on the ground next to logs/pebbles.
  for (const it of world.groundItems) {
    if (it.mode !== "world") continue;
    const sx = it.x - camX;
    if (sx < -12 || sx > VW + 12) continue;
    const img = getItemIconImage(it.kind);
    const gy = GROUND_Y + beachSurfaceOffset(it.x);
    // subtle shadow so items don't look pasted on
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(Math.round(sx) - 1, Math.round(gy) - 1, 14, 2);
    if (img) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round(sx) - 2, Math.round(gy - 12 + bob), 16, 16);
    } else {
      // Placeholder tile until the icon finishes loading.
      ctx.fillStyle = "#f4e9c1";
      ctx.fillRect(Math.round(sx), Math.round(gy - 10 + bob), 10, 10);
    }
  }


  // ----- Loose seeds on the grass, waiting to be picked up -----
  for (const seed of world.seeds) {
    const sx = seed.x - camX;
    if (sx < -8 || sx > VW + 8) continue;
    drawSeed(ctx, sx, getGroundYAt(seed.x) + bob);
  }

  // ----- Planted saplings & growing trees -----
  for (const pl of world.planted) {
    const sx = pl.x - camX;
    if (sx < -80 || sx > VW + 80) continue;
    const age = (world.now - pl.plantedAt) / 1000; // seconds
    if (age >= SAPLING_GROW_S) {
      drawTree(ctx, sx, GROUND_Y, pl.variant);
    } else {
      drawSapling(ctx, sx, GROUND_Y, Math.min(1, age / SAPLING_GROW_S));
    }
  }

  // ----- Extra palms planted by the player anywhere on the island -----
  for (const p of world.extraPalms) {
    const sx = p.wx - camX;
    if (sx < -40 || sx > VW + 40) continue;
    drawPalm(ctx, sx, GROUND_Y + beachSurfaceOffset(p.wx), p.variant);
  }

  drawButterflies(ctx, camX, time, BEACH_LEFT_END + 40, BEACH_START - 40);
}



// Renders the sandy beach fading in from the meadow and, past it, an
// animated ocean with rolling waves that grow deeper toward the horizon.
function drawCoast(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  drawCoastSide(ctx, camX, time, "right");
  drawCoastSide(ctx, camX, time, "left");
}

// Renders a beach + ocean on one side of the world.
// side="right": sand from BEACH_START..OCEAN_START, ocean from OCEAN_START..WORLD_W.
// side="left":  ocean from 0..OCEAN_LEFT_END, sand from OCEAN_LEFT_END..BEACH_LEFT_END.
function drawCoastSide(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  side: "left" | "right",
) {
  const H = VH - WATER_LEVEL_Y + GROUND_EXTRA;
  const rgba = (c: [number, number, number], a: number) =>
    `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
  const mixC = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];

  // Geometry per side. `sandStart` is where sand meets grass (fade line).
  // `shoreX` is where sand meets ocean. `depthRef` is the world-x at which
  // water is fully "deep" (used for horizontal depth ramp).
  const cfg = side === "right"
    ? {
        sandStart: BEACH_START,
        shoreX: OCEAN_START,
        oceanFrom: OCEAN_START,
        oceanTo: WORLD_W,
        depthDir: 1 as const, // deeper as wx grows
        depthRef: OCEAN_START,
      }
    : {
        sandStart: BEACH_LEFT_END, // grass→sand fade edge (right edge of left beach)
        shoreX: OCEAN_LEFT_END,
        oceanFrom: 0,
        oceanTo: OCEAN_LEFT_END,
        depthDir: -1 as const, // deeper as wx shrinks
        depthRef: OCEAN_LEFT_END,
      };

  // A column belongs to this coast (sand OR ocean seabed) once we're past the
  // grass edge on the correct side. The sloped sand doubles as underwater
  // seabed so there's no old flat ground under the sea.
  const inCoast = (wx: number) =>
    side === "right" ? wx >= cfg.sandStart - 10 : wx <= cfg.sandStart + 10;
  const sandFade = (wx: number) => {
    const fadeW = 90;
    if (side === "right") return Math.min(1, Math.max(0, (wx - cfg.sandStart) / fadeW));
    return Math.min(1, Math.max(0, (cfg.sandStart - wx) / fadeW));
  };

  // ---- Sloped sand: single diagonal surface from the grass edge down into
  // the ocean. Fills from the slope line to the bottom of the viewport so it
  // also serves as the seabed under the translucent water.
  for (let x = 0; x < VW; x++) {
    const wx = x + camX;
    if (!inCoast(wx)) continue;
    const t = sandFade(wx);
    const topY = GROUND_Y + beachSurfaceOffset(wx);
    ctx.fillStyle = `rgba(232,201,138,${t.toFixed(3)})`;
    ctx.fillRect(x, topY, 1, VH - topY + GROUND_EXTRA);
    ctx.fillStyle = `rgba(245,224,168,${(t * 0.95).toFixed(3)})`;
    ctx.fillRect(x, topY, 1, 2);
    ctx.fillStyle = `rgba(201,168,106,${(t * 0.8).toFixed(3)})`;
    ctx.fillRect(x, topY + 14, 1, 1);
    if ((wx * 7 + Math.floor(wx / 3)) % 11 === 0) {
      ctx.fillStyle = `rgba(166,135,90,${(t * 0.9).toFixed(3)})`;
      ctx.fillRect(x, topY + 6 + ((Math.abs(wx) * 5) % 6), 1, 1);
    }
  }

  // ---- Ocean band (surface at WATER_LEVEL_Y, painted translucent so the
  // sloped sand shows through as a seabed). ----
  const oceanScreenLo = Math.max(0, cfg.oceanFrom - camX);
  const oceanScreenHi = Math.min(VW, cfg.oceanTo - camX);
  const oceanVisible = oceanScreenHi > oceanScreenLo;
  if (!oceanVisible) {
    // Ocean off-screen: still draw beach scenery (palms) so they appear as
    // soon as the beach itself is in view, not only when the water is.
    drawBeachScenery(ctx, camX, side);
    return;
  }

  const shoreFadeW = 60;
  const depthOf = (wx: number) =>
    Math.min(1, Math.max(0, cfg.depthDir * (wx - cfg.depthRef) / 400));
  const shoreOf = (wx: number) =>
    Math.min(1, Math.max(0, cfg.depthDir * (wx - cfg.shoreX) / shoreFadeW));

  // One vertical gradient per column (strided) instead of a per-pixel double
  // loop — orders of magnitude fewer fillRect calls, kills the beach lag.
  const STRIDE = 2;
  const lo = Math.floor(oceanScreenLo);
  const hi = Math.ceil(oceanScreenHi);
  for (let x = lo; x < hi; x += STRIDE) {
    const wx = x + camX;
    const depthT = depthOf(wx);
    const shoreA = shoreOf(wx);
    const surface = mixC(WATER_SHALLOW, WATER_MID, depthT);
    const bottom = mixC(WATER_MID, WATER_DEEP, depthT);
    const a = 0.6 + 0.35 * shoreA;
    const g = ctx.createLinearGradient(0, WATER_LEVEL_Y, 0, WATER_LEVEL_Y + H);
    g.addColorStop(0, rgba(surface, a));
    g.addColorStop(1, rgba(bottom, a));
    ctx.fillStyle = g;
    ctx.fillRect(x, WATER_LEVEL_Y, STRIDE, H);
  }


  // ---- Animated wave crests on the water surface ----
  const waveTop = WATER_LEVEL_Y;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let x = Math.floor(oceanScreenLo); x < Math.ceil(oceanScreenHi); x += 2) {
    const wx = x + camX;
    const shoreA = shoreOf(wx);
    if (shoreA <= 0) continue;
    const y1 = Math.sin((wx * 0.11) + time * 2.2) * 1.2;
    const y2 = Math.sin((wx * 0.05) - time * 1.4) * 1.4;
    const y = Math.round(y1 + y2);
    if (((Math.abs(wx) + Math.floor(time * 30)) % 17) < 3) {
      ctx.fillRect(x, waveTop + y, 2, 1);
    }
  }
  ctx.fillStyle = "rgba(220,240,245,0.55)";
  for (let x = Math.floor(oceanScreenLo); x < Math.ceil(oceanScreenHi); x += 3) {
    const wx = x + camX;
    const depthT = Math.min(1, Math.max(0, cfg.depthDir * (wx - cfg.shoreX) / 200));
    if (depthT < 0.3) continue;
    const yBand = Math.floor(4 + Math.sin(wx * 0.07 + time * 1.1) * 2);
    if (((Math.abs(wx) * 3 + Math.floor(time * 20)) % 13) < 2) {
      ctx.fillRect(x, waveTop + yBand, 2, 1);
    }
  }

  // ---- Foamy shoreline breaking on the sand ----
  const foamPulse = 0.5 + 0.5 * Math.sin(time * 1.8);
  ctx.fillStyle = `rgba(255,255,255,${(0.55 + foamPulse * 0.35).toFixed(3)})`;
  const shoreScreenX = cfg.shoreX - camX;
  const foamLo = side === "right" ? shoreScreenX - 6 : shoreScreenX - 10;
  const foamHi = side === "right" ? shoreScreenX + 10 : shoreScreenX + 6;
  for (let x = Math.max(0, Math.floor(foamLo)); x < Math.min(VW, Math.ceil(foamHi)); x++) {
    const wx = x + camX;
    const jitter = ((Math.abs(wx) * 7) % 3) - 1;
    ctx.fillRect(x, waveTop + jitter, 1, 1);
  }

  // ---- Palm trees + beach decor along this side's sand strip ----
  drawBeachScenery(ctx, camX, side);
}

// Deterministic palm positions for one beach side. Shared between the
// renderer and the click handler so "break this palm" targets the exact
// visual tree.
export type PalmPos = { wx: number; variant: 0 | 1 | 2 | 3 };
export function getPalms(side: "left" | "right"): PalmPos[] {
  const palmOffsets = [30, 78, 125, 175, 225, 275, 325, 375, 425, 475, 525, 575];
  const out: PalmPos[] = palmOffsets.map((o, i) => ({
    wx: side === "right" ? BEACH_START + o : BEACH_LEFT_END - o,
    variant: (((i * 5 + (o >> 3)) % 4) as 0 | 1 | 2 | 3),
  }));
  return out.filter((p) => {
    if (side === "right" && p.wx > OCEAN_START - 20) return false;
    if (side === "left" && p.wx < OCEAN_LEFT_END + 20) return false;
    return true;
  });
}
// Set by drawScene each frame so drawBeachScenery can hide felled palms
// without changing every function signature in the render chain.
let _brokenPalmsFilter: Set<number> | null = null;

// Decorative palms, shells, starfish, driftwood and pebbles along the sand.
// Positions are deterministic (seeded by world-x) so they don't shift as the
// camera moves.
function drawBeachScenery(ctx: CanvasRenderingContext2D, camX: number, side: "left" | "right") {
  const palms = getPalms(side);
  for (const p of palms) {
    if (_brokenPalmsFilter && _brokenPalmsFilter.has(p.wx)) continue;
    const sx = p.wx - camX;
    if (sx < -40 || sx > VW + 40) continue;
    // Anchor the palm's base to the sloped beach surface so it descends
    // together with the sand instead of floating at the old ground line.
    drawPalm(ctx, sx, GROUND_Y + beachSurfaceOffset(p.wx), p.variant);
  }

  // Small decor items scattered on the sand
  type Decor = { wx: number; kind: "shell" | "shell2" | "star" | "drift" | "pebble" | "pebble2" };
  const decor: Decor[] = [];
  let seed = side === "right" ? 4711 : 8123;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const lo = side === "right" ? BEACH_START + 20 : OCEAN_LEFT_END + 10;
  const hi = side === "right" ? OCEAN_START - 10 : BEACH_LEFT_END - 20;
  for (let wx = lo; wx < hi; wx += 14 + Math.floor(rnd() * 18)) {
    const r = rnd();
    const kind: Decor["kind"] =
      r < 0.22 ? "shell" :
      r < 0.42 ? "shell2" :
      r < 0.55 ? "star" :
      r < 0.72 ? "drift" :
      r < 0.86 ? "pebble" : "pebble2";
    decor.push({ wx, kind });
  }
  for (const d of decor) {
    const sx = Math.floor(d.wx - camX);
    if (sx < -12 || sx > VW + 12) continue;
    const y = GROUND_Y + beachSurfaceOffset(d.wx) + 8 + ((d.wx * 3) % 10);
    switch (d.kind) {
      case "shell": {
        ctx.fillStyle = "#f4c9b0";
        ctx.fillRect(sx, y, 4, 2);
        ctx.fillRect(sx + 1, y - 1, 2, 1);
        ctx.fillStyle = "#d89882";
        ctx.fillRect(sx, y + 1, 1, 1);
        ctx.fillRect(sx + 3, y + 1, 1, 1);
        break;
      }
      case "shell2": {
        ctx.fillStyle = "#ffd9b8";
        ctx.fillRect(sx, y, 5, 1);
        ctx.fillRect(sx + 1, y + 1, 3, 1);
        ctx.fillStyle = "#b87a5a";
        ctx.fillRect(sx + 2, y, 1, 1);
        break;
      }
      case "star": {
        ctx.fillStyle = "#e88a4a";
        ctx.fillRect(sx + 2, y - 1, 1, 1);
        ctx.fillRect(sx + 1, y, 3, 1);
        ctx.fillRect(sx, y + 1, 5, 1);
        ctx.fillRect(sx + 1, y + 2, 1, 1);
        ctx.fillRect(sx + 3, y + 2, 1, 1);
        ctx.fillStyle = "#c66830";
        ctx.fillRect(sx + 2, y, 1, 1);
        break;
      }
      case "drift": {
        ctx.fillStyle = "#8a6a4a";
        ctx.fillRect(sx, y, 8, 2);
        ctx.fillStyle = "#6a4a2a";
        ctx.fillRect(sx, y + 1, 8, 1);
        ctx.fillStyle = "#a88860";
        ctx.fillRect(sx + 1, y, 1, 1);
        ctx.fillRect(sx + 5, y, 1, 1);
        break;
      }
      case "pebble": {
        ctx.fillStyle = "#c8b89a";
        ctx.fillRect(sx, y, 3, 1);
        ctx.fillRect(sx, y + 1, 2, 1);
        break;
      }
      case "pebble2": {
        ctx.fillStyle = "#9a8a6a";
        ctx.fillRect(sx, y, 2, 2);
        break;
      }
    }
  }

  // ---- Crabs scuttling back and forth along the sand ----
  const crabT = (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
  const lo2 = side === "right" ? BEACH_START + 30 : OCEAN_LEFT_END + 20;
  const hi2 = side === "right" ? OCEAN_START - 20 : BEACH_LEFT_END - 30;
  const CRAB_STEP = 110;
  for (let anchor = lo2; anchor < hi2; anchor += CRAB_STEP) {
    // Deterministic per-anchor jitter
    const s = Math.abs(Math.floor(anchor));
    const phase = ((s * 9301 + 49297) % 233280) / 233280;
    const range = 34 + ((s * 13) % 22);
    const speed = 0.6 + phase * 0.5;
    const swing = Math.sin(crabT * speed + phase * 6.283);
    const wx = anchor + swing * range;
    const sx = wx - camX;
    if (sx < -16 || sx > VW + 16) continue;
    const facing: 1 | -1 = Math.cos(crabT * speed + phase * 6.283) >= 0 ? 1 : -1;
    // Sit on the beach surface just above the sand line
    const y = GROUND_Y + beachSurfaceOffset(wx) + 4 + ((s * 3) % 3);
    const legPhase = Math.floor(crabT * 8 + phase * 4);
    drawCrab(ctx, sx, y, facing, legPhase);
  }
}


// Procedural ocean+islands horizon band drawn where the old beach backdrop
// image used to sit. Fills the strip between the sky horizon and the game's
// animated near-ocean with a distant animated sea and layered pixel islands.
function drawTropicalHorizon(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  coastness: number,
) {
  const bandTop = BIOME_HORIZON;
  const bandBottom = WATER_LEVEL_Y;
  const bandH = bandBottom - bandTop;
  if (bandH <= 0) return;

  ctx.save();
  ctx.globalAlpha = coastness;

  // Distant sea gradient
  const seaG = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
  seaG.addColorStop(0, "#89c9d8");
  seaG.addColorStop(0.5, "#4fa3c2");
  seaG.addColorStop(1, "#2c78a0");
  ctx.fillStyle = seaG;
  ctx.fillRect(0, bandTop, VW, bandH);

  // A soft brighter sun-glint line just below the horizon
  ctx.fillStyle = "rgba(255,240,200,0.35)";
  ctx.fillRect(0, bandTop + 2, VW, 1);

  // Animated distant wave dashes
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  const parallax = camX * 0.15;
  for (let x = 0; x < VW; x += 3) {
    const wx = x + parallax;
    const yBand = 6 + Math.floor(Math.sin(wx * 0.09 + time * 0.9) * 2);
    if (((Math.abs(Math.floor(wx)) * 3 + Math.floor(time * 12)) % 19) < 2) {
      ctx.fillRect(x, bandTop + yBand, 2, 1);
    }
  }
  ctx.fillStyle = "rgba(220,240,245,0.4)";
  for (let x = 0; x < VW; x += 4) {
    const wx = x + parallax * 1.4 + 40;
    const yBand = 14 + Math.floor(Math.sin(wx * 0.06 - time * 0.6) * 2);
    if (((Math.abs(Math.floor(wx)) * 5 + Math.floor(time * 8)) % 23) < 2) {
      ctx.fillRect(x, bandTop + yBand, 2, 1);
    }
  }

  // Pixel islands — two parallax layers so the horizon feels deep.
  drawTropicalIslands(ctx, camX * 0.18, bandTop, 0.55, 0.75);
  drawTropicalIslands(ctx, camX * 0.32 + 137, bandTop, 1.0, 1.0);

  ctx.restore();
}

// Deterministic island silhouettes on a horizontal band. `scale` controls
// island size, `alpha` controls how solid they appear (further islands are
// hazier).
function drawTropicalIslands(
  ctx: CanvasRenderingContext2D,
  offset: number,
  horizonY: number,
  scale: number,
  alpha: number,
) {
  const period = 260;
  const startWx = Math.floor(offset / period) * period - period;
  for (let wx = startWx; wx < offset + VW + period; wx += period) {
    const seed = Math.abs(Math.floor(wx / period)) * 9301 + 49297;
    const r = ((seed % 233280) / 233280);
    const r2 = (((seed * 3) % 233280) / 233280);
    const r3 = (((seed * 7) % 233280) / 233280);
    const cx = Math.floor(wx - offset + r * 80);
    const w = Math.floor((60 + r2 * 90) * scale);
    const h = Math.floor((10 + r3 * 16) * scale);
    // Skip narrow bounds
    if (cx + w < -20 || cx - w > VW + 20) continue;

    // Sand base (thin light strip at waterline)
    ctx.fillStyle = `rgba(232,201,138,${alpha.toFixed(3)})`;
    ctx.fillRect(cx - w, horizonY + 1, w * 2, 2);

    // Jungle silhouette — layered rounded humps
    const jungleDark = `rgba(28,90,60,${alpha.toFixed(3)})`;
    const jungleMid = `rgba(52,124,78,${alpha.toFixed(3)})`;
    const jungleLight = `rgba(96,164,102,${(alpha * 0.9).toFixed(3)})`;

    ctx.fillStyle = jungleDark;
    for (let i = -w; i < w; i++) {
      const t = i / w; // -1..1
      const bulge = Math.sqrt(Math.max(0, 1 - t * t)); // half ellipse
      const jitter = Math.sin(i * 0.35 + seed * 0.01) * 1.2;
      const top = Math.floor(horizonY + 1 - bulge * h - jitter);
      ctx.fillRect(cx + i, top, 1, horizonY + 1 - top);
    }
    // Mid tone (smaller inner blob)
    ctx.fillStyle = jungleMid;
    const w2 = Math.floor(w * 0.75);
    const h2 = Math.floor(h * 0.75);
    for (let i = -w2; i < w2; i++) {
      const t = i / w2;
      const bulge = Math.sqrt(Math.max(0, 1 - t * t));
      const jitter = Math.sin(i * 0.5 + seed * 0.02) * 1;
      const top = Math.floor(horizonY - bulge * h2 - jitter);
      ctx.fillRect(cx + i, top, 1, horizonY - top);
    }
    // A few palm tuft highlights
    ctx.fillStyle = jungleLight;
    for (let k = 0; k < 3; k++) {
      const px = cx + Math.floor((k - 1) * w * 0.4);
      const py = horizonY - h + 1 + ((seed + k * 13) % 3);
      ctx.fillRect(px, py, 2, 1);
      ctx.fillRect(px - 1, py + 1, 1, 1);
      ctx.fillRect(px + 2, py + 1, 1, 1);
    }
  }
}

// Tiny decorative crab that scuttles left/right along the sand. Position
// oscillates around a deterministic anchor world-x so crabs never leave
// their beach segment.
function drawCrab(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  y: number,
  facing: 1 | -1,
  legPhase: number,
) {
  const x = Math.floor(screenX);
  // Shell
  ctx.fillStyle = "#c8341f";
  ctx.fillRect(x + 1, y, 5, 3);
  ctx.fillRect(x, y + 1, 7, 2);
  // Shell highlight
  ctx.fillStyle = "#e85a3a";
  ctx.fillRect(x + 2, y, 3, 1);
  ctx.fillRect(x + 1, y + 1, 1, 1);
  // Shell shadow
  ctx.fillStyle = "#8a1a0a";
  ctx.fillRect(x, y + 2, 7, 1);
  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 2, y - 1, 1, 1);
  ctx.fillRect(x + 4, y - 1, 1, 1);
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + 2, y - 1, 1, 1);
  ctx.fillRect(x + 4, y - 1, 1, 1);
  // Claws (face the direction of motion)
  ctx.fillStyle = "#c8341f";
  const clawL = facing === 1 ? x + 6 : x - 2;
  const clawR = facing === 1 ? x - 2 : x + 6;
  ctx.fillRect(clawL, y, 2, 2);
  ctx.fillRect(clawR, y + 1, 2, 1);
  // Legs animate up/down with legPhase
  ctx.fillStyle = "#8a1a0a";
  const legOff = (legPhase & 1) === 0 ? 0 : 1;
  ctx.fillRect(x + 1, y + 3 + legOff, 1, 1);
  ctx.fillRect(x + 3, y + 3 + (1 - legOff), 1, 1);
  ctx.fillRect(x + 5, y + 3 + legOff, 1, 1);
}





// Fills the ground from GROUND_Y to VH with a horizontal biome gradient
// (grass top strip → grass body → soil → deep soil). Because both palettes
// use the same layer heights, the transition zone reads as one continuous
// terrain that shifts hues rather than two touching regions.
function drawGround(ctx: CanvasRenderingContext2D, camX: number) {
  const H = VH - GROUND_Y + GROUND_EXTRA;
  // Clip the forest ground to the inland zone (plus the 90px sand-fade band
  // on each side) so the translucent sand blends over real grass instead of
  // the bare horizon color.
  const FADE = 90;
  const forestLo = BEACH_LEFT_END - FADE;
  const forestHi = BEACH_START + FADE;
  const forestScreenLo = Math.max(0, forestLo - camX);
  const forestScreenHi = Math.min(VW, forestHi - camX);
  if (forestScreenHi <= forestScreenLo) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(forestScreenLo, GROUND_Y, forestScreenHi - forestScreenLo, H);
  ctx.clip();

  bandGradient(ctx, "soilDeep", camX, GROUND_Y + 8, H - 8);
  bandGradient(ctx, "soil", camX, GROUND_Y + 4, 18);
  bandGradient(ctx, "grass", camX, GROUND_Y, 6);
  bandGradient(ctx, "grassTop", camX, GROUND_Y, 2);

  for (let x = 0; x < VW; x += 12) {
    const wx = x + camX;
    if (wx < forestLo || wx > forestHi) continue;
    const mix = biomeMix(wx);
    const tuft = mixHex(BIOME_A.grass, BIOME_B.grass, mix);
    ctx.fillStyle = tuft;
    const jitter = ((wx * 3) % 5) - 2;
    ctx.fillRect(x + ((wx * 7) % 6), GROUND_Y + 3, 3, 1);
    ctx.fillRect(x + ((wx * 11) % 8), GROUND_Y + 4 + jitter, 4, 1);
  }
  ctx.restore();
}


function drawDistantIslands(ctx: CanvasRenderingContext2D, offset: number, horizonY: number) {
  const isles: [number, number, number][] = [
    // [worldX, width, height]
    [80, 60, 6], [280, 90, 8], [500, 40, 5], [720, 110, 9], [950, 70, 7],
  ];
  ctx.fillStyle = "#6a7a9a";
  for (const [ix, w, h] of isles) {
    const x = ((ix - offset) % 1100 + 1100) % 1100 - 100;
    // Rounded island silhouette using stacked bars
    for (let s = 0; s < h; s++) {
      const bw = w - s * 4;
      if (bw <= 0) break;
      ctx.fillRect(x + (w - bw) / 2, horizonY - s - 1, bw, 1);
    }
  }
  // Palms hint (tiny dots) on the tallest one
  ctx.fillStyle = "#3a5a4a";
  const x2 = ((720 - offset) % 1100 + 1100) % 1100 - 100;
  ctx.fillRect(x2 + 40, horizonY - 12, 1, 3);
  ctx.fillRect(x2 + 62, horizonY - 11, 1, 3);
}

type Prop = {
  x: number;
  type: "tree" | "bush" | "flower" | "rock" | "grass" | "mushroom" | "fern";
  variant?: number;
};
// World seed drives prop / stone scatter so each save slot generates a
// distinct island layout. Callers set it via setWorldSeed() before the
// first getProps()/getStones() call for that world.
let _worldSeed = 1337;
let _propsCache: Prop[] | null = null;
let _stonesCache: Stone[] | null = null;
export function setWorldSeed(seed: number) {
  const next = (seed >>> 0) || 1;
  if (next === _worldSeed && _propsCache && _stonesCache) return;
  _worldSeed = next;
  _propsCache = null;
  _stonesCache = null;
}
function getProps(): Prop[] {
  if (_propsCache) return _propsCache;
  const arr: Prop[] = [];
  let seed = _worldSeed;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  // Keep a clear zone around the cave entrance so no plants/props spawn inside
  // or within 5 px of it.
  const _spawnX = Math.floor((ISLAND_LEFT + ISLAND_RIGHT) / 2 - SPRITE_W / 2);
  const caveX = computeCaveEntranceX(_worldSeed, _spawnX);
  for (let x = 40; x < WORLD_W - 40; x += 10 + Math.floor(rand() * 16)) {
    const r = rand();
    if (Math.abs(x - caveX) <= CAVE_ENTRANCE_CLEAR) continue;
    if (r < 0.16) arr.push({ x, type: "tree", variant: Math.floor(rand() * 6) });
    else if (r < 0.28) arr.push({ x, type: "bush", variant: Math.floor(rand() * 5) });
    else if (r < 0.46) arr.push({ x, type: "flower", variant: Math.floor(rand() * 4) });
    else if (r < 0.52) arr.push({ x, type: "rock" });
    else if (r < 0.60) arr.push({ x, type: "mushroom", variant: Math.floor(rand() * 2) });
    else if (r < 0.66) arr.push({ x, type: "fern" });
    else arr.push({ x, type: "grass" });
  }
  _propsCache = arr;
  return arr;
}

// ---- Collectible pebbles (scatter across the grassland, seeded per world) ----
export type Stone = { id: number; x: number; variant: number };
export function getStones(): Stone[] {
  if (_stonesCache) return _stonesCache;
  const arr: Stone[] = [];
  // Mix in a constant so the pebble stream diverges from the prop stream
  // even though both start from the same world seed.
  let seed = (_worldSeed ^ 0x9e3779b1) >>> 0 || 1;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const lo = BEACH_LEFT_END + 40;
  const hi = BEACH_START - 40;
  let id = 0;
  for (let x = lo; x < hi; x += 80 + Math.floor(rand() * 90)) {
    const px = Math.round(x + rand() * 30 - 15);
    if (px < lo || px > hi) continue;
    arr.push({ id: id++, x: px, variant: Math.floor(rand() * 4) });
  }
  _stonesCache = arr;
  return arr;
}

// Find a random empty spot along the grassland to respawn a big rock.
// Avoids existing props, extra rocks, blueprints, buildings, and the
// cave-entrance clear zone. Returns null if no spot found after N tries.
export function findEmptyRockSpot(
  props: Prop[],
  extraRocks: { x: number }[],
  blueprints: { x: number }[],
  built: { x: number }[],
  minedRocks: Map<number, number>,
  caveX: number,
): number | null {
  const lo = BEACH_LEFT_END + 40;
  const hi = BEACH_START - 40;
  const MIN_DIST = 28;
  for (let i = 0; i < 40; i++) {
    const x = Math.round(lo + Math.random() * (hi - lo));
    if (Math.abs(x - caveX) <= CAVE_ENTRANCE_CLEAR + 10) continue;
    let ok = true;
    for (const p of props) {
      if (Math.abs(p.x - x) < MIN_DIST) { ok = false; break; }
    }
    if (!ok) continue;
    for (const r of extraRocks) {
      if (Math.abs(r.x - x) < MIN_DIST) { ok = false; break; }
    }
    if (!ok) continue;
    for (const b of blueprints) {
      if (Math.abs(b.x - x) < MIN_DIST) { ok = false; break; }
    }
    if (!ok) continue;
    for (const b of built) {
      if (Math.abs(b.x - x) < MIN_DIST) { ok = false; break; }
    }
    if (!ok) continue;
    if (minedRocks.has(x)) continue;
    return x;
  }
  return null;
}





function drawPickupStone(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  variant: number = 0,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  const body = "#8a8a94";
  const hi = "#b8b8c2";
  const dark = "#4a4a54";
  const shadow = "rgba(0,0,0,0.25)";
  const sparkle = "rgba(255,240,180,0.9)";

  if (variant === 1) {
    // Wide flat river stone
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 1, y - 1, 8, 1);
    ctx.fillStyle = body;
    ctx.fillRect(x, y - 3, 6, 2);
    ctx.fillRect(x + 1, y - 4, 4, 1);
    ctx.fillStyle = hi;
    ctx.fillRect(x + 2, y - 4, 2, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(x, y - 2, 6, 1);
    ctx.fillStyle = sparkle;
    ctx.fillRect(x + 4, y - 4, 1, 1);
    return;
  }
  if (variant === 2) {
    // Tall angular chunk
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 1, y - 1, 6, 1);
    ctx.fillStyle = body;
    ctx.fillRect(x, y - 5, 4, 4);
    ctx.fillRect(x + 1, y - 6, 2, 1);
    ctx.fillStyle = hi;
    ctx.fillRect(x, y - 5, 1, 3);
    ctx.fillRect(x + 1, y - 6, 1, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(x, y - 2, 4, 1);
    ctx.fillRect(x + 3, y - 4, 1, 2);
    ctx.fillStyle = sparkle;
    ctx.fillRect(x + 2, y - 6, 1, 1);
    return;
  }
  if (variant === 3) {
    // Twin pebble pair
    ctx.fillStyle = shadow;
    ctx.fillRect(x - 1, y - 1, 8, 1);
    ctx.fillStyle = body;
    ctx.fillRect(x, y - 3, 3, 2);
    ctx.fillRect(x + 3, y - 4, 4, 3);
    ctx.fillRect(x + 4, y - 5, 2, 1);
    ctx.fillStyle = hi;
    ctx.fillRect(x, y - 3, 1, 1);
    ctx.fillRect(x + 4, y - 4, 1, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(x, y - 2, 3, 1);
    ctx.fillRect(x + 3, y - 2, 4, 1);
    ctx.fillStyle = sparkle;
    ctx.fillRect(x + 5, y - 5, 1, 1);
    return;
  }
  // variant 0 — classic small pebble
  ctx.fillStyle = shadow;
  ctx.fillRect(x - 1, y - 1, 6, 1);
  ctx.fillStyle = body;
  ctx.fillRect(x, y - 4, 4, 3);
  ctx.fillRect(x + 1, y - 5, 2, 1);
  ctx.fillStyle = hi;
  ctx.fillRect(x + 1, y - 4, 1, 1);
  ctx.fillRect(x + 2, y - 5, 1, 1);
  ctx.fillStyle = dark;
  ctx.fillRect(x, y - 2, 4, 1);
  ctx.fillStyle = sparkle;
  ctx.fillRect(x + 3, y - 6, 1, 1);
}

// ----- Regeneration / growth timing (ms & s) -----
const STONE_RESPAWN_MS = 60_000;
const STUMP_LIFESPAN_MS = 45_000;
const SAPLING_GROW_S = 60; // seconds from seed to mature tree

function drawSeed(ctx: CanvasRenderingContext2D, sx: number, groundY: number) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x, y - 1, 4, 1);
  ctx.fillStyle = "#6b4a1e";
  ctx.fillRect(x, y - 3, 4, 2);
  ctx.fillStyle = "#8f6a34";
  ctx.fillRect(x + 1, y - 3, 2, 1);
  // little green sprout tip so players spot them
  ctx.fillStyle = "#88c650";
  ctx.fillRect(x + 1, y - 4, 1, 1);
  ctx.fillRect(x + 2, y - 5, 1, 1);
}

function drawSapling(
  ctx: CanvasRenderingContext2D,
  sx: number,
  groundY: number,
  progress: number,
) {
  const x = Math.round(sx);
  const y = Math.round(groundY);
  // Grow the stem taller and add a small crown as progress -> 1.
  const stemH = Math.max(3, Math.round(3 + progress * 14));
  const crownR = Math.max(2, Math.round(2 + progress * 5));
  // stem
  ctx.fillStyle = "#5b3a1a";
  ctx.fillRect(x + 12, y - stemH, 2, stemH);
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(x + 12, y - stemH, 1, stemH);
  // canopy (a tiny pixel puff)
  ctx.fillStyle = "#294f2e";
  ctx.fillRect(x + 12 - crownR, y - stemH - crownR, crownR * 2 + 2, crownR + 1);
  ctx.fillStyle = "#3d6b3a";
  ctx.fillRect(x + 12 - crownR + 1, y - stemH - crownR + 1, crownR * 2, crownR - 1);
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x + 10, y, 6, 1);
}

function drawGroundLog(ctx: CanvasRenderingContext2D, sx: number, groundY: number, stackIndex: number = 0) {

  const x = Math.round(sx);
  // Each higher log in a stack rises 3 px so a pile reads clearly.
  const y = Math.round(groundY) - stackIndex * 3;
  // shadow (only for the ground-level log)
  if (stackIndex === 0) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x, Math.round(groundY), 10, 1);
  }
  // horizontal log body
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(x, y - 3, 10, 3);
  // top highlight
  ctx.fillStyle = "#a06a34";
  ctx.fillRect(x + 1, y - 3, 8, 1);
  // bottom shadow band
  ctx.fillStyle = "#5f3a1c";
  ctx.fillRect(x, y - 1, 10, 1);
  // dark caps (ring ends)
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x, y - 3, 1, 3);
  ctx.fillRect(x + 9, y - 3, 1, 3);
  // knot
  ctx.fillStyle = "#4a2a12";
  ctx.fillRect(x + 4, y - 2, 1, 1);
}






function drawTreeStump(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  // low stump left behind after a tree is chopped
  ctx.fillStyle = "#4a2a12";
  ctx.fillRect(x + 9, groundY - 6, 8, 6);
  ctx.fillStyle = "#5f3a1c";
  ctx.fillRect(x + 9, groundY - 6, 8, 1);
  // rings
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(x + 11, groundY - 5, 4, 1);
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x + 12, groundY - 4, 2, 1);
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x + 8, groundY, 10, 1);
}

function drawMountains(ctx: CanvasRenderingContext2D, offset: number, baseY: number, back: string, front: string) {
  const width = 160;
  // Deterministic variety per index — no repeating silhouettes
  const rng = (i: number, seed: number) => {
    const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  // (Removed full-width haze band — it painted a visible gray stripe across
  // the sky above the ridges. Ridge shading below handles the soft blend.)

  // ----- BACK RIDGE — varied peaks, snow caps, subtle shadow ridges -----
  for (let i = -2; i < Math.ceil(VW / width) + 2; i++) {
    const bx = Math.floor(i * width - (offset % width));
    // Two peaks per tile so the range never looks like a comb
    const peaks: [number, number, number][] = [
      // [offX, peakH, peakW]
      [Math.floor(width * 0.25), 54 + Math.floor(rng(i, 1) * 22), 96 + Math.floor(rng(i, 3) * 24)],
      [Math.floor(width * 0.7), 44 + Math.floor(rng(i, 2) * 26), 84 + Math.floor(rng(i, 4) * 26)],
    ];
    for (const [ox, ph, pw] of peaks) {
      for (let s = 0; s < ph; s++) {
        const w = Math.min(pw, 4 + Math.floor(s * (pw / ph)));
        ctx.fillStyle = back;
        ctx.fillRect(bx + ox - w / 2, baseY + (60 - ph) + s, w, 1);
      }
      // Soft ridge shading (subtle, no harsh dark line)
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let s = 3; s < ph - 2; s++) {
        const w = Math.min(pw, 4 + Math.floor(s * (pw / ph)));
        ctx.fillRect(bx + ox - w / 2, baseY + (60 - ph) + s, 1, 1);
      }
      // Snow cap
      ctx.fillStyle = "#f0f4fa";
      const cy = baseY + (60 - ph);
      ctx.fillRect(bx + ox - 3, cy, 6, 2);
      ctx.fillRect(bx + ox - 5, cy + 2, 4, 2);
      ctx.fillRect(bx + ox + 1, cy + 2, 4, 2);
      ctx.fillRect(bx + ox - 7, cy + 5, 3, 1);
      ctx.fillRect(bx + ox + 4, cy + 5, 3, 1);
    }
  }

  // ----- FRONT RIDGE — rolling foothills, no snow, softer -----
  for (let i = -2; i < Math.ceil(VW / width) + 2; i++) {
    const bx = Math.floor(i * width - (offset % width)) + 80;
    const ph = 34 + Math.floor(rng(i, 7) * 18);
    const pw = 110 + Math.floor(rng(i, 9) * 30);
    for (let s = 0; s < ph; s++) {
      const w = Math.min(pw, 4 + Math.floor(s * (pw / ph)));
      ctx.fillStyle = front;
      ctx.fillRect(bx - w / 2, baseY + (60 - ph) + 26 + s, w, 1);
    }
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let s = 2; s < ph - 2; s++) {
      const w = Math.min(pw, 4 + Math.floor(s * (pw / ph)));
      ctx.fillRect(bx - w / 2, baseY + (60 - ph) + 26 + s, 1, 1);
    }
    // A dusting of trees on the shoulder to sell scale
    ctx.fillStyle = "#233d30";
    for (let k = 0; k < 4; k++) {
      const tx = bx - pw / 3 + k * (pw / 6) + Math.floor(rng(i * 5 + k, 11) * 6 - 3);
      const ty = baseY + (60 - ph) + 26 + Math.floor(ph * 0.65);
      ctx.fillRect(tx, ty - 3, 1, 3);
      ctx.fillRect(tx - 1, ty - 1, 3, 1);
    }
  }
}

function drawHills(ctx: CanvasRenderingContext2D, offset: number, baseY: number, back: string, front: string) {
  // Back hills — big rolling waves + dappled shading
  const period = 92;
  for (let x = 0; x < VW; x++) {
    const wx = x + offset;
    const h = 24 + Math.floor(Math.sin(wx / period) * 12 + Math.sin(wx / 37) * 5 + Math.sin(wx / 19) * 2);
    ctx.fillStyle = back;
    ctx.fillRect(x, baseY - h, 1, GROUND_Y - (baseY - h));
    // Sunlit crown
    if ((wx * 3 + Math.floor(Math.sin(wx / 11) * 2)) % 7 === 0) {
      ctx.fillStyle = "#6bb26a";
      ctx.fillRect(x, baseY - h, 1, 2);
    }
  }
  // Front hills — lower, richer green, occasional shadow pockets
  for (let x = 0; x < VW; x++) {
    const wx = x + offset + 40;
    const h = 16 + Math.floor(Math.sin(wx / 61) * 8 + Math.sin(wx / 23) * 4);
    ctx.fillStyle = front;
    ctx.fillRect(x, baseY + 6 - h, 1, GROUND_Y - (baseY + 6 - h));
    if ((wx * 5) % 17 === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(x, baseY + 6 - h + 3, 1, 3);
    }
  }
}

function drawTreeLine(ctx: CanvasRenderingContext2D, offset: number, baseY: number, color: string) {
  // Deterministic per-tree variety: two silhouettes (conifer + rounded oak),
  // varied heights, dappled highlights, slight offset per row.
  const highlight = "#3a6a3a";
  const highlight2 = "#5aa04a";
  const trunkColor = "#3a2210";
  const step = 11;
  for (let i = -2; i < Math.ceil(VW / step) + 2; i++) {
    const bx = Math.floor(i * step - (offset % step));
    const kind = (i * 7 + Math.floor(offset / 30)) % 3;
    const jitter = ((i * 13) % 4) - 2; // slight y-jitter so it's not perfectly aligned

    if (kind === 0) {
      // Rounded broadleaf (oak-ish)
      const rr = 6 + ((i * 5) % 3);
      const cx = bx + 6;
      const cy = baseY - rr - 2 + jitter;
      // circular canopy
      for (let dy = -rr; dy <= rr; dy++) {
        const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
        ctx.fillStyle = color;
        ctx.fillRect(cx - w, cy + dy, w * 2, 1);
      }
      // dappled highlights
      ctx.fillStyle = highlight2;
      ctx.fillRect(cx - 3, cy - 2, 2, 1);
      ctx.fillRect(cx + 1, cy - 1, 2, 1);
      ctx.fillRect(cx - 4, cy + 1, 1, 1);
      // trunk
      ctx.fillStyle = trunkColor;
      ctx.fillRect(cx - 1, baseY - 2 + jitter, 2, 4);
    } else {
      // Conifer — narrow at top, wide at bottom, with tiered notches
      const h = 26 + ((i * 37) % 14) + (kind === 2 ? 6 : 0);
      for (let s = 0; s < h; s++) {
        const w = Math.max(2, 2 + Math.floor((s / h) * 12));
        ctx.fillStyle = color;
        ctx.fillRect(bx + (14 - w) / 2, baseY - h + s + jitter, w, 1);
        if (s > 2 && s < h - 1 && (s % 2 === 0)) {
          ctx.fillStyle = highlight;
          ctx.fillRect(bx + (14 - w) / 2, baseY - h + s + jitter, 1, 1);
        }
      }
      // Tiny top glint
      ctx.fillStyle = highlight2;
      ctx.fillRect(bx + 6, baseY - h + 1 + jitter, 1, 2);
      // trunk
      ctx.fillStyle = trunkColor;
      ctx.fillRect(bx + 6, baseY - 2 + jitter, 2, 4);
    }
  }
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  offset: number,
  baseY: number = 30,
  color: string = "#fff6e0",
  h: number = 6,
  variantSeed: number = 0,
) {
  // Each entry: [x-offset, y-offset, width, shape, scale]
  // Shapes: 0 = fluffy 3-stack, 1 = long wisp, 2 = double-clump, 3 = tall puff, 4 = tiny.
  const banks: Array<Array<[number, number, number, number, number]>> = [
    [
      [30, 0, 26, 0, 1.0], [140, -8, 34, 2, 1.5], [260, 18, 22, 4, 0.6],
      [380, -2, 30, 0, 1.2], [500, 14, 28, 1, 1.8], [620, 4, 24, 3, 0.9],
      [760, -6, 36, 2, 1.3], [900, 10, 20, 4, 0.5],
    ],
    [
      [60, 6, 40, 1, 2.0], [200, -4, 22, 3, 0.7], [320, 12, 32, 2, 1.4],
      [440, 0, 26, 0, 1.1], [580, -10, 30, 0, 1.6], [700, 8, 18, 4, 0.5],
      [820, 16, 34, 2, 1.2], [960, -2, 24, 3, 0.8],
    ],
    [
      [90, -4, 20, 4, 0.5], [230, 10, 28, 0, 1.3], [360, -8, 42, 1, 2.1],
      [500, 6, 24, 3, 0.8], [640, 14, 30, 2, 1.5], [780, -2, 26, 0, 1.0],
      [920, 4, 36, 1, 1.7], [1050, 12, 22, 4, 0.6],
    ],
  ];
  const clouds = banks[((variantSeed % banks.length) + banks.length) % banks.length];
  ctx.fillStyle = color;
  const wrap = VW + 200;
  for (const entry of clouds) {
    const [cx, cyOff, wBase, shape, scale = 1] = entry;
    const w = Math.max(6, Math.round(wBase * scale));
    const ch = Math.max(3, Math.round(h * scale));
    const cy = baseY + cyOff;
    const x = ((cx - offset) % wrap + wrap) % wrap - 100;
    if (x > VW + 40 || x + w < -40) continue;
    const halfH = Math.max(1, Math.floor(ch / 2));
    if (shape === 0) {
      // fluffy 3-stack
      ctx.fillRect(x, cy, w, ch);
      ctx.fillRect(x + 4, cy - halfH, w - 8, halfH);
      ctx.fillRect(x + 6, cy + ch, w - 12, halfH);
    } else if (shape === 1) {
      // long wisp
      ctx.fillRect(x, cy + halfH, w, Math.max(2, ch - 2));
      ctx.fillRect(x + 6, cy, w - 12, halfH);
    } else if (shape === 2) {
      // double clump
      const half = Math.floor(w / 2);
      ctx.fillRect(x, cy, half - 2, ch);
      ctx.fillRect(x + half + 2, cy - 1, half - 2, ch);
      ctx.fillRect(x + 3, cy - halfH, half - 8, halfH);
      ctx.fillRect(x + half + 4, cy + ch, half - 8, halfH);
    } else if (shape === 3) {
      // tall puff
      ctx.fillRect(x + 2, cy - halfH, w - 4, halfH);
      ctx.fillRect(x, cy, w, ch);
      ctx.fillRect(x + 4, cy + ch, w - 8, halfH);
      ctx.fillRect(x + 8, cy - ch, w - 16, halfH);
    } else {
      // tiny puff
      ctx.fillRect(x, cy, w, halfH);
      ctx.fillRect(x + 2, cy - 1, w - 4, 1);
    }
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, groundY: number, variant: number) {
  const v = ((variant % 6) + 6) % 6;
  const trunkH = 22 + (variant % 3) * 4;

  // Trunk color varies per variant so birch etc read differently.
  let trunkDark = "#4a2a12";
  let trunkLight = "#5f3a1c";
  if (v === 4) { trunkDark = "#d8d2c0"; trunkLight = "#f2ecd8"; } // birch pale bark
  if (v === 1) { trunkDark = "#3a2010"; trunkLight = "#54331a"; } // conifer darker
  ctx.fillStyle = trunkDark;
  ctx.fillRect(x + 10, groundY - trunkH, 6, trunkH);
  ctx.fillStyle = trunkLight;
  ctx.fillRect(x + 10, groundY - trunkH, 2, trunkH);
  // Birch has small dark bark speckles
  if (v === 4) {
    ctx.fillStyle = "#2b2620";
    ctx.fillRect(x + 12, groundY - trunkH + 4, 3, 1);
    ctx.fillRect(x + 10, groundY - trunkH + 12, 2, 1);
    ctx.fillRect(x + 13, groundY - trunkH + 18, 2, 1);
  }

  const fx = x - 2;
  const fy = groundY - trunkH - 26;

  if (v === 0) {
    // Classic oak — rounded blob canopy.
    ctx.fillStyle = "#2f5a24";
    ctx.fillRect(fx + 4, fy + 6, 22, 20);
    ctx.fillRect(fx + 8, fy, 14, 10);
    ctx.fillRect(fx, fy + 12, 8, 10);
    ctx.fillRect(fx + 22, fy + 12, 8, 10);
    ctx.fillStyle = "#3e7a30";
    ctx.fillRect(fx + 8, fy + 8, 4, 4);
    ctx.fillRect(fx + 18, fy + 4, 4, 4);
    ctx.fillRect(fx + 14, fy + 16, 4, 4);
    ctx.fillStyle = "#5aa040";
    ctx.fillRect(fx + 10, fy + 10, 2, 2);
    ctx.fillRect(fx + 20, fy + 6, 2, 2);
  } else if (v === 1) {
    // Conifer / pine — stacked triangular layers.
    const cx = x + 13;
    ctx.fillStyle = "#1f4a22";
    // bottom
    ctx.fillRect(cx - 14, groundY - trunkH - 4, 28, 6);
    ctx.fillRect(cx - 12, groundY - trunkH - 8, 24, 4);
    // middle
    ctx.fillRect(cx - 10, groundY - trunkH - 12, 20, 6);
    ctx.fillRect(cx - 8, groundY - trunkH - 16, 16, 4);
    // top
    ctx.fillRect(cx - 6, groundY - trunkH - 20, 12, 6);
    ctx.fillRect(cx - 3, groundY - trunkH - 24, 6, 4);
    ctx.fillRect(cx - 1, groundY - trunkH - 27, 2, 3);
    // highlights
    ctx.fillStyle = "#356c34";
    ctx.fillRect(cx - 8, groundY - trunkH - 4, 4, 2);
    ctx.fillRect(cx - 6, groundY - trunkH - 12, 4, 2);
    ctx.fillRect(cx - 4, groundY - trunkH - 20, 3, 2);
  } else if (v === 2) {
    // Willow — soft round canopy with drooping tendrils.
    ctx.fillStyle = "#3a6a3a";
    ctx.fillRect(fx + 2, fy + 8, 26, 14);
    ctx.fillRect(fx + 6, fy + 2, 18, 10);
    ctx.fillStyle = "#4d8547";
    ctx.fillRect(fx + 8, fy + 6, 4, 4);
    ctx.fillRect(fx + 18, fy + 4, 4, 4);
    ctx.fillRect(fx + 12, fy + 14, 4, 3);
    // drooping tendrils
    ctx.fillStyle = "#3a6a3a";
    for (let i = 0; i < 6; i++) {
      const tx = fx + 2 + i * 5;
      const th = 6 + ((i * 3) % 5);
      ctx.fillRect(tx, fy + 20, 1, th);
    }
  } else if (v === 3) {
    // Autumn — warm reds & oranges.
    ctx.fillStyle = "#a63a1e";
    ctx.fillRect(fx + 4, fy + 6, 22, 20);
    ctx.fillRect(fx + 8, fy, 14, 10);
    ctx.fillRect(fx, fy + 12, 8, 10);
    ctx.fillRect(fx + 22, fy + 12, 8, 10);
    ctx.fillStyle = "#d96a2a";
    ctx.fillRect(fx + 8, fy + 8, 4, 4);
    ctx.fillRect(fx + 18, fy + 4, 4, 4);
    ctx.fillRect(fx + 14, fy + 16, 4, 4);
    ctx.fillStyle = "#ffcf6a";
    ctx.fillRect(fx + 10, fy + 10, 2, 2);
    ctx.fillRect(fx + 20, fy + 6, 2, 2);
  } else if (v === 4) {
    // Birch — narrow, tall, small oval canopy.
    ctx.fillStyle = "#3a6b30";
    ctx.fillRect(fx + 6, fy + 10, 18, 14);
    ctx.fillRect(fx + 10, fy + 4, 10, 8);
    ctx.fillStyle = "#4f8a40";
    ctx.fillRect(fx + 10, fy + 12, 3, 3);
    ctx.fillRect(fx + 18, fy + 8, 3, 3);
    ctx.fillStyle = "#6fb050";
    ctx.fillRect(fx + 14, fy + 6, 2, 2);
  } else {
    // Broadleaf — wide, dense, layered.
    ctx.fillStyle = "#265428";
    ctx.fillRect(fx - 4, fy + 10, 34, 16);
    ctx.fillRect(fx + 2, fy + 4, 24, 10);
    ctx.fillRect(fx + 8, fy - 2, 12, 8);
    ctx.fillStyle = "#3a7a34";
    ctx.fillRect(fx + 6, fy + 6, 4, 4);
    ctx.fillRect(fx + 16, fy + 2, 4, 4);
    ctx.fillRect(fx + 22, fy + 14, 4, 4);
    ctx.fillRect(fx - 2, fy + 16, 4, 4);
    ctx.fillStyle = "#5aa848";
    ctx.fillRect(fx + 10, fy + 8, 2, 2);
    ctx.fillRect(fx + 20, fy + 10, 2, 2);
  }
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, groundY: number, variant: number = 0) {
  const v = ((variant % 5) + 5) % 5;
  // Palette per variant: 0 lush, 1 dark pine-green, 2 dry olive,
  // 3 blueberry (with tiny berries), 4 autumn/red tips.
  const palettes: Array<{ dark: string; light: string; accent?: string }> = [
    { dark: "#2f5a24", light: "#4a8a34" },
    { dark: "#1f4a1e", light: "#356032" },
    { dark: "#4a5a24", light: "#7a8a3a" },
    { dark: "#2a4a2a", light: "#3e7a30", accent: "#5a7ac0" },
    { dark: "#3a4a1e", light: "#6a8a34", accent: "#c65a3a" },
  ];
  const p = palettes[v];
  // Base clump: slight silhouette variation per variant.
  ctx.fillStyle = p.dark;
  if (v === 1) {
    // taller, narrower
    ctx.fillRect(x + 2, groundY - 12, 18, 12);
    ctx.fillRect(x + 6, groundY - 16, 10, 4);
  } else if (v === 2) {
    // low + wide
    ctx.fillRect(x - 2, groundY - 8, 26, 8);
    ctx.fillRect(x + 4, groundY - 11, 16, 3);
  } else {
    ctx.fillRect(x, groundY - 10, 22, 10);
    ctx.fillRect(x + 4, groundY - 14, 14, 4);
  }
  // Highlights
  ctx.fillStyle = p.light;
  ctx.fillRect(x + 6, groundY - 12, 4, 3);
  ctx.fillRect(x + 14, groundY - 8, 4, 3);
  if (v === 0 || v === 4) ctx.fillRect(x + 10, groundY - 13, 3, 2);
  // Accent dots (berries / autumn tips)
  if (p.accent) {
    ctx.fillStyle = p.accent;
    ctx.fillRect(x + 4, groundY - 9, 1, 1);
    ctx.fillRect(x + 12, groundY - 11, 1, 1);
    ctx.fillRect(x + 17, groundY - 7, 1, 1);
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, groundY: number, variant: number) {
  // stem
  ctx.fillStyle = "#2f5a24";
  ctx.fillRect(x + 2, groundY - 6, 1, 6);
  // petals
  const colors = ["#e94560", "#ffd166", "#f4e9c1"];
  ctx.fillStyle = colors[variant % colors.length];
  ctx.fillRect(x + 1, groundY - 9, 3, 3);
  ctx.fillStyle = "#7a3e1d";
  ctx.fillRect(x + 2, groundY - 8, 1, 1);
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  ctx.fillStyle = "#5a5a6a";
  ctx.fillRect(x, groundY - 6, 12, 6);
  ctx.fillStyle = "#7a7a8a";
  ctx.fillRect(x + 2, groundY - 8, 8, 3);
  ctx.fillStyle = "#3a3a4a";
  ctx.fillRect(x, groundY - 2, 12, 2);
}

function drawGrassTuft(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  ctx.fillStyle = "#3e6a30";
  ctx.fillRect(x, groundY - 3, 1, 3);
  ctx.fillRect(x + 2, groundY - 5, 1, 5);
  ctx.fillRect(x + 4, groundY - 3, 1, 3);
}


// Draw the island's near ground: grass and sand beaches, with a proper
// shore transition (wet sand → shallow turquoise → normal ocean).
function drawIslandGround(
  ctx: CanvasRenderingContext2D,
  camX: number,
  islandLeft: number,
  islandRight: number,
  beachW: number,
  time: number,
) {
  const grassColor = "#4a7a3a";
  const grassTop = "#6ea44a";
  const grassDark = "#356032";
  const soil = "#5a3d20";
  const soilDeep = "#3a2612";
  const sand = "#e8c98a";
  const sandTop = "#f5e0a8";
  const sandDeep = "#c9a86a";
  const wetSand = "#a6875a";
  const shallow = "#7cc9c3";
  const shallowHi = "#a8e0dc";

  const islandLeftScreen = islandLeft - camX;
  const islandRightScreen = islandRight - camX;
  const beachLeftEndScreen = islandLeft + beachW - camX;
  const beachRightStartScreen = islandRight - beachW - camX;
  const clampX = (x: number) => Math.max(0, Math.min(VW, x));

  // ----- Sand beaches (they sit ON the island, so they end at the shore) -----
  const drawBeach = (a: number, b: number) => {
    if (b <= a) return;
    ctx.fillStyle = sand;
    ctx.fillRect(a, GROUND_Y, b - a, VH - GROUND_Y);
    ctx.fillStyle = sandTop;
    ctx.fillRect(a, GROUND_Y, b - a, 3);
    ctx.fillStyle = sandDeep;
    ctx.fillRect(a, GROUND_Y + 14, b - a, 1);
    // Speckled sand grain
    ctx.fillStyle = wetSand;
    for (let x = a + ((camX * 0.3) | 0) % 5; x < b; x += 5) {
      ctx.fillRect(x, GROUND_Y + 6, 1, 1);
      ctx.fillRect(x + 2, GROUND_Y + 9, 1, 1);
    }
  };
  const lbA = clampX(islandLeftScreen);
  const lbB = clampX(beachLeftEndScreen);
  drawBeach(lbA, lbB);
  const rbA = clampX(beachRightStartScreen);
  const rbB = clampX(islandRightScreen);
  drawBeach(rbA, rbB);

  // ----- Grass middle with soil layer + gentle bump variation -----
  const gA = clampX(beachLeftEndScreen);
  const gB = clampX(beachRightStartScreen);
  if (gB > gA) {
    // Vertical color bands so the ground looks like layered dirt, not flat
    ctx.fillStyle = soilDeep;
    ctx.fillRect(gA, GROUND_Y, gB - gA, VH - GROUND_Y);
    ctx.fillStyle = soil;
    ctx.fillRect(gA, GROUND_Y + 4, gB - gA, 18);
    ctx.fillStyle = grassColor;
    ctx.fillRect(gA, GROUND_Y, gB - gA, 6);
    ctx.fillStyle = grassTop;
    ctx.fillRect(gA, GROUND_Y, gB - gA, 2);
    // Undulating darker grass patches
    ctx.fillStyle = grassDark;
    for (let x = gA + (((-camX * 0.9) % 12) + 12) % 12; x < gB; x += 12) {
      ctx.fillRect(x, GROUND_Y + 3, 3, 1);
      ctx.fillRect(x + 6, GROUND_Y + 4, 4, 1);
    }
    // (Removed pebble specks — the parallax against the ground looked off.)
  }

  // Wet sand + submerged shelf + foam blending are handled entirely inside
  // drawShoreTransition() so the sand and water share one seamless profile.
  void wetSand; void shallow; void shallowHi;
}

// Shore transition drawn OUTSIDE the island clip. Renders a beveled
// submerged sand shelf sloping down from the beach into deep water, with
// the water plane sitting on top and blending against the sand via a foam
// ribbon at the actual waterline. No abrupt vertical cuts, no floating foam.
function drawShoreTransition(
  ctx: CanvasRenderingContext2D,
  camX: number,
  islandLeft: number,
  islandRight: number,
  time: number,
) {
  const EDGE_ZONE = 22; // wet-sand bevel INSIDE the beach (dry → damp → waterline)
  const SHORE_RUN = 130; // submerged shelf OUTSIDE the island (shallow → deep)
  const WATERLINE = GROUND_Y; // horizontal water surface where sand meets sea

  const sand = "#e8c98a";
  const wetSand = "#a6875a";
  const shallow: [number, number, number] = [128, 206, 198];
  const midWater: [number, number, number] = [58, 148, 170];
  const deepWater: [number, number, number] = [31, 95, 122];

  const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
  const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  const islandLeftScreen = islandLeft - camX;
  const islandRightScreen = islandRight - camX;

  const drawSide = (edgeScreen: number, dir: 1 | -1) => {
    if (edgeScreen < -SHORE_RUN - EDGE_ZONE || edgeScreen > VW + SHORE_RUN + EDGE_ZONE) return;

    // Sinusoidal breathing of the tideline so the waterline visibly moves.
    const tideBase = (Math.sin(time * 1.3 + edgeScreen * 0.03) * 0.5 + 0.5) * 4;

    for (let i = -EDGE_ZONE; i < SHORE_RUN; i++) {
      const sx = Math.round(edgeScreen + dir * i);
      if (sx < 0 || sx >= VW) continue;

      // ----- Inside the beach: paint a damp-sand veneer (no water plane) -----
      if (i < 0) {
        const dist = Math.abs(i);
        const wet = 1 - (dist - 1) / Math.max(1, EDGE_ZONE - 1); // 1 at shore, 0 far inland
        // Damp sand overlay grows toward the waterline
        ctx.fillStyle = `rgba(90,60,35,${(0.55 * wet).toFixed(3)})`;
        ctx.fillRect(sx, GROUND_Y, 1, 5);
        // Foam kiss that only appears within the tide reach — never floats
        const reach = 1 + Math.floor(tideBase);
        if (dist <= reach) {
          const a = 1 - dist / (reach + 1);
          ctx.fillStyle = `rgba(255,255,255,${(0.85 * a).toFixed(3)})`;
          ctx.fillRect(sx, GROUND_Y, 1, 1);
          ctx.fillStyle = `rgba(255,255,255,${(0.45 * a).toFixed(3)})`;
          ctx.fillRect(sx, GROUND_Y + 1, 1, 1);
        }
        continue;
      }

      // ----- Outside the island: beveled submerged sand shelf -----
      const j = i;
      const t = j / SHORE_RUN;
      // Sand top slopes down with a soft ease so the beach never cuts straight.
      const sandOffset = Math.floor(1 + Math.pow(t, 0.62) * 66);
      const sandY = WATERLINE + sandOffset;

      // Sand floor (wet near shore, dry-tone farther out gets darkened by depth)
      ctx.fillStyle = j < 8 ? wetSand : sand;
      ctx.fillRect(sx, sandY, 1, VH - sandY);
      // Depth-tinted darkening on the floor
      ctx.fillStyle = `rgba(14,26,46,${Math.min(0.6, t * 0.75).toFixed(3)})`;
      ctx.fillRect(sx, sandY, 1, VH - sandY);

      // Water column above the shelf: turquoise → teal → deep. Semi-opaque
      // so the sand shelf shows through near the shore (submerged sand look).
      const wc =
        t < 0.35
          ? mix(shallow, midWater, t / 0.35)
          : mix(midWater, deepWater, Math.min(1, (t - 0.35) / 0.65));
      const waterAlpha = 0.55 + t * 0.35; // rises with depth
      ctx.fillStyle = rgba(wc, waterAlpha);
      ctx.fillRect(sx, WATERLINE, 1, sandY - WATERLINE);

      // Caustic sparkle on the shelf
      if (((j * 3 + Math.floor(time * 9)) % 11) === 0 && t < 0.85) {
        ctx.fillStyle = `rgba(255,255,255,${(0.35 * (1 - t)).toFixed(3)})`;
        ctx.fillRect(sx, sandY - 1, 1, 1);
      }

      // Foam blend hugging the shoreline (waterline contact)
      if (j < 10) {
        const foamA =
          (1 - j / 10) *
          (0.55 + 0.45 * Math.abs(Math.sin(time * 2 + edgeScreen * 0.05 + j * 0.4)));
        ctx.fillStyle = `rgba(255,255,255,${foamA.toFixed(3)})`;
        ctx.fillRect(sx, WATERLINE, 1, 1);
        ctx.fillStyle = `rgba(255,255,255,${(foamA * 0.55).toFixed(3)})`;
        ctx.fillRect(sx, WATERLINE + 1, 1, 1);
      }

      // Small surface ripple flecks (only on the water column, never below sand)
      const surf = Math.sin(time * 3 + j * 0.55 + edgeScreen * 0.02);
      if (surf > 0.72 && sandY > WATERLINE + 3) {
        const ry = WATERLINE + 2 + Math.floor((sandY - WATERLINE - 2) * 0.35);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(sx, ry, 1, 1);
      }
    }
  };

  drawSide(islandLeftScreen, -1);
  drawSide(islandRightScreen, 1);

  // Traveling wave crests over the shallow band — sit ON the water surface,
  // clipped to the actual water column (between waterline and the sand shelf).
  const drawTravelingCrests = (edgeScreen: number, dir: 1 | -1) => {
    if (edgeScreen < -SHORE_RUN - 40 || edgeScreen > VW + SHORE_RUN + 40) return;
    const rows: { start: number; speed: number; y: number }[] = [
      { start: 26, speed: 15, y: 3 },
      { start: 52, speed: 10, y: 6 },
      { start: 88, speed: 6, y: 10 },
    ];
    for (const r of rows) {
      const phase = (time * r.speed) % 32;
      for (let seg = 0; seg < 5; seg++) {
        const cx0 = r.start + seg * 32 - phase;
        for (let k = 0; k < 16; k++) {
          const j = cx0 + k;
          if (j < 10 || j >= SHORE_RUN - 2) continue;
          const sx = Math.round(edgeScreen + dir * j);
          if (sx < 0 || sx >= VW) continue;
          // Ensure crest sits above the sand shelf for this column
          const t = j / SHORE_RUN;
          const sandOffset = Math.floor(1 + Math.pow(t, 0.62) * 66);
          const maxY = WATERLINE + Math.max(2, sandOffset - 2);
          const y = Math.min(maxY, WATERLINE + r.y + Math.floor(Math.sin(k * 0.55) * 1));
          ctx.fillStyle = k < 2 || k > 13 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.9)";
          ctx.fillRect(sx, y, 1, 1);
        }
      }
    }
  };
  drawTravelingCrests(islandLeftScreen, -1);
  drawTravelingCrests(islandRightScreen, 1);
}

// Little shells / pebbles / driftwood on the sand
function drawBeachDecor(
  ctx: CanvasRenderingContext2D,
  camX: number,
  islandLeft: number,
  islandRight: number,
  beachW: number,
) {
  const offs: { off: number; kind: 0 | 1 | 2; side: 0 | 1 }[] = [
    { off: 20, kind: 0, side: 0 }, { off: 55, kind: 1, side: 0 }, { off: 95, kind: 2, side: 0 },
    { off: 130, kind: 0, side: 0 }, { off: 170, kind: 1, side: 0 }, { off: 200, kind: 2, side: 0 },
    { off: 30, kind: 0, side: 1 }, { off: 70, kind: 1, side: 1 }, { off: 110, kind: 2, side: 1 },
    { off: 150, kind: 0, side: 1 }, { off: 185, kind: 1, side: 1 }, { off: 210, kind: 2, side: 1 },
  ];
  for (const s of offs) {
    const wx = s.side === 0 ? islandLeft + s.off : islandRight - s.off;
    if (s.off > beachW) continue;
    const sx = wx - camX;
    if (sx < -8 || sx > VW + 8) continue;
    const y = GROUND_Y + 6;
    if (s.kind === 0) {
      ctx.fillStyle = "#f4c9c1";
      ctx.fillRect(sx, y, 3, 2);
      ctx.fillStyle = "#c98a8a";
      ctx.fillRect(sx + 1, y, 1, 1);
    } else if (s.kind === 1) {
      ctx.fillStyle = "#8a7a5a";
      ctx.fillRect(sx, y + 1, 3, 2);
      ctx.fillStyle = "#a89968";
      ctx.fillRect(sx, y + 1, 3, 1);
    } else {
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(sx, y + 1, 6, 1);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(sx + 1, y + 2, 4, 1);
    }
  }
}

// ---------- extra scenery ----------

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Wide soft halo
  ctx.fillStyle = "rgba(255,244,210,0.28)";
  ctx.fillRect(x - 10, y + 6, 48, 20);
  ctx.fillRect(x - 6, y + 2, 40, 28);
  ctx.fillStyle = "rgba(255,240,200,0.35)";
  ctx.fillRect(x - 4, y + 4, 36, 24);
  // Sun body (rounded via corner clipping)
  ctx.fillStyle = "#ffe6a8";
  ctx.fillRect(x + 2, y, 24, 24);
  ctx.fillRect(x, y + 2, 28, 20);
  ctx.fillStyle = "#fff2c8";
  ctx.fillRect(x + 6, y + 4, 16, 12);
  // Bright core with a tiny animated glint
  ctx.fillStyle = "#fff9dc";
  ctx.fillRect(x + 10 + (((time * 3) | 0) % 2), y + 8, 4, 4);
}

function drawSeagulls(ctx: CanvasRenderingContext2D, offset: number, time: number) {
  const gulls: [number, number][] = [
    [40, 60], [120, 40], [220, 70], [320, 50], [430, 65], [560, 45],
  ];
  ctx.fillStyle = "#f4f4f4";
  const phase = ((time * 3) | 0) % 2;
  for (const [gx, gy] of gulls) {
    const x = ((gx - offset) % (VW + 100) + (VW + 100)) % (VW + 100) - 50;
    const y = gy + Math.sin((time + gx) * 0.8) * 1.2;
    if (phase === 0) {
      // wings up: ^^
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y - 1, 1, 1);
      ctx.fillRect(x + 2, y, 1, 1);
      ctx.fillRect(x + 3, y - 1, 1, 1);
      ctx.fillRect(x + 4, y, 1, 1);
    } else {
      // wings flat: -----
      ctx.fillRect(x, y + 1, 5, 1);
      ctx.fillRect(x + 2, y, 1, 1);
    }
  }
}

function drawSea(
  ctx: CanvasRenderingContext2D,
  camX: number,
  horizonY: number,
  time: number,
  swimDepth: number,
) {
  // Palette shifts subtly toward deeper hues based on swimDepth (0 → 1)
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const mix = (c1: number[], c2: number[], t: number) =>
    `rgb(${lerp(c1[0], c2[0], t)},${lerp(c1[1], c2[1], t)},${lerp(c1[2], c2[2], t)})`;
  const shallowRGB = [80, 168, 190];
  const deepRGB = [22, 56, 96];
  const waterTop = mix(shallowRGB, [56, 130, 168], swimDepth);
  const waterMid = mix([50, 120, 156], deepRGB, swimDepth * 0.8);
  const waterBot = mix([32, 84, 128], [10, 28, 60], swimDepth);
  const crest = swimDepth > 0.5 ? "#8ab4d8" : "#c6e6f2";

  // ----- Depth bands from horizon down (each ~1/4 of ocean) -----
  const oceanH = VH - horizonY;
  ctx.fillStyle = waterTop;
  ctx.fillRect(0, horizonY, VW, oceanH);
  ctx.fillStyle = waterMid;
  ctx.fillRect(0, horizonY + Math.floor(oceanH * 0.35), VW, Math.floor(oceanH * 0.5));
  ctx.fillStyle = waterBot;
  ctx.fillRect(0, horizonY + Math.floor(oceanH * 0.75), VW, oceanH);

  // ----- Sun reflection column (only while near the island) -----
  if (swimDepth < 0.75) {
    const sunX = 514;
    const refl = 1 - swimDepth;
    ctx.fillStyle = `rgba(255,232,168,${(0.9 * refl).toFixed(2)})`;
    for (let y = horizonY + 2; y < VH; y += 4) {
      const w = 4 + ((y - horizonY) >> 2);
      const wobble = Math.sin(time * 1.6 + y * 0.4) * 2;
      ctx.fillRect(sunX - w / 2 + wobble, y, w, 1);
    }
    ctx.fillStyle = `rgba(255,246,220,${refl.toFixed(2)})`;
    ctx.fillRect(sunX - 3, horizonY + 1, 6, 1);
  }

  // ----- Animated wave crests — sine offsets so they undulate ------
  ctx.fillStyle = crest;
  for (let y = horizonY + 4; y < VH; y += 5) {
    const rowT = time * (0.6 + (y - horizonY) * 0.02);
    const parallax = camX * (0.25 + (y - horizonY) * 0.005);
    const step = 22;
    for (let base = -step; base < VW + step; base += step) {
      const x = base + Math.floor(Math.sin(rowT + base * 0.08) * 3 - parallax) % (VW + step);
      const wx = ((x % (VW + step)) + (VW + step)) % (VW + step) - step;
      ctx.fillRect(wx, y, 4, 1);
      ctx.fillRect(wx + 10, y + 1, 2, 1);
    }
  }

  // ----- Larger foreground swells that visibly move ------
  ctx.fillStyle = crest;
  for (let base = -60; base < VW + 60; base += 46) {
    const wobble = Math.sin(time * 1.2 + base * 0.05) * 4;
    const x = ((base - camX * 0.6) % (VW + 60) + (VW + 60)) % (VW + 60) - 60 + wobble;
    const y = VH - 30 + Math.floor(Math.sin(time * 1.8 + base) * 1.5);
    ctx.fillRect(x, y, 12, 1);
    ctx.fillRect(x + 3, y + 2, 6, 1);
  }

  // ----- Extra dark ripples the deeper you go -----
  if (swimDepth > 0) {
    ctx.fillStyle = `rgba(0,10,30,${(swimDepth * 0.5).toFixed(2)})`;
    for (let y = VH - 20; y < VH; y += 4) {
      const off = (Math.floor(camX * 0.7 + time * 12) + y * 5) % 18;
      for (let x = -off; x < VW; x += 18) {
        ctx.fillRect(x, y, 5, 1);
      }
    }
  }

  // ----- Horizon crisp line -----
  ctx.fillStyle = "#c8dff0";
  ctx.fillRect(0, horizonY, VW, 1);
}

function drawSailboat(ctx: CanvasRenderingContext2D, offset: number, y: number) {
  const boats: [number, number, number][] = [
    // [worldOffset, yBias, hullColorIdx]
    [80, 0, 0], [420, 2, 1], [780, -1, 0],
  ];
  const hullPalette = ["#3a2a1a", "#5a3a1a"];
  for (const [bx, dy, ci] of boats) {
    const x = ((bx - offset) % (VW + 140) + (VW + 140)) % (VW + 140) - 70;
    const by = y + dy;
    // sail
    ctx.fillStyle = "#f4e9c1";
    ctx.fillRect(x + 4, by - 8, 5, 6);
    ctx.fillRect(x + 5, by - 10, 3, 2);
    // mast
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(x + 4, by - 10, 1, 8);
    // hull
    ctx.fillStyle = hullPalette[ci];
    ctx.fillRect(x, by, 12, 2);
    ctx.fillRect(x + 1, by + 2, 10, 1);
    // reflection
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x + 2, by + 4, 8, 1);
  }
}

function drawPalms(ctx: CanvasRenderingContext2D, camX: number, islandLeft: number, islandRight: number) {
  const palms: { wx: number; variant: 0 | 1 }[] = [
    { wx: islandLeft + 40, variant: 0 }, { wx: islandLeft + 90, variant: 1 },
    { wx: islandLeft + 160, variant: 0 }, { wx: islandLeft + 210, variant: 1 },
    { wx: islandRight - 40, variant: 1 }, { wx: islandRight - 100, variant: 0 },
    { wx: islandRight - 170, variant: 1 }, { wx: islandRight - 220, variant: 0 },
  ];
  for (const p of palms) {
    const sx = p.wx - camX;
    if (sx < -30 || sx > VW + 30) continue;
    drawPalm(ctx, sx, GROUND_Y, p.variant);
  }
}

function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  variant: 0 | 1 | 2 | 3,
) {
  // Per-variant tuning gives 4 distinct silhouettes.
  //  0 — classic tall bendy
  //  1 — leans the other way
  //  2 — extra tall, straight & majestic
  //  3 — short & wide "coco-dwarf" with drooping crown
  const trunkH = variant === 2 ? 66 : variant === 3 ? 38 : 54 + variant * 8;
  const trunkW = variant === 3 ? 6 : 5;
  const bend = variant === 2 ? 0 : variant === 3 ? 1 : (variant === 1 ? -3 : 3);
  const trunkA = variant === 3 ? "#7a5432" : "#6a4a2a";
  const trunkB = variant === 3 ? "#9a7644" : "#8a6a3a";
  const trunkC = "#3a220e";
  const bendAt = (s: number) => Math.floor(Math.sin(s / 10) * bend);
  ctx.fillStyle = trunkA;
  for (let s = 0; s < trunkH; s++) {
    ctx.fillRect(x + bendAt(s), groundY - s - 1, trunkW, 1);
  }
  ctx.fillStyle = trunkB;
  for (let s = 0; s < trunkH; s += 3) {
    ctx.fillRect(x + bendAt(s), groundY - s - 1, 1, 1);
  }
  ctx.fillStyle = trunkC;
  for (let s = 2; s < trunkH; s += 6) {
    ctx.fillRect(x + bendAt(s) + 1, groundY - s - 1, trunkW - 1, 1);
  }

  // ----- Frond crown -----
  const cx = x + bendAt(trunkH) + Math.floor(trunkW / 2);
  const cy = groundY - trunkH - 3;
  // Palette varies per variant for visible diversity.
  const leafDark = variant === 2 ? "#1e5028" : variant === 3 ? "#3a7a3a" : "#245a2a";
  const leafMid = variant === 2 ? "#2a7a30" : variant === 3 ? "#5aa84a" : "#2f8a38";
  const leafLite = variant === 2 ? "#4fb04a" : variant === 3 ? "#8ed070" : "#5cc25a";

  // Each variant gets its own frond arrangement.
  const frondsByVariant: Record<0 | 1 | 2 | 3, [number, number, number][]> = {
    0: [ [-2, -1, 14], [ 2, -1, 14], [-3, 0, 16], [ 3, 0, 16], [-3, 1, 15], [ 3, 1, 15] ],
    1: [ [-2, -1, 15], [ 2, -1, 15], [-3, 0, 17], [ 3, 0, 17], [-3, 1, 14], [ 3, 1, 14] ],
    2: [ [-1, -2, 12], [ 1, -2, 12], [-3, -1, 18], [ 3, -1, 18], [-4, 0, 20], [ 4, 0, 20], [-3, 1, 16], [ 3, 1, 16] ],
    3: [ [-2, 0, 14], [ 2, 0, 14], [-3, 1, 15], [ 3, 1, 15], [-3, 2, 14], [ 3, 2, 14] ],
  };
  const fronds = frondsByVariant[variant];
  for (const [dx, dy, len] of fronds) {
    for (let s = 0; s < len; s++) {
      const px = cx + Math.round(dx * s / 2);
      const py = cy + Math.round(dy * s / 1.5) + Math.floor((s * s) / 24);
      const th = Math.max(1, 3 - Math.floor(s / 6));
      ctx.fillStyle = leafDark;
      ctx.fillRect(px, py, th, 1);
      if (s % 2 === 0 && s > 1 && s < len - 1) {
        const sign = dx >= 0 ? 1 : -1;
        ctx.fillStyle = leafMid;
        ctx.fillRect(px + sign, py + (dy > 0 ? -1 : 1), 1, 1);
        ctx.fillRect(px - sign, py + (dy > 0 ? -1 : 1), 1, 1);
      }
    }
  }
  // Crown highlights
  ctx.fillStyle = leafLite;
  ctx.fillRect(cx - 1, cy - 1, 3, 2);
  ctx.fillRect(cx - 4, cy + 1, 2, 1);
  ctx.fillRect(cx + 3, cy + 1, 2, 1);

  // Coconuts — dwarf variant carries a fatter cluster
  ctx.fillStyle = "#3a2a10";
  ctx.fillRect(cx + 1, cy + 3, 3, 3);
  ctx.fillRect(cx - 3, cy + 4, 3, 3);
  if (variant === 3) {
    ctx.fillRect(cx + 4, cy + 5, 2, 2);
    ctx.fillRect(cx - 5, cy + 6, 2, 2);
  }
  ctx.fillStyle = "#6a4a1a";
  ctx.fillRect(cx + 1, cy + 3, 1, 1);
  ctx.fillRect(cx - 3, cy + 4, 1, 1);
}

function drawMushroom(ctx: CanvasRenderingContext2D, x: number, groundY: number, variant: number) {
  const capColors = ["#c94b4b", "#a05a3a"];
  // stem
  ctx.fillStyle = "#e8dbb0";
  ctx.fillRect(x + 2, groundY - 4, 2, 4);
  ctx.fillStyle = "#b8a878";
  ctx.fillRect(x + 3, groundY - 4, 1, 4);
  // cap
  ctx.fillStyle = capColors[variant % capColors.length];
  ctx.fillRect(x, groundY - 6, 6, 2);
  ctx.fillRect(x + 1, groundY - 7, 4, 1);
  // spots
  ctx.fillStyle = "#f4e9c1";
  ctx.fillRect(x + 1, groundY - 6, 1, 1);
  ctx.fillRect(x + 4, groundY - 6, 1, 1);
}

function drawFern(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  ctx.fillStyle = "#2f5a24";
  // Central stem
  ctx.fillRect(x + 3, groundY - 8, 1, 8);
  // Fronds
  for (let s = 0; s < 8; s += 2) {
    const w = 3 - Math.floor(s / 3);
    ctx.fillRect(x + 3 - w, groundY - 7 + s, w, 1);
    ctx.fillRect(x + 4, groundY - 7 + s, w, 1);
  }
  ctx.fillStyle = "#4a8a34";
  ctx.fillRect(x + 3, groundY - 8, 1, 2);
  ctx.fillRect(x + 1, groundY - 5, 1, 1);
  ctx.fillRect(x + 5, groundY - 5, 1, 1);
}

function drawButterflies(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  islandLeft: number,
  islandRight: number,
) {
  const spread = islandRight - islandLeft;
  const flies: [number, number, string][] = [
    [islandLeft + spread * 0.10, 250, "#f4d166"],
    [islandLeft + spread * 0.22, 230, "#f06292"],
    [islandLeft + spread * 0.34, 245, "#a8f4d1"],
    [islandLeft + spread * 0.46, 240, "#f4a8dc"],
    [islandLeft + spread * 0.58, 255, "#ffd166"],
    [islandLeft + spread * 0.72, 235, "#c1c9f4"],
    [islandLeft + spread * 0.86, 250, "#f4b490"],
  ];
  const phase = ((time * 6) | 0) % 2;
  for (const [wx, baseY, color] of flies) {
    const sx = wx - camX + Math.sin(time * 0.7 + wx) * 6;
    const sy = baseY + Math.sin(time * 1.6 + wx) * 3;
    if (sx < -6 || sx > VW + 6) continue;
    ctx.fillStyle = color;
    if (phase === 0) {
      ctx.fillRect(sx, sy, 1, 1);
      ctx.fillRect(sx + 2, sy, 1, 1);
      ctx.fillRect(sx, sy + 1, 1, 1);
      ctx.fillRect(sx + 2, sy + 1, 1, 1);
    } else {
      ctx.fillRect(sx - 1, sy + 1, 1, 1);
      ctx.fillRect(sx + 3, sy + 1, 1, 1);
      ctx.fillRect(sx, sy, 3, 1);
    }
    // body
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(sx + 1, sy, 1, 2);
  }
}

// ---------- swim ripple, shark, death overlay ----------

function drawSwimRipple(ctx: CanvasRenderingContext2D, sx: number, spriteY: number, time: number, swimDepth: number) {
  // Waterline sits around the chest as the character submerges
  const y = spriteY + SPRITE_H - 10 - Math.floor(swimDepth * 4);
  // Two concentric ellipses pulsing outward around the swimmer
  for (let ring = 0; ring < 2; ring++) {
    const phase = (time * 1.4 + ring * 0.5) % 1;
    const w = 8 + Math.floor(phase * 18);
    const alpha = (0.55 - phase * 0.5).toFixed(2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(sx + 8 - w / 2, y + ring, w, 1);
  }
  // Waterline splash at the sprite (brighter in deeper water)
  ctx.fillStyle = `rgba(255,255,255,${(0.5 + swimDepth * 0.3).toFixed(2)})`;
  ctx.fillRect(sx + 2, y - 1, 12, 1);
  // Occasional side droplets
  const dropPhase = (time * 6) | 0;
  if (dropPhase % 2 === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(sx - 2, y - 2, 1, 1);
    ctx.fillRect(sx + 16, y - 2, 1, 1);
  }
}

// Blood + splash pixels while the shark chomps the player.
function drawChompFx(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  // Pseudo-random particles that fly outward and fall
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 4;
    const speed = 24 + (i % 3) * 8;
    const px = cx + Math.cos(a) * speed * t;
    const py = cy + Math.sin(a) * speed * t + t * t * 60;
    if (py > VH) continue;
    ctx.fillStyle = i % 3 === 0 ? "#8a0e1e" : i % 3 === 1 ? "#c62533" : "#e94560";
    ctx.fillRect(px, py, 2, 2);
  }
  // White splash bursts at the impact site
  const burst = Math.max(0, 1 - t * 1.4);
  if (burst > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(burst * 0.9).toFixed(2)})`;
    ctx.fillRect(cx - 4, cy - 2, 8, 2);
    ctx.fillRect(cx - 8, cy + 1, 3, 1);
    ctx.fillRect(cx + 6, cy + 1, 3, 1);
    ctx.fillRect(cx - 2, cy - 5, 4, 2);
  }
  // Screen-wide red flash on impact
  if (t < 0.15) {
    ctx.fillStyle = `rgba(180,20,32,${(0.45 * (1 - t / 0.15)).toFixed(2)})`;
    ctx.fillRect(0, 0, VW, VH);
  }
}

function drawShark(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dir: 1 | -1,
  chomp: number,
) {
  const flip = dir === -1;
  ctx.save();
  if (flip) {
    ctx.translate(sx + 32, sy);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(sx, sy);
  }

  // Body (elongated pixel torpedo)
  ctx.fillStyle = "#4a6a7a";
  ctx.fillRect(2, 6, 26, 6);
  ctx.fillRect(4, 4, 22, 2);
  ctx.fillRect(6, 12, 20, 2);
  // Underbelly
  ctx.fillStyle = "#c7d3d8";
  ctx.fillRect(6, 12, 18, 2);
  ctx.fillRect(4, 10, 20, 2);
  // Back darker
  ctx.fillStyle = "#33505e";
  ctx.fillRect(6, 4, 18, 2);
  ctx.fillRect(8, 3, 14, 1);

  // Dorsal fin
  ctx.fillStyle = "#33505e";
  ctx.fillRect(12, 0, 6, 4);
  ctx.fillRect(13, -1, 4, 1);

  // Tail
  ctx.fillStyle = "#4a6a7a";
  ctx.fillRect(28, 2, 3, 12);
  ctx.fillStyle = "#33505e";
  ctx.fillRect(29, 0, 2, 3);
  ctx.fillRect(29, 12, 2, 3);

  // Pectoral fin
  ctx.fillStyle = "#33505e";
  ctx.fillRect(10, 12, 6, 2);

  // Eye
  ctx.fillStyle = "#f4e9c1";
  ctx.fillRect(5, 6, 2, 2);
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(5, 7, 1, 1);

  // Mouth — opens/closes with chomp
  const open = (Math.floor(chomp) % 2) === 0;
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 9, 6, open ? 3 : 1);
  // Teeth
  ctx.fillStyle = "#f4f4f4";
  if (open) {
    ctx.fillRect(1, 9, 1, 1);
    ctx.fillRect(3, 9, 1, 1);
    ctx.fillRect(1, 11, 1, 1);
    ctx.fillRect(3, 11, 1, 1);
  } else {
    ctx.fillRect(1, 9, 1, 1);
    ctx.fillRect(3, 9, 1, 1);
  }

  ctx.restore();

  // Splash trail behind
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const tx = flip ? sx + 32 : sx - 6;
  ctx.fillRect(tx, sy + 10, 4, 1);
  ctx.fillRect(tx + (flip ? -2 : 2), sy + 7, 3, 1);
}

function DeathOverlay({ onRestart }: { onRestart: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="relative border-4 border-[#e94560] bg-[#0d1b2a] p-6 max-w-[440px] w-full text-center"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
      >
        <div className="text-3xl mb-2">🦈</div>
        <div
          className="text-sm text-[#e94560] mb-2"
          style={{ textShadow: "2px 2px 0 #4a0a14" }}
        >
          {t("game.dead.title")}
        </div>
        <p className="text-[10px] tracking-widest text-[#f4e9c1]/80 mb-5">
          {t("game.dead.msg")}
        </p>
        <button
          onClick={onRestart}
          className="text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1] px-4 py-2 hover:bg-[#f4e9c1] hover:text-[#0d1b2a]"
        >
          {t("game.dead.restart")}
        </button>
      </div>
    </div>
  );
}

// ---------- shark sequence (uses uploaded pixel-art sprites) ----------

type SharkStateLite = {
  submersion: number;
  x: number;
  y: number;
  shark: {
    phase: "idle" | "approach" | "lunge" | "retreat";
    x: number;
    t: number;
    lungeStart: number;
    lungeEnd: number;
    dir: 1 | -1;
  };
};

function drawSharkSequence(
  ctx: CanvasRenderingContext2D,
  s: SharkStateLite,
  camX: number,
  time: number,
  finImg: HTMLImageElement | null,
  fullImg: HTMLImageElement | null,
) {
  const sh = s.shark;
  if (sh.phase === "idle") return;

  const finW = 44, finH = 32;
  const fullW = 120, fullH = 68;
  const waterY = WATER_LEVEL_Y; // water surface (matches the lowered ocean line)

  const drawSplash = (cx: number, cy: number, a: number) => {
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.fillRect(cx - 6, cy, 12, 1);
    ctx.fillRect(cx - 3, cy - 2, 6, 1);
    ctx.fillRect(cx - 8, cy - 1, 2, 1);
    ctx.fillRect(cx + 6, cy - 1, 2, 1);
  };

  // Sprites face LEFT natively. Face the direction of travel so the shark
  // never swims backwards. Approach moves opposite to `dir` (toward the
  // player); retreat moves along `dir` (away from the player).
  const travelDir =
    sh.phase === "retreat" ? sh.dir : -sh.dir; // +1 = moving right, -1 = left
  const flipH = travelDir === 1; // flip when moving right (sprite faces left natively)

  if (sh.phase === "approach" || sh.phase === "retreat") {
    const sx = Math.floor(sh.x - camX - finW / 2);
    const bob = Math.sin(time * 4 + sh.x * 0.03) * 1;
    const sy = Math.floor(waterY - finH * 0.55 + bob);
    if (finImg && finImg.complete && finImg.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (flipH) { ctx.translate(sx + finW, sy); ctx.scale(-1, 1); ctx.drawImage(finImg, 0, 0, finW, finH); }
      else ctx.drawImage(finImg, sx, sy, finW, finH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#33505e";
      ctx.fillRect(sx + 6, sy + 4, 10, 8);
      ctx.fillRect(sx + 8, sy, 6, 4);
    }
    // trailing ripple (behind the shark → opposite of travel direction)
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    const trailX = flipH ? sx - 6 : sx + finW;
    ctx.fillRect(trailX, sy + finH - 2, 6, 1);
    ctx.fillRect(trailX + (flipH ? -4 : 4), sy + finH - 4, 4, 1);
    // Bite splash when the shark reaches the player (start of retreat).
    if (sh.phase === "retreat" && sh.t < 0.3) {
      drawSplash(Math.floor(sh.x - camX), waterY - 1, 1 - sh.t / 0.3);
    }
  }
  // Reference unused args to keep the signature stable.
  void fullImg;
  void fullW; void fullH;
}

// ---------- in-game appearance editor ----------
// Only exposes fields the player is allowed to change after creation.
// Locked-at-creation fields (name, body, skin, hair color, eye color) are
// intentionally NOT included here.
function AppearanceEditModal({
  appearance,
  onCancel,
  onSave,
}: {
  appearance: Appearance;
  onCancel: () => void;
  onSave: (patch: Partial<Appearance>) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Appearance>(appearance);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCharacter(ctx, 0, 4, draft);
  }, [draft]);

  const setA = <K extends keyof Appearance>(k: K, v: Appearance[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col border-4 border-[#f4e9c1] bg-[#1b2a3a] font-pixel text-[#f4e9c1]"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="shrink-0 border-b-4 border-[#f4e9c1]/20 px-5 py-3 text-sm tracking-widest text-[#ffd166]">
          {t("game.editLook")}
        </h2>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[7rem,1fr]">
            <div className="flex flex-col items-center gap-2 md:sticky md:top-0">
              <div
                className="flex h-32 w-24 items-center justify-center border-4 border-[#f4e9c1]/40 bg-[#0d1b2a]"
                style={{ boxShadow: "0 4px 0 #0a141f" }}
              >
                <canvas
                  ref={previewRef}
                  width={SPRITE_W}
                  height={SPRITE_H + 4}
                  className="pixelated"
                  style={{
                    width: SPRITE_W * 3,
                    height: (SPRITE_H + 4) * 3,
                    imageRendering: "pixelated",
                  }}
                />
              </div>
              <div className="text-[9px] tracking-widest text-[#f4e9c1]/60">
                {t("create.preview")}
              </div>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 mt-1 block text-[10px] tracking-widest">
                {t("create.hairStyle")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setA("hairStyle", s as HairStyle)}
                    className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                      draft.hairStyle === s
                        ? "border-[#ffd166] bg-[#ffd166]/10"
                        : "border-[#f4e9c1]/30"
                    }`}
                  >
                    {t(`hair.${s}`)}
                  </button>
                ))}
              </div>

              {draft.body === "masc" && (
                <>
                  <label className="mb-1.5 mt-4 block text-[10px] tracking-widest">
                    {t("create.beard")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BEARD_STYLES.map((b) => (
                      <button
                        key={b}
                        onClick={() => setA("beard", b as BeardStyle)}
                        className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                          draft.beard === b
                            ? "border-[#ffd166] bg-[#ffd166]/10"
                            : "border-[#f4e9c1]/30"
                        }`}
                      >
                        {t(`beard.${b}`)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label className="mb-1.5 mt-4 block text-[10px] tracking-widest">
                {t("create.shirt")}
              </label>
              <EditorSwatchRow
                value={draft.shirt}
                options={SHIRT_COLORS}
                onChange={(v) => setA("shirt", v)}
              />

              <label className="mb-1.5 mt-4 block text-[10px] tracking-widest">
                {t("create.pants")}
              </label>
              <EditorSwatchRow
                value={draft.pants}
                options={PANTS_COLORS}
                onChange={(v) => setA("pants", v)}
              />

              <label className="mb-1.5 mt-4 block text-[10px] tracking-widest">
                {t("create.boots")}
              </label>
              <EditorSwatchRow
                value={draft.boots}
                options={BOOT_COLORS}
                onChange={(v) => setA("boots", v)}
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t-4 border-[#f4e9c1]/20 px-5 py-3 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border-4 border-[#f4e9c1]/50 px-4 py-3 text-[10px] uppercase"
          >
            {t("create.cancel")}
          </button>
          <button
            onClick={() =>
              onSave({
                hairStyle: draft.hairStyle,
                beard: draft.beard,
                shirt: draft.shirt,
                pants: draft.pants,
                boots: draft.boots,
              })
            }
            className="border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase text-[#0d1b2a]"
            style={{ boxShadow: "0 4px 0 #7a3e1d" }}
          >
            {t("create.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorSwatchRow({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={c}
          className={`h-8 w-8 border-4 ${value === c ? "border-[#ffd166]" : "border-[#f4e9c1]/30"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

// ---- Decorative wandering insects (butterflies, fireflies, dragonflies) ----
type InsectKind = "butterfly" | "firefly" | "dragonfly" | "ant" | "beetle" | "caterpillar";
type Insect = {
  kind: InsectKind;
  color: string;
  x: number; y: number;
  tx: number; ty: number;
  retarget: number;
  phase: number;
};

const INSECT_MIN_Y = 180; // above the horizon (fliers)
const INSECT_MAX_Y = GROUND_Y - 12;
const INSECT_AREA_LEFT = ISLAND_LEFT + 40;
const INSECT_AREA_RIGHT = ISLAND_RIGHT - 40;
const INSECT_COUNT = 14;
const GROUND_INSECT_COUNT = 12;
const GROUND_INSECT_Y = GROUND_Y - 1;

function isGroundInsect(k: InsectKind) {
  return k === "ant" || k === "beetle" || k === "caterpillar";
}

function spawnInsects(): Insect[] {
  const kinds: InsectKind[] = ["butterfly", "butterfly", "butterfly", "dragonfly", "firefly"];
  const butterflyColors = ["#ffcf6a", "#e94560", "#f4e9c1", "#c39be0", "#7cc9c3"];
  const arr: Insect[] = [];
  let seed = 987;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < INSECT_COUNT; i++) {
    const kind = kinds[Math.floor(rand() * kinds.length)];
    const color =
      kind === "butterfly"
        ? butterflyColors[Math.floor(rand() * butterflyColors.length)]
        : kind === "firefly"
          ? "#fff59a"
          : "#8be0d8";
    const x = INSECT_AREA_LEFT + rand() * (INSECT_AREA_RIGHT - INSECT_AREA_LEFT);
    const y = INSECT_MIN_Y + rand() * (INSECT_MAX_Y - INSECT_MIN_Y);
    arr.push({
      kind, color, x, y,
      tx: x, ty: y,
      retarget: 0,
      phase: rand() * Math.PI * 2,
    });
  }
  // Ground crawlers — ants, beetles, caterpillars pacing along the grass.
  const groundKinds: InsectKind[] = ["ant", "ant", "beetle", "caterpillar"];
  const beetleColors = ["#4a2f6a", "#2a4a2a", "#6a2a2a", "#2a2a4a"];
  for (let i = 0; i < GROUND_INSECT_COUNT; i++) {
    const kind = groundKinds[Math.floor(rand() * groundKinds.length)];
    const color =
      kind === "ant" ? "#1a1208" :
      kind === "caterpillar" ? "#7ea84a" :
      beetleColors[Math.floor(rand() * beetleColors.length)];
    const x = INSECT_AREA_LEFT + rand() * (INSECT_AREA_RIGHT - INSECT_AREA_LEFT);
    arr.push({
      kind, color, x, y: GROUND_INSECT_Y,
      tx: x, ty: GROUND_INSECT_Y,
      retarget: 0,
      phase: rand() * Math.PI * 2,
    });
  }
  return arr;
}

function updateInsects(list: Insect[], dt: number, time: number) {
  for (const b of list) {
    b.retarget -= dt;
    if (isGroundInsect(b.kind)) {
      if (b.retarget <= 0) {
        const range = b.kind === "caterpillar" ? 30 : 60;
        b.tx = Math.max(INSECT_AREA_LEFT, Math.min(INSECT_AREA_RIGHT,
          b.x + (Math.random() * 2 - 1) * range));
        b.retarget = 1.5 + Math.random() * 3;
      }
      const speed = b.kind === "ant" ? 22 : b.kind === "beetle" ? 14 : 8;
      const dx = b.tx - b.x;
      if (Math.abs(dx) > 0.5) b.x += Math.sign(dx) * speed * dt;
      b.y = GROUND_INSECT_Y;
      continue;
    }
    if (b.retarget <= 0) {
      // Pick a nearby wander target within the grassland strip.
      const range = b.kind === "dragonfly" ? 90 : 55;
      b.tx = Math.max(INSECT_AREA_LEFT, Math.min(INSECT_AREA_RIGHT,
        b.x + (Math.random() * 2 - 1) * range));
      b.ty = Math.max(INSECT_MIN_Y, Math.min(INSECT_MAX_Y,
        b.y + (Math.random() * 2 - 1) * (range * 0.6)));
      b.retarget = 1.2 + Math.random() * 2.4;
    }
    const speed = b.kind === "dragonfly" ? 55 : b.kind === "firefly" ? 22 : 32;
    const dx = b.tx - b.x;
    const dy = b.ty - b.y;
    const d = Math.hypot(dx, dy) || 1;
    // Butterflies bob on a sine so they never fly in a straight line.
    const bob = b.kind === "butterfly" ? Math.sin(time * 4 + b.phase) * 12 : 0;
    b.x += (dx / d) * speed * dt;
    b.y += (dy / d) * speed * dt + bob * dt;
    if (b.y < INSECT_MIN_Y) b.y = INSECT_MIN_Y;
    if (b.y > INSECT_MAX_Y) b.y = INSECT_MAX_Y;
  }
}

function drawInsects(ctx: CanvasRenderingContext2D, list: Insect[], camX: number, time: number) {
  for (const b of list) {
    const sx = Math.round(b.x - camX);
    if (sx < -6 || sx > VW + 6) continue;
    const sy = Math.round(b.y);
    if (b.kind === "butterfly") {
      const flap = Math.floor(time * 12 + b.phase) % 2 === 0;
      // body
      ctx.fillStyle = "#1a1208";
      ctx.fillRect(sx, sy, 1, 3);
      // wings (flap by shape)
      ctx.fillStyle = b.color;
      if (flap) {
        ctx.fillRect(sx - 2, sy, 2, 2);
        ctx.fillRect(sx + 1, sy, 2, 2);
      } else {
        ctx.fillRect(sx - 1, sy - 1, 1, 3);
        ctx.fillRect(sx + 1, sy - 1, 1, 3);
      }
    } else if (b.kind === "dragonfly") {
      // slim body
      ctx.fillStyle = "#2a3a2a";
      ctx.fillRect(sx, sy, 4, 1);
      // wings shimmer
      const wingFlap = Math.floor(time * 20 + b.phase) % 2 === 0 ? 2 : 1;
      ctx.fillStyle = b.color;
      ctx.fillRect(sx + 1, sy - wingFlap, 2, 1);
      ctx.fillRect(sx + 1, sy + 1, 2, 1);
      // head
      ctx.fillStyle = "#3a5a3a";
      ctx.fillRect(sx + 4, sy, 1, 1);
    } else if (b.kind === "firefly") {
      // firefly — pulsing glow
      const pulse = 0.55 + 0.45 * Math.sin(time * 4 + b.phase);
      ctx.globalAlpha = 0.35 * pulse;
      ctx.fillStyle = b.color;
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
      ctx.globalAlpha = pulse;
      ctx.fillRect(sx, sy, 1, 1);
      ctx.globalAlpha = 1;
    } else if (b.kind === "ant") {
      // tiny 3-segment body, direction follows target
      const dir = b.tx >= b.x ? 1 : -1;
      const wob = Math.floor(time * 14 + b.phase) % 2 === 0 ? 0 : 1;
      ctx.fillStyle = b.color;
      ctx.fillRect(sx, sy - 1, 1, 1);
      ctx.fillRect(sx + dir, sy - 1, 1, 1);
      ctx.fillRect(sx + dir * 2, sy - 1, 1, 1);
      // legs tick
      ctx.fillRect(sx + dir, sy, 1, wob);
    } else if (b.kind === "beetle") {
      // rounded shell with faint highlight
      ctx.fillStyle = b.color;
      ctx.fillRect(sx, sy - 2, 4, 2);
      ctx.fillRect(sx + 1, sy - 3, 2, 1);
      // shell split line
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(sx + 1, sy - 2, 1, 2);
      // tiny legs shuffle
      const step = Math.floor(time * 10 + b.phase) % 2;
      ctx.fillStyle = "#1a1208";
      ctx.fillRect(sx, sy, 1, 1);
      ctx.fillRect(sx + 3, sy, 1, 1);
      if (step) ctx.fillRect(sx + 1, sy, 1, 1);
      else ctx.fillRect(sx + 2, sy, 1, 1);
    } else {
      // caterpillar — soft undulating segments
      const dir = b.tx >= b.x ? 1 : -1;
      const wig = Math.sin(time * 6 + b.phase);
      ctx.fillStyle = b.color;
      for (let i = 0; i < 4; i++) {
        const off = Math.round(Math.sin(time * 6 + b.phase + i * 0.9) * 0.6);
        ctx.fillRect(sx + dir * i, sy - 1 + off, 1, 1);
      }
      // head dot
      ctx.fillStyle = "#3a5a20";
      ctx.fillRect(sx + dir * 3, sy - 1 + (wig > 0 ? 1 : 0), 1, 1);
    }
  }
}

// ---- Revamped wood-themed menu primitives ----
function WoodMenu({
  title,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? "max-w-[760px]" : "max-w-[480px]"} max-h-[92vh] flex flex-col text-[#f4e9c1] font-pixel`}
        style={{
          border: "6px solid #2a1608",
          boxShadow:
            "0 0 0 3px #ffd166 inset, 0 10px 0 rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.6)",
          backgroundImage: `url(${woodPanelBg})`,
          backgroundSize: "320px auto",
          backgroundRepeat: "repeat",
          imageRendering: "pixelated",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background:
              "linear-gradient(#3a1e0c, #2a1608)",
            borderBottom: "4px solid #1a0e05",
            boxShadow: "0 2px 0 #ffd166 inset",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#ffd166] text-lg leading-none">✦</span>
            <h2 className="text-[11px] sm:text-sm tracking-[0.2em] uppercase text-[#ffe6a3]" style={{ textShadow: "2px 2px 0 #000" }}>
              {title}
            </h2>
            <span className="text-[#ffd166] text-lg leading-none">✦</span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 text-[#ffd166] text-sm border-2 border-[#ffd166]/70 bg-[#1a0e05] hover:bg-[#3a1e0c]"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function BuildTile({
  emoji,
  label,
  onClick,
  costs,
}: {
  emoji: string;
  label?: string;
  onClick: () => void;
  costs: { qty: number; kind: SlotIconKind }[];
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-between p-2 pt-3 transition-transform active:translate-y-[2px]"
      style={{
        border: "3px solid #1a0e05",
        boxShadow:
          "0 0 0 2px #c69a67 inset, 0 4px 0 #1a0e05",
        background:
          "linear-gradient(180deg, rgba(58,32,16,0.55), rgba(26,14,5,0.75))",
        minHeight: 140,
      }}
    >
      <div
        className="flex items-center justify-center w-full"
        style={{
          height: 64,
          background: "rgba(10,20,31,0.55)",
          border: "2px solid #6a4020",
          imageRendering: "pixelated",
        }}
      >
        <span className="text-4xl leading-none" style={{ filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.7))" }}>
          {emoji}
        </span>
      </div>
      {label ? (
        <div className="mt-2 text-[9px] sm:text-[10px] tracking-widest uppercase text-[#ffe6a3]" style={{ textShadow: "1px 1px 0 #000" }}>
          {label}
        </div>
      ) : null}
      <div className="mt-1 flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#f4e9c1]">
        {costs.filter((c) => c.qty > 0).map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="text-[#ffd166]">{c.qty}</span>
            <SlotIcon kind={c.kind} size="sm" />
          </span>
        ))}
      </div>
    </button>
  );
}

function CraftTile({
  title,
  thumb,
  costs,
  disabled,
  onClick,
}: {
  title: string;
  thumb: React.ReactNode;
  costs: { qty: number; kind: SlotIconKind; affordable?: boolean }[];
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative flex flex-col items-center justify-between p-2 transition-transform ${disabled ? "cursor-not-allowed" : "active:translate-y-[2px]"}`}
      style={{
        border: "3px solid #1a0e05",
        boxShadow: disabled
          ? "0 0 0 2px #5a3a20 inset"
          : "0 0 0 2px #c69a67 inset, 0 4px 0 #1a0e05",
        background: disabled
          ? "linear-gradient(180deg, rgba(20,12,6,0.85), rgba(8,8,8,0.9))"
          : "linear-gradient(180deg, rgba(58,32,16,0.55), rgba(26,14,5,0.75))",
        filter: disabled ? "brightness(0.72)" : undefined,
        minHeight: 96,
      }}
    >
      <div
        className="flex items-center justify-center w-full"
        style={{
          height: 48,
          background: "rgba(10,20,31,0.55)",
          border: "2px solid #6a4020",
        }}
      >
        {thumb}
      </div>
      <div className="mt-1 flex items-center justify-center flex-wrap gap-x-1.5 text-[10px] text-[#f4e9c1]">
        {costs.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-0.5">
            <span style={{ color: c.affordable === false ? "#e05a4a" : "#ffd166" }}>{c.qty}</span>
            <SlotIcon kind={c.kind} size="sm" />
          </span>
        ))}
      </div>
    </button>
  );
}

// A stone-brick themed modal used by the furnace. Same shape as WoodMenu but
// with cold masonry surfaces, an ember-orange trim and a coal-black title bar
// so the furnace UI reads visually distinct from the wood workbenches.
function StoneMenu({
  title,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  // Procedural stone-brick pattern drawn with layered gradients — no image
  // needed. Two brick rows offset by 32px, with dark mortar lines and
  // subtle stone speckle.
  const stoneBg =
    "repeating-linear-gradient(90deg, transparent 0 63px, rgba(0,0,0,0.55) 63px 65px)," +
    "repeating-linear-gradient(0deg, transparent 0 31px, rgba(0,0,0,0.55) 31px 33px)," +
    "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.5px)," +
    "linear-gradient(180deg, #6b6772 0%, #4a4650 55%, #38343d 100%)";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? "max-w-[760px]" : "max-w-[480px]"} max-h-[92vh] flex flex-col text-[#f4e9c1] font-pixel`}
        style={{
          border: "6px solid #1a1519",
          boxShadow:
            "0 0 0 3px #ff7a3d inset, 0 10px 0 rgba(0,0,0,0.6), 0 0 60px rgba(255,110,40,0.25)",
          backgroundImage: stoneBg,
          backgroundSize: "64px 32px, 64px 32px, 6px 6px, auto",
          imageRendering: "pixelated",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: "linear-gradient(#1a1015, #0a0608)",
            borderBottom: "4px solid #050303",
            boxShadow: "0 2px 0 #ff7a3d inset",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#ff7a3d] text-lg leading-none" style={{ textShadow: "0 0 6px #ff4a10" }}>🔥</span>
            <h2
              className="text-[11px] sm:text-sm tracking-[0.2em] uppercase text-[#ffd1a3]"
              style={{ textShadow: "2px 2px 0 #000, 0 0 6px rgba(255,110,40,0.5)" }}
            >
              {title}
            </h2>
            <span className="text-[#ff7a3d] text-lg leading-none" style={{ textShadow: "0 0 6px #ff4a10" }}>🔥</span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 text-[#ff7a3d] text-sm border-2 border-[#ff7a3d]/70 bg-[#0a0608] hover:bg-[#1a1015]"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

