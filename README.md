# Nichols Photo Lab — V3 (Vite + React)

## Stack
- Vite + React 19 + React Router + TypeScript
- CSS Modules (per-component) + `src/globals.css` for tokens
- Prerendered as static HTML at build time (`scripts/build.mjs`), so every
  route — including each film stock and video category page — ships as its
  own real `index.html` for SEO, the same as the old Next.js static export

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3001.

## Deploy (Network Solutions)

`npm run build` produces a static site in `./out` — no Node runtime needed on
the host.

```bash
npm run build      # outputs a static site to ./out
npm run serve      # optional: preview ./out locally at http://localhost:3001
```

Upload the **contents of `out/`** to the host's web root (e.g. via FTP/File Manager).

## Images

- Every `<Image>` (a thin wrapper in `src/components/Image.tsx`, mirroring
  next/image's `fill` behavior) just renders a plain `<img>` — there's no
  optimizer, so source files are served as-is.
  **Resize/compress large images before adding them to `public/`** (e.g.
  `sips --resampleHeightWidthMax 1600 -s format jpeg -s formatOptions 70 in.jpg --out out.jpg`).

## Structure

```
src/
  main.tsx               # Client entry — hydrates the prerendered HTML
  entry-server.tsx       # SSR entry used only by scripts/build.mjs to prerender
  App.tsx                # Route table
  RootLayout.tsx         # Wraps every route: OrderProvider, nav brand, footer, cart drawer
  routeMeta.ts           # Per-route <title>/description + the list of routes to prerender
  globals.css            # Tokens (paper-white, darkroom-red, black, b&w grays) + resets
  components/
    Image.tsx, SmartLink.tsx  # next/image and next/link replacements
    layout/              # Site chrome: Nav, MobileMenu, logos, Footer, FontFace, GridOverlay
    page/                # Shared page sections: PageHero, HeroSlides, ProductGrid,
                         #   ProcessSteps, Page.module.css (the <main> wrapper)
    configurator/        # Shared configurator frame, gallery, controls, cross-sell
  order/                 # The cart: OrderProvider, CartDrawer, CartButton, AddedToOrder,
                         #   OrderForm, and the order draft/pricing/summary logic
  lib/                   # Small shared helpers: basePath, media queries, URL state, hooks
  home/                  # Home page
  film/, video/          # Landing page, configurator, data + pricing for each product
  faq/, passport/, quote/
  data/generated/        # gallery + hero-slide JSON, regenerated from public/FILM/ on every dev/build start
scripts/
  generateStaticData.ts  # the build-time filesystem scans behind the film galleries
  build.mjs              # client build → SSR build → prerender every route → sitemap.xml/robots.txt
public/
  nichols-logo.svg
```

Each product folder keeps its data (`filmStocksData.ts`, `videoTransferData.ts`)
as the single source for prices, photos and options; the landing-page cards,
the configurator, the cart and the cross-sell strip all read from it.

## Notes
- Nav brand + links use `mix-blend-mode: difference` so they invert against whatever scrolls beneath. The CTA stays solid red.
