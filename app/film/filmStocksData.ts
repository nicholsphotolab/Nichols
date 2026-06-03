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

// Exposures shared across C-41 and B&W (35MM and 110 formats only).
// Sheet film sizes (4X5, 5X7, 8X10) have no exposure row — they're billed per sheet.
const SHARED_EXPOSURES = {
  "35MM": expByOutput(["12", "24", "27", "36"]),
  "110": expByOutput(["12", "24"]),
};

// Per-exposure surcharge in dollars, keyed by [size][output].
const SHARED_RATES = {
  "35MM": { SCANS: 0.35, "PRINTS/SCANS": 0.6 },
  "110": { SCANS: 0.75, "PRINTS/SCANS": 1.35 },
};

export const STOCKS: Record<string, FilmStock> = {
  "c-41": {
    slug: "c-41",
    name: "C‑41",
    basePrice: 6.5,
    image: "/C-41.webp",
    sizes: ["35MM", "110", "120", "4X5", "5X7", "8X10"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    expExplanation: "some explanation",
  },
  bw: {
    slug: "bw",
    name: "B&W",
    basePrice: 8.5,
    image: "/B&W.webp",
    sizes: ["35MM", "110", "120", "4X5", "5X7", "8X10"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    expExplanation: "some explanation",
  },
  "e-6": {
    slug: "e-6",
    name: "E‑6",
    basePrice: 8.5,
    image: "/E-6.webp",
    // E-6 doesn't come in 110 format.
    sizes: ["35MM", "120", "4X5", "5X7", "8X10"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    expExplanation: "some explanation",
  },
};
