import fs from "node:fs";
import path from "node:path";
import Nav from "../components/Nav";
import FilmHero, { type HeroSlide } from "./FilmHero";
import FilmStocksGrid from "./FilmStocksGrid";
import FilmJourney from "./FilmJourney";
import styles from "./page.module.css";

// Auto-build the hero slides from the image files in public/FILM/. Each file is
// named "Stock_Process_Frames" (underscore-delimited) — e.g.
// "Portra 400_C-41_36EXP.jpg" → caption "Portra 400" / "C-41 • 36EXP". A trailing
// "-N" before the extension (used to keep multiple shots of one stock unique,
// e.g. "..._27EXP-1.jpg") is ignored when building the caption. Each image is one
// slide; drop more files in and they become slides, no code change needed.
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function getHeroSlides(): HeroSlide[] {
  const filmDir = path.join(process.cwd(), "public", "FILM");
  let files: string[];
  try {
    files = fs.readdirSync(filmDir).sort();
  } catch {
    return [];
  }

  const slides: HeroSlide[] = [];
  for (const file of files) {
    if (file.startsWith(".") || !IMAGE_RE.test(file)) continue;

    // Filename → caption. Strip the extension and any trailing "-N" disambiguator,
    // then split "Stock_Process_Frames" into top line + " • "-joined rest.
    const base = file.replace(IMAGE_RE, "").replace(/-\d+$/, "");
    const [stock = base, ...rest] = base
      .split("_")
      .map((part) => part.trim())
      .filter(Boolean);

    slides.push({
      src: `/FILM/${encodeURIComponent(file)}`,
      meta: [stock, rest.join(" • ")],
    });
  }

  return slides;
}

export default function FilmPage() {
  const heroSlides = getHeroSlides();

  return (
    <>
      <Nav activeHref="/film" />

      <main className={styles.page}>
        <FilmHero slides={heroSlides} />

        <FilmStocksGrid />

        <FilmJourney />
      </main>
    </>
  );
}
