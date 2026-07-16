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
  "cave-wall-restore-v1",
  "cave2-reset-v1",
]);
const PREFIXES = ["pixel-realms.world.", "pixel-realms.worldseed."];

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

async function pushNow() {
  pushTimer = null;
  if (!currentUserId || currentUserId.startsWith("local-")) return;
  try {
    const data = readAllLocal();
    const { error } = await supabase
      .from("player_saves")
      .upsert({ user_id: currentUserId, data }, { onConflict: "user_id" });
    if (error && import.meta.env.DEV) {
      console.debug("[player-sync] push failed:", error.message);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.debug("[player-sync] push threw:", e);
  }
}

function schedulePush() {
  if (!currentUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(), 800);
}

async function hydrateFromCloud(userId: string, origSet: (k: string, v: string) => void, origRemove: (k: string) => void) {
  if (userId.startsWith("local-")) return;
  try {
    const { data, error } = await supabase
      .from("player_saves")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[player-sync] fetch failed:", error.message);
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
    if (!changed) return;
    clearAllLocal(origRemove);
    for (const [k, v] of Object.entries(cloudBlob)) {
      if (typeof v === "string") origSet(k, v);
    }
    // Reload so in-memory caches read the freshly hydrated data.
    window.location.reload();
  } catch (e) {
    console.warn("[player-sync] hydrate failed:", e);
  }
}

export function initPlayerSync() {
  if (inited || typeof window === "undefined") return;
  inited = true;

  // Wrap the (possibly already-patched by cloud-sync) localStorage methods so
  // writes to player keys also enqueue a cloud push.
  const origSet = window.localStorage.setItem.bind(window.localStorage);
  const origRemove = window.localStorage.removeItem.bind(window.localStorage);
  try {
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      writable: true,
      value: (k: string, v: string) => {
        origSet(k, v);
        if (isSyncedKey(k)) schedulePush();
      },
    });
    Object.defineProperty(window.localStorage, "removeItem", {
      configurable: true,
      writable: true,
      value: (k: string) => {
        origRemove(k);
        if (isSyncedKey(k)) schedulePush();
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
    } catch {}
  }

  // Track session state. On identity changes, hydrate or clear.
  void supabase.auth.getSession().then(({ data }) => {
    if (currentUserId && currentUserId.startsWith("local-")) return;
    const uid = data.session?.user?.id ?? null;
    if (uid) {
      currentUserId = uid;
      void hydrateFromCloud(uid, origSet, origRemove);
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (currentUserId && currentUserId.startsWith("local-")) return;
    const uid = session?.user?.id ?? null;
    if (event === "SIGNED_IN" && uid && uid !== currentUserId) {
      currentUserId = uid;
      void hydrateFromCloud(uid, origSet, origRemove);
    } else if (event === "SIGNED_OUT") {
      currentUserId = null;
      clearAllLocal(origRemove);
      // Reload back to the main menu with a clean guest state.
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  });
}

if (typeof window !== "undefined") {
  initPlayerSync();
}

// -------------------- Player auth helpers --------------------

export async function playerSignIn(email: string, password: string) {
  try {
    const res = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (res.error) throw res.error;
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
        // Trigger page refresh/redirect
        setTimeout(() => {
          window.location.href = "/characters";
        }, 100);
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      }
      return { data: null, error: new Error("Usuário ou senha incorretos (Modo Offline).") };
    }
    return { data: null, error: e };
  }
}

export async function playerSignUp(email: string, password: string, username?: string) {
  try {
    const res = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: username ? { username } : undefined,
      },
    });
    if (res.error) throw res.error;
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
      setTimeout(() => {
        window.location.href = "/characters";
      }, 100);
      return { data: { session: {} }, error: null };
    }
    return { data: null, error: e };
  }
}

export async function playerResetPassword(email: string) {
  try {
    // Bypass Supabase's built-in email hook — send via our own Resend function.
    const { data, error } = await supabase.functions.invoke("send-password-reset", {
      body: {
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
}

export async function playerSignOut() {
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

