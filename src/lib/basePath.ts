// Vite's `base` config (set from GITHUB_ACTIONS/GITHUB_REPOSITORY in
// vite.config.ts, exposed at runtime as import.meta.env.BASE_URL) is applied
// automatically to next/link-equivalent internal routes, module asset
// imports, and index.html — but NOT to root-relative paths baked into data
// (image/video/icon paths in filmStocksData.ts, videoTransferData.ts, etc.)
// or written directly in JSX/CSS. Run any of those through this helper.
export function withBasePath(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${src}`;
}
