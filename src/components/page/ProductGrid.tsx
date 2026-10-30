// ProductGrid.tsx
// The product-card row on the film and video pages (Figma node 1960:880). A
// header row with the title and ← / → paging arrows (top-right), and a row of
// cards below it. Each card is 3 grid columns wide with a single gutter between
// them, so 4 cards fill the 12-column row on desktop. The arrows page the row
// one card at a time and grey out (disabled) at each end. No free scroll — the
// arrows drive a programmatic scroll.
//
// Mobile (≤700px, Figma node 2370:2315): no carousel — the arrows are hidden
// and all cards flow in a two-column vertical grid.

import { useEffect, useRef, useState } from "react";
import Image from "@/components/Image";
import Link from "@/components/SmartLink";
import { withBasePath } from "@/lib/basePath";
import styles from "./ProductGrid.module.css";

export type ProductCard = {
  /** Bracketed eyebrow above the photo — the process (C‑41) or category. */
  tag: string;
  /**
   * Format name under the photo. Written in mixed case for screen readers
   * (all-caps text can be read letter by letter); the CSS uppercases it.
   */
  title: string;
  priceLine: string;
  /** Path relative to /public, or null for the solid placeholder tile. */
  image: string | null;
  /** Deep link to the configurator, with ?format= preselecting the pill. */
  href: string;
  /** Film stock or video category slug — groups cards for the cross-sell. */
  family: string;
};

export default function ProductGrid({
  id,
  heading,
  label,
  itemsLabel,
  cards,
}: {
  /** Anchor for in-page links, e.g. the film hero's LEARN MORE. */
  id?: string;
  heading: string;
  /** Accessible name for the section. */
  label: string;
  /** What the arrows page through, for their labels — "film stocks". */
  itemsLabel: string;
  cards: ProductCard[];
}) {
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
    <section id={id} className={styles.wrapper} aria-label={label}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{heading}</h2>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label={`Previous ${itemsLabel}`}
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label={`Next ${itemsLabel}`}
          >
            →
          </button>
        </div>
      </div>

      <div className={styles.track} ref={trackRef}>
        {cards.map((c) => (
          <Link key={`${c.tag} ${c.title}`} href={c.href} className={styles.card}>
            <span className={styles.cardTag}>[{c.tag}]</span>
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
            <div className={styles.cardText}>
              <h3 className={styles.cardFormat}>{c.title}</h3>
              <p className={styles.cardPrice}>{c.priceLine}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
