// Generates robots.txt at build time (static export writes it into out/).

import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://nicholsphotolab.com/sitemap.xml",
  };
}
