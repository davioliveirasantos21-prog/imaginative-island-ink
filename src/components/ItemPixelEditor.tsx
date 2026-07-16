import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  ITEM_GRID,
  SKIN_HI,
  SKIN_LO,
  SKIN_MID,
  isSkinMarker,
  resolveItemPixelColor,
  type ItemPixels,
} from "@/lib/items";
import { shade } from "@/lib/appearance";

/** Reference skin used to render skin-sentinel pixels inside the editor
 *  (the actual player skin is applied at draw time in the game). */
const EDITOR_SKIN = "#e0a880";
const resolveForDisplay = (c: string) => resolveItemPixelColor(c, EDITOR_SKIN, shade);

const DEFAULT_CELL = 20;
const DEFAULT_SWATCHES = [
  // Neutrals
  "#000000", "#1a1a1a", "#2a2a2a", "#4a4a54", "#8a8a94", "#c0c0c8", "#e8e8ee", "#ffffff",
  // Skin / hair browns
  "#3a2010", "#5f3a1c", "#7a4a24", "#a06a34", "#c78a3a", "#e2b48c", "#f4d1a6", "#f8e0c0",
  // Reds / pinks
  "#4a0e0e", "#7a1a1a", "#c94b4b", "#e94560", "#ff6b6b", "#ff8fa3", "#ffb3c1", "#ffd6de",
  // Oranges / yellows
  "#8a3a00", "#c46a1a", "#e8933a", "#ffb347", "#ffd166", "#ffe08a", "#fff2b0", "#fffbd0",
  // Greens
  "#0e2a10", "#2f5a24", "#3a7a3a", "#5aa84a", "#8ed36a", "#b6e58a", "#3ac2a0", "#8ef0d0",
  // Blues / cyans
  "#0d1b2a", "#183a5a", "#3b6fb0", "#4aa3df", "#7ac6f0", "#a8e0ff", "#2fbfae", "#5adcd0",
  // Purples / magentas
  "#2a0e3a", "#4a2070", "#7a3fb0", "#a86adf", "#c98af0", "#e0a8ff", "#c94ba8", "#e94b9e",
  // Earthy accents
  "#3a2010", "#5f3a1c", "#7a5432", "#a07a4a", "#c9a870", "#d4b384", "#f4e9c1", "#e8dbb0",
];

// ---------- HSL helpers for the hue/lightness sliders ----------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3
    ? h.split("").map((c) => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return [v[0] || 0, v[1] || 0, v[2] || 0];
}
function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export type ItemPixelEditorProps = {
  title: string;
  /** Initial pixel map when editing an existing override. */
  initial?: ItemPixels;
  /** Optional PNG shown behind the grid so the admin can trace it. */
  referenceUrl?: string;
  /** Grid dimensions. Defaults to the 16×16 icon grid. */
  gridW?: number;
  gridH?: number;
  onSave: (pixels: ItemPixels) => void;
  onClose: () => void;
};

/**
 * Pixel editor for hotbar items. Unlike the character editor, items use a
 * freeform palette of hex colors, so we expose a native color picker + a
 * palette of recently used colors. Grid size is configurable so the "held"
 * variant can use a taller canvas that fits the full tool + shaft.
 */
export function ItemPixelEditor({
  title,
  initial,
  referenceUrl,
  gridW = ITEM_GRID,
  gridH = ITEM_GRID,
  onSave,
  onClose,
}: ItemPixelEditorProps) {
  const { t } = useI18n();
  const [pixels, setPixels] = useState<ItemPixels>(() => ({ ...(initial ?? {}) }));
  const [color, setColor] = useState<string>("#c78a3a");
  const [tool, setTool] = useState<"paint" | "erase" | "pick" | "move">("paint");
  const [hue, setHue] = useState<number>(() => {
    const [r, g, b] = hexToRgb("#c78a3a");
    return Math.round(rgbToHsl(r, g, b)[0]);
  });
  const [lightness, setLightness] = useState<number>(() => {
    const [r, g, b] = hexToRgb("#c78a3a");
    return Math.round(rgbToHsl(r, g, b)[2] * 100);
  });
  const [saturation, setSaturation] = useState<number>(() => {
    const [r, g, b] = hexToRgb("#c78a3a");
    return Math.round(rgbToHsl(r, g, b)[1] * 100);
  });

  // When hue/lightness/saturation change, update color.
  const setHSL = (h: number, s: number, l: number) => {
    setHue(h); setSaturation(s); setLightness(l);
    setColor(hslToHex(h, s / 100, l / 100));
    setTool("paint");
  };
  // Sync sliders when a swatch/eyedrop sets color externally.
  const pickColor = (hex: string) => {
    if (isSkinMarker(hex)) { setColor(hex); setTool("paint"); return; }
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    setHue(Math.round(h));
    setSaturation(Math.round(s * 100));
    setLightness(Math.round(l * 100));
    setColor(hex);
    setTool("paint");
  };
  const [painting, setPainting] = useState(false);
  const [showRef, setShowRef] = useState(true);

  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const usedColors = useMemo(() => {
    const set = new Set<string>();
    for (const c of Object.values(pixels)) set.add(c.toLowerCase());
    return Array.from(set);
  }, [pixels]);

  const swatches = useMemo(() => {
    const merged = new Set<string>([...DEFAULT_SWATCHES.map((c) => c.toLowerCase()), ...usedColors]);
    return Array.from(merged);
  }, [usedColors]);

  useEffect(() => {
    const c = previewRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    // Checker background so transparent pixels are visible in the preview.
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#101820" : "#0a141f";
        ctx.fillRect(x, y, 1, 1);
      }
    }
    for (const [k, col] of Object.entries(pixels)) {
      const [x, y] = k.split(",").map(Number);
      ctx.fillStyle = resolveForDisplay(col);
      ctx.fillRect(x, y, 1, 1);
    }
  }, [pixels, gridW, gridH]);

  const applyPixel = (x: number, y: number, forceErase = false) => {
    if (x < 0 || x >= gridW || y < 0 || y >= gridH) return;
    if (!forceErase && tool === "pick") {
      const k = `${x},${y}`;
      const existing = pixels[k];
      if (existing) pickColor(existing);
      return;
    }
    setPixels((prev) => {
      const next = { ...prev };
      const k = `${x},${y}`;
      if (forceErase || tool === "erase") delete next[k];
      else next[k] = color;
      return next;
    });
  };

  const onCellDown = (x: number, y: number, e: React.PointerEvent) => {
    e.preventDefault();
    if (tool === "move") return;
    setPainting(true);
    applyPixel(x, y, e.button === 2);
  };
  const onCellEnter = (x: number, y: number, e: React.PointerEvent) => {
    if (tool === "move") return;
    if (!painting) return;
    if ((e.buttons & 2) === 2) applyPixel(x, y, true);
    else if ((e.buttons & 1) === 1) applyPixel(x, y);
  };
  const shiftPixels = (dx: number, dy: number) => {
    setPixels((prev) => {
      const next: ItemPixels = {};
      for (const [k, v] of Object.entries(prev)) {
        const [x, y] = k.split(",").map(Number);
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
          next[`${nx},${ny}`] = v;
        }
      }
      return next;
    });
  };

  // Cell size scales down for larger grids so the canvas still fits on screen.
  const isLarge = gridW > 40 || gridH > 40;
  const CELL = isLarge ? 8 : gridH > 20 ? 14 : DEFAULT_CELL;
  const gridPxW = gridW * CELL;
  const gridPxH = gridH * CELL;
  const isEmpty = Object.keys(pixels).length === 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/85 p-4 font-pixel text-[#f4e9c1]"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`flex max-h-[95vh] w-full ${isLarge ? "max-w-6xl" : "max-w-3xl"} flex-col border-4 border-[#f4e9c1] bg-[#1b2a3a]`}
        style={{ boxShadow: "0 8px 0 #0a141f" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-4 border-[#f4e9c1]/20 px-4 py-2">
          <h2 className="text-xs tracking-widest text-[#ffd166]">{title}</h2>
          <button
            onClick={onClose}
            className="border-2 border-[#f4e9c1]/40 px-2 py-1 text-[10px] hover:border-[#e94560]"
          >
            {t("editor.close")}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-4 overflow-auto p-4">
          <div className="flex w-52 shrink-0 flex-col gap-3 text-[10px]">
            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">
                {t("editor.tool")}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["paint", "erase", "pick", "move"] as const).map((tl) => (
                  <button
                    key={tl}
                    onClick={() => setTool(tl)}
                    title={tl === "pick" ? "Conta-gotas" : undefined}
                    className={`border-2 py-1 uppercase ${
                      tool === tl
                        ? "border-[#ffd166] bg-[#ffd166]/10"
                        : "border-[#f4e9c1]/30"
                    }`}
                  >
                    {tl === "pick" ? "🎯" : t(`editor.tool.${tl}`)}
                  </button>
                ))}
              </div>
              {tool === "move" && (
                <div className="mt-2">
                  <div className="mb-1 text-[9px] uppercase tracking-widest text-[#f4e9c1]/50">
                    {t("editor.move")}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div />
                    <button
                      onClick={() => shiftPixels(0, -1)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ▲
                    </button>
                    <div />
                    <button
                      onClick={() => shiftPixels(-1, 0)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => shiftPixels(0, 1)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => shiftPixels(1, 0)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">
                {t("itemEditor.hand")}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: SKIN_HI, label: t("itemEditor.hand.light") },
                  { key: SKIN_MID, label: t("itemEditor.hand.mid") },
                  { key: SKIN_LO, label: t("itemEditor.hand.dark") },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setColor(key);
                      setTool("paint");
                    }}
                    title={label}
                    className={`flex h-8 items-end justify-center border-2 pb-0.5 text-[8px] uppercase text-[#0a141f] ${
                      key === color.toLowerCase()
                        ? "border-[#ffd166]"
                        : "border-[#f4e9c1]/30"
                    }`}
                    style={{ background: resolveForDisplay(key) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[9px] leading-tight text-[#f4e9c1]/50">
                {t("itemEditor.hand.hint")}
              </p>
            </div>

            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">
                {t("editor.color")}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 border-2 border-[#f4e9c1]/30"
                  style={{ background: isSkinMarker(color) ? resolveForDisplay(color) : color }}
                />
                <input
                  type="color"
                  value={isSkinMarker(color) ? "#c78a3a" : color}
                  onChange={(e) => pickColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer border-2 border-[#f4e9c1]/30 bg-transparent"
                  title="Escolher cor"
                />
                <button
                  onClick={() => setTool("pick")}
                  title="Conta-gotas: clique num pixel pintado para copiar a cor"
                  className={`h-10 w-10 border-2 text-base ${
                    tool === "pick" ? "border-[#ffd166] bg-[#ffd166]/10" : "border-[#f4e9c1]/30"
                  }`}
                >
                  🎯
                </button>
                <span className="text-[10px] tracking-widest text-[#f4e9c1]/70">
                  {isSkinMarker(color) ? t("itemEditor.hand") : color.toUpperCase()}
                </span>
              </div>

              {/* Hue bar — full rainbow */}
              <div className="mt-2">
                <div className="mb-0.5 text-[9px] uppercase tracking-widest text-[#f4e9c1]/50">Matiz</div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={hue}
                  onChange={(e) => setHSL(Number(e.target.value), saturation, lightness)}
                  className="h-4 w-full cursor-pointer appearance-none border-2 border-[#f4e9c1]/30"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                />
              </div>

              {/* Saturation bar — gray to full color at current hue */}
              <div className="mt-2">
                <div className="mb-0.5 text-[9px] uppercase tracking-widest text-[#f4e9c1]/50">Saturação</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={saturation}
                  onChange={(e) => setHSL(hue, Number(e.target.value), lightness)}
                  className="h-4 w-full cursor-pointer appearance-none border-2 border-[#f4e9c1]/30"
                  style={{
                    background: `linear-gradient(to right, ${hslToHex(hue, 0, lightness / 100)}, ${hslToHex(hue, 1, lightness / 100)})`,
                  }}
                />
              </div>

              {/* Lightness bar — black to color to white */}
              <div className="mt-2">
                <div className="mb-0.5 text-[9px] uppercase tracking-widest text-[#f4e9c1]/50">Claridade</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={lightness}
                  onChange={(e) => setHSL(hue, saturation, Number(e.target.value))}
                  className="h-4 w-full cursor-pointer appearance-none border-2 border-[#f4e9c1]/30"
                  style={{
                    background: `linear-gradient(to right, #000, ${hslToHex(hue, saturation / 100, 0.5)}, #fff)`,
                  }}
                />
              </div>

              <div className="mt-2 grid grid-cols-8 gap-1">
                {swatches.filter((c) => !isSkinMarker(c)).map((c) => (
                  <button
                    key={c}
                    onClick={() => pickColor(c)}
                    title={c}
                    className={`h-6 w-6 border-2 ${
                      c.toLowerCase() === color.toLowerCase()
                        ? "border-[#ffd166]"
                        : "border-[#f4e9c1]/30"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {referenceUrl && (
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#f4e9c1]/70">
                  <input
                    type="checkbox"
                    checked={showRef}
                    onChange={(e) => setShowRef(e.target.checked)}
                  />
                  {t("itemEditor.showReference")}
                </label>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <button
                onClick={() => setPixels({})}
                className="border-2 border-[#e94560] py-1 text-[10px] uppercase text-[#e94560]"
              >
                {t("editor.clearAll")}
              </button>
              <button
                onClick={() => onSave(pixels)}
                disabled={isEmpty}
                className="border-2 border-[#ffd166] bg-[#ffd166]/10 py-2 text-[10px] uppercase text-[#ffd166] disabled:opacity-40"
              >
                {t("editor.save")}
              </button>
            </div>

            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">
                {t("itemEditor.preview")}
              </div>
              <canvas
                ref={previewRef}
                width={gridW}
                height={gridH}
                className="border-2 border-[#f4e9c1]/30"
                style={{
                  imageRendering: "pixelated",
                  width: 64,
                  height: 64 * (gridH / gridW),
                }}
              />
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center">
            <div
              className="relative shrink-0 border-2 border-[#f4e9c1]/40 bg-[#0a141f]"
              style={{ width: gridPxW, height: gridPxH }}
              onPointerUp={() => setPainting(false)}
              onPointerLeave={() => setPainting(false)}
            >
              {referenceUrl && showRef && (
                <img
                  src={referenceUrl}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
                  style={{ imageRendering: "pixelated", objectFit: "contain" }}
                />
              )}
              <div
                className="relative grid"
                style={{
                  gridTemplateColumns: `repeat(${gridW}, ${CELL}px)`,
                  gridTemplateRows: `repeat(${gridH}, ${CELL}px)`,
                }}
              >
                {Array.from({ length: gridW * gridH }).map((_, i) => {
                  const x = i % gridW;
                  const y = Math.floor(i / gridW);
                  const k = `${x},${y}`;
                  const cell = pixels[k];
                  return (
                    <div
                      key={k}
                      onPointerDown={(e) => onCellDown(x, y, e)}
                      onPointerEnter={(e) => onCellEnter(x, y, e)}
                      className="border border-[#f4e9c1]/10"
                      style={{
                        width: CELL,
                        height: CELL,
                        background: cell ? resolveForDisplay(cell) : "transparent",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
