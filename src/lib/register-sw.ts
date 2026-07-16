// Guarded service worker registration wrapper.
// Registers /sw.js only in production, real browser tab, on published domains.
// In dev / preview / iframe / ?sw=off: unregisters any matching SW.

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (isRefusedContext()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void unregisterMatching();
    }
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* ignore */
    });
  });
}
