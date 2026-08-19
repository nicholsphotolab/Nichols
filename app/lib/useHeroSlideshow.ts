// useHeroSlideshow.ts
// The film and video page heroes, as scrollers rather than slideshows.
//
// Both used to stack their slides absolutely and animate transforms: the
// active one at translateX(0), the outgoing one sliding off left, the rest
// parked off-screen right. That can auto-advance but it can't be dragged —
// there is no position between two slides, only a transition between them.
// Here the slides sit in a row inside a real scroll-snap container, so the
// customer can pull the hero across the same way they can the configurator
// galleries, and the auto-advance drives that same scroll position instead of
// a separate index. One thing moves, whether it's a timer or a finger moving
// it.
//
// What this owns: the scroll position, the index derived from it, and the ink
// on the progress track. What it deliberately doesn't own is *when* to
// advance — the film hero runs a timer and the video hero waits for a clip to
// end, so both call goTo themselves.

import { useCallback, useEffect, useRef, useState } from "react";

export function useHeroSlideshow({
  count,
  slideMs,
  onUserTakeover,
}: {
  count: number;
  /** How long an auto-advance takes to cross. Hand-driven moves aren't timed. */
  slideMs: number;
  /** Fired when the customer grabs the hero, so callers can re-arm their hold. */
  onUserTakeover?: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  const frame = useRef(0);
  const tween = useRef(0);
  const takeover = useRef(onUserTakeover);
  takeover.current = onUserTakeover;

  const stopTween = useCallback(() => {
    if (tween.current) {
      cancelAnimationFrame(tween.current);
      tween.current = 0;
    }
    scrollerRef.current?.style.removeProperty("scroll-snap-type");
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (!w) return;

      const to = Math.max(0, Math.min(count - 1, next)) * w;
      const from = el.scrollLeft;
      if (Math.abs(to - from) < 1) return;

      stopTween();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.scrollLeft = to;
        return;
      }

      // Snapping has to come off for the duration. Under scroll-snap-type
      // mandatory the browser re-snaps every scrollLeft written to it, so a
      // frame-by-frame tween would be yanked to the nearest slide on its first
      // step and never travel. It goes back on at the end, by which point the
      // scroller is sitting exactly on a snap point, so restoring it is
      // invisible.
      el.style.scrollSnapType = "none";

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / slideMs);
        // easeInOutCubic — the closest simple curve to the --ease-carousel
        // cubic-bezier(.65, 0, .35, 1) the rest of the site slides on, and the
        // reason this is a hand-run tween at all: scrollTo({behavior:"smooth"})
        // has no duration control, and the hero's pace is the point of it.
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        el.scrollLeft = from + (to - from) * e;

        if (t < 1) {
          tween.current = requestAnimationFrame(step);
        } else {
          tween.current = 0;
          el.style.removeProperty("scroll-snap-type");
        }
      };
      tween.current = requestAnimationFrame(step);
    },
    [count, slideMs, stopTween]
  );

  // One step, turning round at the ends rather than wrapping. Wrapping was
  // free when the slides were stacked and parked off-screen — last-to-first
  // looked like any other advance. In a scroller it is a real journey back
  // across every photo, so a six-slide hero would periodically rewind itself
  // at speed. Turning round costs nothing and never does that.
  const dir = useRef(1);
  const advance = useCallback(() => {
    if (count <= 1) return;
    let next = indexRef.current + dir.current;
    if (next > count - 1) {
      dir.current = -1;
      next = count - 2;
    } else if (next < 0) {
      dir.current = 1;
      next = 1;
    }
    goTo(next);
  }, [count, goTo]);

  // ---- scroll → ink + index ----
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const read = () => {
      frame.current = 0;
      const w = el.clientWidth;
      if (!w) return;

      // Fractional, straight to the DOM: the ink tracks the drag between
      // slides rather than only landing on them, and the hero doesn't
      // re-render to move a 2px mark.
      const pos = el.scrollLeft / w;
      indicatorRef.current?.style.setProperty("--slide-pos", pos.toFixed(4));

      // Commits at the midpoint, which is where the caption used to be flipped
      // by a timer set to half the slide duration. Same moment, no timer.
      const nearest = Math.round(pos);
      if (nearest !== indexRef.current) setIndex(nearest);
    };

    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(read);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // ---- the customer takes over ----
  // A hand on the hero outranks the timer: kill any tween in flight so the two
  // aren't writing scrollLeft on the same frames, and let the caller re-arm its
  // hold so the next auto-advance doesn't fire a moment after they let go.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const grab = () => {
      stopTween();
      takeover.current?.();
    };
    // Sideways wheel only. A vertical wheel over the hero is someone scrolling
    // the page, which is not a takeover of this.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) grab();
    };

    el.addEventListener("pointerdown", grab, { passive: true });
    el.addEventListener("touchstart", grab, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", grab);
      el.removeEventListener("touchstart", grab);
      el.removeEventListener("wheel", onWheel);
    };
  }, [stopTween]);

  // ---- width changes ----
  // The offset is in pixels against a slide width that just changed, so the
  // hero would sit between two photos after a rotation or a resize.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let last = el.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (!w || w === last) return;
      last = w;
      stopTween();
      el.scrollLeft = indexRef.current * w;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stopTween]);

  useEffect(() => stopTween, [stopTween]);

  return { scrollerRef, indicatorRef, index, goTo, advance };
}
