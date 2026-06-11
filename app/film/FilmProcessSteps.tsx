// FilmProcessSteps.tsx
// Interactive three-step process section on the film page.
// Left column lists the three steps; clicking switches the active step.
// Right column shows the items and descriptions for the active step.
// Items with an href render as links with the site-wide reveal-on-hover arrow.

"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./FilmProcessSteps.module.css";

type Item = {
  name: string;
  description: string;
  href?: string; // if set, the item name becomes a linked reveal-on-hover
};

type Step = {
  label: string;
  items: Item[];
};

const STEPS: Step[] = [
  {
    label: "Processing",
    items: [
      {
        name: "C-41",
        description: "Color negative film. The most common process, compatible with 35mm, 110, 120, and sheet film.",
        href: "/film/c-41",
      },
      {
        name: "B&W",
        description: "Black and white negative film developed in-house with precision chemistry.",
        href: "/film/bw",
      },
      {
        name: "E-6",
        description: "Slide and reversal film processed to a positive transparency. Available in 35mm, 120, and sheet formats.",
        href: "/film/e-6",
      },
    ],
  },
  {
    label: "Output",
    items: [
      {
        name: "Develop Only",
        description: "We'll only develop your film. No scans or prints included.",
      },
      {
        name: "Scans",
        description: "Your film will be developed, then scanned digitally. Once paid for it will be sent to your email via a dropbox link.",
      },
      {
        name: "Scans & Prints",
        description: "Get both physical prints and digital scans of your images. Once paid for it will be sent to your email via a dropbox link",
      },
    ],
  },
  {
    label: "Pickup",
    items: [
      {
        name: "Lab Pickup",
        description: "Pick up your finished order at the lab. ",
      },
      {
        name: "Discard",
        description: "We dispose of your film after processing",
      },
      {
        name: "Ship",
        description: "We ship your finished order to you. Starting at $8.00 depending on destination.",
      },
    ],
  },
];

export default function FilmProcessSteps() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = STEPS[activeIndex];

  return (
    <section className={styles.section} aria-label="How it works">
      <div className={styles.layout}>

        {/* Left: numbered step list */}
        <nav className={styles.stepList} aria-label="Process steps">
          {STEPS.map((step, i) => (
            <button
              key={step.label}
              className={styles.stepBtn}
              data-active={i === activeIndex || undefined}
              onClick={() => setActiveIndex(i)}
              aria-pressed={i === activeIndex}
            >
              <span className={styles.stepNum}>({i + 1})</span>
              {step.label}
            </button>
          ))}
        </nav>

        {/* Right: items for the active step */}
        <div className={styles.itemList} aria-live="polite">
          {activeStep.items.map((item, i) => (
            <div key={item.name} className={styles.item}>
              {i === 0 && <hr className={styles.itemDivider} />}
              <div className={styles.itemRow}>
                {item.href ? (
                  <Link href={item.href} className={`${styles.itemName} ${styles.itemLink} reveal-on-hover`}>
                    {item.name}<span className="reveal-arrow" aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <span className={styles.itemName}>{item.name}</span>
                )}
                <span className={styles.itemDescription}>{item.description}</span>
              </div>
              <hr className={styles.itemDivider} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
