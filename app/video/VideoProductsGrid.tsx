// VideoProductsGrid.tsx
// The "Video & Audio Transfer" products section — the video counterpart to the
// film page's FilmStocksGrid. A header row with the title + ← / → paging arrows,
// and a row of product cards below it (one per format/size). Each card is 3 grid
// columns wide with a single gutter between them, so 4 cards fill the 12-column
// row on desktop. The arrows page the row one card at a time and grey out at
// each end. The card hover state reveals a 42px ↗ arrow and a 2px underline.
//
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import styles from "./VideoProductsGrid.module.css";

// Each card deep-links to its exact category + format combination: the path
// picks the estimator and ?format= preselects the FORMAT/SIZE pill (the
// configurator restores it on mount). Tapes & Discs and reel size 3IN are
// each category's configurator default, so those cards keep the clean path —
// matching the defaults-omitted URL convention. Prices are mirrored here from
// videoTransferData.ts (also used by the configurator); update both if a
// price changes. Paths are case-sensitive on deploy — they must match the
// filenames in public/VIDEO/ exactly. Formats without a shot yet use a null
// image, which falls back to the striped placeholder.
// Titles are written in mixed case for screen readers (all-caps text can be
// read letter by letter); the CSS uppercases them for display. Format names
// that really are letter sequences (VHS, VHS-C, Hi8, DVD) and the MiniDV
// product name stay literal.
const CARDS = [
  { title: "VHS", priceLine: "Starting at $18.00", image: "/VIDEO/VHS.webp", href: "/video/tapes-discs" },
  { title: "VHS-C", priceLine: "Starting at $18.00", image: "/VIDEO/VHS-C.webp", href: "/video/tapes-discs?format=vhs-c" },
  { title: "Hi8", priceLine: "Starting at $18.00", image: "/VIDEO/Hi8.webp", href: "/video/tapes-discs?format=hi8" },
  { title: "Mini DV", priceLine: "Starting at $18.00", image: "/VIDEO/MiniDV.webp", href: "/video/tapes-discs?format=mini-dv" },
  { title: "Cassette", priceLine: "Starting at $18.00", image: "/VIDEO/Cassette.webp", href: "/video/tapes-discs?format=cassette" },
  { title: "DVD", priceLine: "Starting at $18.00", image: "/VIDEO/DVD.webp", href: "/video/tapes-discs?format=dvd" },
  { title: "Reel 3 in.", priceLine: "Starting at $15.00", image: "/VIDEO/Reel-3in.webp", href: "/video/reels" },
  { title: "Reel 5 in.", priceLine: "Starting at $22.00", image: "/VIDEO/Reel-5in.webp", href: "/video/reels?format=5in" },
  { title: "Reel 7 in.", priceLine: "Starting at $30.00", image: "/VIDEO/Reel-7in.webp", href: "/video/reels?format=7in" },
  { title: "Reel 9 in.", priceLine: "Starting at $40.00", image: "/VIDEO/Reel-9in.webp", href: "/video/reels?format=9in" },
];

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
        <h2 className={styles.heading}>Video &amp; Audio Transfer</h2>
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
              {c.image ? (
                <Image
                  src={withBasePath(c.image)}
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
