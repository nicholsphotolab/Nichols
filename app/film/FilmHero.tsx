// FilmHero.tsx
// The film page hero (Figma node 1760:690), made to feel alive. The "FILM"
// wordmark and its description stay fixed while the background photo advances
// on a calm rhythm (~5s hold, ~1.6s slide) — and can be dragged across at any
// point, because the photos sit in a scroll-snap container rather than being
// stacked and transformed (see useHeroSlideshow). The bottom-right film-stock
// caption is paired to each image and swaps as the slide passes its halfway
// point, so it reads as "this caption belongs to the image now arriving."
//
// Slides are supplied by the server (page.tsx): a desktop set from
// public/FILM/ and an optional mobile set from public/FILM/mobile/ (mobile
// gets different photos/crops). The default export picks the set with a
// matchMedia check after mount — SSR always renders the desktop set, so
// mobile may briefly show the first desktop slide before swapping — and
// remounts the slideshow on a switch so indices/timers reset cleanly. The
// segmented progress track under the description doubles as a control: each
// segment jumps straight to its slide and restarts the hold timer so the
// auto-advance doesn't fire right after a manual pick. Users who opt out of
// motion get instant swaps (transitions are dropped in CSS) but can still
// click through.

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { withBasePath } from "../lib/basePath";
import { useHeroSlideshow } from "../lib/useHeroSlideshow";
import styles from "./page.module.css";

// Hold + slide timings (calm pacing). The caption flips at the midpoint of
// the slide, i.e. SLIDE_MS / 2 after the image index advances.
const HOLD_MS = 5000;
// Slide/caption-flip duration; keep in sync with .heroSlide* transitions in CSS.
const SLIDE_MS = 1600;

// One slide = one background image + the film-stock caption that belongs to it.
// `meta` is [topLine, bottomLine]; bottomLine may be empty.
export type HeroSlide = { src: string; meta: [string, string] };

// Matches the site-wide mobile breakpoint (globals.css / module media queries).
const MOBILE_QUERY = "(max-width: 700px)";

export default function FilmHero({
  slides,
  mobileSlides = [],
}: {
  slides: HeroSlide[];
  mobileSlides?: HeroSlide[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (mobileSlides.length === 0) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mobileSlides.length]);

  const useMobile = isMobile && mobileSlides.length > 0;
  return (
    <HeroSlideshow
      key={useMobile ? "mobile" : "desktop"}
      slides={useMobile ? mobileSlides : slides}
    />
  );
}

function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;

  // Bumped whenever the customer takes hold of the hero — a drag, or a pick
  // from the track — so the hold below restarts and an auto-advance never
  // fires on top of them.
  const [holdCycle, setHoldCycle] = useState(0);

  const { scrollerRef, indicatorRef, index, goTo, advance } = useHeroSlideshow({
    count,
    slideMs: SLIDE_MS,
    onUserTakeover: () => setHoldCycle((c) => c + 1),
  });

  // The hold. Keyed on `index`, so every arrival — timed, dragged or picked —
  // starts a fresh one rather than resuming somebody else's remainder. No
  // auto-advance for reduced-motion users; they can still drag and pick.
  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(advance, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, count, advance, holdCycle]);

  // The caption follows the committed slide, which the scroller reports at the
  // halfway point of the move — the same moment the old timer-based flip was
  // aiming for, minus the timer.
  const [metaTop, metaBottom] = slides[index]?.meta ?? ["", ""];

  return (
    <section className={styles.hero} aria-label="Film">
      {/* The photos live in a scroller so the hero can be dragged; the scrim
          and the content above it are pointer-events: none, which lets a drag
          started anywhere on the hero reach this. */}
      <div className={styles.heroScroller} ref={scrollerRef} aria-hidden="true" tabIndex={-1}>
        <div className={styles.heroTrack}>
          {slides.map((slide, i) => (
            <div key={slide.src} className={styles.heroSlide}>
              <Image
                className={styles.heroSlideImg}
                src={withBasePath(slide.src)}
                alt=""
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : "eager"}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heroScrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <h1 className={styles.title}>Film</h1>
        <p className={styles.heroDescription}>
          We carefully develop your film the way it deserves, so every frame
          comes back as rich as the moment you shot it.
        </p>
        {/* Spans (not bare text) so the mobile layout can turn the two lines
            into side-by-side flex items; the <br> is hidden there. */}
        <p className={styles.heroMeta}>
          <span>{metaTop}</span>
          {metaBottom && (
            <>
              <br />
              <span>{metaBottom}</span>
            </>
          )}
        </p>
      </div>

      {count > 1 && (
        // Pinned to the bottom edge of the photo, outside .heroContent — it is
        // an indicator for the image, not a line in the text block, and it is
        // also the one thing here that still takes clicks.
        //
        // The rule and the travelling mark are drawn by this container; the
        // buttons inside are transparent targets over it. --slide-index is the
        // first-paint position, after which useHeroSlideshow writes a
        // fractional --slide-pos on every scroll frame and the stylesheet
        // prefers that — which is what puts the mark under the finger during
        // a drag rather than only at the end of one.
        <div
          className={styles.heroIndicators}
          ref={indicatorRef}
          style={
            {
              "--slide-count": count,
              "--slide-index": index,
            } as CSSProperties
          }
        >
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className={styles.heroIndicatorSeg}
              aria-label={`Go to slide ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => {
                goTo(i);
                setHoldCycle((c) => c + 1);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
