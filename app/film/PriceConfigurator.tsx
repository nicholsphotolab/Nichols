"use client";

import { useMemo, useState } from "react";
import styles from "./PriceConfigurator.module.css";

export type FilmStock = {
  slug: "c-41" | "bw" | "e-6";
  name: string; // e.g. "C-41"
  basePrice: number; // e.g. 6.50
  image: string; // public path
  sizes: string[];
  outputs: string[];
  /** Available exposures keyed by size, then output.
   * Missing entry = no EXP row for that combo. */
  exposures: Partial<
    Record<string, Partial<Record<string, string[]>>>
  >;
  /** Per-exposure surcharge keyed by size, then output. */
  perExposureRate: Partial<
    Record<string, Partial<Record<string, number>>>
  >;
  /** Optional short caption beneath the EXP row. */
  expExplanation?: string;
};

// Per-exposure surcharge looked up by (size, output) from stock data.
function computeUnitPrice(
  stock: FilmStock,
  size: string,
  output: string | null,
  exp: string | null
): number {
  let price = stock.basePrice;
  if (output && exp) {
    const rate = stock.perExposureRate[size]?.[output];
    const count = parseInt(exp, 10);
    if (rate && !Number.isNaN(count)) price += rate * count;
  }
  return price;
}

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function PriceConfigurator({ stock }: { stock: FilmStock }) {
  const [size, setSize] = useState<string>(stock.sizes[0] ?? "");
  const [output, setOutput] = useState<string | null>(stock.outputs[0] ?? null);
  const [exp, setExp] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);

  // Available exposures depend on both the chosen size and output.
  const expOptions = useMemo(
    () =>
      output ? (stock.exposures[size]?.[output] ?? []) : [],
    [size, output, stock.exposures]
  );

  // Clear exposure when output changes if the prior selection no longer applies.
  if (exp && !expOptions.includes(exp)) {
    // Use functional update to avoid render-loop tripwire; this branch only
    // fires the frame after output changes.
    queueMicrotask(() => setExp(null));
  }

  const unitPrice = computeUnitPrice(stock, size, output, exp);
  const total = unitPrice * qty;

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.image} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stock.image} alt="" />
        </div>

        <div className={styles.body}>
          <header className={styles.header}>
            <h1 className={styles.title}>{stock.name}</h1>
            <p className={styles.price}>{formatUSD(total)}</p>
          </header>

          <p className={styles.priceLabel}>Price</p>

          <div className={styles.rows}>
            <Row label="SIZE">
              <Pills
                values={stock.sizes}
                selected={size}
                onSelect={setSize}
              />
            </Row>

            <Row label="OUTPUT">
              <Pills
                values={stock.outputs}
                selected={output}
                onSelect={setOutput}
              />
            </Row>

            {output && expOptions.length > 0 && (
              <Row
                label="EXP"
                explanation={stock.expExplanation}
              >
                <Pills
                  values={expOptions}
                  selected={exp}
                  onSelect={setExp}
                />
              </Row>
            )}

            <div className={styles.qtyRow}>
              <button
                className={styles.qtyBtn}
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                −
              </button>
              <span className={styles.qtyValue} aria-live="polite">
                {qty}
              </span>
              <button
                className={styles.qtyBtn}
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------- helpers ----------

function Row({
  label,
  explanation,
  children,
}: {
  label: string;
  explanation?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLine}>
        <span className={styles.rowLabel}>{label}</span>
        <div className={styles.rowOptions}>{children}</div>
      </div>
      {explanation && <p className={styles.rowExplain}>{explanation}</p>}
      <hr className={styles.rowDivider} />
    </div>
  );
}

function Pills<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: T[];
  selected: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <div className={styles.pills}>
      {values.map((v) => {
        const isActive = v === selected;
        return (
          <button
            key={v}
            type="button"
            className={styles.pill}
            data-active={isActive || undefined}
            onClick={() => onSelect(v)}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
