import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";
import { getRouteMeta, ROUTES, SITE_URL } from "./routeMeta";

// Called once per route by scripts/build.mjs after the client bundle is
// built, so each page ships as real static HTML (same outcome as Next's
// generateStaticParams) instead of an empty shell the browser has to render.
export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
  const meta = getRouteMeta(url);
  const head = `<title>${meta.title}</title>\n    <meta name="description" content="${meta.description.replace(/"/g, "&quot;")}" />`;
  return { html, head };
}

export { ROUTES, SITE_URL };
