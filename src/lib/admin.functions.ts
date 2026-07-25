import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET missing or too short");
  }
  return {
    password,
    name: "pi-adm",
    maxAge: 60 * 60 * 8, // 8h
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function pwMatches(a: string, b: string) {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSWORD ?? "";
    if (!expected) return { ok: false as const };
    if (!pwMatches(data.password, expected)) return { ok: false as const };
    const s = await useSession<AdminSession>(sessionConfig());
    await s.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<AdminSession>(sessionConfig());
  await s.clear();
  return { ok: true as const };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<AdminSession>(sessionConfig());
  return { unlocked: !!s.data.unlocked };
});

async function requireUnlocked() {
  const s = await useSession<AdminSession>(sessionConfig());
  if (!s.data.unlocked) throw new Error("Unauthorized");
}

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const now = Date.now();
  const since24 = new Date(now - 24 * 3600 * 1000).toISOString();
  const since7 = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const since30 = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

  const [
    usersRes,
    lpTotalRes,
    lp24Res,
    gameTotalRes,
    game24Res,
    errors24Res,
    contactsRes,
    recentContactsRes,
    recentErrorsRes,
    recentEventsRes,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).eq("path", "/"),
    supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).eq("path", "/").gte("created_at", since24),
    supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).like("path", "/game%"),
    supabaseAdmin.from("page_events").select("id", { count: "exact", head: true }).like("path", "/game%").gte("created_at", since24),
    supabaseAdmin.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", since24),
    supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("error_logs").select("*").order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("page_events").select("path,created_at,user_agent").order("created_at", { ascending: false }).limit(200),
  ]);

  const users = usersRes.data?.users ?? [];
  const signups7 = users.filter((u) => u.created_at && new Date(u.created_at).toISOString() >= since7).length;
  const signups30 = users.filter((u) => u.created_at && new Date(u.created_at).toISOString() >= since30).length;

  // daily buckets for last 14 days from page_events
  const buckets: Record<string, { lp: number; game: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const k = d.toISOString().slice(0, 10);
    buckets[k] = { lp: 0, game: 0 };
  }
  for (const ev of recentEventsRes.data ?? []) {
    const k = (ev.created_at as string).slice(0, 10);
    if (!buckets[k]) continue;
    if (ev.path === "/") buckets[k].lp++;
    else if ((ev.path as string).startsWith("/game")) buckets[k].game++;
  }

  return {
    totals: {
      users: users.length,
      signups7,
      signups30,
      lpTotal: lpTotalRes.count ?? 0,
      lp24: lp24Res.count ?? 0,
      gameTotal: gameTotalRes.count ?? 0,
      game24: game24Res.count ?? 0,
      errors24: errors24Res.count ?? 0,
      contacts: contactsRes.count ?? 0,
    },
    contacts: recentContactsRes.data ?? [],
    errors: recentErrorsRes.data ?? [],
    daily: Object.entries(buckets).map(([day, v]) => ({ day, ...v })),
    recentUsers: users
      .slice(0, 20)
      .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })),
  };
});
