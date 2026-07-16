import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Pixel Islands" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase places the recovery token in the URL hash and hydrates the
    // session automatically. Once we see a session, we can update the password.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (busy) return;
    setErr(null);
    if (password.length < 6) { setErr("Senha deve ter pelo menos 6 caracteres."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    navigate({ to: "/characters" });
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] font-pixel text-[#f4e9c1] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border-4 border-[#f4e9c1] bg-[#1b2a3a] p-6"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}>
        <h1 className="text-center text-xl text-[#ffd166] mb-4" style={{ textShadow: "2px 2px 0 #7a3e1d" }}>
          NOVA SENHA
        </h1>
        {!ready ? (
          <p className="text-center text-[11px] text-[#f4e9c1]/70">Validando link...</p>
        ) : (
          <>
            <label className="mb-1 block text-[10px] tracking-widest">NOVA SENHA</label>
            <input type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]" />
            {err && <div className="mb-3 text-[10px] text-[#e94560]">{err}</div>}
            <button onClick={() => void submit()} disabled={busy}
              className="w-full border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[11px] uppercase text-[#0d1b2a] disabled:opacity-60"
              style={{ boxShadow: "0 4px 0 #7a3e1d" }}>
              {busy ? "..." : "▶ SALVAR SENHA"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
