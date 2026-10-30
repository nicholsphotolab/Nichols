// routeMeta.ts
// Single source of truth for per-route <title>/description, replacing Next's
// per-page `metadata` exports and the two dynamic routes' `generateMetadata`.
// Consumed by:
//   - entry-server.tsx, to write the initial <title>/<meta> into each
//     prerendered page's static HTML
//   - App.tsx's RouteMeta, to keep them correct across client-side navigation
//   - scripts/build.mjs, for the list of routes to prerender and for sitemap.xml
import { STOCKS } from "@/film/filmStocksData";
import { CATEGORIES_BY_SLUG } from "@/video/videoTransferData";

export const SITE_URL = "https://nicholsphotolab.com";
const SITE_TITLE = "Nichols Photo Lab";
const SITE_DESCRIPTION =
  "Salt Lake City film lab. Develop, scan, and print. Prints, video transfer, and passport photos.";

// Leaf title only; the template appends the brand — mirrors Next's
// `title: { default, template: "%s — Nichols Photo Lab" }`.
function withTemplate(leaf?: string): string {
  return leaf ? `${leaf} — ${SITE_TITLE}` : SITE_TITLE;
}

export type RouteMeta = { title: string; description: string };

const STATIC_META: Record<string, RouteMeta> = {
  "/": { title: withTemplate(), description: SITE_DESCRIPTION },
  "/film": {
    title: withTemplate("Film Developing"),
    description:
      "C-41, black & white, and E-6 film developing in Salt Lake City — 35mm, 120, 110, disposables, and sheet film, developed and scanned in-house.",
  },
  "/video": {
    title: withTemplate("Video & Audio Transfer"),
    description:
      "VHS, camcorder tapes, audio cassettes, discs, and 8mm/Super 8/16mm film reels digitized to clean, shareable files in Salt Lake City.",
  },
  "/quote": {
    title: withTemplate("Get a Quote"),
    description:
      "Tell us about your film, print, or transfer order and we'll confirm pricing and turnaround.",
  },
  "/faq": {
    title: withTemplate("FAQ"),
    description:
      "Answers to common questions about film processing, prints, passport photos, and general store info.",
  },
  "/passport": {
    title: withTemplate("Passport Photos"),
    description:
      "Walk-in passport photos in Salt Lake City — US and international sizes, shot and printed in-house while you wait. Monday–Friday, 9AM–4PM.",
  },
};

const NOT_FOUND_META: RouteMeta = {
  title: withTemplate("Page Not Found"),
  description: SITE_DESCRIPTION,
};

export function getRouteMeta(pathname: string): RouteMeta {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

  const stockMatch = path.match(/^\/film\/([^/]+)$/);
  if (stockMatch) {
    const stock = STOCKS[stockMatch[1]];
    return stock
      ? { title: withTemplate(`${stock.name} Film Developing`), description: stock.blurb }
      : NOT_FOUND_META;
  }

  const categoryMatch = path.match(/^\/video\/([^/]+)$/);
  if (categoryMatch) {
    const category = CATEGORIES_BY_SLUG[categoryMatch[1]];
    return category
      ? { title: withTemplate(`${category.name} Transfer`), description: category.description }
      : NOT_FOUND_META;
  }

  return STATIC_META[path] ?? NOT_FOUND_META;
}

// Every route that should be prerendered as its own static HTML file and
// listed in sitemap.xml.
export const ROUTES: string[] = [
  ...Object.keys(STATIC_META),
  ...Object.keys(STOCKS).map((slug) => `/film/${slug}`),
  ...Object.keys(CATEGORIES_BY_SLUG).map((slug) => `/video/${slug}`),
];
