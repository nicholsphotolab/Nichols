// VideoCategoriesGrid.tsx
// The two video-transfer categories (Tapes & Discs, Film Reels) as cards —
// same treatment as the film stocks grid on /film. Desktop: 2 cards filling
// the 16-col grid. Mobile: a single centered column that scrolls with the
// page, matching the film grid's mobile behaviour.

import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "./videoTransferData";
import styles from "./VideoCategoriesGrid.module.css";

export default function VideoCategoriesGrid() {
  return (
    <section className={styles.wrapper} aria-label="Transfer categories">
      <div className={styles.track}>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/video/${c.slug}`}
            className={`${styles.card} reveal-on-hover`}
          >
            <div className={styles.cardImage} aria-hidden="true">
              {c.image && (
                <Image src={c.image} alt="" fill sizes="(max-width: 700px) 90vw, 50vw" />
              )}
            </div>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardName}>{c.name}</h2>
              <p className={styles.cardPrice}>{c.priceLine}</p>
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
