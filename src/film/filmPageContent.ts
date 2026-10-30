// filmPageContent.ts
// Copy and card data for the /film landing page — the product grid and the
// "how it works" steps. The components that render them are shared with the
// video page (components/page/ProductGrid, ProcessSteps).

import type { ProductCard } from "@/components/page/ProductGrid";
import type { ProcessStep } from "@/components/page/ProcessSteps";
import { formatUSD } from "@/order/orderSummary";
import { STOCKS } from "./filmStocksData";

// Each card deep-links to its exact stock + format combination: the path
// picks the stock and ?format= preselects the FORMAT pill (the configurator
// restores it on mount). 35MM is the configurator default, so those cards
// keep the clean path — matching the defaults-omitted URL convention.
// Tag (the process) and price come from filmStocksData, so they can only be
// changed there. Format titles are mixed case for screen readers (all-caps
// text can be read letter by letter); the CSS uppercases them for display.
// Image paths are case-sensitive on deploy. Keep "&" out of filenames — Vite's
// dev server can't serve one (B&W files are named BW).
function card(
  slug: string,
  title: string,
  image: string | null,
  query = ""
): ProductCard {
  const stock = STOCKS[slug];
  return {
    tag: stock.name,
    title,
    priceLine: `Starting at ${formatUSD(stock.basePrice)}`,
    image,
    href: `/film/${slug}${query}`,
    family: slug,
  };
}

export const FILM_CARDS: ProductCard[] = [
  card("c-41", "35mm", "/C-41_35mm.webp"),
  card("bw", "35mm", "/BW_35mm.webp"),
  card("e-6", "35mm", "/E-6_35mm.webp"),
  card("c-41", "Disposable", "/C-41_Disposable.webp", "?format=disposable-camera"),
  card("bw", "Disposable", "/BW_Disposable.webp", "?format=disposable-camera"),
  card("c-41", "120", "/C-41_120.webp", "?format=120"),
  card("bw", "120", null, "?format=120"),
  card("e-6", "120", "/E-6_120.webp", "?format=120"),
  card("bw", "Sheet 4x5", "/BW_Sheet_4x5.webp", "?format=sheet&sheet=4x5"),
];

// What each process actually is, what comes back from each output choice, and
// how film physically gets to the lab.
export const FILM_STEPS: ProcessStep[] = [
  {
    label: "Process",
    items: [
      {
        name: "C-41",
        description:
          "Standard color negative process — most consumer color film, including disposable cameras.",
        href: "/film/c-41",
      },
      {
        name: "Black & White",
        description:
          "Traditional black & white developing, from 35mm and 120 rolls down to 4x5 sheet film.",
        href: "/film/bw",
      },
      {
        name: "E-6",
        description:
          "Color slide (reversal) film — the process for chromes like Ektachrome or Provia.",
        href: "/film/e-6",
      },
    ],
  },
  {
    label: "Output",
    items: [
      {
        name: "Scans Only",
        description:
          "Digital scans of every frame, ready to download and share — no physical prints.",
      },
      {
        name: "Prints + Scans",
        description:
          "Physical prints of every frame plus the digital scans, so you get both a print and a file.",
      },
      {
        name: "Develop Only",
        description:
          "Just the film developed and returned as negatives — nothing scanned or printed. Good if you're scanning or printing elsewhere.",
      },
    ],
  },
  {
    label: "Drop-off & Mail-in",
    items: [
      {
        name: "Drop-Off",
        description:
          "Bring your film by the lab — how most orders come in. No forms needed ahead of time; we'll get your details at the counter.",
      },
      {
        name: "Mail-In",
        description:
          "Not local? Package your film and mail it in — we'll email an itemized invoice and return your originals and files once it's processed.",
      },
    ],
  },
];
