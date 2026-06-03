// FooterLogoScrollReveal.tsx
// The full-width Nichols logo at the top of the footer.
// Animates from below (translateY 100% → 0) the first time the footer enters
// the viewport on each page visit. Resets on client-side navigation because
// the footer stays mounted in the root layout — usePathname() triggers a fresh
// IntersectionObserver every time the route changes.

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NicholsLogoSvg from "./NicholsLogoSvg";
import styles from "./Footer.module.css";

export default function FooterLogoScrollReveal() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Controls the data-visible attribute that triggers the CSS slide-up transition.
  const [visible, setVisible] = useState(false);
  // Re-run the effect on every route change so the animation replays per page.
  const pathname = usePathname();

  useEffect(() => {
    // Reset to hidden at the start of each page so the animation can replay.
    setVisible(false);
    const el = wrapperRef.current;
    if (!el) return;

    // Fire once when 10% of the wrapper enters the viewport, then stop watching.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    // overflow: hidden on the wrapper clips the logo while it slides up.
    // data-visible="true" is the CSS hook that triggers the transition.
    <div
      ref={wrapperRef}
      className={styles.logoRevealWrap}
      data-visible={visible ? "true" : undefined}
    >
      <Link href="/" className={styles.logo} aria-label="Nichols Photo Lab — home">
        <NicholsLogoSvg className={styles.logoSvg} />
      </Link>
    </div>
  );
}
