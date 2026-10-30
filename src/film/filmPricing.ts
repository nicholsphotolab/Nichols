// filmPricing.ts
// Display labels and pricing maths for film developing, shared by the
// configurator (which prices the roll being configured right now) and by the
// order list and printable order form (which price rolls already added).
// Extracted from FilmStockConfigurator so all three read one implementation —
// a rate or label change lands in a single place.

import {
  STOCKS,
  type FilmStock,
  SCAN_TYPE_LABELS,
  SCAN_TYPE_LINE_LABEL,
  SCAN_TYPE_ORDER,
  SCAN_TYPE_RATES,
  SHEET_SCAN_TYPE_RATES,
} from "./filmStocksData";
import type { FilmOrderLine, LinePatch } from "@/order/orderDraft";
import {
  formatUSD,
  safeQty,
  type LineItem,
  type LineRow,
  type LineSummary,
} from "@/order/orderSummary";

export { formatUSD } from "@/order/orderSummary";
export type { LineItem, LineSummary } from "@/order/orderSummary";

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
  SCANS: "Scans",
  "PRINTS/SCANS": "Prints + Scans",
};

export { SCAN_TYPE_LABELS, SCAN_TYPE_ORDER } from "./filmStocksData";

/**
 * Explainer copy for the configurator's info-modal (↗ next to each row
 * label). Keyed by the exact label RowLabel is given in
 * FilmStockConfigurator.tsx, since InfoModal is shared with the video page
 * and looks the copy up by that same string.
 */
export const FILM_INFO_COPY: Record<string, string> = {
  Format: "The size and type of film you're developing — 35mm, 120, disposable camera, or sheet film. Check your canister or camera manual if you're not sure which one you have.",
  Output: "What you get back. Scans Only gives you digital files. Prints + Scans gives you physical prints plus the files. Develop Only returns just the negatives, with nothing scanned or printed.",
  "Scan Type": "The resolution of your digital scans. Standard is sharp enough for sharing and most prints; higher tiers hold more detail for large prints or close cropping.",
  Exposure: "How many frames are on your roll — check the frame counter on your camera, or the box your film came in. If you're not sure, 36 is the most common.",
  "Sheet Size": "The dimensions of your sheet film — 4x5, 5x7, or 8x10. This should match the sheet film holder your camera uses.",
};

/** Outputs that include scanning, and so offer a resolution tier. */
export function outputHasScans(output: string | null): boolean {
  return output === "SCANS" || output === "PRINTS/SCANS";
}

// ---------- Pull / push ----------
// Stops of compensation the lab will run, as a closed range rather than a pill
// list: it is a number the customer steps through, and −2…+3 covers everything
// realistically shot. Free — pushing changes the development time, not the bill.

export const PUSH_PULL_MIN = -2;
export const PUSH_PULL_MAX = 3;

/** Every offered value, low to high — the cart lists these as choices. */
export const PUSH_PULL_VALUES: number[] = Array.from(
  { length: PUSH_PULL_MAX - PUSH_PULL_MIN + 1 },
  (_, i) => PUSH_PULL_MIN + i
);

/** Whatever the stepper is at, brought back inside the offered range. */
export function clampPushPull(stops: number): number {
  if (!Number.isFinite(stops)) return 0;
  return Math.min(PUSH_PULL_MAX, Math.max(PUSH_PULL_MIN, Math.round(stops)));
}

/**
 * "Push +1", "Pull −2", or null at zero.
 *
 * Null rather than "Normal" because this reads on the counter's printed sheet
 * and in the cart's CUSTOM list, both of which exist to carry the exceptions —
 * a line saying the roll is to be developed normally is noise in the one place
 * that has to be scannable.
 */
/**
 * "+1", "−2", "0" — the signed stops alone, for the − / + steppers.
 *
 * The stepper sits under a label that already says PULL / PUSH, so repeating
 * the word between the two buttons says nothing the customer can't see; the
 * number is the only part that changes as they press. Shared by the
 * configurator and the cart so the same control reads the same in both.
 *
 * Real minus sign, matching the "−" on the button beside it.
 */
export function pushPullShort(stops: number): string {
  const n = clampPushPull(stops);
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0";
}

export function pushPullLabel(stops: number): string | null {
  const n = clampPushPull(stops);
  if (n === 0) return null;
  // Real minus sign, matching the stepper's own "−".
  return n > 0 ? `Push +${n}` : `Pull −${Math.abs(n)}`;
}

// ---------- Half frame ----------
// A half-frame camera splits each 35mm frame in two, so a 36-exposure roll comes
// back as 72 images. That is the whole of the price difference: INDIVIDUAL bills
// twice the frames at the ordinary rate for the size and tier, PAIRED bills the
// roll exactly as a full-frame one. There is no separate half-frame rate table
// and no flat surcharge.

export const HALF_FRAME_ORDER = ["INDIVIDUAL", "PAIRED"];

export const HALF_FRAME_LABELS: Record<string, string> = {
  INDIVIDUAL: "INDIVIDUAL FRAME SCANS",
  PAIRED: "PAIRED FRAME SCANS",
};

/** Second line under each pill, explaining what the choice yields. */
export const HALF_FRAME_CAPTIONS: Record<string, (frames: number) => string> = {
  INDIVIDUAL: (frames) =>
    `Up to ${frames} images\nEach half frame cropped on its own`,
  PAIRED: (frames) =>
    `Up to ${frames} images\nBoth half frames left together in one scan`,
};

/** How the choice reads in the cart's CUSTOM list and on the printed sheet. */
export const HALF_FRAME_LINE_LABEL: Record<string, string> = {
  INDIVIDUAL: "Half frame — individual scans",
  PAIRED: "Half frame — paired scans",
};

/**
 * Whether the HALF FRAME CAMERA row applies at all.
 *
 * 35mm only — it describes a camera that exposes half of a 35mm frame, and no
 * other format has one. Disposables are 35mm film but are configured as their
 * own format here, and are excluded deliberately.
 *
 * Also gated on the output actually including scans: the choice is between two
 * ways of scanning, so on DEVELOP ONLY there is nothing for it to decide.
 */
export function halfFrameAvailable(
  size: string,
  output: string | null
): boolean {
  return size === "35MM" && outputHasScans(output);
}

/**
 * Frames billed for a roll — the exposure count, doubled when each half frame
 * is being cropped and scanned separately.
 *
 * Guarded on halfFrameAvailable rather than on `halfFrame` alone so a stored
 * value that has stopped applying (the customer moved the roll to 120, or to
 * develop-only) can never double a bill for a row that is no longer on screen.
 */
export function billedFrames(
  count: number,
  size: string,
  output: string | null,
  halfFrame: string | null
): number {
  return halfFrame === "INDIVIDUAL" && halfFrameAvailable(size, output)
    ? count * 2
    : count;
}

/**
 * The rate for one exposure (or one sheet) at a given resolution tier.
 *
 * Tiers other than STANDARD are looked up in their own table and fall back to
 * the standard rate when a cell is missing, so a size added to the base tables
 * prices correctly at standard rather than silently costing nothing.
 */
function scanRate(
  standard: number | undefined,
  table: Record<string, Record<string, number>> | undefined,
  key: string,
  output: string,
  scanType: string | null
): number | undefined {
  if (!scanType || scanType === "STANDARD") return standard;
  return table?.[key]?.[output] ?? standard;
}

// Builds the itemized estimate from a selection. Development is always
// charged; a scans line is added when an output that includes scanning is
// paired with a resolvable exposure count (explicit or the silent default).
export function buildBreakdown(
  stock: FilmStock,
  size: string,
  output: string | null,
  exp: string | null,
  sheetSize: string | null,
  scanType: string | null = null,
  halfFrame: string | null = null
): LineItem[] {
  // "35mm Standard Scans", "35mm Prints + High Resolution Scans" — the tier
  // qualifies the scan, so on prints+scans it belongs after the "+" rather than
  // in front of the whole thing.
  const scanLabel = (sizeLabel: string, out: string) => {
    const tier = SCAN_TYPE_LINE_LABEL[scanType ?? "STANDARD"] ?? "Standard";
    return out === "PRINTS/SCANS"
      ? `${sizeLabel} Prints + ${tier} Scans`
      : `${sizeLabel} ${tier} ${SCAN_LINE_LABEL[out] ?? "Scans"}`;
  };
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
      const rate = scanRate(
        stock.sheetSizeRates?.[sheetSize]?.[output],
        SHEET_SCAN_TYPE_RATES[scanType ?? "STANDARD"],
        sheetSize,
        output,
        scanType
      );
      if (rate) {
        items.push({
          name: scanLabel(sheetSize.toLowerCase(), output),
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
    const rate = scanRate(
      stock.perExposureRate[size]?.[output],
      SCAN_TYPE_RATES[scanType ?? "STANDARD"],
      size,
      output,
      scanType
    );
    const count = parseInt(resolvedExp, 10);
    if (rate && !Number.isNaN(count)) {
      const sizeLabel = (SIZE_LABELS[size] ?? size).toLowerCase();
      const frames = billedFrames(count, size, output, halfFrame);
      // "36EXP" is the roll; "72 images" is what comes off a half-frame roll
      // scanned individually. Calling those 72 exposures on the counter's sheet
      // would misdescribe a roll that really does hold 36.
      const unit = frames === count ? `${frames}EXP` : `${frames} images`;
      items.push({
        name: scanLabel(sizeLabel, output),
        sub: `${formatUSD(rate)} × ${unit}`,
        amount: rate * frames,
      });
    }
  }

  return items;
}

// ---------- Resting choices ----------
// What a row falls back to when nothing (or nothing valid) is selected: the
// configurator's first paint, its URL defaults, and the cart's corrections all
// use these, so "the default" means one thing.

/** 35MM where the stock offers it, else its first size. */
export function defaultSize(stock: FilmStock): string {
  return stock.sizes.includes("35MM") ? "35MM" : stock.sizes[0] ?? "";
}

/** 36 exposures where offered, else the first count; null when none apply. */
export function defaultExp(options: string[]): string | null {
  return options.includes("36") ? "36" : options[0] ?? null;
}

/** 4X5 where offered, else the first sheet size; null for non-sheet formats. */
export function defaultSheetSize(options: string[]): string | null {
  return options.includes("4X5") ? "4X5" : options[0] ?? null;
}

// Default selection for a stock: 35MM / SCANS / 36 exposures when available,
// which reproduces the Figma's resting state. Falls back gracefully per stock.
export function defaultsFor(stock: FilmStock) {
  const size = defaultSize(stock);
  const output = stock.outputs.includes("SCANS") ? "SCANS" : stock.outputs[0] ?? null;
  const exp = defaultExp(output ? stock.exposures[size]?.[output] ?? [] : []);
  // Null rather than STANDARD on develop-only: there is nothing being scanned,
  // so a resolution would be a charge-free selection the customer never made.
  const scanType = outputHasScans(output) ? "STANDARD" : null;
  // Both extras rest at "not asked for". They live behind a collapsed
  // disclosure, so anything else would charge (or instruct) on a choice the
  // customer never opened.
  return { size, output, exp, scanType, pushPull: 0, halfFrame: null };
}

/**
 * The free, unpriced instructions attached to a roll, in the order they read.
 *
 * Both are filtered through the same availability rules the configurator uses,
 * so a stored value that no longer applies stays out of the cart and off the
 * printed sheet instead of instructing the counter to do something the customer
 * can no longer see they asked for.
 */
export function filmCustomEntries(line: FilmOrderLine): string[] {
  const entries: string[] = [];
  const push = pushPullLabel(line.pushPull ?? 0);
  if (push) entries.push(push);
  if (line.halfFrame && halfFrameAvailable(line.size, line.output)) {
    entries.push(HALF_FRAME_LINE_LABEL[line.halfFrame] ?? line.halfFrame);
  }
  return entries;
}

/**
 * The extras as editable rows, appended to a line's ordinary option rows.
 *
 * One row per extra rather than one row holding both: they are two unrelated
 * questions, and grouping them meant a roll that only asked for a push still
 * had to open a control offering half-frame choices it had never chosen.
 *
 * Each appears ONLY when that extra is actually set. Extras are chosen on the
 * roll's own page, under "Show More Options" — the cart's job is to show what
 * was asked for and let it be changed, not to offer the whole menu again on
 * every line. So the rows can't be used to add an extra after the fact, only to
 * revise or clear one.
 *
 * The choice lists stay complete either way: once a row is on screen it has to
 * be able to reach every value, including the one that clears it.
 *
 * Push/pull is a list of its six values rather than the configurator's stepper:
 * every other control in the drawer is a list of choices, and a second stepper
 * beside the quantity one would be two steppers on a line meaning entirely
 * different things.
 */
export function filmExtraRows(line: FilmOrderLine): LineRow[] {
  const rows: LineRow[] = [];
  const stops = clampPushPull(line.pushPull ?? 0);

  rows.push({
    field: "pushPull",
    label: "Pull / Push",
    value: pushPullLabel(stops) ?? "Normal",
    selected: String(stops),
    choices: PUSH_PULL_VALUES.map((n) => ({
      value: String(n),
      label: pushPullLabel(n) ?? "Normal",
      short: pushPullShort(n),
    })),
    patch: (value): LinePatch => ({ pushPull: clampPushPull(Number(value)) }),
    unset: stops === 0,
    // Stops are a scale, not a menu — and spelling all six out was six rows to
    // express one number. Matches the stepper the configurator sets it with.
    control: "stepper",
  });

  // Availability is a harder gate than `unset`: a roll on 120, or on
  // develop-only, has no half-frame question at all, so the row isn't emitted
  // even for the cart to hide. Same rule the configurator and the pricing use.
  if (halfFrameAvailable(line.size, line.output)) {
    rows.push({
      field: "halfFrame",
      label: "Half Frame",
      value: line.halfFrame
        ? HALF_FRAME_LINE_LABEL[line.halfFrame] ?? line.halfFrame
        : "No",
      // "NONE" stands in for null: LineRow choices are strings, and a null
      // value would make the clearing option unselectable in the list.
      selected: line.halfFrame ?? "NONE",
      choices: [
        { value: "NONE", label: "Not a half frame roll" },
        ...HALF_FRAME_ORDER.map((v) => ({
          value: v,
          label: HALF_FRAME_LINE_LABEL[v] ?? v,
        })),
      ],
      patch: (value): LinePatch => ({
        halfFrame: value === "NONE" ? null : value,
      }),
      unset: !line.halfFrame,
    });
  }

  return rows;
}

/** Scan tiers this line offers — empty when nothing on it is being scanned. */
export function scanTypeOptionsFor(line: FilmOrderLine): string[] {
  return outputHasScans(line.output) ? SCAN_TYPE_ORDER : [];
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
    ...(patch.scanType !== undefined && { scanType: patch.scanType }),
    ...(patch.pushPull !== undefined && { pushPull: patch.pushPull }),
    ...(patch.halfFrame !== undefined && { halfFrame: patch.halfFrame }),
    ...(patch.qty !== undefined && { qty: patch.qty }),
  };
  const exps = expOptionsFor(next);
  if (exps.length > 0 && (!next.exp || !exps.includes(next.exp))) {
    next.exp = defaultExp(exps);
  }
  // Output drives whether a tier applies at all. Switching to develop-only
  // clears it; switching back restores STANDARD rather than leaving the line
  // priced at a tier with no visible selector to change it.
  if (!outputHasScans(next.output)) {
    next.scanType = null;
  } else if (!next.scanType || !SCAN_TYPE_ORDER.includes(next.scanType)) {
    next.scanType = "STANDARD";
  }
  // Stops survive every other change untouched — push/pull is offered on every
  // format and every output, so nothing an edit can do takes the row away.
  // Only the value itself is defended, against a hand-edited draft.
  next.pushPull = clampPushPull(next.pushPull ?? 0);
  // Half frame does go away: moving a roll off 35mm, or to develop-only, takes
  // the row with it. Cleared rather than kept, unlike the exposure count — a
  // hidden "INDIVIDUAL" would double the scan line the moment the customer
  // switched back to a scanning output, with nothing on screen explaining why.
  if (!halfFrameAvailable(next.size, next.output)) {
    next.halfFrame = null;
  } else if (next.halfFrame && !HALF_FRAME_ORDER.includes(next.halfFrame)) {
    next.halfFrame = "INDIVIDUAL";
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
  // "24 EXP", no trailing period. The design had one, but this label now also
  // lands mid-sentence in the collapsed summary — "36 EXP. · CUSTOM" put a full
  // stop immediately before a separator dot and read as two marks of
  // punctuation colliding. Dropped here AND on the choices below, which the
  // cart lists directly under this value: they have to agree.
  const expLabel = resolvedExp ? `${resolvedExp} EXP` : null;

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
    sheetSize,
    line.scanType,
    line.halfFrame
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

  // Only where something is actually being scanned — a develop-only line has no
  // resolution to change, and reviseFilmLine keeps its scanType null to match.
  if (outputHasScans(line.output) && line.scanType) {
    rows.push({
      field: "scanType",
      label: "Scan type",
      value: SCAN_TYPE_LABELS[line.scanType] ?? line.scanType,
      selected: line.scanType,
      choices: scanTypeOptionsFor(line).map((v) => ({
        value: v,
        label: SCAN_TYPE_LABELS[v] ?? v,
      })),
      patch: (scanType): LinePatch => ({ scanType }),
    });
  }

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
        label: `${v} EXP`,
      })),
      patch: (exp): LinePatch => ({ exp }),
    });
  }

  // Plain hyphen, matching the configurator's own <h1> and the product cards.
  // An en dash here made the same product read two different ways depending on
  // whether you were looking at the page or at the cart.
  const title = `${stock.name} - ${formatLabel}`;
  // The scan tier belongs here alongside the output and the frame count: this
  // string is what the cart shows in place of the option rows once they're
  // folded behind Details, and the tier is the one thing in that set that moves
  // the price. It reaches the printed order form by the same route.
  //
  // Null on develop-only lines (nothing is being scanned), where filter drops
  // it rather than printing a resolution the roll was never charged for.
  const scanTypeLabel =
    outputHasScans(line.output) && line.scanType
      ? SCAN_TYPE_LABELS[line.scanType] ?? line.scanType
      : null;
  const details = [outputLabel, scanTypeLabel, expLabel]
    .filter(Boolean)
    .join(" · ");

  return {
    kind: "film",
    title,
    details,
    imageSrc,
    // Extras are ordinary rows now, appended after the options they qualify —
    // an editable "Pull / Push" reads no differently from an editable
    // "Exposure", so the cart renders one list rather than two.
    rows: [...rows, ...filmExtraRows(line)],
    breakdown,
    custom: filmCustomEntries(line),
    total,
    qty,
    lineTotal: total * qty,
    text: `${title} · ${details}`,
  };
}
