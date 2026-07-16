/**
 * Per-player save sync.
 *
 * Mirrors a small set of localStorage keys (character slots, per-slot world,
 * seeds, active slot, plus a couple of global game flags) into the shared
 * `public.player_saves` table, keyed by the signed-in user. RLS scopes every
 * read/write to `auth.uid()`.
 *
 * Behaviour:
 * - On sign-in: fetch the row, overwrite local player keys with cloud data,
 *   then reload the page so in-memory caches pick up the new save.
 * - Any subsequent write to a synced key is debounced and pushed as a single
 *   upsert of the merged blob.
 * - On sign-out: clear the synced keys locally so the next player starts fresh.
 */

import { supabase } from "@/integrations/supabase/client";

// Exact keys and key-prefixes that make up a player's save.
const EXACT_KEYS = new Set<string>([
  "pixel-realms.slots",
  "pixel-realms.active-slot",
  "pixel-realms.save-meta",
  "cave-wall-restore-v1",
  "cave2-reset-v1",
]);
const PREFIXES = ["pixel-realms.world.", "pixel-realms.worldseed."];
const SAVE_META_KEY = "pixel-realms.save-meta";
const SAVE_OWNER_KEY = "pixel-realms.save-owner";

function isSyncedKey(k: string): boolean {
  if (EXACT_KEYS.has(k)) return true;
  for (const p of PREFIXES) if (k.startsWith(p)) return true;
  return false;
}

function readAllLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !isSyncedKey(k)) continue;
    const v = window.localStorage.getItem(k);
    if (v != null) out[k] = v;
  }
  return out;
}

function clearAllLocal(origRemove: (k: string) => void) {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && isSyncedKey(k)) keys.push(k);
  }
  for (const k of keys) origRemove(k);
}

let currentUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let inited = false;
let localChangeVersion = 0;
let playerSaveReady = false;
const readyWaiters = new Set<() => void>();
let storageSet: ((k: string, v: string) => void) | null = null;
let storageRemove: ((k: string) => void) | null = null;

export function isPlayerSaveReady(): boolean {
  return playerSaveReady;
}

export function waitForPlayerSaveReady(): Promise<void> {
  if (playerSaveReady) return Promise.resolve();
  return new Promise((resolve) => readyWaiters.add(resolve));
}

function markPlayerSavePending() {
  playerSaveReady = false;
}

function markPlayerSaveReady() {
  playerSaveReady = true;
  for (const resolve of readyWaiters) resolve();
  readyWaiters.clear();
}

function sameBlob(a: Record<string, string>, b: Record<string, string>): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

function blobUpdatedAt(blob: Record<string, string>): number {
  try {
    const raw = blob[SAVE_META_KEY];
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { updatedAt?: unknown };
    return typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
      ? parsed.updatedAt
      : 0;
  } catch {
    return 0;
  }
}

function touchSaveMeta(origSet: (k: string, v: string) => void) {
  try {
    origSet(SAVE_META_KEY, JSON.stringify({ updatedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

async function pushNow() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pushTimer = null;
  if (!currentUserId || currentUserId.startsWith("local-")) return;
  try {
    const data = readAllLocal();
    const { error } = await supabase
      .from("player_saves")
      .upsert({ user_id: currentUserId, data }, { onConflict: "user_id" });
    if (error && import.meta.env.DEV) {
      console.debug("[player-sync] push failed:", error.message);
    } else if (!error) {
      try {
        localStorage.setItem(SAVE_OWNER_KEY, currentUserId);
      } catch {
        /* ignore */
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.debug("[player-sync] push threw:", e);
  }
}

export async function flushPlayerSaveSync(): Promise<void> {
  await pushNow();
}

function schedulePush() {
  if (!currentUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(), 150);
}

async function hydrateFromCloud(userId: string, origSet: (k: string, v: string) => void, origRemove: (k: string) => void) {
  if (userId.startsWith("local-")) {
    markPlayerSaveReady();
    return;
  }
  markPlayerSavePending();
  const hydrationStartVersion = localChangeVersion;
  try {
    const owner = localStorage.getItem(SAVE_OWNER_KEY);
    if (owner && owner !== userId) {
      clearAllLocal(origRemove);
    }

    const { data, error } = await supabase
      .from("player_saves")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[player-sync] fetch failed:", error.message);
      return;
    }

    // If the player changed/deleted/created a character while the cloud row was
    // still loading, never overwrite that fresh local action with stale cloud
    // data. Push the latest local state instead.
    if (localChangeVersion !== hydrationStartVersion) {
      currentUserId = userId;
      await pushNow();
      return;
    }

    const cloudBlob = (data?.data as Record<string, string> | undefined) ?? {};
    const localBlob = readAllLocal();
    const cloudEmpty = Object.keys(cloudBlob).length === 0;
    const localNonEmpty = Object.keys(localBlob).length > 0;

    if (cloudEmpty && localNonEmpty) {
      // First login on this account — upload the guest progress.
      await supabase
        .from("player_saves")
        .upsert({ user_id: userId, data: localBlob }, { onConflict: "user_id" });
      localStorage.setItem(SAVE_OWNER_KEY, userId);
      return;
    }

    // If this browser already has an explicit character-slot save, treat it as
    // the player's newest intent and do not resurrect an older cloud copy. This
    // is especially important for deletions: a local `[null, ...]` slot state is
    // a real save, not an empty cache.
    const sameBrowserAccount = localStorage.getItem(SAVE_OWNER_KEY) === userId;
    const localIsNewerOrSame = blobUpdatedAt(localBlob) >= blobUpdatedAt(cloudBlob);
    if (!cloudEmpty && localNonEmpty && localBlob["pixel-realms.slots"] && !sameBlob(localBlob, cloudBlob) && sameBrowserAccount && localIsNewerOrSame) {
      await supabase
        .from("player_saves")
        .upsert({ user_id: userId, data: localBlob }, { onConflict: "user_id" });
      localStorage.setItem(SAVE_OWNER_KEY, userId);
      return;
    }

    // Cloud wins: replace local with cloud contents.
    // Only reload the page if the local state actually changed — otherwise
    // every page load would trigger a reload → infinite loop.
    let changed = false;
    const localKeys = Object.keys(localBlob);
    const cloudKeys = Object.keys(cloudBlob);
    if (localKeys.length !== cloudKeys.length) {
      changed = true;
    } else {
      for (const k of cloudKeys) {
        if (localBlob[k] !== cloudBlob[k]) { changed = true; break; }
      }
    }
    if (!changed) {
      localStorage.setItem(SAVE_OWNER_KEY, userId);
      return;
    }
    clearAllLocal(origRemove);
    for (const [k, v] of Object.entries(cloudBlob)) {
      if (typeof v === "string") origSet(k, v);
    }
    localStorage.setItem(SAVE_OWNER_KEY, userId);
    // Reload so in-memory caches read the freshly hydrated data.
    window.location.reload();
  } catch (e) {
    console.warn("[player-sync] hydrate failed:", e);
  } finally {
    markPlayerSaveReady();
  }
}

export function initPlayerSync() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  markPlayerSavePending();

  // Wrap the (possibly already-patched by cloud-sync) localStorage methods so
  // writes to player keys also enqueue a cloud push.
  const origSet = window.localStorage.setItem.bind(window.localStorage);
  const origRemove = window.localStorage.removeItem.bind(window.localStorage);
  storageSet = origSet;
  storageRemove = origRemove;
  try {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      writable: true,
      value: (k: string, v: string) => {
        origSet(k, v);
        if (isSyncedKey(k)) {
          if (k !== SAVE_META_KEY) touchSaveMeta(origSet);
          localChangeVersion++;
          schedulePush();
        }
      },
    });
    Object.defineProperty(window.localStorage, "removeItem", {
      configurable: true,
      writable: true,
      value: (k: string) => {
        origRemove(k);
        if (isSyncedKey(k)) {
          if (k !== SAVE_META_KEY) touchSaveMeta(origSet);
          localChangeVersion++;
          schedulePush();
        }
      },
    });
  } catch (e) {
    console.warn("[player-sync] could not patch localStorage:", e);
  }

  // Load local user session if any
  const localUserRaw = localStorage.getItem("pixel-islands.current-user");
  if (localUserRaw) {
    try {
      const u = JSON.parse(localUserRaw);
      currentUserId = u.id;
      if (currentUserId?.startsWith("local-")) markPlayerSaveReady();
    } catch {}
  }

  // Track session state. On identity changes, hydrate or clear.
  void supabase.auth.getSession().then(({ data }) => {
    if (currentUserId && currentUserId.startsWith("local-")) return;
    const uid = data.session?.user?.id ?? null;
    if (uid) {
      currentUserId = uid;
      void hydrateFromCloud(uid, origSet, origRemove);
    } else {
      markPlayerSaveReady();
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (currentUserId && currentUserId.startsWith("local-")) return;
    const uid = session?.user?.id ?? null;
    if (event === "SIGNED_IN" && uid && uid !== currentUserId) {
      markPlayerSavePending();
      currentUserId = uid;
      void hydrateFromCloud(uid, origSet, origRemove);
    } else if (event === "SIGNED_OUT") {
      currentUserId = null;
      clearAllLocal(origRemove);
      localStorage.removeItem(SAVE_OWNER_KEY);
      markPlayerSaveReady();
      // Reload back to the main menu with a clean guest state.
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  });

  const flushOnLeave = () => {
    void pushNow();
  };
  window.addEventListener("pagehide", flushOnLeave);
  window.addEventListener("beforeunload", flushOnLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnLeave();
  });
}

if (typeof window !== "undefined") {
  initPlayerSync();
}

// -------------------- Player auth helpers --------------------

export async function playerSignIn(email: string, password: string) {
  markPlayerSavePending();
  try {
    const res = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (res.error) throw res.error;
    const userId = res.data.user?.id;
    if (userId && storageSet && storageRemove) {
      currentUserId = userId;
      void hydrateFromCloud(userId, storageSet, storageRemove);
    } else {
      markPlayerSaveReady();
    }
    return res;
  } catch (e: any) {
    const isNetworkError =
      e.message?.includes("Failed to fetch") ||
      e.message?.includes("network") ||
      e.message?.includes("NetworkError") ||
      e.name === "TypeError";
    if (isNetworkError) {
      const localUsersRaw = localStorage.getItem("pixel-islands.local-users");
      const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
      const user = localUsers.find(
        (u: any) => u.email === email.trim().toLowerCase() && u.password === password
      );
      if (user) {
        localStorage.setItem("pixel-islands.current-user", JSON.stringify(user));
        currentUserId = user.id;
        markPlayerSaveReady();
        // Trigger page refresh/redirect
        setTimeout(() => {
          window.location.href = "/characters";
        }, 100);
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      }
      markPlayerSaveReady();
      return { data: null, error: new Error("Usuário ou senha incorretos (Modo Offline).") };
    }
    markPlayerSaveReady();
    return { data: null, error: e };
  }
}

export async function playerSignUp(email: string, password: string, username?: string) {
  markPlayerSavePending();
  try {
    const res = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: username ? { username } : undefined,
      },
    });
    if (res.error) throw res.error;
    const userId = res.data.user?.id;
    if (userId && storageSet && storageRemove) {
      currentUserId = userId;
      void hydrateFromCloud(userId, storageSet, storageRemove);
    } else {
      markPlayerSaveReady();
    }
    return res;
  } catch (e: any) {
    const isNetworkError =
      e.message?.includes("Failed to fetch") ||
      e.message?.includes("network") ||
      e.message?.includes("NetworkError") ||
      e.name === "TypeError";
    if (isNetworkError) {
      const localUsersRaw = localStorage.getItem("pixel-islands.local-users");
      const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
      const exists = localUsers.some(
        (u: any) => u.email === email.trim().toLowerCase()
      );
      if (exists) {
        return { data: null, error: new Error("Usuário já existe (Modo Offline).") };
      }
      const newUser = {
        id: "local-" + Math.random().toString(36).substring(2, 11),
        username: username || email.split("@")[0],
        email: email.trim().toLowerCase(),
        password,
      };
      localUsers.push(newUser);
      localStorage.setItem("pixel-islands.local-users", JSON.stringify(localUsers));
      localStorage.setItem("pixel-islands.current-user", JSON.stringify(newUser));
      currentUserId = newUser.id;
      markPlayerSaveReady();
      setTimeout(() => {
        window.location.href = "/characters";
      }, 100);
      return { data: { session: {} }, error: null };
    }
    markPlayerSaveReady();
    return { data: null, error: e };
  }
}


export async function playerSignOut() {
  await pushNow();
  if (typeof window !== "undefined") {
    localStorage.removeItem("pixel-islands.current-user");
  }
  currentUserId = null;
  try {
    return await supabase.auth.signOut();
  } catch {
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
    return { error: null };
  }
}

export async function getPlayerSession() {
  if (typeof window !== "undefined") {
    const localUserRaw = localStorage.getItem("pixel-islands.current-user");
    if (localUserRaw) {
      try {
        const u = JSON.parse(localUserRaw);
        return { id: u.id, username: u.username, email: u.email };
      } catch {}
    }
  }
  try {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    const email = u.email ?? "";
    const username = (u.user_metadata as { username?: string } | null)?.username ?? email.split("@")[0];
    return { id: u.id, username, email };
  } catch {
    return null;
  }
}

