// app/video/[category]/page.tsx
// Dynamic route for the video-transfer estimator pages.
// URL pattern: /video/tapes-discs, /video/reels
// generateStaticParams pre-renders both categories at build time.
// The VideoTransferConfigurator handles all interactive pricing client-side.

import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import VideoTransferConfigurator from "../VideoTransferConfigurator";
import { CATEGORIES, CATEGORIES_BY_SLUG } from "../videoTransferData";

// Tell Next.js which slugs to statically generate at build time.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function VideoCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = CATEGORIES_BY_SLUG[category];

  // Return 404 for any slug not defined in videoTransferData.ts.
  if (!data) notFound();

  return (
    <>
      <Nav activeHref="/video" />
      <VideoTransferConfigurator category={data} />
    </>
  );
}
