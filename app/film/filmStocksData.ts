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

// Placeholder per-sheet pricing, keyed by [sheetSize][output]. TODO: replace
// with real rates once pricing is finalized.
const SHEET_RATES = {
  "4X5": { SCANS: 1.5, "PRINTS/SCANS": 2.5 },
  "5X7": { SCANS: 2.5, "PRINTS/SCANS": 3.5 },
  "8X10": { SCANS: 3.5, "PRINTS/SCANS": 4.5 },
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
    sizeImages: { "35MM": "/C-41_35mm.webp", "120": "/C-41-120.webp" },
    sizes: ["35MM", "DISPOSABLE CAMERA", "110", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    defaultExposures: DISPOSABLE_DEFAULTS,
    expExplanation: "some explanation",
  },
  bw: {
    slug: "bw",
    name: "B&W",
    blurb:
      "Developed in dedicated black & white chemistry for true neutral tones and deep blacks. Timeless, grain-forward, and beautifully simple.",
    basePrice: 8.5,
    image: "/B&W.webp",
    sizeImages: { "35MM": "/B&W_35mm.webp" },
    sizes: ["35MM", "DISPOSABLE CAMERA", "110", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    defaultExposures: DISPOSABLE_DEFAULTS,
    expExplanation: "some explanation",
  },
  "e-6": {
    slug: "e-6",
    name: "E‑6",
    blurb:
      "Color slide film developed as positives you can hold up to the light. Punchy saturation and fine grain — the connoisseur's choice.",
    basePrice: 8.5,
    image: "/E-6.webp",
    sizeImages: { "35MM": "/E-6_35mm.webp" },
    // E-6 doesn't come in 110 format.
    sizes: ["35MM", "120", "SHEET"],
    sheetSizes: SHEET_SIZES,
    sheetSizeRates: SHEET_RATES,
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    expExplanation: "some explanation",
  },
};
