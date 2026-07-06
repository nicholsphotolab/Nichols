// VideoTransferConfigurator.tsx
// Interactive price estimator for video & audio transfers, built to mirror the
// film stock configurator (app/film/FilmStockConfigurator.tsx): a two-column
// layout with a product-image placeholder on the left and, on the right, a
// title + blurb, hairline-separated option rows, an itemized ESTIMATED TOTAL,
// and the headline price.
//
// The CATEGORY row switches between Tapes & Discs and Film Reels in place —
// swapping the format/size options and pricing — exactly like the film TYPE row
// switches stock. The output is added once per order (one USB/disc holds the
// whole transfer).

"use client";

import { useEffect, useState } from "react";
import { Pills } from "../components/ConfiguratorControls";
import {
  CATEGORIES,
  CATEGORIES_BY_SLUG,
  OUTPUTS,
  type VideoCategory,
} from "./videoTransferData";
import { withBasePath } from "../lib/basePath";
import { buildQuery, matchOption, slugifyOption } from "../lib/urlState";
import styles from "./VideoTransferConfigurator.module.css";

// CATEGORY pills, in display order. Values are slugs; labels come from the data.
const CATEGORY_ORDER = CATEGORIES.map((c) => c.slug);

// USB is the recommended output, so it starts selected.
const RECOMMENDED_OUTPUT = OUTPUTS.find((o) => o.recommended) ?? OUTPUTS[0];

// Short plain-language explanation shown in the tooltip beside each row label.
const ROW_INFO: Record<string, string> = {
  Type: "Tapes & Discs covers VHS, camcorder tapes, audio cassettes, and discs. Film Reels covers 8mm, Super 8, and 16mm movie film.",
  Format: "The kind of tape or disc you're transferring.",
  Size: "The diameter of your film reel, measured across the reel.",
  Output:
    "How you get your files back — a new USB drive, your own USB, or a DVD/CD. Added once per order.",
};

// Row label with an info icon that reveals a tooltip on hover or keyboard focus.
// Mirrors the film configurator's RowLabel.
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
            <img
              src={withBasePath("/info.svg")}
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
            />
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

type LineItem = { name: string; sub?: string; amount: number };

// Builds the itemized estimate: the per-item transfer price for the selected
// format/size, plus the output surcharge added once per order.
function buildBreakdown(
  category: VideoCategory,
  option: string,
  output: string
): LineItem[] {
  const opt = category.options.find((o) => o.name === option);
  const out = OUTPUTS.find((o) => o.name === output);

  const items: LineItem[] = [
    { name: `${option} Transfer`, amount: opt?.price ?? 0 },
  ];

  if (out) {
    items.push({
      name: `${out.name} Output`,
      sub: "added once per order",
      amount: out.price,
    });
  }

  return items;
}

export default function VideoTransferConfigurator({
  initialSlug,
}: {
  initialSlug: string;
}) {
  const [slug, setSlug] = useState<string>(initialSlug);
  const category = CATEGORIES_BY_SLUG[slug] ?? CATEGORIES_BY_SLUG[initialSlug];

  // Raw selections; anything the current category doesn't offer is corrected by
  // deriving an effective value at render time (below) rather than writing state
  // back — the same pure-render pattern the film configurator uses.
  const [optionSel, setOptionSel] = useState<string>(category.options[0].name);
  const [output, setOutput] = useState<string>(RECOMMENDED_OUTPUT.name);

  // Restore customization from the URL once on mount (?format=…&output=…).
  // The page is statically pre-rendered with defaults, so the query is applied
  // after hydration. Unknown values are ignored; the derivation below absorbs
  // anything this category doesn't offer. Declared before the URL-sync effect
  // so the query is captured before the first rewrite.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const format = matchOption(
      params.get("format"),
      category.options.map((o) => o.name)
    );
    if (format) setOptionSel(format);
    const out = matchOption(
      params.get("output"),
      OUTPUTS.map((o) => o.name)
    );
    if (out) setOutput(out);
    // Mount-only: the URL is an input here, not a subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effective format/size: keep the raw selection but fall back to the first
  // option when the current category doesn't offer it (VHS has no reel size).
  const option = category.options.some((o) => o.name === optionSel)
    ? optionSel
    : category.options[0].name;

  // Mirror the visible selection into the URL: path = category, query = the
  // customization with defaults omitted. replaceState rewrites the current
  // history entry — Back always exits, it never un-clicks selections.
  useEffect(() => {
    const query = buildQuery({
      format:
        option !== category.options[0].name ? slugifyOption(option) : null,
      output:
        output !== RECOMMENDED_OUTPUT.name ? slugifyOption(output) : null,
    });
    window.history.replaceState(
      null,
      "",
      withBasePath(`/video/${slug}`) + query
    );
  }, [slug, category, option, output]);

  // Switching TYPE swaps the category but keeps the raw selection — the
  // derivation above absorbs anything the new category doesn't offer. The URL
  // follows automatically via the sync effect above.
  function selectCategory(next: string) {
    if (CATEGORIES_BY_SLUG[next]) setSlug(next);
  }

  // "SIZE" for reels, "Format" for tapes & discs — drives the row label + tooltip.
  const formatLabel = category.selectorLabel === "SIZE" ? "Size" : "Format";

  const breakdown = buildBreakdown(category, option, output);
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        {/* Left column: product-image placeholder (no per-category photos yet),
            striped like the video category cards. Stretches to the right
            column's height so the layout never shifts. */}
        <div className={styles.imageCol}>
          <div className={styles.image} aria-hidden="true" />
        </div>

        {/* Right column: title + blurb, option rows, estimate, price */}
        <div className={styles.body}>
          <header className={styles.header}>
            <h1 className={styles.title}>{category.name}</h1>
            <p className={styles.blurb}>{category.description}</p>
          </header>

          <hr className={styles.divider} />

          <div className={styles.rows}>
            <div className={styles.row}>
              <RowLabel label="Type" />
              <Pills
                values={CATEGORY_ORDER}
                selected={slug}
                onSelect={selectCategory}
                format={(s) => CATEGORIES_BY_SLUG[s]?.name ?? s}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label={formatLabel} />
              <Pills
                values={category.options.map((o) => o.name)}
                selected={option}
                onSelect={setOptionSel}
              />
            </div>

            <div className={styles.row}>
              <RowLabel label="Output" />
              <Pills
                values={OUTPUTS.map((o) => o.name)}
                selected={output}
                onSelect={setOutput}
                format={(name) => {
                  const out = OUTPUTS.find((o) => o.name === name)!;
                  return `${out.name} · $${out.price}`;
                }}
              />
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Itemized estimate */}
          <div className={styles.total}>
            <div className={styles.totalHead}>
              <span className={styles.totalLabel}>Estimated total</span>
              <p className={styles.noticeText}>
                Final price is confirmed when your order is dropped off.
              </p>
            </div>
            <div className={styles.breakdown}>
              {breakdown.map((item) => (
                <div className={styles.lineItem} key={item.name}>
                  <span className={styles.lineLabel}>
                    <span className={styles.lineName}>{item.name}</span>
                    {item.sub && (
                      <span className={styles.lineSub}>{item.sub}</span>
                    )}
                  </span>
                  <span className={styles.lineAmount}>
                    {formatUSD(item.amount)}
                  </span>
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
