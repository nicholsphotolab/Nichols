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
  // Sheet dimensions (4X5, 5X7, 8X10) shown in a secondary row in place of
  // EXPOSURE when the SHEET format is selected. Billed per sheet.
  sheetSizes?: string[];
  outputs: string[];
  // Available exposure counts keyed by [size][output]. Missing = no EXP row shown.
  exposures: Partial<Record<string, Partial<Record<string, string[]>>>>;
  // Per-exposure surcharge in dollars, keyed by [size][output].
  perExposureRate: Partial<Record<string, Partial<Record<string, number>>>>;
  // Per-sheet surcharge in dollars, keyed by [sheetSize][output]. Placeholder
  // pricing until real sheet rates are set.
  sheetSizeRates?: Partial<Record<string, Partial<Record<string, number>>>>;
  // Silent default exposure count per size — used in price calculation without
  // showing the EXP selector (e.g. disposable cameras are always 27 exp).
  defaultExposures?: Partial<Record<string, string>>;
};

// Per-stock gallery, built server-side in [stock]/page.tsx from the size
// subfolders under public/FILM/gallery/<slug>/ (e.g. 35mm/, 120/, Disposable/).
// `product` holds any loose images at the stock's gallery root — shared shots
// shown first for every size. `bySize` maps a SIZE pill value (e.g. "35MM",
// "DISPOSABLE CAMERA", "120") to the photos in that size's folder. The bottom
// carousel shows only `product` + the selected size's images, so switching
// size swaps the strip entirely.
export type StockGallery = {
  product: string[];
  bySize: Record<string, string[]>;
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
  Format: "The format you shot: 35mm, a disposable camera, 120, 110, or sheet film.",
  Output: "What you get back — scans only, prints plus scans, or develop only.",
  Exposure: "The number of frames on your roll, usually 24 or 36.",
  "Sheet Size": "The sheet film dimensions you're developing: 4x5, 5x7, or 8x10.",
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
  exp: string | null,
  sheetSize: string | null
): LineItem[] {
  const items: LineItem[] = [
    { name: `${stock.name} Development`, amount: stock.basePrice },
  ];

  if (size === "SHEET") {
    if (output && output !== "NONE" && sheetSize) {
      const rate = stock.sheetSizeRates?.[sheetSize]?.[output];
      if (rate) {
        items.push({
          name: `${sheetSize.toLowerCase()} ${SCAN_LINE_LABEL[output] ?? "Scans"}`,
          sub: "per sheet",
          amount: rate,
        });
      }
    }
    return items;
  }

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
  galleries,
}: {
  initialSlug: string;
  // Per-stock galleries, built server-side by [stock]/page.tsx from the size
  // subfolders under public/FILM/gallery/<slug>/. Keyed by slug for every stock
  // since TYPE switches stocks client-side.
  galleries: Record<string, StockGallery>;
}) {
  const [slug, setSlug] = useState<string>(initialSlug);
  const stock = STOCKS[slug] ?? STOCKS[initialSlug];

  // State holds the *raw* selections as the user made them; anything the
  // current stock/format combination doesn't offer is corrected by deriving
  // an effective value at render time (below) rather than by writing state
  // back. That keeps every render a pure function of the selections — no
  // corrective re-renders — and means a remembered choice (e.g. 24 EXP)
  // reapplies by itself when the user switches back to a format that has it.
  const init = defaultsFor(stock);
  const [sizeSel, setSizeSel] = useState<string>(init.size);
  const [output, setOutput] = useState<string | null>(init.output);
  const [expSel, setExpSel] = useState<string | null>(init.exp);
  const [sheetSizeSel, setSheetSizeSel] = useState<string | null>(null);

  // Effective format: fall back to 35MM (or the first size) only if the
  // current stock doesn't offer the selected one (e.g. E-6 has no 110).
  const size = stock.sizes.includes(sizeSel)
    ? sizeSel
    : stock.sizes.includes("35MM")
      ? "35MM"
      : stock.sizes[0] ?? "";

  // Exposure options for the current size+output. Missing → no EXPOSURE row.
  // SHEET has no entry in `exposures`, so this is naturally empty for it.
  // Effective exposure: the selection when valid, else 36 (or the first
  // option), else null when this combination has no exposure counts.
  const expOptions = output ? stock.exposures[size]?.[output] ?? [] : [];
  const exp =
    expSel && expOptions.includes(expSel)
      ? expSel
      : expOptions.length > 0
        ? expOptions.includes("36")
          ? "36"
          : expOptions[0]
        : null;

  // SHEET format shows a Sheet Size row (4x5/5x7/8x10) in place of EXPOSURE.
  // Effective sheet size follows the same pattern, defaulting to 4X5.
  const sheetSizeOptions = size === "SHEET" ? stock.sheetSizes ?? [] : [];
  const sheetSize =
    sheetSizeSel && sheetSizeOptions.includes(sheetSizeSel)
      ? sheetSizeSel
      : sheetSizeOptions.includes("4X5")
        ? "4X5"
        : sheetSizeOptions[0] ?? null;

  // Gallery for the current stock + size. The bottom carousel shows only the
  // shared product shots plus the photos in the selected size's folder, so
  // switching size (or type) swaps the strip entirely — C-41 · 35MM never
  // shows 120 or Disposable photos, and vice versa. Sizes with no folder fall
  // back to the stock's per-size product shot, then its generic product image.
  // The raw index is clamped so a switch to a shorter strip can't overshoot.
  const stockGallery = galleries[slug];
  const gallery = [
    ...(stockGallery?.product ?? []),
    ...(stockGallery?.bySize[size] ?? []),
  ];
  const [galleryIdxSel, setGalleryIdxSel] = useState(0);
  const galleryIdx = Math.min(galleryIdxSel, Math.max(gallery.length - 1, 0));

  // Whether the next track move should glide. Thumbnail clicks slide; switching
  // type/format resets to the first slide instantly (the whole set swaps, so a
  // glide across unrelated images looks wrong).
  const [animateSlide, setAnimateSlide] = useState(true);

  // The slides rendered in the sliding frame. When a size has no photos we
  // still show a single fallback slide (its per-size product shot, then the
  // stock's generic product image).
  const slides =
    gallery.length > 0 ? gallery : [stock.sizeImages?.[size] ?? stock.image];

  // Portrait product shots fill the frame's height and sit on its bottom edge.
  // Landscape shots leave vertical slack, so we vertically center them instead
  // of bottom-anchoring (which would strand them against the bottom). Detected
  // per photo from its natural dimensions once loaded, keyed by src.
  const [landscape, setLandscape] = useState<Record<string, boolean>>({});

  // Any change to the visible strip restarts it from the first photo, without
  // gliding — the set changes, so the reset should be instant.
  function selectFormat(next: string) {
    setSizeSel(next);
    setGalleryIdxSel(0);
    setAnimateSlide(false);
  }

  // Switching TYPE swaps the stock but keeps the raw selections — the
  // derivations above absorb anything the new stock doesn't offer.
  function selectType(next: string) {
    if (STOCKS[next]) {
      setSlug(next);
      setGalleryIdxSel(0);
      setAnimateSlide(false);
    }
  }

  const breakdown = buildBreakdown(stock, size, output, exp, sheetSize);
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // Outputs/sizes in Figma display order, filtered to what this stock offers.
  const outputValues = OUTPUT_ORDER.filter((o) => stock.outputs.includes(o));

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        {/* Left column: main photo + thumbnail strip. The column stretches to
            the right column's height so the thumbs bottom-align with the
            price block; the photo fits (contain) in the remaining space,
            anchored to the bottom. */}
        <div className={styles.imageCol}>
          <div className={styles.image} aria-hidden="true">
            {/* Horizontal track: all slides sit side by side and the track
                slides by one frame width per gallery index. */}
            <div
              className={styles.track}
              data-instant={!animateSlide || undefined}
              style={{ transform: `translateX(-${galleryIdx * 100}%)` }}
            >
              {slides.map((src) => (
                <div key={src} className={styles.slide}>
                  <Image
                    src={withBasePath(src)}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 46vw"
                    data-landscape={landscape[src] || undefined}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const isLandscape = img.naturalWidth > img.naturalHeight;
                      setLandscape((m) =>
                        m[src] === isLandscape ? m : { ...m, [src]: isLandscape }
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Apple Photos-style thumbs: uniform square tiles, each photo
              scaled to fit inside at its own ratio (plain <img> so it keeps
              natural proportions — the selection border in the CSS wraps the
              photo itself, not the square). */}
          {gallery.length > 1 && (
            <div className={styles.thumbs} role="group" aria-label="Product photos">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={styles.thumb}
                  data-active={i === galleryIdx || undefined}
                  aria-pressed={i === galleryIdx}
                  aria-label={`Photo ${i + 1} of ${gallery.length}`}
                  onClick={() => {
                    setAnimateSlide(true);
                    setGalleryIdxSel(i);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBasePath(src)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
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
              <RowLabel label="Format" />
              <Pills
                values={stock.sizes}
                selected={size}
                onSelect={selectFormat}
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
                <Pills values={expOptions} selected={exp} onSelect={setExpSel} />
              </div>
            )}

            {/* SHEET format swaps EXPOSURE for a Sheet Size row (4x5/5x7/8x10) */}
            {sheetSizeOptions.length > 0 && (
              <div className={styles.row}>
                <RowLabel label="Sheet Size" />
                <Pills
                  values={sheetSizeOptions}
                  selected={sheetSize}
                  onSelect={setSheetSizeSel}
                />
              </div>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Itemized estimate */}
          <div className={styles.total}>
            <div className={styles.totalHead}>
              <span className={styles.totalLabel}>Estimated total</span>
              <p className={styles.noticeText}>
                Final price will be calculated when film is finished developing
                and scanning.
              </p>
            </div>
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
        </div>
      </div>
    </main>
  );
}
