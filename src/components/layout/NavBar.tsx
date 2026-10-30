
// NavBar.tsx
// The fixed full-width background strip behind the global nav. It carries a
// soft dark scrim at the top of the page (so the paper-white links hold over a
// hero) and snaps to a solid paper-white bar once scrolled past a small
// threshold. The threshold toggle is driven by the same scroll pattern as
// HeroLogo (passive scroll listener + rAF throttle). Pages without a dark hero
// (e.g. the configurators) pass `solid` to skip the scrim entirely and pin the
// solid bar from the top.

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Nav.module.css";

const THRESHOLD = 40; // px scrolled before the solid bar snaps in

export default function NavBar({
  children,
  solid = false,
  solidAfter,
}: {
  children: ReactNode;
  solid?: boolean;
  /** Scroll distance before the solid bar snaps in, when a page wants it
   *  later than the default (the home page waits until its photo is past). */
  solidAfter?: () => number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Read on every scroll frame without re-subscribing the listener.
  const solidAfterRef = useRef(solidAfter);
  solidAfterRef.current = solidAfter;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Forced-solid pages: set the scrolled state once and skip the listener.
    if (solid) {
      el.dataset.scrolled = "true";
      document.documentElement.dataset.navScrolled = "true";
      return;
    }

    let raf = 0;
    // Starts null ("unknown") so the initial update() always writes the real
    // state. Starting at false would skip the first write when the page loads
    // unscrolled — leaving a stale data-nav-scrolled="true" on <html> after
    // navigating here from a solid-nav page (black text over the dark hero).
    let scrolled: boolean | null = null;

    const update = () => {
      raf = 0;
      const next = window.scrollY > (solidAfterRef.current?.() ?? THRESHOLD);
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
  }, [solid]);

  return (
    <div ref={ref} className={styles.bar} data-nav-chrome>
      {children}
    </div>
  );
}
