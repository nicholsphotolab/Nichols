// orderSummary.ts
// The shape the cart and the printable order form read a line in, and the
// only thing either of them knows about a product.
//
// Film rolls and video transfers price and describe themselves completely
// differently, but both end up in the same drawer looking the same: a title,
// a price, some rule-separated rows you can open and change, a quantity. So
// each product module (film/filmPricing, video/videoPricing) resolves its own
// stored lines into this, and the cart renders whatever it is handed without
// knowing which it got. Adding a third product means writing one more
// summarizer, not touching CartDrawer.
//
// Deliberately data, not components: `patch` returns the change to apply
// rather than performing it, so the summary stays serialisable-in-spirit and
// the single write path through OrderProvider is preserved.

import type { LinePatch, OrderLine } from "./orderDraft";

/** One row of an itemized estimate. */
export type LineItem = { name: string; sub?: string; amount: number };

/** One alternative inside an expandable row. */
export type LineChoice = {
  /** What gets stored on the line. */
  value: string;
  /** How it reads in the cart, e.g. "PRINTS + SCANS". */
  label: string;
  /**
   * A compact form for the stepper control, where the row's own label is
   * already on screen directly above and only the changing part is worth
   * showing — "+1" rather than "Push +1". Falls back to `label`, so a row that
   * doesn't need one simply omits it.
   */
  short?: string;
};

/**
 * One labelled row under a line's title — OUTPUT, EXPOSURE, SHEET SIZE.
 * Fewer than two choices means the value isn't a decision the customer gets
 * to make (a disposable's 27 exposures are applied silently), so the cart
 * renders the value with no Edit link.
 */
export type LineRow = {
  /** Stable key for the cart's "which row is open" state. */
  field: string;
  /** Caption above the value, e.g. "Output". */
  label: string;
  /** The current value, already display-formatted. */
  value: string;
  /** Currently stored value, matched against each choice's `value`. */
  selected: string | null;
  choices: LineChoice[];
  /** The change to apply when a choice is picked. */
  patch: (value: string) => LinePatch;
  /**
   * How the cart should render the choices. Default is the swatch list every
   * row has always used; "stepper" walks `choices` in order with − / + instead.
   *
   * Only worth it where the values form a scale rather than a set — push/pull
   * runs −2 to +3, which as a list is six rows to say one number, and which the
   * configurator already presents as a stepper. The order of `choices` IS the
   * scale, so nothing extra has to be carried to describe it.
   */
  control?: "stepper";
  /**
   * True for a row describing something this line hasn't asked for — an unset
   * extra. The cart hides these, so they can't be used to add a choice that
   * belongs on the product's own page.
   *
   * They are still emitted rather than omitted so the cart can keep one on
   * screen while its own editor is open: picking the clearing option ("Normal")
   * flips this to true, and without that the row and the list you were reading
   * would vanish under the pointer that just cleared it, with no way back.
   */
  unset?: boolean;
};

/** A stored line resolved against the live pricing data, ready to render. */
export type LineSummary = {
  kind: OrderLine["kind"];
  /** Line heading, e.g. "C‑41 - 35MM" or "Tapes & Discs - VHS". */
  title: string;
  /** The rows' values as one line of plain text, for print and aria labels. */
  details: string;
  /**
   * The product shot, or null when this format has no photography yet — in
   * which case the cart shows a reserved empty tile. Deliberately never falls
   * back to a related product's shot: showing a 35mm canister for a 110
   * cartridge shows the customer something they didn't order.
   */
  imageSrc: string | null;
  rows: LineRow[];
  breakdown: LineItem[];
  /**
   * The free, unpriced instructions this line asked for — "Push +1", a
   * half-frame scan preference — as display text, one entry per line.
   *
   * Overlaps `rows` on purpose. The same facts are in there as editable rows,
   * but only where they apply and only once set; this is the flat text form,
   * for the collapsed summary's CUSTOM flag and for the printed order form,
   * which lists them in full rather than offering to change them. Empty on most
   * lines, and on every video line.
   */
  custom: string[];
  /** Price of ONE unit — what the breakdown adds up to. */
  total: number;
  /** Units on this line, floored at 1 however the stored value got there. */
  qty: number;
  /** total × qty — what the line contributes to the order. */
  lineTotal: number;
  /** Single-line plain text form: title plus details. */
  text: string;
};

export function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

/** Stored quantity, defended against a hand-edited or half-migrated draft. */
export function safeQty(line: OrderLine): number {
  return Math.max(1, Math.round(line.qty ?? 1));
}
