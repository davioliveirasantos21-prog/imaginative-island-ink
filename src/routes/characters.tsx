import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePlayerSession } from "@/hooks/use-player-session";
import { flushPlayerSaveSync, waitForPlayerSaveReady } from "@/lib/player-sync";
import {
  loadSlots,
  saveSlots,
  setActiveSlot,
  
  type SlotState,
} from "@/lib/characters";
import {
  BEARD_STYLES,
  BODY_TYPES,
  BOOT_COLORS,
  DEFAULT_APPEARANCE,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_COLORS,
  
  SHIRT_COLORS,
  SKIN_TONES,
  SPRITE_H,
  SPRITE_W,
  drawCharacter,
  getHairOverrideName,
  getPantsOverride,
  getShirtOverride,
  hasSecondaryPixels,
  hasTertiaryPixels,
  loadCustomGarments,
  loadCustomHairs,
  resolveLocalizedName,
  type Appearance,
  type BeardStyle,
  type BodyType,
  type CustomGarment,
  type CustomHair,
  type HairStyle,
} from "@/lib/appearance";

const OUTFIT_COLORS = Array.from(new Set([...SHIRT_COLORS, ...PANTS_COLORS]));





export const Route = createFileRoute("/characters")({
  head: () => ({
    meta: [
      { title: "Characters — Pixel Islands" },
      { name: "description", content: "Choose a hero slot to enter Pixel Islands." },
    ],
  }),
  component: CharactersPage,
});

function CharactersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session: playerSession, loading: sessionLoading } = usePlayerSession();
  const [slots, setSlots] = useState<SlotState[]>([null, null, null]);
  const [creating, setCreating] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !playerSession) {
      navigate({ to: "/auth" });
    }
  }, [sessionLoading, playerSession, navigate]);

  useEffect(() => {
    let mounted = true;
    void waitForPlayerSaveReady().then(() => {
      if (!mounted) return;
      setSlots(loadSlots());
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleEnter = (index: number) => {
    setActiveSlot(index);
    navigate({ to: "/game" });
  };

  const handleCreate = async (
    index: number,
    name: string,
    appearance: Appearance,
  ) => {
    const next = [...slots];
    next[index] = {
      name: name.trim() || "Hero",
      level: 1,
      createdAt: Date.now(),
      appearance,
    };
    setSlots(next);
    saveSlots(next);
    await flushPlayerSaveSync();
    setCreating(null);
  };

  const handleDelete = async (index: number) => {
    const next = [...slots];
    next[index] = null;
    setSlots(next);
    saveSlots(next);
    // Wipe the character's world/inventory so their island resets.
    try {
      localStorage.removeItem(`pixel-realms.world.${index}`);
    } catch {
      /* ignore */
    }
    await flushPlayerSaveSync();
  };



  return (
    <div className="min-h-screen bg-[#0d1b2a] font-pixel text-[#f4e9c1]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 short:px-3 short:py-3">
        <header className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link
            to="/"
            className="self-start shrink-0 text-[10px] tracking-widest uppercase border-2 border-[#f4e9c1]/40 px-3 py-2 hover:border-[#f4e9c1] sm:self-auto short:text-[9px] short:px-2 short:py-1"
          >
            ← {t("slots.back")}
          </Link>
          <h1
            className="min-w-0 text-center text-lg sm:truncate sm:text-2xl text-[#ffd166] short:text-sm"
            style={{ textShadow: "3px 3px 0 #7a3e1d" }}
          >
            {t("slots.title")}
          </h1>
          <div className="hidden sm:block sm:w-16" />
        </header>
        <p className="mt-4 text-center text-[10px] sm:text-xs tracking-widest text-[#f4e9c1]/70 short:mt-2 short:text-[9px]">
          {t("slots.subtitle")}
        </p>

        <div className="mt-10 grid flex-1 grid-cols-1 items-start gap-6 md:grid-cols-3 short:mt-4 short:grid-cols-3 short:gap-3">
          {!ready ? (
            <div className="col-span-full flex min-h-[260px] items-center justify-center text-center text-[10px] tracking-widest text-[#f4e9c1]/70">
              Carregando seu save da nuvem...
            </div>
          ) : (
            slots.map((slot, i) => (
              <SlotCard
                key={i}
                index={i}
                slot={slot}
                onCreate={() => setCreating(i)}
                onEnter={() => handleEnter(i)}
                onDelete={() => handleDelete(i)}
              />
            ))
          )}

        </div>
      </div>


      {creating !== null && (
        <CreateModal
          index={creating}
          onCancel={() => setCreating(null)}
          onConfirm={handleCreate}
        />
      )}
    </div>
  );
}

function SlotCard({
  index,
  slot,
  onCreate,
  onEnter,
  onDelete,
}: {
  index: number;
  slot: SlotState;
  onCreate: () => void;
  onEnter: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isEmpty = slot == null;

  return (
    <div
      className="relative flex flex-col items-center border-4 border-[#f4e9c1] bg-[#1b2a3a] p-6 text-center short:p-2"
      style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
    >
      {!isEmpty && !confirmingDelete && (
        <button
          onClick={() => setConfirmingDelete(true)}
          aria-label={t("slots.delete")}
          title={t("slots.delete")}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border-2 border-[#f4e9c1]/40 text-[#f4e9c1]/70 hover:border-[#e94560] hover:text-[#e94560] short:h-5 short:w-5 short:text-[10px]"
        >
          ✕
        </button>
      )}

      <div className="text-[10px] tracking-widest text-[#f4e9c1]/60 short:text-[8px]">
        {t("slots.slot")} {index + 1}
      </div>

      <div className="my-6 flex h-40 w-32 items-center justify-center overflow-hidden border-4 border-dashed border-[#f4e9c1]/30 bg-[#0d1b2a] short:my-2 short:h-20 short:w-16">
        <div className="short:scale-50 origin-center">
          {isEmpty ? (
            <span className="text-3xl text-[#f4e9c1]/30">?</span>
          ) : (
            <SpritePreview appearance={slot.appearance} scale={4} />
          )}
        </div>
      </div>


      {isEmpty ? (
        <>
          <div className="text-xs text-[#f4e9c1]/60">{t("slots.empty")}</div>
          <button
            onClick={onCreate}
            className="mt-4 border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase text-[#0d1b2a]"
            style={{ boxShadow: "0 4px 0 #7a3e1d" }}
          >
            + {t("slots.create")}
          </button>
        </>
      ) : confirmingDelete ? (
        <>
          <div className="text-xs text-[#e94560]">{t("slots.deleteConfirm")}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="border-4 border-[#f4e9c1]/40 px-3 py-2 text-[9px] uppercase"
            >
              {t("create.cancel")}
            </button>
            <button
              onClick={() => {
                setConfirmingDelete(false);
                onDelete();
              }}
              className="border-4 border-[#e94560] bg-[#e94560] px-3 py-2 text-[9px] uppercase text-[#0d1b2a]"
              style={{ boxShadow: "0 4px 0 #7a1e2a" }}
            >
              {t("slots.delete")}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm text-[#ffd166]">{slot.name}</div>
          <div className="mt-1 text-[10px] tracking-widest text-[#f4e9c1]/70">
            {t("slots.level")} {slot.level}
          </div>
          <button
            onClick={onEnter}
            className="mt-4 border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase text-[#0d1b2a]"
            style={{ boxShadow: "0 4px 0 #7a3e1d" }}
          >
            ▶ {t("slots.enter")}
          </button>
        </>
      )}
    </div>
  );
}


function SpritePreview({ appearance, scale = 4 }: { appearance: Appearance; scale?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Pad top a bit so tall hairstyles (mohawk) fit
    drawCharacter(ctx, 0, 4, appearance);
  }, [appearance]);
  const w = SPRITE_W;
  const h = SPRITE_H + 4;
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className="pixelated"
      style={{
        width: w * scale,
        height: h * scale,
        imageRendering: "pixelated",
      }}
    />
  );
}

function CreateModal({
  index,
  onCancel,
  onConfirm,
}: {
  index: number;
  onCancel: () => void;
  onConfirm: (index: number, name: string, appearance: Appearance) => void;
}) {
  const { t, lang } = useI18n();
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [customHairs, setCustomHairs] = useState<CustomHair[]>([]);
  const [customGarments, setCustomGarments] = useState<CustomGarment[]>([]);

  useEffect(() => {
    setCustomHairs(loadCustomHairs());
    setCustomGarments(loadCustomGarments());
  }, []);

  const bodyMatches = (g: CustomGarment) =>
    g.body === "both" || g.body === appearance.body;
  const customShirts = customGarments.filter(
    (g) => g.slot === "shirt" && bodyMatches(g),
  );
  const customPants = customGarments.filter(
    (g) => g.slot === "pants" && bodyMatches(g),
  );
  const customFullBody = customGarments.filter(
    (g) => g.slot === "fullbody" && bodyMatches(g),
  );
  const fullBodyActive =
    !appearance.customShirt &&
    !appearance.customPants &&
    (appearance.shirtStyle === "suit" || appearance.shirtStyle === "dress");
  const fullBodyCustomActive =
    appearance.customShirt?.slot === "fullbody" ||
    appearance.customPants?.slot === "fullbody";

  // Detect whether the current shirt/pants selection uses secondary/tertiary colors.
  const shirtOv = getShirtOverride(appearance.shirtStyle, appearance.body);
  const pantsOv = getPantsOverride(appearance.pantsStyle, appearance.body);
  const shirtHasSecondary = appearance.customShirt
    ? hasSecondaryPixels(appearance.customShirt.back, appearance.customShirt.front)
    : shirtOv
      ? hasSecondaryPixels(shirtOv.back, shirtOv.front)
      : false;
  const pantsHasSecondary = appearance.customPants
    ? hasSecondaryPixels(appearance.customPants.back, appearance.customPants.front)
    : pantsOv
      ? hasSecondaryPixels(pantsOv.back, pantsOv.front)
      : false;
  const shirtHasTertiary = appearance.customShirt
    ? hasTertiaryPixels(appearance.customShirt.back, appearance.customShirt.front)
    : shirtOv
      ? hasTertiaryPixels(shirtOv.back, shirtOv.front)
      : false;
  const pantsHasTertiary = appearance.customPants
    ? hasTertiaryPixels(appearance.customPants.back, appearance.customPants.front)
    : pantsOv
      ? hasTertiaryPixels(pantsOv.back, pantsOv.front)
      : false;

  

  const setA = <K extends keyof Appearance>(key: K, value: Appearance[K]) =>
    setAppearance((a) => ({ ...a, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 short:p-2"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col border-4 border-[#f4e9c1] bg-[#1b2a3a] font-pixel text-[#f4e9c1] short:max-h-[96vh]"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="shrink-0 border-b-4 border-[#f4e9c1]/20 px-5 py-3 text-sm tracking-widest text-[#ffd166] short:px-3 short:py-2 short:text-xs">
          {t("create.title")}
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 short:px-3 short:py-2">
          <div className="grid grid-cols-[6rem,1fr] gap-5 md:grid-cols-[7rem,1fr] short:gap-3">

            {/* Live preview */}
            <div className="flex flex-col items-center gap-2 sticky top-0">
              <div
                className="flex h-32 w-24 items-center justify-center overflow-hidden border-4 border-[#f4e9c1]/40 bg-[#0d1b2a] short:h-20 short:w-16"
                style={{ boxShadow: "0 4px 0 #0a141f" }}
              >
                <div className="short:scale-50 origin-center">
                  <SpritePreview appearance={appearance} scale={3} />
                </div>
              </div>
              <div className="text-[9px] tracking-widest text-[#f4e9c1]/60">
                {t("create.preview")}
              </div>
            </div>


            {/* Form */}
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] tracking-widest">{t("create.name")}</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={14}
                className="w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
              />
              <LockedNote />


              <FieldLabel>{t("create.body")}</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {BODY_TYPES.map((b) => (
                  <button
                    key={b}
                    onClick={() =>
                      setAppearance((a) => {
                        const newBody = b as BodyType;
                        const fits = (g: CustomGarment | undefined) =>
                          !g || g.body === "both" || g.body === newBody;
                        const keepShirt = fits(a.customShirt) ? a.customShirt : undefined;
                        const keepPants = fits(a.customPants) ? a.customPants : undefined;
                        return {
                          ...a,
                          body: newBody,
                          customShirt: keepShirt,
                          customPants: keepPants,
                          shirtStyle:
                            !keepShirt && !keepPants ? "robe" : a.shirtStyle,
                        };
                      })
                    }
                    className={`border-4 py-2 text-[9px] uppercase ${
                      appearance.body === b
                        ? "border-[#ffd166] bg-[#ffd166]/10"
                        : "border-[#f4e9c1]/30"
                    }`}
                  >
                    {t(`body.${b}`)}
                  </button>
                ))}
              </div>
              <LockedNote />


              <FieldLabel>{t("create.skin")}</FieldLabel>
              <SwatchRow
                value={appearance.skin}
                options={SKIN_TONES}
                onChange={(v) => setA("skin", v)}
              />
              <LockedNote />

              <FieldLabel>{t("create.hairStyle")}</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_STYLES.map((s) => {
                  const active = !appearance.customHair && appearance.hairStyle === s;
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setAppearance((a) => ({
                          ...a,
                          hairStyle: s as HairStyle,
                          customHair: undefined,
                        }))
                      }
                      className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                        active
                          ? "border-[#ffd166] bg-[#ffd166]/10"
                          : "border-[#f4e9c1]/30"
                      }`}
                    >
                      {getHairOverrideName(s, lang) ?? t(`hair.${s}`)}
                    </button>
                  );
                })}
                {customHairs.map((h) => {
                  const active = appearance.customHair?.id === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() =>
                        setAppearance((a) => ({ ...a, customHair: h }))
                      }
                      className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                        active
                          ? "border-[#ffd166] bg-[#ffd166]/10"
                          : "border-[#ffd166]/60"
                      }`}
                    >
                      ★ {resolveLocalizedName(h.name, lang, "Custom")}
                    </button>
                  );
                })}
              </div>

              <FieldLabel>{t("create.hairColor")}</FieldLabel>
              <SwatchRow
                value={appearance.hairColor}
                options={HAIR_COLORS}
                onChange={(v) => setA("hairColor", v)}
              />
              <LockedNote />

              <FieldLabel>{t("create.eyes")}</FieldLabel>
              <SwatchRow
                value={appearance.eyeColor}
                options={EYE_COLORS}
                onChange={(v) => setA("eyeColor", v)}
              />
              <LockedNote />

              {appearance.body === "masc" && (
                <>
                  <FieldLabel>{t("create.beard")}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {BEARD_STYLES.map((b) => (
                      <button
                        key={b}
                        onClick={() => setA("beard", b as BeardStyle)}
                        className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                          appearance.beard === b
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


              <FieldLabel>{t("create.fullBody")}</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    setAppearance((a) => ({
                      ...a,
                      shirtStyle: "robe",
                      pantsStyle: a.pantsStyle,
                      customShirt:
                        a.customShirt?.slot === "fullbody" ? undefined : a.customShirt,
                      customPants:
                        a.customPants?.slot === "fullbody" ? undefined : a.customPants,
                    }))
                  }
                  className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                    !fullBodyActive && !fullBodyCustomActive
                      ? "border-[#ffd166] bg-[#ffd166]/10"
                      : "border-[#f4e9c1]/30"
                  }`}
                >
                  {t("create.none")}
                </button>
                {customFullBody.map((g) => {
                  const active =
                    appearance.customShirt?.id === g.id ||
                    appearance.customPants?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() =>
                        setAppearance((a) => ({
                          ...a,
                          customShirt: g,
                          customPants: undefined,
                        }))
                      }
                      className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                        active
                          ? "border-[#ffd166] bg-[#ffd166]/10"
                          : "border-[#ffd166]/60"
                      }`}
                    >
                      ★☰ {resolveLocalizedName(g.name, lang, "Custom")}
                    </button>
                  );
                })}
                {customShirts.map((g) => {
                  const active = appearance.customShirt?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() =>
                        setAppearance((a) => ({
                          ...a,
                          customShirt: g,
                          customPants:
                            a.customPants?.slot === "fullbody"
                              ? undefined
                              : a.customPants,
                        }))
                      }
                      className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                        active
                          ? "border-[#ffd166] bg-[#ffd166]/10"
                          : "border-[#ffd166]/60"
                      }`}
                    >
                      ★ {resolveLocalizedName(g.name, lang, "Custom")}
                    </button>
                  );
                })}
                {customPants.map((g) => {
                  const active = appearance.customPants?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() =>
                        setAppearance((a) => ({
                          ...a,
                          customPants: g,
                          customShirt:
                            a.customShirt?.slot === "fullbody"
                              ? undefined
                              : a.customShirt,
                        }))
                      }
                      className={`border-4 px-2 py-1.5 text-[9px] uppercase ${
                        active
                          ? "border-[#ffd166] bg-[#ffd166]/10"
                          : "border-[#ffd166]/60"
                      }`}
                    >
                      ★ {resolveLocalizedName(g.name, lang, "Custom")}
                    </button>
                  );
                })}
              </div>



              <FieldLabel>{t("create.outfit")}</FieldLabel>
              <SwatchRow
                value={appearance.shirt}
                options={OUTFIT_COLORS}
                onChange={(v) =>
                  setAppearance((a) => ({ ...a, shirt: v, pants: v }))
                }
              />

              {(shirtHasSecondary || pantsHasSecondary) && (
                <>
                  <FieldLabel>{t("create.outfitSecondary")}</FieldLabel>
                  <SwatchRow
                    value={appearance.shirtSecondary ?? OUTFIT_COLORS[1]}
                    options={OUTFIT_COLORS}
                    onChange={(v) =>
                      setAppearance((a) => ({
                        ...a,
                        shirtSecondary: v,
                        pantsSecondary: v,
                      }))
                    }
                  />
                </>
              )}

              {(shirtHasTertiary || pantsHasTertiary) && (
                <>
                  <FieldLabel>{t("create.outfitTertiary")}</FieldLabel>
                  <SwatchRow
                    value={
                      appearance.shirtTertiary ?? OUTFIT_COLORS[2] ?? OUTFIT_COLORS[0]
                    }
                    options={OUTFIT_COLORS}
                    onChange={(v) =>
                      setAppearance((a) => ({
                        ...a,
                        shirtTertiary: v,
                        pantsTertiary: v,
                      }))
                    }
                  />
                </>
              )}





              <FieldLabel>{t("create.boots")}</FieldLabel>
              <SwatchRow
                value={appearance.boots}
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
            onClick={() => onConfirm(index, name, appearance)}
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 mt-4 block text-[10px] tracking-widest">{children}</label>;
}


function LockedNote() {
  const { t } = useI18n();
  return (
    <div className="mt-1 text-[9px] leading-tight tracking-wide text-red-500">
      {t("create.locked")}
    </div>
  );
}

function SwatchRow({
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
