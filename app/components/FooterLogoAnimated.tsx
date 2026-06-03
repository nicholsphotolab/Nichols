"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NicholsLogoSvg from "./NicholsLogoSvg";
import styles from "./Footer.module.css";

export default function FooterLogoAnimated() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setVisible(false);
    const el = wrapperRef.current;
    if (!el) return;

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
    <div ref={wrapperRef} className={styles.logoRevealWrap} data-visible={visible ? "true" : undefined}>
      <Link href="/" className={styles.logo} aria-label="Nichols Photo Lab — home">
        <NicholsLogoSvg className={styles.logoSvg} />
      </Link>
    </div>
  );
}
