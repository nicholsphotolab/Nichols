// generateStaticData.ts
// The two build-time filesystem scans behind the film hero slideshow
// (FilmPage.tsx) and the per-stock galleries (FilmStockPage.tsx) — a
// browser (and the prerendered static HTML) has no filesystem access, so
// this runs once up front (wired into vite.config.ts as a plugin, on both
// `vite dev` and `vite build`) and writes the results as JSON that the route
// components import like any other data module.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STOCKS } from "../src/film/filmStocksData";
import type { FilmStock, StockGallery } from "../src/film/filmStocksData";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const PUBLIC = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "src", "data", "generated");

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

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

// Maps a size subfolder name to the stock's SIZE pill value. Case-insensitive
// and prefix-based, so "35mm" → "35MM" and "Disposable" → "DISPOSABLE CAMERA".
function sizeForFolder(folder: string, stock: FilmStock): string | undefined {
  const up = folder.toUpperCase();
  return stock.sizes.find((s) => s === up || s.startsWith(up));
}

// public/FILM/gallery/<slug>/ — one subfolder per film size (35mm/, 120/,
// Disposable/), sorted alphabetically within a folder. Loose images at the
// gallery root are shared product shots shown first for every size. The
// Sheet folder nests one level deeper — a subfolder per sheet size
// (Sheet/4x5, Sheet/5x7, Sheet/8x10) — keyed "SHEET/4X5" etc.
function galleryFor(slug: string, stock: FilmStock): StockGallery {
  const root = path.join(PUBLIC, "FILM", "gallery", slug);
  const base = `/FILM/gallery/${slug}`;

  const product = imagesIn(root).map((f) => `${base}/${encodeURIComponent(f)}`);

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    // No gallery folder yet — fall through to the product-shot fallback.
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

    if (size !== "SHEET") continue;
    let sheetEntries: fs.Dirent[] = [];
    try {
      sheetEntries = fs.readdirSync(sizeDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const sub of sheetEntries) {
      if (!sub.isDirectory()) continue;
      const sheetSize = (stock.sheetSizes ?? []).find((s) => s === sub.name.toUpperCase());
      if (!sheetSize) continue;
      const sheetImgs = imagesIn(path.join(sizeDir, sub.name)).map(
        (f) =>
          `${base}/${encodeURIComponent(entry.name)}/${encodeURIComponent(sub.name)}/${encodeURIComponent(f)}`
      );
      if (sheetImgs.length > 0) bySize[`${size}/${sheetSize}`] = sheetImgs;
    }
  }
  return { product, bySize };
}

// One hero photo and what it was shot on — the film hero's bottom strip shows
// these, and the stock picks the photo's DX edge code. Mirrored by HeroSlide
// in src/film/FilmHero.tsx.
type HeroSlide = { src: string; stock: string; process: string; format: string };

const PROCESS_RE = /^(C-?41|E-?6|B&W|BW)$/i;
const FORMAT_RE = /^(35MM|120|110|DISPOSABLE|SHEET.*|4X5|5X7|8X10)$/i;

// public/FILM/ (desktop/tablet) and public/FILM/mobile/ (≤700px). Each file
// is named from three underscore-separated parts — stock, process, format —
// in any order: "Portra 400_C-41_35MM.webp" and "35MM_C-41_Portra 400.webp"
// read the same. The process and format are recognised by shape; whatever's
// left is the stock. A trailing "-N" disambiguator before the extension is
// ignored. Subdirectories are ignored.
function getHeroSlides(...segments: string[]): HeroSlide[] {
  const dir = path.join(PUBLIC, ...segments);
  const urlBase = `/${segments.join("/")}`;
  let files: string[];
  try {
    files = fs.readdirSync(dir).sort();
  } catch {
    return [];
  }

  const slides: HeroSlide[] = [];
  for (const file of files) {
    if (file.startsWith(".") || !IMAGE_RE.test(file)) continue;

    const base = file.replace(IMAGE_RE, "").replace(/-\d+$/, "");
    const parts = base
      .split("_")
      .map((part) => part.trim())
      .filter(Boolean);
    const processPart = parts.find((p) => PROCESS_RE.test(p)) ?? "";
    const format = parts.find((p) => FORMAT_RE.test(p)) ?? "";
    // "Cinestill800" → "Cinestill 800": a name run together with its speed
    // gets its space back (two or more letters, then two or more digits — so
    // "HP5" and "E100" stay whole).
    const stock = parts
      .filter((p) => p !== processPart && p !== format)
      .join(" ")
      .replace(/([A-Za-z]{2,})(\d{2,})/g, "$1 $2");
    // Filenames spell black & white "BW" — an "&" in a URL trips up Vite's
    // dev server — but the strip prints it as B&W.
    const process = /^b&?w$/i.test(processPart) ? "B&W" : processPart;

    slides.push({ src: `${urlBase}/${encodeURIComponent(file)}`, stock, process, format });
  }
  return slides;
}

export function generateStaticData(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const galleries = Object.fromEntries(
    Object.entries(STOCKS).map(([slug, stock]) => [slug, galleryFor(slug, stock)])
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "filmGalleries.json"),
    JSON.stringify(galleries, null, 2)
  );

  const heroSlides = {
    desktop: getHeroSlides("FILM"),
    mobile: getHeroSlides("FILM", "mobile"),
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "filmHeroSlides.json"),
    JSON.stringify(heroSlides, null, 2)
  );
}
