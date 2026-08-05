// filmPricing.ts
// Display labels and pricing maths for film developing, shared by the
// configurator (which prices the roll being configured right now) and by the
// order list and printable order form (which price rolls already added).
// Extracted from FilmStockConfigurator so all three read one implementation —
// a rate or label change lands in a single place.
//
// The `FilmStock` type still lives in FilmStockConfigurator.tsx alongside the
// component that consumes it; importing it here with `import type` keeps that
// arrangement without creating a runtime import cycle (type imports are erased
// at compile time).

import type { FilmStock } from "./FilmStockConfigurator";
import { STOCKS } from "./filmStocksData";
import type { FilmOrderLine, LinePatch } from "../lib/orderDraft";
import {
  formatUSD,
  safeQty,
  type LineItem,
  type LineRow,
  type LineSummary,
} from "../lib/orderSummary";

export { formatUSD } from "../lib/orderSummary";
export type { LineItem, LineSummary } from "../lib/orderSummary";

/** Shorten the data value for display without changing the selection value. */
export const SIZE_LABELS: Record<string, string> = {
  "DISPOSABLE CAMERA": "DISPOSABLE",
};

/** OUTPUT pills: render order + labels matching the Figma. */
export const OUTPUT_ORDER = ["SCANS", "PRINTS/SCANS", "NONE"];
export const OUTPUT_LABELS: Record<string, string> = {
  SCANS: "SCANS ONLY",
  "PRINTS/SCANS": "PRINTS + SCANS",
  NONE: "DEVELOP ONLY",
};

/** How the scan surcharge reads in the itemized breakdown. */
export const SCAN_LINE_LABEL: Record<string, string> = {
  SCANS: "Standard Scans",
  "PRINTS/SCANS": "Prints + Scans",
};

// Builds the itemized estimate from a selection. Development is always
// charged; a scans line is added when an output that includes scanning is
// paired with a resolvable exposure count (explicit or the silent default).
export function buildBreakdown(
  stock: FilmStock,
  size: string,
  output: string | null,
  exp: string | null,
  sheetSize: string | null
): LineItem[] {
  // Sheet film develops per sheet at a rate set by stock + sheet size, so it
  // replaces the roll basePrice line entirely.
  if (size === "SHEET") {
    const devRate =
      (sheetSize ? stock.sheetDevRates?.[sheetSize] : undefined) ??
      stock.basePrice;
    const items: LineItem[] = [
      {
        name: `${sheetSize ? `${sheetSize.toLowerCase()} ` : ""}${stock.name} Development`,
        sub: "per sheet",
        amount: devRate,
      },
    ];
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
// Also the state the configurator returns to after a roll is added to the order.
export function defaultsFor(stock: FilmStock) {
  const size = stock.sizes.includes("35MM") ? "35MM" : stock.sizes[0] ?? "";
  const output = stock.outputs.includes("SCANS") ? "SCANS" : stock.outputs[0] ?? null;
  const exps = output ? stock.exposures[size]?.[output] ?? [] : [];
  const exp = exps.includes("36") ? "36" : exps[0] ?? null;
  return { size, output, exp };
}

// ---------- Options for an already-added roll ----------
// The cart lets a customer change a roll's output, exposure, or sheet size
// without going back to the configurator, so it needs the same option lists
// the configurator builds — derived from the stored line rather than from
// component state. Each returns an empty array when the choice doesn't apply,
// which is also the cart's signal to render the value with no "Edit" link.

/** Output values this line's stock offers, in Figma display order. */
export function outputOptionsFor(line: FilmOrderLine): string[] {
  const stock = STOCKS[line.slug];
  if (!stock) return [];
  return OUTPUT_ORDER.filter((o) => stock.outputs.includes(o));
}

/** Exposure counts for this line's format + output. Empty for formats not
 *  billed per exposure — disposables (silent 27) and sheet film. */
export function expOptionsFor(line: FilmOrderLine): string[] {
  const stock = STOCKS[line.slug];
  if (!stock || !line.output) return [];
  return stock.exposures[line.size]?.[line.output] ?? [];
}

/** Sheet dimensions, for sheet-film lines only. */
export function sheetSizeOptionsFor(line: FilmOrderLine): string[] {
  const stock = STOCKS[line.slug];
  if (!stock || line.size !== "SHEET") return [];
  return stock.sheetSizes ?? [];
}

/**
 * Apply an edit made from the cart, correcting whatever the new combination
 * no longer offers.
 *
 * Output is the change that matters: exposure counts are keyed by
 * [size][output], so a switch can strand a count the new combination doesn't
 * offer. Where the new combination does offer counts, an unusable one is
 * replaced with the same default the configurator would pick (36, else the
 * first offered). Where it offers none — DEVELOP ONLY, disposables, sheet
 * film — the stored count is left alone: it is a fact about the roll rather
 * than a charge (buildBreakdown already bills nothing for it), so keeping it
 * means a round trip out to DEVELOP ONLY and back returns the customer's own
 * 24 EXP. instead of silently resetting them to 12.
 */
export function reviseFilmLine(
  line: FilmOrderLine,
  patch: LinePatch
): FilmOrderLine {
  const next: FilmOrderLine = {
    ...line,
    ...(patch.size !== undefined && { size: patch.size }),
    ...(patch.output !== undefined && { output: patch.output }),
    ...(patch.exp !== undefined && { exp: patch.exp }),
    ...(patch.sheetSize !== undefined && { sheetSize: patch.sheetSize }),
    ...(patch.qty !== undefined && { qty: patch.qty }),
  };
  const exps = expOptionsFor(next);
  if (exps.length > 0 && (!next.exp || !exps.includes(next.exp))) {
    next.exp = exps.includes("36") ? "36" : exps[0];
  }
  return next;
}

/**
 * Resolve a stored roll against the current STOCKS data and price it.
 *
 * Returns null when the stock or format no longer exists — a stored draft can
 * outlive a pricing change, so callers use a null here both to drop dead lines
 * on restore and to skip rendering them. Prices are always recomputed, never
 * read back from storage, so a restored order reflects today's rates.
 */
export function summarizeFilmLine(line: FilmOrderLine): LineSummary | null {
  const stock = STOCKS[line.slug];
  if (!stock || !stock.sizes.includes(line.size)) return null;
  if (line.output !== null && !stock.outputs.includes(line.output)) return null;

  const isSheet = line.size === "SHEET";
  const sheetSize =
    isSheet && line.sheetSize && (stock.sheetSizes ?? []).includes(line.sheetSize)
      ? line.sheetSize
      : null;
  if (isSheet && !sheetSize) return null;

  const formatLabel = sheetSize
    ? `${line.size} ${sheetSize}`
    : SIZE_LABELS[line.size] ?? line.size;
  // Null output means the stock offers none at all, which is develop-only by
  // another name — both read the same to the customer and bill the same way.
  const developOnly = line.output === null || line.output === "NONE";
  const outputLabel = line.output
    ? OUTPUT_LABELS[line.output] ?? line.output
    : "DEVELOP ONLY";

  // Show the silent default too (a disposable is always 27 exp), since the
  // customer never picked it but it is what they're being charged for.
  //
  // Develop-only is the exception: nothing on that roll is priced per frame,
  // so the count is information the customer can neither act on nor be
  // charged for. Dropping it takes the EXPOSURE row out of the cart and off
  // the printed sheet together. The stored value survives untouched (see
  // reviseFilmLine), so switching back to scans returns their own 36 EXP.
  const resolvedExp =
    isSheet || developOnly
      ? null
      : line.exp ?? stock.defaultExposures?.[line.size] ?? null;
  // "24 EXP." — the trailing period is the design's, and the cart shows this
  // label directly above the list of alternatives, so the two have to agree.
  const expLabel = resolvedExp ? `${resolvedExp} EXP.` : null;

  // Same precedence as the configurator's product slot: the selected sheet
  // size's own shot ("SHEET/4X5"), then the format's, then nothing.
  const imageSrc =
    (sheetSize ? stock.sizeImages?.[`${line.size}/${sheetSize}`] : undefined) ??
    stock.sizeImages?.[line.size] ??
    null;

  const breakdown = buildBreakdown(
    stock,
    line.size,
    line.output,
    line.exp,
    sheetSize
  );
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const qty = safeQty(line);

  // The rule-separated rows the cart shows under the title. Sheet film is
  // billed per sheet, so it offers its dimensions where a roll offers its
  // frame count; a format with neither (a develop-only 35mm) contributes no
  // second row at all, and the cart drops the rule that would separate them.
  const rows: LineRow[] = [
    {
      field: "output",
      label: "Output",
      value: outputLabel,
      selected: line.output,
      choices: outputOptionsFor(line).map((v) => ({
        value: v,
        label: OUTPUT_LABELS[v] ?? v,
      })),
      patch: (output): LinePatch => ({ output }),
    },
  ];

  if (sheetSize) {
    rows.push({
      field: "sheetSize",
      label: "Sheet size",
      value: sheetSize,
      selected: sheetSize,
      choices: sheetSizeOptionsFor(line).map((v) => ({ value: v, label: v })),
      patch: (v): LinePatch => ({ sheetSize: v }),
    });
  } else if (expLabel) {
    rows.push({
      field: "exp",
      label: "Exposure",
      value: expLabel,
      selected: line.exp,
      choices: expOptionsFor(line).map((v) => ({
        value: v,
        label: `${v} EXP.`,
      })),
      patch: (exp): LinePatch => ({ exp }),
    });
  }

  // Plain hyphen, matching the configurator's own <h1> and the product cards.
  // An en dash here made the same product read two different ways depending on
  // whether you were looking at the page or at the cart.
  const title = `${stock.name} - ${formatLabel}`;
  const details = [outputLabel, expLabel].filter(Boolean).join(" · ");

  return {
    kind: "film",
    title,
    details,
    imageSrc,
    rows,
    breakdown,
    total,
    qty,
    lineTotal: total * qty,
    text: `${title} · ${details}`,
  };
}
