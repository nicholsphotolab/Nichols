"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./ServicesCarousel.module.css";

type Card = {
  title: React.ReactNode;
  blurb: React.ReactNode;
  href: string;
  image?: string;
};

const CARDS: Card[] = [
  {
    title: "FILM",
    blurb: (
      <>
        Develop, scan, or print. 35mm, 110, 120, and sheet up to 8×10. C‑41,
        B&amp;W, E‑6. Push/pull on request.
      </>
    ),
    href: "#film",
    image: "/Hero-Film.webp",
  },
  {
    title: "PRINTS",
    blurb: (
      <>
        Any size up to 60×96. Fuji Professional Luster and more. Mount on board,
        gatorfoam, or masonite. Framed in-house.
      </>
    ),
    href: "#prints",
  },
  {
    title: "VIDEO",
    blurb: (
      <>
        VHS, VHS‑C, 8mm reels (3″–9″), cassettes, Hi‑8, and MiniDV transferred
        to digital. Home movies only.
      </>
    ),
    href: "#video",
  },
  {
    title: (
      <>
        PASSPORT
        <br />
        PHOTOS
      </>
    ),
    blurb: (
      <>
        US and most international. Canada, Australia, the Netherlands, and more.
        No appointment needed. Walk‑ins 9–4.
      </>
    ),
    href: "#passport",
  },
];

export default function ServicesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [rests, setRests] = useState<number[]>([]);
  const [isDesktop, setIsDesktop] = useState(true);

  // Measure rest positions whenever layout changes.
  const measure = useCallback(() => {
    const mq = window.matchMedia("(min-width: 1025px)");
    setIsDesktop(mq.matches);
    const track = trackRef.current;
    if (!track || !mq.matches) {
      setRests([]);
      return;
    }
    const PAD = 40;
    const distance = Math.max(0, track.scrollWidth - window.innerWidth);
    const cards = track.querySelectorAll<HTMLElement>(`.${styles.card}`);
    const next = Array.from(cards, (card) =>
      Math.min(distance, Math.max(0, card.offsetLeft - PAD))
    );
    setRests(next);
  }, []);

  useEffect(() => {
    measure();
    const mq = window.matchMedia("(min-width: 1025px)");
    window.addEventListener("resize", measure);
    mq.addEventListener("change", measure);
    return () => {
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
    };
  }, [measure]);

  // Clamp index when the cards count or breakpoint changes.
  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(rests.length - 1, i)));
  }, [rests.length]);

  const x = isDesktop && rests.length > 0 ? (rests[index] ?? 0) : 0;
  const showPrev = isDesktop && index > 0;
  const showNext = isDesktop && index < rests.length - 1;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      id="solutions"
      aria-label="Services"
    >
      {showPrev && (
        <button
          className={styles.arrow}
          data-dir="prev"
          aria-label="Previous service"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ←
        </button>
      )}
      {showNext && (
        <button
          className={styles.arrow}
          data-dir="next"
          aria-label="Next service"
          onClick={() =>
            setIndex((i) => Math.min(rests.length - 1, i + 1))
          }
        >
          →
        </button>
      )}

      <div className={styles.sticky}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{
            transform: isDesktop ? `translate3d(${-x}px, 0, 0)` : undefined,
          }}
        >
          {CARDS.map((card, i) => (
            <article key={i} className={styles.card}>
              <div className={styles.text}>
                <div className={styles.textInner}>
                  <h3 className={styles.title}>{card.title}</h3>
                  <p className={styles.blurb}>{card.blurb}</p>
                </div>
                <Link className={styles.more} href={card.href}>
                  Learn more <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className={styles.image} aria-hidden="true">
                {card.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image} alt="" />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
