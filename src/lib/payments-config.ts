/**
 * Central config for the (future) monetization flow.
 *
 * Right now PAYMENTS_ENABLED is `false` — the checkout server function
 * short-circuits with a friendly error and nothing is ever charged.
 * When you're ready to go live:
 *   1. Fill in real Stripe Price IDs below (created in the Stripe Dashboard).
 *   2. Flip PAYMENTS_ENABLED to `true`.
 *   3. Configure the webhook endpoint in Stripe pointing to
 *      /api/public/stripe-webhook and store the signing secret as
 *      STRIPE_WEBHOOK_SECRET.
 */

export const PAYMENTS_ENABLED = false;

/** Catalog of purchasable things. Keys are stable internal SKUs. */
export type ProductSku = "supporter_pack" | "cosmetic_bundle" | "premium_monthly";

export type ProductDef = {
  sku: ProductSku;
  /** Stripe Price ID (price_...). Fill in when going live. */
  stripePriceId: string;
  /** "payment" for one-time, "subscription" for recurring. */
  mode: "payment" | "subscription";
  /** Human label (used in UI/receipts if needed). */
  label: string;
  /** Display price for the UI while payments are disabled. */
  displayPrice: string;
};

export const PRODUCTS: Record<ProductSku, ProductDef> = {
  supporter_pack: {
    sku: "supporter_pack",
    stripePriceId: "",
    mode: "payment",
    label: "Supporter Pack",
    displayPrice: "R$ 19,90",
  },
  cosmetic_bundle: {
    sku: "cosmetic_bundle",
    stripePriceId: "",
    mode: "payment",
    label: "Cosmetic Bundle",
    displayPrice: "R$ 29,90",
  },
  premium_monthly: {
    sku: "premium_monthly",
    stripePriceId: "",
    mode: "subscription",
    label: "Premium (Monthly)",
    displayPrice: "R$ 9,90/mês",
  },
};
