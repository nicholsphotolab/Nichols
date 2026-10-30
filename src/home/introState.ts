// introState.ts
// Whether the home intro (HomeIntro) plays on this page load.
//
// It plays on a real page load of "/" — first visit or reload — and not when
// arriving at home by clicking around the site. Read once, when the app boots:
// a later client-side navigation to "/" sees it already spent. On the server
// (prerendering) there's no window and the home page only renders for "/", so
// the intro is always baked into the home page's HTML.

function bootedOnHome(): boolean {
  if (typeof window === "undefined") return true;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.slice(base.length).replace(/\/+$/, "");
  return path === "";
}

let pending = bootedOnHome();

/** True until the home page has mounted once on this page load. */
export function introPending(): boolean {
  return pending;
}

/** Called once the home page has mounted, so returning to it skips the intro. */
export function spendIntro(): void {
  pending = false;
}
