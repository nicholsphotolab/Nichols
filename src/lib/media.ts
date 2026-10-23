// media.ts
// The two media queries scripts check, kept in one place so they can't drift
// from each other or from the stylesheets.

// Matches the site-wide mobile breakpoint used in every module's media queries.
export const PHONE_QUERY = "(max-width: 700px)";

export function isPhone(): boolean {
  return window.matchMedia(PHONE_QUERY).matches;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
