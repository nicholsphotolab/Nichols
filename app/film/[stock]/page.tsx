// app/film/[stock]/page.tsx
// Dynamic route for individual film stock detail pages.
// URL pattern: /film/c-41, /film/bw, /film/e-6
// generateStaticParams pre-renders all known stocks at build time.
// The FilmStockConfigurator handles all interactive pricing logic client-side.

import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import FilmStockConfigurator from "../FilmStockConfigurator";
import { STOCKS } from "../filmStocksData";

// Tell Next.js which slugs to statically generate at build time.
export function generateStaticParams() {
  return Object.keys(STOCKS).map((stock) => ({ stock }));
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

  return (
    <>
      <Nav activeHref="/film" />
      <FilmStockConfigurator initialSlug={stock} />
    </>
  );
}
