// Shared pixel-character rendering + customization options.
// Sprite footprint: 16 wide × 32 tall, drawn from a top-left origin.

export type HairStyle =
  | "short"
  | "long"
  | "ponytail"
  | "topknot"
  | "mohawk"
  | "afro"
  | "spiky"
  | "curly"
  | "sidecut"
  | "braids"
  | "buzz"
  | "wild"
  | "bald"
  // kept in union for back-compat with older saves, not offered in the picker
  | "hood";

export type BeardStyle =
  | "none"
  | "stubble"
  | "mustache"
  | "goatee"
  | "chinstrap"
  | "full"
  | "long";

export type BodyType = "masc" | "fem";

export type ShirtStyle =
  | "tshirt"
  | "robe"
  | "greek"
  | "dress"
  | "suit"
  // legacy — kept in union for back-compat with old saves, not offered anymore
  | "tunic"
  | "vest";
export type PantsStyle = "trousers" | "shorts" | "skirt";

// ---------- Localized names (per-language overrides for admin-edited items) ----------
export type Lang = "pt" | "en" | "es";
export type LocalizedName = string | { pt?: string; en?: string; es?: string };

/** Resolve a LocalizedName for a given language, with graceful fallbacks. */
export function resolveLocalizedName(
  name: LocalizedName | undefined,
  lang: Lang,
  fallback = "",
): string {
  if (name == null) return fallback;
  if (typeof name === "string") return name || fallback;
  return name[lang] || name.pt || name.en || name.es || fallback;
}

/** Return only the exact-language value from a LocalizedName, or undefined. */
export function getLocalizedNameForLang(
  name: LocalizedName | undefined,
  lang: Lang,
): string | undefined {
  if (name == null) return undefined;
  if (typeof name === "string") return name.trim() || undefined;
  const v = name[lang];
  return v && v.trim() ? v : undefined;
}

/** Normalize raw storage/user input into a LocalizedName, or undefined if empty. */
export function sanitizeLocalizedName(v: unknown): LocalizedName | undefined {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : undefined;
  }
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>;
    const out: { pt?: string; en?: string; es?: string } = {};
    for (const l of ["pt", "en", "es"] as const) {
      const s = typeof rec[l] === "string" ? (rec[l] as string).trim() : "";
      if (s) out[l] = s;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}


export type HairTone = "dark" | "mid" | "light";
export type PixelTone =
  | HairTone
  | "dark2" | "mid2" | "light2"
  | "dark3" | "mid3" | "light3";
export const PIXEL_TONES: PixelTone[] = [
  "dark", "mid", "light",
  "dark2", "mid2", "light2",
  "dark3", "mid3", "light3",
];
export const SECONDARY_TONES: PixelTone[] = ["dark2", "mid2", "light2"];
export const TERTIARY_TONES: PixelTone[] = ["dark3", "mid3", "light3"];
export type HairPixels = Record<string, HairTone>;
export type GarmentPixels = Record<string, PixelTone>;
export type CustomHair = {
  id: string;
  name: LocalizedName;
  back: HairPixels;
  front: HairPixels;
};

/** True if any pixel value in back/front uses a secondary tone. */
export function hasSecondaryPixels(
  back: Record<string, string> | undefined,
  front: Record<string, string> | undefined,
): boolean {
  const check = (m: Record<string, string> | undefined) => {
    if (!m) return false;
    for (const v of Object.values(m)) {
      if (v === "dark2" || v === "mid2" || v === "light2") return true;
    }
    return false;
  };
  return check(back) || check(front);
}

/** True if any pixel value in back/front uses a tertiary tone. */
export function hasTertiaryPixels(
  back: Record<string, string> | undefined,
  front: Record<string, string> | undefined,
): boolean {
  const check = (m: Record<string, string> | undefined) => {
    if (!m) return false;
    for (const v of Object.values(m)) {
      if (v === "dark3" || v === "mid3" || v === "light3") return true;
    }
    return false;
  };
  return check(back) || check(front);
}

export type Appearance = {
  body: BodyType;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  beard: BeardStyle;
  shirt: string;
  shirtStyle: ShirtStyle;
  pants: string;
  pantsStyle: PantsStyle;
  boots: string;
  eyeColor: string;
  /** Optional player-drawn hair. When set, replaces the built-in hair sprite. */
  customHair?: CustomHair;
  /** Optional custom shirt (or fullbody) garment. */
  customShirt?: CustomGarment;
  /** Optional custom pants (or fullbody) garment. */
  customPants?: CustomGarment;
  /** Optional secondary color for shirt/fullbody garments that use it. */
  shirtSecondary?: string;
  /** Optional secondary color for pants garments that use it. */
  pantsSecondary?: string;
  /** Optional tertiary color for shirt/fullbody garments that use it. */
  shirtTertiary?: string;
  /** Optional tertiary color for pants garments that use it. */
  pantsTertiary?: string;
};

const CUSTOM_HAIR_KEY = "custom-hairs-v1";
const HAIR_TONES: HairTone[] = ["dark", "mid", "light"];
const PIXEL_TONE_SET: string[] = [
  "dark", "mid", "light",
  "dark2", "mid2", "light2",
  "dark3", "mid3", "light3",
];

function sanitizePixels(m: unknown): HairPixels {
  if (!m || typeof m !== "object") return {};
  const out: HairPixels = {};
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v === "string" && (HAIR_TONES as string[]).includes(v)) {
      out[k] = v as HairTone;
    }
  }
  return out;
}

function sanitizeGarmentPixels(m: unknown): GarmentPixels {
  if (!m || typeof m !== "object") return {};
  const out: GarmentPixels = {};
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (typeof v === "string" && PIXEL_TONE_SET.includes(v)) {
      out[k] = v as PixelTone;
    }
  }
  return out;
}

export function loadCustomHairs(): CustomHair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_HAIR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((h) => h && typeof h.id === "string")
      .map((h) => ({
        id: h.id,
        name: sanitizeLocalizedName(h.name) ?? "Custom",
        back: sanitizePixels(h.back),
        front: sanitizePixels(h.front),
      }));
  } catch {
    return [];
  }
}

export function saveCustomHairs(list: CustomHair[]) {
  try {
    localStorage.setItem(CUSTOM_HAIR_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function addCustomHair(hair: Omit<CustomHair, "id"> & { id?: string }): CustomHair {
  const list = loadCustomHairs();
  const created: CustomHair = {
    id: hair.id ?? `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizeLocalizedName(hair.name) ?? "Custom",
    back: hair.back,
    front: hair.front,
  };
  list.push(created);
  saveCustomHairs(list);
  return created;
}

export function deleteCustomHair(id: string) {
  saveCustomHairs(loadCustomHairs().filter((h) => h.id !== id));
}

export function updateCustomHair(hair: CustomHair) {
  saveCustomHairs(loadCustomHairs().map((h) => (h.id === hair.id ? hair : h)));
}

// ---------- Custom garments (admin-drawn clothing) ----------
export type GarmentSlot = "shirt" | "pants" | "fullbody";
export type GarmentBody = "masc" | "fem" | "both";

export type CustomGarment = {
  id: string;
  name: LocalizedName;
  slot: GarmentSlot;
  body: GarmentBody;
  back: GarmentPixels;
  front: GarmentPixels;
};

const CUSTOM_GARMENT_KEY = "custom-garments-v1";

export function loadCustomGarments(): CustomGarment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_GARMENT_KEY);
    const defaultGarments: CustomGarment[] = [
      {
        id: "built-in-rag",
        name: { pt: "Trapo", en: "Rag", es: "Trapo" },
        slot: "fullbody",
        body: "both",
        back: {},
        front: {"2,13":"mid","3,13":"mid","3,14":"mid","3,12":"mid","2,12":"mid","3,11":"mid","12,14":"mid","12,13":"mid","13,13":"mid","13,12":"mid","12,12":"mid","12,11":"mid","6,11":"mid","6,12":"dark2","7,12":"mid","8,12":"mid","9,12":"mid","9,11":"mid","10,11":"mid","11,11":"mid","11,12":"mid","11,13":"mid","11,14":"mid","11,15":"dark2","11,16":"dark2","11,17":"dark2","11,18":"dark2","11,19":"mid","11,20":"dark","11,21":"mid","11,22":"mid","10,22":"mid","9,22":"mid","9,23":"mid","8,23":"mid","7,23":"mid","6,23":"mid","5,23":"mid","4,23":"mid","4,22":"mid","4,21":"mid","4,20":"dark","4,19":"mid","4,18":"mid","4,17":"mid","4,16":"mid","4,15":"mid","4,14":"mid","4,13":"dark2","4,12":"dark2","4,11":"dark2","5,11":"dark2","5,12":"dark2","5,13":"dark2","5,14":"dark2","5,15":"mid","5,16":"mid","6,14":"dark2","6,13":"dark2","7,13":"dark2","8,13":"dark2","8,14":"dark2","7,15":"dark2","7,16":"mid","6,16":"mid","6,17":"mid","7,17":"mid","8,15":"dark2","9,14":"dark2","9,15":"dark2","9,16":"dark2","8,16":"mid","8,17":"mid","8,18":"mid","7,18":"mid","7,19":"mid","8,19":"mid","9,17":"mid","9,18":"mid","9,19":"mid","8,20":"dark","7,21":"dark","8,21":"mid","9,20":"dark","9,21":"mid","8,22":"mid","7,22":"mid","6,22":"mid","5,22":"mid","5,21":"mid","5,20":"dark","5,19":"mid","6,19":"mid","6,18":"mid","6,20":"dark","6,21":"dark","7,20":"dark","10,20":"dark","4,24":"mid","5,24":"mid","6,24":"mid","7,24":"mid","8,24":"mid","9,24":"mid","10,23":"mid","11,23":"mid","10,21":"mid","10,18":"mid","10,17":"dark2","10,16":"dark2","10,15":"dark2","10,14":"dark2","10,13":"mid","10,12":"mid","9,13":"mid","7,14":"dark2","6,15":"mid","5,17":"mid","5,18":"mid","10,19":"mid","4,26":"mid","5,26":"mid","6,26":"mid","7,26":"mid","8,26":"mid","9,26":"mid","9,25":"mid","10,24":"mid","11,24":"mid","10,25":"mid","11,25":"mid","8,25":"mid","7,25":"mid","6,25":"mid","5,25":"mid","4,25":"mid"}
      },
      {
        id: "built-in-vest",
        name: { pt: "Colete", en: "Vest", es: "Chaleco" },
        slot: "fullbody",
        body: "fem",
        back: {},
        front: {"4,16":"dark","4,17":"dark","11,12":"dark","11,13":"dark","11,14":"dark","11,15":"dark","11,16":"dark","11,17":"dark","11,18":"dark","11,19":"dark","5,14":"mid","6,14":"mid","9,14":"mid","10,14":"mid","2,12":"mid","3,12":"mid","3,13":"mid","4,13":"mid","4,12":"mid","4,11":"mid","5,11":"mid","6,11":"mid","6,12":"mid","7,12":"mid","7,13":"mid","8,13":"mid","9,12":"mid","9,11":"mid","10,11":"mid","11,11":"mid","10,12":"mid","10,13":"mid","9,13":"mid","6,13":"mid","5,13":"mid","5,12":"mid","4,14":"mid","4,15":"mid","5,15":"dark","5,16":"mid","5,17":"mid","4,18":"mid","4,19":"mid","5,19":"mid","6,18":"mid","7,18":"mid","8,18":"mid","9,18":"mid","9,19":"mid","10,19":"mid","8,19":"mid","7,19":"mid","6,19":"mid","5,18":"mid","6,17":"mid","7,17":"mid","7,16":"mid","7,15":"mid","7,14":"mid","8,14":"mid","8,15":"mid","8,16":"mid","8,17":"mid","6,16":"mid","6,15":"dark","9,15":"dark","10,15":"dark","10,16":"mid","9,16":"mid","10,17":"mid","10,18":"mid","9,17":"mid","12,13":"mid","12,12":"mid","13,12":"mid","4,20":"mid","4,21":"dark","4,22":"dark","4,23":"mid","4,24":"mid","3,24":"mid","3,23":"dark","3,25":"mid","4,25":"dark","5,25":"dark","6,25":"mid","7,25":"mid","8,25":"mid","8,24":"mid","9,24":"mid","10,24":"mid","10,23":"mid","11,23":"mid","12,23":"mid","12,22":"mid","12,21":"mid","11,21":"mid","11,20":"mid","11,22":"mid","10,22":"dark","9,22":"dark","8,22":"mid","7,22":"mid","6,22":"mid","6,23":"mid","5,23":"mid","5,24":"mid","6,24":"dark","7,24":"dark","7,23":"mid","8,23":"dark","9,23":"dark","10,21":"dark","9,21":"mid","8,21":"mid","7,21":"mid","6,21":"mid","5,22":"mid","5,21":"mid","6,20":"mid","5,20":"mid","7,20":"mid","8,20":"mid","9,20":"mid","10,20":"mid","3,22":"dark"}
      },
      {
        id: "built-in-farrapo",
        name: { pt: "Farrapo", en: "Rag", es: "Harapo" },
        slot: "fullbody",
        body: "masc",
        back: {},
        front: {"4,19":"mid","4,20":"mid2","4,21":"dark2","4,22":"mid","4,23":"mid","4,24":"dark","4,25":"dark","5,18":"mid","5,19":"mid","5,20":"mid2","5,21":"dark2","5,22":"dark","5,23":"mid","5,24":"dark","6,17":"dark","6,18":"mid","6,19":"mid","6,20":"mid2","6,21":"dark2","6,22":"dark","6,23":"mid","7,15":"mid","7,16":"dark","7,17":"dark","7,18":"mid","7,19":"dark","7,20":"dark2","7,21":"dark2","7,22":"mid","7,23":"mid","8,14":"dark","8,15":"dark","8,16":"dark","8,17":"mid","8,18":"mid","8,19":"dark","8,20":"dark2","8,21":"dark2","8,22":"mid","8,23":"dark","9,13":"dark","9,14":"dark","9,15":"mid","9,16":"mid","9,17":"dark","9,18":"dark","9,19":"dark","9,20":"dark2","9,21":"mid","9,22":"mid","9,23":"mid","10,12":"mid","10,13":"dark","10,14":"mid","10,15":"mid","10,16":"dark","10,17":"dark","10,18":"mid","10,19":"dark","10,20":"dark2","10,21":"dark","10,22":"dark","11,11":"mid","11,12":"mid","11,13":"mid","11,14":"dark","11,15":"dark","11,16":"dark","11,17":"dark","11,18":"dark","11,19":"dark","11,20":"dark2","11,21":"mid","6,24":"mid"}
      }
    ];
    if (!raw) return defaultGarments;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultGarments;
    const userGarments = parsed
      .filter(
        (g) =>
          g &&
          typeof g.id === "string" &&
          g.id !== "built-in-rag" &&
          g.id !== "built-in-vest" &&
          g.id !== "built-in-farrapo" &&
          (g.slot === "shirt" || g.slot === "pants" || g.slot === "fullbody"),
      )

      .map((g) => ({
        id: g.id,
        name: sanitizeLocalizedName(g.name) ?? "Custom",
        slot: g.slot as GarmentSlot,
        body: (
          g.body === "fem" || g.body === "female" || g.body === "feminine" || g.body === "f"
            ? "fem"
            : g.body === "masc" || g.body === "male" || g.body === "masculine" || g.body === "m"
              ? "masc"
              : "both"
        ) as GarmentBody,
        back: sanitizeGarmentPixels(g.back),
        front: sanitizeGarmentPixels(g.front),
      }));
    return [...defaultGarments, ...userGarments];
  } catch {
    return [];
  }
}

export function saveCustomGarments(list: CustomGarment[]) {
  try {
    localStorage.setItem(CUSTOM_GARMENT_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function addCustomGarment(
  g: Omit<CustomGarment, "id"> & { id?: string },
): CustomGarment {
  const list = loadCustomGarments();
  const created: CustomGarment = {
    id: g.id ?? `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizeLocalizedName(g.name) ?? "Custom",
    slot: g.slot,
    body: g.body,
    back: g.back,
    front: g.front,
  };
  list.push(created);
  saveCustomGarments(list);
  return created;
}

export function updateCustomGarment(g: CustomGarment) {
  saveCustomGarments(loadCustomGarments().map((x) => (x.id === g.id ? g : x)));
}

export function deleteCustomGarment(id: string) {
  saveCustomGarments(loadCustomGarments().filter((g) => g.id !== id));
}

// ---------- Built-in hair style overrides (admin can redraw base styles) ----------
const HAIR_OVERRIDE_KEY = "hair-overrides-v1";
export type HairStyleOverride = { back: HairPixels; front: HairPixels; name?: LocalizedName };
export type HairStyleOverrides = Partial<Record<HairStyle, HairStyleOverride>>;

const DEFAULT_HAIR_OVERRIDES: HairStyleOverrides = {
  "mohawk": {
    "back": {"4,8":"mid","3,8":"mid","3,7":"mid","2,7":"mid","1,6":"mid","2,6":"mid","3,5":"mid","4,5":"mid","2,5":"mid","3,4":"mid","4,4":"mid","3,3":"mid","2,3":"mid","1,2":"mid","1,1":"mid","0,1":"mid","0,0":"mid","2,1":"mid","3,1":"mid","3,2":"mid","4,2":"mid","5,2":"mid","2,2":"mid","3,0":"mid","3,-1":"mid","3,-2":"mid","3,-3":"mid","4,-3":"mid","5,-2":"mid","6,-1":"mid","7,0":"mid","8,0":"mid","8,1":"mid","7,1":"mid","6,0":"mid","5,0":"mid","4,-1":"mid","4,-2":"mid","5,1":"mid","5,-1":"mid","4,0":"mid"},
    "front": {"8,1":"mid","9,1":"mid","9,2":"mid","10,2":"mid","10,3":"mid","11,3":"mid","12,3":"mid","13,3":"mid","13,2":"mid","13,1":"mid","13,0":"mid","13,-1":"mid","13,-2":"mid","13,-3":"mid","12,-2":"mid","12,-1":"mid","12,0":"mid","12,1":"mid","12,2":"mid","11,2":"mid","10,1":"mid","9,0":"mid","10,0":"mid","10,-1":"mid","10,-2":"mid","10,-3":"mid","10,-4":"mid","9,-3":"mid","9,-2":"mid","9,-1":"mid","8,-1":"mid","8,0":"mid","7,0":"mid","6,0":"mid"}
  },
  "braids": {
    "back": {"4,9":"mid","4,10":"dark","5,10":"mid","4,11":"mid","3,11":"mid","3,10":"mid","2,11":"dark","2,12":"mid","2,13":"mid","1,13":"dark","1,14":"mid","1,15":"dark","1,16":"mid","1,12":"mid"},
    "front": {"3,4":"mid","4,4":"mid","5,3":"mid","6,3":"mid","6,2":"mid","7,2":"mid","8,2":"mid","8,1":"mid","9,1":"mid","10,1":"mid","10,2":"mid","10,3":"mid","11,3":"mid","11,4":"mid","12,4":"mid","12,3":"mid","11,2":"light","11,1":"light","7,1":"mid","6,1":"mid","5,1":"dark","5,2":"mid","4,2":"dark","3,3":"dark","4,3":"mid","4,1":"dark"}
  },
  "wild": {
    "back": {"4,10":"dark","4,9":"dark","3,11":"dark","3,12":"dark","3,10":"dark","3,9":"dark","3,13":"dark","2,13":"dark","2,14":"dark","1,14":"dark","1,15":"dark","1,16":"dark","1,13":"dark","2,12":"dark","2,11":"dark","5,9":"dark","5,8":"dark","6,8":"dark","6,9":"dark","6,10":"dark","6,11":"dark","7,12":"dark","7,11":"dark","7,9":"dark","7,8":"dark","8,8":"dark","8,10":"dark","9,14":"dark","10,16":"dark","9,15":"dark","5,10":"dark","5,11":"dark","8,9":"dark","9,11":"dark","9,9":"dark","10,6":"dark","11,5":"dark","11,6":"dark","12,7":"dark","12,8":"dark","12,9":"dark","12,10":"dark","11,8":"dark","10,7":"dark","10,8":"dark","11,10":"dark","11,11":"dark","12,11":"dark","11,9":"dark","9,8":"dark","10,9":"dark","10,10":"dark","9,10":"dark","12,12":"dark","13,12":"dark","13,13":"dark","14,13":"dark","14,12":"dark","15,12":"dark","15,11":"dark","13,10":"dark","13,8":"dark","14,14":"dark","15,15":"dark","15,14":"dark","13,11":"dark","3,8":"dark","3,7":"dark","3,6":"dark","3,5":"dark","3,4":"dark","3,3":"dark","3,2":"dark","3,1":"dark","4,1":"dark","5,0":"dark","6,0":"dark","7,0":"dark","8,0":"dark","9,0":"dark","11,0":"dark","12,1":"dark","13,1":"dark","13,2":"dark","13,3":"dark","13,4":"dark","13,5":"dark"},
    "front": {"8,1":"mid","7,2":"mid","7,3":"mid","6,3":"mid","5,4":"mid","4,4":"mid","4,5":"mid","4,6":"mid","4,7":"mid","4,8":"mid","5,8":"mid","6,8":"mid","6,9":"mid","7,9":"mid","7,10":"mid","8,10":"mid","8,11":"mid","9,11":"mid","10,11":"mid","11,12":"mid","12,12":"mid","11,1":"mid","10,1":"mid","11,2":"mid","12,2":"mid","12,3":"mid","12,4":"mid","13,4":"mid","3,3":"dark","4,3":"dark","5,3":"dark","5,2":"dark","4,2":"dark","6,2":"dark","6,1":"dark","7,1":"dark","5,1":"dark","4,1":"dark","5,9":"dark","4,9":"dark","3,9":"dark"}
  },
  "sidecut": {
    "back": {},
    "front": {"4,-1":"mid","5,-1":"mid","6,-1":"mid","7,-1":"mid","8,-1":"mid","3,0":"mid","4,0":"mid","5,0":"light","6,0":"light","7,0":"mid","8,0":"mid","9,0":"mid","10,0":"mid","3,1":"mid","4,1":"mid","5,1":"mid","6,1":"mid","7,1":"mid","8,1":"mid","9,1":"mid","3,2":"mid","4,2":"mid","5,2":"mid","6,2":"mid","7,2":"mid","8,2":"mid","3,3":"mid","4,3":"mid","3,4":"mid","4,4":"mid","6,4":"dark","7,4":"dark","9,4":"dark","10,4":"dark","3,5":"dark","4,5":"dark","11,0":"mid","11,1":"mid","12,1":"mid","12,2":"mid","12,3":"mid","12,4":"mid"}
  },
  "topknot": {
    "back": {},
    "front": {"7,-2":"mid","8,-2":"mid","6,-1":"mid","7,-1":"light","8,-1":"mid","9,-1":"mid","6,0":"mid","7,0":"mid","8,0":"mid","9,0":"dark","4,1":"mid","5,1":"mid","6,1":"dark","7,1":"dark","8,1":"dark","9,1":"dark","10,1":"mid","11,1":"mid","4,2":"mid","5,2":"mid","6,2":"mid","7,2":"mid","8,2":"mid","9,2":"mid","10,2":"mid","11,2":"mid","4,3":"mid","11,3":"mid","4,4":"mid","6,4":"dark","7,4":"dark","9,4":"dark","10,4":"dark"}
  },
  "curly": {
    "back": {},
    "front": {"3,4":"mid","3,3":"mid","4,3":"mid","4,4":"mid","5,3":"mid","5,2":"mid","5,1":"mid","6,1":"mid","7,1":"mid","6,0":"mid","7,2":"mid","6,2":"mid","8,1":"mid","8,2":"mid","7,0":"mid","8,0":"mid","9,1":"mid","9,0":"mid","10,0":"mid","10,1":"mid","11,1":"mid","11,2":"mid","10,2":"mid","11,3":"mid","12,2":"mid","12,3":"mid","12,4":"mid","4,2":"mid","3,2":"mid","3,1":"mid","4,1":"mid","4,0":"mid","5,0":"mid","11,0":"mid"}
  },
  "buzz": {
    "back": {},
    "front": {"4,1":"dark","5,1":"dark","10,1":"dark","11,1":"dark","9,1":"dark","8,1":"dark","7,1":"dark","6,1":"dark","4,2":"dark","4,3":"dark","4,4":"dark","4,5":"light","4,6":"light","5,2":"dark"}
  },
  "long": {
    "back": {},
    "front": {"4,0":"mid","5,0":"mid","6,0":"mid","7,0":"mid","8,0":"mid","9,0":"mid","10,0":"mid","11,0":"mid","3,1":"mid","4,1":"mid","5,1":"mid","6,1":"light","7,1":"mid","8,1":"mid","9,1":"mid","10,1":"mid","11,1":"mid","12,1":"mid","2,2":"mid","3,2":"mid","4,2":"mid","5,2":"mid","6,2":"mid","7,2":"mid","8,2":"mid","9,2":"mid","10,2":"mid","11,2":"mid","12,2":"mid","13,2":"mid","2,3":"mid","3,3":"mid","4,3":"mid","11,3":"mid","12,3":"mid","13,3":"mid","2,4":"mid","3,4":"mid","6,4":"dark","7,4":"dark","9,4":"dark","10,4":"dark","12,4":"mid","13,4":"mid","2,5":"light","3,5":"mid","12,5":"mid","13,5":"dark","2,6":"mid","3,6":"mid","12,6":"mid","13,6":"dark","2,7":"mid","3,7":"mid","12,7":"mid","13,7":"dark","2,8":"light","3,8":"mid","12,8":"mid","13,8":"dark","1,9":"mid","2,9":"light","3,9":"mid","4,9":"mid","11,9":"mid","12,9":"mid","13,9":"dark","14,9":"mid","1,10":"light","2,10":"mid","3,10":"mid","4,10":"mid","5,10":"mid","6,10":"mid","9,10":"mid","10,10":"mid","11,10":"mid","12,10":"mid","13,10":"dark","14,10":"mid","1,11":"light","2,11":"mid","13,11":"dark","14,11":"mid","1,12":"light","14,12":"mid","1,13":"light","14,13":"mid","1,14":"mid","14,14":"dark","1,15":"mid","14,15":"dark","1,16":"mid","14,16":"mid","4,6":"mid","4,5":"mid","5,4":"mid","5,3":"mid","4,4":"mid"}
  }
};

let _hairOverridesCache: HairStyleOverrides | null = null;

export function loadHairOverrides(): HairStyleOverrides {
  if (_hairOverridesCache) return _hairOverridesCache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HAIR_OVERRIDE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const out: HairStyleOverrides = { ...DEFAULT_HAIR_OVERRIDES };
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v && typeof v === "object") {
          const rec = v as { back?: unknown; front?: unknown; name?: unknown };
          const nm = sanitizeLocalizedName(rec.name);
          out[k as HairStyle] = {
            back: sanitizePixels(rec.back),
            front: sanitizePixels(rec.front),
            ...(nm ? { name: nm } : {}),
          };
        }
      }
    }
    _hairOverridesCache = out;
    return out;
  } catch {
    _hairOverridesCache = { ...DEFAULT_HAIR_OVERRIDES };
    return _hairOverridesCache;
  }
}

export function getHairOverride(style: HairStyle): HairStyleOverride | undefined {
  return loadHairOverrides()[style];
}

export function saveHairOverride(
  style: HairStyle,
  back: HairPixels,
  front: HairPixels,
  name?: LocalizedName,
) {
  const all = loadHairOverrides();
  const norm = sanitizeLocalizedName(name);
  const entry: HairStyleOverride = { back, front };
  if (norm) entry.name = norm;
  const next = { ...all, [style]: entry };
  try {
    localStorage.setItem(HAIR_OVERRIDE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  _hairOverridesCache = next;
}

export function getHairOverrideName(style: HairStyle, lang: Lang): string | undefined {
  return getLocalizedNameForLang(loadHairOverrides()[style]?.name, lang);
}

/** Raw LocalizedName override (or undefined). Use to prefill the admin editor. */
export function getHairOverrideRawName(style: HairStyle): LocalizedName | undefined {
  return loadHairOverrides()[style]?.name;
}

export function deleteHairOverride(style: HairStyle) {
  const all = { ...loadHairOverrides() };
  delete all[style];
  try {
    localStorage.setItem(HAIR_OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  _hairOverridesCache = all;
}

/**
 * Rasterize a built-in hair style into a HairStyleOverride by rendering
 * the character to an offscreen canvas with a marker hair color and
 * classifying each opaque pixel as one of the three tones.
 * All pixels go into `front`; the admin can move any to `back` manually.
 * `padTop` allocates rows above y=0 for tall styles (mohawk, afro).
 * Pixels above y=0 are stored with negative y keys.
 */
export function rasterizeBuiltinHair(style: HairStyle, padTop = 4): HairStyleOverride {
  if (typeof document === "undefined") return { back: {}, front: {} };
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H + padTop;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { back: {}, front: {} };
  const HAIR = "#ff00ff";
  const app: Appearance = {
    ...DEFAULT_APPEARANCE,
    hairStyle: style,
    hairColor: HAIR,
    beard: "none",
    skin: "#00ff00",
    eyeColor: "#0d1b2a",
  };
  drawCharacter(ctx, 0, padTop, app);
  const parseHex = (h: string): [number, number, number] => {
    const s = h.replace("#", "");
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  };
  const [dr, dg, db] = parseHex(shade(HAIR, -0.3));
  const [mr, mg, mb] = parseHex(HAIR);
  const [lr, lg, lb] = parseHex(shade(HAIR, 0.22));
  const front: HairPixels = {};
  const img = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H + padTop).data;
  for (let y = 0; y < SPRITE_H + padTop; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const i = (y * SPRITE_W + x) * 4;
      const r = img[i];
      const g = img[i + 1];
      const b = img[i + 2];
      const a = img[i + 3];
      if (a === 0) continue;
      const yk = y - padTop;
      const key = `${x},${yk}`;
      if (r === dr && g === dg && b === db) front[key] = "dark";
      else if (r === mr && g === mg && b === mb) front[key] = "mid";
      else if (r === lr && g === lg && b === lb) front[key] = "light";
    }
  }
  return { back: {}, front };
}

// ---------- Built-in beard style overrides ----------
const BEARD_OVERRIDE_KEY = "beard-overrides-v1";
export type BeardStyleOverride = { back: HairPixels; front: HairPixels; name?: LocalizedName };
export type BeardStyleOverrides = Partial<Record<BeardStyle, BeardStyleOverride>>;

const DEFAULT_BEARD_OVERRIDES: BeardStyleOverrides = {
  "chinstrap": {
    "back": {},
    "front": {"5,8":"mid","11,8":"mid","5,9":"mid","6,9":"mid","7,9":"mid","8,9":"mid","9,9":"mid","10,9":"mid","4,8":"mid","4,7":"mid","4,6":"mid"}
  },
  "stubble": {
    "back": {},
    "front": {"6,8":"light","10,8":"light","7,9":"light","9,9":"light","11,9":"light","5,9":"light","5,8":"light","4,7":"light","4,8":"light","6,9":"light","8,9":"light","10,9":"light","11,8":"light","7,8":"light"}
  },
  "long": {
    "back": {},
    "front": {"7,7":"mid","8,7":"mid","9,7":"mid","10,7":"mid","5,8":"mid","6,8":"mid","7,8":"mid","10,8":"mid","11,8":"mid","5,9":"mid","6,9":"mid","7,9":"mid","8,9":"mid","9,9":"mid","10,9":"mid","7,10":"mid","8,10":"mid","9,10":"mid","10,10":"mid","7,11":"mid","8,11":"mid","9,11":"mid","10,11":"mid","8,12":"mid","9,12":"mid","8,13":"mid","9,13":"mid","8,14":"dark","9,14":"dark"}
  },
  "full": {
    "back": {},
    "front": {"7,7":"mid","8,7":"mid","9,7":"mid","10,7":"mid","5,8":"mid","6,8":"mid","7,8":"mid","10,8":"mid","11,8":"mid","5,9":"mid","6,9":"mid","7,9":"mid","8,9":"mid","9,9":"mid","10,9":"mid","8,10":"mid","9,10":"mid"}
  },
  "goatee": {
    "back": {},
    "front": {"7,7":"mid","8,7":"mid","9,7":"mid","10,7":"mid","7,8":"dark","10,8":"dark","7,9":"mid","8,9":"mid","9,9":"mid","10,9":"mid","8,10":"mid","9,10":"mid"}
  }
};

let _beardOverridesCache: BeardStyleOverrides | null = null;

export function loadBeardOverrides(): BeardStyleOverrides {
  if (_beardOverridesCache) return _beardOverridesCache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BEARD_OVERRIDE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const out: BeardStyleOverrides = { ...DEFAULT_BEARD_OVERRIDES };
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v && typeof v === "object") {
          const rec = v as { back?: unknown; front?: unknown; name?: unknown };
          const nm = sanitizeLocalizedName(rec.name);
          out[k as BeardStyle] = {
            back: sanitizePixels(rec.back),
            front: sanitizePixels(rec.front),
            ...(nm ? { name: nm } : {}),
          };
        }
      }
    }
    _beardOverridesCache = out;
    return out;
  } catch {
    _beardOverridesCache = { ...DEFAULT_BEARD_OVERRIDES };
    return _beardOverridesCache;
  }
}

export function getBeardOverride(style: BeardStyle): BeardStyleOverride | undefined {
  return loadBeardOverrides()[style];
}

export function saveBeardOverride(
  style: BeardStyle,
  back: HairPixels,
  front: HairPixels,
  name?: LocalizedName,
) {
  const all = loadBeardOverrides();
  const norm = sanitizeLocalizedName(name);
  const entry: BeardStyleOverride = { back, front };
  if (norm) entry.name = norm;
  const next = { ...all, [style]: entry };
  try {
    localStorage.setItem(BEARD_OVERRIDE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  _beardOverridesCache = next;
}

export function getBeardOverrideRawName(style: BeardStyle): LocalizedName | undefined {
  return loadBeardOverrides()[style]?.name;
}

export function deleteBeardOverride(style: BeardStyle) {
  const all = { ...loadBeardOverrides() };
  delete all[style];
  try {
    localStorage.setItem(BEARD_OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  _beardOverridesCache = all;
}

/**
 * Rasterize a built-in beard style into a HairStyleOverride-like map so admins
 * can start from the default pixels. Uses marker colors to classify tones.
 */
export function rasterizeBuiltinBeard(style: BeardStyle): { back: HairPixels; front: HairPixels } {
  if (typeof document === "undefined") return { back: {}, front: {} };
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { back: {}, front: {} };
  const MID: [number, number, number] = [255, 0, 255];
  const DARK: [number, number, number] = [0, 255, 255];
  const LIGHT: [number, number, number] = [255, 255, 0];
  drawBeard(ctx, 0, 0, style, "#ff00ff", "#00ffff", "#ffff00");
  const front: HairPixels = {};
  const img = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H).data;
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const i = (y * SPRITE_W + x) * 4;
      const r = img[i], g = img[i + 1], b = img[i + 2], a = img[i + 3];
      if (a === 0) continue;
      const key = `${x},${y}`;
      if (r === DARK[0] && g === DARK[1] && b === DARK[2]) front[key] = "dark";
      else if (r === MID[0] && g === MID[1] && b === MID[2]) front[key] = "mid";
      else if (r === LIGHT[0] && g === LIGHT[1] && b === LIGHT[2]) front[key] = "light";
    }
  }
  return { back: {}, front };
}


const SHIRT_OVERRIDE_KEY = "shirt-overrides-v1";
const PANTS_OVERRIDE_KEY = "pants-overrides-v1";
export type GarmentStyleOverride = { back: GarmentPixels; front: GarmentPixels };
export type GarmentStyleOverrideByBody = {
  masc?: GarmentStyleOverride;
  fem?: GarmentStyleOverride;
  name?: LocalizedName;
};
export type ShirtStyleOverrides = Partial<Record<ShirtStyle, GarmentStyleOverrideByBody>>;
export type PantsStyleOverrides = Partial<Record<PantsStyle, GarmentStyleOverrideByBody>>;

let _shirtOverridesCache: ShirtStyleOverrides | null = null;
let _pantsOverridesCache: PantsStyleOverrides | null = null;

function loadGarmentOverridesFrom<K extends string>(
  key: string,
): Partial<Record<K, GarmentStyleOverrideByBody>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out: Partial<Record<K, GarmentStyleOverrideByBody>> = {};
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (!v || typeof v !== "object") continue;
        const rec = v as Record<string, unknown>;
        // New format: { masc?: {back, front}, fem?: {back, front}, name? }
        const parsedName = sanitizeLocalizedName(rec.name);
        if (rec.masc || rec.fem || parsedName) {
          const entry: GarmentStyleOverrideByBody = {};
          for (const b of ["masc", "fem"] as const) {
            const bv = rec[b] as { back?: unknown; front?: unknown } | undefined;
            if (bv && typeof bv === "object") {
              entry[b] = {
                back: sanitizeGarmentPixels(bv.back),
                front: sanitizeGarmentPixels(bv.front),
              };
            }
          }
          if (parsedName) entry.name = parsedName;
          out[k as K] = entry;
        } else if ("back" in rec || "front" in rec) {
          // Legacy format: apply to both bodies so existing edits are preserved.
          const legacy = {
            back: sanitizeGarmentPixels(rec.back),
            front: sanitizeGarmentPixels(rec.front),
          };
          out[k as K] = { masc: legacy, fem: legacy };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function loadShirtOverrides(): ShirtStyleOverrides {
  if (_shirtOverridesCache) return _shirtOverridesCache;
  _shirtOverridesCache = loadGarmentOverridesFrom<ShirtStyle>(SHIRT_OVERRIDE_KEY);
  return _shirtOverridesCache;
}
export function loadPantsOverrides(): PantsStyleOverrides {
  if (_pantsOverridesCache) return _pantsOverridesCache;
  _pantsOverridesCache = loadGarmentOverridesFrom<PantsStyle>(PANTS_OVERRIDE_KEY);
  return _pantsOverridesCache;
}
export function getShirtOverride(
  style: ShirtStyle,
  body: BodyType,
): GarmentStyleOverride | undefined {
  return loadShirtOverrides()[style]?.[body];
}
export function getPantsOverride(
  style: PantsStyle,
  body: BodyType,
): GarmentStyleOverride | undefined {
  return loadPantsOverrides()[style]?.[body];
}
export function saveShirtOverride(
  style: ShirtStyle,
  body: BodyType,
  back: GarmentPixels,
  front: GarmentPixels,
  name?: LocalizedName,
) {
  const current = loadShirtOverrides();
  const prev = current[style] ?? {};
  const norm = sanitizeLocalizedName(name);
  const entry: GarmentStyleOverrideByBody = {
    ...prev,
    [body]: { back, front },
  };
  if (norm) entry.name = norm;
  else delete entry.name;
  const next = { ...current, [style]: entry };
  try {
    localStorage.setItem(SHIRT_OVERRIDE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  _shirtOverridesCache = next;
}
export function savePantsOverride(
  style: PantsStyle,
  body: BodyType,
  back: GarmentPixels,
  front: GarmentPixels,
  name?: LocalizedName,
) {
  const current = loadPantsOverrides();
  const prev = current[style] ?? {};
  const norm = sanitizeLocalizedName(name);
  const entry: GarmentStyleOverrideByBody = {
    ...prev,
    [body]: { back, front },
  };
  if (norm) entry.name = norm;
  else delete entry.name;
  const next = { ...current, [style]: entry };
  try {
    localStorage.setItem(PANTS_OVERRIDE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  _pantsOverridesCache = next;
}
export function getShirtOverrideName(style: ShirtStyle, lang: Lang): string | undefined {
  return getLocalizedNameForLang(loadShirtOverrides()[style]?.name, lang);
}
export function getPantsOverrideName(style: PantsStyle, lang: Lang): string | undefined {
  return getLocalizedNameForLang(loadPantsOverrides()[style]?.name, lang);
}
export function getShirtOverrideRawName(style: ShirtStyle): LocalizedName | undefined {
  return loadShirtOverrides()[style]?.name;
}
export function getPantsOverrideRawName(style: PantsStyle): LocalizedName | undefined {
  return loadPantsOverrides()[style]?.name;
}
export function deleteShirtOverride(style: ShirtStyle) {
  const all = { ...loadShirtOverrides() };
  delete all[style];
  try {
    localStorage.setItem(SHIRT_OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  _shirtOverridesCache = all;
}
export function deletePantsOverride(style: PantsStyle) {
  const all = { ...loadPantsOverrides() };
  delete all[style];
  try {
    localStorage.setItem(PANTS_OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
  _pantsOverridesCache = all;
}


function rasterizeToTones(
  render: (ctx: CanvasRenderingContext2D) => void,
  base: string,
): GarmentStyleOverride {
  if (typeof document === "undefined") return { back: {}, front: {} };
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { back: {}, front: {} };
  render(ctx);
  const parseHex = (h: string): [number, number, number] => {
    const s = h.replace("#", "");
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  };
  const [dr, dg, db] = parseHex(shade(base, -0.3));
  const [mr, mg, mb] = parseHex(base);
  const [lr, lg, lb] = parseHex(shade(base, 0.18));
  const front: HairPixels = {};
  const img = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H).data;
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const i = (y * SPRITE_W + x) * 4;
      const r = img[i];
      const g = img[i + 1];
      const b = img[i + 2];
      const a = img[i + 3];
      if (a === 0) continue;
      const key = `${x},${y}`;
      if (r === dr && g === dg && b === db) front[key] = "dark";
      else if (r === mr && g === mg && b === mb) front[key] = "mid";
      else if (r === lr && g === lg && b === lb) front[key] = "light";
    }
  }
  return { back: {}, front };
}

export function rasterizeBuiltinShirt(style: ShirtStyle, body: BodyType): GarmentStyleOverride {
  const MARKER = "#00ffff";
  return rasterizeToTones((ctx) => {
    drawCharacter(ctx, 0, 0, {
      ...DEFAULT_APPEARANCE,
      body,
      hairStyle: "bald",
      beard: "none",
      skin: "#00ff00",
      shirt: MARKER,
      shirtStyle: style,
      pants: "#ff00ff",
      pantsStyle: "trousers",
      boots: "#101010",
      eyeColor: "#0d1b2a",
    }, { hidePants: true });
  }, MARKER);
}

export function rasterizeBuiltinPants(style: PantsStyle, body: BodyType): GarmentStyleOverride {
  const MARKER = "#00ffff";
  return rasterizeToTones((ctx) => {
    drawCharacter(ctx, 0, 0, {
      ...DEFAULT_APPEARANCE,
      body,
      hairStyle: "bald",
      beard: "none",
      skin: "#00ff00",
      shirt: "#ff00ff",
      shirtStyle: "tshirt",
      pants: MARKER,
      pantsStyle: style,
      boots: "#101010",
      eyeColor: "#0d1b2a",
    }, { hideShirt: true });
  }, MARKER);
}


export const EYE_COLORS = [
  "#3a2a12", // castanho
  "#6a3a1a", // âmbar
  "#2d6a4a", // verde
  "#2a5aa0", // azul
  "#4a8ac9", // azul claro
  "#5a4a6a", // acinzentado
  "#7a3ec9", // violeta
  "#c94b4b", // vermelho (fantasia)
  "#0d1b2a", // preto
];

export const BODY_TYPES: BodyType[] = ["masc", "fem"];

export const SKIN_TONES = [
  "#f4d1b0",
  "#e8b48a",
  "#c48c66",
  "#8f5a3c",
  "#5a3822",
];

export const HAIR_COLORS = [
  "#1a1108", // black
  "#4a2a12", // brown
  "#a86a2a", // auburn
  "#e6c26a", // blond
  "#c94b4b", // red
  "#c0c4d0", // silver
  "#4b6dc9", // blue
  "#7a3ec9", // purple
  "#4b9c5a", // green
  "#e08ac1", // pink
];

export const HAIR_STYLES: HairStyle[] = [
  "short",
  "long",
  "ponytail",
  "topknot",
  "buzz",
  "spiky",
  "mohawk",
  "afro",
  "curly",
  "sidecut",
  "braids",
  "wild",
  "bald",
];

export const BEARD_STYLES: BeardStyle[] = [
  "none",
  "stubble",
  "mustache",
  "goatee",
  "chinstrap",
  "full",
  "long",
];

export const SHIRT_COLORS = [
  "#c94b4b", // crimson
  "#4b6dc9", // sapphire
  "#4b9c5a", // moss
  "#7a3ec9", // amethyst
  "#e6a53a", // amber
  "#2a3a55", // slate
  "#e0e0e0", // linen
  "#1a1a1a", // charcoal
  "#f06292", // rose
  "#0d9488", // teal
  "#f97316", // ember
  "#a3b18a", // sage
];

export const PANTS_COLORS = [
  "#3a3a5a", // indigo
  "#2a2018", // walnut
  "#6a5a3a", // leather
  "#4a5a4a", // olive
  "#1a1a2a", // ink
  "#8a5a3a", // chestnut
  "#8b95a5", // stone
  "#4a2e2a", // burgundy
  "#2d4a2b", // forest
  "#c9b48a", // sand
  "#1e3a5f", // navy
  "#5a4e6b", // dusk
];

export const BOOT_COLORS = [
  "#1a1208", // black
  "#3a2818", // dark brown
  "#6a4a2a", // tan
  "#8a2a2a", // burgundy
  "#2a3a55", // steel blue
  "#4a5a4a", // ranger green
  "#c9b48a", // cream
  "#5a3a1a", // saddle
];

export const SHIRT_STYLES: ShirtStyle[] = ["tshirt", "robe", "greek", "dress", "suit"];
export const PANTS_STYLES: PantsStyle[] = ["trousers", "shorts", "skirt"];
/** Shirt styles that cover the whole body (torso + legs) and hide pants. */
export const FULLBODY_SHIRT_STYLES: ShirtStyle[] = ["suit", "dress"];
/** Shirt styles that are strictly torso-only (rendered in the shirts list). */
export const TORSO_SHIRT_STYLES: ShirtStyle[] = SHIRT_STYLES.filter(
  (s) => !FULLBODY_SHIRT_STYLES.includes(s),
);

export const DEFAULT_APPEARANCE: Appearance = {
  body: "masc",
  skin: SKIN_TONES[1],
  hairStyle: "short",
  hairColor: HAIR_COLORS[1],
  beard: "none",
  shirt: SHIRT_COLORS[0],
  shirtStyle: "robe",
  pants: PANTS_COLORS[0],
  pantsStyle: "trousers",
  boots: BOOT_COLORS[0],
  eyeColor: EYE_COLORS[0],
};


export const SPRITE_W = 16;
export const SPRITE_H = 32;

// Lighten / darken by mixing toward white/black. Keeps the palette cohesive.
export function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c: number) => {
    const target = amount < 0 ? 0 : 255;
    const t = Math.abs(amount);
    const v = Math.round(c + (target - c) * t);
    return Math.max(0, Math.min(255, v));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

type DrawOpts = {
  animT?: number;
  grounded?: boolean;
  facing?: 1 | -1;
  /**
   * Number of logs/objects being carried. 0 = normal arms, 1 = short forward
   * stubs that line up with a single held object, 2+ = arms hidden because the
   * load covers the torso/shoulders.
   */
  carrying?: number;
  /** Editor preview: draw the character without any shirt/torso/sleeves. */
  hideShirt?: boolean;
  /** Editor preview: draw the character without any pants (bare skin legs). */
  hidePants?: boolean;
};


/**
 * Draw a detailed pixel character at (ox, oy) — top-left of the 16×32 sprite.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  appearance: Appearance,
  opts: DrawOpts = {},
) {
  const facing: 1 | -1 = opts.facing ?? 1;
  const animT = opts.animT ?? 0;
  const grounded = opts.grounded ?? true;

  const step = Math.floor(animT * 8) % 2;
  const jumping = !grounded;

  ctx.save();
  if (facing === -1) {
    ctx.translate(ox + SPRITE_W, 0);
    ctx.scale(-1, 1);
    ctx.translate(-ox, 0);
  }

  const skin = appearance.skin;
  const skinShadow = shade(skin, -0.28);
  const skinDeep = shade(skin, -0.42);
  const shirt = appearance.shirt;
  const shirtShadow = shade(shirt, -0.3);
  const shirtHi = shade(shirt, 0.18);
  const pants = appearance.pants;
  const pantsShadow = shade(pants, -0.3);
  const hair = appearance.hairColor;
  const hairShadow = shade(hair, -0.3);
  const hairHi = shade(hair, 0.22);
  const isFem = appearance.body === "fem";

  // ----- Hair back layer (drawn behind head so face/neck overlap it) -----
  const hairToneColor: Record<HairTone, string> = {
    dark: hairShadow,
    mid: hair,
    light: hairHi,
  };
  const activeHairPixels: HairStyleOverride | undefined =
    appearance.customHair
      ? { back: appearance.customHair.back, front: appearance.customHair.front }
      : appearance.hairStyle !== "bald"
        ? getHairOverride(appearance.hairStyle)
        : undefined;
  if (activeHairPixels) {
    for (const [k, t] of Object.entries(activeHairPixels.back)) {
      const [x, y] = k.split(",").map(Number);
      ctx.fillStyle = hairToneColor[t];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  } else if (appearance.hairStyle === "long") {
    ctx.fillStyle = hair;
    ctx.fillRect(ox + 4, oy + 9, 3, 3);
    ctx.fillRect(ox + 9, oy + 9, 3, 3);
  }

  // ----- Head & face -----
  ctx.fillStyle = skinShadow;
  ctx.fillRect(ox + 7, oy + 9, 2, 2); // neck

  ctx.fillStyle = skin;
  ctx.fillRect(ox + 4, oy + 1, 8, 8);
  ctx.fillRect(ox + 5, oy + 9, 6, 1); // jaw taper
  ctx.fillStyle = skinShadow;
  ctx.fillRect(ox + 11, oy + 4, 1, 5); // right cheek shadow
  ctx.fillRect(ox + 5, oy + 9, 6, 1);

  // Ears (both sides)
  ctx.fillStyle = skin;
  ctx.fillRect(ox + 12, oy + 5, 1, 2);
  ctx.fillRect(ox + 3, oy + 5, 1, 2);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(ox + 12, oy + 7, 1, 1);
  ctx.fillRect(ox + 3, oy + 7, 1, 1);

  // Brow
  ctx.fillStyle = hairShadow;
  ctx.fillRect(ox + 6, oy + 4, 2, 1);
  ctx.fillRect(ox + 9, oy + 4, 2, 1);

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(ox + 6, oy + 5, 2, 1);
  ctx.fillRect(ox + 9, oy + 5, 2, 1);
  ctx.fillStyle = appearance.eyeColor ?? "#0d1b2a";
  ctx.fillRect(ox + 7, oy + 5, 1, 1);
  ctx.fillRect(ox + 10, oy + 5, 1, 1);
  if (isFem) {
    // Eyelashes at outer eye corners so they don't overwrite the brow
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(ox + 5, oy + 5, 1, 1);
    // Right eyelash temporarily removed for testing
    // ctx.fillRect(ox + 11, oy + 5, 1, 1);
  }
  // Nose
  ctx.fillStyle = skinShadow;
  ctx.fillRect(ox + 9, oy + 6, 1, 2);
  // Mouth
  ctx.fillStyle = isFem ? "#a04058" : shade(skin, -0.4);
  ctx.fillRect(ox + 8, oy + 8, 2, 1);

  // ----- Beard (drawn before hair so hair can overlap sideburns) -----
  // Beard is drawn later, after clothing, so it visually overlaps garments
  // (e.g. long beards flowing over robes/tunics).



  // ----- Hair overlay -----
  if (activeHairPixels) {
    for (const [k, t] of Object.entries(activeHairPixels.front)) {
      const [x, y] = k.split(",").map(Number);
      ctx.fillStyle = hairToneColor[t];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  } else {
    drawHair(ctx, ox, oy, appearance.hairStyle, hair, hairShadow, hairHi);
  }

  // ----- Torso -----
  const shirtStyleEarly = appearance.shirtStyle ?? "tshirt";
  const pantsStyleEarly = appearance.pantsStyle ?? "trousers";
  const bodyKey: BodyType = isFem ? "fem" : "masc";
  const shirtOverride = getShirtOverride(shirtStyleEarly, bodyKey);
  const pantsOverride = getPantsOverride(pantsStyleEarly, bodyKey);
  const anyFullbody =
    appearance.customShirt?.slot === "fullbody" ||
    appearance.customPants?.slot === "fullbody";
  const hideShirt =
    (opts.hideShirt ?? false) ||
    !!shirtOverride ||
    !!appearance.customShirt ||
    anyFullbody;
  const hidePantsOpt =
    (opts.hidePants ?? false) ||
    !!pantsOverride ||
    !!appearance.customPants ||
    anyFullbody;
  if (!hideShirt) {
    if (!isFem) drawMascTorso(ctx, ox, oy, shirt, shirtShadow, shirtHi);
    else drawFemTorso(ctx, ox, oy, shirt, shirtShadow, shirtHi);
  } else {
    // Bare skin torso so custom / override / editor rendering has a base.
    if (!isFem) {
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 3, oy + 11, 10, 2);
      ctx.fillRect(ox + 4, oy + 13, 8, 7);
      ctx.fillStyle = skinShadow;
      ctx.fillRect(ox + 11, oy + 13, 1, 7);
    } else {
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 4, oy + 11, 8, 9);
      ctx.fillStyle = skinShadow;
      ctx.fillRect(ox + 11, oy + 12, 1, 8);
      ctx.fillRect(ox + 4, oy + 16, 1, 2);
      ctx.fillRect(ox + 11, oy + 16, 1, 2);
    }
  }

  const shirtStyle = shirtStyleEarly;
  const pantsStyle = pantsStyleEarly;

  const isFullBody =
    !hideShirt &&
    (shirtStyle === "greek" || shirtStyle === "dress" || shirtStyle === "suit");
  const hidePants =
    hidePantsOpt || (!hideShirt && (shirtStyle === "greek" || shirtStyle === "dress"));

  // ----- Arms with walk / jump swing (or hidden when hauling multiple logs) -----
  const carryCount = opts.carrying ?? 0;
  const walking = !jumping && animT > 0;

  const armSleeve = hideShirt ? skin : shirt;
  const armSleeveShadow = hideShirt ? skinShadow : shirtShadow;
  const armSleeveBack = hideShirt ? skin : shade(shirt, -0.15);
  const armSleeveBackShadow = hideShirt ? skinShadow : shade(shirt, -0.35);

  if (carryCount === 1) {
    ctx.fillStyle = armSleeveBack;
    ctx.fillRect(ox + 2, oy + 11, 2, 5);
    ctx.fillStyle = armSleeveBackShadow;
    ctx.fillRect(ox + 2, oy + 15, 2, 1);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(ox + 2, oy + 16, 2, 1);
    ctx.fillStyle = armSleeve;
    ctx.fillRect(ox + 12, oy + 11, 2, 5);
    ctx.fillStyle = armSleeveShadow;
    ctx.fillRect(ox + 12, oy + 15, 2, 1);
    ctx.fillStyle = skin;
    ctx.fillRect(ox + 12, oy + 16, 2, 1);
  } else if (carryCount >= 2) {
    // hidden
  } else {
    const backArmY = jumping ? oy + 10 : oy + 12 + (walking && step === 0 ? 1 : 0);
    const frontArmY = jumping ? oy + 10 : oy + 12 + (walking && step === 1 ? 1 : 0);
    drawArm(ctx, ox + 2, backArmY, armSleeveBack, armSleeveBackShadow, skin, skinShadow, isFem);
    drawArm(ctx, ox + 12, frontArmY, armSleeve, armSleeveShadow, skin, skinShadow, isFem);
  }

  // Belt (hidden under a robe, full-body outfit, or when shirt is hidden)
  if (!hideShirt && shirtStyle !== "robe" && !isFullBody) {
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(ox + 4, oy + 20, 8, 1);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(ox + 7, oy + 20, 2, 1);
  }

  // ----- Legs -----
  const legTop = oy + 21;
  const legFullH = 9;
  let leftH = legFullH;
  let rightH = legFullH;
  if (jumping) {
    leftH = 6;
    rightH = 7;
  } else if (walking) {
    if (step === 0) leftH = legFullH - 1;
    else rightH = legFullH - 1;
  }

  if (!hidePants) {
    ctx.fillStyle = pants;
    ctx.fillRect(ox + 4, legTop, 3, leftH);
    ctx.fillRect(ox + 9, legTop, 3, rightH);
    ctx.fillStyle = pantsShadow;
    ctx.fillRect(ox + 6, legTop, 1, leftH);
    ctx.fillRect(ox + 11, legTop, 1, rightH);
    if (walking) {
      ctx.fillStyle = pantsShadow;
      if (step === 0) ctx.fillRect(ox + 4, legTop + 3, 3, 1);
      else ctx.fillRect(ox + 9, legTop + 3, 3, 1);
    }

    // Shorts: replace lower half of the pants with bare skin
    if (pantsStyle === "shorts") {
      const cutY = legTop + 4;
      const lCut = Math.max(0, leftH - 4);
      const rCut = Math.max(0, rightH - 4);
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 4, cutY, 3, lCut);
      ctx.fillRect(ox + 9, cutY, 3, rCut);
      ctx.fillStyle = skinShadow;
      ctx.fillRect(ox + 6, cutY, 1, lCut);
      ctx.fillRect(ox + 11, cutY, 1, rCut);
    }

    // Skirt: flared bell over the upper legs + bare shins below hem
    if (pantsStyle === "skirt") {
      // Bare skin under the skirt (below the hem, above the boots)
      const shinY = legTop + 6;
      const lShin = Math.max(0, leftH - 6);
      const rShin = Math.max(0, rightH - 6);
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 4, shinY, 3, lShin);
      ctx.fillRect(ox + 9, shinY, 3, rShin);
      ctx.fillStyle = skinShadow;
      ctx.fillRect(ox + 6, shinY, 1, lShin);
      ctx.fillRect(ox + 11, shinY, 1, rShin);
      // Flared bell
      ctx.fillStyle = pants;
      ctx.fillRect(ox + 4, legTop, 8, 3);
      ctx.fillRect(ox + 3, legTop + 2, 10, 3);
      ctx.fillRect(ox + 2, legTop + 4, 12, 2);
      ctx.fillStyle = pantsShadow;
      ctx.fillRect(ox + 2, legTop + 5, 12, 1);
      ctx.fillRect(ox + 11, legTop + 2, 2, 3);
    }
  }

  // Bare skin legs when pants are hidden (editor preview)
  if (hidePants) {
    ctx.fillStyle = skin;
    ctx.fillRect(ox + 4, legTop, 3, leftH);
    ctx.fillRect(ox + 9, legTop, 3, rightH);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(ox + 6, legTop, 1, leftH);
    ctx.fillRect(ox + 11, legTop, 1, rightH);
  }

  // Boots (skip for dress — hem covers the feet)
  if (shirtStyle !== "dress" || hideShirt) {
    const boots = appearance.boots ?? "#1a1208";
    const bootsHi = shade(boots, 0.25);
    const standingBootY = legTop + legFullH;
    const leftBootY = jumping ? legTop + leftH : standingBootY;
    const rightBootY = jumping ? legTop + rightH : standingBootY;
    const leftLifted = walking && step === 0;
    const rightLifted = walking && step === 1;
    const lbY = leftLifted ? legTop + leftH : leftBootY;
    const rbY = rightLifted ? legTop + rightH : rightBootY;

    ctx.fillStyle = boots;
    ctx.fillRect(ox + 4, lbY, 3, 2);
    ctx.fillRect(ox + 9, rbY, 3, 2);
    ctx.fillStyle = bootsHi;
    ctx.fillRect(ox + 4, lbY, 3, 1);
    ctx.fillRect(ox + 9, rbY, 3, 1);
  }

  if (!hideShirt) {
    // Robe: long garment that covers the legs entirely
    if (shirtStyle === "robe") {
      ctx.fillStyle = shirt;
      ctx.fillRect(ox + 3, oy + 20, 10, 9);
      ctx.fillRect(ox + 2, oy + 24, 12, 5);
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(ox + 2, oy + 28, 12, 1);
      ctx.fillRect(ox + 11, oy + 20, 1, 8);
      ctx.fillRect(ox + 13, oy + 24, 1, 4);
      ctx.fillStyle = shirtHi;
      ctx.fillRect(ox + 4, oy + 20, 1, 8);
    }

    // Greek tunic (toga)
    if (shirtStyle === "greek") {
      const shinY = oy + 26;
      const lShin = Math.max(0, legTop + leftH - shinY);
      const rShin = Math.max(0, legTop + rightH - shinY);
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 4, shinY, 3, lShin);
      ctx.fillRect(ox + 9, shinY, 3, rShin);
      ctx.fillStyle = skinShadow;
      ctx.fillRect(ox + 6, shinY, 1, lShin);
      ctx.fillRect(ox + 11, shinY, 1, rShin);

      ctx.fillStyle = shirt;
      ctx.fillRect(ox + 3, oy + 20, 10, 6);
      ctx.fillRect(ox + 2, oy + 22, 12, 4);
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(ox + 2, oy + 25, 12, 1);
      ctx.fillRect(ox + 13, oy + 22, 1, 3);
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(ox + 5, oy + 12, 2, 1);
      ctx.fillRect(ox + 6, oy + 13, 2, 1);
      ctx.fillRect(ox + 7, oy + 14, 2, 1);
      ctx.fillRect(ox + 8, oy + 15, 2, 1);
      ctx.fillRect(ox + 9, oy + 16, 2, 1);
      ctx.fillStyle = "#e6c26a";
      ctx.fillRect(ox + 2, oy + 25, 12, 1);
      ctx.fillRect(ox + 6, oy + 12, 1, 1);
      ctx.fillRect(ox + 10, oy + 16, 1, 1);
    }

    // Dress
    if (shirtStyle === "dress") {
      ctx.fillStyle = shirt;
      ctx.fillRect(ox + 3, oy + 20, 10, 2);
      ctx.fillRect(ox + 2, oy + 22, 12, 3);
      ctx.fillRect(ox + 1, oy + 25, 14, 5);
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(ox + 1, oy + 29, 14, 1);
      ctx.fillRect(ox + 13, oy + 25, 1, 4);
      ctx.fillRect(ox + 12, oy + 22, 1, 3);
      ctx.fillStyle = shirtHi;
      ctx.fillRect(ox + 4, oy + 22, 1, 7);
      ctx.fillRect(ox + 2, oy + 25, 1, 3);
    }

    // Suit
    if (shirtStyle === "suit") {
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(ox + 6, oy + 12, 1, 1);
      ctx.fillRect(ox + 7, oy + 13, 1, 1);
      ctx.fillRect(ox + 9, oy + 13, 1, 1);
      ctx.fillRect(ox + 9, oy + 12, 1, 1);
      ctx.fillStyle = "#f4e9c1";
      ctx.fillRect(ox + 7, oy + 11, 2, 1);
      ctx.fillRect(ox + 8, oy + 12, 1, 4);
      ctx.fillStyle = "#c94b4b";
      ctx.fillRect(ox + 7, oy + 12, 2, 1);
      ctx.fillRect(ox + 7, oy + 13, 2, 1);
      ctx.fillRect(ox + 7, oy + 14, 2, 5);
      ctx.fillStyle = shade("#c94b4b", -0.35);
      ctx.fillRect(ox + 8, oy + 14, 1, 5);
      ctx.fillRect(ox + 7, oy + 18, 2, 1);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(ox + 10, oy + 17, 1, 1);
    }
  }

  // ----- Custom / override garment pixels (drawn last so they overlay) -----
  const shirt2 = appearance.shirtSecondary ?? shirt;
  const pants2 = appearance.pantsSecondary ?? pants;
  const shirt3 = appearance.shirtTertiary ?? shirt2;
  const pants3 = appearance.pantsTertiary ?? pants2;
  const shirtToneColor: Record<PixelTone, string> = {
    dark: shirtShadow,
    mid: shirt,
    light: shirtHi,
    dark2: shade(shirt2, -0.3),
    mid2: shirt2,
    light2: shade(shirt2, 0.18),
    dark3: shade(shirt3, -0.3),
    mid3: shirt3,
    light3: shade(shirt3, 0.18),
  };
  const pantsToneColor: Record<PixelTone, string> = {
    dark: pantsShadow,
    mid: pants,
    light: shade(pants, 0.18),
    dark2: shade(pants2, -0.3),
    mid2: pants2,
    light2: shade(pants2, 0.18),
    dark3: shade(pants3, -0.3),
    mid3: pants3,
    light3: shade(pants3, 0.18),
  };
  const drawPixels = (
    pixels: Record<string, PixelTone> | undefined,
    tones: Record<PixelTone, string>,
  ) => {
    if (!pixels) return;
    for (const [k, t] of Object.entries(pixels)) {
      const [x, y] = k.split(",").map(Number);
      ctx.fillStyle = tones[t];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  };
  if (shirtOverride) {
    drawPixels(shirtOverride.back, shirtToneColor);
    drawPixels(shirtOverride.front, shirtToneColor);
  }
  if (pantsOverride) {
    drawPixels(pantsOverride.back, pantsToneColor);
    drawPixels(pantsOverride.front, pantsToneColor);
  }
  if (appearance.customShirt) {
    drawPixels(appearance.customShirt.back, shirtToneColor);
    drawPixels(appearance.customShirt.front, shirtToneColor);
  }
  if (appearance.customPants) {
    drawPixels(appearance.customPants.back, pantsToneColor);
    drawPixels(appearance.customPants.front, pantsToneColor);
  }

  // ----- Beard (drawn last so it overlays clothing like robes) -----
  if (!isFem) {
    const beardOv =
      appearance.beard !== "none" ? getBeardOverride(appearance.beard) : undefined;
    if (beardOv) {
      const beardToneColor: Record<HairTone, string> = {
        dark: hairShadow,
        mid: hair,
        light: hairHi,
      };
      for (const [k, tn] of Object.entries(beardOv.back)) {
        const [x, y] = k.split(",").map(Number);
        ctx.fillStyle = beardToneColor[tn];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
      for (const [k, tn] of Object.entries(beardOv.front)) {
        const [x, y] = k.split(",").map(Number);
        ctx.fillStyle = beardToneColor[tn];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    } else {
      drawBeard(ctx, ox, oy, appearance.beard, hair, hairShadow, skinDeep);
    }
  }

  ctx.restore();

}


// ---------- Torsos ----------

function drawMascTorso(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  shirt: string,
  shirtShadow: string,
  shirtHi: string,
) {
  ctx.fillStyle = shirt;
  ctx.fillRect(ox + 3, oy + 11, 10, 2); // shoulders
  ctx.fillRect(ox + 4, oy + 13, 8, 7); // chest / abdomen
  // Subtle right-flank shadow only — no full-width band across the collarbone
  ctx.fillStyle = shirtShadow;
  ctx.fillRect(ox + 11, oy + 13, 1, 7);
  ctx.fillStyle = shirtHi;
  ctx.fillRect(ox + 7, oy + 11, 2, 1); // collar
  ctx.fillRect(ox + 5, oy + 14, 1, 4);
}

function drawFemTorso(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  shirt: string,
  shirtShadow: string,
  shirtHi: string,
) {
  // Solid 8-wide torso — silhouette taper is done through shading, not by
  // carving the shape, so nothing looks "broken" when the background shows.
  ctx.fillStyle = shirt;
  ctx.fillRect(ox + 4, oy + 11, 8, 9);

  // Right-side flank shadow
  ctx.fillStyle = shirtShadow;
  ctx.fillRect(ox + 11, oy + 12, 1, 8);
  // Waist shadow strokes suggest the hourglass without cutting the sprite
  ctx.fillRect(ox + 4, oy + 16, 1, 2);
  ctx.fillRect(ox + 11, oy + 16, 1, 2);
  // Bust definition — two soft highlights + underline shadow
  ctx.fillRect(ox + 5, oy + 15, 2, 1);
  ctx.fillRect(ox + 9, oy + 15, 2, 1);
  ctx.fillStyle = shirtHi;
  ctx.fillRect(ox + 5, oy + 13, 2, 1);
  ctx.fillRect(ox + 9, oy + 13, 2, 1);
  // V-neck collar
  ctx.fillRect(ox + 7, oy + 11, 2, 1);
  ctx.fillRect(ox + 8, oy + 12, 1, 1);
}

// ---------- Arms ----------

function drawArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sleeve: string,
  sleeveShadow: string,
  skin: string,
  skinShadow: string,
  slim: boolean,
) {
  const w = slim ? 2 : 2; // keep 2px so both arms are visible
  // Sleeve — longer, reaches down toward the belt
  ctx.fillStyle = sleeve;
  ctx.fillRect(x, y, w, 7);
  // Cuff shadow band at the sleeve edge
  ctx.fillStyle = sleeveShadow;
  ctx.fillRect(x, y + 6, w, 1);
  // Hand
  ctx.fillStyle = skin;
  ctx.fillRect(x, y + 7, w, 2);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(x + w - 1, y + 8, 1, 1);
}

// ---------- Beards ----------

function drawBeard(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  style: BeardStyle,
  color: string,
  shadow: string,
  skinDeep: string,
) {
  if (style === "none") return;

  const mustache = () => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + 7, oy + 7, 4, 1);
    ctx.fillStyle = shadow;
    ctx.fillRect(ox + 7, oy + 8, 1, 1);
    ctx.fillRect(ox + 10, oy + 8, 1, 1);
  };
  const chinPatch = () => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + 7, oy + 9, 4, 1);
    ctx.fillRect(ox + 8, oy + 10, 2, 1);
  };
  const jawline = () => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + 5, oy + 8, 1, 1);
    ctx.fillRect(ox + 5, oy + 9, 6, 1);
    ctx.fillRect(ox + 11, oy + 8, 1, 1);
  };

  switch (style) {
    case "stubble": {
      ctx.fillStyle = skinDeep;
      // scattered dots along jaw / upper lip
      ctx.fillRect(ox + 6, oy + 8, 1, 1);
      ctx.fillRect(ox + 8, oy + 8, 1, 1);
      ctx.fillRect(ox + 10, oy + 8, 1, 1);
      ctx.fillRect(ox + 7, oy + 9, 1, 1);
      ctx.fillRect(ox + 9, oy + 9, 1, 1);
      ctx.fillRect(ox + 11, oy + 9, 1, 1);
      return;
    }
    case "mustache":
      mustache();
      return;
    case "goatee":
      mustache();
      chinPatch();
      return;
    case "chinstrap":
      jawline();
      return;
    case "full":
      mustache();
      jawline();
      ctx.fillStyle = color;
      ctx.fillRect(ox + 6, oy + 8, 5, 1);
      chinPatch();
      return;
    case "long":
      mustache();
      jawline();
      ctx.fillStyle = color;
      ctx.fillRect(ox + 6, oy + 8, 5, 1);
      // long chin braid dropping below the jaw
      ctx.fillRect(ox + 7, oy + 10, 4, 2);
      ctx.fillRect(ox + 8, oy + 12, 2, 3);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 8, oy + 14, 2, 1);
      return;
  }
}

// ---------- Hair ----------

function drawHair(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  style: HairStyle,
  color: string,
  shadow: string,
  hi: string,
) {
  switch (style) {
    case "bald":
      return;

    case "short": {
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 4, oy + 4, 2, 2);
      ctx.fillRect(ox + 11, oy + 4, 1, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 2, 3, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 4, oy + 3, 8, 1);
      return;
    }

    case "long": {
      ctx.fillStyle = color;
      // Rounded crown pushed up 1px so the forehead peeks out below
      ctx.fillRect(ox + 4, oy + 0, 8, 1);
      ctx.fillRect(ox + 3, oy + 1, 10, 1);
      ctx.fillRect(ox + 2, oy + 2, 12, 1);
      // Side curtains hugging the head from temples down past the ears
      ctx.fillRect(ox + 2, oy + 3, 2, 8);
      ctx.fillRect(ox + 12, oy + 3, 2, 8);
      // Temple wisps framing the face (clear of the eyes at row +5)
      ctx.fillRect(ox + 4, oy + 3, 1, 1);
      ctx.fillRect(ox + 11, oy + 3, 1, 1);
      // (jaw/chin left untouched so the face shape matches short hair)
      // Hair falling over the shoulders — pushed just outside the torso
      ctx.fillRect(ox + 1, oy + 9, 2, 8);
      ctx.fillRect(ox + 13, oy + 9, 2, 8);
      // Tapered wispy tips
      ctx.fillRect(ox + 2, oy + 17, 1, 1);
      ctx.fillRect(ox + 13, oy + 17, 1, 1);
      // Highlights on the lighter (front-lit) side
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 1, 2, 1);
      ctx.fillRect(ox + 2, oy + 5, 1, 5);
      ctx.fillRect(ox + 1, oy + 10, 1, 4);
      // Depth on the far side / underside
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 13, oy + 5, 1, 10);
      ctx.fillRect(ox + 3, oy + 11, 10, 1);
      ctx.fillRect(ox + 14, oy + 14, 1, 2);
      return;
    }

    case "ponytail": {
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 4, oy + 4, 2, 3);
      ctx.fillRect(ox + 2, oy + 4, 2, 2); // tie
      ctx.fillRect(ox + 1, oy + 6, 2, 8); // tail
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 1, oy + 13, 2, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 2, 3, 1);
      return;
    }

    case "topknot": {
      // Close-cropped cap with a small bun tied on top
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 1, 8, 2); // cap
      ctx.fillRect(ox + 4, oy + 3, 1, 2); // left sideburn
      ctx.fillRect(ox + 11, oy + 3, 1, 1); // right temple
      // Bun (round-ish 3×3 on top)
      ctx.fillRect(ox + 7, oy - 2, 2, 3);
      ctx.fillRect(ox + 6, oy - 1, 4, 2);
      // Wrap around bun base
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 6, oy + 1, 4, 1);
      ctx.fillRect(ox + 9, oy + 0, 1, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 7, oy - 1, 1, 1);
      return;
    }

    case "mohawk": {
      // Shaved sides using skin-like base (no dark line across the head)
      // Central strip only — the sides are simply not drawn, letting the head skin show.
      ctx.fillStyle = color;
      // Base strip sitting on top of the head
      ctx.fillRect(ox + 7, oy + 1, 2, 3);
      // Fan of spikes rising up, tallest in the middle
      ctx.fillRect(ox + 7, oy - 1, 2, 2);
      ctx.fillRect(ox + 7, oy - 3, 2, 2);
      // Side flares that curve outward
      ctx.fillRect(ox + 6, oy + 0, 1, 2);
      ctx.fillRect(ox + 9, oy + 0, 1, 2);
      // Small temple accents (short sideburn-ish flick, no full band)
      ctx.fillRect(ox + 5, oy + 2, 1, 1);
      ctx.fillRect(ox + 10, oy + 2, 1, 1);
      // Highlight down the center
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 7, oy - 2, 1, 1);
      ctx.fillRect(ox + 7, oy + 2, 1, 1);
      return;
    }

    case "afro": {
      // Big round puff — silhouette that overshoots the head
      ctx.fillStyle = color;
      ctx.fillRect(ox + 3, oy + 0, 10, 5);
      ctx.fillRect(ox + 2, oy + 1, 12, 3);
      ctx.fillRect(ox + 4, oy - 1, 8, 1);
      // Sideburn fluff
      ctx.fillRect(ox + 3, oy + 5, 2, 3);
      ctx.fillRect(ox + 11, oy + 5, 2, 3);
      // Trim corners to feel round
      ctx.clearRect(ox + 2, oy + 1, 1, 1);
      ctx.clearRect(ox + 13, oy + 1, 1, 1);
      // Texture speckle
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 5, oy + 2, 1, 1);
      ctx.fillRect(ox + 9, oy + 1, 1, 1);
      ctx.fillRect(ox + 11, oy + 3, 1, 1);
      ctx.fillRect(ox + 3, oy + 3, 1, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 6, oy + 0, 2, 1);
      ctx.fillRect(ox + 10, oy + 2, 1, 1);
      return;
    }

    case "spiky": {
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 4, oy + 3, 2, 2);
      ctx.fillRect(ox + 11, oy + 3, 1, 1);
      // Spikes shooting up
      ctx.fillRect(ox + 4, oy - 1, 1, 2);
      ctx.fillRect(ox + 6, oy - 2, 1, 3);
      ctx.fillRect(ox + 8, oy - 1, 1, 2);
      ctx.fillRect(ox + 10, oy - 2, 1, 3);
      ctx.fillRect(ox + 11, oy + 0, 1, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 6, oy - 1, 1, 1);
      ctx.fillRect(ox + 10, oy - 1, 1, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 4, oy + 3, 8, 1);
      return;
    }

    case "curly": {
      ctx.fillStyle = color;
      // Base cap higher on the head
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 4, oy + 3, 2, 2);
      ctx.fillRect(ox + 11, oy + 3, 1, 2);
      // Curl bumps around the crown (raised)
      ctx.fillRect(ox + 3, oy + 0, 2, 2);
      ctx.fillRect(ox + 6, oy - 1, 2, 2);
      ctx.fillRect(ox + 9, oy - 1, 2, 2);
      ctx.fillRect(ox + 12, oy + 0, 2, 2);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 4, oy + 0, 1, 1);
      ctx.fillRect(ox + 7, oy - 1, 1, 1);
      ctx.fillRect(ox + 10, oy - 1, 1, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 5, oy + 2, 1, 1);
      ctx.fillRect(ox + 11, oy + 2, 1, 1);
      return;
    }

    case "sidecut": {
      // One side long, other shaved. Left = long, right = shaved.
      ctx.fillStyle = shade(color, -0.55);
      ctx.fillRect(ox + 8, oy + 1, 4, 2); // shaved right side
      ctx.fillStyle = color;
      // Long swept side (higher)
      ctx.fillRect(ox + 4, oy - 1, 5, 4);
      ctx.fillRect(ox + 3, oy + 0, 2, 6);
      // Bang sweeping across forehead
      ctx.fillRect(ox + 5, oy + 1, 5, 1);
      ctx.fillRect(ox + 8, oy + 0, 3, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 0, 2, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 3, oy + 5, 2, 1);
      return;
    }


    case "braids": {
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 4, oy + 4, 1, 2);
      ctx.fillRect(ox + 11, oy + 4, 1, 2);
      // Two braids down each side
      const braid = (bx: number) => {
        ctx.fillStyle = color;
        ctx.fillRect(bx, oy + 5, 2, 8);
        ctx.fillStyle = shadow;
        ctx.fillRect(bx, oy + 7, 2, 1);
        ctx.fillRect(bx, oy + 10, 2, 1);
        // tuft at end
        ctx.fillStyle = color;
        ctx.fillRect(bx, oy + 13, 2, 1);
      };
      braid(ox + 2);
      braid(ox + 12);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 2, 3, 1);
      return;
    }

    case "buzz": {
      // Very close shave — 1px stubble cap sitting flush on top of the head
      ctx.fillStyle = shade(color, -0.35);
      ctx.fillRect(ox + 4, oy + 1, 8, 1);
      ctx.fillStyle = color;
      ctx.fillRect(ox + 4, oy + 2, 8, 1);
      // Hairline dots
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 5, oy + 1, 1, 1);
      ctx.fillRect(ox + 8, oy + 1, 1, 1);
      ctx.fillRect(ox + 10, oy + 1, 1, 1);
      return;
    }

    case "wild": {
      // Chaotic strands going every direction
      ctx.fillStyle = color;
      // Base cap higher on the head
      ctx.fillRect(ox + 4, oy + 1, 8, 3);
      ctx.fillRect(ox + 3, oy + 2, 2, 3);
      ctx.fillRect(ox + 11, oy + 2, 2, 3);
      // Wild upward strands (raised)
      ctx.fillRect(ox + 3, oy - 1, 1, 3);
      ctx.fillRect(ox + 5, oy - 2, 1, 3);
      ctx.fillRect(ox + 7, oy - 1, 1, 2);
      ctx.fillRect(ox + 9, oy - 2, 1, 3);
      ctx.fillRect(ox + 11, oy - 1, 1, 3);
      ctx.fillRect(ox + 13, oy + 0, 1, 2);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy - 1, 1, 1);
      ctx.fillRect(ox + 9, oy - 1, 1, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 4, oy + 3, 8, 1);
      return;
    }

    case "hood": {
      // Legacy hood — kept for old saves. Simple hooded silhouette.
      ctx.fillStyle = color;
      ctx.fillRect(ox + 3, oy + 0, 10, 3);
      ctx.fillRect(ox + 3, oy + 3, 2, 8);
      ctx.fillRect(ox + 11, oy + 3, 2, 8);
      ctx.fillRect(ox + 4, oy + 3, 8, 1);
      ctx.fillStyle = shadow;
      ctx.fillRect(ox + 4, oy + 4, 8, 1);
      ctx.fillRect(ox + 3, oy + 10, 10, 1);
      ctx.fillStyle = hi;
      ctx.fillRect(ox + 5, oy + 1, 4, 1);
      return;
    }
  }
}
