import type { ItemKind, ItemPixels, ItemVariant } from "./items";

// Custom items live only in the admin panel for now. They clone an existing
// ItemKind (which defines behavior) and let the admin tweak name + pixel art
// so the user can hand them off later ("this new pickaxe should do X").
export type CustomItem = {
  id: string;
  baseKind: ItemKind;
  name: string;
  icon?: ItemPixels;
  held?: ItemPixels;
};

const STORAGE_KEY = "custom-items-v1";

function safeParse(raw: string | null): CustomItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CustomItem =>
        !!i && typeof i.id === "string" && typeof i.baseKind === "string" && typeof i.name === "string",
    );
  } catch {
    return [];
  }
}

export function loadCustomItems(): CustomItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function saveAll(list: CustomItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function makeId(): string {
  return `ci_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addCustomItem(item: Omit<CustomItem, "id"> & { id?: string }): CustomItem {
  const list = loadCustomItems();
  const next: CustomItem = { ...item, id: item.id ?? makeId() };
  list.push(next);
  saveAll(list);
  return next;
}

export function updateCustomItem(
  id: string,
  patch: Partial<Omit<CustomItem, "id">>,
): void {
  const list = loadCustomItems();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  saveAll(list);
}

export function saveCustomItemVariant(
  id: string,
  variant: ItemVariant,
  pixels: ItemPixels,
): void {
  updateCustomItem(id, { [variant]: pixels } as Partial<CustomItem>);
}

export function deleteCustomItemVariant(id: string, variant: ItemVariant): void {
  const list = loadCustomItems();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const copy = { ...list[idx] };
  delete copy[variant];
  list[idx] = copy;
  saveAll(list);
}

export function deleteCustomItem(id: string): void {
  const list = loadCustomItems().filter((i) => i.id !== id);
  saveAll(list);
}

export function getCustomItem(id: string): CustomItem | undefined {
  return loadCustomItems().find((i) => i.id === id);
}
