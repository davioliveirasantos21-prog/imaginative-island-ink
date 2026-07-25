import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PAYMENTS_ENABLED, PRODUCTS, type ProductSku } from "./payments-config";

const CheckoutInput = z.object({
  sku: z.enum(["supporter_pack", "cosmetic_bundle", "premium_monthly"]),
  successPath: z.string().startsWith("/").default("/game?purchase=success"),
  cancelPath: z.string().startsWith("/").default("/game?purchase=cancel"),
});

/**
 * Creates a Stripe Checkout Session and returns the URL to redirect to.
 * While PAYMENTS_ENABLED is false, this returns { disabled: true } so the UI
 * can show a "coming soon" state without ever touching Stripe.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => CheckoutInput.parse(raw))
  .handler(async ({ data }) => {
    if (!PAYMENTS_ENABLED) {
      return { disabled: true as const };
    }

    const product = PRODUCTS[data.sku as ProductSku];
    if (!product?.stripePriceId) {
      throw new Error(`Product ${data.sku} has no Stripe price configured.`);
    }

    const secret = process.env.API_Stripe;
    if (!secret) throw new Error("Stripe secret key (API_Stripe) not set.");

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" as never });

    const origin =
      process.env.PUBLIC_SITE_URL ??
      "https://pixelislandsultimate.lovable.app";

    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      success_url: `${origin}${data.successPath}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${data.cancelPath}`,
      metadata: { sku: product.sku },
    });

    return { disabled: false as const, url: session.url };
  });
