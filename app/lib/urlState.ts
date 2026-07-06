// urlState.ts
// Helpers for mirroring configurator selections into the URL's query string —
// the path identifies the product (/film/c-41, /video/reels); the query holds
// the customization (?format=120&output=prints-scans), with defaults omitted
// so uncustomized URLs stay clean.
//
// Always written with history.replaceState: selections rewrite the current
// history entry rather than stacking new ones, so the browser's Back button
// exits to the page the user came from instead of stepping back through
// every pill click.
//
// Values are matched against the live option lists on read, so an unknown or
// stale value in a shared/bookmarked URL is simply ignored and that row falls
// back to its default.

/** URL-friendly form of an option value: "PRINTS/SCANS" → "prints-scans". */
export function slugifyOption(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The option whose slug matches `param`, or null when nothing does. */
export function matchOption(
  param: string | null,
  options: readonly string[]
): string | null {
  if (!param) return null;
  return options.find((o) => slugifyOption(o) === param) ?? null;
}

/** "?a=b&c=d" from the non-null entries, or "" when every value is null. */
export function buildQuery(params: Record<string, string | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null) search.set(key, value);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
