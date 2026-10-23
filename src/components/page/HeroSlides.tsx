// HeroSlides.tsx
// The draggable slideshow behind the film and video heroes: slides in a
// scroll-snap row, plus the segmented progress track along the bottom edge
// that doubles as a control. Pass it to PageHero as `background`.
//
// Presentational only. The caller runs useHeroSlideshow (which owns the scroll
// position and the index) and decides when to advance — the film hero on a
// timer, the video hero when a clip ends — then hands the hook's result here.

import type { CSSProperties, ReactNode } from "react";
import type { useHeroSlideshow } from "@/lib/useHeroSlideshow";
import styles from "./HeroSlides.module.css";

export default function HeroSlides({
  slideshow,
  slides,
  noun,
  onPick,
}: {
  slideshow: ReturnType<typeof useHeroSlideshow>;
  slides: { key: string; content: ReactNode }[];
  /** What a slide is called in the indicator labels — "slide", "clip". */
  noun: string;
  /** Called after a segment jumps to its slide, e.g. to restart a hold timer. */
  onPick?: () => void;
}) {
  const { scrollerRef, indicatorRef, index, goTo, paused, setPaused } = slideshow;
  const count = slides.length;

  return (
    <>
      {/* The scrim and text above this are pointer-events: none, which lets a
          drag started anywhere on the hero reach the scroller. tabIndex -1:
          browsers make scroll containers focusable on their own, and a
          focusable aria-hidden element is a trap for keyboard users — the
          segments below are the keyboard route. */}
      <div className={styles.scroller} ref={scrollerRef} aria-hidden="true" tabIndex={-1}>
        <div className={styles.track}>
          {slides.map((slide) => (
            <div key={slide.key} className={styles.slide}>
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        // Pinned to the bottom edge of the frame — it indicates the image, not
        // a line in the text block, and it's the one thing here that still
        // takes clicks. The rule and the travelling mark are drawn by this
        // container; the buttons are transparent targets over it.
        // --slide-index is the first-paint position; useHeroSlideshow then
        // writes a fractional --slide-pos on every scroll frame.
        <div
          className={styles.indicators}
          ref={indicatorRef}
          style={{ "--slide-count": count, "--slide-index": index } as CSSProperties}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              className={styles.segment}
              aria-label={`Go to ${noun} ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => {
                goTo(i);
                onPick?.();
              }}
            />
          ))}
        </div>
      )}

      {count > 1 && (
        // Stops the auto-advance (and any playing clip) — anything that moves
        // on its own for more than five seconds needs a way to stop it.
        <button
          type="button"
          className={styles.pause}
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
        >
          {paused ? "Play" : "Pause"}
        </button>
      )}
    </>
  );
}
