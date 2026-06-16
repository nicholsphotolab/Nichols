// videoTransferData.ts
// Source of truth for video & audio transfer pricing.
// Two categories — Tapes & Discs (uniform per-item price) and Film Reels
// (priced by reel size) — plus the output options shared by both. Consumed by
// the category cards on /video, the configurator on /video/[category], and
// the process steps section.

export type VideoOutput = {
  name: string;
  price: number;
  /** Flagged in the configurator as the recommended default. */
  recommended?: boolean;
};

// Output options shared by both categories. Added once per order, not per item.
export const OUTPUTS: VideoOutput[] = [
  { name: "USB", price: 15, recommended: true },
  { name: "YOUR USB", price: 2 },
  { name: "DVD/CD", price: 6 },
];

export type VideoOption = {
  name: string;
  price: number;
  /** Short description used by the process steps section. */
  description?: string;
};

export type VideoCategory = {
  slug: string;
  name: string;
  /** Price copy shown on the category card. */
  priceLine: string;
  /** Short description for the category card and process steps. */
  description: string;
  /** Label for the configurator's selector row: FORMAT or SIZE. */
  selectorLabel: string;
  /** Optional caption below the selector row. */
  selectorExplanation?: string;
  /** Optional card image; empty renders the striped placeholder. */
  image?: string;
  options: VideoOption[];
};

export const CATEGORIES: VideoCategory[] = [
  {
    slug: "tapes-discs",
    name: "Tapes & Discs",
    priceLine: "Transfer from $18.00",
    description:
      "VHS, camcorder tapes, audio cassettes, and discs captured to clean digital files.",
    selectorLabel: "FORMAT",
    options: [
      {
        name: "VHS",
        price: 18,
        description:
          "Standard VHS tapes captured to clean, shareable digital files.",
      },
      {
        name: "VHS-C",
        price: 18,
        description: "Compact VHS-C camcorder tapes transferred to digital.",
      },
      {
        name: "HI8",
        price: 18,
        description: "Hi8 and Video8 camcorder tapes digitized to modern files.",
      },
      {
        name: "MINI DV",
        price: 18,
        description:
          "MiniDV camcorder tapes captured frame-accurate to digital.",
      },
      {
        name: "CASSETTE",
        price: 18,
        description: "Audio cassette tapes converted to clean digital audio.",
      },
      {
        name: "DVD",
        price: 18,
        description:
          "DVDs and discs converted into modern, shareable digital files.",
      },
    ],
  },
  {
    slug: "reels",
    name: "Film Reels",
    priceLine: "Transfer $15–$40 by size",
    description:
      "8mm, Super 8, and 16mm film reels transferred frame by frame.",
    selectorLabel: "SIZE",
    selectorExplanation: "Measured by reel diameter.",
    // TODO: confirm 5IN and 7IN prices — endpoints ($15 / $40) are set,
    // the middle two are placeholders.
    options: [
      { name: "3IN", price: 15 },
      { name: "5IN", price: 22 },
      { name: "7IN", price: 30 },
      { name: "9IN", price: 40 },
    ],
  },
];

// Lookup map for the [category] route.
export const CATEGORIES_BY_SLUG: Record<string, VideoCategory> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
