"use client";

import { useId, useState } from "react";
import styles from "./PassportPackages.module.css";

type Package = {
  name: string;
  price: string;
  description: string;
};

const PACKAGES: Package[] = [
  {
    name: "US PASSPORTS",
    price: "Starting at $6.50",
    description:
      "Official 2×2 in. passport photo that meets U.S. State Department specifications. Includes two printed photos plus a digital copy emailed to you for online applications. Taken and printed in-house while you wait.",
  },
  {
    name: "INTERNATIONAL PASSPORTS",
    price: "$32.00",
    description:
      "Passport photo sized to your destination's exact requirements. Canada, Australia, China, and most other countries. Includes printed photos plus a digital copy emailed to you. Taken and printed in-house while you wait.",
  },
];

function PackageCard({ pkg }: { pkg: Package }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className={styles.card} data-open={open}>
      <button
        type="button"
        className={styles.cardToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.cardImage} aria-hidden="true" />
        <span className={styles.cardMeta}>
          <span className={styles.cardText}>
            <span className={styles.cardName}>{pkg.name}</span>
            <span className={styles.cardPrice}>{pkg.price}</span>
          </span>
          <span className={styles.cardArrow} aria-hidden="true">
            ↑
          </span>
        </span>
      </button>

      <div
        className={styles.cardPanel}
        id={panelId}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.cardPanelInner}>
          <p className={styles.cardDescription}>{pkg.description}</p>
        </div>
      </div>

      <hr className={styles.cardDivider} />
    </article>
  );
}

export default function PassportPackages() {
  return (
    <section className={styles.packages} aria-label="Passport packages">
      <h2 className={styles.packagesHeading}>PASSPORT PACKAGES</h2>
      <div className={styles.cards}>
        {PACKAGES.map((p) => (
          <PackageCard key={p.name} pkg={p} />
        ))}
      </div>
    </section>
  );
}
