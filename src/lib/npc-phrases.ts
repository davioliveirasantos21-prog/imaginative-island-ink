// Shared list of NPC phrases managed via the admin panel. The AI picks one
// of these lines when a player talks to an NPC — the list is global (all
// NPCs share the same pool) and persisted in localStorage.

const STORAGE_KEY = "pixel-realms.admin.npc-phrases";

export function loadNpcPhrases(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

export function saveNpcPhrases(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

/**
 * Parse a raw admin string. Splits on "/" so the admin can paste
 * "frase 1/frase 2/frase 3" and get three separate phrases.
 */
export function parsePhrasesInput(raw: string): string[] {
  return raw
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function addNpcPhrases(raw: string): string[] {
  const current = loadNpcPhrases();
  const incoming = parsePhrasesInput(raw);
  const seen = new Set(current);
  const merged = [...current];
  for (const p of incoming) {
    if (!seen.has(p)) {
      merged.push(p);
      seen.add(p);
    }
  }
  saveNpcPhrases(merged);
  return merged;
}

export function removeNpcPhrase(index: number): string[] {
  const current = loadNpcPhrases();
  if (index < 0 || index >= current.length) return current;
  const next = current.slice(0, index).concat(current.slice(index + 1));
  saveNpcPhrases(next);
  return next;
}

export function clearNpcPhrases(): string[] {
  saveNpcPhrases([]);
  return [];
}
