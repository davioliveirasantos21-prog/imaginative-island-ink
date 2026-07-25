import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Pixel Islands" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase magic-link tokens land in the URL hash and are consumed by the
    // auth client. Wait for a session to appear before allowing the update.
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    if (busy) return;
    setErr(null); setOk(null);
    if (password.length < 6) { setErr("Senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setErr("As senhas não coincidem."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setErr(error.message); return; }
      setOk("Senha atualizada! Redirecionando…");
      setTimeout(() => navigate({ to: "/characters" }), 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] font-pixel text-[#f4e9c1] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm border-4 border-[#f4e9c1] bg-[#1b2a3a] p-6"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
      >
        <h1 className="text-center text-xl text-[#ffd166] mb-1" style={{ textShadow: "2px 2px 0 #7a3e1d" }}>
          NOVA SENHA
        </h1>
        <p className="text-center text-[10px] tracking-widest text-[#f4e9c1]/60 mb-5">
          {ready ? "Escolha uma nova senha." : "Validando link…"}
        </p>

        {ready && (
          <>
            <label className="mb-1 block text-[10px] tracking-widest">SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErr(null); }}
              className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
            <label className="mb-1 block text-[10px] tracking-widest">CONFIRMAR</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
          </>
        )}

        {err && <div className="mb-3 text-[10px] text-[#e94560]">{err}</div>}
        {ok && <div className="mb-3 text-[10px] text-[#7ee787]">{ok}</div>}

        {ready && (
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="w-full border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[11px] uppercase text-[#0d1b2a] disabled:opacity-60"
            style={{ boxShadow: "0 4px 0 #7a3e1d" }}
          >
            {busy ? "..." : "SALVAR NOVA SENHA"}
          </button>
        )}

        <div className="mt-6 text-center">
          <Link to="/auth" className="text-[10px] tracking-widest text-[#f4e9c1]/50 hover:text-[#f4e9c1]">
            ← Voltar para entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
