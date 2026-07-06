// app/film/[stock]/page.tsx
// Dynamic route for individual film stock detail pages.
// URL pattern: /film/c-41, /film/bw, /film/e-6
// generateStaticParams pre-renders all known stocks at build time.
// The FilmStockConfigurator handles all interactive pricing logic client-side.
//
// Gallery images live under public/FILM/gallery/<slug>/ with one subfolder per
// film size, e.g.:
//   public/FILM/gallery/c-41/35mm/
//   public/FILM/gallery/c-41/120/
//   public/FILM/gallery/c-41/Disposable/
// The folder name maps to a SIZE pill value (case-insensitive, by prefix, so
// "Disposable" → "DISPOSABLE CAMERA"). Files within a folder sort
// alphabetically. The selected size's folder is the only one shown in the
// bottom carousel, so switching size swaps the strip entirely. Any loose image
// at the stock's gallery root is a shared product shot shown first for every
// size. Stocks/sizes without a folder fall back to their product shots from
// filmStocksData.
//
// The Sheet folder nests one level deeper — a subfolder per sheet size:
//   public/FILM/gallery/bw/Sheet/4x5/
//   public/FILM/gallery/bw/Sheet/5x7/
//   public/FILM/gallery/bw/Sheet/8x10/
// Each maps to a SHEET SIZE pill value, and the carousel shows only the
// selected sheet size's photos (plus any loose images directly in Sheet/,
// which show for every sheet size).

import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import FilmStockConfigurator, {
  type FilmStock,
  type StockGallery,
} from "../FilmStockConfigurator";
import { STOCKS } from "../filmStocksData";

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

// Sorted image filenames directly inside `dir` (non-recursive). Missing dir → [].
function imagesIn(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => !f.startsWith(".") && IMAGE_RE.test(f))
      .sort();
  } catch {
    return [];
  }
}

// Map a size subfolder name to the stock's SIZE pill value. Case-insensitive
// and prefix-based, so "35mm" → "35MM" and "Disposable" → "DISPOSABLE CAMERA".
function sizeForFolder(folder: string, stock: FilmStock): string | undefined {
  const up = folder.toUpperCase();
  return stock.sizes.find((s) => s === up || s.startsWith(up));
}

function galleryFor(slug: string, stock: FilmStock): StockGallery {
  const root = path.join(process.cwd(), "public", "FILM", "gallery", slug);
  const base = `/FILM/gallery/${slug}`;

  // Loose images at the gallery root are shared product shots.
  const product = imagesIn(root).map(
    (f) => `${base}/${encodeURIComponent(f)}`
  );

  // Each subdirectory is a size folder; map it to a SIZE pill value.
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    // No gallery folder yet — fall through to the product-shot fallback below.
  }

  const bySize: Record<string, string[]> = {};
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const size = sizeForFolder(entry.name, stock);
    if (!size) continue;
    const sizeDir = path.join(root, entry.name);
    const imgs = imagesIn(sizeDir).map(
      (f) => `${base}/${encodeURIComponent(entry.name)}/${encodeURIComponent(f)}`
    );
    if (imgs.length > 0) bySize[size] = imgs;

    // The SHEET folder nests one level deeper: a subfolder per sheet size
    // (Sheet/4x5, Sheet/5x7, Sheet/8x10), matched case-insensitively against
    // the stock's sheetSizes and keyed "SHEET/4X5" etc. The configurator shows
    // only the selected sheet size's photos, so switching 4x5 → 8x10 swaps the
    // strip — same behaviour as switching format. Loose images directly in
    // Sheet/ stay under plain "SHEET" and show for every sheet size.
    if (size !== "SHEET") continue;
    let sheetEntries: fs.Dirent[] = [];
    try {
      sheetEntries = fs.readdirSync(sizeDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const sub of sheetEntries) {
      if (!sub.isDirectory()) continue;
      const sheetSize = (stock.sheetSizes ?? []).find(
        (s) => s === sub.name.toUpperCase()
      );
      if (!sheetSize) continue;
      const sheetImgs = imagesIn(path.join(sizeDir, sub.name)).map(
        (f) =>
          `${base}/${encodeURIComponent(entry.name)}/${encodeURIComponent(sub.name)}/${encodeURIComponent(f)}`
      );
      if (sheetImgs.length > 0) bySize[`${size}/${sheetSize}`] = sheetImgs;
    }
  }

  // No sizeImages fallback here — the configurator always leads the lineup
  // with the size's product shot from filmStocksData (or the temporary
  // placeholder block), so surfacing it in bySize would duplicate it.
  return { product, bySize };
}

// Tell Next.js which slugs to statically generate at build time.
export function generateStaticParams() {
  return Object.keys(STOCKS).map((stock) => ({ stock }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stock: string }>;
}) {
  const { stock } = await params;
  const data = STOCKS[stock];
  if (!data) return {};
  return {
    title: `${data.name} Film Developing`,
    description: data.blurb,
  };
}

export default async function FilmStockPage({
  params,
}: {
  params: Promise<{ stock: string }>;
}) {
  const { stock } = await params;
  const data = STOCKS[stock];

  // Return 404 for any slug not defined in filmStocksData.ts.
  if (!data) notFound();

  // Galleries for every stock, not just the requested one — the TYPE row
  // switches stocks client-side without navigating.
  const galleries = Object.fromEntries(
    Object.entries(STOCKS).map(([slug, s]) => [slug, galleryFor(slug, s)])
  );

  return (
    <>
      {/* Solid white bar from the top — this page has no dark hero photo
          for the transparent scrim to sit over. */}
      <Nav activeHref="/film" solid />
      <FilmStockConfigurator initialSlug={stock} galleries={galleries} />
    </>
  );
}
