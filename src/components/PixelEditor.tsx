import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  drawCharacter,
  resolveLocalizedName,
  shade,
  SPRITE_H,
  SPRITE_W,
  type Appearance,
  type LocalizedName,
  type PixelTone,
} from "@/lib/appearance";

type Layer = "back" | "front";
type PixelMap = Record<string, PixelTone>;
type EditorState = { back: PixelMap; front: PixelMap };

const GRID_W = SPRITE_W;
const GRID_H = SPRITE_H; // full 32 so clothes on legs can be drawn too
const CELL = 18;
const PRIMARY_TONES: PixelTone[] = ["dark", "mid", "light"];
const SECONDARY_TONES: PixelTone[] = ["dark2", "mid2", "light2"];
const TERTIARY_TONES: PixelTone[] = ["dark3", "mid3", "light3"];
const ALL_TONES: PixelTone[] = [...PRIMARY_TONES, ...SECONDARY_TONES, ...TERTIARY_TONES];
const keyOf = (x: number, y: number) => `${x},${y}`;

function sanitize(m: unknown, allowSecondary: boolean): PixelMap {
  if (!m || typeof m !== "object") return {};
  const out: PixelMap = {};
  const allowed = (allowSecondary ? ALL_TONES : PRIMARY_TONES) as string[];
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v === "string" && allowed.includes(v)) {
      out[k] = v as PixelTone;
    }
  }
  return out;
}


function loadScratch(key: string | undefined): EditorState {
  if (!key || typeof window === "undefined") return { back: {}, front: {} };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { back: {}, front: {} };
    const p = JSON.parse(raw);
    return { back: sanitize(p.back, true), front: sanitize(p.front, true) };
  } catch {
    return { back: {}, front: {} };
  }
}

function saveScratch(key: string | undefined, s: EditorState) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export type PixelEditorProps = {
  title: string;
  appearance: Appearance;
  /** Editor preview: hide shirt (torso/sleeves) or pants when drawing them. */
  hideShirt?: boolean;
  hidePants?: boolean;
  /** Base color for the tone palette (dark = -0.3, mid = base, light = +0.22). */
  paletteBase: string;
  /** Optional callback so parent can offer a color picker beside the palette. */
  onPaletteBaseChange?: (v: string) => void;
  paletteChoices?: string[];
  /** When set, editor shows a second palette row so pixels can use a secondary color. */
  allowSecondary?: boolean;
  secondaryBase?: string;
  onSecondaryBaseChange?: (v: string) => void;
  paletteChoicesSecondary?: string[];
  /** When set, editor also exposes a "+" toggle for a tertiary color palette. */
  allowTertiary?: boolean;
  tertiaryBase?: string;
  onTertiaryBaseChange?: (v: string) => void;
  paletteChoicesTertiary?: string[];
  /** Initial pixels + name when editing an existing item. */
  initial?: { name: LocalizedName; back: PixelMap; front: PixelMap };
  /** localStorage key for scratch draft (skip when editing). */
  scratchKey?: string;
  /** Extra rows above y=0 to accommodate tall hair (mohawk, afro). */
  padTop?: number;
  onSave: (name: LocalizedName, back: PixelMap, front: PixelMap) => void;
  onClose: () => void;
};

export function PixelEditor({
  title,
  appearance,
  hideShirt,
  hidePants,
  paletteBase,
  onPaletteBaseChange,
  paletteChoices,
  allowSecondary,
  secondaryBase,
  onSecondaryBaseChange,
  paletteChoicesSecondary,
  allowTertiary,
  tertiaryBase,
  onTertiaryBaseChange,
  paletteChoicesTertiary,
  initial,
  scratchKey,
  padTop = 0,
  onSave,
  onClose,
}: PixelEditorProps) {
  const { t: tr } = useI18n();
  const [state, setState] = useState<EditorState>(() =>
    initial
      ? { back: { ...initial.back }, front: { ...initial.front } }
      : loadScratch(scratchKey),
  );
  const [layer, setLayer] = useState<Layer>("front");
  const [tool, setTool] = useState<"paint" | "erase" | "move">("paint");
  const [tone, setTone] = useState<PixelTone>("mid");
  const initialName = initial?.name;
  const [namePt, setNamePt] = useState(
    typeof initialName === "string"
      ? initialName
      : (initialName?.pt ?? ""),
  );
  const [nameEn, setNameEn] = useState(
    typeof initialName === "string" ? "" : (initialName?.en ?? ""),
  );
  const [nameEs, setNameEs] = useState(
    typeof initialName === "string" ? "" : (initialName?.es ?? ""),
  );
  const [saving, setSaving] = useState(false);
  const [painting, setPainting] = useState(false);
  // Tertiary palette is hidden until user clicks the "+" — but auto-shown if
  // the loaded pixels already contain tertiary tones.
  const [showTertiary, setShowTertiary] = useState(() => {
    if (!initial) return false;
    const has = (m: Record<string, string>) =>
      Object.values(m).some((v) => v === "dark3" || v === "mid3" || v === "light3");
    return has(initial.back) || has(initial.front);
  });

  const secBase = secondaryBase ?? paletteBase;
  const terBase = tertiaryBase ?? secBase;
  const palette = useMemo(
    () =>
      ({
        dark: shade(paletteBase, -0.3),
        mid: paletteBase,
        light: shade(paletteBase, 0.22),
        dark2: shade(secBase, -0.3),
        mid2: secBase,
        light2: shade(secBase, 0.22),
        dark3: shade(terBase, -0.3),
        mid3: terBase,
        light3: shade(terBase, 0.22),
      }) as Record<PixelTone, string>,
    [paletteBase, secBase, terBase],
  );

  useEffect(() => {
    if (!initial) saveScratch(scratchKey, state);
  }, [state, initial, scratchKey]);

  const refCanvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = refCanvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    drawCharacter(ctx, 0, padTop, appearance, { hideShirt, hidePants });
  }, [appearance, hideShirt, hidePants, padTop]);

  // Pixel coords span [-padTop, GRID_H). Grid rows are 0..(GRID_H+padTop-1)
  // and map to y = row - padTop.
  const totalRows = GRID_H + padTop;
  const applyPixel = (x: number, y: number) => {
    if (x < 0 || x >= GRID_W || y < -padTop || y >= GRID_H) return;
    setState((prev) => {
      const map = { ...prev[layer] };
      const k = keyOf(x, y);
      if (tool === "erase") delete map[k];
      else map[k] = tone;
      return { ...prev, [layer]: map };
    });
  };

  const onCellDown = (x: number, y: number, e: React.PointerEvent) => {
    e.preventDefault();
    if (tool === "move") return;
    setPainting(true);
    if (e.button === 2) {
      setState((p) => {
        const m = { ...p[layer] };
        delete m[keyOf(x, y)];
        return { ...p, [layer]: m };
      });
      return;
    }
    applyPixel(x, y);
  };
  const onCellEnter = (x: number, y: number, e: React.PointerEvent) => {
    if (tool === "move") return;
    if (!painting) return;
    if ((e.buttons & 2) === 2) {
      setState((p) => {
        const m = { ...p[layer] };
        delete m[keyOf(x, y)];
        return { ...p, [layer]: m };
      });
      return;
    }
    if ((e.buttons & 1) === 1) applyPixel(x, y);
  };
  const shiftLayer = (dx: number, dy: number) => {
    setState((prev) => {
      const map = prev[layer];
      const next: PixelMap = {};
      for (const [k, v] of Object.entries(map)) {
        const [x, y] = k.split(",").map(Number);
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_W && ny >= -padTop && ny < GRID_H) {
          next[keyOf(nx, ny)] = v;
        }
      }
      return { ...prev, [layer]: next };
    });
  };

  const clearLayer = (l: Layer) => setState((p) => ({ ...p, [l]: {} }));

  const isEmpty =
    Object.keys(state.back).length === 0 && Object.keys(state.front).length === 0;

  const trimmedPt = namePt.trim();
  const trimmedEn = nameEn.trim();
  const trimmedEs = nameEs.trim();
  const hasAnyName = !!(trimmedPt || trimmedEn || trimmedEs);

  const handleSave = () => {
    if (!hasAnyName || isEmpty) return;
    const obj: { pt?: string; en?: string; es?: string } = {};
    if (trimmedPt) obj.pt = trimmedPt;
    if (trimmedEn) obj.en = trimmedEn;
    if (trimmedEs) obj.es = trimmedEs;
    onSave(obj, state.back, state.front);
    setSaving(false);
  };

  const gridW = GRID_W * CELL;
  const gridH = totalRows * CELL;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/85 p-4 font-pixel text-[#f4e9c1]"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-4xl flex-col border-4 border-[#f4e9c1] bg-[#1b2a3a]"
        style={{ boxShadow: "0 8px 0 #0a141f" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-4 border-[#f4e9c1]/20 px-4 py-2">
          <h2 className="text-xs tracking-widest text-[#ffd166]">{title}</h2>
          <button
            onClick={onClose}
            className="border-2 border-[#f4e9c1]/40 px-2 py-1 text-[10px] hover:border-[#e94560]"
          >
            {tr("editor.close")}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-4 overflow-y-auto p-4">
          <div className="flex w-44 shrink-0 flex-col gap-3 text-[10px]">
            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">{tr("editor.layer")}</div>
              <div className="grid grid-cols-2 gap-1">
                {(["back", "front"] as Layer[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayer(l)}
                    className={`border-2 py-1 uppercase ${
                      layer === l
                        ? "border-[#ffd166] bg-[#ffd166]/10"
                        : "border-[#f4e9c1]/30"
                    }`}
                  >
                    {tr(`editor.layer.${l}`)}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[9px] text-[#f4e9c1]/50">
                {tr("editor.layer.hint")}<br />{tr("editor.layer.hint2")}
              </div>
            </div>

            <div>
              <div className="mb-1 tracking-widest text-[#f4e9c1]/60">{tr("editor.tool")}</div>
              <div className="grid grid-cols-3 gap-1">
                {(["paint", "erase", "move"] as const).map((tl) => (
                  <button
                    key={tl}
                    onClick={() => setTool(tl)}
                    className={`border-2 py-1 uppercase ${
                      tool === tl
                        ? "border-[#ffd166] bg-[#ffd166]/10"
                        : "border-[#f4e9c1]/30"
                    }`}
                  >
                    {tr(`editor.tool.${tl}`)}
                  </button>
                ))}
              </div>
              {tool === "move" && (
                <div className="mt-2">
                  <div className="mb-1 text-[9px] uppercase tracking-widest text-[#f4e9c1]/50">
                    {tr("editor.move")}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div />
                    <button
                      onClick={() => shiftLayer(0, -1)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ▲
                    </button>
                    <div />
                    <button
                      onClick={() => shiftLayer(-1, 0)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => shiftLayer(0, 1)}
                      className="border-2 border-[#f4e9c1]/30 py-1 text-[#f4e9c1] hover:border-[#ffd166]"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => shiftLayer(1, 0)}
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
                {allowSecondary ? tr("editor.primary") : tr("editor.color")}
              </div>
              <div className="flex flex-wrap gap-1">
                {PRIMARY_TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTone(t);
                      setTool("paint");
                    }}
                    title={t}
                    className={`h-8 w-8 border-2 ${
                      tone === t && tool === "paint"
                        ? "border-[#ffd166]"
                        : "border-[#f4e9c1]/30"
                    }`}
                    style={{ background: palette[t] }}
                  />
                ))}
              </div>
              {paletteChoices && onPaletteBaseChange && (
                <>
                  <div className="mt-2 text-[9px] text-[#f4e9c1]/50">{tr("editor.base")}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {paletteChoices.map((c) => (
                      <button
                        key={c}
                        onClick={() => onPaletteBaseChange(c)}
                        className={`h-5 w-5 border-2 ${
                          c === paletteBase ? "border-[#ffd166]" : "border-[#f4e9c1]/30"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </>
              )}

              {allowSecondary && (
                <div className="mt-3">
                  <div className="mb-1 tracking-widest text-[#f4e9c1]/60">
                    {tr("editor.secondary")}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {SECONDARY_TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTone(t);
                          setTool("paint");
                        }}
                        title={t}
                        className={`h-8 w-8 border-2 ${
                          tone === t && tool === "paint"
                            ? "border-[#ffd166]"
                            : "border-[#f4e9c1]/30"
                        }`}
                        style={{ background: palette[t] }}
                      />
                    ))}
                  </div>
                  {paletteChoicesSecondary && onSecondaryBaseChange && (
                    <>
                      <div className="mt-2 text-[9px] text-[#f4e9c1]/50">{tr("editor.base2")}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {paletteChoicesSecondary.map((c) => (
                          <button
                            key={c}
                            onClick={() => onSecondaryBaseChange(c)}
                            className={`h-5 w-5 border-2 ${
                              c === secBase
                                ? "border-[#ffd166]"
                                : "border-[#f4e9c1]/30"
                            }`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {allowTertiary && !showTertiary && (
                <button
                  onClick={() => setShowTertiary(true)}
                  title={tr("editor.addTertiary")}
                  className="mt-3 border-2 border-dashed border-[#f4e9c1]/40 px-2 py-1 text-[10px] uppercase text-[#f4e9c1]/70 hover:border-[#ffd166] hover:text-[#ffd166]"
                >
                  {tr("editor.addColor")}
                </button>
              )}

              {allowTertiary && showTertiary && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between tracking-widest text-[#f4e9c1]/60">
                    <span>{tr("editor.tertiary")}</span>
                    <button
                      onClick={() => {
                        setShowTertiary(false);
                        if (tone === "dark3" || tone === "mid3" || tone === "light3") {
                          setTone("mid");
                        }
                      }}
                      title={tr("editor.removeTertiary")}
                      className="border border-[#f4e9c1]/40 px-1 text-[10px] leading-none text-[#f4e9c1]/70 hover:border-[#e94560] hover:text-[#e94560]"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {TERTIARY_TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTone(t);
                          setTool("paint");
                        }}
                        title={t}
                        className={`h-8 w-8 border-2 ${
                          tone === t && tool === "paint"
                            ? "border-[#ffd166]"
                            : "border-[#f4e9c1]/30"
                        }`}
                        style={{ background: palette[t] }}
                      />
                    ))}
                  </div>
                  {paletteChoicesTertiary && onTertiaryBaseChange && (
                    <>
                      <div className="mt-2 text-[9px] text-[#f4e9c1]/50">{tr("editor.base3")}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {paletteChoicesTertiary.map((c) => (
                          <button
                            key={c}
                            onClick={() => onTertiaryBaseChange(c)}
                            className={`h-5 w-5 border-2 ${
                              c === terBase
                                ? "border-[#ffd166]"
                                : "border-[#f4e9c1]/30"
                            }`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => clearLayer(layer)}
                className="border-2 border-[#e94560] py-1 text-[10px] uppercase text-[#e94560]"
              >
                {tr("editor.clearLayer", { layer: tr(`editor.layer.${layer}`) })}
              </button>
              <button
                onClick={() => {
                  clearLayer("back");
                  clearLayer("front");
                }}
                className="border-2 border-[#e94560] py-1 text-[10px] uppercase text-[#e94560]"
              >
                {tr("editor.clearAll")}
              </button>
              <button
                onClick={() => setSaving(true)}
                disabled={isEmpty}
                className="mt-2 border-2 border-[#ffd166] bg-[#ffd166] py-2 text-[10px] uppercase text-[#0d1b2a] disabled:opacity-40"
              >
                {tr("editor.save")}
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-3">
            <div
              className="relative select-none"
              style={{ width: gridW, height: gridH }}
              onPointerUp={() => setPainting(false)}
              onPointerLeave={() => setPainting(false)}
            >
              <div className="pointer-events-none absolute inset-0">
                {Object.entries(state.back).map(([k, c]) => {
                  const [x, y] = k.split(",").map(Number);
                  return (
                    <div
                      key={`b-${k}`}
                      className="absolute"
                      style={{
                        left: x * CELL,
                        top: (y + padTop) * CELL,
                        width: CELL,
                        height: CELL,
                        background: palette[c],
                        opacity: layer === "back" ? 1 : 0.55,
                      }}
                    />
                  );
                })}
              </div>
              <canvas
                ref={refCanvas}
                width={SPRITE_W}
                height={SPRITE_H + padTop}
                className="pointer-events-none absolute left-0"
                style={{
                  top: 0,
                  width: SPRITE_W * CELL,
                  height: (SPRITE_H + padTop) * CELL,
                  imageRendering: "pixelated",
                }}
              />
              <div className="pointer-events-none absolute inset-0">
                {Object.entries(state.front).map(([k, c]) => {
                  const [x, y] = k.split(",").map(Number);
                  return (
                    <div
                      key={`f-${k}`}
                      className="absolute"
                      style={{
                        left: x * CELL,
                        top: (y + padTop) * CELL,
                        width: CELL,
                        height: CELL,
                        background: palette[c],
                        opacity: layer === "front" ? 1 : 0.55,
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_W}, ${CELL}px)`,
                  gridTemplateRows: `repeat(${totalRows}, ${CELL}px)`,
                }}
              >
                {Array.from({ length: GRID_W * totalRows }).map((_, i) => {
                  const x = i % GRID_W;
                  const row = Math.floor(i / GRID_W);
                  const y = row - padTop;
                  return (
                    <div
                      key={i}
                      onPointerDown={(e) => onCellDown(x, y, e)}
                      onPointerEnter={(e) => onCellEnter(x, y, e)}
                      onContextMenu={(e) => e.preventDefault()}
                      className={
                        y < 0
                          ? "border border-[#f4e9c1]/5 hover:border-[#ffd166]/40"
                          : "border border-[#f4e9c1]/10 hover:border-[#ffd166]/60"
                      }
                      style={{ width: CELL, height: CELL }}
                    />
                  );
                })}
              </div>
            </div>

            {saving && (
              <div className="w-full border-2 border-[#ffd166] bg-[#0d1b2a] p-3">
                <div className="mb-2 text-[10px] tracking-widest text-[#ffd166]">
                  {tr("editor.name")}
                </div>
                <div className="mb-2 text-[9px] text-[#f4e9c1]/60">
                  {tr("editor.nameHint")}
                </div>
                {(
                  [
                    ["pt", namePt, setNamePt] as const,
                    ["en", nameEn, setNameEn] as const,
                    ["es", nameEs, setNameEs] as const,
                  ] as const
                ).map(([code, value, setter]) => (
                  <div key={code} className="mb-2 flex items-center gap-2">
                    <span className="w-6 text-[10px] tracking-widest text-[#ffd166]">
                      {tr(
                        code === "pt"
                          ? "editor.namePt"
                          : code === "en"
                            ? "editor.nameEn"
                            : "editor.nameEs",
                      )}
                    </span>
                    <input
                      autoFocus={code === "pt"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") setSaving(false);
                      }}
                      maxLength={20}
                      className="w-full border-2 border-[#f4e9c1]/40 bg-[#0d1b2a] px-2 py-1 text-xs text-[#f4e9c1] outline-none focus:border-[#ffd166]"
                    />
                  </div>
                ))}
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSaving(false)}
                    className="border-2 border-[#f4e9c1]/40 px-3 py-1 text-[10px] uppercase"
                  >
                    {tr("editor.cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasAnyName}
                    className="border-2 border-[#ffd166] bg-[#ffd166] px-3 py-1 text-[10px] uppercase text-[#0d1b2a] disabled:opacity-40"
                  >
                    {tr("editor.saveBtn")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
