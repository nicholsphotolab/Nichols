// VideoProductsGrid.tsx
// The "Video & Audio Transfer" products section — the video counterpart to the
// film page's FilmStocksGrid. A header row with the title + ← / → paging arrows,
// and a row of product cards below it (one per format/size). Each card is 4 grid
// columns wide with a single gutter between them, so 4 cards fill the 16-column
// row on desktop. The arrows page the row one card at a time and grey out at
// each end. The card hover state reveals a 42px ↗ arrow and a 2px underline.
//
// Cards are flattened from both categories in videoTransferData. Tape/disc
// formats keep their plain name (VHS, MINI DV…); reel sizes render as
// "REEL 3 IN." etc. Each card links to its category's estimator — mirroring the
// film grid, where several cards can point at the same stock page.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "./videoTransferData";
import styles from "./VideoProductsGrid.module.css";

type Card = { title: string; priceLine: string; href: string };

const CARDS: Card[] = CATEGORIES.flatMap((c) =>
  c.options.map((o) => ({
    title:
      c.slug === "reels" ? `REEL ${o.name.replace(/IN$/i, "")} IN.` : o.name,
    priceLine: `Starting at $${o.price.toFixed(2)}`,
    href: `/video/${c.slug}`,
  }))
);

export default function VideoProductsGrid() {
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
    <section className={styles.wrapper} aria-label="Video & audio transfer">
      <div className={styles.header}>
        <h2 className={styles.heading}>VIDEO &amp; AUDIO TRANSFER</h2>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Previous formats"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="Next formats"
          >
            →
          </button>
        </div>
      </div>

      <div className={styles.track} ref={trackRef}>
        {CARDS.map((c) => (
          <Link key={c.title} href={c.href} className={styles.card}>
            <div className={styles.cardImage} aria-hidden="true">
              <div className={styles.cardImageFill} />
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.cardText}>
                <h3 className={styles.cardName}>{c.title}</h3>
                <p className={styles.cardPrice}>{c.priceLine}</p>
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
