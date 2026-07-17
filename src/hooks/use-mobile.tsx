import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Detects a touch-first device.
 * Uses `(pointer: coarse)` so a narrow desktop window (e.g. the Lovable
 * side panel at 380px wide) doesn't get misclassified as mobile just
 * because of width. Falls back to width when the pointer query isn't
 * supported.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const compute = () => coarse.matches && narrow.matches;
    const onChange = () => setIsMobile(compute());
    coarse.addEventListener("change", onChange);
    narrow.addEventListener("change", onChange);
    setIsMobile(compute());
    return () => {
      coarse.removeEventListener("change", onChange);
      narrow.removeEventListener("change", onChange);
    };
  }, []);

  return !!isMobile;
}
