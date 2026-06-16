// GridOverlay.tsx
// Toggleable debug overlay that draws the site column grid over the page —
// 16 columns desktop, 8 tablet, 4 mobile, sharing the exact tokens layouts
// use (--grid-cols, --grid-gap, --page-pad) so it always reflects reality.
// Press G to toggle; the state persists in localStorage across reloads.
// Mounted once in app/layout.tsx. Renders nothing until toggled on.

"use client";

import { useEffect, useState } from "react";
import styles from "./GridOverlay.module.css";

const STORAGE_KEY = "grid-overlay-visible";

export default function GridOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Restore persisted state (runs client-side only, after hydration).
    setVisible(localStorage.getItem(STORAGE_KEY) === "1");

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "g") return;
      // Leave browser/system shortcuts alone.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Ignore while typing in form fields or editable content.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }

      setVisible((v) => {
        const next = !v;
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        return next;
      });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {/* 16 tiles cover the widest grid; the extras are hidden per
          breakpoint in the CSS so they don't wrap to a second row. */}
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
