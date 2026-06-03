// FilmStockConfigurator.tsx
// Interactive pricing panel for a single film stock (C-41, B&W, or E-6).
// Rendered by app/film/[stock]/page.tsx. Accepts a FilmStock data object and
// lets the user select size, output type, exposure count, and quantity — then
// computes and displays the live price total.
//
// Layout: two-column grid — left column has the back button + product image,
// right column has the title, price, and all option rows.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./FilmStockConfigurator.module.css";

// Shape of a single film stock's pricing and option data.
// Defined here and imported by filmStocksData.ts where the actual values live.
export type FilmStock = {
  slug: "c-41" | "bw" | "e-6";
  name: string;
  basePrice: number;
  image: string; // path relative to /public
  sizes: string[];
  outputs: string[];
  // Available exposure counts keyed by [size][output]. Missing = no EXP row shown.
  exposures: Partial<Record<string, Partial<Record<string, string[]>>>>;
  // Per-exposure surcharge in dollars, keyed by [size][output].
  perExposureRate: Partial<Record<string, Partial<Record<string, number>>>>;
  expExplanation?: string; // optional caption below the EXP row
};

// Adds the per-exposure surcharge to the base price when a size, output, and
// exposure count are all selected.
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

export default function FilmStockConfigurator({ stock }: { stock: FilmStock }) {
  const router = useRouter();

  // Selection state — each row is independent except EXP which depends on size+output.
  const [size, setSize] = useState<string>(stock.sizes[0] ?? "");
  const [output, setOutput] = useState<string | null>(stock.outputs[0] ?? null);
  const [exp, setExp] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);

  // Recompute available exposures whenever size or output changes.
  const expOptions = useMemo(
    () => (output ? (stock.exposures[size]?.[output] ?? []) : []),
    [size, output, stock.exposures]
  );

  // If the previously-selected exposure no longer exists under the new size/output,
  // clear it. queueMicrotask avoids a setState-during-render warning.
  if (exp && !expOptions.includes(exp)) {
    queueMicrotask(() => setExp(null));
  }

  const unitPrice = computeUnitPrice(stock, size, output, exp);
  const total = unitPrice * qty;

  return (
    <main className={styles.page}>
      <div className={styles.layout}>

        {/* Left column: back navigation + product image */}
        <div className={styles.imageCol}>
          <button
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            ←
          </button>
          <div className={styles.image} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stock.image} alt="" />
          </div>
        </div>

        {/* Right column: title, live price, and all option selectors */}
        <div className={styles.body}>
          <header className={styles.header}>
            <h1 className={styles.title}>{stock.name}</h1>
            {/* Price updates in real-time as options change */}
            <p className={styles.price}>{formatUSD(total)}</p>
          </header>

          <p className={styles.priceLabel}>Price</p>

          <div className={styles.rows}>
            <Row label="SIZE">
              <Pills values={stock.sizes} selected={size} onSelect={setSize} />
            </Row>

            <Row label="OUTPUT">
              <Pills values={stock.outputs} selected={output} onSelect={setOutput} />
            </Row>

            {/* EXP row only appears when the selected size+output has exposure options */}
            {output && expOptions.length > 0 && (
              <Row label="EXP" explanation={stock.expExplanation}>
                <Pills values={expOptions} selected={exp} onSelect={setExp} />
              </Row>
            )}

            {/* Quantity stepper — minimum 1, no maximum */}
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

// A labeled option row with a horizontal rule beneath it.
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

// Renders a set of toggle buttons. Active pill gets the red background.
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
