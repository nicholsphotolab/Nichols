// FilmStocksGrid.tsx
// The three film stocks. Desktop: 3-column grid. Mobile: a single centered
// column that scrolls with the page (same treatment as the homepage
// services index) — no horizontal carousel.

import Link from "next/link";
import styles from "./FilmStocksGrid.module.css";

const STOCKS = [
  { name: "C‑41", startingAt: "Develop from $6.50", image: "/C-41.webp", href: "/film/c-41" },
  { name: "B&W",  startingAt: "Develop from $8.50", image: "/B%26W.webp",  href: "/film/bw"   },
  { name: "E‑6",  startingAt: "Develop from $8.50", image: "/E-6.webp",   href: "/film/e-6"  },
];

export default function FilmStocksGrid() {
  return (
    <section className={styles.wrapper} aria-label="Film stocks">
      <div className={styles.track}>
        {STOCKS.map((s, i) => (
          <Link key={i} href={s.href} className={`${styles.card} reveal-on-hover`}>
            <div className={styles.cardImage} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.image && <img src={s.image} alt="" />}
            </div>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardName}>{s.name}</h2>
              <p className={styles.cardPrice}>{s.startingAt}</p>
            </div>
            <span className={styles.cardCta}>
              Estimate cost
              <span className="reveal-arrow" aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
