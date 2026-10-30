import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// hydrateRoot, not createRoot: every route ships as prerendered static HTML
// (see scripts/build.mjs) — the client attaches to that markup rather than
// rendering fresh, so a direct hit on /film/c-41 shows content immediately
// and hydrates in place, same as the old Next static export.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

hydrateRoot(
  document.getElementById("root")!,
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);
