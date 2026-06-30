"use client";

// NavBar.tsx
// The fixed full-width background strip behind the global nav. It's frosted
// (faint tint + backdrop blur) at the top of the page and snaps to a solid
// paper-white bar once scrolled past a small threshold. The threshold toggle
// is driven by the same scroll pattern as HeroLogo (passive scroll listener +
// rAF throttle), reading the Lenis scroll position when available.

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Nav.module.css";

const THRESHOLD = 40; // px scrolled before the solid bar snaps in

export default function NavBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let scrolled = false;

    const update = () => {
      raf = 0;
      const y =
        (window as unknown as { __lenis?: { scroll?: number } }).__lenis
          ?.scroll ?? window.scrollY;
      const next = y > THRESHOLD;
      if (next !== scrolled) {
        scrolled = next;
        el.dataset.scrolled = next ? "true" : "false";
        // Expose globally so the links/CTA/brand (separate fixed elements, not
        // children of the bar) can recolor when the solid bar snaps in.
        document.documentElement.dataset.navScrolled = next ? "true" : "false";
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update(); // set initial state (handles reloads scrolled mid-page)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.bar}>
      {children}
    </div>
  );
}
