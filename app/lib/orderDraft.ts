// orderDraft.ts
// Client-only persistence for the in-progress ("draft") order — the rolls a
// customer has added to their list but not yet turned into an order form.
//
// Everything here touches window.localStorage, which does not exist during the
// server render. This site is a static export, so every page is pre-rendered at
// build time with no browser present: call these only from useEffect or an
// event handler, never during render, or the server and client HTML disagree
// and React throws a hydration error. Each function guards on `typeof window`
// as a second line of defence.
//
// The shape is versioned twice over. The key carries the version
// (`nichols-order-draft-v1`), so bumping it means a new build simply never sees
// the old data. The payload repeats the version, which catches a value written
// by a half-deployed build or edited by hand. Anything failing validation is
// discarded rather than repaired — losing a draft is a minor annoyance, a crash
// on page load is not.
//
// A draft only stores the *selections* for each roll, never prices. Totals are
// recomputed from filmStocksData on load (see summarizeLine in filmPricing.ts),
// so a rate change between visits shows the current price rather than a stale
// one, and a roll whose stock or format no longer exists drops out cleanly.

/** Fields every line carries, whatever it is the customer is dropping off. */
type BaseOrderLine = {
  /** Stable per-line key; also what the remove button targets. */
  id: string;
  /**
   * How many identical items this line stands for — what the cart's − / +
   * stepper writes. Always a whole number ≥ 1: dropping to zero is spelled
   * "Remove", so a line can never sit in the order billing nothing.
   */
  qty: number;
};

/** One configured roll of film. Selections only — prices are derived. */
export type FilmOrderLine = BaseOrderLine & {
  kind: "film";
  /** Film stock slug, e.g. "c-41". Matched against STOCKS on load. */
  slug: string;
  /** Format/size pill value, e.g. "35MM", "DISPOSABLE CAMERA", "SHEET". */
  size: string;
  /** Output pill value, e.g. "SCANS", or null when the stock offers none. */
  output: string | null;
  /** Exposure count as shown in the pill, e.g. "36". Null when not applicable. */
  exp: string | null;
  /** Sheet dimensions, e.g. "4X5". Only set when size is "SHEET". */
  sheetSize: string | null;
  /**
   * Scan resolution tier — "STANDARD", "HIGH", or "TIFF". Null on develop-only
   * lines, which have nothing scanned to set a resolution for.
   */
  scanType: string | null;
  /**
   * Stops of push (positive) or pull (negative) processing, 0 for normal
   * development. Offered on every format and every stock, including
   * develop-only: it is a choice about the chemistry, not about the scan.
   * Carried at no charge — it changes what the lab does, not what it bills.
   */
  pushPull: number;
  /**
   * Half-frame handling for a 35mm roll: "INDIVIDUAL" crops each half frame to
   * its own image (doubling the scan count), "PAIRED" leaves both halves
   * together in one scan. Null means an ordinary full-frame roll, which is also
   * the only valid value for every format other than 35MM.
   */
  halfFrame: string | null;
};

/** One tape, disc, or film reel to be transferred. */
export type VideoOrderLine = BaseOrderLine & {
  kind: "video";
  /** Category slug, "tapes-discs" or "reels". Matched against CATEGORIES. */
  slug: string;
  /** Format or reel size, e.g. "VHS", "MINI DV", "3IN". */
  option: string;
  /**
   * Delivery medium: "USB", "YOUR USB", "DVD/CD". Stored per line so the cart
   * can show and change it, but billed once per distinct choice across the
   * order — see videoOutputCharges. One USB holds the whole transfer.
   */
  output: string;
};

/** Anything in the order. Discriminate on `kind` before touching the rest. */
export type OrderLine = FilmOrderLine | VideoOrderLine;

/**
 * A line before it has been given an id — what addLine takes. Spelled as a
 * union of Omits rather than Omit<OrderLine, "id">, which would collapse the
 * two shapes into one and let a video line through missing `option`.
 */
export type NewOrderLine =
  | Omit<FilmOrderLine, "id">
  | Omit<VideoOrderLine, "id">;

/**
 * A change the cart can make to a line. Flat rather than a union of partials:
 * the cart applies one field at a time and reviseLine reconciles the result,
 * so a shared bag of optional fields keeps both the call sites and the row
 * definitions in the pricing modules free of per-kind generics.
 */
export type LinePatch = {
  size?: string;
  output?: string | null;
  exp?: string | null;
  sheetSize?: string | null;
  scanType?: string | null;
  pushPull?: number;
  halfFrame?: string | null;
  option?: string;
  qty?: number;
};

// Bump BOTH of these together when the OrderLine shape changes. Old data is
// then unreachable (different key) and, if it somehow is read, rejected
// (different version) instead of rendering as a half-broken line.
//
// v2 added `qty`. v3 added `kind` and the video line shape. v4 added `note` on
// every line and `scanType` on film lines. v5 added `pushPull` and `halfFrame`.
// v6 removed `note` again. Each bump simply abandons the older draft —
// inventing a quantity, or guessing that an untagged line meant film, is worse
// than asking for two rolls to be re-added. A v3 film line has no scan type,
// and defaulting it to STANDARD would silently reprice rolls the customer
// configured before the tier existed.
//
// v6 matters more than a removal usually would: a v5 line can carry a note the
// customer wrote and the counter would now never see, so those drafts have to
// go rather than come back quietly missing an instruction.
export const DRAFT_STORAGE_KEY = "nichols-order-draft-v6";
const DRAFT_VERSION = 6;

/** Drafts older than this aren't restored silently — the user is asked first. */
export const DRAFT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

type StoredDraft = {
  version: number;
  /** Epoch ms of the last write, used for the staleness check. */
  savedAt: number;
  lines: OrderLine[];
};

export type LoadedDraft = {
  lines: OrderLine[];
  savedAt: number;
  /** True when the draft is past DRAFT_MAX_AGE_MS — prompt, don't auto-restore. */
  stale: boolean;
};

/** Structural check for one stored line. Unknown slugs/sizes pass here and are
 *  filtered later against the live pricing data — this only rejects data that
 *  isn't the right *shape* to work with at all. */
function isOrderLine(value: unknown): value is OrderLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  const optionalString = (v: unknown) => v === null || typeof v === "string";

  const baseOk =
    typeof line.id === "string" &&
    typeof line.slug === "string" &&
    typeof line.qty === "number" &&
    Number.isInteger(line.qty) &&
    line.qty >= 1;
  if (!baseOk) return false;

  if (line.kind === "film") {
    return (
      typeof line.size === "string" &&
      optionalString(line.output) &&
      optionalString(line.exp) &&
      optionalString(line.sheetSize) &&
      // Structural only — the stops are clamped to the offered range by
      // reviseFilmLine, which owns what counts as a sane value.
      typeof line.pushPull === "number" &&
      Number.isInteger(line.pushPull) &&
      optionalString(line.halfFrame)
    );
  }
  if (line.kind === "video") {
    return typeof line.option === "string" && typeof line.output === "string";
  }
  return false;
}

/**
 * A stable key for everything about a line EXCEPT which line it is and how
 * many of it there are — so two rolls configured identically produce the same
 * key and the cart can add to the first rather than listing it twice.
 *
 * Built from the line's own fields rather than a hand-written per-kind
 * comparison, and sorted so key order can't matter (a restored draft comes
 * back through JSON.parse, which preserves whatever order it was written in).
 * The upshot is that a field added to either line shape starts distinguishing
 * lines automatically — the safe default, since a new field almost always
 * describes something the customer chose.
 */
export function configKey(line: NewOrderLine | OrderLine): string {
  const fields = Object.entries(line as Record<string, unknown>)
    .filter(([k]) => k !== "id" && k !== "qty")
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(fields);
}

/** Collision-resistant enough for a list one customer builds by hand. */
export function newLineId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The stored draft, or null when there is nothing usable to restore.
 * Returns stale drafts too, flagged — the caller decides whether to prompt.
 * Safe to call when localStorage is unavailable (SSR, Safari private mode).
 */
export function readDraft(): LoadedDraft | null {
  if (typeof window === "undefined") return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage disabled entirely (private mode, blocked cookies). Not an error
    // worth surfacing — the order just doesn't survive a refresh.
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearDraft();
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    clearDraft();
    return null;
  }

  const draft = parsed as Partial<StoredDraft>;
  if (
    draft.version !== DRAFT_VERSION ||
    typeof draft.savedAt !== "number" ||
    !Number.isFinite(draft.savedAt) ||
    !Array.isArray(draft.lines) ||
    !draft.lines.every(isOrderLine)
  ) {
    // Written by an older (or newer) schema. Drop it rather than guess.
    clearDraft();
    return null;
  }

  if (draft.lines.length === 0) {
    clearDraft();
    return null;
  }

  return {
    lines: draft.lines,
    savedAt: draft.savedAt,
    stale: Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS,
  };
}

/** Replace the stored draft, stamping it with the current time. */
export function writeDraft(lines: OrderLine[]): void {
  if (typeof window === "undefined") return;
  const draft: StoredDraft = {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    lines,
  };
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota exceeded or storage disabled — the in-memory order still works.
  }
}

/** Forget the stored draft. Called when the order empties, when the user
 *  declines to resume a stale one, and once an order form has been printed. */
export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to do — see writeDraft.
  }
}
