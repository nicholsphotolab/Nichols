// Generates sitemap.xml at build time (static export writes it into out/).
// Routes are enumerated from the same data sources that drive
// generateStaticParams, so new stocks/categories appear automatically.
// /prints and /about join this list when those pages exist.

import type { MetadataRoute } from "next";
import { STOCKS } from "./film/filmStocksData";
import { CATEGORIES } from "./video/videoTransferData";

const BASE = "https://nicholsphotolab.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/film", "/video", "/passport", "/faq", "/quote"];
  const stockRoutes = Object.keys(STOCKS).map((slug) => `/film/${slug}`);
  const categoryRoutes = CATEGORIES.map((c) => `/video/${c.slug}`);

  return [...staticRoutes, ...stockRoutes, ...categoryRoutes].map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
  }));
}
