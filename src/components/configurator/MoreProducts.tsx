// MoreProducts.tsx
// The "More at the lab" strip under each configurator. Same card as the
// ProductGrid rows on /film and /video — product shot, title, price line,
// hover ↗ and underline — but a fixed four-up grid rather than an arrow-paged
// scroller, since the picker only ever surfaces four.
//
// Which four is decided by pickMoreProducts (moreProductsData.ts): the strip is
// a cross-sell, so it leads with a service the visitor isn't already looking at.
// The picker is pure, so this renders identically on the server and on
// hydration even though the configurators mount it as a client component and
// re-pick when the TYPE row switches family.

import Link from "@/components/SmartLink";
import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import { pickMoreProducts } from "./moreProductsData";
import styles from "./MoreProducts.module.css";

export default function MoreProducts({
  family,
  heading = "More at the lab",
}: {
  /** The film stock slug or video category slug being configured — excluded
      from the row, and the seed for which products it surfaces. */
  family: string;
  heading?: string;
}) {
  const products = pickMoreProducts(family);
  if (products.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="more-at-the-lab">
      <h2 className={styles.heading} id="more-at-the-lab">
        {heading}
      </h2>

      <div className={styles.grid}>
        {products.map((p) => (
          <Link key={p.href + p.title} href={p.href} className={styles.card}>
            <div className={styles.cardImage} aria-hidden="true">
              {p.image ? (
                <Image
                  src={withBasePath(p.image)}
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
                      long title wraps at it instead of overflowing the card;
                      mobile hides it and stacks the parts. */}
                  {p.title.split(" - ").map((part, i) => (
                    <span key={part}>
                      {i > 0 && <span className={styles.cardNameSep}> - </span>}
                      <span className={styles.cardNamePart}>{part}</span>
                    </span>
                  ))}
                </h3>
                <p className={styles.cardPrice}>{p.priceLine}</p>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">
                ↗
              </span>
            </div>
            <span className={styles.cardRule} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
