// VideoHeroReel.tsx
// Hero visual for the video page: a silent ~20s montage of digitized reel
// footage that autoplays and loops like a moving photograph — no controls,
// no player chrome. Users with prefers-reduced-motion get the poster frame.
// Source: 1600×1200 web encode of /public/"Reel Video.mp4" (the original master).

"use client";

import { useEffect, useRef } from "react";
import { withBasePath } from "../lib/basePath";
import styles from "./VideoHeroReel.module.css";

export default function VideoHeroReel() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return; // leave the poster frame in place
    video.play().catch(() => {
      // Autoplay can be blocked (e.g. low-power mode); the poster shows instead.
    });
  }, []);

  return (
    <video
      ref={ref}
      className={styles.reel}
      src={withBasePath("/Video-Reel.mp4")}
      poster={withBasePath("/Video-Reel-Poster.jpg")}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
