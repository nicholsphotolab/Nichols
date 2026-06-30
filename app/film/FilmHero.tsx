// FilmHero.tsx
// The film page hero (Figma node 1760:690), made to feel alive. The "FILM"
// wordmark and its description stay fixed while the background image
// auto-crossfades on a calm timer (~5s hold, ~700ms dissolve). The bottom-right
// film-stock caption is paired to each image and does an instant swap at the
// crossfade midpoint (it doesn't fade itself), so it reads as "this caption
// belongs to the image now resolving."
//
// Slides are supplied by the server (page.tsx), which reads them from the
// public/Film/<Stock_Process_Frames>/ folders — one image per stock. Timer-only
// by design: no manual controls, so the passive fade never competes with a "is
// this clickable?" affordance. Users who opt out of motion get a static slide.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

// Hold + dissolve timings (calm pacing). The caption flips at the midpoint of
// the dissolve, i.e. DISSOLVE_MS / 2 after the image index advances.
const HOLD_MS = 5000;
// Dissolve/caption-flip duration; keep in sync with .heroSlide* transitions in CSS.
const DISSOLVE_MS = 1000;

// One slide = one background image + the film-stock caption that belongs to it.
// `meta` is [topLine, bottomLine]; bottomLine may be empty.
export type HeroSlide = { src: string; meta: [string, string] };

export default function FilmHero({ slides }: { slides: HeroSlide[] }) {
  // Two indices so the image and caption can change at different moments: the
  // image crossfades immediately, the caption swaps half a dissolve later.
  const [imageIndex, setImageIndex] = useState(0);
  const [captionIndex, setCaptionIndex] = useState(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Static slide for reduced-motion users (and when there's nothing to cycle).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || slides.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndex((i) => {
        const next = (i + 1) % slides.length;
        // Flip the caption at the crossfade midpoint.
        captionTimer.current = setTimeout(
          () => setCaptionIndex(next),
          DISSOLVE_MS / 2,
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
        // Focus-pull dissolve: each photo resolves from soft + slightly scaled
        // into sharp as it fades in (and softens back out as it leaves). The blur
        // masks the crossfade so you read one photo coming into focus rather than
        // two overlapping images — and it doubles as a film-lab "developing" feel.
        <Image
          key={slide.src}
          className={`${styles.heroSlide} ${
            i === imageIndex ? styles.heroSlideActive : ""
          }`}
          src={slide.src}
          alt=""
          fill
          priority={i === 0}
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
      </div>

      {/* Hold-time progress bar pinned to the bottom of the hero. Keyed on the
          slide index so it remounts and restarts its fill on every change; the
          fill duration is driven by HOLD_MS. Hidden when there's nothing to
          rotate (also hidden for reduced-motion via CSS, since the timer is off). */}
      {count > 1 && (
        <div className={styles.progress} aria-hidden="true">
          <span
            key={imageIndex}
            className={styles.progressBar}
            style={{ animationDuration: `${HOLD_MS}ms` }}
          />
        </div>
      )}
    </section>
  );
}
