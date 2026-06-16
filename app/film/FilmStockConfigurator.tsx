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
import Image from "next/image";
import { Row, Pills, QtyStepper } from "../components/ConfiguratorControls";
import QuoteCta from "../components/QuoteCta";
import styles from "./FilmStockConfigurator.module.css";

// Shape of a single film stock's pricing and option data.
// Defined here and imported by filmStocksData.ts where the actual values live.
export type FilmStock = {
  slug: "c-41" | "bw" | "e-6";
  name: string;
  basePrice: number;
  image: string; // path relative to /public
  sizes: string[];
  // Sheet dimensions (4X5, 5X7, 8X10) shown in a secondary row when the
  // SHEET size is selected. Billed per sheet — no exposure data.
  sheetSizes?: string[];
  outputs: string[];
  // Available exposure counts keyed by [size][output]. Missing = no EXP row shown.
  exposures: Partial<Record<string, Partial<Record<string, string[]>>>>;
  // Per-exposure surcharge in dollars, keyed by [size][output].
  perExposureRate: Partial<Record<string, Partial<Record<string, number>>>>;
  // Silent default exposure count per size — used in price calculation without
  // showing the EXP selector (e.g. disposable cameras are always 27 exp).
  defaultExposures?: Partial<Record<string, string>>;
  expExplanation?: string; // optional caption below the EXP row
};

// Adds the per-exposure surcharge to the base price when a size, output, and
// exposure count are known. Falls back to defaultExposures[size] when no
// explicit exp is selected (e.g. disposable cameras with a fixed count).
function computeUnitPrice(
  stock: FilmStock,
  size: string,
  output: string | null,
  exp: string | null
): number {
  let price = stock.basePrice;
  const resolvedExp = exp ?? stock.defaultExposures?.[size] ?? null;
  if (output && resolvedExp) {
    const rate = stock.perExposureRate[size]?.[output];
    const count = parseInt(resolvedExp, 10);
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
  const [sheetSize, setSheetSize] = useState<string | null>(null);
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

  // Selection summary handed to the /quote intake form by the CTA.
  const summary = `${stock.name} — ${size}${
    size === "SHEET" && sheetSize ? ` ${sheetSize}` : ""
  }${output && output !== "NONE" ? `, ${output}` : ""}${
    exp ? `, ${exp} exp` : ""
  } × ${qty} — estimated ${formatUSD(total)}`;

  return (
    <main className={styles.page}>
      <div className={styles.layout}>

        {/* Left column: product image */}
        <div className={styles.imageCol}>
          <div className={styles.image} aria-hidden="true">
            <Image src={stock.image} alt="" fill sizes="(max-width: 700px) 320px, 31vw" />
          </div>
        </div>

        {/* Right column: back navigation, title, live price, and all option selectors */}
        <div className={styles.body}>
          <button
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            ←
          </button>
          <header className={styles.header}>
            <h1 className={styles.title}>{stock.name}</h1>
            {/* Price updates in real-time as options change */}
            <p className={styles.price}>{formatUSD(total)}</p>
          </header>

          <p className={styles.priceLabel}>Estimated price</p>

          <div className={styles.rows}>
            <Row label="SIZE">
              <Pills values={stock.sizes} selected={size} onSelect={setSize} />
            </Row>

            <Row label="OUTPUT">
              <Pills values={stock.outputs} selected={output} onSelect={setOutput} />
            </Row>

            {/* Sheet dimensions take the EXP slot when SHEET is selected
                (sheet film is billed per sheet — no exposure count) */}
            {size === "SHEET" && (stock.sheetSizes?.length ?? 0) > 0 && (
              <Row label="SHEET SIZE">
                <Pills
                  values={stock.sheetSizes!}
                  selected={sheetSize}
                  onSelect={setSheetSize}
                />
              </Row>
            )}

            {/* EXP row only appears when the selected size+output has exposure options */}
            {output && expOptions.length > 0 && (
              <Row label="EXP" explanation={stock.expExplanation}>
                <Pills values={expOptions} selected={exp} onSelect={setExp} />
              </Row>
            )}

            <QtyStepper qty={qty} onChange={setQty} />
          </div>

          <QuoteCta summary={summary} />
        </div>
      </div>
    </main>
  );
}
