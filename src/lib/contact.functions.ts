import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  subject: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(4).max(4000),
  lang: z.string().trim().max(8).optional().default(""),
});

function template(name: string, email: string, subject: string, message: string, lang: string) {
  const safeMsg = message.replace(/</g, "&lt;").replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0d1b2a;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#f4e9c1">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1b2a;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#1b2a3a;border:4px solid #f4e9c1;padding:28px">
        <tr><td style="font-size:22px;font-weight:700;color:#ffd166;letter-spacing:2px;padding-bottom:8px">PIXEL ISLANDS · SUPORTE</td></tr>
        <tr><td style="font-size:14px;padding-bottom:16px">Nova mensagem do formulário de contato.</td></tr>
        <tr><td style="font-size:13px;padding:6px 0"><b>Nome:</b> ${name}</td></tr>
        <tr><td style="font-size:13px;padding:6px 0"><b>E-mail:</b> ${email}</td></tr>
        <tr><td style="font-size:13px;padding:6px 0"><b>Assunto:</b> ${subject || "-"}</td></tr>
        <tr><td style="font-size:13px;padding:6px 0"><b>Idioma:</b> ${lang || "-"}</td></tr>
        <tr><td style="font-size:13px;padding-top:12px;border-top:1px solid #f4e9c1;color:#f4e9c1">${safeMsg}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ContactSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
      lang: data.lang || null,
    });

    const key = process.env.Api_Resend;
    const to = process.env.CONTACT_EMAIL_TO || "contact@pixelislands.site";
    if (key) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            from: "Pixel Islands <no-reply@pixelislands.site>",
            to: [to],
            reply_to: data.email,
            subject: `[Contato] ${data.subject || data.name}`,
            html: template(data.name, data.email, data.subject, data.message, data.lang),
          }),
        });
      } catch (e) {
        console.error("Resend contact send failed", e);
      }
    }

    return { ok: true as const };
  });
