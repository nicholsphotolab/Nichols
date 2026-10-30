// build.mjs
// Orchestrates the whole production build:
//   1. client build (hashed JS/CSS, public/ copied, out/index.html)
//   2. SSR build of entry-server.tsx into a throwaway Node bundle
//   3. render() every route from routeMeta.ts and write each as its own
//      out/<route>/index.html — the same outcome as Next's
//      generateStaticParams + static export, so film-stock/video-category
//      pages still ship real static HTML for SEO
//   4. write out/404.html, out/sitemap.xml, out/robots.txt
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "out");
const SSR_TMP = path.join(ROOT, ".vite-ssr-tmp");

function writePage(template, outDir, routePath, html, head) {
  const page = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html);
  const outPath =
    routePath === "/"
      ? path.join(outDir, "index.html")
      : path.join(outDir, routePath, "index.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, page);
}

async function main() {
  await build({ root: ROOT });

  await build({
    root: ROOT,
    build: {
      ssr: "src/entry-server.tsx",
      outDir: ".vite-ssr-tmp",
      emptyOutDir: true,
    },
  });

  const ssrEntryUrl = pathToFileURL(path.join(SSR_TMP, "entry-server.js")).href;
  const { render, ROUTES, SITE_URL } = await import(ssrEntryUrl);

  const template = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf-8");

  for (const route of ROUTES) {
    const { html, head } = render(route);
    writePage(template, OUT_DIR, route, html, head);
  }

  // Any unmatched path renders the catch-all NotFoundPage — mirrors Next
  // static export's automatic 404.html.
  const notFound = render("/__not_found__");
  fs.writeFileSync(
    path.join(OUT_DIR, "404.html"),
    template
      .replace("<!--app-head-->", notFound.head)
      .replace("<!--app-html-->", notFound.html)
  );

  const now = new Date().toISOString();
  const urls = ROUTES.map(
    (r) =>
      `  <url>\n    <loc>${SITE_URL}${r === "/" ? "" : r}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`
  ).join("\n");
  fs.writeFileSync(
    path.join(OUT_DIR, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  fs.rmSync(SSR_TMP, { recursive: true, force: true });

  console.log(`Prerendered ${ROUTES.length} routes + 404.html to out/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
