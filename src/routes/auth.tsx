import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { playerSignIn, playerSignUp } from "@/lib/player-sync";
import { sendPasswordResetEmail } from "@/lib/auth-email.functions";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Pixel Islands" },
      { name: "description", content: "Entre ou crie sua conta para salvar seu progresso na nuvem." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/i;

function AuthPage() {
  const navigate = useNavigate();
  const sendReset = useServerFn(sendPasswordResetEmail);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setErr(null);
    setOk(null);
  }

  async function submit() {
    if (busy) return;
    reset();

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setErr("Digite um e-mail válido.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "forgot") {
        try {
          await sendReset({
            data: {
              email: cleanEmail,
              redirectTo: `${window.location.origin}/reset-password`,
            },
          });
        } catch (e) {
          console.error(e);
        }
        setOk("Se o e-mail existir, enviamos um link para redefinir a senha.");
        return;
      }


      if (password.length < 6) {
        setErr("Senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (mode === "signup") {
        const cleanUsername = username.trim();
        if (!USERNAME_RE.test(cleanUsername)) {
          setErr("Usuário deve ter 3-32 caracteres (letras, números, _.-).");
          return;
        }
        const { data, error } = await playerSignUp(cleanEmail, password, cleanUsername);
        if (error) {
          setErr(error.message);
          return;
        }
        if (!data?.session) {
          setOk("Conta criada! Confira seu e-mail para confirmar antes de entrar.");
          setMode("signin");
          setPassword("");
          return;
        }
        navigate({ to: "/characters" });
        return;
      }

      const { data, error } = await playerSignIn(cleanEmail, password);
      if (error) {
        setErr(error.message);
        return;
      }
      if (!data?.session) {
        setErr("Confirme seu e-mail antes de entrar.");
        return;
      }
      navigate({ to: "/characters" });
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin" ? "ENTRAR" : mode === "signup" ? "CRIAR CONTA" : "RECUPERAR SENHA";
  const cta =
    mode === "signin" ? "▶ ENTRAR" : mode === "signup" ? "+ CRIAR CONTA" : "✉ ENVIAR LINK";

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
          {mode === "forgot"
            ? "Enviaremos um link para seu e-mail."
            : "Seu progresso será salvo na nuvem."}
        </p>

        <label className="mb-1 block text-[10px] tracking-widest">E-MAIL</label>
        <input
          autoFocus
          type="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => { setEmail(e.target.value); reset(); }}
          className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
        />

        {mode === "signup" && (
          <>
            <label className="mb-1 block text-[10px] tracking-widest">USUÁRIO</label>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => { setUsername(e.target.value); reset(); }}
              className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
          </>
        )}

        {mode !== "forgot" && (
          <>
            <label className="mb-1 block text-[10px] tracking-widest">SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); reset(); }}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
              className="mb-3 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
          </>
        )}

        {err && <div className="mb-3 text-[10px] text-[#e94560]">{err}</div>}
        {ok && <div className="mb-3 text-[10px] text-[#7ee787]">{ok}</div>}

        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[11px] uppercase text-[#0d1b2a] disabled:opacity-60"
          style={{ boxShadow: "0 4px 0 #7a3e1d" }}
        >
          {busy ? "..." : cta}
        </button>

        <div className="mt-4 space-y-2">
          {mode === "signin" && (
            <>
              <button onClick={() => { setMode("forgot"); reset(); }}
                className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
                Esqueci minha senha
              </button>
              <button onClick={() => { setMode("signup"); reset(); }}
                className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
                Criar conta
              </button>
            </>
          )}
          {mode === "signup" && (
            <button onClick={() => { setMode("signin"); reset(); }}
              className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
              Já tem conta? Entrar
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => { setMode("signin"); reset(); }}
              className="w-full text-[10px] tracking-widest text-[#f4e9c1]/70 hover:text-[#ffd166]">
              ← Voltar para entrar
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
