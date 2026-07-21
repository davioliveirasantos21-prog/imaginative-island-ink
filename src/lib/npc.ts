import {
  BEARD_STYLES,
  BOOT_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SKIN_TONES,
  type Appearance,
  type BeardStyle,
  type BodyType,
  type HairStyle,
} from "./appearance";

const NAMES = [
  "Bran", "Corvo", "Thalia", "Elias", "Móra", "Zephyr", "Ilda", "Baltus",
  "Nyx", "Ravena", "Osric", "Vesper", "Cassia", "Drogo", "Livia", "Fenn",
  "Sable", "Tobin", "Wren", "Yara",
];

const PERSONALITIES = [
  "Fala em enigmas curtos e adora fazer trocadilhos ruins entre uma frase e outra.",
  "Ri antes de terminar as próprias frases e sempre insinua saber mais do que revela.",
  "É melancólico e sarcástico, mas encerra cada resposta com uma piadinha seca.",
  "Se acha um filósofo da floresta — mistura frases misteriosas com humor tosco.",
  "É um bardo cansado que conta meias-verdades acompanhadas de tiradas engraçadas.",
  "Fala como se soubesse um segredo ancestral, mas se distrai contando piada de tia.",
  "Cochicha até para dizer 'bom dia' e finge que tudo é um grande mistério cósmico.",
];

function mulberry32(a: number) {
  let s = a >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export type Npc = {
  name: string;
  personality: string;
  appearance: Appearance;
  /** World-space X position (sprite top-left). */
  x: number;
};

/**
 * Deterministic NPC generation from the world seed. Placed a bit to the right
 * of the player's spawn so the player finds them wandering in the forest.
 */
export function generateNpc(seed: number, spawnX: number): Npc {
  const rng = mulberry32((seed || 1) ^ 0x9e3779b9);
  const body: BodyType = rng() < 0.5 ? "masc" : "fem";
  const hairStyle: HairStyle = pick(rng, HAIR_STYLES);
  const beard: BeardStyle = body === "masc" ? pick(rng, BEARD_STYLES) : "none";
  const appearance: Appearance = {
    body,
    skin: pick(rng, SKIN_TONES),
    hairStyle,
    hairColor: pick(rng, HAIR_COLORS),
    beard,
    shirt: pick(rng, SHIRT_COLORS),
    shirtStyle: pick(rng, ["tshirt", "robe", "greek"] as const),
    pants: pick(rng, PANTS_COLORS),
    pantsStyle: pick(rng, ["trousers", "shorts"] as const),
    boots: pick(rng, BOOT_COLORS),
    eyeColor: pick(rng, EYE_COLORS),
  };
  const offset = 260 + Math.floor(rng() * 140);
  return {
    name: pick(rng, NAMES),
    personality: pick(rng, PERSONALITIES),
    appearance,
    x: spawnX + offset,
  };
}
