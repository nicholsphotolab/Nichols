// FilmStockPage.tsx
// Route for individual film stock detail pages: /film/c-41, /film/bw, /film/e-6.
// Prerendered at build time for every slug in STOCKS (see scripts/build.mjs).
// The FilmStockConfigurator handles all interactive pricing logic client-side.
//
// Gallery images (public/FILM/gallery/<slug>/...) are scanned once at
// dev-server start / build start by scripts/generateStaticData.ts — see that
// script for the folder-naming conventions — and consumed here as generated
// JSON, since a browser (and the prerendered route) has no filesystem access.

import { useParams } from "react-router-dom";
import Nav from "@/components/layout/Nav";
import NotFoundPage from "@/NotFoundPage";
import FilmStockConfigurator from "./FilmStockConfigurator";
import { STOCKS } from "./filmStocksData";
import filmGalleries from "@/data/generated/filmGalleries.json";

export default function FilmStockPage() {
  const { stock = "" } = useParams();
  const data = STOCKS[stock];

  // Any slug not defined in filmStocksData.ts is a 404.
  if (!data) return <NotFoundPage />;

  return (
    <>
      {/* Solid white bar from the top — this page has no dark hero photo
          for the transparent scrim to sit over. */}
      <Nav activeHref="/film" solid />
      <FilmStockConfigurator slug={stock} galleries={filmGalleries} />
    </>
  );
}
