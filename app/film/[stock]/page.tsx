import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import PriceConfigurator from "../PriceConfigurator";
import { STOCKS } from "../stocks";

// Pre-render one page per known stock (/film/c-41, /film/bw, /film/e-6).
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
  if (!data) notFound();

  return (
    <>
      <Nav activeHref="/film" />
      <PriceConfigurator stock={data} />
    </>
  );
}
