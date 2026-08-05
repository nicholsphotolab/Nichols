// filmStocksData.ts
// Source of truth for all film stock pricing data.
// Each entry maps a URL slug to a FilmStock object consumed by FilmStockConfigurator.
// To add a new stock: add an entry to STOCKS and a route will be pre-rendered
// automatically via generateStaticParams in app/film/[stock]/page.tsx.

import type { FilmStock } from "./FilmStockConfigurator";

// Returns the same exposure list for both SCANS and PRINTS/SCANS outputs.
const expByOutput = (list: string[]) => ({
  SCANS: list,
  "PRINTS/SCANS": list,
});

// Exposures shown in the EXP selector, keyed by [size][output].
// Disposable cameras are intentionally excluded — their 27-exposure count is
// applied silently via defaultExposures so the EXP row never appears.
// Sheet film sizes (4X5, 5X7, 8X10) are also excluded — billed per sheet.
const SHARED_EXPOSURES = {
  "35MM": expByOutput(["24", "36"]),
  "110": expByOutput(["12", "24"]),
  // 120 frame counts vary by camera format (6x7, 6x6, 6x4.5).
  "120": expByOutput(["10", "12", "16"]),
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
