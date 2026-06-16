// FilmStocksGrid.tsx
// The "Film Development" products section (Figma node 1760:710): a heading and
// three cards (C-41, B&W, E-6). Each canister floats on the paper-white page;
// a 2px underline reveals on hover/focus. Cards link to the stock detail pages.

import Link from "next/link";
import Image from "next/image";
import styles from "./FilmStocksGrid.module.css";

const STOCKS = [
  { name: "C‑41", priceLine: "Starting at $6.50", image: "/C41_Cutout.webp", href: "/film/c-41" },
  { name: "B&W", priceLine: "Starting at $8.50", image: "/B%26W_Cutout.webp", href: "/film/bw" },
  { name: "E‑6", priceLine: "Starting at $8.50", image: "/E-6_Cutout.webp", href: "/film/e-6" },
];

export default function FilmStocksGrid() {
  return (
    <section className={styles.wrapper} aria-label="Film development">
      <h2 className={styles.heading}>FILM DEVELOPMENT</h2>
      <div className={styles.track}>
        {STOCKS.map((s) => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <div className={styles.cardImage} aria-hidden="true">
              <div className={styles.cardImgInner}>
                <Image
                  src={s.image}
                  alt=""
                  fill
                  className={styles.cardImg}
                  sizes="(max-width: 700px) 70vw, 25vw"
                />
              </div>
            </div>
            <div className={styles.cardMeta}>
              <h3 className={styles.cardName}>{s.name}</h3>
              <p className={styles.cardPrice}>{s.priceLine}</p>
            </div>
            <span className={styles.cardRule} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
