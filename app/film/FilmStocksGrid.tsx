// FilmStocksGrid.tsx
// The "Film Development & Scans" products section (Figma node 1960:880). A
// header row with the title and ← / → paging arrows (top-right), and a row of
// product cards below it. Each card is 3 grid columns wide with a single gutter
// between them, so 4 cards fill the 12-column row on desktop. The arrows page
// the row one card at a time and grey out (disabled) at each end. No free
// scroll — the arrows drive a programmatic scroll.
//
// Mobile (≤700px, Figma node 2370:2315): no carousel — the arrows are hidden
// and all cards flow in a two-column vertical grid. Card titles stack their
// process/format parts on two lines there ("C-41" / "35mm"), which is why the
// title is rendered in parts with the " - " as a separate hideable span.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import styles from "./FilmStocksGrid.module.css";

// Each card deep-links to its exact stock + format combination: the path
// picks the stock and ?format= preselects the FORMAT pill (the configurator
// restores it on mount). 35MM is the configurator default, so those cards
// keep the clean path — matching the defaults-omitted URL convention.
// Titles are written in mixed case for screen readers (all-caps text can be
// read letter by letter); the CSS uppercases them for display. Product codes
// that really are letter sequences (C‑41, B&W, E‑6) stay literal.
const STOCKS = [
  { title: "C‑41 - 35mm", priceLine: "Starting at $6.50", image: "/C-41_35mm.webp", href: "/film/c-41" },
  { title: "B&W - 35mm", priceLine: "Starting at $8.50", image: "/B%26W_35mm.webp", href: "/film/bw" },
  { title: "E‑6 - 35mm", priceLine: "Starting at $8.50", image: "/E-6_35mm.webp", href: "/film/e-6" },
  { title: "C‑41 - Disposable", priceLine: "Starting at $6.50", image: "/C-41_Disposable.webp", href: "/film/c-41?format=disposable-camera" },
  { title: "B&W - Disposable", priceLine: "Starting at $8.50", image: "/B&W_Disposable.webp", href: "/film/bw?format=disposable-camera" },
  { title: "C‑41 - 120", priceLine: "Starting at $6.50", image: "/C-41_120.webp", href: "/film/c-41?format=120" },
  { title: "B&W - 120", priceLine: "Starting at $8.50", image: null, href: "/film/bw?format=120" },
  { title: "E‑6 - 120", priceLine: "Starting at $8.50", image: "/E-6_120.webp", href: "/film/e-6?format=120" },
  { title: "B&W - Sheet 4x5", priceLine: "Starting at $8.50", image: "/B%26W_Sheet_4x5.webp", href: "/film/e-6?format=120" },
];

export default function FilmStocksGrid() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft >= max - 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Page by one card (the stride = distance between the first two cards).
  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const kids = el.children;
    const stride =
      kids.length > 1
        ? (kids[1] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
        : el.clientWidth;
    el.scrollBy({ left: dir * stride, behavior: "smooth" });
  };

  return (
    <section className={styles.wrapper} aria-label="Film development & scans">
      <div className={styles.header}>
        <h2 className={styles.heading}>Film Development &amp; Scans</h2>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Previous film stocks"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="Next film stocks"
          >
            →
          </button>
        </div>
      </div>

      <div className={styles.track} ref={trackRef}>
        {STOCKS.map((s) => (
          <Link key={s.title} href={s.href} className={styles.card}>
            <div className={styles.cardImage} aria-hidden="true">
              {s.image ? (
                <Image
                  src={withBasePath(s.image)}
                  alt=""
                  fill
                  className={styles.cardImg}
                  sizes="(max-width: 900px) 45vw, 25vw"
                />
              ) : (
                <div className={styles.cardImageFill} />
              )}
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.cardText}>
                <h3 className={styles.cardName}>
                  {/* Separator sits between (not inside) the nowrap parts so a
                      long title can wrap at it instead of overflowing the card;
                      mobile hides it and stacks the parts. */}
                  {s.title.split(" - ").map((part, i) => (
                    <span key={part}>
                      {i > 0 && <span className={styles.cardNameSep}> - </span>}
                      <span className={styles.cardNamePart}>{part}</span>
                    </span>
                  ))}
                </h3>
                <p className={styles.cardPrice}>{s.priceLine}</p>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">↗</span>
            </div>
            <span className={styles.cardRule} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
