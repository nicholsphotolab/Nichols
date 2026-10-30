// ConfiguratorGallery.tsx
// The left column of both configurators: the main frame, the square thumbnail
// strip under it, and — on phones — a hairline progress track in place of the
// thumbs. Slides are product shots, a solid placeholder for a product shot
// that doesn't exist yet, or silent sample clips (video).
//
// Above 700px the frame clips a transformed track that slides one frame per
// index. Below it the frame becomes a real scroll-snap container and the drag
// is the browser's; useSnapGallery keeps that scroller and the index in
// agreement. Clamped rather than wrapped: a gallery that loops from the last
// slide back to the first gives no sense of where its ends are, and the
// progress track is a statement about exactly that.
//
// The parent remounts this (via `key`) whenever the set of slides swaps — a
// format change — which restarts it from the first slide without a glide
// across unrelated images.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "@/components/Image";
import { withBasePath } from "@/lib/basePath";
import { prefersReducedMotion } from "@/lib/media";
import { useSnapGallery } from "@/lib/useSnapGallery";
import styles from "./Configurator.module.css";

export type GallerySlide =
  /** A product shot, or null for the solid placeholder block. */
  | { kind: "image"; src: string | null }
  /** A silent sample clip; its poster doubles as the thumbnail. */
  | { kind: "clip"; video: string; poster: string };

function slideKey(s: GallerySlide): string {
  return s.kind === "clip" ? s.video : s.src ?? "product-placeholder";
}

export default function ConfiguratorGallery({
  slides,
  label,
  noun,
}: {
  slides: GallerySlide[];
  /** Accessible name for the thumbnail group — "Product photos". */
  label: string;
  /** What one slide is called in its button label — "Photo", "Sample". */
  noun: string;
}) {
  const [indexSel, setIndexSel] = useState(0);
  const index = Math.min(indexSel, slides.length - 1);

  // Every way of reaching a slide goes through here: thumbs, progress
  // segments, and — on phones — the scroller reporting where it landed.
  const goTo = (i: number) => {
    if (i < 0 || i > slides.length - 1) return;
    setIndexSel(i);
  };

  const { scrollerRef, progressRef } = useSnapGallery({ index, onSettle: goTo });

  // Portrait product shots fill the frame's height and sit on its bottom edge.
  // Landscape shots leave vertical slack, so they're centered instead.
  // Detected per photo from its natural dimensions once loaded, keyed by src.
  const [landscape, setLandscape] = useState<Record<string, boolean>>({});

  // Only the visible slide's clip plays; the rest sit paused on their poster.
  // Reduced-motion users get posters only — nothing autoplays.
  // Keyed on the slide list's contents rather than the array, which callers
  // rebuild on every render.
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const slideKeys = slides.map(slideKey).join("|");
  useEffect(() => {
    const reduce = prefersReducedMotion();
    slides.forEach((s, i) => {
      if (s.kind !== "clip") return;
      const video = videoRefs.current[s.video];
      if (!video) return;
      if (i === index && !reduce) {
        video.play().catch(() => {
          // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
        });
      } else {
        video.pause();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKeys, index]);

  const many = slides.length > 1;

  return (
    <div className={styles.imageCol}>
      {/* On phones this is the scroll-snap container the customer drags.
          tabIndex -1 keeps it out of the tab order — Chrome makes scroll
          containers focusable on their own, and a focusable aria-hidden
          element is a trap for anyone tabbing through. The thumbs and segments
          are the keyboard route into the gallery. */}
      <div className={styles.image} aria-hidden="true" tabIndex={-1} ref={scrollerRef}>
        {/* The position is handed over as a custom property rather than set
            directly on `transform`, so the phone media query can switch it
            off — it couldn't reach past an inline transform. */}
        <div
          className={styles.track}
          style={{ "--track-x": `-${index * 100}%` } as CSSProperties}
        >
          {slides.map((s) => (
            <div key={slideKey(s)} className={styles.slide}>
              {s.kind === "clip" ? (
                <video
                  ref={(el) => {
                    videoRefs.current[s.video] = el;
                  }}
                  src={withBasePath(s.video)}
                  poster={withBasePath(s.poster)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  tabIndex={-1}
                />
              ) : s.src ? (
                <Image
                  src={withBasePath(s.src)}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 46vw"
                  data-landscape={landscape[s.src] || undefined}
                  onLoad={(e) => {
                    const src = s.src!;
                    const img = e.currentTarget;
                    const isLandscape = img.naturalWidth > img.naturalHeight;
                    setLandscape((m) =>
                      m[src] === isLandscape ? m : { ...m, [src]: isLandscape }
                    );
                  }}
                />
              ) : (
                <div className={styles.productFill} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Uniform square thumbs, each filling its tile edge-to-edge (cover
          crop); the selection border traces the square. Hidden on phones,
          where the progress track takes over. */}
      {many && (
        <div className={styles.thumbs} role="group" aria-label={label}>
          {slides.map((s, i) => {
            const thumb = s.kind === "clip" ? s.poster : s.src;
            return (
              <button
                key={slideKey(s)}
                type="button"
                className={styles.thumb}
                data-active={i === index || undefined}
                aria-pressed={i === index}
                aria-label={`${noun} ${i + 1} of ${slides.length}`}
                onClick={() => goTo(i)}
              >
                {thumb ? (
                  <img src={withBasePath(thumb)} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className={styles.productFill} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Phone-only: one hairline across the width of the frame, divided into
          a segment per slide with the current one inked — says how many and
          which one in 2px, where four thumbnails would be a second gallery
          competing with the first. Still buttons, not decoration: each target
          is the full height of the strip, so it stays tappable for anyone who
          doesn't swipe and keeps the gallery reachable from the keyboard. */}
      {many && (
        <div
          className={styles.progress}
          role="group"
          aria-label={label}
          ref={progressRef}
          // useSnapGallery writes a third value, --slide-pos, straight to this
          // node mid-drag; the stylesheet prefers it, which is what lets the
          // ink track the finger between slides.
          style={
            {
              "--slide-count": slides.length,
              "--slide-index": index,
            } as CSSProperties
          }
        >
          {slides.map((s, i) => (
            <button
              key={slideKey(s)}
              type="button"
              className={styles.segment}
              data-active={i === index || undefined}
              aria-pressed={i === index}
              aria-label={`${noun} ${i + 1} of ${slides.length}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
