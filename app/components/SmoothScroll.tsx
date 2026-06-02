"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    // Expose for components that want to scrollTo programmatically.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);
  return null;
}
