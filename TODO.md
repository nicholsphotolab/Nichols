# TODO

Pending tasks tracked outside of conversation so they don't get lost.

## 🖼️ Image optimization (pending)

The cutout canister WebPs were optimized (Nov 2024) but several other images
are still oversized and decode to huge bitmaps at runtime, causing scroll jank.

### Photoshop workflow

For each: `Image → Image Size → [target width]` → `Edit → Convert to Profile → sRGB`
→ `File → Export → Export As → WebP` with all metadata checkboxes off.

| File | Current | Target | Quality | Used by |
| --- | --- | --- | --- | --- |
| `public/Hero-Film.webp` ⚠️ priority | 6573×4701, 248 KB | 2000 px, ~150 KB | Lossy 70 | Home services carousel — film card |
| `public/C-41.webp` | 2469×3456, 115 KB | 1500 px, ~80 KB | Lossy 70 | `/film` stock card |
| `public/B&W.webp` | 2469×3456, 237 KB | 1500 px, ~100 KB | Lossy 70 | `/film` stock card |
| `public/E-6.webp` | 2469×3456, 124 KB | 1500 px, ~80 KB | Lossy 70 | `/film` stock card |
| `public/Hero.jpg` | 5.7 MB | 2000 px webp, ~300 KB | Lossy **80** | Home hero (full-bleed) |

Save each over the existing filename in `public/` so no code changes are needed.
For `Hero.jpg`, export as `hero.webp` and I'll swap the reference in
`app/components/Hero.tsx`.

### Why the priority

`Hero-Film.webp` decodes to ~120 MB of RAM at 6573×4701, even though the file
is only 248 KB. That's the kind of allocation that drops scroll frames on the
home carousel.

### After optimization

Delete the unused PNG originals from `public/` (`C41.png`, `B&W.png`, `E-6.png`,
`hero.png`) — ~38 MB of dead weight not referenced anywhere in code.

---

## Other open items (from earlier conversations)

- **Pricing rules** — confirm per-exposure rates and exposure options for sizes
  beyond 35mm / 110 (currently 120, 4×5, 5×7, 8×10 only charge `basePrice`).
  Defined in `app/film/stocks.ts` → `SHARED_RATES` and `SHARED_EXPOSURES`.
- **Multi-roll estimate drawer** — design discussion noted; not implemented.
  Likely a floating tally drawer with persistent localStorage state.
- **Shipping / drop-off CTAs** on price pages — pending decision on dual CTA
  vs single "How to send us your film" page.
- **Pages still 404** — `/prints`, `/video`, `/passport`, `/about` are linked
  in the nav but have no routes.
- **Tagline** — Option J variant with in-house emphasis chosen but not yet
  added to the hero.
