import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminCheck, adminLogin, adminLogout, adminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Pixel Islands" },
      { name: "description", content: "Painel administrativo interno." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdmPage,
});

type Stats = Awaited<ReturnType<typeof adminStats>>;

function AdmPage() {
  const check = useServerFn(adminCheck);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const fetchStats = useServerFn(adminStats);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"overview" | "contacts" | "errors" | "users">("overview");

  useEffect(() => {
    void check().then((r) => setUnlocked(r.unlocked));
  }, [check]);

  useEffect(() => {
    if (unlocked) void fetchStats().then(setStats).catch((e) => setErr(String(e)));
  }, [unlocked, fetchStats]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { ok } = await login({ data: { password } });
      if (!ok) {
        setErr("Senha incorreta.");
        return;
      }
      setUnlocked(true);
      setPassword("");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await logout();
    setUnlocked(false);
    setStats(null);
  }

  if (unlocked === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-sm">Verificando sessão…</div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-xl border border-amber-500/30 bg-slate-900/80 backdrop-blur p-6 shadow-2xl"
        >
          <div className="mb-6 text-center">
            <div className="text-xs tracking-[0.4em] text-amber-400">PIXEL ISLANDS</div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-100">Painel Admin</h1>
            <p className="mt-1 text-xs text-slate-400">Restrito · Somente pessoal autorizado</p>
          </div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-slate-400">Senha</label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
          {err && <div className="mb-3 text-xs text-red-400">{err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-[10px] tracking-[0.35em] text-amber-400">PIXEL ISLANDS</div>
            <h1 className="text-lg font-semibold text-slate-100">Painel administrativo</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats().then(setStats)}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-amber-400"
            >
              ↻ Atualizar
            </button>
            <button
              onClick={onLogout}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-red-400 hover:text-red-300"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4">
          {(["overview", "contacts", "errors", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border-b-2 ${
                tab === t
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "overview" ? "Visão geral" : t === "contacts" ? "Contatos" : t === "errors" ? "Erros" : "Usuários"}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!stats && <div className="text-sm text-slate-400">Carregando estatísticas…</div>}
        {stats && tab === "overview" && <Overview stats={stats} />}
        {stats && tab === "contacts" && <Contacts stats={stats} />}
        {stats && tab === "errors" && <Errors stats={stats} />}
        {stats && tab === "users" && <Users stats={stats} />}
      </main>
    </div>
  );
}

function StatCard({ label, value, hint, tone = "amber" }: { label: string; value: number | string; hint?: string; tone?: "amber" | "green" | "red" | "blue" }) {
  const tones: Record<string, string> = {
    amber: "text-amber-300",
    green: "text-emerald-300",
    red: "text-red-300",
    blue: "text-sky-300",
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function Overview({ stats }: { stats: Stats }) {
  const { totals, daily } = stats;
  const max = Math.max(1, ...daily.map((d) => Math.max(d.lp, d.game)));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Cadastros" value={totals.users} hint={`+${totals.signups7} últimos 7d · +${totals.signups30} 30d`} tone="green" />
        <StatCard label="Visitas na LP (total)" value={totals.lpTotal} hint={`+${totals.lp24} nas últimas 24h`} tone="amber" />
        <StatCard label="Entradas no jogo (total)" value={totals.gameTotal} hint={`+${totals.game24} nas últimas 24h`} tone="blue" />
        <StatCard label="Mensagens de contato" value={totals.contacts} tone="amber" />
        <StatCard label="Erros nas últimas 24h" value={totals.errors24} tone={totals.errors24 > 0 ? "red" : "green"} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Últimos 14 dias</h2>
          <div className="flex gap-4 text-[10px] uppercase tracking-widest">
            <span className="text-amber-300">■ LP</span>
            <span className="text-sky-300">■ Jogo</span>
          </div>
        </div>
        <div className="flex h-48 items-end gap-1">
          {daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}\nLP: ${d.lp}\nJogo: ${d.game}`}>
              <div className="flex h-full w-full items-end gap-[2px]">
                <div className="flex-1 rounded-t bg-amber-400/80" style={{ height: `${(d.lp / max) * 100}%` }} />
                <div className="flex-1 rounded-t bg-sky-400/80" style={{ height: `${(d.game / max) * 100}%` }} />
              </div>
              <div className="text-[9px] text-slate-500">{d.day.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Contacts({ stats }: { stats: Stats }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-3 text-sm font-semibold">Mensagens de contato (últimas 50)</div>
      {stats.contacts.length === 0 && <div className="p-6 text-sm text-slate-400">Nenhuma mensagem ainda.</div>}
      <ul className="divide-y divide-slate-800">
        {stats.contacts.map((c: any) => (
          <li key={c.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-slate-100">{c.name} <span className="text-slate-400 font-normal">&lt;{c.email}&gt;</span></div>
              <div className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</div>
            </div>
            {c.subject && <div className="mt-1 text-xs uppercase tracking-widest text-amber-300">{c.subject}</div>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{c.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Errors({ stats }: { stats: Stats }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-3 text-sm font-semibold">Log de erros (últimos 50)</div>
      {stats.errors.length === 0 && <div className="p-6 text-sm text-slate-400">Sem erros registrados.</div>}
      <ul className="divide-y divide-slate-800">
        {stats.errors.map((e: any) => (
          <li key={e.id} className="px-5 py-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="font-mono text-sm text-red-300">{e.message}</div>
              <div className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</div>
            </div>
            {e.path && <div className="mt-1 text-xs text-slate-500">rota: {e.path}</div>}
            {e.stack && <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-3 text-[11px] text-slate-400">{e.stack}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Users({ stats }: { stats: Stats }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-3 text-sm font-semibold">Últimos cadastros</div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-5 py-2">E-mail</th>
            <th className="px-5 py-2">Criado em</th>
            <th className="px-5 py-2">Último login</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {stats.recentUsers.map((u: any) => (
            <tr key={u.id}>
              <td className="px-5 py-3 text-slate-200">{u.email ?? "—"}</td>
              <td className="px-5 py-3 text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
              <td className="px-5 py-3 text-slate-400">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
