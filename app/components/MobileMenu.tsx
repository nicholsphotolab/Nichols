"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_ITEMS, ORDER_URL } from "../lib/site";
import styles from "./MobileMenu.module.css";

export default function MobileMenu({ activeHref }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);

  // Lock page scroll while the menu is open. Set on both roots: html for
  // desktop/modern browsers, body for older iOS Safari (which historically
  // ignored overflow on the root element for touch scrolling).
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <nav
        id="mobile-menu"
        className={styles.panel}
        data-open={open || undefined}
        aria-label="Mobile"
      >
        {NAV_ITEMS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.link} ${
              l.href === activeHref ? styles.active : ""
            }`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}

        <Link
          className={styles.cta}
          href={ORDER_URL}
          onClick={() => setOpen(false)}
        >
          order prints{" "}
          <span className={styles.ctaArrow} aria-hidden="true">↗</span>
        </Link>
      </nav>
    </>
  );
}
