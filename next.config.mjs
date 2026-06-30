// The GitHub Actions Pages build serves the site from a /<repo>/ subpath
// (nicholsphotolab.github.io/Nichols/), so asset URLs need that prefix.
// The Network Solutions deploy serves from the domain root and must NOT
// get a basePath, so this only kicks in inside GitHub Actions.
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = isGithubActions && repo ? `/${repo}` : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — required for Network Solutions (no Node runtime).
  // Produces an `out/` folder of plain files on `next build`.
  output: "export",
  basePath,
  assetPrefix: basePath,
  // Exposed so app code can prefix root-relative asset paths (next/image's
  // `unoptimized` loader does NOT add basePath on its own — see lib/basePath.ts).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
