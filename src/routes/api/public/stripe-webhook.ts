import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook endpoint. Public path (bypasses auth) but we verify the
 * signature before doing anything. Currently a stub that just logs events —
 * wire up entitlement grants (DB writes) once monetization goes live.
 *
 * Stripe Dashboard → Developers → Webhooks → add endpoint:
 *   https://<your-domain>/api/public/stripe-webhook
 * Copy the signing secret into the STRIPE_WEBHOOK_SECRET secret.
 */
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const body = await request.text();

        const secret = process.env.API_Stripe;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !webhookSecret) {
          return new Response("Stripe not configured", { status: 503 });
        }
        if (!sig) return new Response("Missing signature", { status: 400 });

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" as never });

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
        } catch (err) {
          return new Response(
            `Signature verification failed: ${(err as Error).message}`,
            { status: 400 },
          );
        }

        // TODO: when going live, grant entitlements here.
        switch (event.type) {
          case "checkout.session.completed":
          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
          case "invoice.paid":
          case "invoice.payment_failed":
            console.log(`[stripe-webhook] ${event.type}`, event.id);
            break;
          default:
            console.log(`[stripe-webhook] unhandled ${event.type}`);
        }

        return Response.json({ received: true });
      },
    },
  },
});
