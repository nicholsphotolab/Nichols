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
//
// Below all that sits the running order: "Add to order" snapshots the current
// selection as a line item and resets the option rows for the next roll, so one
// visit can cover several rolls of different types. The list, its total, and the
// printable order form live in OrderList/OrderForm; this component owns the line
// state and is the single place that writes it to localStorage.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pills } from "../components/ConfiguratorControls";
import AddedToOrder from "../components/AddedToOrder";
import MoreProducts from "../components/MoreProducts";
import { STOCKS } from "./filmStocksData";
import { withBasePath } from "../lib/basePath";
import { buildQuery, matchOption, slugifyOption } from "../lib/urlState";
import { useOrder } from "../components/OrderProvider";
import type { NewOrderLine } from "../lib/orderDraft";
import { summarizeLine } from "../lib/orderPricing";
import {
  buildBreakdown,
  defaultsFor,
  formatUSD,
  OUTPUT_LABELS,
  OUTPUT_ORDER,
  SIZE_LABELS,
} from "./filmPricing";
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
  // Per-size PRODUCT SHOT, always the first slide in the gallery lineup.
  // Sizes without one show the temporary bw-600 placeholder block instead.
  // SHEET shots can be keyed per sheet size ("SHEET/4X5"); the plain "SHEET"
  // key acts as the fallback for sheet sizes without their own shot.
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
  // Per-sheet output surcharge in dollars, keyed by [sheetSize][output] —
  // scans flat across sizes, prints+scans adds the print on top.
  sheetSizeRates?: Partial<Record<string, Partial<Record<string, number>>>>;
  // Per-sheet DEVELOPMENT fee keyed by sheet size — used in place of the
  // roll basePrice when the SHEET format is selected.
  sheetDevRates?: Partial<Record<string, number>>;
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

// Display labels (SIZE_LABELS / OUTPUT_ORDER / OUTPUT_LABELS) and the pricing
// maths (buildBreakdown / defaultsFor / formatUSD) live in filmPricing.ts —
// the order list and the printable order form price already-added rolls with
// the same functions.

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

  // ---------- Running order ----------
  // The order itself lives in OrderProvider (mounted in the root layout) so the
  // nav's cart button can read it from any page. This component only appends to
  // it; the cart drawer handles viewing, removing, and printing.
  const { addLine, count, openCart } = useOrder();

  // Transient confirmation after an add — the cart is up in the nav, so the
  // button needs to say something happened where the customer is looking.
  const [addedNote, setAddedNote] = useState<string | null>(null);

  // Product shot of whatever the note is about, held separately so the
  // confirmation band keeps showing what was added even after the customer
  // starts configuring the next roll.
  const [addedShot, setAddedShot] = useState<string | null>(null);

  // No timer here: AddedToOrder owns the toast's whole visible lifecycle, since
  // dismissal has to answer to the pointer (it holds while hovered) and only
  // the toast knows where the pointer is. The note is left set, and a new one —
  // always a new string, since it carries the running item count — is what
  // raises the next toast.

  // Restore customization from the URL once on mount (?format=…&output=…&
  // exp=…&sheet=…). The page is statically pre-rendered with defaults, so the
  // query must be applied after hydration, not during the first render.
  // Values are matched against this stock's real option lists — anything
  // unknown is ignored, and the derivations below absorb any impossible
  // combination. Declared before the URL-sync effect below so the query is
  // captured before the first rewrite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const format = matchOption(params.get("format"), stock.sizes);
    if (format) setSizeSel(format);
    const out = matchOption(params.get("output"), stock.outputs);
    if (out) setOutput(out);
    const exp = params.get("exp");
    if (exp && /^\d+$/.test(exp)) setExpSel(exp);
    const sheet = matchOption(params.get("sheet"), stock.sheetSizes ?? []);
    if (sheet) setSheetSizeSel(sheet);
    // Mount-only: the URL is an input here, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Mirror the visible selection into the URL: path = stock, query = the
  // customization with defaults omitted, so uncustomized URLs stay clean and
  // a refresh (or shared link) restores exactly what's on screen.
  // replaceState rewrites the current history entry — pill clicks never stack
  // up in Back; Back always exits to the page the user came from.
  useEffect(() => {
    const d = defaultsFor(stock);
    const expOpts = output ? stock.exposures[size]?.[output] ?? [] : [];
    const defaultExp =
      expOpts.length > 0 ? (expOpts.includes("36") ? "36" : expOpts[0]) : null;
    const sheetOpts = size === "SHEET" ? stock.sheetSizes ?? [] : [];
    const defaultSheet = sheetOpts.includes("4X5")
      ? "4X5"
      : sheetOpts[0] ?? null;

    const query = buildQuery({
      format: size !== d.size ? slugifyOption(size) : null,
      output: output && output !== d.output ? slugifyOption(output) : null,
      exp: exp && exp !== defaultExp ? exp : null,
      sheet:
        sheetSize && sheetSize !== defaultSheet
          ? slugifyOption(sheetSize)
          : null,
    });
    window.history.replaceState(null, "", withBasePath(`/film/${slug}`) + query);
  }, [slug, stock, size, output, exp, sheetSize]);

  // Gallery for the current stock + size. The bottom carousel shows only the
  // shared product shots plus the photos in the selected size's folder, so
  // switching size (or type) swaps the strip entirely — C-41 · 35MM never
  // shows 120 or Disposable photos, and vice versa. SHEET adds the selected
  // sheet size's photos (keyed "SHEET/4X5" etc. by the server-side scan), so
  // flipping 4x5 → 8x10 swaps the strip too. Sizes with no folder fall back
  // to the stock's per-size product shot, then its generic product image.
  // The raw index is clamped so a switch to a shorter strip can't overshoot.
  const stockGallery = galleries[slug];
  const gallery = [
    ...(stockGallery?.product ?? []),
    ...(stockGallery?.bySize[size] ?? []),
    ...(size === "SHEET" && sheetSize
      ? stockGallery?.bySize[`${size}/${sheetSize}`] ?? []
      : []),
  ];

  // The lineup always leads with the size's PRODUCT SHOT, then the gallery
  // photos. `null` marks the temporary solid bw-600 block shown while a size
  // has no product photography yet — deliberately shown even when the size
  // does have gallery photos, so the product slot is always reserved.
  // SHEET prefers the selected sheet size's own shot ("SHEET/4X5") before
  // falling back to the generic "SHEET" one.
  const productShot =
    (size === "SHEET" && sheetSize
      ? stock.sizeImages?.[`${size}/${sheetSize}`]
      : undefined) ??
    stock.sizeImages?.[size] ??
    null;
  const slides: (string | null)[] = [productShot, ...gallery];

  const [galleryIdxSel, setGalleryIdxSel] = useState(0);
  const galleryIdx = Math.min(galleryIdxSel, slides.length - 1);

  // Whether the next track move should glide. Thumbnail clicks slide; switching
  // type/format resets to the first slide instantly (the whole set swaps, so a
  // glide across unrelated images looks wrong).
  const [animateSlide, setAnimateSlide] = useState(true);

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
  // derivations above absorb anything the new stock doesn't offer. The URL
  // follows automatically via the sync effect above.
  function selectType(next: string) {
    if (STOCKS[next]) {
      setSlug(next);
      setGalleryIdxSel(0);
      setAnimateSlide(false);
    }
  }

  // Switching SHEET SIZE swaps the strip (each sheet size has its own photo
  // folder), so it resets the same way a format switch does.
  function selectSheetSize(next: string) {
    setSheetSizeSel(next);
    setGalleryIdxSel(0);
    setAnimateSlide(false);
  }

  // Snapshot the current selection into the order and leave the configurator
  // exactly as it is. Nothing here resets: the commonest next action is another
  // roll of what was just added (two 36-exposure C-41s scanned the same way is
  // one order, not two configurations), so holding the selection makes that a
  // single click. Anything else is the same pill taps the customer already made
  // once. An automatic snap back to 35MM/SCANS/36 also reads as the page having
  // reloaded and lost their work, which is worse than a stale-looking panel.
  //
  // The cart drawer deliberately does NOT pop open here — a counter workflow is
  // several rolls in a row, and a panel covering the configurator after each
  // one would be in the way. The nav badge and the note below carry the
  // feedback instead.
  function addToOrder() {
    // Always one roll: a second identical roll is another click of this button,
    // and the cart's stepper is where a quantity gets raised after the fact.
    const line: NewOrderLine = {
      kind: "film",
      slug,
      size,
      output,
      exp,
      sheetSize,
      qty: 1,
    };
    const stored = addLine(line);

    const summary = summarizeLine(stored);
    const next = count + 1;
    setAddedNote(
      `${summary?.text ?? "Roll"} added — ${next} ${
        next === 1 ? "item" : "items"
      } in your order.`
    );
    setAddedShot(productShot);
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
              {slides.map((src) =>
                src ? (
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
                ) : (
                  <div key="product-placeholder" className={styles.slide}>
                    <div className={styles.productFill} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Uniform square thumbs, each photo filling its tile edge-to-edge
              (cover crop); the selection border traces the square. */}
          {slides.length > 1 && (
            <div className={styles.thumbs} role="group" aria-label="Product photos">
              {slides.map((src, i) => (
                <button
                  key={src ?? "product-placeholder"}
                  type="button"
                  className={styles.thumb}
                  data-active={i === galleryIdx || undefined}
                  aria-pressed={i === galleryIdx}
                  aria-label={`Photo ${i + 1} of ${slides.length}`}
                  onClick={() => {
                    setAnimateSlide(true);
                    setGalleryIdxSel(i);
                  }}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={withBasePath(src)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className={styles.productFill} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: title + blurb, option rows, estimate, price, notice */}
        <div className={styles.body}>
          <header className={styles.header}>
            {/* Type + format combo, dash-separated (placeholder separator for
                now). Format uses its display label (DISPOSABLE, not the full
                data value) and tracks the selection live. SHEET appends its
                sheet size directly — "SHEET 4X5", no extra separator. */}
            <h1 className={styles.title}>
              {stock.name} -{" "}
              {size === "SHEET" && sheetSize
                ? `${size} ${sheetSize}`
                : SIZE_LABELS[size] ?? size}
            </h1>
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
                  onSelect={selectSheetSize}
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

          <div className={styles.addBlock}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={addToOrder}
            >
              Add to order
            </button>
            {/* The note is now spoken-only — AddedToOrder keeps it in an
                always-mounted live region and draws the designed band. */}
            <AddedToOrder
              note={addedNote}
              image={addedShot}
              onViewCart={openCart}
            />
          </div>
        </div>
      </div>

      {/* Cross-sell: leads with a service they aren't already looking at. */}
      <MoreProducts family={slug} />
    </main>
  );
}
