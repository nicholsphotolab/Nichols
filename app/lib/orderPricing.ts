// orderPricing.ts
// The one entry point the cart, the nav badge, and the printable order form
// use to read and price an order, whatever is in it.
//
// Everything here dispatches on OrderLine["kind"] and hands off to the product
// module that owns that kind — film/filmPricing or video/videoPricing. Those
// two never import each other, and nothing that renders an order imports
// either directly, so a third product type is a new summarizer plus two cases
// here rather than a change to any component.

import {
  reviseFilmLine,
  summarizeFilmLine,
} from "../film/filmPricing";
import { summarizeVideoLine, videoOutputCharges } from "../video/videoPricing";
import type { LinePatch, OrderLine, VideoOrderLine } from "./orderDraft";
import { safeQty, type LineItem, type LineSummary } from "./orderSummary";

export { formatUSD } from "./orderSummary";
export type { LineChoice, LineItem, LineRow, LineSummary } from "./orderSummary";

/**
 * Resolve a stored line against today's pricing data.
 *
 * Null means the line no longer describes something we sell — a stock, format,
 * or transfer category has been retired since the draft was saved. Callers use
 * it both to drop dead lines when restoring a draft and to skip rendering them.
 */
export function summarizeLine(line: OrderLine): LineSummary | null {
  switch (line.kind) {
    case "film":
      return summarizeFilmLine(line);
    case "video":
      return summarizeVideoLine(line);
  }
}

/**
 * Apply an edit from the cart, reconciled against what the new combination
 * actually offers. Only film needs reconciling — a video line's output is
 * always one of three, independent of everything else on the line.
 */
export function reviseLine(line: OrderLine, patch: LinePatch): OrderLine {
  switch (line.kind) {
    case "film":
      return reviseFilmLine(line, patch);
    case "video":
      return {
        ...line,
        ...(patch.output != null && { output: patch.output }),
        ...(patch.option !== undefined && { option: patch.option }),
        ...(patch.qty !== undefined && { qty: patch.qty }),
      };
  }
}

/** Video lines only — the kind whose output medium is billed once per order. */
function videoLines(lines: OrderLine[]): VideoOrderLine[] {
  return lines.filter((l): l is VideoOrderLine => l.kind === "video");
}

/**
 * Order-level charges that belong to no single line: currently just the video
 * output medium, billed once per distinct choice because one USB carries the
 * whole transfer. Rendered as their own rows on the printed sheet so the
 * arithmetic on paper still adds up.
 */
export function orderExtraCharges(lines: OrderLine[]): LineItem[] {
  return videoOutputCharges(videoLines(lines));
}

/** Order total: every line that still resolves, plus the order-level charges. */
export function orderTotal(lines: OrderLine[]): number {
  const items = lines.reduce(
    (sum, line) => sum + (summarizeLine(line)?.lineTotal ?? 0),
    0
  );
  const extras = orderExtraCharges(lines).reduce(
    (sum, item) => sum + item.amount,
    0
  );
  return items + extras;
}

/** Items in the order — the sum of every line's quantity, not the line count. */
export function orderItemCount(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + safeQty(line), 0);
}
