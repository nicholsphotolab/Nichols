// FilmHero.tsx
// The film page hero (Figma node 1760:690), made to feel alive. The "FILM"
// wordmark and its description stay fixed while the background photo advances
// on a calm rhythm (~5s hold, ~1.6s slide) — and can be dragged across at any
// point, because the photos sit in a scroll-snap container rather than being
// stacked and transformed (see useHeroSlideshow). The bottom-right film-stock
// caption is paired to each image and swaps as the slide passes its halfway
// point, so it reads as "this caption belongs to the image now arriving."
//
// Slides are generated at build time (FilmPage.tsx): a desktop set from
// public/FILM/ and an optional mobile set from public/FILM/mobile/ (mobile
// gets different photos/crops). The default export picks the set with a
// matchMedia check after mount — SSR always renders the desktop set, so
// mobile may briefly show the first desktop slide before swapping — and
// remounts the slideshow on a switch so indices/timers reset cleanly. The
// segmented progress track along the bottom edge doubles as a control: each
// segment jumps straight to its slide and restarts the hold timer so the
// auto-advance doesn't fire right after a manual pick. Users who opt out of
// motion get no auto-advance but can still drag and click through.
//
// Layout, scrim and slideshow chrome are shared with the other heroes — see
// components/page/PageHero and HeroSlides.


import { useEffect, useState } from "react";
import Image from "@/components/Image";
import HeroSlides from "@/components/page/HeroSlides";
import PageHero from "@/components/page/PageHero";
import { withBasePath } from "@/lib/basePath";
import { PHONE_QUERY, prefersReducedMotion } from "@/lib/media";
import { useHeroSlideshow } from "@/lib/useHeroSlideshow";

// Hold + slide timings (calm pacing). The caption flips at the midpoint of
// the slide, as the scroller commits the new index.
const HOLD_MS = 5000;
const SLIDE_MS = 1600;

// One slide = one background image + the film-stock caption that belongs to it.
// `meta` is [topLine, bottomLine]; bottomLine may be empty.
export type HeroSlide = { src: string; meta: [string, string] };

export default function FilmHero({
  slides,
  mobileSlides = [],
}: {
  slides: HeroSlide[];
  mobileSlides?: HeroSlide[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (mobileSlides.length === 0) return;
    const mq = window.matchMedia(PHONE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mobileSlides.length]);

  const useMobile = isMobile && mobileSlides.length > 0;
  return (
    <HeroSlideshow
      key={useMobile ? "mobile" : "desktop"}
      slides={useMobile ? mobileSlides : slides}
    />
  );
}

function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;

  // Bumped whenever the customer takes hold of the hero — a drag, or a pick
  // from the track — so the hold below restarts and an auto-advance never
  // fires on top of them.
  const [holdCycle, setHoldCycle] = useState(0);
  const restartHold = () => setHoldCycle((c) => c + 1);

  const slideshow = useHeroSlideshow({
    count,
    slideMs: SLIDE_MS,
    onUserTakeover: restartHold,
  });
  const { index, advance, paused } = slideshow;

  // The hold. Keyed on `index`, so every arrival — timed, dragged or picked —
  // starts a fresh one rather than resuming somebody else's remainder. No
  // auto-advance for reduced-motion users; they can still drag and pick.
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (prefersReducedMotion()) return;
    const t = window.setTimeout(advance, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, count, advance, holdCycle, paused]);

  // The caption follows the committed slide, which the scroller reports at the
  // halfway point of the move.
  const [metaTop, metaBottom] = slides[index]?.meta ?? ["", ""];

  return (
    <PageHero
      label="Film"
      title="Film"
      titleBearing={0.078}
      description="We carefully develop your film the way it deserves, so every frame comes back as rich as the moment you shot it."
      mobile="stacked"
      // Spans (not bare text) so the phone layout can turn the two lines into
      // side-by-side flex items; the <br> is hidden there.
      meta={
        <>
          <span>{metaTop}</span>
          {metaBottom && (
            <>
              <br />
              <span>{metaBottom}</span>
            </>
          )}
        </>
      }
      background={
        <HeroSlides
          slideshow={slideshow}
          noun="slide"
          onPick={restartHold}
          slides={slides.map((slide, i) => ({
            key: slide.src,
            content: (
              <Image
                src={withBasePath(slide.src)}
                alt=""
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : "eager"}
                sizes="100vw"
              />
            ),
          }))}
        />
      }
    />
  );
}
