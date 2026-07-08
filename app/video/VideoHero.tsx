// VideoHero.tsx
// The video page hero: silent digitized home-video clips that autoplay like
// moving photographs — no controls, no player chrome. Unlike the film hero's
// fixed timer, each clip plays through once and its `ended` event triggers the
// slide to the next clip, using the same choreography as FilmHero: the
// outgoing clip slides off to the left as the next enters from the right, and
// the bottom-right format caption swaps at the slide's midpoint so it reads
// as "this caption belongs to the clip now arriving." The indicator dots
// double as controls, jumping straight to a clip.
//
// Clips (web encodes in public/VIDEO/, masters in /masters/VIDEO/):
//   Video-Reel.mp4 — 1600×1200 encode of the 8mm reel montage
//   Hi8.mp4        — 640×480 encode of the Hi8 tape excerpt
//
// Users with prefers-reduced-motion get the poster frames: nothing autoplays
// or auto-advances, but the dots still swap clips instantly (CSS drops the
// slide transition).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "../lib/basePath";
import styles from "./page.module.css";

// Slide/caption-flip duration; keep in sync with .heroSlide* transitions in CSS.
const SLIDE_MS = 1600;

// One clip = one background video + the format caption that belongs to it.
type HeroClip = { src: string; poster: string; label: string };

const CLIPS: HeroClip[] = [
  {
    src: "/VIDEO/Video-Reel.mp4",
    poster: "/VIDEO/Video-Reel-Poster.jpg",
    label: "8MM REEL",
  },
  {
    src: "/VIDEO/Hi8.mp4",
    poster: "/VIDEO/Hi8-Poster.jpg",
    label: "HI8 TAPE",
  },
];

export default function VideoHero() {
  // Two indices so the video and caption can change at different moments: the
  // video slides immediately, the caption swaps half a slide later.
  const [clipIndex, setClipIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  // Mirrors clipIndex so goTo and ended-handlers can read the current clip
  // without being re-created.
  const currentRef = useRef(0);

  const goTo = useCallback((next: number) => {
    if (next === currentRef.current) return;
    const prev = currentRef.current;
    currentRef.current = next;
    setPrevIndex(prev);
    setClipIndex(next);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Start the incoming clip from the top as it slides in; retire the
    // outgoing one once it's fully off-screen (immediately for reduced-motion
    // users, who never autoplay — their videos stay on the poster frame).
    const incoming = videoRefs.current[next];
    const outgoing = videoRefs.current[prev];
    if (incoming && !reduce) {
      incoming.currentTime = 0;
      incoming.play().catch(() => {
        // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
      });
    }
    const retireDelay = reduce ? 0 : SLIDE_MS;
    setTimeout(() => {
      if (outgoing && currentRef.current !== prev) {
        outgoing.pause();
        outgoing.currentTime = 0;
      }
    }, retireDelay);

    // Flip the caption at the slide midpoint (immediately for reduced-motion
    // users, whose slide swap is instant). Clear any pending flip first so
    // timers never stack.
    if (captionTimer.current) clearTimeout(captionTimer.current);
    if (reduce) {
      setCaptionIndex(next);
    } else {
      captionTimer.current = setTimeout(() => setCaptionIndex(next), SLIDE_MS / 2);
    }
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return; // leave the poster frames in place

    // Kick off the first clip; the rest are chained by `ended` events. Once
    // playback is underway, warm up the other clips so the first slide-in
    // doesn't stall on a cold fetch.
    videoRefs.current[currentRef.current]?.play().catch(() => {});
    videoRefs.current.forEach((video, i) => {
      if (video && i !== currentRef.current) video.preload = "auto";
    });

    return () => {
      if (captionTimer.current) clearTimeout(captionTimer.current);
    };
  }, []);

  const [activeClip, count] = [CLIPS[captionIndex], CLIPS.length];

  return (
    <section className={styles.hero} aria-label="Video transfer">
      {CLIPS.map((clip, i) => (
        // Slide effect: the active clip sits at translateX(0); the one it's
        // replacing slides out to the left; everything else is parked
        // off-screen to the right, ready to slide in on its turn.
        <video
          key={clip.src}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          className={`${styles.heroSlide} ${
            i === clipIndex
              ? styles.heroSlideActive
              : i === prevIndex
                ? styles.heroSlidePrev
                : ""
          }`}
          src={withBasePath(clip.src)}
          poster={withBasePath(clip.poster)}
          onEnded={() => {
            // Only the active clip chains to the next — an outgoing clip can
            // still reach its end mid-slide after a manual dot jump, and that
            // must not trigger a second advance.
            if (i === currentRef.current) goTo((i + 1) % count);
          }}
          muted
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
          aria-hidden="true"
          tabIndex={-1}
        />
      ))}
      <div className={styles.heroScrim} aria-hidden="true" />

      <div className={styles.heroContent}>
        <h1 className={styles.title}>VIDEO</h1>
        <p className={styles.heroDescription}>
          Old memories deserve to be preserved. We transfer film reels, tapes,
          and other video formats into clean digital files, in&#8209;house, so
          you can relive those precious moments.
        </p>
        <p className={styles.heroMeta}>{activeClip.label}</p>

        {count > 1 && (
          <div className={styles.heroIndicators}>
            {CLIPS.map((clip, i) => (
              <button
                key={clip.src}
                type="button"
                className={`${styles.heroIndicatorDot} ${
                  i === clipIndex ? styles.heroIndicatorDotActive : ""
                }`}
                aria-label={`Go to clip ${i + 1} of ${count}`}
                aria-current={i === clipIndex}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
