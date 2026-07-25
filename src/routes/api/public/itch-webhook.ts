import { createFileRoute } from "@tanstack/react-router";

// Endpoint público de callback/webhook para o itch.io.
// Aceita GET (verificação) e POST (eventos). Se você configurar um
// segredo compartilhado no itch.io, defina ITCH_WEBHOOK_SECRET nos secrets
// e o itch.io deve enviá-lo no header `x-itch-secret` (ou como ?secret=).
export const Route = createFileRoute("/api/public/itch-webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const challenge = url.searchParams.get("challenge");
        if (challenge) return new Response(challenge, { status: 200 });
        return Response.json({ ok: true, service: "pixel-islands", endpoint: "itch-webhook" });
      },
      POST: async ({ request }) => {
        const expected = process.env.ITCH_WEBHOOK_SECRET;
        if (expected) {
          const url = new URL(request.url);
          const provided = request.headers.get("x-itch-secret") ?? url.searchParams.get("secret");
          if (provided !== expected) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        let payload: unknown = null;
        try {
          const raw = await request.text();
          payload = raw ? JSON.parse(raw) : null;
        } catch {
          payload = null;
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("page_events").insert({
            path: "/api/public/itch-webhook",
            user_agent: request.headers.get("user-agent") ?? "itch.io",
            referrer: JSON.stringify(payload ?? {}).slice(0, 2000),
          });
        } catch (e) {
          console.error("itch webhook log failed", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
