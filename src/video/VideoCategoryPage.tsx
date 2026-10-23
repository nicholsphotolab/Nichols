// VideoCategoryPage.tsx
// Route for the video-transfer estimator pages: /video/tapes-discs, /video/reels.
// Prerendered at build time for every slug in CATEGORIES (see scripts/build.mjs).
// The VideoTransferConfigurator handles all interactive pricing client-side.

import { useParams } from "react-router-dom";
import Nav from "@/components/layout/Nav";
import NotFoundPage from "@/NotFoundPage";
import VideoTransferConfigurator from "./VideoTransferConfigurator";
import { CATEGORIES_BY_SLUG } from "./videoTransferData";

export default function VideoCategoryPage() {
  const { category = "" } = useParams();
  const data = CATEGORIES_BY_SLUG[category];

  // Any slug not defined in videoTransferData.ts is a 404.
  if (!data) return <NotFoundPage />;

  return (
    <>
      {/* Solid white bar from the top — this page has no dark hero photo for the
          transparent scrim to sit over (matches the film calculator). */}
      <Nav activeHref="/video" solid />
      <VideoTransferConfigurator slug={data.slug} />
    </>
  );
}
