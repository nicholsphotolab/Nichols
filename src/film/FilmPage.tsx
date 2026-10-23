import Nav from "@/components/layout/Nav";
import FilmHero, { type HeroSlide } from "./FilmHero";
import ProductGrid from "@/components/page/ProductGrid";
import ProcessSteps from "@/components/page/ProcessSteps";
import { FILM_CARDS, FILM_STEPS } from "./filmPageContent";
import heroSlidesData from "@/data/generated/filmHeroSlides.json";
import page from "@/components/page/Page.module.css";

// Hero slides are generated at build/dev-server start by
// scripts/generateStaticData.ts from the image files under public/FILM/ and
// public/FILM/mobile/ — see that script for the filename → caption
// convention. This replaces the fs.readdirSync scan that used to run at
// request time in Next's server component. JSON imports lose the [string,
// string] tuple type on `meta`, so it's asserted back here — the generator
// always writes exactly two elements.
const heroSlides = heroSlidesData as { desktop: HeroSlide[]; mobile: HeroSlide[] };

export default function FilmPage() {
  return (
    <>
      <Nav activeHref="/film" />

      <main id="main" tabIndex={-1} className={page.page}>
        <FilmHero slides={heroSlides.desktop} mobileSlides={heroSlides.mobile} />

        <ProductGrid
          heading="Film Development & Scans"
          label="Film development & scans"
          itemsLabel="film stocks"
          cards={FILM_CARDS}
        />

        <ProcessSteps
          steps={FILM_STEPS}
          intro={
            <>
              We develop and scan everything in-house — nothing is sent out to a
              third party. Every roll is inspected by hand, by people who&apos;ve
              spent years doing exactly this.
            </>
          }
        />
      </main>
    </>
  );
}
