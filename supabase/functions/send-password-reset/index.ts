// Custom password-reset flow that bypasses the Supabase Auth "Send Email" hook.
// Generates a recovery link with the admin API and sends it via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("Resend_API_Key")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Pixel Islands <contato@pixelislands.site>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://pixelislands.site";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function render(link: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#0d1b2a">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <h1 style="color:#0d1b2a;font-size:22px;margin:0 0 12px">Pixel Islands</h1>
    <p style="font-size:15px;line-height:1.5">Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#ffd166;color:#0d1b2a;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Redefinir senha</a>
    </p>
    <p style="font-size:12px;color:#666">Ou copie este link:<br/><a href="${link}">${link}</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
    <p style="font-size:11px;color:#999">Se você não solicitou, ignore este e-mail.</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: { redirectTo: redirectTo || `${SITE_URL}/reset-password` },
    });

    // Do not leak whether the email exists — always return ok.
    if (error || !data?.properties?.action_link) {
      console.warn("[send-password-reset] generateLink:", error?.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const link = data.properties.action_link;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email.trim().toLowerCase()],
        subject: "Redefinir sua senha — Pixel Islands",
        html: render(link),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[send-password-reset] resend error", res.status, body);
      return new Response(JSON.stringify({ error: body }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-password-reset] failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
