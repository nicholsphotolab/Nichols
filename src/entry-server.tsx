import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";
import { getRouteMeta, ROUTES, SITE_URL } from "./routeMeta";

// Called once per route by scripts/build.mjs after the client bundle is
// built, so each page ships as real static HTML (same outcome as Next's
// generateStaticParams) instead of an empty shell the browser has to render.
export function render(url: string) {
  // Same basename the browser's router gets (main.tsx) — the GitHub Pages
  // build lives under /Nichols/. Without it, links in the static HTML point
  // at /film instead of /Nichols/film, and React has to throw the
  // prerendered page away and redraw it when the two disagree.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  const html = renderToString(
    <StaticRouter basename={basename} location={basename + url}>
      <App />
    </StaticRouter>
  );
  const meta = getRouteMeta(url);
  const head = `<title>${meta.title}</title>\n    <meta name="description" content="${meta.description.replace(/"/g, "&quot;")}" />`;
  return { html, head };
}

export { ROUTES, SITE_URL };
