import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { playerSignIn, playerSignUp, playerResetPassword } from "@/lib/player-sync";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Pixel Islands" },
      { name: "description", content: "Entre ou crie sua conta para salvar seu progresso na nuvem." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setErr(null);
    setOk(null);

    const targetUsername = username.trim();
    if (!/^[a-z0-9_.-]{3,32}$/i.test(targetUsername)) {
      setErr("Usuário deve ter 3-32 caracteres (letras, números, _.-).");
      return;
    }

    if (password.length < 6) {
      setErr("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true);
    try {
      const derivedEmail = `${targetUsername.toLowerCase()}@player.local`;
      const { data, error } =
        mode === "signin"
          ? await playerSignIn(derivedEmail, password)
          : await playerSignUp(derivedEmail, password, targetUsername);

      if (error) { setErr(error.message); return; }

      navigate({ to: "/characters" });
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "ENTRAR" : "CRIAR CONTA";

  return (
    <div className="min-h-screen bg-[#0d1b2a] font-pixel text-[#f4e9c1] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm border-4 border-[#f4e9c1] bg-[#1b2a3a] p-6"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
      >
        <h1 className="text-center text-xl text-[#ffd166] mb-1" style={{ textShadow: "2px 2px 0 #7a3e1d" }}>
          {title}
        </h1>
        <p className="text-center text-[10px] tracking-widest text-[#f4e9c1]/60 mb-5">
          Seu progresso será salvo na nuvem.
        </p>

        <label className="mb-1 block text-[10px] tracking-widest">USUÁRIO</label>
        <input
          autoFocus
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => { setUsername(e.target.value); setErr(null); }}
          className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
        />

        <label className="mb-1 block text-[10px] tracking-widest">SENHA</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErr(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
        />

        {err && <div className="mb-3 text-[10px] text-[#e94560]">{err}</div>}
        {ok && <div className="mb-3 text-[10px] text-[#7ee787]">{ok}</div>}

        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[11px] uppercase text-[#0d1b2a] disabled:opacity-60"
          style={{ boxShadow: "0 4px 0 #7a3e1d" }}
        >
          {busy ? "..." : mode === "signin" ? "▶ ENTRAR" : "+ CRIAR CONTA"}
        </button>

        <div className="mt-4 space-y-2">
          {mode !== "signin" && (
            <button onClick={() => { setMode("signin"); setErr(null); setOk(null); }}
              className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
              Já tem conta? Entrar
            </button>
          )}
          {mode !== "signup" && (
            <button onClick={() => { setMode("signup"); setErr(null); setOk(null); }}
              className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
              Criar conta
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-[10px] tracking-widest text-[#f4e9c1]/50 hover:text-[#f4e9c1]">
            ← Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
