// PageHero.tsx
// The full-bleed photo hero shared by the film, video, passport and FAQ pages:
// a background under a dark scrim, the page's wordmark and description pinned
// bottom-left on the site column grid, and an optional caption bottom-right.
// See PageHero.module.css for the layout and stacking rules.
//
// The background is either a single still (`image`) or whatever the page
// passes as `background` — the film and video pages hand in a HeroSlides
// slideshow.

import type { CSSProperties, ReactNode } from "react";
import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import styles from "./PageHero.module.css";

export default function PageHero({
  label,
  title,
  titleBearing,
  description,
  descriptionSpan,
  meta,
  image,
  background,
  scrim,
  mobile,
}: {
  /** Accessible name for the hero section. */
  label: string;
  title: string;
  /**
   * The wordmark's first glyph's left side bearing in em (ABC Areal Bold,
   * measured from the font file) — pulled back so the ink, not the glyph box,
   * sits on the column-1 line. F and P: 0.078, Q: 0.04, V: 0.004.
   */
  titleBearing: number;
  description: ReactNode;
  /** Grid columns the description spans. Default 7; widen for longer copy. */
  descriptionSpan?: number;
  /** Bottom-right caption. */
  meta?: ReactNode;
  /** A single still photo, path relative to /public. */
  image?: string;
  /** Anything else to sit under the scrim — e.g. a HeroSlides slideshow. */
  background?: ReactNode;
  /** "strong" darkens the scrim for footage that runs dark and busy. */
  scrim?: "strong";
  /** "stacked" opts into the retuned phone layout (see the stylesheet). */
  mobile?: "stacked";
}) {
  return (
    <section
      className={styles.hero}
      aria-label={label}
      data-scrim={scrim}
      data-mobile={mobile}
      style={
        {
          "--title-bearing": `${titleBearing}em`,
          "--description-span": descriptionSpan,
        } as CSSProperties
      }
    >
      {image && (
        <Image
          className={styles.image}
          src={withBasePath(image)}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      )}
      {background}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
    </section>
  );
}
