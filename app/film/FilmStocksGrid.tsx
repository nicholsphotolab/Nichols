// FilmStocksGrid.tsx
// The "Film Development & Scans" products section (Figma node 1960:880). A
// header row with the title and ← / → paging arrows (top-right), and a row of
// product cards below it. Each card is 4 grid columns wide with a single gutter
// between them, so 4 cards fill the 16-column row on desktop. The arrows page
// the row one card at a time and grey out (disabled) at each end. No free
// scroll — the arrows drive a programmatic scroll, so it never fights Lenis.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import styles from "./FilmStocksGrid.module.css";

const STOCKS = [
  { title: "C‑41 • 35MM", priceLine: "Starting at $6.50", image: "/C-41_35mm.webp", href: "/film/c-41" },
  { title: "B&W • 35MM", priceLine: "Starting at $8.50", image: "/B%26W_35mm.webp", href: "/film/bw" },
  { title: "E‑6 • 35MM", priceLine: "Starting at $8.50", image: "/E-6_35mm.webp", href: "/film/e-6" },
  { title: "C‑41 • 120", priceLine: "Starting at $6.50", image: "/C-41-120.webp", href: "/film/c-41" },
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
        <h2 className={styles.heading}>FILM DEVELOPMENT &amp; SCANS</h2>
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
              <Image
                src={withBasePath(s.image)}
                alt=""
                fill
                className={styles.cardImg}
                sizes="(max-width: 700px) 90vw, (max-width: 900px) 45vw, 25vw"
              />
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.cardText}>
                <h3 className={styles.cardName}>{s.title}</h3>
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
