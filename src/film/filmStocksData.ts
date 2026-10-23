// filmStocksData.ts
// Source of truth for all film stock pricing data.
// Each entry maps a URL slug to a FilmStock object (shape defined below)
// consumed by FilmStockConfigurator and priced by filmPricing.ts.
// To add a new stock: add an entry to STOCKS and a route will be pre-rendered
// automatically — src/film/FilmStockPage.tsx renders one route per key.

// Shape of a single film stock's pricing and option data.
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

// Per-stock gallery, built at build time by scripts/generateStaticData.ts from
// the size subfolders under public/FILM/gallery/<slug>/ (e.g. 35mm/, 120/, Disposable/).
// `product` holds any loose images at the stock's gallery root — shared shots
// shown first for every size. `bySize` maps a SIZE pill value (e.g. "35MM",
// "DISPOSABLE CAMERA", "120") to the photos in that size's folder. The bottom
// carousel shows only `product` + the selected size's images, so switching
// size swaps the strip entirely.
export type StockGallery = {
  product: string[];
  bySize: Record<string, string[]>;
};

// Returns the same exposure list for both SCANS and PRINTS/SCANS outputs.
const expByOutput = (list: string[]) => ({
  SCANS: list,
  "PRINTS/SCANS": list,
});

// Exposures shown in the EXP selector, keyed by [size][output].
// Disposable cameras are intentionally excluded — their 27-exposure count is
// applied silently via defaultExposures so the EXP row never appears.
// Sheet film sizes (4X5, 5X7, 8X10) are also excluded — billed per sheet, so
// they have no exposure list to order.
//
// Highest count first in every list. The order is also the default: defaultsFor
// takes the head of the list when it can't find 36, so a full roll is what the
// estimate opens on rather than the smallest one the format comes in.
const SHARED_EXPOSURES = {
  "35MM": expByOutput(["36", "24"]),
  "110": expByOutput(["24", "12"]),
  // 120 frame counts vary by camera format (6x4.5, 6x6, 6x7).
  "120": expByOutput(["16", "12", "10"]),
};

// Silent default exposure count per size — used in price calculation without
// displaying an EXP selector row.
const DISPOSABLE_DEFAULTS = { "DISPOSABLE CAMERA": "27" };

// Sheet film dimensions — shown in a secondary row (where EXP would sit)
// when SHEET is the selected size. Billed per sheet, so no exposure data.
const SHEET_SIZES = ["4X5", "5X7", "8X10"];

// Per-sheet output pricing, keyed by [sheetSize][output]. Scans are a flat $5
// per sheet at every size; PRINTS/SCANS adds the print on top of the scan
// (+$0.60 / +$0.98 / +$4.00 by size). Shared by all stocks.
const SHEET_RATES = {
  "4X5": { SCANS: 5, "PRINTS/SCANS": 5.6 },
  "5X7": { SCANS: 5, "PRINTS/SCANS": 5.98 },
  "8X10": { SCANS: 5, "PRINTS/SCANS": 9 },
};

// Per-sheet DEVELOPMENT fee, keyed by [stock slug][sheetSize]. Sheet film is
// developed per sheet, so this replaces the stock's roll basePrice when the
// SHEET format is selected.
const SHEET_DEV_RATES: Record<string, Record<string, number>> = {
  "c-41": { "4X5": 4.0, "5X7": 5.0, "8X10": 6.5 },
  bw: { "4X5": 6.0, "5X7": 7.0, "8X10": 8.5 },
  "e-6": { "4X5": 5.0, "5X7": 6.0, "8X10": 7.5 },
};

// Per-exposure surcharge in dollars, keyed by [size][output].
const SHARED_RATES = {
  "35MM": { SCANS: 0.35, "PRINTS/SCANS": 0.6 },
  "DISPOSABLE CAMERA": { SCANS: 0.35, "PRINTS/SCANS": 0.6 },
  "110": { SCANS: 0.75, "PRINTS/SCANS": 1.35 },
  "120": { SCANS: 0.60, "PRINTS/SCANS": 0.80 },

};

// ---------- Scan type ----------
// Resolution tier, offered whenever the output includes scanning. The rates
// below are the tables above scaled whole — +48.57% for high resolution (the
// 0.35 → 0.52 step, ×52/35) and +100% for TIFF, which is high resolution plus
// the TIFF file. Written out rather than computed so every price is visible and
// individually editable: the $0.60 cells are hand-set to $0.90 / $1.20 rather
// than the $0.89 / $1.20 the multiplier alone would give.
//
// Standard is the base table, so it is not repeated here — a missing cell falls
// back to it, which also means a new size only needs adding where it differs.
export const SCAN_TYPE_ORDER = ["STANDARD", "HIGH", "TIFF"];

export const SCAN_TYPE_LABELS: Record<string, string> = {
  STANDARD: "STANDARD",
  HIGH: "HIGH RESOLUTION",
  TIFF: "TIFF",
};

/** How the tier reads in the itemized breakdown, appended to the scan line. */
export const SCAN_TYPE_LINE_LABEL: Record<string, string> = {
  STANDARD: "Standard",
  HIGH: "High Resolution",
  TIFF: "TIFF",
};

/** Per-exposure rates by [scanType][size][output]. */
export const SCAN_TYPE_RATES: Record<
  string,
  Record<string, Record<string, number>>
> = {
  STANDARD: SHARED_RATES,
  HIGH: {
    "35MM": { SCANS: 0.52, "PRINTS/SCANS": 0.9 },
    "DISPOSABLE CAMERA": { SCANS: 0.52, "PRINTS/SCANS": 0.9 },
    "110": { SCANS: 1.11, "PRINTS/SCANS": 2.01 },
    "120": { SCANS: 0.9, "PRINTS/SCANS": 1.19 },
  },
  TIFF: {
    "35MM": { SCANS: 0.7, "PRINTS/SCANS": 1.2 },
    "DISPOSABLE CAMERA": { SCANS: 0.7, "PRINTS/SCANS": 1.2 },
    "110": { SCANS: 1.5, "PRINTS/SCANS": 2.7 },
    "120": { SCANS: 1.2, "PRINTS/SCANS": 1.6 },
  },
};

/** Per-sheet rates by [scanType][sheetSize][output]. */
export const SHEET_SCAN_TYPE_RATES: Record<
  string,
  Record<string, Record<string, number>>
> = {
  STANDARD: SHEET_RATES,
  HIGH: {
    "4X5": { SCANS: 7.43, "PRINTS/SCANS": 8.32 },
    "5X7": { SCANS: 7.43, "PRINTS/SCANS": 8.88 },
    "8X10": { SCANS: 7.43, "PRINTS/SCANS": 13.37 },
  },
  TIFF: {
    "4X5": { SCANS: 10, "PRINTS/SCANS": 11.2 },
    "5X7": { SCANS: 10, "PRINTS/SCANS": 11.96 },
    "8X10": { SCANS: 10, "PRINTS/SCANS": 18 },
  },
};

export const STOCKS: Record<string, FilmStock> = {
  "c-41": {
    slug: "c-41",
    name: "C‑41",
    blurb:
      "The standard process for almost any color film. Warm tones, great skin colors, and forgiving enough that even a point-and-shoot turns out.",
    basePrice: 6.5,
    image: "/C-41.webp",
    // Product shots by size. Sizes without one show the temporary bw-600
    // block in the product slot until theirs is shot. SHEET shots can be
    // keyed per sheet size ("SHEET/4X5") with "SHEET" as the fallback.
    sizeImages: {
      "35MM": "/C-41_35mm.webp",
      "DISPOSABLE CAMERA": "/C-41_Disposable.webp",
      "110": "/C-41_110.webp",
      "120": "/C-41_120.webp",
    },
    sizes: ["35MM", "DISPOSABLE CAMERA", "110", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    sheetDevRates: SHEET_DEV_RATES["c-41"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    defaultExposures: DISPOSABLE_DEFAULTS,
  },
  bw: {
    slug: "bw",
    name: "B&W",
    blurb:
      "Developed in dedicated black & white chemistry for true neutral tones and deep blacks. Timeless, grain-forward, and beautifully simple.",
    basePrice: 8.5,
    image: "/B&W.webp",
    sizeImages: {
      "35MM": "/B&W_35mm.webp",
      "DISPOSABLE CAMERA": "/B&W_Disposable.webp",
      "110": "/B&W_110.webp",
      "SHEET/4X5": "/B&W_Sheet_4x5.webp",
    },
    sizes: ["35MM", "DISPOSABLE CAMERA", "110", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    sheetDevRates: SHEET_DEV_RATES["bw"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    defaultExposures: DISPOSABLE_DEFAULTS,
  },
  "e-6": {
    slug: "e-6",
    name: "E‑6",
    blurb:
      "Color slide film developed as positives you can hold up to the light. Punchy saturation and fine grain — the connoisseur's choice.",
    basePrice: 8.5,
    image: "/E-6.webp",
    sizeImages: {
      "35MM": "/E-6_35mm.webp",
      "120": "/E-6_120.webp",
    },
    // E-6 doesn't come in 110 format.
    sizes: ["35MM", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    sheetDevRates: SHEET_DEV_RATES["e-6"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
  },
};
