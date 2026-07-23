/**
 * Shared game content sync.
 *
 * All admin-editable customization data (item/scenery pixels,
 * hair/beard/garment overrides, custom hairs and garments) used to live in each player's
 * localStorage. This module makes that data live in the shared backend so
 * every player sees the same edits.
 *
 * Design:
 *   1. On boot we fetch every row of `public.game_content` and write it
 *      into localStorage BEFORE any React tree mounts. Existing code in
 *      items.ts / appearance.ts keeps reading from localStorage as usual
 *      and picks up the shared values seamlessly.
 *   2. We monkey-patch localStorage.{setItem,removeItem} so that any
 *      future write to one of the synced keys ALSO pushes to the backend.
 *      Only signed-in admins have RLS permission to write, so a normal
 *      player writing locally simply fails silently on the server — the
 *      write still lands in their own localStorage (harmless).
 *   3. A realtime subscription mirrors remote changes back into
 *      localStorage. When another admin edits, we hard-reload the page so
 *      the in-memory caches inside items.ts / appearance.ts pick up the
 *      new data without having to add invalidation hooks throughout.
 */

import { supabase } from "@/integrations/supabase/client";

export const SYNCED_KEYS = [
  "item-overrides-v1",
  "hair-overrides-v1",
  "beard-overrides-v1",
  "shirt-overrides-v1",
  "pants-overrides-v1",
  "custom-garments-v1",
  "custom-hairs-v1",
  "scenery-overrides-v1",
] as const;

export type SyncedKey = (typeof SYNCED_KEYS)[number];

const syncedSet = new Set<string>(SYNCED_KEYS);

let inited = false;
let readyResolve: (() => void) | null = null;
const readyPromise: Promise<void> = new Promise((r) => {
  readyResolve = r;
});

/** Resolves once the initial cloud fetch has hydrated localStorage. */
export function cloudReady(): Promise<void> {
  return readyPromise;
}

/**
 * Track when we last pushed each key so the realtime echo from our own
 * write does not trigger a redundant page reload. We can't rely on string
 * comparison because Postgres jsonb returns a reformatted/reordered version
 * of what we sent, so any stringify diff would fire the reload incorrectly.
 * Instead we ignore realtime events for a short window after our own push.
 */
const lastPushedAt = new Map<string, number>();
const OWN_ECHO_WINDOW_MS = 5000;

/** Bumped once cloud finishes its initial fetch; used to gate the UI. */
let _readyTick = 0;
const readyListeners = new Set<() => void>();
export function subscribeCloudReady(cb: () => void): () => void {
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}
export function getCloudReadyTick(): number {
  return _readyTick;
}
function markReady() {
  _readyTick++;
  readyResolve?.();
  readyResolve = null;
  for (const l of readyListeners) l();
}

async function pushKey(key: string, value: string) {
  try {
    const data = JSON.parse(value);
    lastPushedAt.set(key, Date.now());
    const { error } = await supabase
      .from("game_content")
      .upsert({ key, data }, { onConflict: "key" });
    if (error) {
      // RLS blocks non-admins — that's fine, silent.
      if (import.meta.env.DEV) console.debug("[cloud-sync] push blocked:", error.message);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.debug("[cloud-sync] push failed:", e);
  }
}

async function deleteKey(key: string) {
  try {
    lastPushedAt.set(key, Date.now());
    const { error } = await supabase.from("game_content").delete().eq("key", key);
    if (error && import.meta.env.DEV) {
      console.debug("[cloud-sync] delete blocked:", error.message);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.debug("[cloud-sync] delete failed:", e);
  }
}

/**
 * Kick off cloud sync. Safe to call multiple times.
 * Must be called BEFORE the app reads any of the synced keys, so callers
 * should await cloudReady() before rendering game/customization surfaces.
 */
export function initCloudSync() {
  if (inited || typeof window === "undefined") return;
  inited = true;

  // Purge any legacy insecure admin flag from previous versions on boot.
  try { window.localStorage.removeItem("pixel-islands.current-admin"); } catch {}



  // 1. Monkey-patch localStorage so any write to a synced key mirrors to cloud.
  const origSet = window.localStorage.setItem.bind(window.localStorage);
  const origRemove = window.localStorage.removeItem.bind(window.localStorage);
  try {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      writable: true,
      value: (k: string, v: string) => {
        origSet(k, v);
        if (syncedSet.has(k)) void pushKey(k, v);
      },
    });
    Object.defineProperty(window.localStorage, "removeItem", {
      configurable: true,
      writable: true,
      value: (k: string) => {
        origRemove(k);
        if (syncedSet.has(k)) void deleteKey(k);
      },
    });
  } catch (e) {
    console.warn("[cloud-sync] could not patch localStorage:", e);
  }
  (window as unknown as { __cloudSyncPatched?: boolean }).__cloudSyncPatched = true;

  // Helper: after cloud writes to localStorage directly (bypassing our
  // patched setItem), notify listeners so module-level caches in items.ts,
  // scenery.ts, etc. can drop their stale snapshot and re-read.
  const notifyCloudWrite = (key: string) => {
    try {
      window.dispatchEvent(new CustomEvent("cloud-sync:write", { detail: { key } }));
    } catch {
      /* ignore */
    }
  };

  // 2. Fetch existing cloud state and hydrate localStorage.
  (async () => {
    try {
      const localBeforeFetch = new Map<string, string>();
      for (const key of SYNCED_KEYS) {
        const value = window.localStorage.getItem(key);
        if (value) localBeforeFetch.set(key, value);
      }

      const { data, error } = await supabase
        .from("game_content")
        .select("key,data")
        .in("key", SYNCED_KEYS as unknown as string[]);
      if (error) throw error;
      const cloudKeys = new Set<string>();
      for (const row of data ?? []) {
        cloudKeys.add(row.key);
        // Cloud is the source of truth on boot. Never let stale localStorage
        // (especially old admin-panel edits) overwrite shared content during
        // hydration; only explicit admin saves after the app is ready push up.
        const serialized = JSON.stringify(row.data);
        origSet(row.key, serialized);
        notifyCloudWrite(row.key);
      }
      for (const key of SYNCED_KEYS) {
        if (!cloudKeys.has(key)) {
          origRemove(key);
          notifyCloudWrite(key);
        }
      }
      void localBeforeFetch;
    } catch (e) {
      console.warn("[cloud-sync] initial fetch failed:", e);
    } finally {
      markReady();
    }
  })();

  // 3. Realtime — reload when another client edits, skipping our own echoes.
  supabase
    .channel("game_content_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_content" },
      (payload) => {
        const row = (payload.new ?? payload.old) as { key?: string; data?: unknown } | null;
        if (!row?.key || !syncedSet.has(row.key)) return;
        // Skip echoes of our own recent writes. Postgres jsonb round-trips
        // reorder/reformat keys, so string comparison is unreliable — a
        // simple time window is more robust.
        const pushedAt = lastPushedAt.get(row.key) ?? 0;
        if (Date.now() - pushedAt < OWN_ECHO_WINDOW_MS) return;
        const isDelete = payload.eventType === "DELETE";
        if (isDelete) origRemove(row.key);
        else origSet(row.key, JSON.stringify(row.data));
        notifyCloudWrite(row.key);
        // Delay slightly to batch bursts of edits, then reload.
        scheduleReload();
      },
    )
    .subscribe();
}

// Auto-init as soon as this module is imported in the browser. Idempotent.
if (typeof window !== "undefined") {
  initCloudSync();
}

let reloadTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleReload() {
  if (reloadTimer) return;
  reloadTimer = setTimeout(() => {
    window.location.reload();
  }, 400);
}

// -------------------- Auth helpers --------------------

export type AuthUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Use getUser() (revalidates with Auth server) rather than getSession() —
    // never trust a client-side flag for admin status.
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const isAdmin = await checkIsAdmin(u.id);
    return { id: u.id, email: u.email ?? null, isAdmin };
  } catch {
    return null;
  }
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function signInWithPassword(email: string, password: string) {
  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw res.error;
    return res;
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function signUpWithPassword(email: string, password: string) {
  try {
    return await supabase.auth.signUp({ email, password });
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function signOut() {
  // Clean up any legacy insecure admin flag from previous versions.
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("pixel-islands.current-admin"); } catch {}
  }
  try {
    return await supabase.auth.signOut();
  } catch {
    return { error: null };
  }
}


