
import { useEffect, useRef } from "react";
import Link from "@/components/SmartLink";
import NicholsLogoSvg from "./NicholsLogoSvg";
import styles from "./HeroLogo.module.css";
import { prefersReducedMotion } from "@/lib/media";

// Endpoint reference (matches the nav brand position/size):
//   top: 13.5px, centered horizontally, height: 33px (width ≈ 145.41px from SVG aspect)
const END_LEFT = 60;
const END_TOP = 13.5;
const END_HEIGHT = 33;
const NATIVE_W = 145.41;
const NATIVE_H = 33;
// Side padding when fully expanded over the hero.
const SIDE_PAD = 60;
// Logo top offset below the nav at scroll 0. Hero.module.css mirrors this
// (plus the logo height) to reserve the space in the document flow.
const START_TOP = 120;

export default function HeroLogo() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = prefersReducedMotion();

    let raf = 0;
    const update = () => {
      raf = 0;
      const vw = window.innerWidth;

      // Hero (= starting) dimensions. We render the element at this size so
      // the blend-mode layer rasterizes at the LARGE pixel size, then we
      // scale DOWN to reach the nav size — downscaling stays crisp.
      const heroW = Math.max(NATIVE_W, vw - SIDE_PAD * 2);
      const heroH = heroW * (NATIVE_H / NATIVE_W);

      // The logo docks into the nav over the distance its bottom edge
      // travels, so its motion roughly tracks the scroll speed of the
      // content below it.
      const range = Math.max(1, START_TOP + heroH - (END_TOP + END_HEIGHT));
      const progress = reduce
        ? 1
        : Math.min(1, Math.max(0, window.scrollY / range));

      // scaleStart = 1 (rendered at hero size).
      // scaleEnd = nav-height / hero-height.
      const scaleEnd = END_HEIGHT / heroH;
      const scale = 1 + (scaleEnd - 1) * progress;

      // tx: constant at END_LEFT through the hero phase (paired with heroW
      // above, that keeps the large logo gutter-centered), then above 900px
      // interpolates toward the docked mark's centered position —
      // NavBrand.module.css centers it in the bar there instead of pinning
      // it to the left edge. At and below 900px the bar is unchanged, so
      // dockedCenterTx just collapses back to END_LEFT and tx stays put,
      // same as before. The docked render is always NATIVE_W wide (scaleEnd
      // is solved from END_HEIGHT against the hero's fixed aspect ratio,
      // independent of viewport), so that's what centers against.
      const dockedCenterTx = vw > 900 ? (vw - NATIVE_W) / 2 : END_LEFT;
      const tx = END_LEFT + (dockedCenterTx - END_LEFT) * progress;

      // ty: from the start offset below the nav to the nav slot.
      const ty = START_TOP + (END_TOP - START_TOP) * progress;

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
      data-nav-chrome
    >
      <NicholsLogoSvg
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      />
    </Link>
  );
}
