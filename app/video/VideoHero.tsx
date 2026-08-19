// VideoHero.tsx
// The video page hero: silent digitized home-video clips that autoplay like
// moving photographs — no controls, no player chrome. Unlike the film hero's
// fixed timer, each clip plays through once and its `ended` event advances to
// the next. The clips sit in a scroll-snap container (see useHeroSlideshow),
// so the hero can also just be dragged across; either way the bottom-right
// format caption swaps as the move passes halfway, so it reads as "this
// caption belongs to the clip now arriving." The segmented progress track
// along the bottom edge doubles as a control, each segment jumping to its clip.
//
// Clips (web encodes in public/VIDEO/, masters in /masters/VIDEO/):
//   Video-Reel.mp4 — 1600×1200 encode of the 8mm reel montage
//   Hi8.mp4        — 640×480 encode of the Hi8 tape excerpt
//
// Users with prefers-reduced-motion get the poster frames: nothing autoplays
// or auto-advances, but the track still swaps clips instantly (CSS drops the
// slide transition).

"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { withBasePath } from "../lib/basePath";
import { useHeroSlideshow } from "../lib/useHeroSlideshow";
import styles from "./page.module.css";

// Slide/caption-flip duration; keep in sync with .heroSlide* transitions in CSS.
const SLIDE_MS = 1600;

// One clip = one background video + the format caption that belongs to it.
type HeroClip = { src: string; poster: string; label: string };

const CLIPS: HeroClip[] = [
  {
    src: "/VIDEO/Video-Reel.mp4",
    poster: "/VIDEO/Video-Reel-Poster.jpg",
    label: "8mm Reel",
  },
  {
    src: "/VIDEO/Hi8.mp4",
    poster: "/VIDEO/Hi8-Poster.jpg",
    label: "Hi8 Tape",
  },
];

export default function VideoHero() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const count = CLIPS.length;

  const { scrollerRef, indicatorRef, index, goTo, advance } = useHeroSlideshow({
    count,
    slideMs: SLIDE_MS,
    // Nothing to re-arm here — the next advance comes from a clip ending, and
    // a clip the customer just dragged to is only starting.
  });

  // Mirrors the committed clip for the `ended` handlers, which are attached
  // per clip and would otherwise close over a stale index.
  const indexRef = useRef(0);
  indexRef.current = index;

  // Only the clip the hero has settled on plays. The scroller commits that at
  // the halfway point of the move, so the incoming clip starts as it takes
  // over the frame and the outgoing one stops as it leaves — which is what the
  // old pair of timers (play now, retire in SLIDE_MS) was arranging by hand.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [index]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Once the first clip is underway, warm the others so a drag doesn't
    // arrive at a cold fetch.
    videoRefs.current.forEach((video, i) => {
      if (video && i !== indexRef.current) video.preload = "auto";
    });
  }, []);

  const activeClip = CLIPS[index];

  return (
    <section className={styles.hero} aria-label="Video transfer">
      {/* The clips live in a scroller so the hero can be dragged; the scrim
          and the content above it are pointer-events: none, which lets a drag
          started anywhere on the hero reach this. */}
      <div className={styles.heroScroller} ref={scrollerRef} aria-hidden="true" tabIndex={-1}>
        <div className={styles.heroTrack}>
          {CLIPS.map((clip, i) => (
            <div key={clip.src} className={styles.heroSlide}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className={styles.heroSlideVideo}
                src={withBasePath(clip.src)}
                poster={withBasePath(clip.poster)}
                onEnded={() => {
                  // Only the settled clip chains onward — one that's being
                  // dragged away from can still reach its end mid-move, and
                  // that must not trigger a second advance.
                  if (i === indexRef.current) advance();
                }}
                muted
                playsInline
                preload={i === 0 ? "auto" : "metadata"}
                tabIndex={-1}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heroScrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <h1 className={styles.title}>Video</h1>
        <p className={styles.heroDescription}>
          Old memories deserve to be preserved. We transfer film reels, tapes,
          and other video formats into clean digital files, in&#8209;house, so
          you can relive those precious moments.
        </p>
        <p className={styles.heroMeta}>{activeClip.label}</p>
      </div>

      {count > 1 && (
        // Pinned to the bottom edge of the frame, outside .heroContent — it is
        // an indicator for the clip, not a line in the text block, and it is
        // also the one thing here that still takes clicks. --slide-index is
        // the first-paint position; useHeroSlideshow writes a fractional
        // --slide-pos on every scroll frame and the stylesheet prefers that.
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
          {CLIPS.map((clip, i) => (
            <button
              key={clip.src}
              type="button"
              className={styles.heroIndicatorSeg}
              aria-label={`Go to clip ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
