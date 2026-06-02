# Nichols Photo Lab — V3 (Next.js)

## Stack
- Next.js 15 (App Router) + TypeScript
- CSS Modules (per-component) + `app/globals.css` for tokens
- Lenis smooth scroll (`lenis` package, initialized in `app/components/SmoothScroll.tsx`)

## Run

```bash
cd Nichols/V3
npm install
npm run dev
```

Then open http://localhost:3000.

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
  hero.png             # was V2/Hero Image.png
  nichols-logo.svg     # was V2/Nichols Logo.svg
```

## Notes
- Nav brand + links use `mix-blend-mode: difference` so they invert against whatever scrolls beneath. The CTA stays solid red.
- Carousel: desktop = horizontal arrow-tap navigation. ≤1024px = vertical stack.
