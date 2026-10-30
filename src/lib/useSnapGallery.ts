// useSnapGallery.ts
// Wires a phone-width gallery to the browser's own scroll snapping, shared by
// the film and video configurators.
//
// Below 700px the gallery stops being a translated track and becomes a real
// horizontal scroller with scroll-snap-type: x mandatory. That hands the whole
// gesture to the platform: the photo tracks the finger, the edge of the next
// one shows while you drag, a flick carries past several, and the release
// settles on a slide with the platform's own physics. This file owns none of
// that. What it owns is keeping React's idea of the current slide and the
// scroller's actual position from arguing.
//
// This replaced a hand-rolled swipe (useSwipeNav) that read a gesture after
// the fact and stepped the index by one. Nothing tracked the finger, so a drag
// showed no next photo and a fling moved exactly one slide however hard it was
// thrown. The gesture code is gone; the browser was always going to do it
// better.
//
// Two directions, and the reason there is no feedback loop between them:
//
//   scroll → index   every frame of scroll writes --slide-pos (fractional) for
//                    the progress ink, and commits the rounded slide when it
//                    changes — mid-drag, as the midpoint is crossed.
//   index → scroll   only when the scroller does NOT already agree. A commit
//                    that came from scrolling leaves the two in agreement by
//                    construction, so the effect no-ops instead of scrolling
//                    against the finger. A segment tap or a format switch is a
//                    genuine disagreement, and only that scrolls.

import { useEffect, useRef } from "react";
import { isPhone, prefersReducedMotion } from "./media";

/** Must match the breakpoint where the stylesheets switch to the scroller. */

export function useSnapGallery({
  index,
  onSettle,
}: {
  /** The slide React believes is current. */
  index: number;
  /** Called with the rounded slide whenever scrolling lands on a new one. */
  onSettle: (index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // Both read inside a listener that must not be re-subscribed on every
  // render — a scroll handler torn down and rebuilt mid-drag drops frames.
  const settle = useRef(onSettle);
  settle.current = onSettle;
  const indexRef = useRef(index);
  indexRef.current = index;

  const frame = useRef(0);

  // ---- scroll → ink + index ----
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const read = () => {
      frame.current = 0;
      const w = el.clientWidth;
      if (!w) return;

      // Fractional: 2.4 means "40% of the way from the third slide to the
      // fourth". Written straight to the DOM rather than held in state — this
      // runs every scroll frame, and re-rendering the configurator at 60fps to
      // move a 2px mark would be absurd. React owns --slide-index; this owns
      // --slide-pos; the stylesheet prefers whichever is present.
      const pos = el.scrollLeft / w;
      progressRef.current?.style.setProperty("--slide-pos", pos.toFixed(4));

      const nearest = Math.round(pos);
      if (nearest !== indexRef.current) settle.current(nearest);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // ---- index → scroll ----
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Above the breakpoint the track is transformed and this element doesn't
    // scroll; scrolling it here would offset the photo on top of that
    // transform and show the wrong slide.
    if (!isPhone()) return;

    const w = el.clientWidth;
    if (!w) return;
    // Already there — the commit came from the customer's own scrolling.
    if (Math.round(el.scrollLeft / w) === index) return;

    const reduce = prefersReducedMotion();
    el.scrollTo({
      left: index * w,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [index]);

  // ---- width changes ----
  // The scroll offset is in pixels and the mapping to a slide is a division by
  // the container width, so a rotation or a resize silently lands the gallery
  // between two photos. Re-seat it on the current one.
  //
  // Crossing the breakpoint upward needs the opposite: above 700px the track
  // is positioned by its transform and this element stops scrolling, but a
  // scroll offset left behind by the phone layout does not go away on its own
  // — it stays, and adds to the transform, so the gallery lands on the wrong
  // photo and the thumbnails disagree with what's on screen. Only reachable by
  // resizing or rotating across the breakpoint (a desktop load starts at 0),
  // which is exactly the case nobody would think to check.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let last = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (!isPhone()) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0;
        return;
      }
      const w = el.clientWidth;
      if (!w || w === last) return;
      last = w;
      el.scrollTo({ left: indexRef.current * w, behavior: "auto" });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { scrollerRef, progressRef };
}
