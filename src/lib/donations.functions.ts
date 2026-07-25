import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DonationInput = z.object({
  /** Amount in BRL cents (min R$5, max R$5.000). */
  amountBrlCents: z.number().int().min(500).max(500_000),
  method: z.enum(["card", "pix", "both"]).default("both"),
  successPath: z.string().startsWith("/").default("/apoio?doacao=ok"),
  cancelPath: z.string().startsWith("/").default("/apoio?doacao=cancel"),
  donorName: z.string().max(120).optional(),
  message: z.string().max(500).optional(),
});

/**
 * Cria uma sessão de Checkout do Stripe para uma doação avulsa em BRL.
 * Aceita Cartão e Pix (requer conta Stripe brasileira, o que é o caso
 * — a conta está no CNPJ do usuário).
 *
 * Não depende de Prices pré-criadas: o preço é montado inline via price_data.
 */
export const createDonationSession = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => DonationInput.parse(raw))
  .handler(async ({ data }) => {
    const secret = process.env.API_Stripe;
    if (!secret) {
      throw new Error("Stripe não está configurado (API_Stripe ausente).");
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" as never });

    const origin =
      process.env.PUBLIC_SITE_URL ?? "https://pixelislandsultimate.lovable.app";

    const methods: ("card" | "pix")[] =
      data.method === "card" ? ["card"] : data.method === "pix" ? ["pix"] : ["card", "pix"];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: methods,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: data.amountBrlCents,
            product_data: {
              name: "Doação · Pixel Islands",
              description:
                "Contribuição voluntária para o desenvolvimento do jogo Pixel Islands.",
            },
          },
        },
      ],
      success_url: `${origin}${data.successPath}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${data.cancelPath}`,
      metadata: {
        kind: "donation",
        donor_name: data.donorName ?? "",
        message: data.message ?? "",
      },
      // Pix expira rápido; dá 30 min pro apoiador pagar.
      payment_method_options: methods.includes("pix")
        ? { pix: { expires_after_seconds: 1800 } }
        : undefined,
    });

    return { url: session.url };
  });
