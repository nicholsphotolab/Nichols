// FilmStockConfigurator.tsx
// Interactive pricing panel for a single film stock (C-41, B&W, or E-6).
// Rendered by app/film/[stock]/page.tsx with an initial slug. The TYPE row lets
// the user switch stock in place (swapping image, copy, and pricing) without
// navigating. Selecting size, output, and exposure recomputes an itemized
// estimate that totals into the headline price.
//
// Layout mirrors the Figma "Desktop - 54" design: a ~50/50 two-column grid with
// the product image on the left and, on the right, a title + blurb, hairline-
// separated option rows (TYPE / SIZE / OUTPUT / EXPOSURE), an itemized
// ESTIMATED TOTAL, the headline price, and a closing notice.

"use client";

import { useState } from "react";
import Image from "next/image";
import { Pills } from "../components/ConfiguratorControls";
import { STOCKS } from "./filmStocksData";
import { withBasePath } from "../lib/basePath";
import styles from "./FilmStockConfigurator.module.css";

// Shape of a single film stock's pricing and option data.
// Defined here and imported by filmStocksData.ts where the actual values live.
export type FilmStock = {
  slug: "c-41" | "bw" | "e-6";
  name: string;
  // One-line plain-language description shown under the title.
  blurb: string;
  basePrice: number;
  image: string; // path relative to /public
  // Optional per-size image overrides, keyed by size. Falls back to `image`.
  sizeImages?: Partial<Record<string, string>>;
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

// ---------- Display maps ----------
// TYPE pills, in Figma order. Values are slugs; labels come from the stock data.
const TYPE_ORDER: FilmStock["slug"][] = ["c-41", "bw", "e-6"];

// Shorten the data value for display without changing the selection value.
const SIZE_LABELS: Record<string, string> = { "DISPOSABLE CAMERA": "DISPOSABLE" };

// OUTPUT pills: render order + labels matching the Figma.
const OUTPUT_ORDER = ["SCANS", "PRINTS/SCANS", "NONE"];
const OUTPUT_LABELS: Record<string, string> = {
  SCANS: "SCANS ONLY",
  "PRINTS/SCANS": "PRINTS + SCANS",
  NONE: "DEVELOP ONLY",
};
// How the scan surcharge reads in the itemized breakdown.
const SCAN_LINE_LABEL: Record<string, string> = {
  SCANS: "Standard Scans",
  "PRINTS/SCANS": "Prints + Scans",
};

type LineItem = { name: string; sub?: string; amount: number };

// Short plain-language explanation shown in the tooltip beside each row label.
const ROW_INFO: Record<string, string> = {
  Type: "C-41 is standard color film, B&W is black & white, and E-6 is color slide (reversal) film.",
  Size: "The format you shot: 35mm, a disposable camera, 120, 110, or sheet film.",
  Output: "What you get back — scans only, prints plus scans, or develop only.",
  Exposure: "The number of frames on your roll, usually 24 or 36.",
};

// Row label with an info icon that reveals a tooltip on hover or keyboard focus.
function RowLabel({ label }: { label: string }) {
  const info = ROW_INFO[label];
  return (
    <span className={styles.rowLabel}>
      {label}
      {info && (
        <span className={styles.info}>
          <button
            type="button"
            className={styles.infoBtn}
            aria-label={`About ${label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath("/info.svg")} alt="" width={18} height={18} aria-hidden="true" />
          </button>
          <span role="tooltip" className={styles.tooltip}>
            {info}
          </span>
        </span>
      )}
    </span>
  );
}

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

// Builds the itemized estimate from the current selection. Development is always
// charged; a scans line is added when an output that includes scanning is paired
// with a resolvable exposure count (explicit or the silent default).
function buildBreakdown(
  stock: FilmStock,
  size: string,
  output: string | null,
  exp: string | null
): LineItem[] {
  const items: LineItem[] = [
    { name: `${stock.name} Development`, amount: stock.basePrice },
  ];

  const resolvedExp = exp ?? stock.defaultExposures?.[size] ?? null;
  if (output && output !== "NONE" && resolvedExp) {
    const rate = stock.perExposureRate[size]?.[output];
    const count = parseInt(resolvedExp, 10);
    if (rate && !Number.isNaN(count)) {
      const sizeLabel = (SIZE_LABELS[size] ?? size).toLowerCase();
      items.push({
        name: `${sizeLabel} ${SCAN_LINE_LABEL[output] ?? "Scans"}`,
        sub: `${formatUSD(rate)} × ${resolvedExp}EXP`,
        amount: rate * count,
      });
    }
  }

  return items;
}

// Default selection for a stock: 35MM / SCANS / 36 exposures when available,
// which reproduces the Figma's resting state. Falls back gracefully per stock.
function defaultsFor(stock: FilmStock) {
  const size = stock.sizes.includes("35MM") ? "35MM" : stock.sizes[0] ?? "";
  const output = stock.outputs.includes("SCANS") ? "SCANS" : stock.outputs[0] ?? null;
  const exps = output ? stock.exposures[size]?.[output] ?? [] : [];
  const exp = exps.includes("36") ? "36" : exps[0] ?? null;
  return { size, output, exp };
}

export default function FilmStockConfigurator({
  initialSlug,
}: {
  initialSlug: string;
}) {
  const [slug, setSlug] = useState<string>(initialSlug);
  const stock = STOCKS[slug] ?? STOCKS[initialSlug];

  const init = defaultsFor(stock);
  const [size, setSize] = useState<string>(init.size);
  const [output, setOutput] = useState<string | null>(init.output);
  const [exp, setExp] = useState<string | null>(init.exp);

  // Exposure options for the current size+output. Missing → no EXPOSURE row.
  const expOptions = output ? stock.exposures[size]?.[output] ?? [] : [];

  // Keep the exposure selection valid as size/output change: auto-pick 36 (or
  // the first option) when entering a size that has exposures, and clear it when
  // the size has none. queueMicrotask avoids a setState-during-render warning.
  if (expOptions.length > 0 && (!exp || !expOptions.includes(exp))) {
    queueMicrotask(() => setExp(expOptions.includes("36") ? "36" : expOptions[0]));
  } else if (expOptions.length === 0 && exp) {
    queueMicrotask(() => setExp(null));
  }

  // Switching TYPE swaps the stock but keeps the current size/output/exposure
  // selections. Any selection the new stock doesn't offer is corrected by the
  // validity guards below (size) and the exposure logic above.
  function selectType(next: string) {
    if (STOCKS[next]) setSlug(next);
  }

  // Keep size valid across a type switch — fall back to 35MM (or the first
  // size) only if the new stock doesn't offer the current one (e.g. E-6 has no 110).
  if (!stock.sizes.includes(size)) {
    queueMicrotask(() =>
      setSize(stock.sizes.includes("35MM") ? "35MM" : stock.sizes[0] ?? "")
    );
  }

  const breakdown = buildBreakdown(stock, size, output, exp);
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // Use a per-size image when the stock defines one (e.g. C-41 + 120).
  const imageSrc = stock.sizeImages?.[size] ?? stock.image;

  // Outputs/sizes in Figma display order, filtered to what this stock offers.
  const outputValues = OUTPUT_ORDER.filter((o) => stock.outputs.includes(o));

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        {/* Left column: product image */}
        <div className={styles.imageCol}>
          <div className={styles.image} aria-hidden="true">
            <Image
              src={withBasePath(imageSrc)}
              alt=""
              fill
              sizes="(max-width: 900px) 360px, 31vw"
            />
          </div>
        </div>

        {/* Right column: title + blurb, option rows, estimate, price, notice */}
        <div className={styles.body}>
          <header className={styles.header}>
            <h1 className={styles.title}>{stock.name}</h1>
            <p className={styles.blurb}>{stock.blurb}</p>
          </header>

          <hr className={styles.divider} />

          <div className={styles.rows}>
            <div className={styles.row}>
              <RowLabel label="Type" />
              <Pills
                values={TYPE_ORDER}
                selected={slug as FilmStock["slug"]}
                onSelect={selectType}
                format={(s) => STOCKS[s]?.name ?? s}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label="Size" />
              <Pills
                values={stock.sizes}
                selected={size}
                onSelect={setSize}
                format={(v) => SIZE_LABELS[v] ?? v}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label="Output" />
              <Pills
                values={outputValues}
                selected={output}
                onSelect={setOutput}
                format={(v) => OUTPUT_LABELS[v] ?? v}
              />
            </div>

            {/* EXPOSURE row only when the size+output offers exposure counts */}
            {expOptions.length > 0 && (
              <div className={styles.row}>
                <RowLabel label="Exposure" />
                <Pills values={expOptions} selected={exp} onSelect={setExp} />
              </div>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Itemized estimate */}
          <div className={styles.total}>
            <span className={styles.totalLabel}>Estimated total</span>
            <div className={styles.breakdown}>
              {breakdown.map((item) => (
                <div className={styles.lineItem} key={item.name}>
                  <span className={styles.lineLabel}>
                    <span className={styles.lineName}>{item.name}</span>
                    {item.sub && <span className={styles.lineSub}>{item.sub}</span>}
                  </span>
                  <span className={styles.lineAmount}>{formatUSD(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className={styles.divider} />

          <p className={styles.price} aria-live="polite">
            {formatUSD(total)}
          </p>

          <p className={styles.notice}>
            <span className={styles.noticeLabel}>*Notice*</span>
            <span className={styles.noticeText}>
              Final price will be calculated when film is finished developing and
              scanning.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
