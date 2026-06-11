// VideoServicesCarousel.tsx
// Horizontal scroll-carousel of video/audio transfer formats. Renders every
// entry in FORMATS as a card; arrows page the track left/right and disable at
// each end. Works the same on desktop and mobile — only the number of visible
// cards changes (via CSS card width).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FORMATS } from "./videoFormatsData";
import styles from "./VideoServicesCarousel.module.css";

export default function VideoServicesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const page = useCallback((dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    // Scroll by ~80% of the visible width so a card stays partly in view.
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  return (
    <section className={styles.wrapper} aria-label="Video services">
      <button
        className={styles.arrow}
        data-dir="prev"
        data-hidden={atStart || undefined}
        aria-hidden={atStart}
        aria-label="Previous formats"
        onClick={() => page(-1)}
      >
        ←
      </button>

      <div ref={trackRef} className={styles.track} onScroll={updateEdges}>
        {FORMATS.map((f) => (
          <Link
            key={f.slug}
            href={`/video/${f.slug}`}
            className={`${styles.card} reveal-on-hover`}
          >
            <div className={styles.cardImage} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.image && <img src={f.image} alt="" />}
            </div>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardName}>{f.name}</h2>
              <p className={styles.cardPrice}>{f.startingAt}</p>
            </div>
            <span className={styles.cardCta}>
              Estimate cost
              <span className="reveal-arrow" aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>

      <button
        className={styles.arrow}
        data-dir="next"
        data-hidden={atEnd || undefined}
        aria-hidden={atEnd}
        aria-label="Next formats"
        onClick={() => page(1)}
      >
        →
      </button>
    </section>
  );
}
