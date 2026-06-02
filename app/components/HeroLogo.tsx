"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import NicholsLogoSvg from "./NicholsLogoSvg";
import styles from "./HeroLogo.module.css";

// Endpoint reference (matches the old nav brand position/size):
//   top: 20.5px, left: 40px, height: 33px (width ≈ 136px from SVG aspect)
const END_LEFT = 40;
const END_TOP = 20.5;
const END_HEIGHT = 33;
const NATIVE_W = 136;
const NATIVE_H = 33;
// Side padding when fully expanded over the hero.
const SIDE_PAD = 40;

export default function HeroLogo() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Hero (= starting) dimensions. We render the element at this size so
      // the blend-mode layer rasterizes at the LARGE pixel size, then we
      // scale DOWN to reach the nav size — downscaling stays crisp.
      const heroW = Math.max(NATIVE_W, vw - SIDE_PAD * 2);
      const heroH = heroW * (NATIVE_H / NATIVE_W);

      const progress = reduce
        ? 1
        : Math.min(1, Math.max(0, window.scrollY / vh));

      // scaleStart = 1 (rendered at hero size).
      // scaleEnd = nav-height / hero-height.
      const scaleEnd = END_HEIGHT / heroH;
      const scale = 1 + (scaleEnd - 1) * progress;

      // tx constant at 40px (hero-centered horizontally lines up with 40px
      // top-left when width fills viewport - 2*40).
      const tx = END_LEFT;

      // ty: at 0 the element top-left sits at vh/2 - heroH/2 (centered);
      // at 1 the nav-sized element top-left sits at END_TOP.
      const tyStart = vh / 2 - heroH / 2;
      const ty = tyStart + (END_TOP - tyStart) * progress;

      el.style.setProperty("--logo-w", `${heroW}px`);
      el.style.setProperty("--logo-h", `${heroH}px`);
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
      el.style.setProperty("--scale", String(scale));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href="/"
      aria-label="Nichols Photo Lab — home"
      className={styles.logo}
    >
      <NicholsLogoSvg
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      />
    </Link>
  );
}
