import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Pixel Islands <no-reply@pixelislands.site>";

const EmailSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  redirectTo: z.string().url(),
});

async function sendViaResend(to: string, subject: string, html: string) {
  const key = process.env.Api_Resend;
  if (!key) throw new Error("Api_Resend not configured");
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend failed [${res.status}]: ${body}`);
    throw new Error(`Falha ao enviar e-mail (${res.status})`);
  }
}

function recoveryTemplate(link: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0d1b2a;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#f4e9c1">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1b2a;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#1b2a3a;border:4px solid #f4e9c1;padding:28px">
        <tr><td align="center" style="font-size:22px;font-weight:700;color:#ffd166;letter-spacing:2px;padding-bottom:8px">PIXEL ISLANDS</td></tr>
        <tr><td align="center" style="font-size:14px;color:#f4e9c1;padding-bottom:20px">Recuperação de senha</td></tr>
        <tr><td style="font-size:14px;line-height:1.5;color:#f4e9c1;padding-bottom:20px">
          Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova senha. O link expira em 1 hora.
        </td></tr>
        <tr><td align="center" style="padding-bottom:20px">
          <a href="${link}" style="display:inline-block;background:#ffd166;color:#0d1b2a;text-decoration:none;font-weight:700;padding:14px 24px;border:3px solid #7a3e1d">REDEFINIR SENHA</a>
        </td></tr>
        <tr><td style="font-size:12px;line-height:1.5;color:#f4e9c1;opacity:0.7;padding-bottom:8px">
          Ou copie e cole este link no navegador:
        </td></tr>
        <tr><td style="font-size:11px;word-break:break-all;color:#7ee787;padding-bottom:20px">${link}</td></tr>
        <tr><td style="font-size:11px;color:#f4e9c1;opacity:0.5;border-top:1px solid #f4e9c1;padding-top:12px">
          Se você não solicitou isso, pode ignorar este e-mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: data.redirectTo },
    });

    // Never leak whether the account exists.
    if (error || !linkData?.properties?.action_link) {
      console.warn("generateLink recovery:", error?.message ?? "no link");
      return { ok: true };
    }

    try {
      await sendViaResend(
        data.email,
        "Redefinir sua senha — Pixel Islands",
        recoveryTemplate(linkData.properties.action_link),
      );
    } catch (e) {
      console.error(e);
      // Still return ok to avoid account enumeration.
    }

    return { ok: true };
  });
