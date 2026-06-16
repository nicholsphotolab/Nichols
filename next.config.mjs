/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — required for Network Solutions (no Node runtime).
  // Produces an `out/` folder of plain files on `next build`.
  output: "export",
  images: {
    // The on-the-fly image optimizer needs a Node server, which the static
    // host doesn't provide. `unoptimized` makes next/image serve the source
    // file as-is. If this site ever moves to Vercel or a Node host, drop this
    // flag and every <Image> starts auto-resizing/serving WebP with no other
    // code changes.
    unoptimized: true,
  },
};

export default nextConfig;
