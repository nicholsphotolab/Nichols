// VideoProcessSteps.tsx
// Interactive three-step process section on the video page.
// Left column lists the three steps; clicking switches the active step.
// Right column shows the items and descriptions for the active step.
// Items with an href render as links with the site-wide reveal-on-hover arrow.

"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, OUTPUTS } from "./videoTransferData";
import styles from "./VideoProcessSteps.module.css";

type Item = {
  name: string;
  description: string;
  href?: string; // if set, the item name becomes a linked reveal-on-hover
};

type Step = {
  label: string;
  items: Item[];
};

// Output descriptions keyed by the option names in videoTransferData.
const OUTPUT_DESCRIPTIONS: Record<string, string> = {
  USB: "Your footage loaded onto a USB drive to keep — easiest to share and back up.",
  "YOUR USB": "Bring your own drive and we load your footage onto it.",
  "DVD/CD": "Your memories burned to disc for easy playback on any player.",
};

const STEPS: Step[] = [
  {
    label: "Format",
    // Sourced from videoTransferData so the category cards, estimator, and
    // steps never drift. Tape/disc formats link to their category page;
    // reels appear as one item.
    items: CATEGORIES.flatMap((c) =>
      c.slug === "reels"
        ? [{ name: c.name, description: c.description, href: `/video/${c.slug}` }]
        : c.options.map((o) => ({
            name: o.name,
            description: o.description ?? "",
            href: `/video/${c.slug}`,
          }))
    ),
  },
  {
    label: "Output",
    items: OUTPUTS.map((o) => ({
      name: o.name,
      description: `${OUTPUT_DESCRIPTIONS[o.name] ?? ""} $${o.price}.00${o.recommended ? " — recommended." : "."}`,
    })),
  },
  {
    label: "Pickup",
    items: [
      {
        name: "Lab Pickup",
        description: "Pick up your originals and finished order at the lab.",
      },
      {
        name: "Discard",
        description: "We dispose of your original media after transfer.",
      },
      {
        name: "Ship",
        description: "We ship your originals and finished order to you. Starting at $8.00 depending on destination.",
      },
    ],
  },
];

export default function VideoProcessSteps() {
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
