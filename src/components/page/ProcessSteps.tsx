// ProcessSteps.tsx
// The "how it works" section on the film and video pages. Left column lists
// the numbered steps; clicking one switches the active step. Right column
// shows the items and descriptions for the active step. Items with an href
// render as links with the site-wide reveal-on-hover arrow. An optional intro
// line above the steps carries copy that's reassurance rather than a decision
// (film's in-house/hands-on trust line), so it isn't its own step.

import { useState, type ReactNode } from "react";
import Link from "@/components/SmartLink";
import styles from "./ProcessSteps.module.css";

export type ProcessItem = {
  name: string;
  description: string;
  /** If set, the item name becomes a linked reveal-on-hover. */
  href?: string;
};

export type ProcessStep = {
  label: string;
  items: ProcessItem[];
};

export default function ProcessSteps({
  steps,
  intro,
}: {
  steps: ProcessStep[];
  intro?: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];

  return (
    <section className={styles.section} aria-label="How it works">
      {intro && <p className={styles.intro}>{intro}</p>}

      <div className={styles.layout}>
        {/* Left: numbered step list */}
        <nav className={styles.stepList} aria-label="Process steps">
          {steps.map((step, i) => (
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
