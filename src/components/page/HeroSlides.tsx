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
  controls = true,
  loop = false,
}: {
  slideshow: ReturnType<typeof useHeroSlideshow>;
  slides: { key: string; content: ReactNode }[];
  /** What a slide is called in the indicator labels — "slide", "clip". */
  noun: string;
  /** Called after a segment jumps to its slide, e.g. to restart a hold timer. */
  onPick?: () => void;
  /** False when the page draws its own controls (the film hero's strip):
   *  leaves out the progress track and the pause button. Such a page can
   *  still place the track itself — see SlideIndicator below. */
  controls?: boolean;
  /** Pass the same flag given to useHeroSlideshow: adds the copy of the first
   *  slide after the last that its forward-only loop wraps through. */
  loop?: boolean;
}) {
  const { scrollerRef, paused, setPaused } = slideshow;
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
          {loop && count > 1 && (
            <div className={styles.slide}>{slides[0].content}</div>
          )}
        </div>
      </div>

      {controls && (
        // Pinned to the bottom edge of the frame — it indicates the image, not
        // a line in the text block, and it's the one thing here that still
        // takes clicks.
        <SlideIndicator slideshow={slideshow} count={count} noun={noun} onPick={onPick} />
      )}

      {controls && count > 1 && (
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

// The segmented progress track — one hairline, divided by slide, with a mark
// one slide wide that travels along it with the photos. The rule and the mark
// are drawn by the container; the buttons are transparent targets over it.
// --slide-index is the first-paint position; useHeroSlideshow then writes a
// fractional --slide-pos on every scroll frame (to whatever element its
// indicatorRef is on — this one).
//
// HeroSlides pins it to the bottom of the frame. A page with its own strip
// (the film hero) places it along the strip's top edge instead, with
// placement="top" inside a positioned parent.
export function SlideIndicator({
  slideshow,
  count,
  noun,
  onPick,
  placement = "bottom",
}: {
  slideshow: ReturnType<typeof useHeroSlideshow>;
  count: number;
  noun: string;
  onPick?: () => void;
  placement?: "bottom" | "top";
}) {
  const { indicatorRef, index, goTo } = slideshow;
  if (count <= 1) return null;

  return (
    <div
      className={styles.indicators}
      data-placement={placement}
      ref={indicatorRef}
      style={{ "--slide-count": count, "--slide-index": index } as CSSProperties}
    >
      <span className={styles.rail} aria-hidden="true" />
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
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
  );
}
