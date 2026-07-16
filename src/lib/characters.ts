import { DEFAULT_APPEARANCE, type Appearance } from "./appearance";

export type CharacterClass = "warrior" | "mage" | "archer";

export type Character = {
  name: string;
  // Classes were removed from the game. Kept optional so older saves that
  // still carry a class field continue to load cleanly.
  class?: CharacterClass;
  level: number;
  createdAt: number;
  appearance: Appearance;
};

export type SlotState = Character | null;

// Back-compat: older saves may lack `appearance` or newer fields.
export function ensureAppearance(c: Character): Character {
  const appearance = c.appearance
    ? {
        ...c.appearance,
        body: c.appearance.body ?? "masc",
        beard: c.appearance.beard ?? "none",
        boots: c.appearance.boots ?? DEFAULT_APPEARANCE.boots,
        eyeColor: c.appearance.eyeColor ?? DEFAULT_APPEARANCE.eyeColor,
        shirtStyle: c.appearance.shirtStyle ?? DEFAULT_APPEARANCE.shirtStyle,
        pantsStyle: c.appearance.pantsStyle ?? DEFAULT_APPEARANCE.pantsStyle,
      }
    : DEFAULT_APPEARANCE;
  // Migrate retired shirt styles onto the plain t-shirt.
  if (appearance.shirtStyle === "vest" || appearance.shirtStyle === "tunic") {
    appearance.shirtStyle = "tshirt";
  }
  return { ...c, appearance };
}






const KEY = "pixel-realms.slots";
const SLOTS = 3;

export function loadSlots(): SlotState[] {
  if (typeof window === "undefined") return Array(SLOTS).fill(null);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return Array(SLOTS).fill(null);
    const parsed = JSON.parse(raw) as SlotState[];
    if (!Array.isArray(parsed)) return Array(SLOTS).fill(null);
    const out = parsed.slice(0, SLOTS).map((c) => (c ? ensureAppearance(c) : null));
    while (out.length < SLOTS) out.push(null);
    return out;

  } catch {
    return Array(SLOTS).fill(null);
  }
}

export function saveSlots(slots: SlotState[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slots));
  } catch {
    /* ignore */
  }
}

// Merge a partial appearance update into the character at `index` and persist.
export function updateSlotAppearance(index: number, patch: Partial<Appearance>): Character | null {
  const slots = loadSlots();
  const c = slots[index];
  if (!c) return null;
  const next: Character = {
    ...c,
    appearance: { ...c.appearance, ...patch },
  };
  const nextSlots = [...slots];
  nextSlots[index] = next;
  saveSlots(nextSlots);
  return next;
}

const ACTIVE_KEY = "pixel-realms.active-slot";

export function setActiveSlot(index: number) {
  try {
    localStorage.setItem(ACTIVE_KEY, String(index));
  } catch {
    /* ignore */
  }
}

export function getActiveSlot(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n < SLOTS ? n : null;
  } catch {
    return null;
  }
}