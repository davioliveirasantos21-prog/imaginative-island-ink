import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ViewSchema = z.object({
  path: z.string().trim().min(1).max(200),
  referrer: z.string().trim().max(500).optional().default(""),
  userAgent: z.string().trim().max(500).optional().default(""),
});

export const logPageView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ViewSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("page_events").insert({
      path: data.path,
      kind: "view",
      referrer: data.referrer || null,
      user_agent: data.userAgent || null,
    });
    return { ok: true as const };
  });

const ErrSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  stack: z.string().trim().max(8000).optional().default(""),
  path: z.string().trim().max(200).optional().default(""),
  userAgent: z.string().trim().max(500).optional().default(""),
});

export const logClientError = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ErrSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("error_logs").insert({
      message: data.message,
      stack: data.stack || null,
      path: data.path || null,
      user_agent: data.userAgent || null,
    });
    return { ok: true as const };
  });
