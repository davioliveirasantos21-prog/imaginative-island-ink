import { useEffect, useState } from "react";
import {
  BEARD_STYLES,
  DEFAULT_APPEARANCE,
  HAIR_COLORS,
  HAIR_STYLES,
  FULLBODY_SHIRT_STYLES,
  PANTS_COLORS,
  PANTS_STYLES,
  SHIRT_COLORS,

  TORSO_SHIRT_STYLES,
  addCustomGarment,
  addCustomHair,
  deleteBeardOverride,
  deleteCustomGarment,
  deleteCustomHair,
  deleteHairOverride,
  deletePantsOverride,
  deleteShirtOverride,
  getBeardOverride,
  getBeardOverrideRawName,
  getHairOverride,
  getHairOverrideRawName,
  getPantsOverride,
  getPantsOverrideRawName,
  getShirtOverride,
  getShirtOverrideRawName,
  loadBeardOverrides,
  loadCustomGarments,
  loadCustomHairs,
  loadHairOverrides,
  loadPantsOverrides,
  loadShirtOverrides,
  rasterizeBuiltinBeard,
  rasterizeBuiltinHair,
  rasterizeBuiltinPants,
  rasterizeBuiltinShirt,
  getLocalizedNameForLang,
  resolveLocalizedName,
  saveBeardOverride,
  savePantsOverride,
  saveHairOverride,
  saveShirtOverride,
  updateCustomGarment,
  updateCustomHair,
  type Appearance,
  type BeardStyle,
  type BeardStyleOverrides,
  type BodyType,
  type CustomGarment,
  type CustomHair,
  type GarmentBody,
  type GarmentSlot,
  type HairStyle,
  type HairStyleOverrides,
  type LocalizedName,
  type PantsStyle,
  type PantsStyleOverrides,
  type ShirtStyle,
  type ShirtStyleOverrides,
  type HairPixels,
  type PixelTone,
} from "@/lib/appearance";
import { PixelEditor } from "@/components/PixelEditor";
import { ItemPixelEditor } from "@/components/ItemPixelEditor";
import {
  ITEM_KINDS,
  ITEM_VARIANTS,
  clearAllCustomizations,
  deleteItemOverride,
  deleteItemVariant,
  getItemOverride,
  getVariantGrid,
  loadItemOverrides,
  renderItemPixelsToDataURL,
  saveItemVariant,
  itemNameKey,
  type ItemKind,
  type ItemOverrides,
  type ItemPixels,
  type ItemVariant,
} from "@/lib/items";
import {
  captureHeldDefaultPixels,
  isHeldToolKind,
} from "@/lib/held-defaults";
import { captureIconDefaultPixels } from "@/lib/item-icon-defaults";
import {
  captureBuildDefaultPixels,
  captureCaveDefaultPixels,
  clearAllScenery,
  deleteSceneryOverride,
  getSceneryGrid,
  getSceneryOverride,
  loadSceneryOverrides,
  saveSceneryOverride,
  SCENERY_KINDS,
  sceneryNameKey,
  type SceneryKind,
  type SceneryOverrides,
} from "@/lib/scenery";
import { dictionaries, useI18n, type Lang } from "@/lib/i18n";

/**
 * Build a LocalizedName {pt,en,es} from an i18n key so the admin editor
 * always prefills each language with its translated default label.
 */
function defaultLocalizedFromKey(key: string): { pt: string; en: string; es: string } {
  return {
    pt: dictionaries.pt[key] ?? key,
    en: dictionaries.en[key] ?? key,
    es: dictionaries.es[key] ?? key,
  };
}

/**
 * Merge a stored LocalizedName with the translated defaults so the admin
 * editor always shows all three language fields prefilled.
 */
function mergeNameWithDefaults(
  existing: LocalizedName | undefined,
  defaults: { pt: string; en: string; es: string },
): { pt: string; en: string; es: string } {
  const cur =
    typeof existing === "string"
      ? { pt: existing }
      : (existing ?? {});
  return {
    pt: cur.pt?.trim() || defaults.pt,
    en: cur.en?.trim() || defaults.en,
    es: cur.es?.trim() || defaults.es,
  };
}



/**
 * Compare admin-entered name against the default (translated) labels. If
 * every language matches the default (or is empty), we clear the custom
 * override so the built-in translation stays in effect.
 */
function normalizeOverrideName(
  entered: LocalizedName | undefined,
  defaults: { pt: string; en: string; es: string },
): LocalizedName | undefined {
  if (!entered) return undefined;
  const obj =
    typeof entered === "string" ? { pt: entered } : entered;
  const pt = (obj.pt ?? "").trim();
  const en = (obj.en ?? "").trim();
  const es = (obj.es ?? "").trim();
  const matchesDefault =
    (!pt || pt === defaults.pt) &&
    (!en || en === defaults.en) &&
    (!es || es === defaults.es);
  if (matchesDefault) return undefined;
  // Only persist fields that differ from the default label so future
  // dictionary changes to unchanged languages still take effect.
  const out: { pt?: string; en?: string; es?: string } = {};
  if (pt && pt !== defaults.pt) out.pt = pt;
  if (en && en !== defaults.en) out.en = en;
  if (es && es !== defaults.es) out.es = es;
  return Object.keys(out).length ? out : undefined;
}

function toHairPixels(m: Record<string, PixelTone>): HairPixels {
  const out: HairPixels = {};
  for (const [k, v] of Object.entries(m)) {
    if (v === "dark" || v === "mid" || v === "light") out[k] = v;
  }
  return out;
}

type Tab = "hairs" | "clothes" | "items" | "scenery";

type HairEdit = { kind: "hair"; editing?: CustomHair };
type BuiltinHairEdit = { kind: "builtin-hair"; style: HairStyle };
type BuiltinBeardEdit = { kind: "builtin-beard"; style: BeardStyle };
type BuiltinShirtEdit = { kind: "builtin-shirt"; style: ShirtStyle; body: BodyType };
type BuiltinPantsEdit = { kind: "builtin-pants"; style: PantsStyle; body: BodyType };
type ClothesSetup = {
  kind: "clothes-setup";
  editing?: CustomGarment;
  slot?: GarmentSlot;
  body?: GarmentBody;
};
type ClothesEdit = {
  kind: "clothes";
  slot: GarmentSlot;
  body: GarmentBody;
  editing?: CustomGarment;
};

type Modal =
  | null
  | HairEdit
  | BuiltinHairEdit
  | BuiltinBeardEdit
  | BuiltinShirtEdit
  | BuiltinPantsEdit
  | ClothesSetup
  | ClothesEdit;

// Monochrome gray body so the admin can see the body clearly while drawing.
const GRAY_BODY = {
  skin: "#9ca3af",
  shirt: "#6b7280",
  pants: "#6b7280",
  boots: "#4b5563",
  eyeColor: "#374151",
} as const;

const BUILTIN_HAIR_STYLES: HairStyle[] = HAIR_STYLES.filter((s) => s !== "bald");
const BUILTIN_BEARD_STYLES: BeardStyle[] = BEARD_STYLES.filter((s) => s !== "none");

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("hairs");
  const [hairs, setHairs] = useState<CustomHair[]>([]);
  const [garments, setGarments] = useState<CustomGarment[]>([]);
  const [overrides, setOverrides] = useState<HairStyleOverrides>({});
  const [shirtOverrides, setShirtOverrides] = useState<ShirtStyleOverrides>({});
  const [pantsOverrides, setPantsOverrides] = useState<PantsStyleOverrides>({});
  const [beardOverrides, setBeardOverrides] = useState<BeardStyleOverrides>({});
  const [itemOverrides, setItemOverrides] = useState<ItemOverrides>({});
  const [editingItem, setEditingItem] = useState<{ kind: ItemKind; variant: ItemVariant } | null>(null);
  // Pre-loaded default pixels for the current icon editor session — resolved
  // from PNG assets or programmatic CSS renderings so the editor opens with
  // the miniature that's currently visible in the hotbar, not a blank canvas.
  const [editingItemInitial, setEditingItemInitial] = useState<ItemPixels | null>(null);
  const [sceneryOverrides, setSceneryOverrides] = useState<SceneryOverrides>({});
  const [editingScenery, setEditingScenery] = useState<SceneryKind | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [hairBase, setHairBase] = useState(HAIR_COLORS[0]);
  const [shirtBase, setShirtBase] = useState(SHIRT_COLORS[0]);
  const [pantsBase, setPantsBase] = useState(PANTS_COLORS[0]);
  const [shirt2Base, setShirt2Base] = useState(SHIRT_COLORS[1]);
  const [pants2Base, setPants2Base] = useState(PANTS_COLORS[1]);
  const [shirt3Base, setShirt3Base] = useState(SHIRT_COLORS[2] ?? SHIRT_COLORS[0]);
  const [pants3Base, setPants3Base] = useState(PANTS_COLORS[2] ?? PANTS_COLORS[0]);

  // Resolve the "initial" pixel map for the item editor: prefer any admin
  // override, else the held-tool snapshot for held variants, else the
  // rasterized icon that's currently visible in the hotbar (PNG asset or
  // CSS-drawn shape). Loading a PNG is async so we defer opening the editor
  // until the pixels are ready.
  useEffect(() => {
    if (!editingItem) {
      setEditingItemInitial(null);
      return;
    }
    const override = getItemOverride(editingItem.kind)?.[editingItem.variant];
    if (override) {
      setEditingItemInitial(override);
      return;
    }
    if (editingItem.variant === "held" && isHeldToolKind(editingItem.kind)) {
      setEditingItemInitial(captureHeldDefaultPixels(editingItem.kind));
      return;
    }
    if (editingItem.variant === "icon") {
      // Bronze ore mirrors copper's user-drawn icon by default so the
      // editor opens with copper's pixels, matching what the hotbar shows.
      if (editingItem.kind === "bronze") {
        const copperOverride = getItemOverride("copper")?.icon;
        if (copperOverride) {
          setEditingItemInitial(copperOverride);
          return;
        }
      }
      let cancelled = false;
      setEditingItemInitial(null);
      captureIconDefaultPixels(editingItem.kind).then((pixels) => {
        if (!cancelled) setEditingItemInitial(pixels);
      });
      return () => {
        cancelled = true;
      };
    }
    setEditingItemInitial({});
  }, [editingItem]);

  useEffect(() => {
    setHairs(loadCustomHairs());
    setGarments(loadCustomGarments());
    setOverrides(loadHairOverrides());
    setShirtOverrides(loadShirtOverrides());
    setPantsOverrides(loadPantsOverrides());
    setBeardOverrides(loadBeardOverrides());
    setItemOverrides(loadItemOverrides());
    setSceneryOverrides(loadSceneryOverrides());
  }, []);


  const refreshHairs = () => setHairs(loadCustomHairs());
  const refreshGarments = () => setGarments(loadCustomGarments());
  const refreshOverrides = () => setOverrides(loadHairOverrides());
  const refreshShirtOverrides = () => setShirtOverrides(loadShirtOverrides());
  const refreshPantsOverrides = () => setPantsOverrides(loadPantsOverrides());
  const refreshBeardOverrides = () => setBeardOverrides(loadBeardOverrides());
  const refreshItemOverrides = () => setItemOverrides(loadItemOverrides());
  const refreshSceneryOverrides = () => setSceneryOverrides(loadSceneryOverrides());

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 font-pixel text-[#f4e9c1]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col border-4 border-[#ffd166] bg-[#1b2a3a]"
        style={{ boxShadow: "0 8px 0 #0a141f" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-4 border-[#f4e9c1]/20 px-4 py-3">
          <h2 className="text-sm tracking-widest text-[#ffd166]">🛠 ADMIN PANEL</h2>
          <button
            onClick={onClose}
            className="border-2 border-[#f4e9c1]/40 px-3 py-1 text-[10px] hover:border-[#e94560]"
          >
            {t("editor.close")}
          </button>
        </div>

        <div className="flex gap-1 border-b-4 border-[#f4e9c1]/20 px-4 py-2">
          {(["hairs", "clothes", "items", "scenery"] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`border-2 px-4 py-2 text-[10px] uppercase tracking-widest ${
                tab === k
                  ? "border-[#ffd166] bg-[#ffd166]/10 text-[#ffd166]"
                  : "border-[#f4e9c1]/30"
              }`}
            >
              {k === "hairs"
                ? t("admin.tab.hairs")
                : k === "clothes"
                  ? t("admin.tab.clothes")
                  : k === "items"
                    ? t("admin.tab.items")
                    : t("admin.tab.scenery")}
            </button>
          ))}
          <div className="ml-auto flex items-center">
            {confirmingWipe ? (
              <div className="flex items-center gap-1 text-[9px]">
                <span className="text-[#e94560]">{t("admin.wipeConfirm")}</span>
                <button
                  onClick={() => setConfirmingWipe(false)}
                  className="border-2 border-[#f4e9c1]/40 px-2 py-1 uppercase"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  onClick={() => {
                    clearAllCustomizations();
                    clearAllScenery();
                    setConfirmingWipe(false);
                    refreshHairs();
                    refreshGarments();
                    refreshOverrides();
                    refreshShirtOverrides();
                    refreshPantsOverrides();
                    refreshBeardOverrides();
                    refreshItemOverrides();
                    refreshSceneryOverrides();
                  }}
                  className="border-2 border-[#e94560] bg-[#e94560]/10 px-2 py-1 uppercase text-[#e94560]"
                >
                  {t("admin.wipeConfirmYes")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingWipe(true)}
                title={t("admin.wipeAll")}
                className="border-2 border-[#e94560]/60 px-3 py-2 text-[10px] uppercase tracking-widest text-[#e94560] hover:bg-[#e94560]/10"
              >
                {t("admin.wipeAll")}
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "hairs" && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-[#ffd166]">
                    {t("admin.baseStyles")}
                  </div>
                  <div className="text-[9px] text-[#f4e9c1]/50">
                    {t("admin.baseStyles.count", { n: BUILTIN_HAIR_STYLES.length })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BUILTIN_HAIR_STYLES.map((s) => {
                    const hasOverride = !!overrides[s];
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between border-2 border-[#f4e9c1]/30 px-3 py-2 text-xs"
                      >
                        <span className="truncate">
                          {getLocalizedNameForLang((overrides[s] as { name?: LocalizedName } | undefined)?.name, lang) ?? t(`hair.${s}`)}
                          {hasOverride && (
                            <span className="ml-2 text-[9px] text-[#ffd166]">
                              {t("admin.edited")}
                            </span>
                          )}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setModal({ kind: "builtin-hair", style: s })}
                            className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                          >
                            ✎
                          </button>
                          {hasOverride && (
                            <button
                              onClick={() => {
                                deleteHairOverride(s);
                                refreshOverrides();
                              }}
                              title={t("admin.restoreDefault")}
                              className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-[#ffd166]">
                    {t("admin.baseStyles.beards")}
                  </div>
                  <div className="text-[9px] text-[#f4e9c1]/50">
                    {t("admin.baseStyles.count", { n: BUILTIN_BEARD_STYLES.length })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BUILTIN_BEARD_STYLES.map((s) => {
                    const hasOverride = !!beardOverrides[s];
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between border-2 border-[#f4e9c1]/30 px-3 py-2 text-xs"
                      >
                        <span className="truncate">
                          {getLocalizedNameForLang(beardOverrides[s]?.name, lang) ?? t(`beard.${s}`)}
                          {hasOverride && (
                            <span className="ml-2 text-[9px] text-[#ffd166]">
                              {t("admin.edited")}
                            </span>
                          )}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setModal({ kind: "builtin-beard", style: s })}
                            className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                          >
                            ✎
                          </button>
                          {hasOverride && (
                            <button
                              onClick={() => {
                                deleteBeardOverride(s);
                                refreshBeardOverrides();
                              }}
                              title={t("admin.restoreDefault")}
                              className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-[#ffd166]">
                    {t("admin.tab.hairs").toUpperCase()}
                  </div>
                  <button
                    onClick={() => setModal({ kind: "hair" })}
                    className="border-2 border-[#ffd166] bg-[#ffd166]/10 px-3 py-2 text-[10px] uppercase text-[#ffd166]"
                  >
                    {t("admin.newHair")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {hairs.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between border-2 border-[#f4e9c1]/30 px-3 py-2 text-xs"
                    >
                      <span className="truncate text-[#ffd166]">★ {resolveLocalizedName(h.name, lang, "Custom")}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModal({ kind: "hair", editing: h })}
                          className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            deleteCustomHair(h.id);
                            refreshHairs();
                          }}
                          className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {hairs.length === 0 && (
                    <div className="col-span-2 text-center text-[10px] text-[#f4e9c1]/50">
                      {t("admin.noHairs")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "clothes" && (
            <div className="flex flex-col gap-5">
              <BuiltinStyleList
                title={t("admin.baseStyles.shirts")}
                styles={TORSO_SHIRT_STYLES}
                labels={
                  Object.fromEntries(
                    TORSO_SHIRT_STYLES.map((s) => [s, t(`shirtStyle.${s}`)]),
                  ) as Record<ShirtStyle, string>
                }
                overrides={shirtOverrides}
                lang={lang}
                editMascLabel={t("admin.editMasc")}
                editFemLabel={t("admin.editFem")}
                restoreLabel={t("admin.restoreDefault")}
                editedLabel={t("admin.edited")}
                onEditStyle={(s, body) =>
                  setModal({ kind: "builtin-shirt", style: s, body })
                }
                onReset={(s) => {
                  deleteShirtOverride(s);
                  refreshShirtOverrides();
                }}
              />
              <BuiltinStyleList
                title={t("admin.baseStyles.pants")}
                styles={PANTS_STYLES}
                labels={
                  Object.fromEntries(
                    PANTS_STYLES.map((s) => [s, t(`pantsStyle.${s}`)]),
                  ) as Record<PantsStyle, string>
                }
                overrides={pantsOverrides}
                lang={lang}
                editMascLabel={t("admin.editMasc")}
                editFemLabel={t("admin.editFem")}
                restoreLabel={t("admin.restoreDefault")}
                editedLabel={t("admin.edited")}
                onEditStyle={(s, body) =>
                  setModal({ kind: "builtin-pants", style: s, body })
                }
                onReset={(s) => {
                  deletePantsOverride(s);
                  refreshPantsOverrides();
                }}
              />
              <BuiltinStyleList
                title={t("admin.baseStyles.fullBody")}
                styles={FULLBODY_SHIRT_STYLES}
                labels={
                  Object.fromEntries(
                    FULLBODY_SHIRT_STYLES.map((s) => [s, t(`shirtStyle.${s}`)]),
                  ) as Record<ShirtStyle, string>
                }
                overrides={shirtOverrides}
                lang={lang}
                editMascLabel={t("admin.editMasc")}
                editFemLabel={t("admin.editFem")}
                restoreLabel={t("admin.restoreDefault")}
                editedLabel={t("admin.edited")}
                onEditStyle={(s, body) =>
                  setModal({ kind: "builtin-shirt", style: s, body })
                }
                onReset={(s) => {
                  deleteShirtOverride(s);
                  refreshShirtOverrides();
                }}
              />



              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-[#ffd166]">
                    {t("admin.tab.clothes").toUpperCase()}
                  </div>
                  <button
                    onClick={() => setModal({ kind: "clothes-setup" })}
                    className="border-2 border-[#ffd166] bg-[#ffd166]/10 px-3 py-2 text-[10px] uppercase text-[#ffd166]"
                  >
                    {t("admin.newClothes")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {garments.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between border-2 border-[#f4e9c1]/30 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="text-[#ffd166]">👕 {resolveLocalizedName(g.name, lang, "Custom")}</span>
                        <span className="text-[9px] text-[#f4e9c1]/60">
                          {g.slot === "shirt"
                            ? t("admin.slot.shirt")
                            : g.slot === "pants"
                              ? t("admin.slot.pants")
                              : t("admin.slot.fullbody")}{" "}
                          ·{" "}
                          {g.body === "masc"
                            ? t("admin.body.masc")
                            : g.body === "fem"
                              ? t("admin.body.fem")
                              : t("admin.body.both")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setModal({
                              kind: "clothes",
                              slot: g.slot,
                              body: g.body,
                              editing: g,
                            })
                          }
                          className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            deleteCustomGarment(g.id);
                            refreshGarments();
                          }}
                          className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {garments.length === 0 && (
                    <div className="text-center text-[10px] text-[#f4e9c1]/50">
                      {t("admin.noClothes")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "items" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] tracking-widest text-[#ffd166]">
                  {t("admin.items.title")}
                </div>
                <button
                  onClick={() => {
                    const keys = [
                      "item-overrides-v1",
                      "scenery-overrides-v1",
                      "hair-overrides-v1",
                      "beard-overrides-v1",
                      "shirt-overrides-v1",
                      "pants-overrides-v1",
                      "custom-hairs-v1",
                      "custom-garments-v1",
                    ];
                    const dump: Record<string, unknown> = {
                      exportedAt: new Date().toISOString(),
                      version: 1,
                    };
                    for (const k of keys) {
                      try {
                        const raw = localStorage.getItem(k);
                        dump[k] = raw ? JSON.parse(raw) : null;
                      } catch {
                        dump[k] = null;
                      }
                    }
                    const blob = new Blob([JSON.stringify(dump, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
                    a.download = `admin-customizations-${ts}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="border-2 border-[#ffd166]/60 px-3 py-1 text-[9px] uppercase tracking-widest text-[#ffd166] hover:bg-[#ffd166]/10"
                >
                  ⬇ {t("admin.items.download")}
                </button>
              </div>
              <p className="text-[10px] text-[#f4e9c1]/60">
                {t("admin.items.hint")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ITEM_KINDS.map((k) => {
                  const ov = itemOverrides[k];
                  return (
                    <div
                      key={k}
                      className="flex flex-col gap-2 border-2 border-[#f4e9c1]/30 p-2"
                    >
                      <div className="text-[11px] text-[#ffd166]">
                        {t(itemNameKey(k))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ITEM_VARIANTS.map((variant) => {
                          const pixels = ov?.[variant];
                          const hasVariant = !!pixels && Object.keys(pixels).length > 0;
                          const previewUrl = hasVariant
                            ? renderItemPixelsToDataURL(pixels!)
                            : null;
                          return (
                            <div
                              key={variant}
                              className="flex flex-col items-center gap-1 border border-[#f4e9c1]/20 p-1"
                            >
                              <div className="text-[9px] uppercase tracking-widest text-[#f4e9c1]/70">
                                {t(`admin.items.variant.${variant}`)}
                              </div>
                              <div
                                className="flex h-12 w-12 items-center justify-center border border-[#f4e9c1]/20 bg-[#0a141f]"
                                style={{ imageRendering: "pixelated" }}
                              >
                                {previewUrl ? (
                                  <img
                                    src={previewUrl}
                                    alt=""
                                    aria-hidden
                                    className="h-10 w-10 object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : (
                                  <span className="text-[9px] text-[#f4e9c1]/40">
                                    {t("admin.items.default")}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingItem({ kind: k, variant })}
                                  className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] uppercase text-[#ffd166]"
                                >
                                  {hasVariant
                                    ? t("admin.items.edit")
                                    : t("admin.items.create")}
                                </button>
                                {hasVariant && (
                                  <button
                                    onClick={() => {
                                      deleteItemVariant(k, variant);
                                      refreshItemOverrides();
                                    }}
                                    title={t("admin.items.delete")}
                                    className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const src = e.target.value as ItemKind | "";
                            e.target.value = "";
                            if (!src || src === k) return;
                            const srcOv = getItemOverride(src);
                            // Fall back to captured defaults so the user can
                            // clone from items that haven't been edited yet.
                            (async () => {
                              const icon =
                                srcOv?.icon ?? (await captureIconDefaultPixels(src));
                              const held =
                                srcOv?.held ??
                                (isHeldToolKind(src) ? captureHeldDefaultPixels(src) : undefined);
                              if (icon && Object.keys(icon).length > 0) {
                                saveItemVariant(k, "icon", icon);
                              }
                              if (held && Object.keys(held).length > 0) {
                                saveItemVariant(k, "held", held);
                              }
                              refreshItemOverrides();
                            })();
                          }}
                          className="flex-1 border-2 border-[#f4e9c1]/30 bg-[#0a141f] px-1 py-1 text-[9px] uppercase tracking-wider text-[#f4e9c1]"
                        >
                          <option value="">{t("admin.items.cloneFrom")}</option>
                          {ITEM_KINDS.filter((sk) => sk !== k).map((sk) => (
                            <option key={sk} value={sk}>
                              {t(itemNameKey(sk))}
                            </option>
                          ))}
                        </select>
                        {ov && (ov.icon || ov.held) && (
                          <button
                            onClick={() => {
                              deleteItemOverride(k);
                              refreshItemOverrides();
                            }}
                            className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] uppercase text-[#e94560]"
                          >
                            {t("admin.items.deleteAll")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "scenery" && (
            <div className="flex flex-col gap-4">
              <div className="text-[10px] tracking-widest text-[#ffd166]">
                {t("admin.scenery.title")}
              </div>
              <p className="text-[10px] text-[#f4e9c1]/60">
                {t("admin.scenery.hint")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SCENERY_KINDS.map((k) => {
                  const pixels = sceneryOverrides[k];
                  const hasOverride = !!pixels && Object.keys(pixels).length > 0;
                  return (
                    <div
                      key={k}
                      className="flex flex-col gap-2 border-2 border-[#f4e9c1]/30 p-2"
                    >
                      <div className="text-[11px] text-[#ffd166]">
                        {t(sceneryNameKey(k))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-16 items-center justify-center border border-[#f4e9c1]/20 bg-[#0a141f]"
                          style={{ width: 96, imageRendering: "pixelated" }}
                        >
                          <span className="text-[9px] text-[#f4e9c1]/40">
                            {hasOverride
                              ? t("admin.scenery.customized")
                              : t("admin.scenery.default")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setEditingScenery(k)}
                            className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] uppercase text-[#ffd166]"
                          >
                            {hasOverride
                              ? t("admin.items.edit")
                              : t("admin.items.create")}
                          </button>
                          {hasOverride && (
                            <button
                              onClick={() => {
                                deleteSceneryOverride(k);
                                refreshSceneryOverrides();
                              }}
                              className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] uppercase text-[#e94560]"
                            >
                              {t("admin.items.delete")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.kind === "hair" &&
        (() => {
          const baldApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            hairStyle: "bald",
            beard: "none",
            hairColor: hairBase,
            customHair: undefined,
          };
          return (
            <PixelEditor
              title={modal.editing ? t("admin.editing", { name: resolveLocalizedName(modal.editing.name, lang, "Custom") }) : t("admin.newHairTitle")}
              appearance={baldApp}
              padTop={4}
              paletteBase={hairBase}
              onPaletteBaseChange={setHairBase}
              paletteChoices={HAIR_COLORS}
              scratchKey={modal.editing ? undefined : "admin-hair-scratch"}
              initial={
                modal.editing
                  ? {
                      name: modal.editing.name,
                      back: modal.editing.back,
                      front: modal.editing.front,
                    }
                  : undefined
              }
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                const b = toHairPixels(back);
                const f = toHairPixels(front);
                if (modal.editing) {
                  updateCustomHair({ id: modal.editing.id, name, back: b, front: f });
                } else {
                  addCustomHair({ name, back: b, front: f });
                }
                refreshHairs();
                setModal(null);
              }}
            />
          );
        })()}

      {modal?.kind === "builtin-hair" &&
        (() => {
          const style = modal.style;
          const baldApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            hairStyle: "bald",
            beard: "none",
            hairColor: hairBase,
            customHair: undefined,
          };
          const existing = getHairOverride(style);
          const seed = existing ?? rasterizeBuiltinHair(style);
          const defaults = defaultLocalizedFromKey(`hair.${style}`);
          const initialName: LocalizedName = mergeNameWithDefaults(
            getHairOverrideRawName(style),
            defaults,
          );
          const label = getLocalizedNameForLang(getHairOverrideRawName(style), lang) ?? defaults[lang];
          return (
            <PixelEditor
              title={t("admin.editing", { name: label.toUpperCase() })}
              appearance={baldApp}
              padTop={4}
              paletteBase={hairBase}
              onPaletteBaseChange={setHairBase}
              paletteChoices={HAIR_COLORS}
              initial={{ name: initialName, back: seed.back, front: seed.front }}
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                const custom = normalizeOverrideName(name, defaults);
                saveHairOverride(style, toHairPixels(back), toHairPixels(front), custom);
                refreshOverrides();
                setModal(null);
              }}
            />
          );
        })()}

      {modal?.kind === "builtin-beard" &&
        (() => {
          const style = modal.style;
          const baldApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            body: "masc",
            hairStyle: "bald",
            beard: "none",
            hairColor: hairBase,
            customHair: undefined,
          };
          const existing = getBeardOverride(style);
          const seed = existing ?? rasterizeBuiltinBeard(style);
          const defaults = defaultLocalizedFromKey(`beard.${style}`);
          const initialName: LocalizedName = mergeNameWithDefaults(
            getBeardOverrideRawName(style),
            defaults,
          );
          const label = getLocalizedNameForLang(getBeardOverrideRawName(style), lang) ?? defaults[lang];
          return (
            <PixelEditor
              title={t("admin.editing", { name: label.toUpperCase() })}
              appearance={baldApp}
              paletteBase={hairBase}
              onPaletteBaseChange={setHairBase}
              paletteChoices={HAIR_COLORS}
              initial={{ name: initialName, back: seed.back, front: seed.front }}
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                const custom = normalizeOverrideName(name, defaults);
                saveBeardOverride(style, toHairPixels(back), toHairPixels(front), custom);
                refreshBeardOverrides();
                setModal(null);
              }}
            />
          );
        })()}



      {modal?.kind === "builtin-shirt" &&
        (() => {
          const { style, body } = modal;
          const refApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            body,
            hairStyle: "bald",
            beard: "none",
            hairColor: "#4b5563",
          };
          const seed = getShirtOverride(style, body) ?? rasterizeBuiltinShirt(style, body);
          const defaults = defaultLocalizedFromKey(`shirtStyle.${style}`);
          const initialName: LocalizedName = mergeNameWithDefaults(
            getShirtOverrideRawName(style),
            defaults,
          );
          const label = getLocalizedNameForLang(getShirtOverrideRawName(style), lang) ?? defaults[lang];
          const isFullBody = FULLBODY_SHIRT_STYLES.includes(style);
          const bodyLabel = body === "masc" ? t("admin.body.masc").toLowerCase() : t("admin.body.fem").toLowerCase();
          return (
            <PixelEditor
              title={(isFullBody ? t("admin.editingFullBody") : t("admin.editingShirt")).replace("{name}", label.toUpperCase()).replace("{body}", bodyLabel)}
              appearance={{ ...refApp, shirtSecondary: shirt2Base, shirtTertiary: shirt3Base }}
              hideShirt
              hidePants={isFullBody}
              paletteBase={shirtBase}
              onPaletteBaseChange={setShirtBase}
              paletteChoices={SHIRT_COLORS}
              allowSecondary
              secondaryBase={shirt2Base}
              onSecondaryBaseChange={setShirt2Base}
              paletteChoicesSecondary={SHIRT_COLORS}
              allowTertiary
              tertiaryBase={shirt3Base}
              onTertiaryBaseChange={setShirt3Base}
              paletteChoicesTertiary={SHIRT_COLORS}
              initial={{ name: initialName, back: seed.back, front: seed.front }}
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                const custom = normalizeOverrideName(name, defaults);
                saveShirtOverride(style, body, back, front, custom);
                refreshShirtOverrides();
                setModal(null);
              }}
            />
          );
        })()}

      {modal?.kind === "builtin-pants" &&
        (() => {
          const { style, body } = modal;
          const refApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            body,
            hairStyle: "bald",
            beard: "none",
            hairColor: "#4b5563",
          };
          const seed = getPantsOverride(style, body) ?? rasterizeBuiltinPants(style, body);
          const defaults = defaultLocalizedFromKey(`pantsStyle.${style}`);
          const initialName: LocalizedName = mergeNameWithDefaults(
            getPantsOverrideRawName(style),
            defaults,
          );
          const label = getLocalizedNameForLang(getPantsOverrideRawName(style), lang) ?? defaults[lang];
          const bodyLabel = body === "masc" ? t("admin.body.masc").toLowerCase() : t("admin.body.fem").toLowerCase();
          return (
            <PixelEditor
              title={t("admin.editingPants", { name: label.toUpperCase(), body: bodyLabel })}
              appearance={{ ...refApp, pantsSecondary: pants2Base, pantsTertiary: pants3Base }}
              hidePants
              paletteBase={pantsBase}
              onPaletteBaseChange={setPantsBase}
              paletteChoices={PANTS_COLORS}
              allowSecondary
              secondaryBase={pants2Base}
              onSecondaryBaseChange={setPants2Base}
              paletteChoicesSecondary={PANTS_COLORS}
              allowTertiary
              tertiaryBase={pants3Base}
              onTertiaryBaseChange={setPants3Base}
              paletteChoicesTertiary={PANTS_COLORS}
              initial={{ name: initialName, back: seed.back, front: seed.front }}
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                const custom = normalizeOverrideName(name, defaults);
                savePantsOverride(style, body, back, front, custom);
                refreshPantsOverrides();
                setModal(null);
              }}
            />
          );
        })()}

      {modal?.kind === "clothes-setup" && (
        <ClothesSetupModal
          onCancel={() => setModal(null)}
          onConfirm={(slot, body) =>
            setModal({ kind: "clothes", slot, body, editing: undefined })
          }
        />
      )}

      {modal?.kind === "clothes" &&
        (() => {
          const isShirt = modal.slot === "shirt";
          const isPants = modal.slot === "pants";
          const isFullBody = modal.slot === "fullbody";
          const base = isPants ? pantsBase : shirtBase;
          const choices = isPants ? PANTS_COLORS : SHIRT_COLORS;
          const setBase = isPants ? setPantsBase : setShirtBase;
          const base2 = isPants ? pants2Base : shirt2Base;
          const setBase2 = isPants ? setPants2Base : setShirt2Base;
          const base3 = isPants ? pants3Base : shirt3Base;
          const setBase3 = isPants ? setPants3Base : setShirt3Base;
          const previewBody = modal.body === "fem" ? "fem" : "masc";
          const refApp: Appearance = {
            ...DEFAULT_APPEARANCE,
            ...GRAY_BODY,
            body: previewBody,
            hairStyle: "bald",
            beard: "none",
            hairColor: "#4b5563",
            shirtSecondary: shirt2Base,
            pantsSecondary: pants2Base,
            shirtTertiary: shirt3Base,
            pantsTertiary: pants3Base,
          };
          const slotLabel = isShirt
            ? t("admin.slot.shirt").toLowerCase()
            : isPants
              ? t("admin.slot.pants").toLowerCase()
              : t("admin.slot.fullbody").toLowerCase();
          const bodyLabel =
            modal.body === "masc"
              ? t("admin.body.masc").toLowerCase()
              : modal.body === "fem"
                ? t("admin.body.fem").toLowerCase()
                : t("admin.body.both").toLowerCase();
          return (
            <PixelEditor
              title={
                (modal.editing
                  ? t("admin.editing", { name: resolveLocalizedName(modal.editing.name, lang, "Custom") })
                  : t("admin.newClothesTitle")) + ` (${slotLabel} · ${bodyLabel})`
              }
              appearance={refApp}
              hideShirt={isShirt || isFullBody}
              hidePants={isPants || isFullBody}
              paletteBase={base}
              onPaletteBaseChange={setBase}
              paletteChoices={choices}
              allowSecondary
              secondaryBase={base2}
              onSecondaryBaseChange={setBase2}
              paletteChoicesSecondary={choices}
              allowTertiary
              tertiaryBase={base3}
              onTertiaryBaseChange={setBase3}
              paletteChoicesTertiary={choices}
              scratchKey={
                modal.editing
                  ? undefined
                  : `admin-garment-scratch-${modal.slot}-${modal.body}`
              }
              initial={
                modal.editing
                  ? {
                      name: modal.editing.name,
                      back: modal.editing.back,
                      front: modal.editing.front,
                    }
                  : undefined
              }
              onClose={() => setModal(null)}
              onSave={(name, back, front) => {
                if (modal.editing) {
                  updateCustomGarment({
                    id: modal.editing.id,
                    name,
                    slot: modal.slot,
                    body: modal.body,
                    back,
                    front,
                  });
                } else {
                  addCustomGarment({
                    name,
                    slot: modal.slot,
                    body: modal.body,
                    back,
                    front,
                  });
                }
                refreshGarments();
                setModal(null);
              }}
            />
          );
        })()}

      {editingItem && editingItemInitial !== null && (
        <ItemPixelEditor
          title={t("admin.items.editingVariant", {
            name: t(itemNameKey(editingItem.kind)),
            variant: t(`admin.items.variant.${editingItem.variant}`),
          })}
          initial={editingItemInitial}
          gridW={getVariantGrid(editingItem.variant, editingItem.kind).w}
          gridH={getVariantGrid(editingItem.variant, editingItem.kind).h}
          onClose={() => {
            setEditingItem(null);
            setEditingItemInitial(null);
          }}
          onSave={(pixels) => {
            if (Object.keys(pixels).length === 0) {
              deleteItemVariant(editingItem.kind, editingItem.variant);
            } else {
              saveItemVariant(editingItem.kind, editingItem.variant, pixels);
            }
            refreshItemOverrides();
            setEditingItem(null);
            setEditingItemInitial(null);
          }}
        />
      )}


      {editingScenery && (() => {
        const g = getSceneryGrid(editingScenery);
        return (
        <ItemPixelEditor
          title={t("admin.scenery.editing", {
            name: t(sceneryNameKey(editingScenery)),
          })}
          initial={
            getSceneryOverride(editingScenery) ??
            (editingScenery === "caveEntrance"
              ? captureCaveDefaultPixels()
              : captureBuildDefaultPixels(editingScenery))
          }
          gridW={g.w}
          gridH={g.h}
          onClose={() => setEditingScenery(null)}
          onSave={(pixels) => {
            if (Object.keys(pixels).length === 0) {
              deleteSceneryOverride(editingScenery);
            } else {
              saveSceneryOverride(editingScenery, pixels);
            }
            refreshSceneryOverrides();
            setEditingScenery(null);
          }}
        />
        );
      })()}
    </div>
  );
}

function ClothesSetupModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (slot: GarmentSlot, body: GarmentBody) => void;
}) {
  const { t } = useI18n();
  const [slot, setSlot] = useState<GarmentSlot>("shirt");
  const [body, setBody] = useState<GarmentBody>("both");

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 p-4 font-pixel text-[#f4e9c1]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border-4 border-[#ffd166] bg-[#1b2a3a] p-5"
        style={{ boxShadow: "0 8px 0 #0a141f" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm tracking-widest text-[#ffd166]">{t("admin.newClothesModalTitle")}</h3>

        <div className="mb-3">
          <div className="mb-1 text-[10px] tracking-widest text-[#f4e9c1]/60">
            {t("admin.type")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["shirt", "pants", "fullbody"] as GarmentSlot[]).map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`border-2 px-2 py-2 text-[10px] uppercase ${
                  slot === s ? "border-[#ffd166] bg-[#ffd166]/10" : "border-[#f4e9c1]/30"
                }`}
              >
                {t(`admin.slot.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1 text-[10px] tracking-widest text-[#f4e9c1]/60">
            {t("admin.body")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["masc", "fem", "both"] as GarmentBody[]).map((b) => (
              <button
                key={b}
                onClick={() => setBody(b)}
                className={`border-2 px-2 py-2 text-[10px] uppercase ${
                  body === b ? "border-[#ffd166] bg-[#ffd166]/10" : "border-[#f4e9c1]/30"
                }`}
              >
                {b === "masc"
                  ? t("admin.body.mascShort")
                  : b === "fem"
                    ? t("admin.body.femShort")
                    : t("admin.body.both")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="border-2 border-[#f4e9c1]/40 px-3 py-2 text-[10px] uppercase"
          >
            {t("admin.cancel")}
          </button>
          <button
            onClick={() => onConfirm(slot, body)}
            className="border-2 border-[#ffd166] bg-[#ffd166] px-3 py-2 text-[10px] uppercase text-[#0d1b2a]"
          >
            {t("admin.draw")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuiltinStyleList<S extends string>({
  title,
  styles,
  labels,
  overrides,
  lang,
  editMascLabel,
  editFemLabel,
  restoreLabel,
  editedLabel,
  onEditStyle,
  onReset,
}: {
  title: string;
  styles: readonly S[];
  labels: Record<S, string>;
  overrides: Partial<Record<S, unknown>>;
  lang: Lang;
  editMascLabel: string;
  editFemLabel: string;
  restoreLabel: string;
  editedLabel: string;
  onEditStyle: (style: S, body: BodyType) => void;
  onReset: (style: S) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] tracking-widest text-[#ffd166]">{title}</div>
      <div className="grid grid-cols-1 gap-2">
        {styles.map((s) => {
          const hasOverride = !!overrides[s];
          return (
            <div
              key={s}
              className="flex items-center justify-between border-2 border-[#f4e9c1]/30 px-3 py-2 text-xs"
            >
              <span className="truncate">
                {(() => {
                  const ov = overrides[s] as { name?: LocalizedName } | undefined;
                  return getLocalizedNameForLang(ov?.name, lang) ?? labels[s] ?? s;
                })()}
                {hasOverride && (
                  <span className="ml-2 text-[9px] text-[#ffd166]">{editedLabel}</span>
                )}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onEditStyle(s, "masc")}
                  className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                  title={editMascLabel}
                >
                  ✎ ♂
                </button>
                <button
                  onClick={() => onEditStyle(s, "fem")}
                  className="border-2 border-[#ffd166]/60 px-2 py-1 text-[9px] text-[#ffd166]"
                  title={editFemLabel}
                >
                  ✎ ♀
                </button>
                {hasOverride && (
                  <button
                    onClick={() => onReset(s)}
                    title={restoreLabel}
                    className="border-2 border-[#e94560]/60 px-2 py-1 text-[9px] text-[#e94560]"
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
