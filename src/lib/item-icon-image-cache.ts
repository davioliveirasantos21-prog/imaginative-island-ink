/**
 * Async image cache for the 16×16 icon of each item kind, so canvas
 * rendering paths (e.g. items dropped on the ground) can grab a ready
 * HTMLImageElement synchronously each frame.
 *
 * First request for a kind kicks off:
 *   - admin override pixels (if any), or
 *   - the baked-in hand-drawn pixel map (if any), or
 *   - `captureIconDefaultPixels()` which mirrors SlotIcon's CSS shape / PNG.
 *
 * When admin overrides change we drop the cache so the next frame re-fetches
 * the new art.
 */

import {
  getItemVariantPixels,
  renderItemPixelsToDataURL,
  subscribeItemOverrides,
  type ItemKind,
  type ItemPixels,
} from "@/lib/items";
import {
  BAKED_ICON_PIXELS,
  captureIconDefaultPixels,
} from "@/lib/item-icon-defaults";

const cache = new Map<ItemKind, HTMLImageElement>();
const inflight = new Set<ItemKind>();

function build(kind: ItemKind, pixels: ItemPixels) {
  if (!pixels || Object.keys(pixels).length === 0) return;
  const url = renderItemPixelsToDataURL(pixels);
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    cache.set(kind, img);
  };
  img.src = url;
}

function kickoff(kind: ItemKind) {
  if (inflight.has(kind)) return;
  inflight.add(kind);
  const override = getItemVariantPixels(kind, "icon");
  if (override) {
    build(kind, override);
    return;
  }
  const baked = BAKED_ICON_PIXELS[kind];
  if (baked) {
    build(kind, baked);
    return;
  }
  captureIconDefaultPixels(kind).then((pix) => build(kind, pix));
}

/**
 * Return the item's 16×16 icon as an HTMLImageElement, or null while it
 * loads. First miss kicks off an async load; subsequent frames get the
 * cached image once the browser decodes it.
 */
export function getItemIconImage(kind: ItemKind): HTMLImageElement | null {
  const cached = cache.get(kind);
  if (cached) return cached;
  if (typeof document !== "undefined") kickoff(kind);
  return null;
}

if (typeof window !== "undefined") {
  subscribeItemOverrides(() => {
    cache.clear();
    inflight.clear();
  });
}
