// videoPageContent.ts
// Card data and step copy for the /video landing page — the product grid and
// the "how it works" steps. The components that render them are shared with
// the film page (components/page/ProductGrid, ProcessSteps).

import type { ProductCard } from "@/components/page/ProductGrid";
import type { ProcessStep } from "@/components/page/ProcessSteps";
import { formatUSD } from "@/order/orderSummary";
import { slugifyOption } from "@/lib/urlState";
import { videoOptionTitle } from "./videoPricing";
import { CATEGORIES, OUTPUTS } from "./videoTransferData";

// One card per format/size, derived from videoTransferData so a price or
// product shot can only be changed in one place. Each card deep-links to its
// exact category + format: the path picks the estimator and ?format=
// preselects the FORMAT/SIZE pill. Each category's first option is its
// configurator default, so that card keeps the clean path — matching the
// defaults-omitted URL convention. `tag` is the product category (film uses
// the development process there).
//
// Titles are written in mixed case for screen readers (all-caps text can be
// read letter by letter); the CSS uppercases them for display. The data's
// option names are stored on saved orders, so they stay as they are and the
// two that need it get a display title here.
const CARD_TITLES: Record<string, string> = {
  "MINI DV": "Mini DV",
  CASSETTE: "Cassette",
};

export const VIDEO_CARDS: ProductCard[] = CATEGORIES.flatMap((c) =>
  c.options.map((o, i) => ({
    tag: c.name,
    title: CARD_TITLES[o.name] ?? videoOptionTitle(c, o.name),
    priceLine: `Starting at ${formatUSD(o.price)}`,
    image: o.image ?? null,
    href: `/video/${c.slug}${i === 0 ? "" : `?format=${slugifyOption(o.name)}`}`,
    family: c.slug,
  }))
);

// Output descriptions keyed by the option names in videoTransferData.
const OUTPUT_DESCRIPTIONS: Record<string, string> = {
  USB: "Your footage loaded onto a USB drive to keep — easiest to share and back up.",
  "YOUR USB": "Bring your own drive and we load your footage onto it.",
  "DVD/CD": "Your memories burned to disc for easy playback on any player.",
};

export const VIDEO_STEPS: ProcessStep[] = [
  {
    label: "Format",
    // Sourced from videoTransferData so the category cards, estimator, and
    // steps never drift. Tape/disc formats link to their category page;
    // reels appear as one item.
    items: CATEGORIES.flatMap((c) =>
      c.slug === "reels"
        ? [{ name: c.name, description: c.description, href: `/video/${c.slug}` }]
        : c.options.map((o) => ({
            name: o.name,
            description: o.description ?? "",
            href: `/video/${c.slug}`,
          }))
    ),
  },
  {
    label: "Output",
    items: OUTPUTS.map((o) => ({
      name: o.name,
      description: `${OUTPUT_DESCRIPTIONS[o.name] ?? ""} ${formatUSD(o.price)}${o.recommended ? " — recommended." : "."}`,
    })),
  },
  {
    label: "Pickup",
    items: [
      {
        name: "Lab Pickup",
        description: "Pick up your originals and finished order at the lab.",
      },
      {
        name: "Discard",
        description: "We dispose of your original media after transfer.",
      },
      {
        name: "Ship",
        description: "We ship your originals and finished order to you. Starting at $8.00 depending on destination.",
      },
    ],
  },
];
