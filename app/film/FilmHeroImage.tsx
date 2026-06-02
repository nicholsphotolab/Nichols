"use client";

import { useEffect, useState } from "react";
import styles from "./FilmHeroImage.module.css";

const CANISTERS = [
  { src: "/C41_Cutout.webp", alt: "C-41 35mm film canister" },
  { src: "/B%26W_Cutout.webp", alt: "B&W 35mm film canister" },
  { src: "/E-6_Cutout.webp", alt: "E-6 35mm film canister" },
];

const INTERVAL_MS = 1000;

export default function FilmHeroImage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Skip cycling for users who prefer reduced motion.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % CANISTERS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={styles.stack} aria-hidden="true">
      {CANISTERS.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={c.src}
          className={styles.frame}
          src={c.src}
          alt=""
          data-active={i === index || undefined}
        />
      ))}
    </div>
  );
}
