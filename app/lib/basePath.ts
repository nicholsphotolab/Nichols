// next/image's "unoptimized" loader (required for static export) does not
// prepend the configured basePath to local image sources, unlike next/link
// and CSS/JS asset URLs which Next.js handles automatically. Any root-relative
// asset path (image, video, icon) passed to <Image>, <img>, <video>, or used
// in a CSS url() must be run through this helper.
export function withBasePath(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}`;
}
