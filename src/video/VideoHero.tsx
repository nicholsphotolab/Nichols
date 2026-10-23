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
// or auto-advances, but the track still swaps clips.
//
// Layout, scrim and slideshow chrome are shared with the other heroes — see
// components/page/PageHero and HeroSlides.


import { useEffect, useRef } from "react";
import HeroSlides from "@/components/page/HeroSlides";
import PageHero from "@/components/page/PageHero";
import { withBasePath } from "@/lib/basePath";
import { prefersReducedMotion } from "@/lib/media";
import { useHeroSlideshow } from "@/lib/useHeroSlideshow";

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

  // Nothing to re-arm on a drag — the next advance comes from a clip ending,
  // and a clip the customer just dragged to is only starting.
  const slideshow = useHeroSlideshow({ count: CLIPS.length, slideMs: SLIDE_MS });
  const { index, advance, paused } = slideshow;

  // Mirrors the committed clip for the `ended` handlers, which are attached
  // per clip and would otherwise close over a stale index.
  const indexRef = useRef(0);
  indexRef.current = index;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Only the clip the hero has settled on plays. The scroller commits that at
  // the halfway point of the move, so the incoming clip starts as it takes
  // over the frame and the outgoing one stops as it leaves.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.currentTime = 0;
        if (pausedRef.current) return;
        video.play().catch(() => {
          // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [index]);

  // Pause holds the current clip where it is (and so stops the chain, which
  // advances on `ended`); play resumes it from that frame.
  useEffect(() => {
    const video = videoRefs.current[indexRef.current];
    if (!video) return;
    if (paused) video.pause();
    else if (!prefersReducedMotion()) video.play().catch(() => {});
  }, [paused]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Once the first clip is underway, warm the others so a drag doesn't
    // arrive at a cold fetch.
    videoRefs.current.forEach((video, i) => {
      if (video && i !== indexRef.current) video.preload = "auto";
    });
  }, []);

  return (
    <PageHero
      label="Video transfer"
      title="Video"
      titleBearing={0.004}
      description={"Old memories deserve to be preserved. We transfer film reels, tapes, and other video formats into clean digital files, in\u2011house, so you can relive those precious moments."}
      // Wider than the other heroes so this longer copy still lands on exactly
      // two lines; text-wrap: balance evens them.
      descriptionSpan={11}
      meta={CLIPS[index].label}
      scrim="strong"
      background={
        <HeroSlides
          slideshow={slideshow}
          noun="clip"
          slides={CLIPS.map((clip, i) => ({
            key: clip.src,
            content: (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
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
            ),
          }))}
        />
      }
    />
  );
}
