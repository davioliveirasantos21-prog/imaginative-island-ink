// Supabase Auth "Send Email" hook — dispatches every auth email through Resend.
// Configure in Cloud → Users → Auth Settings → Send email hook:
//   URL: https://<project-ref>.functions.supabase.co/send-auth-email
//   Secret: value of SEND_EMAIL_HOOK_SECRET (v1,whsec_...)
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("Resend_API_Key")!;
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
// Sender must be from a domain verified in your Resend dashboard.
const FROM = Deno.env.get("AUTH_EMAIL_FROM") ?? "Pixel Islands <no-reply@pixelislands.site>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://pixelislands.site";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

interface HookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | "signup"
      | "recovery"
      | "invite"
      | "magiclink"
      | "email_change"
      | "reauthentication";
    site_url: string;
  };
}

function subjectFor(type: HookPayload["email_data"]["email_action_type"]): string {
  switch (type) {
    case "signup": return "Confirme seu e-mail — Pixel Islands";
    case "recovery": return "Redefinir sua senha — Pixel Islands";
    case "magiclink": return "Seu link de acesso — Pixel Islands";
    case "invite": return "Você foi convidado — Pixel Islands";
    case "email_change": return "Confirme o novo e-mail — Pixel Islands";
    case "reauthentication": return "Código de verificação — Pixel Islands";
  }
}

function render(payload: HookPayload): string {
  const { token, token_hash, redirect_to, email_action_type, site_url } = payload.email_data;
  const base = site_url || SITE_URL;
  const link = `${base}/auth/confirm?token_hash=${encodeURIComponent(token_hash)}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || base)}`;

  const cta =
    email_action_type === "recovery" ? "Redefinir senha" :
    email_action_type === "magiclink" ? "Entrar" :
    email_action_type === "reauthentication" ? "" :
    "Confirmar e-mail";

  const intro =
    email_action_type === "recovery"
      ? "Recebemos um pedido para redefinir sua senha."
      : email_action_type === "magiclink"
      ? "Use o link abaixo para entrar."
      : email_action_type === "reauthentication"
      ? `Seu código de verificação é <b>${token}</b>.`
      : "Bem-vindo ao Pixel Islands! Confirme seu e-mail para começar a jogar.";

  return `<!doctype html>
<html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#0d1b2a">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <h1 style="color:#0d1b2a;font-size:22px;margin:0 0 12px">Pixel Islands</h1>
    <p style="font-size:15px;line-height:1.5">${intro}</p>
    ${cta ? `<p style="margin:24px 0">
      <a href="${link}" style="background:#ffd166;color:#0d1b2a;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${cta}</a>
    </p>
    <p style="font-size:12px;color:#666">Ou copie este link: <br/><a href="${link}">${link}</a></p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
    <p style="font-size:11px;color:#999">Se você não solicitou, ignore este e-mail.</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const raw = await req.text();
    let payload: HookPayload;

    if (HOOK_SECRET) {
      const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", "").replace("v1,", ""));
      payload = wh.verify(raw, Object.fromEntries(req.headers)) as HookPayload;
    } else {
      payload = JSON.parse(raw) as HookPayload;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.user.email],
        subject: subjectFor(payload.email_data.email_action_type),
        html: render(payload),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[send-auth-email] resend error", res.status, body);
      return new Response(JSON.stringify({ error: body }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-auth-email] failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
