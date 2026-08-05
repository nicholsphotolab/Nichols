// videoPricing.ts
// Resolves a stored video transfer line against the live transfer data and
// prices it — the video counterpart to film/filmPricing.ts. Shared by the cart
// drawer and the printable order form via lib/orderPricing.
//
// The one thing that doesn't work like film: the output medium is billed ONCE
// per order, not per item ("one USB holds the whole transfer" — the wording
// the configurator has always used). So a line's own price is the transfer fee
// alone, and the output surcharge is added at the order level by
// videoOutputCharges. Storing the choice on the line anyway is what lets the
// cart show and change it per item; billing it per distinct choice means a
// customer who wants everything on one USB pays for one, and a customer who
// wants a USB *and* a DVD pays for both, which is what they'd receive.

import {
  CATEGORIES_BY_SLUG,
  OUTPUTS,
  type VideoCategory,
} from "./videoTransferData";
import type { LinePatch, VideoOrderLine } from "../lib/orderDraft";
import {
  formatUSD,
  safeQty,
  type LineChoice,
  type LineItem,
  type LineSummary,
} from "../lib/orderSummary";

/** Reel sizes are stored compactly ("3IN") but read as "3 IN." everywhere. */
export function videoOptionLabel(category: VideoCategory, option: string) {
  return category.slug === "reels"
    ? `${option.replace(/IN$/i, "")} IN.`
    : option;
}

/** Output choices, labelled with their surcharge as the configurator does. */
function outputChoices(): LineChoice[] {
  return OUTPUTS.map((o) => ({
    value: o.name,
    label: `${o.name} · ${formatUSD(o.price)}`,
  }));
}

/**
 * Resolve a stored video line and price it.
 *
 * Returns null when the category or format no longer exists — a saved draft
 * can outlive a data change, so callers use a null both to drop dead lines on
 * restore and to skip rendering them. Prices are always recomputed, never read
 * back from storage.
 */
export function summarizeVideoLine(line: VideoOrderLine): LineSummary | null {
  const category = CATEGORIES_BY_SLUG[line.slug];
  if (!category) return null;

  const option = category.options.find((o) => o.name === line.option);
  if (!option) return null;

  const output = OUTPUTS.find((o) => o.name === line.output) ?? null;
  const optionLabel = videoOptionLabel(category, option.name);

  // Transfer fee only — the output is billed once per order, not here.
  const breakdown: LineItem[] = [
    { name: `${optionLabel} Transfer`, amount: option.price },
  ];
  const total = option.price;
  const qty = safeQty(line);

  const rows = [
    {
      field: "output",
      label: "Output",
      value: output?.name ?? line.output,
      selected: line.output,
      choices: outputChoices(),
      patch: (value: string): LinePatch => ({ output: value }),
    },
  ];

  // Plain hyphen, matching the film side and the product cards.
  const title = `${category.name} - ${optionLabel}`;
  const details = output?.name ?? line.output;

  return {
    kind: "video",
    title,
    details,
    imageSrc: option.image ?? null,
    rows,
    breakdown,
    total,
    qty,
    lineTotal: total * qty,
    text: `${title} · ${details}`,
  };
}

/**
 * The output surcharges for an order: one per distinct medium chosen across
 * every video line, since a single USB (or disc) carries the whole transfer.
 * Empty for an order with no video in it.
 */
export function videoOutputCharges(lines: VideoOrderLine[]): LineItem[] {
  const chosen = new Set(lines.map((l) => l.output));
  return OUTPUTS.filter((o) => chosen.has(o.name)).map((o) => ({
    name: `${o.name} Output`,
    sub: "added once per order",
    amount: o.price,
  }));
}
