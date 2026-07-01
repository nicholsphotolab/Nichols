// FilmHero.tsx
// The film page hero (Figma node 1760:690), made to feel alive. The "FILM"
// wordmark and its description stay fixed while the background image
// auto-advances on a calm timer (~5s hold, ~1.6s slide), the outgoing photo
// sliding off to the left as the next one enters from the right. The
// bottom-right film-stock caption is paired to each image and does an instant
// swap at the slide's midpoint (it doesn't animate itself), so it reads as
// "this caption belongs to the image now arriving."
//
// Slides are supplied by the server (page.tsx), which reads them from the
// public/Film/<Stock_Process_Frames>/ folders — one image per stock. Timer-only
// by design: no manual controls, so the passive fade never competes with a "is
// this clickable?" affordance. Users who opt out of motion get a static slide.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import styles from "./page.module.css";

// Hold + slide timings (calm pacing). The caption flips at the midpoint of
// the slide, i.e. SLIDE_MS / 2 after the image index advances.
const HOLD_MS = 5000;
// Slide/caption-flip duration; keep in sync with .heroSlide* transitions in CSS.
const SLIDE_MS = 1600;

// One slide = one background image + the film-stock caption that belongs to it.
// `meta` is [topLine, bottomLine]; bottomLine may be empty.
export type HeroSlide = { src: string; meta: [string, string] };

export default function FilmHero({ slides }: { slides: HeroSlide[] }) {
  // Two indices so the image and caption can change at different moments: the
  // image slides immediately, the caption swaps half a slide later.
  // `prevIndex` is the slide that's mid-exit (sliding out left) — the slide
  // that was active just before the current one.
  const [imageIndex, setImageIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Static slide for reduced-motion users (and when there's nothing to cycle).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || slides.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((i) => {
        const next = (i + 1) % slides.length;
        setPrevIndex(i);
        // Flip the caption at the slide midpoint.
        captionTimer.current = setTimeout(
          () => setCaptionIndex(next),
          SLIDE_MS / 2,
        );
        return next;
      });
    }, HOLD_MS);

    return () => {
      clearInterval(interval);
      if (captionTimer.current) clearTimeout(captionTimer.current);
    };
  }, [slides.length]);

  const [metaTop, metaBottom] = slides[captionIndex]?.meta ?? ["", ""];
  const count = slides.length;

  return (
    <section className={styles.hero} aria-label="Film">
      {slides.map((slide, i) => (
        // Slide effect: the active photo sits at translateX(0); the one it's
        // replacing slides out to the left; everything else is parked
        // off-screen to the right, ready to slide in on its turn.
        <Image
          key={slide.src}
          className={`${styles.heroSlide} ${
            i === imageIndex
              ? styles.heroSlideActive
              : i === prevIndex
                ? styles.heroSlidePrev
                : ""
          }`}
          src={withBasePath(slide.src)}
          alt=""
          fill
          priority={i === 0}
          loading={i === 0 ? undefined : "eager"}
          sizes="100vw"
        />
      ))}
      <div className={styles.heroScrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <h1 className={styles.title}>FILM</h1>
        <p className={styles.heroDescription}>
          We carefully develop your film the way it deserves, so every frame
          comes back as rich as the moment you shot it.
        </p>
        <p className={styles.heroMeta}>
          {metaTop}
          {metaBottom && (
            <>
              <br />
              {metaBottom}
            </>
          )}
        </p>

        {count > 1 && (
          <div className={styles.heroIndicators} aria-hidden="true">
            {slides.map((slide, i) => (
              <span
                key={slide.src}
                className={`${styles.heroIndicatorLine} ${
                  i === imageIndex ? styles.heroIndicatorLineActive : ""
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
