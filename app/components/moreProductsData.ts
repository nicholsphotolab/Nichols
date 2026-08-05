// moreProductsData.ts
// Catalog + picker for the "More at the lab" strip that sits under each
// configurator (film stocks and video transfers).
//
// This is deliberately cross-sell, not "related products". Someone pricing C-41
// development already knows the lab develops film, so the strip leads with a
// service they may not have thought about — a VHS tape, a film reel, passport
// photos — and mixes in one alternative from the service they're already in
// (the "another scanning option" slot). Whatever family the visitor is
// currently configuring is filtered out entirely.
//
// Prices mirror filmStocksData.ts / videoTransferData.ts; update both if a
// price changes. Image paths are case-sensitive on deploy and must match the
// filenames in public/ exactly — "&" is pre-encoded as %26, matching the
// convention in FilmStocksGrid.

export type LabService = "film" | "video" | "passport";

export type LabProduct = {
  /** Drives the cross-sell mix — the strip leads with a different service. */
  service: LabService;
  /** The configurator family: a film stock slug ("c-41") or a video category
      slug ("reels"). The family being configured is excluded, and the picker
      spreads its choices across families so the row never doubles up. */
  family: string;
  /** Mixed case for screen readers (all-caps is read letter by letter); the
      CSS uppercases it. A " - " separator splits the title into two parts
      that stack on their own lines on mobile. */
  title: string;
  priceLine: string;
  /** null renders the placeholder block — no product shot exists yet. */
  image: string | null;
  /** Deep-links to the exact stock/format combination, matching the product
      grids: the path picks the configurator, ?format= preselects the pill. */
  href: string;
};

export const CATALOG: LabProduct[] = [
  // ---------- Film ----------
  { service: "film", family: "c-41", title: "C‑41 - 35mm", priceLine: "Starting at $6.50", image: "/C-41_35mm.webp", href: "/film/c-41" },
  { service: "film", family: "c-41", title: "C‑41 - Disposable", priceLine: "Starting at $6.50", image: "/C-41_Disposable.webp", href: "/film/c-41?format=disposable-camera" },
  { service: "film", family: "c-41", title: "C‑41 - 120", priceLine: "Starting at $6.50", image: "/C-41_120.webp", href: "/film/c-41?format=120" },
  { service: "film", family: "bw", title: "B&W - 35mm", priceLine: "Starting at $8.50", image: "/B%26W_35mm.webp", href: "/film/bw" },
  { service: "film", family: "bw", title: "B&W - Sheet 4x5", priceLine: "Starting at $8.50", image: "/B%26W_Sheet_4x5.webp", href: "/film/bw?format=sheet&sheet=4x5" },
  { service: "film", family: "e-6", title: "E‑6 - 35mm", priceLine: "Starting at $8.50", image: "/E-6_35mm.webp", href: "/film/e-6" },
  { service: "film", family: "e-6", title: "E‑6 - 120", priceLine: "Starting at $8.50", image: "/E-6_120.webp", href: "/film/e-6?format=120" },

  // ---------- Video & audio ----------
  { service: "video", family: "tapes-discs", title: "VHS", priceLine: "Starting at $18.00", image: "/VIDEO/VHS.webp", href: "/video/tapes-discs" },
  { service: "video", family: "tapes-discs", title: "VHS-C", priceLine: "Starting at $18.00", image: "/VIDEO/VHS-C.webp", href: "/video/tapes-discs?format=vhs-c" },
  { service: "video", family: "tapes-discs", title: "Hi8", priceLine: "Starting at $18.00", image: "/VIDEO/Hi8.webp", href: "/video/tapes-discs?format=hi8" },
  { service: "video", family: "tapes-discs", title: "Mini DV", priceLine: "Starting at $18.00", image: "/VIDEO/MiniDV.webp", href: "/video/tapes-discs?format=mini-dv" },
  { service: "video", family: "tapes-discs", title: "Cassette", priceLine: "Starting at $18.00", image: "/VIDEO/Cassette.webp", href: "/video/tapes-discs?format=cassette" },
  { service: "video", family: "tapes-discs", title: "DVD", priceLine: "Starting at $18.00", image: "/VIDEO/DVD.webp", href: "/video/tapes-discs?format=dvd" },
  { service: "video", family: "reels", title: "Reel 3 in.", priceLine: "Starting at $15.00", image: "/VIDEO/Reel-3in.webp", href: "/video/reels" },
  { service: "video", family: "reels", title: "Reel 7 in.", priceLine: "Starting at $30.00", image: "/VIDEO/Reel-7in.webp", href: "/video/reels?format=7in" },

  // ---------- Passport ----------
  // No product shot yet — renders the placeholder block.
  { service: "passport", family: "passport", title: "Passport Photos", priceLine: "Starting at $6.50", image: null, href: "/passport" },
];

// Rotation seed, so sibling pages don't all surface the same four cards.
// A family's position here offsets where its lists start; the order is
// arbitrary but must stay stable, since it's what makes each page's row
// deterministic (and therefore identical between the server render and
// hydration).
const FAMILY_ORDER = ["c-41", "bw", "e-6", "tapes-discs", "reels"];

function rotate<T>(list: T[], by: number): T[] {
  if (list.length === 0) return list;
  return list.map((_, i) => list[(i + by) % list.length]);
}

// The next unpicked product, preferring one whose family isn't on the row yet
// so the four cards never double up (two VHS-family tapes, say). Falls back to
// any unpicked product when every remaining candidate repeats a family.
function takeNext(queue: LabProduct[], picked: LabProduct[]) {
  return (
    queue.find(
      (p) => !picked.includes(p) && !picked.some((q) => q.family === p.family)
    ) ?? queue.find((p) => !picked.includes(p))
  );
}

/**
 * The products to show under the configurator for `family` (a film stock slug
 * or a video category slug). Pure and deterministic — same family in, same
 * cards out — so it's safe to call during a static render and again on
 * hydration.
 */
export function pickMoreProducts(family: string, count = 4): LabProduct[] {
  const service = CATALOG.find((p) => p.family === family)?.service ?? "film";
  const by = Math.max(0, FAMILY_ORDER.indexOf(family));
  const pool = CATALOG.filter((p) => p.family !== family);

  // Rotating the two lists by different amounts keeps neighbouring pages from
  // landing on the same pair.
  const crossService = rotate(
    pool.filter((p) => p.service !== service && p.service !== "passport"),
    by * 2
  );
  const sameService = rotate(
    pool.filter((p) => p.service === service),
    by
  );
  const passport = pool.filter((p) => p.service === "passport");

  // Lead with the other service (the point of the strip), sit one alternative
  // from the service they're already in at position two, then a second
  // cross-service pick, and close on passport.
  const picked: LabProduct[] = [];
  for (const queue of [crossService, sameService, crossService, passport]) {
    const next = takeNext(queue, picked);
    if (next) picked.push(next);
  }

  // Backfill if a bucket ran dry (a service with only one family, say).
  for (const p of [...crossService, ...sameService, ...passport]) {
    if (picked.length >= count) break;
    if (!picked.includes(p)) picked.push(p);
  }

  return picked.slice(0, count);
}
