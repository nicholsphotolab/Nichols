// FilmHero.tsx
// The film page hero (Figma node 1760:690), made to feel alive. The "FILM"
// wordmark and its description stay fixed while the background image
// auto-advances on a calm timer (~5s hold, ~1.6s slide), the outgoing photo
// sliding off to the left as the next one enters from the right. The
// bottom-right film-stock caption is paired to each image and does an instant
// swap at the slide's midpoint (it doesn't animate itself), so it reads as
// "this caption belongs to the image now arriving."
//
// Slides are supplied by the server (page.tsx): a desktop set from
// public/FILM/ and an optional mobile set from public/FILM/mobile/ (mobile
// gets different photos/crops). The default export picks the set with a
// matchMedia check after mount — SSR always renders the desktop set, so
// mobile may briefly show the first desktop slide before swapping — and
// remounts the slideshow on a switch so indices/timers reset cleanly. The
// indicator dots under the description double as controls: clicking one jumps
// straight to that slide and restarts the hold timer so the auto-advance
// doesn't fire right after a manual pick. Users who opt out of motion get
// instant swaps (transitions are dropped in CSS) but can still click through.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // Two indices so the image and caption can change at different moments: the
  // image slides immediately, the caption swaps half a slide later.
  // `prevIndex` is the slide that's mid-exit (sliding out left) — the slide
  // that was active just before the current one.
  const [imageIndex, setImageIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors imageIndex so goTo and the interval tick can read the current
  // slide without being re-created — state setters stay a plain sequence
  // (no side effects inside updaters; see StrictMode note below).
  const currentRef = useRef(0);
  // Bumped on every manual jump to restart the hold timer, so auto-advance
  // never fires moments after the user picks a slide.
  const [holdCycle, setHoldCycle] = useState(0);

  const goTo = useCallback((next: number) => {
    if (next === currentRef.current) return;
    const prev = currentRef.current;
    currentRef.current = next;
    setPrevIndex(prev);
    setImageIndex(next);
    // Flip the caption at the slide midpoint (immediately for reduced-motion
    // users, whose slide swap is instant). Clear any pending flip first so
    // timers never stack.
    if (captionTimer.current) clearTimeout(captionTimer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCaptionIndex(next);
    } else {
      captionTimer.current = setTimeout(() => setCaptionIndex(next), SLIDE_MS / 2);
    }
  }, []);

  useEffect(() => {
    // No auto-advance for reduced-motion users (they can still click the
    // dots) or when there's nothing to cycle. Timer work happens here, not
    // inside setState updaters — React may call updaters more than once,
    // e.g. under StrictMode, which would double-schedule the caption timer.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || slides.length <= 1) return;

    const interval = setInterval(() => {
      goTo((currentRef.current + 1) % slides.length);
    }, HOLD_MS);

    return () => clearInterval(interval);
  }, [slides.length, goTo, holdCycle]);

  // Unmount-only: the interval effect above re-runs on every manual jump
  // (holdCycle), so clearing the caption timer there would cancel the very
  // flip that jump just scheduled.
  useEffect(() => {
    return () => {
      if (captionTimer.current) clearTimeout(captionTimer.current);
    };
  }, []);

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

        {count > 1 && (
          <div className={styles.heroIndicators}>
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                className={`${styles.heroIndicatorDot} ${
                  i === imageIndex ? styles.heroIndicatorDotActive : ""
                }`}
                aria-label={`Go to slide ${i + 1} of ${count}`}
                aria-current={i === imageIndex}
                onClick={() => {
                  goTo(i);
                  setHoldCycle((c) => c + 1);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
