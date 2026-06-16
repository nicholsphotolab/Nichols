# Nichols Photo Lab — V3 (Next.js)

## Stack
- Next.js 15 (App Router) + TypeScript
- CSS Modules (per-component) + `app/globals.css` for tokens
- Lenis smooth scroll (`lenis` package, initialized in `app/components/SmoothScroll.tsx`)

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3001.

## Deploy (Network Solutions)

The site is configured for **static export** (`output: "export"` in `next.config.mjs`),
because the host has no Node runtime.

```bash
npm run build      # outputs a static site to ./out
npm run serve      # optional: preview ./out locally at http://localhost:3001
```

Upload the **contents of `out/`** to the host's web root (e.g. via FTP/File Manager).
Do **not** upload `.next/` — that's the build cache, not the deployable site.

## Images

- All images use `next/image`, which adds lazy-loading automatically.
- Static export can't run the on-the-fly optimizer, so `images.unoptimized` is set
  and source files are served as-is. **Resize/compress large images before adding
  them to `public/`** (e.g. `sips --resampleHeightWidthMax 1600 -s format jpeg -s formatOptions 70 in.jpg --out out.jpg`).
- If the site ever moves to Vercel or a Node host, remove `unoptimized: true` and
  every `<Image>` starts auto-resizing and serving WebP/AVIF with no other changes.

## Structure

```
app/
  layout.tsx           # Loads Inter, globals, lenis css, mounts SmoothScroll
  page.tsx             # Composes Hero + ServicesCarousel + Nav
  globals.css          # Tokens (paper-white, darkroom-red, black, b&w grays) + resets
  components/
    Hero.tsx + .module.css
    Nav.tsx + .module.css            # 3 fixed elements: brand, links, CTA
    ServicesCarousel.tsx + .module.css # arrow-driven carousel, mobile = vertical stack
    SmoothScroll.tsx                 # Lenis init (client component)
public/
  nichols-logo.svg     # was V2/Nichols Logo.svg
```

## Notes
- Nav brand + links use `mix-blend-mode: difference` so they invert against whatever scrolls beneath. The CTA stays solid red.
- Carousel: desktop = horizontal arrow-tap navigation. ≤1024px = vertical stack.
