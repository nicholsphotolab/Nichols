// VideoTransferConfigurator.tsx
// Interactive price estimator for one video-transfer category (Tapes & Discs
// or Film Reels). Rendered by app/video/[category]/page.tsx. The user picks a
// format/size, an output, and a quantity; the estimated price updates live.
//
// This is an estimator, not a checkout — totals are framed as "Estimated
// price" and the CTA hands the selection summary to the /quote intake form.
// Output is added once per order (one USB/disc holds the whole transfer);
// the per-item price is multiplied by quantity.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Row, Pills, QtyStepper } from "../components/ConfiguratorControls";
import QuoteCta from "../components/QuoteCta";
import { OUTPUTS, type VideoCategory } from "./videoTransferData";
import styles from "./VideoTransferConfigurator.module.css";

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

const RECOMMENDED_OUTPUT =
  OUTPUTS.find((o) => o.recommended) ?? OUTPUTS[0];

export default function VideoTransferConfigurator({
  category,
}: {
  category: VideoCategory;
}) {
  const router = useRouter();

  const [option, setOption] = useState<string>(category.options[0].name);
  // USB is the recommended output, so it starts selected.
  const [output, setOutput] = useState<string>(RECOMMENDED_OUTPUT.name);
  const [qty, setQty] = useState<number>(1);

  const unitPrice =
    category.options.find((o) => o.name === option)?.price ?? 0;
  const outputPrice = OUTPUTS.find((o) => o.name === output)?.price ?? 0;
  const total = unitPrice * qty + outputPrice;

  const summary = `${category.name} — ${option} × ${qty}, output: ${output} — estimated ${formatUSD(total)}`;

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.body}>
          <button
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            ←
          </button>

          <header className={styles.header}>
            <h1 className={styles.title}>{category.name}</h1>
            {/* Estimate updates in real-time as options change */}
            <p className={styles.price}>{formatUSD(total)}</p>
          </header>

          <p className={styles.priceLabel}>Estimated price</p>

          <div className={styles.rows}>
            <Row
              label={category.selectorLabel}
              explanation={category.selectorExplanation}
            >
              <Pills
                values={category.options.map((o) => o.name)}
                selected={option}
                onSelect={setOption}
              />
            </Row>

            <Row
              label="OUTPUT"
              explanation={`${RECOMMENDED_OUTPUT.name} recommended — easiest to share and back up. Added once per order.`}
            >
              <Pills
                values={OUTPUTS.map((o) => o.name)}
                selected={output}
                onSelect={setOutput}
                format={(name) => {
                  const out = OUTPUTS.find((o) => o.name === name)!;
                  return `${out.name} · $${out.price}`;
                }}
              />
            </Row>

            <QtyStepper qty={qty} onChange={setQty} />
          </div>

          <QuoteCta summary={summary} />
        </div>
      </div>
    </main>
  );
}
