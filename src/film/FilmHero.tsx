// FilmHero.tsx
// The film page hero (Figma "Desktop - 102", node 3141:2025). The "FILM"
// wordmark and its description sit centred over the photo, under an even 20%
// black wash, while the photo advances on a calm rhythm (~5s hold, ~1.6s
// slide) — and can be dragged across at any point, because the photos sit in
// a scroll-snap container rather than being stacked and transformed (see
// useHeroSlideshow).
//
// Along the bottom, a black strip says what the photo on screen was shot on —
// stock, process, format — with the DX edge code that roll would carry for
// this frame (its position in the slideshow), then pause and ← / →. The
// details swap in place, like a caption, the moment the next photo is more
// than halfway on; the controls stay put. Phones drop the controls.
//
// Slides are generated at build time (FilmPage.tsx): a desktop set from
// public/FILM/ and an optional mobile set from public/FILM/mobile/ (mobile
// gets different photos/crops). The default export picks the set with a
// matchMedia check after mount — SSR always renders the desktop set, so
// mobile may briefly show the first desktop slide before swapping — and
// remounts the slideshow on a switch so indices/timers reset cleanly. Users
// who opt out of motion get no auto-advance but can still drag and step
// through.

import { useEffect, useRef, useState } from "react";
import DxEdgeCode from "@/components/DxEdgeCode";
import Image from "@/components/Image";
import HeroSlides, { SlideIndicator } from "@/components/page/HeroSlides";
import PageHero from "@/components/page/PageHero";
import { withBasePath } from "@/lib/basePath";
import { PHONE_QUERY, isPhone, prefersReducedMotion } from "@/lib/media";
import { useHeroSlideshow } from "@/lib/useHeroSlideshow";
import styles from "./FilmHero.module.css";

// Hold + slide timings (calm pacing).
const HOLD_MS = 5000;
const SLIDE_MS = 1600;

// The DX frame number of the first photo; the rest count on from it.
const START_FRAME = 1;

// One slide = one background image and what it was shot on. Written by
// scripts/generateStaticData.ts from the image's filename.
export type HeroSlide = { src: string; stock: string; process: string; format: string };

// "E-6" → "E6", as the strip prints it.
const processLabel = (process: string) => process.replace("-", "");


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

  // Bumped whenever the customer takes hold of the hero — a drag, or a step
  // with the arrows — so the hold below restarts and an auto-advance never
  // fires on top of them.
  const [holdCycle, setHoldCycle] = useState(0);
  const restartHold = () => setHoldCycle((c) => c + 1);

  // Phones get no Pause button (the strip is just the details there), so a
  // swipe is how you stop it: once someone has taken hold of the photos, the
  // slideshow stays where they leave it instead of moving on again.
  const pauseRef = useRef<(p: boolean) => void>(() => {});

  const slideshow = useHeroSlideshow({
    count,
    slideMs: SLIDE_MS,
    loop: true,
    onUserTakeover: () => {
      restartHold();
      if (isPhone()) pauseRef.current(true);
    },
  });
  const { index, advance, goTo, paused, setPaused } = slideshow;
  pauseRef.current = setPaused;

  // The hold. Keyed on `index`, so every arrival — timed, dragged or stepped —
  // starts a fresh one rather than resuming somebody else's remainder. No
  // auto-advance while paused, or for reduced-motion users; they can still
  // drag and step.
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (prefersReducedMotion()) return;
    const t = window.setTimeout(advance, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [index, count, advance, holdCycle, paused]);

  const step = (dir: 1 | -1) => {
    goTo(index + dir);
    restartHold();
  };

  return (
    <PageHero
      label="Film"
      title="Film"
      titleBearing={0.078}
      description="We carefully develop your film the way it deserves, so every frame comes back as rich as the moment you shot it."
      descriptionSpan={5}
      align="center"
      scrim="flat"
      mobile="stacked"
      background={
        <HeroSlides
          slideshow={slideshow}
          noun="slide"
          controls={false}
          loop
          slides={slides.map((s, i) => ({
            key: s.src,
            content: (
              <Image
                src={withBasePath(s.src)}
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
      cta={{ label: "Learn more", href: "#film-services" }}
      footer={
        <div className={styles.strip}>
          {/* Every photo's details, stacked in one spot with only the
              current photo's showing (see the stylesheet) — they swap like a
              caption as the photos change. Only the current frame is exposed
              to screen readers. */}
          <div className={styles.frames}>
            {slides.map((s, i) => (
              <div
                key={s.src}
                className={styles.frame}
                data-current={i === index || undefined}
                aria-hidden={i !== index || undefined}
              >
                {/* What this photo was shot on. A row on desktop; on a
                    phone, process / format over the stock. */}
                <p className={styles.shotOn}>
                  <span className={styles.stock}>{s.stock}</span>
                  <span className={styles.process}>{processLabel(s.process)}</span>
                  <span className={styles.slash} aria-hidden="true">
                    /
                  </span>
                  <span className={styles.format}>{s.format}</span>
                </p>

                {/* Every photo gets one, 120 included — real film only
                    carries it on 35mm, but here it's the strip's look. */}
                <div className={styles.edge}>
                  <DxEdgeCode stock={s.stock} frame={START_FRAME + i} />
                </div>
              </div>
            ))}
          </div>

          {count > 1 && (
            <div className={styles.controls}>
              {/* Stops the auto-advance — anything that moves on its own for
                  more than five seconds needs a way to stop it. */}
              <button
                type="button"
                className={styles.pause}
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              >
                {paused ? "Play" : "Pause"}
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => step(-1)}
                disabled={index === 0}
                aria-label="Previous photo"
              >
                <svg viewBox="0 0 16.2 15.12" aria-hidden="true" focusable="false">
                  <path d="M0 7.56L7.56 0L8.952 1.392L3.768 6.528H16.2V8.592H3.768L8.952 13.728L7.56 15.12L0 7.56Z" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => step(1)}
                aria-label="Next photo"
              >
                <svg viewBox="52.2 0 16.2 15.12" aria-hidden="true" focusable="false">
                  <path d="M59.448 13.728L64.632 8.592H52.2V6.528H64.632L59.448 1.392L60.84 0L68.4 7.56L60.84 15.12L59.448 13.728Z" />
                </svg>
              </button>
            </div>
          )}

          {/* Which photo this is, along the strip's top edge — the same
              track as the configurator galleries, in white. Last, so it
              paints over the controls' black. */}
          <SlideIndicator
            slideshow={slideshow}
            count={count}
            noun="photo"
            onPick={restartHold}
            placement="top"
          />
        </div>
      }
    />
  );
}
