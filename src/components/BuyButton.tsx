import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createCheckoutSession } from "@/lib/payments.functions";
import { PAYMENTS_ENABLED, PRODUCTS, type ProductSku } from "@/lib/payments-config";

/**
 * Drop-in button that kicks off Stripe Checkout for a given SKU.
 * While PAYMENTS_ENABLED is false it renders as a disabled "Em breve" button
 * and never touches the network.
 */
export function BuyButton({
  sku,
  className,
  children,
}: {
  sku: ProductSku;
  className?: string;
  children?: React.ReactNode;
}) {
  const checkout = useServerFn(createCheckoutSession);
  const [busy, setBusy] = useState(false);
  const product = PRODUCTS[sku];

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await checkout({ data: { sku } });
      if (res.disabled) {
        alert("Pagamentos ainda não estão ativos. Em breve!");
        return;
      }
      if (res.url) window.location.href = res.url;
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const disabled = !PAYMENTS_ENABLED || busy;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        className ??
        "border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-2 font-pixel text-xs uppercase text-[#0d1b2a] disabled:opacity-50"
      }
    >
      {children ?? (PAYMENTS_ENABLED ? `Comprar · ${product.displayPrice}` : "Em breve")}
    </button>
  );
}
