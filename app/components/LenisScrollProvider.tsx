// LenisScrollProvider.tsx
// Initialises Lenis smooth scrolling for the entire site. Renders nothing —
// purely a side-effect component mounted once in the root layout.
// Exposes the Lenis instance on window.__lenis so other components can call
// scrollTo() programmatically (e.g. anchor links, scroll-to-top buttons).

"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function LenisScrollProvider() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });

    // Attach to window so any component can call window.__lenis.scrollTo(...)
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}
