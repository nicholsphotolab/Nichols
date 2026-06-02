import type { FilmStock } from "./PriceConfigurator";

// Helper: same exposures for SCANS and PRINTS/SCANS at a given size.
const expByOutput = (list: string[]) => ({
  SCANS: list,
  "PRINTS/SCANS": list,
});

// Available exposures keyed by size, then output.
// Missing size → no EXP row shown (e.g. sheet film, NONE output).
const SHARED_EXPOSURES = {
  "35MM": expByOutput(["12", "24", "27", "36"]),
  "110": expByOutput(["12", "24"]),
};

// Per-exposure rates keyed by size, then output.
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
    sizes: ["35MM", "120", "4X5", "5X7", "8X10"],
    outputs: ["NONE", "SCANS", "PRINTS/SCANS"],
    exposures: SHARED_EXPOSURES,
    perExposureRate: SHARED_RATES,
    expExplanation: "some explanation",
  },
};
